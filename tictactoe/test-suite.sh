#!/bin/bash

echo "🧪 Comprehensive Testing Suite"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Start server
echo "📦 Starting server..."
cd "$(dirname "$0")"
npm start > /tmp/test-server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test counter
PASSED=0
FAILED=0

# Test function
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "http://localhost:3000$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s "http://localhost:3000$endpoint")
    fi
    
    if echo "$response" | grep -Fq "$expected"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((FAILED++))
    fi
}

echo ""
echo "🔐 Authentication Tests"
echo "----------------------"

# Test 1: Register new user
test_api "Register new user" "POST" "/api/register" \
    '{"username":"testuser999","password":"password123"}' \
    '"ok":true'

# Test 2: Duplicate username
test_api "Reject duplicate username" "POST" "/api/register" \
    '{"username":"testuser999","password":"password123"}' \
    '"error":"Username already taken"'

# Test 3: Short password
test_api "Reject short password" "POST" "/api/register" \
    '{"username":"newuser999","password":"pass"}' \
    '"error":"Password min 8 characters"'

# Test 4: Short username
test_api "Reject short username" "POST" "/api/register" \
    '{"username":"ab","password":"password123"}' \
    '"error":"Username too short"'

# Test 5: Invalid characters
test_api "Reject invalid characters" "POST" "/api/register" \
    '{"username":"test@user","password":"password123"}' \
    '"error":"Letters, numbers, underscores only"'

# Test 6: Login with correct credentials
test_api "Login with correct credentials" "POST" "/api/login" \
    '{"username":"testuser999","password":"password123"}' \
    '"ok":true'

# Test 7: Login with wrong password
test_api "Reject wrong password" "POST" "/api/login" \
    '{"username":"testuser999","password":"wrongpass"}' \
    '"error":"Incorrect password"'

# Test 8: Login non-existent user
test_api "Reject non-existent user" "POST" "/api/login" \
    '{"username":"nonexistent","password":"password123"}' \
    '"error":"User not found"'

echo ""
echo "📊 API Tests"
echo "------------"

# Test 9: Health check
test_api "Health check endpoint" "GET" "/health" "" \
    '"status":"ok"'

# Test 10: Leaderboard
test_api "Leaderboard endpoint" "GET" "/api/leaderboard" "" \
    '['

echo ""
echo "📈 Results"
echo "=========="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

# Cleanup
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
