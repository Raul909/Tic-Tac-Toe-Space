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

function optimizedImplementation() {
  let board = [];
  for (const key in users) {
    const u = users[key];
    const wins = u.wins;
    if (board.length < 10 || wins > board[board.length - 1].wins) {
      board.push({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws });
      board.sort((a, b) => b.wins - a.wins);
      if (board.length > 10) board.pop();
    }
  }
  return board;
}

// Warm up
for (let i = 0; i < 100; i++) {
  currentImplementation();
  optimizedImplementation();
}

const iterations = 100;

let start = performance.now();
for (let i = 0; i < iterations; i++) {
  currentImplementation();
}
let end = performance.now();
console.log(`Current implementation average time: ${((end - start) / iterations).toFixed(4)}ms`);

start = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedImplementation();
}
end = performance.now();
console.log(`Optimized implementation average time: ${((end - start) / iterations).toFixed(4)}ms`);
