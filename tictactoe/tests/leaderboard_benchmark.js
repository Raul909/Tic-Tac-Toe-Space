const { performance } = require('perf_hooks');

// Mock data
const users = {};
for (let i = 0; i < 10000; i++) {
  users['user' + i] = {
    displayName: 'User ' + i,
    wins: Math.floor(Math.random() * 1000),
    losses: Math.floor(Math.random() * 1000),
    draws: Math.floor(Math.random() * 1000)
  };
}

function currentImplementation() {
  return Object.values(users)
    .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);
}

function optimizedImplementation(userMap) {
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

// Warm up
for (let i = 0; i < 100; i++) {
  currentImplementation();
  optimizedImplementation(users);
}

const iterations = 1000;

console.log('--- Performance Comparison ---');

let startMem = process.memoryUsage().heapUsed;
let startTime = performance.now();
for (let i = 0; i < iterations; i++) {
  currentImplementation();
}
let endTime = performance.now();
let endMem = process.memoryUsage().heapUsed;
console.log(`Current:   ${((endTime - startTime) / iterations).toFixed(4)}ms, Heap: ${((endMem - startMem) / 1024 / 1024).toFixed(2)}MB`);

startMem = process.memoryUsage().heapUsed;
startTime = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedImplementation(users);
}
endTime = performance.now();
endMem = process.memoryUsage().heapUsed;
console.log(`Optimized: ${((endTime - startTime) / iterations).toFixed(4)}ms, Heap: ${((endMem - startMem) / 1024 / 1024).toFixed(2)}MB`);
