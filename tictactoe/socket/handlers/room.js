const { generateRoomCode, validateRoomJoin } = require('../../utils');
const { leaveCurrentRoom } = require('../utils');

/**
 * Room management socket handler
 */
module.exports = (socket, context) => {
  const {
    socketUser,
    users,
    rooms,
    socketRoom,
    userRoom,
    io
  } = context;

  // ── CREATE ROOM ──
  socket.on('room:create', () => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');
    leaveCurrentRoom(socket, context);

    const code = generateRoomCode(rooms);
    const room = {
      code,
      players: [{ socketId: socket.id, key, name: users[key].displayName, symbol: 'X' }],
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'waiting',
      scores: { X: 0, O: 0, D: 0 }
    };
    rooms.set(code, room);
    socketRoom.set(socket.id, code);
    userRoom.set(key, code); // Track user room
    socket.join(code);
    socket.emit('room:created', { code, symbol: 'X' });
  });

  // ── JOIN ROOM ──
  socket.on('room:join', ({ code }) => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');

    if (typeof code !== 'string') return socket.emit('room:error', 'Invalid room code');
    const upperCode = code.toUpperCase().trim();
    const room = rooms.get(upperCode);

    const validation = validateRoomJoin(room, socket.id);
    if (!validation.ok) return socket.emit('room:error', validation.error);

    leaveCurrentRoom(socket, context);

    room.players.push({ socketId: socket.id, key, name: users[key].displayName, symbol: 'O' });
    room.status = 'playing';
    socketRoom.set(socket.id, upperCode);
    userRoom.set(key, upperCode); // Track user room
    socket.join(upperCode);
    socket.emit('room:joined', { code: upperCode, symbol: 'O' });

    const startData = {
      board: room.board,
      currentTurn: room.currentTurn,
      players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
      scores: room.scores
    };
    io.to(upperCode).emit('game:start', startData);
  });
};
