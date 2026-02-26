const users = {};
for (let i = 0; i < 100000; i++) {
  users[`user${i}`] = {
    displayName: `User ${i}`,
    wins: Math.floor(Math.random() * 1000),
    losses: Math.floor(Math.random() * 1000),
    draws: Math.floor(Math.random() * 1000)
  };
}

let cachedLeaderboard = null;
let lastLeaderboardUpdate = 0;
const LEADERBOARD_CACHE_TTL = 60 * 1000;

function getLeaderboardUncached() {
  const start = process.hrtime.bigint();
  const board = Object.values(users)
    .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

function getLeaderboardCached() {
  const start = process.hrtime.bigint();
  const now = Date.now();
  let board;
  if (cachedLeaderboard && (now - lastLeaderboardUpdate < LEADERBOARD_CACHE_TTL)) {
    board = cachedLeaderboard;
  } else {
    board = Object.values(users)
      .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
    cachedLeaderboard = board;
    lastLeaderboardUpdate = now;
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

console.log('Running benchmark...');

const uncachedTimes = [];
for (let i = 0; i < 10; i++) {
  uncachedTimes.push(getLeaderboardUncached());
}
const avgUncached = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;
console.log(`Average time (Uncached): ${avgUncached.toFixed(4)} ms`);

// First call to populate cache
getLeaderboardCached();

const cachedTimes = [];
for (let i = 0; i < 100; i++) {
  cachedTimes.push(getLeaderboardCached());
}
const avgCached = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
console.log(`Average time (Cached): ${avgCached.toFixed(4)} ms`);

const speedup = avgUncached / avgCached;
console.log(`Speedup: ${speedup.toFixed(2)}x`);
