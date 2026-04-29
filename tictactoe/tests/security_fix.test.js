const test = require('node:test');
const assert = require('node:assert');

// Mock bcryptjs since it might be missing
const mockBcrypt = {
  hash: async (pw) => 'hashed_' + pw,
  compare: async (pw, hash) => hash === 'hashed_' + pw
};

// Mocking dependencies
const handlers = {};
const mockApp = {
  use: () => {},
  set: () => {},
  get: () => {},
  post: (path, ...args) => {
    handlers[path] = args[args.length - 1];
  },
  static: () => {}
};

const mockServer = {
  listen: (port, cb) => cb && cb(),
  address: () => ({ port: 1234 })
};

const mockMongoose = {
  connect: () => Promise.resolve(),
  Schema: function() {
    this.index = () => {};
  },
  model: function(name, schema) {
    const m = {
      findOne: async (query) => {
        if (query.username === 'existinguser') return { username: 'existinguser', hash: 'hashed_password123', displayName: 'Existing User' };
        return null;
      },
      create: async (data) => data,
    };
    return m;
  },
  connection: { readyState: 1 },
};

// Intercept requires
const originalRequire = require('module').prototype.require;
require('module').prototype.require = function(name) {
  if (name === 'express') {
    const express = () => mockApp;
    express.json = () => {};
    express.static = () => {};
    return express;
  }
  if (name === 'http') return { createServer: () => mockServer };
  if (name === 'socket.io') return { Server: function() { this.on = () => {}; } };
  if (name === 'mongoose') return mockMongoose;
  if (name === 'bcryptjs') return mockBcrypt;
  if (name === 'express-rate-limit') return () => (req, res, next) => next();
  if (name === 'cookie-parser') return () => (req, res, next) => next();
  if (name === './socket') return { setupSocket: () => {} };
  if (name === 'uuid') return { v4: () => 'mock-uuid' };
  if (name === './utils') return { validateRegistration: (u, p) => ({ ok: true, key: u.toLowerCase() }) };
  if (name === './auth-utils') return { handleAuthUser: () => {} };
  if (name === 'dotenv') return { config: () => {} };
  return originalRequire.apply(this, arguments);
};

// Load the server (this will register handlers in our mockApp)
process.env.MONGODB_URI = 'mock';
require('../server');

test('Unit Test: /api/register', async (t) => {
  const registerHandler = handlers['/api/register'];

  await t.test('should return 400 for non-string input', async () => {
    let status;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => j
    };
    await registerHandler({ body: { username: 123, password: 'pw' } }, res);
    assert.strictEqual(status, 400);
  });

  await t.test('should return 400 if user exists in DB', async () => {
    let status;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => j
    };
    // Note: useDB() returns true in our mock
    await registerHandler({ body: { username: 'existinguser', password: 'password123' } }, res);
    assert.strictEqual(status, 400);
  });

  await t.test('should register successfully in DB path', async () => {
    let jsonData;
    const res = {
      cookie: () => {},
      json: (j) => { jsonData = j; return j; }
    };
    await registerHandler({ body: { username: 'newuser', password: 'password123' } }, res);
    assert.strictEqual(jsonData.ok, true);
    assert.strictEqual(jsonData.username, 'newuser');
  });
});

test('Unit Test: /api/login', async (t) => {
  const loginHandler = handlers['/api/login'];

  await t.test('should return 400 for non-string input', async () => {
    let status;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => j
    };
    await loginHandler({ body: { username: 'user', password: 123 } }, res);
    assert.strictEqual(status, 400);
  });

  await t.test('should return 401 for invalid credentials (user not found)', async () => {
    let status;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => j
    };
    await loginHandler({ body: { username: 'nonexistent', password: 'password123' } }, res);
    assert.strictEqual(status, 401);
  });

  await t.test('should login successfully if credentials match', async () => {
    let jsonData;
    const res = {
      cookie: () => {},
      json: (j) => { jsonData = j; return j; }
    };
    await loginHandler({ body: { username: 'existinguser', password: 'password123' } }, res);

    assert.strictEqual(jsonData.ok, true);
    assert.strictEqual(jsonData.username, 'Existing User');
  });

  await t.test('should return 401 for wrong password', async () => {
    let status;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => j
    };
    await loginHandler({ body: { username: 'existinguser', password: 'wrongpassword' } }, res);
    assert.strictEqual(status, 401);
  });
});
