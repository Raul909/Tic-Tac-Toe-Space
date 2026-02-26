const test = require('node:test');
const assert = require('node:assert');
const { generateRoomCode, checkWinner, validateRegistration } = require('./utils');

test('generateRoomCode', async (t) => {
  await t.test('should return a 4-character string', () => {
    const rooms = new Map();
    const code = generateRoomCode(rooms);
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 4);
  });

  await t.test('should only use allowed characters', () => {
    const rooms = new Map();
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = generateRoomCode(rooms);
    for (const char of code) {
      assert.ok(allowedChars.includes(char), `Character ${char} not allowed`);
    }
  });

  await t.test('should retry if code already exists', (t) => {
    const rooms = new Map();
    rooms.set('AAAA', {});

    // Mock Math.random to return 0 for the first 4 calls (generating 'AAAA')
    // then return 1/32 for the next 4 calls (generating 'BBBB')
    let calls = 0;
    t.mock.method(Math, 'random', () => {
      calls++;
      if (calls <= 4) return 0;
      return 1/32;
    });

    const code = generateRoomCode(rooms);
    assert.strictEqual(code, 'BBBB');
    assert.strictEqual(calls, 8);
  });
});

test('checkWinner', async (t) => {
  // Horizontal Wins
  await t.test('should detect horizontal win (row 1) for X', () => {
    const board = [
      'X', 'X', 'X',
      null, 'O', null,
      'O', null, null
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'X', line: [0, 1, 2] });
  });

  await t.test('should detect horizontal win (row 2) for O', () => {
    const board = [
      null, 'X', null,
      'O', 'O', 'O',
      'X', null, 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'O', line: [3, 4, 5] });
  });

  await t.test('should detect horizontal win (row 3) for X', () => {
    const board = [
      'O', null, 'O',
      null, 'O', null,
      'X', 'X', 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'X', line: [6, 7, 8] });
  });

  // Vertical Wins
  await t.test('should detect vertical win (col 1) for O', () => {
    const board = [
      'O', 'X', 'X',
      'O', null, null,
      'O', null, 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'O', line: [0, 3, 6] });
  });

  await t.test('should detect vertical win (col 2) for X', () => {
    const board = [
      null, 'X', 'O',
      'O', 'X', null,
      null, 'X', 'O'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'X', line: [1, 4, 7] });
  });

  await t.test('should detect vertical win (col 3) for O', () => {
    const board = [
      'X', null, 'O',
      'X', 'X', 'O',
      null, null, 'O'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'O', line: [2, 5, 8] });
  });

  // Diagonal Wins
  await t.test('should detect diagonal win (top-left to bottom-right) for X', () => {
    const board = [
      'X', 'O', null,
      null, 'X', 'O',
      null, null, 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'X', line: [0, 4, 8] });
  });

  await t.test('should detect diagonal win (top-right to bottom-left) for O', () => {
    const board = [
      'X', 'X', 'O',
      null, 'O', null,
      'O', null, 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { winner: 'O', line: [2, 4, 6] });
  });

  // Draws
  await t.test('should detect a draw (full board, no winner)', () => {
    const board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X'
    ];
    const result = checkWinner(board);
    assert.deepStrictEqual(result, { draw: true, winner: null });
  });

  // Edge Cases
  await t.test('should detect a win on a full board (not a draw)', () => {
    // This looks like a draw but X has a diagonal win
    const board = [
      'X', 'O', 'O',
      'O', 'X', 'X',
      'X', 'O', 'X'
    ];
    const result = checkWinner(board);
    // 0, 4, 8 is X
    assert.deepStrictEqual(result, { winner: 'X', line: [0, 4, 8] });
  });

  await t.test('should return null for an empty board', () => {
    const board = Array(9).fill(null);
    const result = checkWinner(board);
    assert.strictEqual(result, null);
  });

  await t.test('should return null for a sparse board (1 move)', () => {
    const board = Array(9).fill(null);
    board[4] = 'X';
    const result = checkWinner(board);
    assert.strictEqual(result, null);
  });
});

test('validateRegistration', async (t) => {
  await t.test('should validate valid registration', () => {
    const result = validateRegistration('validUser', 'validPass123');
    assert.deepStrictEqual(result, { ok: true, key: 'validuser' });
  });

  await t.test('should fail if username too short', () => {
    const result = validateRegistration('ab', 'validPass123');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Username too short/);
  });

  await t.test('should fail if username too long', () => {
    const result = validateRegistration('thisusernameiswaytoolong', 'validPass123');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Username too long/);
  });

  await t.test('should fail if username has invalid characters', () => {
    const result = validateRegistration('invalid@user', 'validPass123');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Letters, numbers, underscores only/);
  });

  await t.test('should fail if password too short', () => {
    const result = validateRegistration('user123', 'short');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Password min 8 characters/);
  });

  await t.test('should fail if fields missing', () => {
    let result = validateRegistration('', 'validPass123');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Missing fields/);

    result = validateRegistration('user123', '');
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /Missing fields/);
  });
});
