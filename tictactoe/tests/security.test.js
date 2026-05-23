const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TEST_DIR = path.join(os.tmpdir(), 'tictactoe-security-test-' + Date.now());
process.env.DATA_DIR = TEST_DIR;
process.env.MONGODB_URI = '';

if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

const { app, server } = require('../server');

let BASE_URL = 'http://localhost';

test('Security Integration Tests', async (t) => {
  await new Promise((resolve) => {
    server.listen(0, () => {
      BASE_URL = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
    try {
      if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }
  });

  await t.test('Security: /api/login should handle non-string username', async () => {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: { evil: "payload" },
        password: "password"
      })
    });

    const data = await response.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Invalid input/);
  });

  await t.test('Security: /api/login should handle non-string password', async () => {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "user",
        password: { evil: "payload" }
      })
    });

    const data = await response.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Invalid input/);
  });

  await t.test('Security: /api/register should handle non-string username', async () => {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: { evil: "payload" },
        password: "password"
      })
    });

    const data = await response.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Invalid input/);
  });

  await t.test('Security: /api/register should handle non-string password', async () => {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "user",
        password: { evil: "payload" }
      })
    });

    const data = await response.json();
    assert.strictEqual(data.ok, false);
    assert.match(data.error, /Invalid input/);
  });
});
