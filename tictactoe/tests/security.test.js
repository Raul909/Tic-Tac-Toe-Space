const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3000';

test('Security: /api/login should handle non-string username', async (t) => {
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

test('Security: /api/login should handle non-string password', async (t) => {
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

test('Security: /api/register should handle non-string username', async (t) => {
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

test('Security: /api/register should handle non-string password', async (t) => {
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
