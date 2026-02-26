const test = require('node:test');
const assert = require('node:assert');
const { checkWin } = require('../public/game-logic.js');

test('GameLogic.checkWin', async (t) => {
  // Helper to create empty board
  const emptyBoard = () => Array(9).fill(null);

  await t.test('should return null for empty board', () => {
    const result = checkWin(emptyBoard(), 'X');
    assert.strictEqual(result, null);
  });

  await t.test('should detect horizontal win (row 1) for X', () => {
    const board = [
      'X', 'X', 'X',
      null, 'O', null,
      'O', null, null
    ];
    const result = checkWin(board, 'X');
    assert.deepStrictEqual(result, [0, 1, 2]);
  });

  await t.test('should detect horizontal win (row 2) for O', () => {
    const board = [
      null, 'X', null,
      'O', 'O', 'O',
      'X', null, 'X'
    ];
    const result = checkWin(board, 'O');
    assert.deepStrictEqual(result, [3, 4, 5]);
  });

  await t.test('should detect horizontal win (row 3) for X', () => {
    const board = [
      'O', null, 'O',
      null, 'O', null,
      'X', 'X', 'X'
    ];
    const result = checkWin(board, 'X');
    assert.deepStrictEqual(result, [6, 7, 8]);
  });

  await t.test('should detect vertical win (col 1) for O', () => {
    const board = [
      'O', 'X', 'X',
      'O', null, null,
      'O', null, 'X'
    ];
    const result = checkWin(board, 'O');
    assert.deepStrictEqual(result, [0, 3, 6]);
  });

  await t.test('should detect vertical win (col 2) for X', () => {
    const board = [
      null, 'X', 'O',
      'O', 'X', null,
      null, 'X', 'O'
    ];
    const result = checkWin(board, 'X');
    assert.deepStrictEqual(result, [1, 4, 7]);
  });

  await t.test('should detect vertical win (col 3) for O', () => {
    const board = [
      'X', null, 'O',
      'X', 'X', 'O',
      null, null, 'O'
    ];
    const result = checkWin(board, 'O');
    assert.deepStrictEqual(result, [2, 5, 8]);
  });

  await t.test('should detect diagonal win (top-left to bottom-right) for X', () => {
    const board = [
      'X', 'O', null,
      null, 'X', 'O',
      null, null, 'X'
    ];
    const result = checkWin(board, 'X');
    assert.deepStrictEqual(result, [0, 4, 8]);
  });

  await t.test('should detect diagonal win (top-right to bottom-left) for O', () => {
    const board = [
      'X', 'X', 'O',
      null, 'O', null,
      'O', null, 'X'
    ];
    const result = checkWin(board, 'O');
    assert.deepStrictEqual(result, [2, 4, 6]);
  });

  await t.test('should return null if player does not win (even if other player wins)', () => {
    const board = [
      'X', 'X', 'X', // X wins
      null, 'O', null,
      'O', null, null
    ];
    const result = checkWin(board, 'O'); // Checking for O
    assert.strictEqual(result, null);
  });

  await t.test('should return null for a draw', () => {
    const board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X'
    ];
    const resultX = checkWin(board, 'X');
    const resultO = checkWin(board, 'O');
    assert.strictEqual(resultX, null);
    assert.strictEqual(resultO, null);
  });
});
