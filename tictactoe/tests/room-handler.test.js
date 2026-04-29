const test = require('node:test');
const assert = require('node:assert');
const roomHandler = require('../socket/handlers/room');

test('Room Handler', async (t) => {
  // Setup common mocks and context
  const createMockContext = () => {
    return {
      socketUser: new Map(),
      users: {
        'user1': { displayName: 'User One' },
        'user2': { displayName: 'User Two' }
      },
      rooms: new Map(),
      socketRoom: new Map(),
      userRoom: new Map(),
      io: {
        to: t.mock.fn(() => ({
          emit: t.mock.fn()
        }))
      }
    };
  };

  const createMockSocket = (id) => {
    return {
      id,
      on: t.mock.fn(),
      emit: t.mock.fn(),
      join: t.mock.fn(),
      leave: t.mock.fn(),
      to: t.mock.fn(() => ({
        emit: t.mock.fn()
      }))
    };
  };

  await t.test('room:create - should create a room successfully', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket1');
    context.socketUser.set('socket1', 'user1');

    roomHandler(socket, context);

    // Get the 'room:create' callback
    const createCall = socket.on.mock.calls.find(c => c.arguments[0] === 'room:create');
    assert.ok(createCall, 'room:create listener should be registered');
    const callback = createCall.arguments[1];

    callback();

    // Verify room creation
    assert.strictEqual(context.rooms.size, 1);
    const roomCode = Array.from(context.rooms.keys())[0];
    const room = context.rooms.get(roomCode);

    assert.strictEqual(room.code, roomCode);
    assert.strictEqual(room.players.length, 1);
    assert.strictEqual(room.players[0].key, 'user1');
    assert.strictEqual(room.players[0].symbol, 'X');
    assert.strictEqual(context.socketRoom.get('socket1'), roomCode);
    assert.strictEqual(context.userRoom.get('user1'), roomCode);

    assert.strictEqual(socket.join.mock.calls.length, 1);
    assert.strictEqual(socket.join.mock.calls[0].arguments[0], roomCode);

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:created');
    assert.deepStrictEqual(socket.emit.mock.calls[0].arguments[1], { code: roomCode, symbol: 'X' });
  });

  await t.test('room:create - should fail if not authenticated', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket1');
    // Not setting socketUser for socket1

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:create').arguments[1];

    callback();

    assert.strictEqual(context.rooms.size, 0);
    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'Not authenticated');
  });

  await t.test('room:join - should join a room successfully', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket2');
    context.socketUser.set('socket2', 'user2');

    // Pre-create a room
    const roomCode = 'ABCD';
    context.rooms.set(roomCode, {
      code: roomCode,
      players: [{ socketId: 'socket1', key: 'user1', name: 'User One', symbol: 'X' }],
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'waiting',
      scores: { X: 0, O: 0, D: 0 }
    });

    roomHandler(socket, context);
    const joinCall = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join');
    const callback = joinCall.arguments[1];

    callback({ code: 'ABCD' });

    // Verify join
    const room = context.rooms.get(roomCode);
    assert.strictEqual(room.players.length, 2);
    assert.strictEqual(room.players[1].key, 'user2');
    assert.strictEqual(room.players[1].symbol, 'O');
    assert.strictEqual(room.status, 'playing');
    assert.strictEqual(context.socketRoom.get('socket2'), roomCode);
    assert.strictEqual(context.userRoom.get('user2'), roomCode);

    assert.strictEqual(socket.join.mock.calls.length, 1);
    assert.strictEqual(socket.join.mock.calls[0].arguments[0], roomCode);

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:joined');

    // Verify game:start emission to the room
    assert.strictEqual(context.io.to.mock.calls.length, 1);
    assert.strictEqual(context.io.to.mock.calls[0].arguments[0], roomCode);
    const ioEmitMock = context.io.to.mock.calls[0].result.emit;
    assert.strictEqual(ioEmitMock.mock.calls.length, 1);
    assert.strictEqual(ioEmitMock.mock.calls[0].arguments[0], 'game:start');
  });

  await t.test('room:join - should fail if room not found', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket2');
    context.socketUser.set('socket2', 'user2');

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join').arguments[1];

    callback({ code: 'NONE' });

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'Room not found');
  });

  await t.test('room:join - should fail if joining own room', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket1');
    context.socketUser.set('socket1', 'user1');

    const roomCode = 'ABCD';
    context.rooms.set(roomCode, {
      code: roomCode,
      players: [{ socketId: 'socket1', key: 'user1', name: 'User One', symbol: 'X' }],
      status: 'waiting'
    });

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join').arguments[1];

    callback({ code: 'ABCD' });

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'You created this room');
  });

  await t.test('room:join - should fail if room is full', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket3');
    context.socketUser.set('socket3', 'user3');
    context.users['user3'] = { displayName: 'User Three' };

    const roomCode = 'ABCD';
    context.rooms.set(roomCode, {
      code: roomCode,
      players: [
        { socketId: 'socket1', key: 'user1', name: 'User One', symbol: 'X' },
        { socketId: 'socket2', key: 'user2', name: 'User Two', symbol: 'O' }
      ],
      status: 'waiting'
    });

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join').arguments[1];

    callback({ code: 'ABCD' });

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'Room is full');
  });

  await t.test('room:join - should fail if game in progress', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket2');
    context.socketUser.set('socket2', 'user2');

    const roomCode = 'ABCD';
    context.rooms.set(roomCode, {
      code: roomCode,
      players: [{ socketId: 'socket1', key: 'user1', name: 'User One', symbol: 'X' }],
      status: 'playing'
    });

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join').arguments[1];

    callback({ code: 'ABCD' });

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'room:error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'Game in progress');
  });

  await t.test('room:join - should fail if not authenticated', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket2');

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:join').arguments[1];

    callback({ code: 'ABCD' });

    assert.strictEqual(socket.emit.mock.calls.length, 1);
    assert.strictEqual(socket.emit.mock.calls[0].arguments[0], 'error');
    assert.strictEqual(socket.emit.mock.calls[0].arguments[1], 'Not authenticated');
  });

  await t.test('room:create - should leave current room before creating new one', () => {
    const context = createMockContext();
    const socket = createMockSocket('socket1');
    context.socketUser.set('socket1', 'user1');

    const oldRoomCode = 'OLD1';
    context.rooms.set(oldRoomCode, {
      code: oldRoomCode,
      players: [{ socketId: 'socket1', key: 'user1', name: 'User One', symbol: 'X' }]
    });
    context.socketRoom.set('socket1', oldRoomCode);
    context.userRoom.set('user1', oldRoomCode);

    roomHandler(socket, context);
    const callback = socket.on.mock.calls.find(c => c.arguments[0] === 'room:create').arguments[1];

    callback();

    // Verify old room was cleaned up
    assert.strictEqual(context.rooms.has(oldRoomCode), false);
    assert.strictEqual(socket.leave.mock.calls.length, 1);
    assert.strictEqual(socket.leave.mock.calls[0].arguments[0], oldRoomCode);

    // Verify new room created
    assert.strictEqual(context.rooms.size, 1);
    const newRoomCode = Array.from(context.rooms.keys())[0];
    assert.notStrictEqual(newRoomCode, oldRoomCode);
  });
});
