const test = require('node:test');
const assert = require('node:assert');
const { leaveCurrentRoom } = require('../socket/utils');

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
