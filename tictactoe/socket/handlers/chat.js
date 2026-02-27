const { sanitize } = require('../utils');

/**
 * Chat socket handler
 */
module.exports = (socket, context) => {
  const { socketUser, users, io } = context;

  socket.on('chat:msg', ({ code, text }) => {
    const key = socketUser.get(socket.id);
    if (typeof text !== 'string') return;
    if (!key || !text.trim()) return;
    const clean = sanitize(text);
    if (!clean) return;
    io.to(code).emit('chat:msg', {
      from: users[key].displayName,
      text: clean,
      ts: Date.now()
    });
  });
};
