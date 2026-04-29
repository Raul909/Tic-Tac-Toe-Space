# Tic Tac Toe — Mission Control 🚀

Real-time multiplayer Tic Tac Toe with space theme, tournaments, AI, leaderboard, and OAuth.

## Stack

- **Backend** — Node.js, Express, Socket.IO, MongoDB (Mongoose), Redis, RabbitMQ
- **Frontend** — Alpine.js, Tailwind CSS, Three.js (space gallery)
- **Infra** — Nginx load balancer (4 Node instances), bcrypt auth, cookie sessions

## Quick Start

```bash
cp .env.example .env   # fill in MONGODB_URI at minimum
npm install
npm start              # http://localhost:3000
```

Redis and RabbitMQ are optional — the server falls back to in-memory sessions and an in-process queue automatically.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | No | MongoDB connection string. Falls back to `data/users.json` |
| `REDIS_URL` | No | Redis for shared sessions + leaderboard cache |
| `RABBITMQ_URL` | No | RabbitMQ for async stat writes |
| `PORT` | No | Default `3000` |
| `NODE_ENV` | No | Set to `production` to enable secure cookies |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `FACEBOOK_APP_ID` | No | Facebook OAuth |

## Running Multiple Instances (Load Balanced)

```bash
PORT=3001 node server.js &
PORT=3002 node server.js &
PORT=3003 node server.js &
PORT=3004 node server.js &
nginx -c $(pwd)/nginx.conf
```

Requires `REDIS_URL` so sessions are shared across instances.

## Features

- **Multiplayer** — create/join rooms with 4-character codes
- **AI opponent** — easy / normal / hard (minimax + alpha-beta pruning)
- **Tournaments** — 4-player bracket with semifinals and final
- **Leaderboard** — top 10, Redis-cached (60s TTL)
- **Reconnection** — 30s grace period; client retries for ~35s
- **Guest login** — no registration required
- **OAuth** — Google and Facebook sign-in
- **Space gallery** — 3D solar system viewer
- **Achievements** — 8 unlockable achievements
- **Chat** — in-room chat with emotes
- **Blitz mode** — 60-second timed games
- **Educational mode** — space facts between moves

## Architecture

```
Browser → Nginx (port 3000)
            ├── Node :3001
            ├── Node :3002  ← all share Redis + MongoDB
            ├── Node :3003
            └── Node :3004
                    ↓
              RabbitMQ queue → MongoDB stat writes (async)
              Redis           → sessions (7d TTL), leaderboard cache
```

## Performance

| Metric | Before | After |
|---|---|---|
| Concurrent users | ~500–800 | ~2,000–3,200 |
| Leaderboard latency | MongoDB query | <1ms Redis cache |
| Stat write impact on game loop | Blocking | Zero (async queue) |
| Session sharing across nodes | ❌ | ✅ Redis |
| Static file serving | Node.js | Nginx (7d cache) |

## Tests

```bash
npm test
```

## Project Structure

```
server.js                  — Express + Socket.IO entry point
redis.js                   — Redis client (sessions, cache, pub/sub)
queue.js                   — RabbitMQ / in-process stat write queue
rateLimiter.js             — Per-socket event rate limiter
utils.js                   — validateRegistration, checkWinner, generateRoomCode
auth-utils.js              — OAuth user creation + session helper
nginx.conf                 — Load balancer config
socket/
  index.js                 — Socket.IO setup
  utils.js                 — leaveCurrentRoom, handlePlayerLeave, sanitize
  handlers/
    auth.js                — token → session lookup (Redis-first)
    game.js                — move validation, win detection, stat queue
    room.js                — create/join rooms
    chat.js                — in-room chat
    disconnect.js          — 30s grace period reconnection
    tournament.js          — 4-player bracket
public/
  app.js                   — Alpine.js frontend
  game-logic.js            — minimax AI (shared browser + server)
  index.html               — Single-page app
```
