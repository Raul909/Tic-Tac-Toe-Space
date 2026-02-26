const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Setup environment BEFORE requiring server
const TEST_DB_PATH = path.join(__dirname, 'test-users.json');
process.env.TEST_USERS_FILE = TEST_DB_PATH;
// Force file-based DB by ensuring MONGODB_URI is empty
process.env.MONGODB_URI = '';

// Ensure clean state
if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

const { app, server } = require('../server');

const BASE_URL = 'http://localhost';
let PORT;

test('Registration API Integration Tests', async (t) => {
  // Start server
  await new Promise((resolve) => {
    server.listen(0, () => {
      PORT = server.address().port;
      resolve();
    });
  });

  t.after(() => {
    server.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  await t.test('should register a new user successfully', async () => {
    const payload = { username: 'testuser', password: 'password123' };
    const res = await fetch(`${BASE_URL}:${PORT}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true, 'Response should be ok');
    assert.ok(data.token, 'Token should be present');
    assert.strictEqual(data.username, 'testuser');
    assert.deepStrictEqual(data.stats, { wins: 0, losses: 0, draws: 0 });
  });

  await t.test('should fail with missing fields', async () => {
    const payload = { username: 'incomplete' };
    const res = await fetch(`${BASE_URL}:${PORT}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Missing fields/);
  });

  await t.test('should fail with short username', async () => {
    const payload = { username: 'ab', password: 'password123' };
    const res = await fetch(`${BASE_URL}:${PORT}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Username too short/);
  });

  await t.test('should fail with duplicate username', async () => {
    // Register 'testuser' again (already registered in first test)
    const payload = { username: 'testuser', password: 'password123' };
    const res = await fetch(`${BASE_URL}:${PORT}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'Username already taken');
  });

  await t.test('should persist user to file', async () => {
    // Wait a bit for the async write (server.js uses setTimeout 1000ms)
    await new Promise(r => setTimeout(r, 1200));

    assert.ok(fs.existsSync(TEST_DB_PATH), 'Users file should exist');
    const fileContent = fs.readFileSync(TEST_DB_PATH, 'utf8');
    const users = JSON.parse(fileContent);
    assert.ok(users['testuser'], 'User should be in the file');
  });
});
