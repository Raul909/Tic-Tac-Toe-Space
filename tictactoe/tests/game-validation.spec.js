const { test, expect } = require('@playwright/test');

test.use({ channel: 'chrome' });

test.describe('Game Move Validation', () => {
  let user1, user2, user3;
  let roomCode;

  test.beforeAll(async ({ request }) => {
    // Helper to register a user via API
    const registerUser = async (name) => {
      const res = await request.post('http://localhost:3000/api/register', {
        data: { username: name, password: 'password123' }
      });
      const data = await res.json();
      if (!res.ok()) {
          console.error(`Registration failed for ${name}:`, data);
          throw new Error(`Registration failed: ${JSON.stringify(data)}`);
      }
      return { token: data.token, name };
    };

    // Create 3 users once for all tests to avoid rate limits
    const suffix = Math.floor(Math.random() * 1000000);
    user1 = await registerUser(`p1_${suffix}`);
    user2 = await registerUser(`p2_${suffix}`);
    user3 = await registerUser(`p3_${suffix}`);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app to load scripts
    await page.goto('http://localhost:3000');

    // Setup sockets in browser context
    await page.evaluate(async (users) => {
      window.sockets = {};

      const connectSocket = (token, name) => {
        return new Promise((resolve, reject) => {
          const socket = io(); // Connects to same origin
          socket.on('connect', () => {
            socket.emit('auth', { token });
          });
          socket.on('auth:ok', () => {
            window.sockets[name] = socket;
            resolve(socket);
          });
          socket.on('auth:error', (err) => reject(err));
        });
      };

      await connectSocket(users[0].token, 'p1');
      await connectSocket(users[1].token, 'p2');
      await connectSocket(users[2].token, 'p3');

      // Helper to listen for events once
      window.waitForEvent = (socketName, event) => {
        return new Promise(resolve => {
          window.sockets[socketName].once(event, resolve);
        });
      };

      // Helper to listen for error
      window.waitForError = (socketName) => {
        return new Promise(resolve => {
            window.sockets[socketName].once('game:error', resolve);
        });
      };

      // Helper to emit event
      window.emitEvent = (socketName, event, data) => {
        window.sockets[socketName].emit(event, data);
      };
    }, [user1, user2, user3]);

    // Create room with P1
    roomCode = await page.evaluate(async () => {
      window.emitEvent('p1', 'room:create');
      const data = await window.waitForEvent('p1', 'room:created');
      return data.code;
    });
    console.log(`Test Room Created: ${roomCode}`);

    // Join room with P2
    await page.evaluate(async (code) => {
      window.emitEvent('p2', 'room:join', { code });
      await window.waitForEvent('p2', 'room:joined');
    }, roomCode);
  });

  test('should prevent moving out of turn', async ({ page }) => {
    // P2 (O) tries to move first (X starts)
    const error = await page.evaluate(async (code) => {
      const errorPromise = window.waitForError('p2');
      window.emitEvent('p2', 'game:move', { code, index: 4 });
      return await errorPromise;
    }, roomCode);

    expect(error).toBe('Not your turn');
  });

  test('should prevent moving to a taken cell', async ({ page }) => {
    // P1 (X) moves to 4 (center)
    await page.evaluate(async (code) => {
      window.emitEvent('p1', 'game:move', { code, index: 4 });
      await window.waitForEvent('p1', 'game:move'); // Wait for broadcast
    }, roomCode);

    // P2 (O) tries to move to 4
    const error = await page.evaluate(async (code) => {
      const errorPromise = window.waitForError('p2');
      window.emitEvent('p2', 'game:move', { code, index: 4 });
      return await errorPromise;
    }, roomCode);

    expect(error).toBe('Cell taken');
  });

  test('should prevent moving in a room user is not in', async ({ page }) => {
    // P3 tries to move in P1/P2's room
    const error = await page.evaluate(async (code) => {
      const errorPromise = window.waitForError('p3');
      window.emitEvent('p3', 'game:move', { code, index: 0 });
      return await errorPromise;
    }, roomCode);

    expect(error).toBe('Not in this room');
  });

  test('should handle invalid index silently (or correctly)', async ({ page }) => {
    // P1 tries to move to index 99
    // The current server code returns silently for invalid index.
    // We verify no game:move event is broadcast.

    const result = await page.evaluate(async (code) => {
      let eventReceived = false;
      const handler = () => { eventReceived = true; };

      // Listen on P1 socket for broadcast
      window.sockets['p1'].on('game:move', handler);

      window.emitEvent('p1', 'game:move', { code, index: 99 });

      // Wait a bit to see if event comes
      await new Promise(r => setTimeout(r, 500));

      window.sockets['p1'].off('game:move', handler);
      return eventReceived;
    }, roomCode);

    expect(result).toBe(false);
  });

  test.afterEach(async ({ page }) => {
      // Clean up sockets
      await page.evaluate(() => {
          Object.values(window.sockets).forEach(s => s.disconnect());
      });
  });
});
