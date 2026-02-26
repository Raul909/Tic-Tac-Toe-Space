const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const rateLimiter = require('./rateLimiter');
const mongoose = require('mongoose');
const { checkWinner, generateRoomCode, validateRegistration } = require('./utils');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (require.main === module) {
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Falling back to file-based storage');
      });
  } else {
    console.log('⚠️  No MONGODB_URI found, using file-based storage');
  }
}

// User Schema for MongoDB
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

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let users = {};
let cachedLeaderboard = null;
let lastLeaderboardUpdate = 0;
const LEADERBOARD_CACHE_TTL = 60 * 1000; // 60 seconds

try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
} catch (e) { users = {}; }

let saveTimer;
function saveUsers() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => { if (err) console.error("Error saving users:", err); });
  }, 1000);
}

// ── IN-MEMORY SESSIONS & ROOMS ────────────────────────────────────────
const sessions = new Map(); // token -> userKey
const socketUser = new Map(); // socketId -> userKey
const userSocket = new Map(); // userKey -> socketId
const rooms = new Map();
const socketRoom = new Map(); // roomCode -> roomObj

function leaveCurrentRoom(socket) {
  const code = socketRoom.get(socket.id);
  if (!code) return;

  const room = rooms.get(code);
  if (room) {
    const idx = room.players.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      socket.leave(code);
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        room.status = 'waiting';
        delete room.rematchVotes;
        socket.to(code).emit('game:opponent-left');
      }
    }
  }
  socketRoom.delete(socket.id);
}

function getRoomForSocket(socketId) {
  const code = socketRoom.get(socketId);
  if (!code) return null;
  const room = rooms.get(code);
  if (!room) return null;
  return { code, room };
}

// ── REST ENDPOINTS ────────────────────────────────────────────────────
app.post('/api/register', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const validation = validateRegistration(username, password);
  if (!validation.ok) return res.json({ ok: false, error: validation.error });
  const key = validation.key;

  const hash = await bcrypt.hash(password, 10);

  if (useDB()) {
    // ── MongoDB path ──
    try {
      const existing = await User.findOne({ username: key });
      if (existing) return res.json({ ok: false, error: 'Username already taken' });
      const dbUser = await User.create({ username: key, displayName: username.trim(), hash });
      // Mirror into memory so socket auth works without a DB round-trip
      users[key] = { displayName: dbUser.displayName, hash, wins: 0, losses: 0, draws: 0, createdAt: Date.now() };
      const token = uuidv4();
      sessions.set(token, key);
      res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ ok: true, token, username: dbUser.displayName, stats: { wins: 0, losses: 0, draws: 0 } });
    } catch (err) {
      if (err.code === 11000) return res.json({ ok: false, error: 'Username already taken' });
      console.error('Register DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  if (users[key]) return res.json({ ok: false, error: 'Username already taken' });
  users[key] = { displayName: username.trim(), hash, wins: 0, losses: 0, draws: 0, createdAt: Date.now() };
  saveUsers();

  const token = uuidv4();
  sessions.set(token, key);
  res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const { wins, losses, draws } = users[key];
  res.json({ ok: true, token, username: users[key].displayName, stats: { wins, losses, draws } });
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.json({ ok: false, error: 'Missing fields' });

  const key = username.trim().toLowerCase();

  if (useDB()) {
    // ── MongoDB path ──
    try {
      const dbUser = await User.findOne({ username: key });
      if (!dbUser) return res.json({ ok: false, error: 'User not found' });
      const match = await bcrypt.compare(password, dbUser.hash);
      if (!match) return res.json({ ok: false, error: 'Incorrect password' });
      // Mirror into memory for socket auth
      users[key] = { displayName: dbUser.displayName, hash: dbUser.hash, wins: dbUser.wins, losses: dbUser.losses, draws: dbUser.draws, createdAt: dbUser.createdAt };
      const token = uuidv4();
      sessions.set(token, key);
      res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ ok: true, token, username: dbUser.displayName, stats: { wins: dbUser.wins, losses: dbUser.losses, draws: dbUser.draws } });
    } catch (err) {
      console.error('Login DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  const user = users[key];
  if (!user) return res.json({ ok: false, error: 'User not found' });
  const match = await bcrypt.compare(password, user.hash);
  if (!match) return res.json({ ok: false, error: 'Incorrect password' });

  const token = uuidv4();
  sessions.set(token, key);
  res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const { wins, losses, draws } = user;
  res.json({ ok: true, token, username: user.displayName, stats: { wins, losses, draws } });
});

app.post('/api/logout', (req, res) => {
  const token = req.cookies.session;
  if (token) sessions.delete(token);
  res.clearCookie('session');
  res.json({ ok: true });
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.json({ ok: false, error: 'No credential provided' });

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
            return res.json({ ok: false, error: 'Invalid Google token' });
          }
          
          // Extract user info
          const email = googleUser.email;
          const name = googleUser.name || email.split('@')[0];
          const googleId = googleUser.sub;
          const key = `google_${googleId}`;
          
          // Check if user exists
          let user;
          if (useDB()) {
            user = await User.findOne({ username: key });
            if (!user) {
              // Create new user
              user = await User.create({
                username: key,
                displayName: name,
                hash: '', // No password for Google users
                email: email,
                googleId: googleId,
                wins: 0,
                losses: 0,
                draws: 0
              });
            }
            // Update memory cache
            users[key] = {
              displayName: user.displayName,
              hash: '',
              wins: user.wins || 0,
              losses: user.losses || 0,
              draws: user.draws || 0,
              email: email,
              googleId: googleId
            };
          } else {
            // File-based
            if (!users[key]) {
              users[key] = {
                displayName: name,
                hash: '',
                wins: 0,
                losses: 0,
                draws: 0,
                email: email,
                googleId: googleId,
                createdAt: Date.now()
              };
              saveUsers();
            }
            user = users[key];
          }
          
          // Create session
          const token = uuidv4();
          sessions.set(token, key);
          res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          
          res.json({
            ok: true,
            token,
            username: user.displayName || name,
            stats: {
              wins: user.wins || 0,
              losses: user.losses || 0,
              draws: user.draws || 0
            }
          });
        } catch (e) {
          console.error('Google auth error:', e);
          res.json({ ok: false, error: 'Authentication failed' });
        }
      });
    }).on('error', (e) => {
      console.error('Google token verification error:', e);
      res.json({ ok: false, error: 'Token verification failed' });
    });
  } catch (e) {
    console.error('Google OAuth error:', e);
    res.json({ ok: false, error: 'Authentication error' });
  }
});

