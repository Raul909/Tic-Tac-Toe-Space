const { getBestMove } = require('./tictactoe/public/game-logic.js');
const { performance } = require('perf_hooks');

function runBenchmark() {
    const emptyBoard = () => Array(9).fill(null);

    // Test case: Empty board (though getBestMove has an optimization for this,
    // let's see if we can bypass it or use a nearly empty board)
    const board1 = emptyBoard();
    // To bypass the "availMoves.length === 9" optimization:
    board1[0] = 'X';

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        getBestMove(board1, 'hard');
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`Ran ${iterations} iterations of getBestMove on nearly empty board.`);
    console.log(`Total duration: ${duration.toFixed(2)}ms`);
    console.log(`Average duration: ${(duration / iterations).toFixed(4)}ms`);

    return duration;
}

runBenchmark();
