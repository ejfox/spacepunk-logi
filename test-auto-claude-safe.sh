#!/bin/bash

# Safe test of auto-claude functionality without actually running Claude
echo "🧪 Testing auto-claude script safety and functionality..."

# Test 1: Validate script syntax
echo "Testing script syntax..."
if bash -n auto-claude.sh; then
    echo "✅ Script syntax is valid"
else
    echo "❌ Script has syntax errors"
    exit 1
fi

# Test 2: Test FIFO creation
echo "Testing FIFO creation..."
TEST_FIFO="/tmp/test_fifo_$$"
if mkfifo "$TEST_FIFO" 2>/dev/null; then
    echo "✅ FIFO creation works"
    rm -f "$TEST_FIFO"
else
    echo "❌ FIFO creation failed"
    exit 1
fi

# Test 3: Test background process simulation
echo "Testing background process management..."
(
    sleep 2 &
    SLEEP_PID=$!
    if kill -0 $SLEEP_PID 2>/dev/null; then
        echo "✅ Background process spawning works"
        kill $SLEEP_PID 2>/dev/null
    else
        echo "❌ Background process management failed"
    fi
)

# Test 4: Test signal handling
echo "Testing signal handling..."
(
    FIFO="/tmp/signal_test_$$"
    mkfifo "$FIFO"
    
    cleanup() {
        rm -f "$FIFO"
        echo "✅ Signal cleanup works"
        exit 0
    }
    
    trap cleanup EXIT INT TERM
    sleep 1
) || echo "❌ Signal handling failed"

# Test 5: Test permission checks
echo "Testing permission checks..."
if [ -w /tmp ]; then
    echo "✅ /tmp is writable"
else
    echo "❌ /tmp is not writable"
fi

# Test 6: Test command availability
echo "Testing command dependencies..."
commands=("claude" "node")
for cmd in "${commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        echo "✅ $cmd is available"
    else
        echo "⚠️  $cmd is not available (may cause issues)"
    fi
done

# Test 7: Test file dependencies
echo "Testing file dependencies..."
if [ -f "test-client.js" ]; then
    echo "✅ test-client.js exists"
    if node -c test-client.js 2>/dev/null; then
        echo "✅ test-client.js syntax is valid"
    else
        echo "❌ test-client.js has syntax errors"
    fi
else
    echo "❌ test-client.js not found"
fi

echo ""
echo "🧪 Safe testing complete. Script appears ready for use."
echo "To run actual test: ./auto-claude.sh test"
echo "To run for real: ./auto-claude.sh"