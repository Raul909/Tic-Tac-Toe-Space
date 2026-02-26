#!/bin/bash

# Navigate to project root if script is run from tictactoe/
if [ -f "server.js" ]; then
    cd ..
fi

SERVER_PID=""

cleanup() {
    if [ -n "$SERVER_PID" ]; then
        echo "🛑 Stopping server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
    fi
}

trap cleanup EXIT

echo "🚀 Starting server for testing..."
# Start server in background, suppress output but capture PID
cd tictactoe
npm start > /tmp/test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to initialize..."
sleep 5

# Check if server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Server failed to start. Check /tmp/test-server.log"
    cat /tmp/test-server.log
    SERVER_PID="" # Don't try to kill it if it's dead
    exit 1
fi

echo "🧪 Running validation tests..."
# Run playwright from tictactoe/ directory so it finds node_modules
npx playwright test tests/game-validation.spec.js

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tests passed successfully!"
else
    echo "❌ Tests failed."
fi

exit $EXIT_CODE
