#!/bin/bash

# Resilient Auto-Claude Script with Detailed Logging and Safety Features
# Version 2.0 - Addresses zombie process and silent failure issues

set -e

# Configuration
TEST_MODE="${1:-}"
if [ "$TEST_MODE" = "test" ]; then
    KEEP_GOING_INTERVAL=120   # 2 minutes in test mode
    ENTER_INTERVAL=5          # 5 seconds in test mode
    MAX_CYCLES=5              # Limited cycles for testing
    echo "🧪 Running in TEST MODE (2-minute cycles, max 5 cycles)"
else
    KEEP_GOING_INTERVAL=1800  # 30 minutes in normal mode
    ENTER_INTERVAL=15         # 15 seconds in normal mode
    MAX_CYCLES=999            # Unlimited in normal mode
fi

LOG_FILE="resilient-claude-$(date +%Y%m%d-%H%M%S).log"
CLAUDE_INPUT_FIFO="/tmp/resilient_claude_input_$$"
CLAUDE_OUTPUT_LOG="claude-output-$(date +%Y%m%d-%H%M%S).log"
HEARTBEAT_FILE="/tmp/claude_heartbeat_$$"
PROGRESS_FILE="/tmp/claude_progress_$$"

# Logging with levels
log() {
    local level="$1"
    local message="$2"
    local timestamp="[$(date '+%Y-%m-%d %H:%M:%S')]"
    echo "$timestamp [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }
log_success() { log "SUCCESS" "$1"; }

echo "🛡️  Starting Resilient Auto-Claude System"
echo "📊 Log file: $LOG_FILE"
echo "🔍 Output log: $CLAUDE_OUTPUT_LOG"
echo "⏱️  Heartbeat monitoring enabled"
echo "🛑 Press Ctrl+C or 'touch STOP_AUTO_CLAUDE' to stop"

# Enhanced pre-flight checks
log_info "Running enhanced pre-flight checks..."

check_command() {
    local cmd="$1"
    if command -v "$cmd" &> /dev/null; then
        log_success "$cmd is available"
    else
        log_error "$cmd not found"
        exit 1
    fi
}

for cmd in claude node gh git; do
    check_command "$cmd"
done

# Check GitHub auth
if gh auth status >/dev/null 2>&1; then
    log_success "GitHub CLI authenticated"
else
    log_error "GitHub CLI not authenticated - run 'gh auth login'"
    exit 1
fi

# Check required files
for file in OVERNIGHT_REQUEST.txt claude.md test-client.js; do
    if [ -f "$file" ]; then
        log_success "$file exists"
    else
        log_error "$file missing"
        exit 1
    fi
done

# Create FIFO with error handling
if mkfifo "$CLAUDE_INPUT_FIFO" 2>/dev/null; then
    log_success "Created FIFO pipe: $CLAUDE_INPUT_FIFO"
else
    log_error "Failed to create FIFO pipe"
    exit 1
fi

# Initialize tracking files
echo "0" > "$HEARTBEAT_FILE"
echo "0" > "$PROGRESS_FILE"

# Enhanced cleanup function
cleanup() {
    log_info "Starting enhanced cleanup..."
    
    # Kill all child processes
    if jobs -p > /dev/null 2>&1; then
        log_info "Killing background processes: $(jobs -p | tr '\n' ' ')"
        kill $(jobs -p) 2>/dev/null || true
    fi
    
    # Clean up files
    rm -f "$CLAUDE_INPUT_FIFO" "$HEARTBEAT_FILE" "$PROGRESS_FILE"
    
    # Final log stats
    local total_lines=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
    local errors=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")
    local successes=$(grep -c "SUCCESS" "$LOG_FILE" 2>/dev/null || echo "0")
    
    log_info "Session complete - Lines logged: $total_lines, Errors: $errors, Successes: $successes"
    echo "📊 Check logs: $LOG_FILE and $CLAUDE_OUTPUT_LOG"
    exit 0
}

trap cleanup EXIT INT TERM

# Function to detect if Claude is actually responding
check_claude_heartbeat() {
    local current_time=$(date +%s)
    local last_heartbeat=$(cat "$HEARTBEAT_FILE" 2>/dev/null || echo "0")
    local heartbeat_age=$((current_time - last_heartbeat))
    
    # Check if files have been modified recently (sign of activity)
    local recent_activity=false
    
    # Check for recent git activity
    if [ -d ".git" ]; then
        local git_activity=$(git log --since="5 minutes ago" --oneline | wc -l)
        if [ "$git_activity" -gt 0 ]; then
            recent_activity=true
            log_success "Detected recent git activity"
        fi
    fi
    
    # Check for recent file modifications
    local recent_files=$(find . -name "*.js" -o -name "*.vue" -o -name "*.ts" -o -name "*.html" -mmin -5 2>/dev/null | wc -l)
    if [ "$recent_files" -gt 0 ]; then
        recent_activity=true
        log_success "Detected recent file modifications: $recent_files files"
    fi
    
    if [ "$recent_activity" = true ]; then
        echo "$current_time" > "$HEARTBEAT_FILE"
        return 0
    else
        log_warn "No recent activity detected (last heartbeat: ${heartbeat_age}s ago)"
        return 1
    fi
}

# Function to send requests with validation
send_requests() {
    local cycle=0
    
    # Send initial overnight request
    OVERNIGHT_REQUEST=$(cat "OVERNIGHT_REQUEST.txt")
    echo "$OVERNIGHT_REQUEST" > "$CLAUDE_INPUT_FIFO"
    log_info "Sent initial overnight development request"
    
    # Wait for initial work period
    sleep $KEEP_GOING_INTERVAL
    
    # Cycle through keep going requests
    while [ $cycle -lt $MAX_CYCLES ]; do
        cycle=$((cycle + 1))
        
        # Check for kill switch
        if [ -f "STOP_AUTO_CLAUDE" ]; then
            log_info "Kill switch detected - stopping session"
            cleanup
        fi
        
        # Check Claude heartbeat
        if check_claude_heartbeat; then
            log_success "Claude appears to be active (cycle $cycle)"
        else
            log_warn "Claude appears inactive - continuing anyway (cycle $cycle)"
        fi
        
        # Send keep going request with context
        local keep_going_msg="keep going with GitHub issue development. Run 'gh issue list', pick an issue, create a branch, implement it, test with 'node test-client.js health', commit, and create a PR. Cycle #$cycle of $MAX_CYCLES"
        echo "$keep_going_msg" > "$CLAUDE_INPUT_FIFO"
        log_info "Sent cycle #$cycle keep going request"
        
        # Update progress
        echo "$cycle" > "$PROGRESS_FILE"
        
        # Wait for next cycle
        sleep $KEEP_GOING_INTERVAL
    done
    
    log_info "Completed all $MAX_CYCLES cycles"
}

# Function to send Enter keys with monitoring
send_enter() {
    local enter_count=0
    
    # Handle permissions prompt
    sleep 3
    printf '\e[B' > "$CLAUDE_INPUT_FIFO"
    log_info "Sent down-arrow for permissions"
    sleep 2
    echo "" > "$CLAUDE_INPUT_FIFO"
    log_info "Sent Enter for permissions acceptance"
    
    # Continue with regular Enter keys
    while true; do
        sleep $ENTER_INTERVAL
        echo "" > "$CLAUDE_INPUT_FIFO"
        enter_count=$((enter_count + 1))
        
        # Log enter count every 20 presses to avoid spam
        if [ $((enter_count % 20)) -eq 0 ]; then
            log_info "Sent $enter_count Enter keys total"
        fi
    done
}

# Start background processes
log_info "Starting background processes..."

send_requests &
REQUESTS_PID=$!
log_info "Started request sender: PID $REQUESTS_PID"

send_enter &
ENTER_PID=$!
log_info "Started enter key sender: PID $ENTER_PID"

# Main Claude monitoring loop
log_info "Starting Claude Code with monitoring..."

cycle_count=0
while [ $cycle_count -lt $MAX_CYCLES ]; do
    cycle_count=$((cycle_count + 1))
    
    log_info "Starting Claude Code session #$cycle_count"
    
    # Start Claude with output capture and timeout
    if timeout ${KEEP_GOING_INTERVAL}s claude code --dangerously-skip-permissions < "$CLAUDE_INPUT_FIFO" >> "$CLAUDE_OUTPUT_LOG" 2>&1; then
        log_success "Claude Code completed cycle #$cycle_count successfully"
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_warn "Claude Code cycle #$cycle_count timed out (expected)"
        elif [ $exit_code -eq 130 ]; then
            log_info "Claude Code interrupted (Ctrl+C)"
            break
        else
            log_error "Claude Code exited with code $exit_code"
        fi
    fi
    
    # Brief pause between cycles
    sleep 5
done

log_info "Main monitoring loop completed"