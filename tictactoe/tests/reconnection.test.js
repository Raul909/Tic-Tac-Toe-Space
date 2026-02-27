const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { io } = require("socket.io-client");

// Setup environment for testing
const TEST_DIR = path.join(os.tmpdir(), 'tictactoe-reconnect-test-' + Date.now());
process.env.DATA_DIR = TEST_DIR;
process.env.PORT = '0'; // Let OS choose port

// Ensure clean state
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

// Import the app after setting env vars
const { app, server } = require('../server');

// Helper to make API requests
function makeRequest(path, method, body, cookie) {
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
    if (cookie) {
        options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
            const parsed = data ? JSON.parse(data) : {};
            // Extract session cookie if present
            const setCookie = res.headers['set-cookie'];
            let sessionCookie = null;
            if (setCookie) {
                const parts = setCookie[0].split(';');
                sessionCookie = parts[0];
            }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            cookie: sessionCookie
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

// Helper to create a socket connection
function createSocket(token, port) {
    return new Promise((resolve, reject) => {
        const socket = io(`http://localhost:${port}`, {
            forceNew: true,
            reconnection: false, // We want to control reconnection manually for tests
        });

        socket.on('connect', () => {
            socket.emit('auth', { token });
        });

        socket.on('auth:ok', (data) => {
            resolve({ socket, data });
        });

        socket.on('auth:error', (err) => {
            reject(new Error(err));
        });

        socket.on('connect_error', (err) => {
            reject(err);
        });
    });
}

test('Socket Reconnection Logic', async (t) => {
  // Start server
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  // Ensure server closes after tests
  t.after(async () => {
    server.close();
    // Wait for any pending saves to avoid ENOENT
    await new Promise(r => setTimeout(r, 1500));
    // Cleanup temp dir
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  await t.test('Test Case 1: Basic Reconnection', async () => {
      // 1. Register User
      const username = 'reconnect_user_1';
      const regRes = await makeRequest('/api/register', 'POST', {
          username,
          password: 'password123'
      });
      assert.strictEqual(regRes.body.ok, true, 'Registration failed');
      const token = regRes.body.token;

      // 2. Connect Socket A
      const { socket: socketA } = await createSocket(token, port);

      // 3. Create Room
      const roomCreatedPromise = new Promise(resolve => {
          socketA.once('room:created', (data) => resolve(data));
      });
      socketA.emit('room:create');
      const roomData = await roomCreatedPromise;
      const roomCode = roomData.code;
      assert.ok(roomCode, 'Room code should be present');

      // 4. Disconnect Socket A
      socketA.disconnect();

      // Wait a bit to ensure server processes disconnect
      await new Promise(r => setTimeout(r, 100));

      // 5. Connect Socket B (Simulate reconnection)
      // We expect 'game:rejoin' event upon auth
      const socketB = io(`http://localhost:${port}`, {
          forceNew: true,
          reconnection: false
      });

      const rejoinPromise = new Promise((resolve, reject) => {
          socketB.on('game:rejoin', (data) => resolve(data));

          // Timeout if not received
          setTimeout(() => reject(new Error('Timeout waiting for game:rejoin')), 2000);
      });

      socketB.on('connect', () => {
          socketB.emit('auth', { token });
      });

      const rejoinData = await rejoinPromise;

      // 6. Verify Rejoin Data
      assert.strictEqual(rejoinData.code, roomCode, 'Should rejoin the same room');
      assert.ok(rejoinData.room, 'Should contain room state');

      socketB.disconnect();
  });

  await t.test('Test Case 2: Opponent Notification', async () => {
      // 1. Register Two Users with Valid Usernames
      const u1Res = await makeRequest('/api/register', 'POST', { username: 'player1', password: 'password123' });
      const u2Res = await makeRequest('/api/register', 'POST', { username: 'player2', password: 'password123' });

      const token1 = u1Res.body.token;
      const token2 = u2Res.body.token;

      assert.ok(token1, 'Token 1 should be present');
      assert.ok(token2, 'Token 2 should be present');

      // 2. Connect Both Sockets
      const { socket: s1 } = await createSocket(token1, port);
      const { socket: s2 } = await createSocket(token2, port);

      // 3. P1 Creates Room
      const roomCreatedPromise = new Promise(resolve => s1.once('room:created', resolve));
      s1.emit('room:create');
      const { code } = await roomCreatedPromise;

      // 4. P2 Joins Room
      const joinPromise = new Promise(resolve => s2.once('room:joined', resolve));
      s2.emit('room:join', { code });
      await joinPromise;

      // 5. P1 Disconnects
      // P2 should verify 'game:opponent-disconnected' (server sends this in grace period logic)
      const disconnectPromise = new Promise(resolve => s2.once('game:opponent-disconnected', resolve));
      s1.disconnect();

      const discEvent = await disconnectPromise;
      assert.ok(discEvent.key, 'Should receive opponent key');

      // 6. P1 Reconnects
      // P2 should receive 'game:opponent-reconnected'
      const reconnectPromise = new Promise(resolve => s2.once('game:opponent-reconnected', resolve));

      const s1_new = io(`http://localhost:${port}`, { forceNew: true, reconnection: false });
      s1_new.on('connect', () => {
          s1_new.emit('auth', { token: token1 });
      });

      const recEvent = await reconnectPromise;
      assert.strictEqual(recEvent.name, 'player1', 'Should receive opponent name');

      s1_new.disconnect();
      s2.disconnect();
  });
});
