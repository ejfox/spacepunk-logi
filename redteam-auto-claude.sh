#!/bin/bash

# Red Team Testing Script for Auto-Claude
# Tests various failure modes and edge cases

set -e

echo "🔴 RED TEAM: Testing Auto-Claude Script Failure Modes"
echo "=================================================="

# Test 1: Missing dependencies
echo "🧪 Test 1: Testing with missing 'claude' command"
if ! command -v claude &> /dev/null; then
    echo "❌ FAIL: claude command not found (expected for testing)"
else
    echo "✅ PASS: claude command exists"
fi

# Test 2: Disk space issues
echo ""
echo "🧪 Test 2: Testing disk space availability"
AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
echo "Available space: $AVAILABLE_SPACE KB"
if [ "$AVAILABLE_SPACE" -lt 1000000 ]; then
    echo "⚠️  WARN: Low disk space may cause log file issues"
else
    echo "✅ PASS: Sufficient disk space"
fi

# Test 3: Permission issues
echo ""
echo "🧪 Test 3: Testing /tmp directory permissions"
if [ -w /tmp ]; then
    echo "✅ PASS: /tmp is writable"
else
    echo "❌ FAIL: /tmp is not writable - FIFO creation will fail"
fi

# Test 4: FIFO creation stress test
echo ""
echo "🧪 Test 4: Testing FIFO creation/cleanup"
TEST_FIFO="/tmp/redteam_test_$$"
mkfifo "$TEST_FIFO" 2>/dev/null
if [ -p "$TEST_FIFO" ]; then
    echo "✅ PASS: FIFO creation successful"
    rm -f "$TEST_FIFO"
    echo "✅ PASS: FIFO cleanup successful"
else
    echo "❌ FAIL: FIFO creation failed"
fi

# Test 5: Multiple FIFO collision test
echo ""
echo "🧪 Test 5: Testing FIFO name collision scenarios"
FIFO1="/tmp/claude_input_12345"
FIFO2="/tmp/claude_input_12345"
mkfifo "$FIFO1" 2>/dev/null
if mkfifo "$FIFO2" 2>/dev/null; then
    echo "❌ FAIL: Duplicate FIFO creation should have failed"
    rm -f "$FIFO1" "$FIFO2"
else
    echo "✅ PASS: Duplicate FIFO creation properly failed"
    rm -f "$FIFO1"
fi

# Test 6: Signal handling
echo ""
echo "🧪 Test 6: Testing signal handling and cleanup"
cat > /tmp/signal_test.sh << 'EOF'
#!/bin/bash
FIFO="/tmp/signal_test_$$"
mkfifo "$FIFO"
cleanup() {
    rm -f "$FIFO"
    echo "Cleanup completed"
    exit 0
}
trap cleanup EXIT INT TERM
sleep 2 &
wait
EOF
chmod +x /tmp/signal_test.sh

timeout 1 /tmp/signal_test.sh || echo "✅ PASS: Signal handling test completed"
rm -f /tmp/signal_test.sh

# Test 7: Process limits
echo ""
echo "🧪 Test 7: Testing process limit handling"
CURRENT_PROCS=$(ps aux | wc -l)
echo "Current process count: $CURRENT_PROCS"
ulimit -u 2>/dev/null || echo "⚠️  WARN: Cannot check user process limits"

# Test 8: Test client dependency check
echo ""
echo "🧪 Test 8: Testing test-client.js dependencies"
if [ -f "test-client.js" ]; then
    if command -v node &> /dev/null; then
        echo "✅ PASS: Node.js available for test client"
        # Try to load the test client without running it
        node -c test-client.js 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ PASS: test-client.js syntax is valid"
        else
            echo "❌ FAIL: test-client.js has syntax errors"
        fi
    else
        echo "❌ FAIL: Node.js not available - test client will fail"
    fi
else
    echo "❌ FAIL: test-client.js not found"
fi

# Test 9: Network connectivity for test client
echo ""
echo "🧪 Test 9: Testing network connectivity for test client"
if curl -s -f http://localhost:3666/api/game-status >/dev/null 2>&1; then
    echo "✅ PASS: Game server is responding"
else
    echo "⚠️  WARN: Game server not responding - test client will fail"
fi

# Test 10: Database accessibility
echo ""
echo "🧪 Test 10: Testing database accessibility"
if [ -f "server/db/spacepunk.db" ]; then
    if command -v sqlite3 &> /dev/null; then
        if sqlite3 server/db/spacepunk.db "SELECT 1;" >/dev/null 2>&1; then
            echo "✅ PASS: Database is accessible"
        else
            echo "❌ FAIL: Database is corrupted or locked"
        fi
    else
        echo "⚠️  WARN: sqlite3 not available - database validation will fail"
    fi
else
    echo "❌ FAIL: Database file not found"
fi

# Test 11: Log file creation stress test
echo ""
echo "🧪 Test 11: Testing log file creation and rotation"
TEST_LOG="test-$(date +%Y%m%d-%H%M%S).log"
echo "Test log entry" > "$TEST_LOG"
if [ -f "$TEST_LOG" ]; then
    echo "✅ PASS: Log file creation successful"
    rm -f "$TEST_LOG"
else
    echo "❌ FAIL: Log file creation failed"
fi

# Test 12: Background process management
echo ""
echo "🧪 Test 12: Testing background process spawning and cleanup"
sleep 10 &
SLEEP_PID=$!
if kill -0 $SLEEP_PID 2>/dev/null; then
    echo "✅ PASS: Background process spawned successfully"
    kill $SLEEP_PID 2>/dev/null
    echo "✅ PASS: Background process cleanup successful"
else
    echo "❌ FAIL: Background process management failed"
fi

# Test 13: Resource usage simulation
echo ""
echo "🧪 Test 13: Testing resource usage patterns"
# Simulate the FIFO usage pattern
TEST_FIFO="/tmp/resource_test_$$"
mkfifo "$TEST_FIFO"

# Background process that reads from FIFO
cat "$TEST_FIFO" > /dev/null &
READER_PID=$!

# Test writing to FIFO
echo "test message" > "$TEST_FIFO" &
echo "another message" > "$TEST_FIFO" &

sleep 1
kill $READER_PID 2>/dev/null
rm -f "$TEST_FIFO"
echo "✅ PASS: Resource usage simulation completed"

echo ""
echo "🔴 RED TEAM TESTING COMPLETE"
echo "=========================="
echo "Review any FAIL or WARN messages above before running auto-claude.sh"