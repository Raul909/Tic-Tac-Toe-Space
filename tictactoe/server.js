const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { validateRegistration } = require('./utils');
const { handleAuthUser } = require('./auth-utils');
const { setupSocket } = require('./socket');
const redisClient = require('./redis');
const queue = require('./queue');

// Load environment variables in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const cors = require('cors');
const app = express();
app.set('trust proxy', 1);

// Helper to validate allowed cross-origins (handles localhost, preview subdomains, and main site)
const isOriginAllowed = (origin) => {
  if (!origin) return true;

  // 1. Allow all localhost development origins
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  // 2. Allow any Cloudflare Pages deployment/preview subdomains (*.pages.dev)
  try {
    const hostname = new URL(origin).hostname;
    if (hostname === 'pages.dev' || hostname.endsWith('.pages.dev')) {
      return true;
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  // 3. Allow origins explicitly specified in ALLOWED_ORIGINS env variable (comma-separated, trimmed)
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB Connection (with read preference for replica-set / sharded cluster)
const MONGODB_URI = process.env.MONGODB_URI;
if (require.main === module) {
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
      readPreference: 'secondaryPreferred', // read from secondaries to spread load
    })
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Falling back to file-based storage');
      });
  } else {
    console.log('⚠️  No MONGODB_URI found, using file-based storage');
  }

  // Redis + queue startup (non-blocking)
  redisClient.connect().catch(() => {});
  queue.connect(async (msg) => {
    if (msg.type !== 'stat') return;
    const { key, wins, losses, draws } = msg;
    if (useDB()) {
      await User.updateOne({ username: key }, { $set: { wins, losses, draws } });
    } else {
      if (users[key]) { users[key].wins = wins; users[key].losses = losses; users[key].draws = draws; }
      saveUsers();
    }
    await redisClient.invalidateLeaderboard();
  }).catch(() => {});
}

// User Schema for MongoDB (username is the shard key for horizontal scaling)
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: { type: String, required: true },
  hash: { type: String, required: true },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
UserSchema.index({ wins: -1 });
// Compound index for sharded leaderboard queries
UserSchema.index({ wins: -1, username: 1 });

const User = mongoose.model('User', UserSchema);

// Helper to check if MongoDB is connected
const useDB = () => mongoose.connection.readyState === 1;

