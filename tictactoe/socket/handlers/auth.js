/**
 * Auth socket handler
 */
module.exports = (socket, context) => {
  const {
    sessions,
    users,
    socketUser,
    userSocket,
    userRoom,
    disconnectTimeouts,
    rooms,
    socketRoom
  } = context;

  socket.on('auth', ({ token }) => {
    const key = sessions.get(token);
    if (!key || !users[key]) {
      socket.emit('auth:error', 'Session expired, please log in again');
      return;
    }
    socketUser.set(socket.id, key);
    userSocket.set(key, socket.id);
    const { wins, losses, draws, displayName } = users[key];
    socket.emit('auth:ok', { username: displayName, stats: { wins, losses, draws } });

    // Reconnection logic
    const existingRoomCode = userRoom.get(key);
    if (existingRoomCode) {
      // Clear any pending disconnect timeout
      if (disconnectTimeouts.has(key)) {
        clearTimeout(disconnectTimeouts.get(key));
        disconnectTimeouts.delete(key);
      }

      const room = rooms.get(existingRoomCode);
      if (room) {
        // Update player socket
        const player = room.players.find(p => p.key === key);
        if (player) {
          player.socketId = socket.id;
          socketRoom.set(socket.id, existingRoomCode);
          socket.join(existingRoomCode);

          // Emit rejoin event with full game state
          socket.emit('game:rejoin', {
            code: existingRoomCode,
            board: room.board,
            currentTurn: room.currentTurn,
            scores: room.scores,
            players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
            mySymbol: player.symbol,
            room: room // Include full room for robust handling
          });

          socket.to(existingRoomCode).emit('game:opponent-reconnected', { name: displayName });
        }
      }
    }
  });
};
