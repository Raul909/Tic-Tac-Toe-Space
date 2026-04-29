const test = require('node:test');
const assert = require('node:assert');
const { leaveCurrentRoom, handlePlayerLeave } = require('../socket/utils');

test('leaveCurrentRoom', async (t) => {
  await t.test('should handle leaving room correctly', () => {
    // Setup mock context
    const socket = {
      id: 'socket1',
      leave: t.mock.fn(),
      to: () => ({ emit: t.mock.fn() })
    };

    const rooms = new Map();
    const socketRoom = new Map();
    const userRoom = new Map();

    // Setup initial state
    const roomCode = 'ABCD';
    const playerKey = 'user1';

    rooms.set(roomCode, {
      code: roomCode,
      players: [
        { socketId: 'socket1', key: playerKey },
        { socketId: 'socket2', key: 'user2' }
      ],
      rematchVotes: new Set()
    });

    socketRoom.set('socket1', roomCode);
    userRoom.set(playerKey, roomCode);

    const context = {
      rooms,
      socketRoom,
      userRoom,
      io: {}
    };

    // Execute
    leaveCurrentRoom(socket, context);

    // Verify
    assert.strictEqual(socket.leave.mock.calls.length, 1);
    assert.strictEqual(socket.leave.mock.calls[0].arguments[0], roomCode);

    // Check state updates
    assert.strictEqual(socketRoom.has('socket1'), false);
    assert.strictEqual(userRoom.has(playerKey), false);

    const room = rooms.get(roomCode);
    assert.strictEqual(room.players.length, 1);
    assert.strictEqual(room.players[0].socketId, 'socket2');
    assert.strictEqual(room.status, 'waiting');
    assert.strictEqual(room.rematchVotes, undefined);
  });

  await t.test('should delete room if last player leaves', () => {
    // Setup mock context
    const socket = {
      id: 'socket1',
      leave: t.mock.fn()
    };

    const rooms = new Map();
    const socketRoom = new Map();
    const userRoom = new Map();

    // Setup initial state
    const roomCode = 'ABCD';
    const playerKey = 'user1';

    rooms.set(roomCode, {
      code: roomCode,
      players: [
        { socketId: 'socket1', key: playerKey }
      ]
    });

    socketRoom.set('socket1', roomCode);
    userRoom.set(playerKey, roomCode);

    const context = {
      rooms,
      socketRoom,
      userRoom,
      io: {}
    };

    // Execute
    leaveCurrentRoom(socket, context);

    // Verify
    assert.strictEqual(rooms.has(roomCode), false);
  });
});

test('handlePlayerLeave', async (t) => {
  await t.test('should handle room not found', () => {
    const rooms = new Map();
    const context = { rooms };
    // Should not throw
    handlePlayerLeave('NONEXISTENT', 'user1', context);
  });

  await t.test('should handle player not found in room', () => {
    const rooms = new Map();
    const roomCode = 'ABCD';
    rooms.set(roomCode, {
      code: roomCode,
      players: [{ key: 'user2' }]
    });
    const userRoom = new Map();
    userRoom.set('user1', roomCode);
    const context = { rooms, userRoom };

    handlePlayerLeave(roomCode, 'user1', context);

    assert.strictEqual(rooms.get(roomCode).players.length, 1);
    assert.strictEqual(userRoom.get('user1'), roomCode);
  });

  await t.test('should remove player and update room state', () => {
    const rooms = new Map();
    const roomCode = 'ABCD';
    const playerKey = 'user1';

    rooms.set(roomCode, {
      code: roomCode,
      players: [
        { key: playerKey },
        { key: 'user2' }
      ],
      status: 'playing',
      rematchVotes: new Set(['user1'])
    });

    const userRoom = new Map();
    userRoom.set(playerKey, roomCode);

    const disconnectTimeouts = new Map();
    const timeout = setTimeout(() => {}, 10000);
    disconnectTimeouts.set(playerKey, timeout);

    const emitMock = t.mock.fn();
    const io = {
      to: t.mock.fn(() => ({
        emit: emitMock
      }))
    };

    const context = { rooms, userRoom, disconnectTimeouts, io };

    handlePlayerLeave(roomCode, playerKey, context);

    const room = rooms.get(roomCode);
    assert.strictEqual(room.players.length, 1);
    assert.strictEqual(room.players[0].key, 'user2');
    assert.strictEqual(room.status, 'waiting');
    assert.strictEqual(room.rematchVotes, undefined);
    assert.strictEqual(userRoom.has(playerKey), false);
    assert.strictEqual(disconnectTimeouts.has(playerKey), false);

    assert.strictEqual(io.to.mock.calls.length, 1);
    assert.strictEqual(io.to.mock.calls[0].arguments[0], roomCode);
    assert.strictEqual(emitMock.mock.calls.length, 1);
    assert.strictEqual(emitMock.mock.calls[0].arguments[0], 'game:opponent-left');

    clearTimeout(timeout);
  });

  await t.test('should delete room if last player leaves', () => {
    const rooms = new Map();
    const roomCode = 'ABCD';
    const playerKey = 'user1';

    rooms.set(roomCode, {
      code: roomCode,
      players: [{ key: playerKey }]
    });

    const userRoom = new Map();
    userRoom.set(playerKey, roomCode);
    const disconnectTimeouts = new Map();
    const context = { rooms, userRoom, disconnectTimeouts, io: {} };

    handlePlayerLeave(roomCode, playerKey, context);

    assert.strictEqual(rooms.has(roomCode), false);
    assert.strictEqual(userRoom.has(playerKey), false);
  });
});
