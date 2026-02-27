const test = require('node:test');
const assert = require('node:assert');
const { handleAuthUser } = require('./auth-utils');

test('handleAuthUser', async (t) => {
  await t.test('should create new user and session (file-based)', async () => {
    const res = {
      cookie: t.mock.fn(),
      json: t.mock.fn()
    };
    const userData = {
      displayName: 'Test User',
      email: 'test@example.com',
      providerId: '12345',
      key: 'test_12345',
      providerName: 'test'
    };
    const users = {};
    const saveUsers = t.mock.fn();
    const useDB = () => false;
    const sessions = new Map();
    const uuidv4 = () => 'mock-token';

    await handleAuthUser({
      res,
      userData,
      userStore: { users, saveUsers, useDB },
      sessionStore: { sessions, uuidv4 }
    });

    // Verify user creation
    assert.ok(users['test_12345']);
    assert.strictEqual(users['test_12345'].displayName, 'Test User');
    assert.strictEqual(saveUsers.mock.calls.length, 1);

    // Verify session
    assert.strictEqual(sessions.get('mock-token').key, 'test_12345');
    assert.strictEqual(res.cookie.mock.calls.length, 1);
    assert.strictEqual(res.json.mock.calls.length, 1);
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
      ok: true,
      token: 'mock-token',
      username: 'Test User',
      stats: { wins: 0, losses: 0, draws: 0 }
    });
  });
});
