const authHandler = require('./handlers/auth');
const chatHandler = require('./handlers/chat');
const roomHandler = require('./handlers/room');
const gameHandler = require('./handlers/game');
const disconnectHandler = require('./handlers/disconnect');
const { tournamentHandler, handleTournamentResult } = require('./handlers/tournament');
const rateLimiter = require('../rateLimiter');

/**
 * Initializes all socket handlers
 * @param {Server} io - Socket.io server instance
 * @param {Object} context - Shared application state
 */
function setupSocket(io, context) {
  // Add io and handleTournamentResult to context for handlers that need it
  const fullContext = {
    ...context,
    io,
    rateLimiter,
    handleTournamentResult: (room, result) => handleTournamentResult(room, result, { ...context, io, tournaments: context.tournaments })
  };

  io.on('connection', (socket) => {
    // ── RATE LIMITER ──
    socket.use((packet, next) => {
      const eventName = packet[0];
      // Check if rateLimiter allows the event
      if (!rateLimiter.check(socket.id, eventName)) {
        if (eventName === 'disconnect') return next();
        socket.emit('error', 'Rate limit exceeded. Please slow down.');
        return;
      }
      next();
    });

    // Initialize handlers
    authHandler(socket, fullContext);
    chatHandler(socket, fullContext);
    roomHandler(socket, fullContext);
    gameHandler(socket, fullContext); // Now has access to handleTournamentResult
    tournamentHandler(socket, fullContext);
    disconnectHandler(socket, fullContext);
  });
}

module.exports = { setupSocket };