app.use(express.json());
app.use(cookieParser());
// Config endpoint for env vars
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    window.FACEBOOK_APP_ID = '${process.env.FACEBOOK_APP_ID || ''}';
    window.GOOGLE_CLIENT_ID = '${process.env.GOOGLE_CLIENT_ID || ''}';
  `);
});

app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Too many attempts, try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30
});

// ── DATA PERSISTENCE ──────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');


let users = {};
let cachedLeaderboard = null;
let lastLeaderboardUpdate = 0;
const LEADERBOARD_CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Optimized in-memory leaderboard generation (O(N) time, O(1) extra space)
 */
function getInMemoryLeaderboard(userMap) {
  const board = [];
  for (const key in userMap) {
    const u = userMap[key];
    const wins = u.wins || 0;
    // Only consider if it could be in top 10
    if (board.length < 10 || wins > (board[board.length - 1]?.wins || -1)) {
      board.push({ name: u.displayName, wins, losses: u.losses || 0, draws: u.draws || 0 });
      board.sort((a, b) => b.wins - a.wins);
      if (board.length > 10) board.pop();
    }
  }
  return board;
}

/**
 * Updates the cached leaderboard in real-time when a user's stats change
 */
function syncLeaderboard(user) {
  if (!cachedLeaderboard) return;
  const wins = user.wins || 0;
  const index = cachedLeaderboard.findIndex(u => u.name === user.displayName);

  if (index !== -1) {
    // Update existing entry
    cachedLeaderboard[index].wins = wins;
    cachedLeaderboard[index].losses = user.losses || 0;
    cachedLeaderboard[index].draws = user.draws || 0;
    cachedLeaderboard.sort((a, b) => b.wins - a.wins);
  } else if (cachedLeaderboard.length < 10 || wins > (cachedLeaderboard[cachedLeaderboard.length - 1]?.wins || -1)) {
    // Add new entry if it qualifies
    cachedLeaderboard.push({ name: user.displayName, wins, losses: user.losses || 0, draws: user.draws || 0 });
    cachedLeaderboard.sort((a, b) => b.wins - a.wins);
    if (cachedLeaderboard.length > 10) cachedLeaderboard.pop();
  }
}

try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
} catch (e) { users = {}; }

let saveTimer;
function saveUsers() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify(users), 'utf8');
    } catch (e) { console.error('saveUsers error:', e.message); }
  }, 1000);
}

// ── IN-MEMORY SESSIONS & ROOMS ────────────────────────────────────────
const sessions = new Map(); // token -> userKey (in-memory fallback)
const socketUser = new Map(); // socketId -> userKey
const userSocket = new Map(); // userKey -> socketId
const rooms = new Map();
const socketRoom = new Map(); // socketId -> roomCode
const userRoom = new Map(); // userKey -> roomCode (NEW: support reconnection)
const disconnectTimeouts = new Map(); // userKey -> timeoutId (NEW: grace period)
const tournaments = new Map();

// Session helpers — Redis-first, in-memory fallback
async function sessionSet(token, key) {
  sessions.set(token, key);
  await redisClient.setSession(token, key).catch(() => {});
}
async function sessionGet(token) {
  const cached = await redisClient.getSession(token).catch(() => null);
  if (cached) return cached;
  return sessions.get(token) || null;
}
async function sessionDel(token) {
  sessions.delete(token);
  await redisClient.delSession(token).catch(() => {});
}

// ── REST ENDPOINTS ────────────────────────────────────────────────────
app.post('/api/register', authLimiter, async (req, res) => {
  const { username, password, isGuest } = req.body || {};
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ ok: false, error: 'Invalid input: username and password must be strings' });
  }

  // Guest accounts have relaxed validation
  if (isGuest) {
    if (!username || !username.startsWith('Guest_')) {
      return res.status(400).json({ ok: false, error: 'Invalid guest username' });
    }
    const key = username.toLowerCase();
    
    // Check if guest ID already exists
    if (users[key]) {
      return res.status(400).json({ ok: false, error: 'Guest ID already exists' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    users[key] = { 
      displayName: username, 
      hash, 
      wins: 0, 
      losses: 0, 
      draws: 0, 
      createdAt: Date.now(),
      isGuest: true 
    };
    saveUsers();
    
    const token = uuidv4();
    await sessionSet(token, key);

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      ok: true,
      token,
      username: username,
      stats: { wins: 0, losses: 0, draws: 0 }
    });
  }
  
  // Regular account validation
  const validation = validateRegistration(username, password);
  if (!validation.ok) return res.status(400).json({ ok: false, error: validation.error });
  const key = validation.key;

  const hash = await bcrypt.hash(password, 10);

  if (useDB()) {
    // ── MongoDB path ──
    try {
      let dbUser = await User.findOne({ username: key });
      if (dbUser) {
        return res.status(400).json({ ok: false, error: 'Username already taken' });
      }

      dbUser = await User.create({
        username: key,
        displayName: username.trim(),
        hash,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date()
      });

      // Mirror into memory so socket auth works without a DB round-trip
      users[key] = { displayName: dbUser.displayName, hash, wins: 0, losses: 0, draws: 0, createdAt: dbUser.createdAt };

      const token = uuidv4();
      await sessionSet(token, key);

      res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        ok: true,
        token,
        username: dbUser.displayName,
        stats: { wins: 0, losses: 0, draws: 0 }
      });
    } catch (err) {
      console.error('Register DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  if (users[key]) {
    return res.status(400).json({ ok: false, error: 'Username already taken' });
  }

  users[key] = { displayName: username.trim(), hash, wins: 0, losses: 0, draws: 0, createdAt: Date.now() };
  saveUsers();

  const token = uuidv4();
  await sessionSet(token, key);

  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { displayName, wins, losses, draws } = users[key];
  res.json({
    ok: true,
    token,
    username: displayName,
    stats: { wins, losses, draws }
  });
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ ok: false, error: 'Invalid input: username and password must be strings' });
  }

  const key = username.trim().toLowerCase();

  if (useDB()) {
    // ── MongoDB path ──
    try {
      const dbUser = await User.findOne({ username: key });
      if (dbUser) {
        const match = await bcrypt.compare(password, dbUser.hash);
        if (match) {
          // Mirror into memory for socket auth
          users[key] = { displayName: dbUser.displayName, hash: dbUser.hash, wins: dbUser.wins, losses: dbUser.losses, draws: dbUser.draws, createdAt: dbUser.createdAt };

          const token = uuidv4();
          await sessionSet(token, key);

          res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });

          return res.json({
            ok: true,
            token,
            username: dbUser.displayName,
            stats: { wins: dbUser.wins, losses: dbUser.losses, draws: dbUser.draws }
          });
        } else {
          return res.status(401).json({ ok: false, error: 'Invalid credentials' });
        }
      }
    } catch (err) {
      console.error('Login DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  const user = users[key];
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.hash);
  if (!match) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const token = uuidv4();
  await sessionSet(token, key);

  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { displayName, wins, losses, draws } = user;
  res.json({
    ok: true,
    token,
    username: displayName,
    stats: { wins, losses, draws }
  });
});

app.post('/api/logout', async (req, res) => {
  const token = req.cookies.session;
  if (token) await sessionDel(token);
  res.clearCookie('session');
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  try {
    // Verify Google token
    const https = require('https');
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    
    https.get(tokenInfoUrl, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', async () => {
        try {
          const googleUser = JSON.parse(data);
          
          if (googleUser.error) {
            return res.status(401).json({ ok: false, error: 'Invalid Google token' });
          }
          
          // Extract user info
          const email = googleUser.email;
          const name = googleUser.name || email.split('@')[0];
          const googleId = googleUser.sub;
          const key = `google_${googleId}`;
          
          await handleAuthUser({
            res,
            userData: { displayName: name, email, providerId: googleId, key, providerName: "google" },
            userStore: { User, users, saveUsers, useDB },
            sessionStore: { sessions, sessionSet, uuidv4 }
          });
        } catch (e) {
          console.error('Google auth processing error:', e);
          if (!res.headersSent) {
            res.status(500).json({ ok: false, error: 'Failed to process Google authentication' });
          }
        }
      });
    }).on('error', (e) => {
      console.error('Google token verification error:', e);
      if (!res.headersSent) {
        res.status(502).json({ ok: false, error: 'Google authentication service unreachable' });
      }
    });
  } catch (e) {
    console.error('Google OAuth error:', e);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Google OAuth initialization failed' });
    }
  }
});

// Facebook OAuth Login
app.post('/api/auth/facebook', async (req, res) => {
  const { accessToken, userID } = req.body;
  if (!accessToken || !userID) {
    return res.status(400).json({ ok: false, error: 'Missing accessToken or userID' });
  }

  try {
    // Verify Facebook token and get user info
    const https = require('https');
    const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`;
    
    https.get(userInfoUrl, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', async () => {
        try {
          const fbUser = JSON.parse(data);
          
          if (fbUser.error) {
            return res.status(401).json({ ok: false, error: 'Invalid Facebook token' });
          }
          
          // Extract user info
          const fbId = fbUser.id;
          const name = fbUser.name;
          const email = fbUser.email || `fb_${fbId}@facebook.com`;
          const key = `facebook_${fbId}`;
          
          await handleAuthUser({
            res,
            userData: { displayName: name, email, providerId: fbId, key, providerName: "facebook" },
            userStore: { User, users, saveUsers, useDB },
            sessionStore: { sessions, sessionSet, uuidv4 }
          });
        } catch (e) {
          console.error('Facebook auth processing error:', e);
          if (!res.headersSent) {
            res.status(500).json({ ok: false, error: 'Failed to process Facebook authentication' });
          }
        }
      });
    }).on('error', (e) => {
      console.error('Facebook token verification error:', e);
      if (!res.headersSent) {
        res.status(502).json({ ok: false, error: 'Facebook authentication service unreachable' });
      }
    });
  } catch (e) {
    console.error('Facebook OAuth error:', e);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Facebook OAuth initialization failed' });
    }
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', apiLimiter, async (req, res) => {
  // Try Redis cache first
  const cached = await redisClient.getCachedLeaderboard().catch(() => null);
  if (cached) return res.json(cached);

  // In-memory TTL fallback
  const now = Date.now();
  if (cachedLeaderboard && (now - lastLeaderboardUpdate < LEADERBOARD_CACHE_TTL)) {
    return res.json(cachedLeaderboard);
  }

  let board;
  if (useDB()) {
    try {
      const topUsers = await User.find({}, 'displayName wins losses draws').sort({ wins: -1 }).limit(10).lean();
      board = topUsers.map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }));
    } catch (err) {
      console.error('Leaderboard DB error:', err);
      board = getInMemoryLeaderboard(users);
    }
  } else {
    board = getInMemoryLeaderboard(users);
  }

  cachedLeaderboard = board;
  lastLeaderboardUpdate = now;
  await redisClient.setCachedLeaderboard(board).catch(() => {});
  res.json(board);
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────

// Create a context object with all the shared state
const context = {
  users,
  sessions,
  sessionGet,
  socketUser,
  userSocket,
  rooms,
  socketRoom,
  userRoom,
  disconnectTimeouts,
  tournaments,
  saveUsers,
  syncLeaderboard,
  queue,
  // io will be added in setupSocket
};

setupSocket(io, context);

// Clean up active timers/handles on server shutdown (prevents hanging tests and leaks)
server.on('close', () => {
  clearTimeout(saveTimer);
  for (const timeoutId of disconnectTimeouts.values()) {
    clearTimeout(timeoutId);
  }
  disconnectTimeouts.clear();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: useDB() ? 'connected' : 'disconnected (file-fallback)',
    redis: redisClient.isReady() ? 'connected' : 'disconnected',
    rabbitmq: queue.isConnected() ? 'connected' : 'disconnected (in-process fallback)'
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TicTacToe server running on port ${PORT}`);
  });
}

module.exports = { app, server };
