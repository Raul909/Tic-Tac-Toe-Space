const crypto = require('node:crypto');
const { WINS, checkWin } = require('./public/game-logic');

/**
 * Checks if there's a winner or a draw on the board.
 * Pass `lastPlayer` (the one who just moved) to avoid checking both symbols.
 * Pass `moveCount` to skip the board.every() draw scan.
 * @param {Array} board
 * @param {string} lastPlayer - 'X' or 'O'
 * @param {number} moveCount - total moves made so far (including this one)
 * @returns {Object|null}
 */
function checkWinner(board, lastPlayer, moveCount) {
  const win = checkWin(board, lastPlayer);
  if (win) return { winner: lastPlayer, line: win };
  if (moveCount === 9) return { draw: true, winner: null };
  return null;
}

/**
 * Generates a unique 4-character room code.
 * @param {Map} roomsMap - The existing rooms map to check for uniqueness.
 * @returns {string} - The generated room code.
 */
function generateRoomCode(roomsMap) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
  } while (roomsMap.has(code));
  return code;
}

/**
 * Validates registration input.
 * @param {string} username - The username to validate.
 * @param {string} password - The password to validate.
 * @returns {Object} - Result object with { ok: boolean, error?: string, key?: string }.
 */
function validateRegistration(username, password) {
  if (!username?.trim() || !password) return { ok: false, error: 'Missing fields' };

  const key = username.trim().toLowerCase();
  if (key.length < 3) return { ok: false, error: 'Username too short (min 3 chars)' };
  if (key.length > 16) return { ok: false, error: 'Username too long (max 16 chars)' };
  if (!/^[a-z0-9_]+$/.test(key)) return { ok: false, error: 'Letters, numbers, underscores only' };
  if (password.length < 8) return { ok: false, error: 'Password min 8 characters' };

  return { ok: true, key };
}

/**
 * Validates if a user can join a room.
 * @param {Object} room - The room object from the rooms Map.
 * @param {string} socketId - The socket ID of the user trying to join.
 * @returns {Object} - Result object with { ok: boolean, error?: string }.
 */
function validateRoomJoin(room, socketId) {
  if (!room) return { ok: false, error: 'Room not found' };
  if (room.status === 'playing' || room.status === 'done') return { ok: false, error: 'Game in progress' };
  if (room.players.length >= 2) return { ok: false, error: 'Room is full' };
  if (room.players[0] && room.players[0].socketId === socketId) return { ok: false, error: 'You created this room' };
  return { ok: true };
}

module.exports = {
  WINS,
  checkWinner,
  generateRoomCode,
  validateRegistration,
  validateRoomJoin
};
