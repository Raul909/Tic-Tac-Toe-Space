/**
 * Auth socket handler — uses async sessionGet (Redis-first, in-memory fallback)
 */
module.exports = (socket, context) => {
  const {
    sessionGet,
    sessions,
    users,
    socketUser,
    userSocket,
    userRoom,
    disconnectTimeouts,
    rooms,
    socketRoom
  } = context;

  socket.on('auth', async ({ token }) => {
    // Redis-first session lookup, falls back to in-memory Map
    const key = (sessionGet ? await sessionGet(token).catch(() => null) : null)
      ?? sessions.get(token);

    if (!key || !users[key]) {
      socket.emit('auth:error', 'Session expired, please log in again');
      return;
    }
    socketUser.set(socket.id, key);
    userSocket.set(key, socket.id);
    const { wins, losses, draws, displayName } = users[key];

    // Reconnection logic
    const existingRoomCode = userRoom.get(key);
    const hasActiveRoom = !!(existingRoomCode && rooms.get(existingRoomCode)?.players.find(p => p.key === key));
    socket.emit('auth:ok', { username: displayName, stats: { wins, losses, draws }, rejoining: hasActiveRoom });
    if (existingRoomCode) {
      if (disconnectTimeouts.has(key)) {
        clearTimeout(disconnectTimeouts.get(key));
        disconnectTimeouts.delete(key);
      }

      const room = rooms.get(existingRoomCode);
      if (room) {
        const player = room.players.find(p => p.key === key);
        if (player) {
          player.socketId = socket.id;
          socketRoom.set(socket.id, existingRoomCode);
          socket.join(existingRoomCode);

          socket.emit('game:rejoin', {
            code: existingRoomCode,
            board: room.board,
            currentTurn: room.currentTurn,
            scores: room.scores,
            players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
            mySymbol: player.symbol,
            room
          });

          socket.to(existingRoomCode).emit('game:opponent-reconnected', { name: displayName });
        }
      }
    }
  });
};
