const { handlePlayerLeave } = require('../utils');

/**
 * Disconnect socket handler
 */
module.exports = (socket, context) => {
  const {
    socketUser,
    userSocket,
    socketRoom,
    rooms,
    disconnectTimeouts,
    rateLimiter
  } = context;

  socket.on('disconnect', () => {
    rateLimiter.cleanup(socket.id);
    const key = socketUser.get(socket.id);
    if (key) {
      // Don't delete userSocket yet, but socketRoom is no longer valid for this ID
      userSocket.delete(key);
      socketUser.delete(socket.id);

      const code = socketRoom.get(socket.id);
      if (code) {
        socketRoom.delete(socket.id);

        const room = rooms.get(code);
        if (room) {
          const disconnectedName = users[key]?.displayName || key;
          socket.to(code).emit('game:opponent-disconnected', { name: disconnectedName });

          const timeout = setTimeout(() => {
            handlePlayerLeave(code, key, context);
          }, 30000);

          disconnectTimeouts.set(key, timeout);
        }
      }
    }
  });
};