// Facebook OAuth Login
app.post('/api/auth/facebook', async (req, res) => {
  const { accessToken, userID } = req.body;
  if (!accessToken || !userID) {
    return res.json({ ok: false, error: 'No access token provided' });
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
            return res.json({ ok: false, error: 'Invalid Facebook token' });
          }
          
          // Extract user info
          const fbId = fbUser.id;
          const name = fbUser.name;
          const email = fbUser.email || `fb_${fbId}@facebook.com`;
          const key = `facebook_${fbId}`;
          
          // Check if user exists
          let user;
          if (useDB()) {
            user = await User.findOne({ username: key });
            if (!user) {
              user = await User.create({
                username: key,
                displayName: name,
                hash: '',
                email: email,
                facebookId: fbId,
                wins: 0,
                losses: 0,
                draws: 0
              });
            }
            users[key] = {
              displayName: user.displayName,
              hash: '',
              wins: user.wins || 0,
              losses: user.losses || 0,
              draws: user.draws || 0,
              email: email,
              facebookId: fbId
            };
          } else {
            if (!users[key]) {
              users[key] = {
                displayName: name,
                hash: '',
                wins: 0,
                losses: 0,
                draws: 0,
                email: email,
                facebookId: fbId,
                createdAt: Date.now()
              };
              saveUsers();
            }
            user = users[key];
          }
          
          // Create session
          const token = uuidv4();
          sessions.set(token, key);
          res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          
          res.json({
            ok: true,
            token,
            username: user.displayName || name,
            stats: {
              wins: user.wins || 0,
              losses: user.losses || 0,
              draws: user.draws || 0
            }
          });
        } catch (e) {
          console.error('Facebook auth error:', e);
          res.json({ ok: false, error: 'Authentication failed' });
        }
      });
    }).on('error', (e) => {
      console.error('Facebook token verification error:', e);
      res.json({ ok: false, error: 'Token verification failed' });
    });
  } catch (e) {
    console.error('Facebook OAuth error:', e);
    res.json({ ok: false, error: 'Authentication error' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', apiLimiter, (req, res) => {
  const now = Date.now();
  if (cachedLeaderboard && (now - lastLeaderboardUpdate < LEADERBOARD_CACHE_TTL)) {
    return res.json(cachedLeaderboard);
  }

  const board = Object.values(users)
    .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  cachedLeaderboard = board;
  lastLeaderboardUpdate = now;
  res.json(board);
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // ── RATE LIMITER ──
  socket.use((packet, next) => {
    const eventName = packet[0];
    // Check if rateLimiter allows the event
    if (!rateLimiter.check(socket.id, eventName)) {
      if (eventName === 'disconnect') return next();
      socket.emit('error', 'Rate limit exceeded. Please slow down.');
      return;
    }
    next();
  });

  // ── AUTH ──
  socket.on('auth', ({ token }) => {
    const key = sessions.get(token);
    if (!key || !users[key]) {
      socket.emit('auth:error', 'Session expired, please log in again');
      return;
    }
    socketUser.set(socket.id, key);
    userSocket.set(key, socket.id);
    const { wins, losses, draws, displayName } = users[key];
    socket.emit('auth:ok', { username: displayName, stats: { wins, losses, draws } });
  });

  // Helper to sanitize text
  const sanitize = (text) => {
    if (!text) return '';
    return text.trim()
      .replace(/[<>]/g, '')
      .slice(0, 120);
  };

  // ── CREATE ROOM ──
  socket.on('room:create', () => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');
    leaveCurrentRoom(socket);

    const code = generateRoomCode(rooms);
    const room = {
      code,
      players: [{ socketId: socket.id, key, name: users[key].displayName, symbol: 'X' }],
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'waiting',
      scores: { X: 0, O: 0, D: 0 }
    };
    rooms.set(code, room);
    socketRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('room:created', { code, symbol: 'X' });
  });

  // ── JOIN ROOM ──
  socket.on('room:join', ({ code }) => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');

    const upperCode = code?.toUpperCase().trim();
    const room = rooms.get(upperCode);
    if (!room) return socket.emit('room:error', 'Room not found');
    if (room.status === 'playing') return socket.emit('room:error', 'Game in progress');
    if (room.players.length >= 2) return socket.emit('room:error', 'Room is full');
    if (room.players[0].socketId === socket.id) return socket.emit('room:error', 'You created this room');

    leaveCurrentRoom(socket);

    room.players.push({ socketId: socket.id, key, name: users[key].displayName, symbol: 'O' });
    room.status = 'playing';
    socketRoom.set(socket.id, upperCode);
    socket.join(upperCode);
    socket.emit('room:joined', { code: upperCode, symbol: 'O' });

    const startData = {
      board: room.board,
      currentTurn: room.currentTurn,
      players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
      scores: room.scores
    };
    io.to(upperCode).emit('game:start', startData);
  });

  // ── MAKE MOVE ──
  socket.on('game:move', ({ code, index }) => {
    const key = socketUser.get(socket.id);
    if (!key) return;
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return socket.emit('game:error', 'Not in this room');
    if (player.symbol !== room.currentTurn) return socket.emit('game:error', 'Not your turn');
    if (room.board[index] !== null) return socket.emit('game:error', 'Cell taken');
    if (index < 0 || index > 8) return;

    room.board[index] = player.symbol;
    io.to(code).emit('game:move', { index, symbol: player.symbol });

    const result = checkWinner(room.board);
    if (result) {
      room.status = 'done';
      if (result.winner) {
        room.scores[result.winner]++;
        const winPlayer = room.players.find(p => p.symbol === result.winner);
        const losePlayer = room.players.find(p => p.symbol !== result.winner);
        if (winPlayer && users[winPlayer.key]) { users[winPlayer.key].wins++; saveUsers(); }
        if (losePlayer && users[losePlayer.key]) { users[losePlayer.key].losses++; saveUsers(); }
        io.to(code).emit('game:over', { winner: result.winner, line: result.line, scores: room.scores });
      } else {
        room.scores.D++;
        room.players.forEach(p => { if (users[p.key]) users[p.key].draws++; });
        saveUsers();
        io.to(code).emit('game:over', { winner: null, draw: true, scores: room.scores });
      }
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      io.to(code).emit('game:turn', { currentTurn: room.currentTurn });
    }
  });

  // ── REMATCH ──
  socket.on('game:rematch', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.players.length < 2) return;
    if (!room.rematchVotes) room.rematchVotes = new Set();
    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size >= 2) {
      // Swap symbols for fairness
      room.players.forEach(p => { p.symbol = p.symbol === 'X' ? 'O' : 'X'; });
      room.board = Array(9).fill(null);
      room.currentTurn = 'X';
      room.status = 'playing';
      delete room.rematchVotes;
      io.to(code).emit('game:start', {
        board: room.board,
        currentTurn: room.currentTurn,
        players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
        scores: room.scores
      });
    } else {
      const name = users[socketUser.get(socket.id)]?.displayName || 'Opponent';
      socket.to(code).emit('game:rematch-request', { from: name });
    }
  });

  // ── CHAT ──
  socket.on('chat:msg', ({ code, text }) => {
    const key = socketUser.get(socket.id);
    if (!key || !text?.trim()) return;
    const clean = sanitize(text);
    if (!clean) return;
    io.to(code).emit('chat:msg', {
      from: users[key].displayName,
      text: clean,
      ts: Date.now()
    });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    rateLimiter.cleanup(socket.id);
    const key = socketUser.get(socket.id);
    if (key) {
      userSocket.delete(key);
      socketUser.delete(socket.id);

      const code = socketRoom.get(socket.id);
      if (code) {
        const room = rooms.get(code);
        if (room) {
          socket.to(code).emit('game:opponent-left');
          // Remove all players from socketRoom since room is deleted
          for (const p of room.players) {
            socketRoom.delete(p.socketId);
          }
          rooms.delete(code);
        } else {
          socketRoom.delete(socket.id);
        }
      }
    }
  });
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TicTacToe server running on port ${PORT}`);
  });
}

module.exports = { app, server };
