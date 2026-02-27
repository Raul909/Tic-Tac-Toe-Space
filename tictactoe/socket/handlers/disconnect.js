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
        socketRoom.delete(socket.id); // Remove socket->room mapping

        const room = rooms.get(code);
        if (room) {
          // Grace Period: Don't destroy immediately
          // Notify opponent that player disconnected (optional)
          socket.to(code).emit('game:opponent-disconnected', { key });

          // Set timeout to actually leave
          const timeout = setTimeout(() => {
            handlePlayerLeave(code, key, context);
          }, 30000); // 30 seconds

          disconnectTimeouts.set(key, timeout);
        }
      }
    }
  });
};
