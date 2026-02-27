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

// Load environment variables
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  }

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (require.main === module) {
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Falling back to file-based storage');
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

app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Too many attempts, try again later' }

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30

// ── DATA PERSISTENCE ──────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');


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
  }, 1000);
}

// ── IN-MEMORY SESSIONS & ROOMS ────────────────────────────────────────
const sessions = new Map(); // token -> userKey
const socketUser = new Map(); // socketId -> userKey
const userSocket = new Map(); // userKey -> socketId
const rooms = new Map();
const socketRoom = new Map(); // socketId -> roomCode
const userRoom = new Map(); // userKey -> roomCode (NEW: support reconnection)
const disconnectTimeouts = new Map(); // userKey -> timeoutId (NEW: grace period)
const tournaments = new Map();

// ── REST ENDPOINTS ────────────────────────────────────────────────────
app.post('/api/register', authLimiter, async (req, res) => {
  const { username, password, isGuest } = req.body || {};
  
  // Guest accounts have relaxed validation
  if (isGuest) {
    if (!username || !username.startsWith('Guest_')) {
    }
    const key = username.toLowerCase();
    
    // Check if guest ID already exists
    if (users[key]) {
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
    sessions.set(token, key);
  }
  
  // Regular account validation
  const validation = validateRegistration(username, password);
  const key = validation.key;

  const hash = await bcrypt.hash(password, 10);

  if (useDB()) {
    // ── MongoDB path ──
    try {
      // Mirror into memory so socket auth works without a DB round-trip
      users[key] = { displayName: dbUser.displayName, hash, wins: 0, losses: 0, draws: 0, createdAt: Date.now() };
      const token = uuidv4();
      sessions.set(token, key);
    } catch (err) {
      console.error('Register DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  users[key] = { displayName: username.trim(), hash, wins: 0, losses: 0, draws: 0, createdAt: Date.now() };
  saveUsers();

  const token = uuidv4();
  sessions.set(token, key);
  const { wins, losses, draws } = users[key];

app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  const key = username.trim().toLowerCase();

  if (useDB()) {
    // ── MongoDB path ──
    try {
      const match = await bcrypt.compare(password, dbUser.hash);
      // Mirror into memory for socket auth
      users[key] = { displayName: dbUser.displayName, hash: dbUser.hash, wins: dbUser.wins, losses: dbUser.losses, draws: dbUser.draws, createdAt: dbUser.createdAt };
      const token = uuidv4();
      sessions.set(token, key);
    } catch (err) {
      console.error('Login DB error:', err.message);
      // fall through to file-based
    }
  }

  // ── File-based fallback ──
  const user = users[key];
  const match = await bcrypt.compare(password, user.hash);

  const token = uuidv4();
  sessions.set(token, key);
  const { wins, losses, draws } = user;

app.post('/api/logout', (req, res) => {
  const token = req.cookies.session;
  if (token) sessions.delete(token);
  res.clearCookie('session');

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
            sessionStore: { sessions, uuidv4 }
        } catch (e) {
          console.error('Google auth error:', e);
        }
    }).on('error', (e) => {
      console.error('Google token verification error:', e);
  } catch (e) {
    console.error('Google OAuth error:', e);
  }

// Facebook OAuth Login
app.post('/api/auth/facebook', async (req, res) => {
  const { accessToken, userID } = req.body;
  if (!accessToken || !userID) {
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
            sessionStore: { sessions, uuidv4 }
        } catch (e) {
          console.error('Facebook auth error:', e);
        }
    }).on('error', (e) => {
      console.error('Facebook token verification error:', e);
  } catch (e) {
    console.error('Facebook OAuth error:', e);
  }

// Leaderboard endpoint
app.get('/api/leaderboard', apiLimiter, async (req, res) => {
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
      // Fallback
      board = Object.values(users)
        .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10);
    }
  } else {
    // In-memory fallback
    board = Object.values(users)
      .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
  }

  cachedLeaderboard = board;
  lastLeaderboardUpdate = now;
  res.json(board);

// ── SOCKET.IO ─────────────────────────────────────────────────────────

// Create a context object with all the shared state
const context = {
  users,
  sessions,
  socketUser,
  userSocket,
  rooms,
  socketRoom,
  userRoom,
  disconnectTimeouts,
  tournaments,
  saveUsers,
  // io will be added in setupSocket
};

setupSocket(io, context);

// ── HEALTH CHECK ──────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TicTacToe server running on port ${PORT}`);
}

module.exports = { app, server };
