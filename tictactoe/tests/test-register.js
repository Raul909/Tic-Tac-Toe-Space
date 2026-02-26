const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Setup environment for testing
const TEST_DIR = path.join(os.tmpdir(), 'tictactoe-test-' + Date.now());
process.env.DATA_DIR = TEST_DIR;
process.env.PORT = '0'; // Let OS choose port (though we'll call listen manually)

// Ensure clean state
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

// Import the app after setting env vars
const { app, server } = require('../server');

// Helper to make requests
function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: server.address().port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : {}
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

test('User Registration Integration Test', async (t) => {
  // Start server
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  // Ensure server closes after tests
  t.after(() => {
    server.close();
    // Cleanup temp dir
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to cleanup test dir:', e);
    }
  });

  await t.test('should register a new user successfully', async () => {
    const response = await makeRequest('/api/register', 'POST', {
      username: 'testuser',
      password: 'password123'
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.ok, true);
    assert.strictEqual(response.body.username, 'testuser');
    assert.ok(response.body.token, 'Should have a session token');
    assert.deepStrictEqual(response.body.stats, { wins: 0, losses: 0, draws: 0 });
  });

  await t.test('should fail to register duplicate username', async () => {
    const response = await makeRequest('/api/register', 'POST', {
      username: 'testuser', // Same user
      password: 'password123'
    });

    assert.strictEqual(response.status, 200); // API returns 200 with ok: false
    assert.strictEqual(response.body.ok, false);
    assert.strictEqual(response.body.error, 'Username already taken');
  });

  await t.test('should fail with short username', async () => {
    const response = await makeRequest('/api/register', 'POST', {
      username: 'ab',
      password: 'password123'
    });

    assert.strictEqual(response.body.ok, false);
    assert.match(response.body.error, /Username too short/);
  });

  await t.test('should fail with missing password', async () => {
    const response = await makeRequest('/api/register', 'POST', {
      username: 'validuser'
    });

    assert.strictEqual(response.body.ok, false);
    assert.match(response.body.error, /Missing fields/);
  });

  await t.test('should persist user to file', async () => {
    // Wait a bit for the async write (server.js uses setTimeout 1000ms)
    await new Promise(r => setTimeout(r, 1500));

    const usersFile = path.join(TEST_DIR, 'users.json');
    assert.ok(fs.existsSync(usersFile), 'Users file should exist');

    const content = fs.readFileSync(usersFile, 'utf8');
    const users = JSON.parse(content);

    assert.ok(users['testuser'], 'testuser should be in the file');
    assert.strictEqual(users['testuser'].displayName, 'testuser');
  });
});
