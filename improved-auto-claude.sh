#!/bin/bash

# Improved Auto-Claude Script for Vacation Development
# Usage: ./improved-auto-claude.sh [test]
#   - Reads initial request from INITIAL_REQUEST.txt
#   - Then sends "keep going" every interval

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
INITIAL_REQUEST_FILE="INITIAL_REQUEST.txt"

echo "Starting Auto-Claude for autonomous development..."
echo "Log file: $LOG_FILE"
echo "Press Ctrl+C to stop"

# Pre-flight checks
if ! command -v claude &> /dev/null; then
    echo "ERROR: 'claude' command not found. Please install Claude CLI."
    exit 1
fi

if [ ! -f "$INITIAL_REQUEST_FILE" ]; then
    echo "ERROR: $INITIAL_REQUEST_FILE not found. Create this file with your vacation project request."
    echo "Example content:"
    echo "Work on Spacepunk game development. Focus on improving the crew management system and adding new features based on CLAUDE.md requirements."
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

# Function to send initial request, then "keep going"
send_requests() {
    # Send initial request first
    INITIAL_REQUEST=$(cat "$INITIAL_REQUEST_FILE")
    echo "$INITIAL_REQUEST" > "$CLAUDE_INPUT_FIFO"
    echo "[$(date)] Sent initial request from $INITIAL_REQUEST_FILE" | tee -a "$LOG_FILE"
    
    # Wait for initial request interval
    sleep $KEEP_GOING_INTERVAL
    
    # Then send "keep going" repeatedly
    while true; do
        # Check for kill switch file
        if [ -f "STOP_AUTO_CLAUDE" ]; then
            echo "[$(date)] Kill switch found - stopping auto-claude" | tee -a "$LOG_FILE"
            cleanup
        fi
        
        echo "keep going" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] Sent 'keep going' command" | tee -a "$LOG_FILE"
        
        sleep $KEEP_GOING_INTERVAL
    done
}

# Function to send Enter key every interval
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
send_requests &
REQUESTS_PID=$!

send_enter &
ENTER_PID=$!

echo "Started background processes:"
echo "  Request sender: PID $REQUESTS_PID"
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