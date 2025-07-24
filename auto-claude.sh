#!/bin/bash

# Auto-Claude Script for Spacepunk Development
# Runs Claude Code continuously and sends "keep going" every 10 minutes
# Accepts responses every 10 seconds
#
# Usage: ./auto-claude.sh [test]
#   test  - Run in test mode (shorter intervals, limited duration)

set -e

# Configuration
TEST_MODE="${1:-}"
if [ "$TEST_MODE" = "test" ]; then
    KEEP_GOING_INTERVAL=30  # 30 seconds in test mode
    ENTER_INTERVAL=3        # 3 seconds in test mode
    echo "Running in TEST MODE (shortened intervals)"
else
    KEEP_GOING_INTERVAL=600 # 10 minutes in normal mode
    ENTER_INTERVAL=10       # 10 seconds in normal mode
fi

LOG_FILE="auto-claude-$(date +%Y%m%d-%H%M%S).log"
CLAUDE_INPUT_FIFO="/tmp/claude_input_$$"

echo "Starting Auto-Claude for Spacepunk development..."
echo "Log file: $LOG_FILE"
echo "Press Ctrl+C to stop"

# Pre-flight checks
if ! command -v claude &> /dev/null; then
    echo "ERROR: 'claude' command not found. Please install Claude CLI."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: 'node' command not found. Please install Node.js."
    exit 1
fi

if [ ! -f "test-client.js" ]; then
    echo "ERROR: test-client.js not found. Please run from spacepunk-logi directory."
    exit 1
fi

# Create named pipe for sending input to Claude
if ! mkfifo "$CLAUDE_INPUT_FIFO" 2>/dev/null; then
    echo "ERROR: Failed to create FIFO pipe at $CLAUDE_INPUT_FIFO"
    exit 1
fi

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    rm -f "$CLAUDE_INPUT_FIFO"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Function to send "keep going" every 10 minutes
send_keep_going() {
    while true; do
        sleep $KEEP_GOING_INTERVAL
        
        # Check for kill switch file
        if [ -f "STOP_AUTO_CLAUDE" ]; then
            echo "[$(date)] Kill switch found - stopping auto-claude" | tee -a "$LOG_FILE"
            cleanup
        fi
        
        echo "Create a minimalist Snow Crash fan site with Swiss design principles. Use clean typography, minimal colors, and focus on the cyberpunk themes from Neal Stephenson's novel." > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] Sent Snow Crash fan site request" | tee -a "$LOG_FILE"
    done
}

# Function to send Enter key every 10 seconds
send_enter() {
    # First, send down-arrow + enter for the permissions prompt
    sleep 2
    printf '\e[B' > "$CLAUDE_INPUT_FIFO"  # Down arrow key
    echo "[$(date)] Sent down-arrow for permissions" | tee -a "$LOG_FILE"
    sleep 1
    echo "" > "$CLAUDE_INPUT_FIFO"        # Enter key
    echo "[$(date)] Sent Enter for permissions acceptance" | tee -a "$LOG_FILE"
    
    # Then continue with regular Enter keys
    while true; do
        sleep $ENTER_INTERVAL
        echo "" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] Sent Enter key" | tee -a "$LOG_FILE"
    done
}

# Start background processes
send_keep_going &
KEEP_GOING_PID=$!

send_enter &
ENTER_PID=$!

echo "Started background processes:"
echo "  Keep going sender: PID $KEEP_GOING_PID"
echo "  Enter key sender: PID $ENTER_PID"
echo "  Input FIFO: $CLAUDE_INPUT_FIFO"

# Start Claude Code with input from our FIFO
echo "[$(date)] Starting Claude Code..." | tee -a "$LOG_FILE"

# Main loop - restart Claude if it exits
while true; do
    echo "[$(date)] Launching Claude Code..." | tee -a "$LOG_FILE"
    
    # Start Claude Code with our input pipe and dangerous permissions flag
    claude code --dangerously-skip-permissions < "$CLAUDE_INPUT_FIFO" 2>&1 | tee -a "$LOG_FILE"
    
    CLAUDE_EXIT_CODE=$?
    echo "[$(date)] Claude Code exited with code $CLAUDE_EXIT_CODE" | tee -a "$LOG_FILE"
    
    # If exit was clean (Ctrl+C), don't restart
    if [ $CLAUDE_EXIT_CODE -eq 130 ]; then
        echo "[$(date)] Clean exit detected, stopping..." | tee -a "$LOG_FILE"
        break
    fi
    
    echo "[$(date)] Restarting in 5 seconds..." | tee -a "$LOG_FILE"
    sleep 5
done