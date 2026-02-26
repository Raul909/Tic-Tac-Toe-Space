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

  function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) moves.push(i);
    }
    return moves;
  }

  function checkWinner(board) {
    if (checkWin(board, 'X')) return 'X';
    if (checkWin(board, 'O')) return 'O';
    if (board.every(cell => cell !== null)) return 'tie';
    return null;
  }

  const scores = {
    O: 10,
    X: -10,
    tie: 0
  };

  function minimax(board, depth, isMaximizing) {
    const result = checkWinner(board);
    if (result !== null) {
      // Adjust score by depth to prefer faster wins / slower losses
      if (result === 'O') return scores.O - depth;
      if (result === 'X') return scores.X + depth;
      return scores.tie;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          let score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X'; // Assume user plays optimally to minimize AI score
          let score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  /**
   * Gets the best move for the AI.
   * @param {Array} board - The game board.
   * @param {string} difficulty - 'easy', 'normal', 'hard'.
   * @returns {number} - The index of the best move.
   */
  function getBestMove(board, difficulty = 'normal') {
    const availMoves = getAvailableMoves(board);
    if (availMoves.length === 0) return -1;

    // Easy: Random move
    if (difficulty === 'easy') {
      const randomIndex = Math.floor(Math.random() * availMoves.length);
      return availMoves[randomIndex];
    }

    // Normal: 30% chance of random move (mistake)
    if (difficulty === 'normal') {
      // 30% chance to play randomly
      if (Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * availMoves.length);
        return availMoves[randomIndex];
      }
      // 70% chance to fall through to Hard logic
    }

    // Hard (or Normal falling through): Minimax
    let bestScore = -Infinity;
    let move = -1;

    // Optimization: If board is empty, pick center (4)
    if (availMoves.length === 9) return 4;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }

    // If for some reason minimax fails (shouldn't happen), pick random available
    return move !== -1 ? move : availMoves[0];
  }

  return {
    checkWin,
    getBestMove,
    WINS // Exporting constants can be useful for testing or other logic
  };
}));
