const test = require('node:test');
const assert = require('node:assert');

// Simple mock for users
const users = {
  a: { displayName: 'Alice', wins: 10, losses: 2, draws: 1 },
  b: { displayName: 'Bob', wins: 5, losses: 5, draws: 5 },
  c: { displayName: 'Charlie', wins: 20, losses: 0, draws: 0 },
  d: { displayName: 'Dave', wins: 15, losses: 3, draws: 2 },
  e: { displayName: 'Eve', wins: 8, losses: 4, draws: 3 },
  f: { displayName: 'Frank', wins: 12, losses: 1, draws: 0 },
  g: { displayName: 'Grace', wins: 18, losses: 2, draws: 1 },
  h: { displayName: 'Heidi', wins: 3, losses: 7, draws: 0 },
  i: { displayName: 'Ivan', wins: 25, losses: 1, draws: 0 },
  j: { displayName: 'Judy', wins: 7, losses: 3, draws: 2 },
  k: { displayName: 'Kevin', wins: 1, losses: 9, draws: 0 }
};

// Paste optimized implementation
function getInMemoryLeaderboard(userMap) {
  const board = [];
  for (const key in userMap) {
    const u = userMap[key];
    const wins = u.wins || 0;
    if (board.length < 10 || wins > (board[board.length - 1]?.wins || -1)) {
      board.push({ name: u.displayName, wins, losses: u.losses || 0, draws: u.draws || 0 });
      board.sort((a, b) => b.wins - a.wins);
      if (board.length > 10) board.pop();
    }
  }
  return board;
}

function currentImplementation(userMap) {
  return Object.values(userMap)
    .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);
}

test('getInMemoryLeaderboard matches currentImplementation', () => {
  const expected = currentImplementation(users);
  const actual = getInMemoryLeaderboard(users);

  assert.strictEqual(actual.length, 10, 'Should have exactly 10 users');
  assert.deepStrictEqual(actual, expected, 'Output should match current implementation');
});

test('getInMemoryLeaderboard handles empty users', () => {
  const actual = getInMemoryLeaderboard({});
  assert.strictEqual(actual.length, 0);
});

test('getInMemoryLeaderboard handles few users', () => {
  const fewUsers = { a: users.a, b: users.b };
  const actual = getInMemoryLeaderboard(fewUsers);
  assert.strictEqual(actual.length, 2);
  assert.strictEqual(actual[0].name, 'Alice');
});

test('syncLeaderboard logic', () => {
  let cachedLeaderboard = getInMemoryLeaderboard(users);

  function syncLeaderboard(user) {
    if (!cachedLeaderboard) return;
    const wins = user.wins || 0;
    const index = cachedLeaderboard.findIndex(u => u.name === user.displayName);

    if (index !== -1) {
      cachedLeaderboard[index].wins = wins;
      cachedLeaderboard[index].losses = user.losses || 0;
      cachedLeaderboard[index].draws = user.draws || 0;
      cachedLeaderboard.sort((a, b) => b.wins - a.wins);
    } else if (cachedLeaderboard.length < 10 || wins > (cachedLeaderboard[cachedLeaderboard.length - 1]?.wins || -1)) {
      cachedLeaderboard.push({ name: user.displayName, wins, losses: user.losses || 0, draws: user.draws || 0 });
      cachedLeaderboard.sort((a, b) => b.wins - a.wins);
      if (cachedLeaderboard.length > 10) cachedLeaderboard.pop();
    }
  }

  // Update existing
  syncLeaderboard({ displayName: 'Alice', wins: 100, losses: 2, draws: 1 });
  assert.strictEqual(cachedLeaderboard[0].name, 'Alice');
  assert.strictEqual(cachedLeaderboard[0].wins, 100);

  // Add new that qualifies
  syncLeaderboard({ displayName: 'Zelda', wins: 200, losses: 0, draws: 0 });
  assert.strictEqual(cachedLeaderboard[0].name, 'Zelda');
  assert.strictEqual(cachedLeaderboard.length, 10);
  assert.ok(cachedLeaderboard.find(u => u.name === 'Zelda'));

  // Add new that doesn't qualify
  syncLeaderboard({ displayName: 'Noob', wins: 0, losses: 100, draws: 0 });
  assert.strictEqual(cachedLeaderboard.length, 10);
  assert.ok(!cachedLeaderboard.find(u => u.name === 'Noob'));
});
