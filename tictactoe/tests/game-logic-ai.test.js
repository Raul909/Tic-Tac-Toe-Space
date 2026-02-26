const test = require('node:test');
const assert = require('node:assert');
const { getBestMove } = require('../public/game-logic.js');

test('GameLogic.getBestMove', async (t) => {
  // Helper to create empty board
  const emptyBoard = () => Array(9).fill(null);

  await t.test('Hard: Should block immediate win', () => {
    // X is about to win
    const board = [
      'X', 'X', null,
      null, 'O', null,
      null, null, null
    ];
    const move = getBestMove(board, 'hard');
    assert.strictEqual(move, 2, 'AI should block X win at index 2');
  });

  await t.test('Hard: Should take immediate win', () => {
    // O is about to win
    const board = [
      'O', 'O', null,
      null, 'X', null,
      'X', null, null
    ];
    const move = getBestMove(board, 'hard');
    assert.strictEqual(move, 2, 'AI should take win at index 2');
  });

  await t.test('Hard: Should return valid move on empty board', () => {
    const move = getBestMove(emptyBoard(), 'hard');
    assert.ok(move >= 0 && move <= 8, 'Move should be valid index');
  });

  await t.test('Easy: Should return valid move', () => {
    const board = [
      'X', 'O', 'X',
      'O', 'X', 'O',
      'O', 'X', null
    ];
    const move = getBestMove(board, 'easy');
    assert.strictEqual(move, 8, 'Easy AI should take the only available spot');
  });

  await t.test('Easy: Should return valid move on empty board', () => {
    const move = getBestMove(emptyBoard(), 'easy');
    assert.ok(move >= 0 && move <= 8, 'Move should be valid index');
  });
});
