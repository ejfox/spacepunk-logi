#!/bin/bash

# Test version of auto-claude script
# Simulates the behavior without running indefinitely

set -e

LOG_FILE="test-auto-claude-$(date +%Y%m%d-%H%M%S).log"
CLAUDE_INPUT_FIFO="/tmp/test_claude_input_$$"

echo "Testing Auto-Claude script functionality..."
echo "Log file: $LOG_FILE"

# Create named pipe for testing
mkfifo "$CLAUDE_INPUT_FIFO"

# Cleanup function
cleanup() {
    echo "Cleaning up test..."
    rm -f "$CLAUDE_INPUT_FIFO"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Test function to simulate sending "keep going"
test_keep_going() {
    for i in {1..3}; do
        sleep 2  # Shortened for testing
        echo "keep going" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] TEST: Sent 'keep going' command #$i" | tee -a "$LOG_FILE"
    done
}

# Test function to simulate sending Enter key
test_enter() {
    for i in {1..10}; do
        sleep 1  # Shortened for testing
        echo "" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] TEST: Sent Enter key #$i" | tee -a "$LOG_FILE"
    done
}

# Start test processes
test_keep_going &
KEEP_GOING_PID=$!

test_enter &
ENTER_PID=$!

echo "Started test processes:"
echo "  Keep going tester: PID $KEEP_GOING_PID"
echo "  Enter key tester: PID $ENTER_PID"
echo "  Input FIFO: $CLAUDE_INPUT_FIFO"

# Simulate Claude by reading from the FIFO for 15 seconds
echo "[$(date)] Starting simulated Claude input reading..." | tee -a "$LOG_FILE"

timeout 15 cat "$CLAUDE_INPUT_FIFO" | while read line; do
    if [ "$line" = "keep going" ]; then
        echo "[$(date)] RECEIVED: 'keep going' command" | tee -a "$LOG_FILE"
    elif [ -z "$line" ]; then
        echo "[$(date)] RECEIVED: Enter key" | tee -a "$LOG_FILE"
    else
        echo "[$(date)] RECEIVED: '$line'" | tee -a "$LOG_FILE"
    fi
done

echo "[$(date)] Test completed successfully!" | tee -a "$LOG_FILE"
echo "Check $LOG_FILE for detailed results"