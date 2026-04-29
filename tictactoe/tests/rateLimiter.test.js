const test = require('node:test');
const assert = require('node:assert');
const rateLimiterInstance = require('../rateLimiter');
const { RateLimiter } = rateLimiterInstance;

test('RateLimiter Specific Event Limits', async (t) => {
    await t.test('should enforce specific limit for room:create (limit: 1)', () => {
        const rl = new RateLimiter();
        const socketId = 'socket-1';

        // First call should be allowed
        assert.strictEqual(rl.check(socketId, 'room:create'), true);
        // Second call should be denied (limit is 1)
        assert.strictEqual(rl.check(socketId, 'room:create'), false);
    });

    await t.test('should enforce specific limit for chat:msg (limit: 5)', () => {
        const rl = new RateLimiter();
        const socketId = 'socket-2';

        for (let i = 0; i < 5; i++) {
            assert.strictEqual(rl.check(socketId, 'chat:msg'), true, `Attempt ${i + 1} should be allowed`);
        }
        assert.strictEqual(rl.check(socketId, 'chat:msg'), false, 'Attempt 6 should be denied');
    });

    await t.test('should enforce global limit (limit: 10)', () => {
        const rl = new RateLimiter();
        const socketId = 'socket-3';

        // Send 10 events that don't hit specific limits but hit global limit
        // 'other:event' has no specific limit
        for (let i = 0; i < 10; i++) {
            assert.strictEqual(rl.check(socketId, 'other:event'), true, `Attempt ${i + 1} should be allowed`);
        }
        assert.strictEqual(rl.check(socketId, 'other:event'), false, 'Attempt 11 should be denied');
    });

    await t.test('should allow different sockets to have independent limits', () => {
        const rl = new RateLimiter();
        const socket1 = 'socket-1';
        const socket2 = 'socket-2';

        // Socket 1 exhausts its room:create limit
        assert.strictEqual(rl.check(socket1, 'room:create'), true);
        assert.strictEqual(rl.check(socket1, 'room:create'), false);

        // Socket 2 should still be allowed
        assert.strictEqual(rl.check(socket2, 'room:create'), true);
    });

    await t.test('should reset limits after window expires', (t) => {
        let currentTime = 1000000;
        t.mock.method(Date, 'now', () => currentTime);

        const rl = new RateLimiter();
        const socketId = 'socket-4';

        assert.strictEqual(rl.check(socketId, 'room:create'), true);
        assert.strictEqual(rl.check(socketId, 'room:create'), false);

        // Advance time by 1001ms
        currentTime += 1001;

        assert.strictEqual(rl.check(socketId, 'room:create'), true, 'Should be allowed after window reset');
    });
});
