#!/bin/bash

# Overnight Auto-Claude Script for Spacepunk GitHub Issue Development
# Optimized for autonomous GitHub workflow with issue tracking

set -e

# Configuration for overnight run
KEEP_GOING_INTERVAL=1800  # 30 minutes between cycles (gives time for substantial work)
ENTER_INTERVAL=15         # 15 seconds between enters (less aggressive)

LOG_FILE="overnight-claude-$(date +%Y%m%d-%H%M%S).log"
CLAUDE_INPUT_FIFO="/tmp/claude_input_$$"
OVERNIGHT_REQUEST_FILE="OVERNIGHT_REQUEST.txt"

echo "🌙 Starting Overnight Auto-Claude for Spacepunk Development..."
echo "📋 Will work on GitHub issues autonomously"
echo "📊 Log file: $LOG_FILE"
echo "⏰ 30-minute cycles, 15-second enters"
echo "🛑 Press Ctrl+C or 'touch STOP_AUTO_CLAUDE' to stop"

# Pre-flight checks
if ! command -v claude &> /dev/null; then
    echo "❌ ERROR: 'claude' command not found. Please install Claude CLI."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ ERROR: 'gh' command not found. Please install GitHub CLI."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ ERROR: 'node' command not found. Please install Node.js."
    exit 1
fi

if [ ! -f "$OVERNIGHT_REQUEST_FILE" ]; then
    echo "❌ ERROR: $OVERNIGHT_REQUEST_FILE not found."
    exit 1
fi

if [ ! -f "test-client.js" ]; then
    echo "❌ ERROR: test-client.js not found. Please run from spacepunk-logi directory."
    exit 1
fi

# Check GitHub auth
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ ERROR: GitHub CLI not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Create named pipe for sending input to Claude
if ! mkfifo "$CLAUDE_INPUT_FIFO" 2>/dev/null; then
    echo "❌ ERROR: Failed to create FIFO pipe at $CLAUDE_INPUT_FIFO"
    exit 1
fi

echo "✅ All pre-flight checks passed!"

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up overnight session..."
    rm -f "$CLAUDE_INPUT_FIFO"
    kill $(jobs -p) 2>/dev/null || true
    echo "📊 Check $LOG_FILE for complete session log"
    echo "🎯 Run 'gh pr list' to see created pull requests"
    exit 0
}

trap cleanup EXIT INT TERM

# Function to send overnight request, then "keep going"
send_requests() {
    # Send initial overnight request
    OVERNIGHT_REQUEST=$(cat "$OVERNIGHT_REQUEST_FILE")
    echo "$OVERNIGHT_REQUEST" > "$CLAUDE_INPUT_FIFO"
    echo "[$(date)] 🚀 Sent overnight development request" | tee -a "$LOG_FILE"
    
    # Wait for initial work period
    sleep $KEEP_GOING_INTERVAL
    
    # Then send "keep going" with specific guidance
    CYCLE=1
    while true; do
        # Check for kill switch file
        if [ -f "STOP_AUTO_CLAUDE" ]; then
            echo "[$(date)] 🛑 Kill switch found - stopping overnight session" | tee -a "$LOG_FILE"
            cleanup
        fi
        
        echo "keep going with the next GitHub issue. Check 'gh issue list', pick an issue, create a branch, implement it, test with 'node test-client.js full', commit, and create a PR. Cycle #$CYCLE" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] 🔄 Sent cycle #$CYCLE continuation request" | tee -a "$LOG_FILE"
        
        CYCLE=$((CYCLE + 1))
        sleep $KEEP_GOING_INTERVAL
    done
}

# Function to send Enter key every interval
send_enter() {
    # First, send down-arrow + enter for the permissions prompt
    sleep 3
    printf '\e[B' > "$CLAUDE_INPUT_FIFO"  # Down arrow key
    echo "[$(date)] ⬇️  Sent down-arrow for permissions" | tee -a "$LOG_FILE"
    sleep 2
    echo "" > "$CLAUDE_INPUT_FIFO"        # Enter key
    echo "[$(date)] ✅ Sent Enter for permissions acceptance" | tee -a "$LOG_FILE"
    
    # Then continue with regular Enter keys
    while true; do
        sleep $ENTER_INTERVAL
        echo "" > "$CLAUDE_INPUT_FIFO"
        echo "[$(date)] ⏎  Sent Enter key" | tee -a "$LOG_FILE"
    done
}

# Start background processes
send_requests &
REQUESTS_PID=$!

send_enter &
ENTER_PID=$!

echo ""
echo "🎛️  Started background processes:"
echo "   🔄 Request cycle sender: PID $REQUESTS_PID"
echo "   ⏎  Enter key sender: PID $ENTER_PID"
echo "   🔗 Input FIFO: $CLAUDE_INPUT_FIFO"
echo ""

# Log current repo state
echo "[$(date)] 📊 Current repo state:" | tee -a "$LOG_FILE"
echo "[$(date)] Branch: $(git branch --show-current)" | tee -a "$LOG_FILE"
echo "[$(date)] Open issues: $(gh issue list | wc -l | tr -d ' ')" | tee -a "$LOG_FILE"
echo "[$(date)] Open PRs: $(gh pr list | wc -l | tr -d ' ')" | tee -a "$LOG_FILE"

# Start Claude Code with input from our FIFO
echo "[$(date)] 🤖 Starting Claude Code for overnight development..." | tee -a "$LOG_FILE"

# Main loop - restart Claude if it exits
while true; do
    echo "[$(date)] 🚀 Launching Claude Code..." | tee -a "$LOG_FILE"
    
    # Start Claude Code with our input pipe and dangerous permissions flag
    claude code --dangerously-skip-permissions < "$CLAUDE_INPUT_FIFO" 2>&1 | tee -a "$LOG_FILE"
    
    CLAUDE_EXIT_CODE=$?
    echo "[$(date)] 🔄 Claude Code exited with code $CLAUDE_EXIT_CODE" | tee -a "$LOG_FILE"
    
    # If exit was clean (Ctrl+C), don't restart
    if [ $CLAUDE_EXIT_CODE -eq 130 ]; then
        echo "[$(date)] 🛑 Clean exit detected, stopping overnight session..." | tee -a "$LOG_FILE"
        break
    fi
    
    echo "[$(date)] 🔄 Restarting Claude in 10 seconds..." | tee -a "$LOG_FILE"
    sleep 10
done