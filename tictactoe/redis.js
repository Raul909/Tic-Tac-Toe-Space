/**
 * Redis client — sessions, leaderboard cache, pub/sub.
 * Falls back gracefully when REDIS_URL is not set.
 */
let redis = null;
let pub = null;
let sub = null;

const LEADERBOARD_KEY = 'leaderboard';
const LEADERBOARD_TTL = 60; // seconds
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function isReady() {
  return redis !== null && redis.status === 'ready';
}

async function connect() {
  if (!process.env.REDIS_URL) return;
  try {
    const { createClient } = require('redis');
    redis = createClient({ url: process.env.REDIS_URL });
    pub   = createClient({ url: process.env.REDIS_URL });
    sub   = createClient({ url: process.env.REDIS_URL });

    redis.on('error', e => console.error('Redis error:', e.message));
    pub.on('error',   e => console.error('Redis pub error:', e.message));
    sub.on('error',   e => console.error('Redis sub error:', e.message));

    await Promise.all([redis.connect(), pub.connect(), sub.connect()]);
    console.log('✅ Connected to Redis');
  } catch (e) {
    console.error('❌ Redis connection failed:', e.message);
    redis = pub = sub = null;
  }
}

// ── Sessions ──────────────────────────────────────────────────────────

async function setSession(token, userKey) {
  if (!isReady()) return;
  await redis.set(`sess:${token}`, userKey, { EX: SESSION_TTL });
}

async function getSession(token) {
  if (!isReady()) return null;
  return redis.get(`sess:${token}`);
}

async function delSession(token) {
  if (!isReady()) return;
  await redis.del(`sess:${token}`);
}

// ── Leaderboard cache ─────────────────────────────────────────────────

async function getCachedLeaderboard() {
  if (!isReady()) return null;
  const raw = await redis.get(LEADERBOARD_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function setCachedLeaderboard(board) {
  if (!isReady()) return;
  await redis.set(LEADERBOARD_KEY, JSON.stringify(board), { EX: LEADERBOARD_TTL });
}

async function invalidateLeaderboard() {
  if (!isReady()) return;
  await redis.del(LEADERBOARD_KEY);
}

// ── Pub/Sub (cross-node socket events) ───────────────────────────────

async function publish(channel, payload) {
  if (!pub) return;
  await pub.publish(channel, JSON.stringify(payload));
}

async function subscribe(channel, handler) {
  if (!sub) return;
  await sub.subscribe(channel, (msg) => {
    try { handler(JSON.parse(msg)); } catch (_) {}
  });
}

module.exports = {
  connect,
  isReady,
  setSession,
  getSession,
  delSession,
  getCachedLeaderboard,
  setCachedLeaderboard,
  invalidateLeaderboard,
  publish,
  subscribe,
  // Expose raw client for socket.io-redis adapter
  getClient: () => redis,
  getPub: () => pub,
  getSub: () => sub,
};
