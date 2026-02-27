const { checkWinner } = require('../../utils');

/**
 * Game logic socket handler
 */
module.exports = (socket, context) => {
  const {
    socketUser,
    users,
    rooms,
    saveUsers,
    io,
    handleTournamentResult // This will need to be passed in or imported if it's a module
  } = context;

  // ── MAKE MOVE ──
  socket.on('game:move', ({ code, index }) => {
    const key = socketUser.get(socket.id);
    if (!key) return;
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return socket.emit('game:error', 'Not in this room');
    if (player.symbol !== room.currentTurn) return socket.emit('game:error', 'Not your turn');
    if (room.board[index] !== null) return socket.emit('game:error', 'Cell taken');
    if (index < 0 || index > 8) return;

    room.board[index] = player.symbol;
    io.to(code).emit('game:move', { index, symbol: player.symbol });

    const result = checkWinner(room.board);
    if (result) {
      room.status = 'done';
      if (result.winner) {
        room.scores[result.winner]++;
        const winPlayer = room.players.find(p => p.symbol === result.winner);
        const losePlayer = room.players.find(p => p.symbol !== result.winner);
        if (winPlayer && users[winPlayer.key]) { users[winPlayer.key].wins++; saveUsers(); }
        if (losePlayer && users[losePlayer.key]) { users[losePlayer.key].losses++; saveUsers(); }
        io.to(code).emit('game:over', { winner: result.winner, line: result.line, scores: room.scores });
        if (typeof handleTournamentResult === 'function') {
            handleTournamentResult(room, { winner: result.winner });
        }
      } else {
        room.scores.D++;
        room.players.forEach(p => { if (users[p.key]) users[p.key].draws++; });
        saveUsers();
        io.to(code).emit('game:over', { winner: null, draw: true, scores: room.scores });
        if (typeof handleTournamentResult === 'function') {
            handleTournamentResult(room, { draw: true });
        }
      }
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      io.to(code).emit('game:turn', { currentTurn: room.currentTurn });
    }
  });

  // ── REMATCH ──
  socket.on('game:rematch', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.players.length < 2) return;
    if (!room.rematchVotes) room.rematchVotes = new Set();
    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size >= 2) {
      // Swap symbols for fairness
      room.players.forEach(p => { p.symbol = p.symbol === 'X' ? 'O' : 'X'; });
      room.board = Array(9).fill(null);
      room.currentTurn = 'X';
      room.status = 'playing';
      delete room.rematchVotes;
      io.to(code).emit('game:start', {
        board: room.board,
        currentTurn: room.currentTurn,
        players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
        scores: room.scores
      });
    } else {
      const name = users[socketUser.get(socket.id)]?.displayName || 'Opponent';
      socket.to(code).emit('game:rematch-request', { from: name });
    }
  });
};
