(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.GameLogic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  /**
   * Checks if a player has won the game.
   * @param {Array} board - The game board array (9 elements).
   * @param {string} player - The player symbol ('X' or 'O').
   * @returns {Array|null} - The winning line indices or null if no win.
   */
  function checkWin(board, player) {
    for (const line of WINS) {
      if (line.every(i => board[i] === player)) {
        return line;
      }
    }
    return null;
  }

  return {
    checkWin,
    WINS // Exporting constants can be useful for testing or other logic
  };
}));
