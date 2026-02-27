/**
 * Shared utility functions for socket handlers.
 */

function leaveCurrentRoom(socket, context) {
  const { rooms, socketRoom, userRoom, io } = context;
  const code = socketRoom.get(socket.id);
  if (!code) return;

  const room = rooms.get(code);
  if (room) {
    const idx = room.players.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      const p = room.players[idx];
      if (p.key) userRoom.delete(p.key);

      socket.leave(code);
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        room.status = 'waiting';
        delete room.rematchVotes;
        socket.to(code).emit('game:opponent-left');
      }
    }
  }
  socketRoom.delete(socket.id);
}

function handlePlayerLeave(code, key, context) {
  const { rooms, userRoom, disconnectTimeouts, io } = context;
  const room = rooms.get(code);
  if (!room) return;

  const idx = room.players.findIndex(p => p.key === key);
  if (idx !== -1) {
    room.players.splice(idx, 1);
    userRoom.delete(key);
    disconnectTimeouts.delete(key);

    if (room.players.length === 0) {
      rooms.delete(code);
    } else {
      room.status = 'waiting';
      delete room.rematchVotes;
      io.to(code).emit('game:opponent-left');
    }
  }
}

function sanitize(text) {
  if (!text) return '';
  return text.trim()
    .replace(/[<>]/g, '')
    .slice(0, 120);
}

module.exports = {
  leaveCurrentRoom,
  handlePlayerLeave,
  sanitize
};
