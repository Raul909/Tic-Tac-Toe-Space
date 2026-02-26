const { io } = require("socket.io-client");

const SOCKET_URL = "http://localhost:3000";

async function runTest() {
    console.log('--- Rate Limit Test ---');

    const socket = io(SOCKET_URL);

    let rateLimitErrors = 0;

    socket.on('connect', () => {
        console.log('Connected');
        startSpam(socket);
    });

    socket.on('error', (msg) => {
        if (typeof msg === 'string' && msg.includes('Rate limit exceeded')) {
            rateLimitErrors++;
        }
    });

    function startSpam(socket) {
        const count = 20;
        console.log(`Spamming ${count} 'chat:msg' events...`);
        for (let i = 0; i < count; i++) {
            socket.emit('chat:msg', { code: 'TEST', text: 'spam' });
        }

        // Allow some time for responses
        setTimeout(() => {
            console.log(`Rate limit errors caught: ${rateLimitErrors}`);

            // Limit is 5 per second. 20 sent. Should get ~15 errors.
            if (rateLimitErrors > 5) {
                console.log('✅ PASS: Rate limiting blocked excess events.');

                // Test Reset
                console.log('Waiting 1.5s for rate limit window to reset...');
                setTimeout(() => {
                     testReset(socket);
                }, 1500);
            } else {
                console.log('❌ FAIL: Not enough rate limit errors received. Got ' + rateLimitErrors);
                process.exit(1);
            }
        }, 1000);
    }

    function testReset(socket) {
        const initialErrors = rateLimitErrors;
        console.log('Sending 1 valid event...');
        socket.emit('chat:msg', { code: 'TEST', text: 'valid' });

        setTimeout(() => {
            if (rateLimitErrors === initialErrors) {
                console.log('✅ PASS: Rate limit reset after window.');
                process.exit(0);
            } else {
                console.log('❌ FAIL: Received rate limit error after window reset.');
                process.exit(1);
            }
        }, 500);
    }
}

runTest();
