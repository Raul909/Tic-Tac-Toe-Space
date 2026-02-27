const test = require('node:test');
const assert = require('node:assert');
const chatHandler = require('../socket/handlers/chat');

test('Chat Handler', async (t) => {
  await t.test('should emit chat message if valid', () => {
    // Correctly mocking functions
    const onMock = t.mock.fn();
    const emitMock = t.mock.fn();

    const socket = {
      id: 'socket1',
      on: onMock,
      emit: t.mock.fn()
    };

    const context = {
      socketUser: new Map([['socket1', 'user1']]),
      users: { 'user1': { displayName: 'User One' } },
      io: {
        to: () => ({ emit: emitMock })
      }
    };

    chatHandler(socket, context);

    // Simulate event
    // The handler registers 'chat:msg' as the first listener
    const callback = onMock.mock.calls[0].arguments[1];
    callback({ code: 'ROOM', text: 'Hello' });

    // Verify emission
    assert.strictEqual(emitMock.mock.calls.length, 1);
    assert.strictEqual(emitMock.mock.calls[0].arguments[0], 'chat:msg');
    assert.strictEqual(emitMock.mock.calls[0].arguments[1].text, 'Hello');
  });

  await t.test('should ignore empty or invalid messages', () => {
    const onMock = t.mock.fn();
    const emitMock = t.mock.fn();

    const socket = {
      id: 'socket1',
      on: onMock
    };

    const context = {
      socketUser: new Map([['socket1', 'user1']]),
      users: { 'user1': { displayName: 'User One' } },
      io: {
        to: () => ({ emit: emitMock })
      }
    };

    chatHandler(socket, context);
    const callback = onMock.mock.calls[0].arguments[1];

    callback({ code: 'ROOM', text: '' });
    assert.strictEqual(emitMock.mock.calls.length, 0);

    callback({ code: 'ROOM', text: 123 });
    assert.strictEqual(emitMock.mock.calls.length, 0);
  });
});
