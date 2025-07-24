#!/bin/bash

# Production Auto-Claude for Week-Long Autonomous Operation
# macOS-compatible with proper timeout handling and robust process management

set -e

# Configuration
TEST_MODE="${1:-}"
if [ "$TEST_MODE" = "test" ]; then
    WORK_DURATION=300        # 5 minutes per cycle in test mode
    CYCLE_DELAY=60           # 1 minute between cycles
    MAX_CYCLES=3             # Limited cycles for testing
    echo "🧪 TEST MODE: 5-minute cycles, 1-minute delays, max 3 cycles"
else
    WORK_DURATION=1800       # 30 minutes per cycle in production
    CYCLE_DELAY=300          # 5 minutes between cycles  
    MAX_CYCLES=672           # ~1 week (30min work + 5min delay = 35min * 672 = 392 hours)
    echo "🚀 PRODUCTION MODE: 30-minute cycles, 5-minute delays, ~1 week runtime"
fi

# File paths
BASE_DIR="$(pwd)"
LOG_DIR="$BASE_DIR/logs"
SESSION_ID="$(date +%Y%m%d-%H%M%S)"
MAIN_LOG="$LOG_DIR/auto-claude-$SESSION_ID.log"
CLAUDE_LOG="$LOG_DIR/claude-output-$SESSION_ID.log"
PROGRESS_LOG="$LOG_DIR/progress-$SESSION_ID.json"
PID_FILE="$LOG_DIR/auto-claude.pid"

# Create logs directory
mkdir -p "$LOG_DIR"

# Logging with timestamps and levels
log() {
    local level="$1"
    local message="$2"
    local timestamp="[$(date '+%Y-%m-%d %H:%M:%S')]"
    echo "$timestamp [$level] $message" | tee -a "$MAIN_LOG"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }
log_success() { log "SUCCESS" "$1"; }

# Progress tracking
update_progress() {
    local cycle="$1"
    local status="$2"
    local details="$3"
    cat > "$PROGRESS_LOG" << EOF
{
  "session_id": "$SESSION_ID",
  "current_cycle": $cycle,
  "max_cycles": $MAX_CYCLES,
  "status": "$status",
  "details": "$details",
  "last_update": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "runtime_hours": $(echo "scale=2; $cycle * 35 / 60" | bc -l 2>/dev/null || echo "0")
}
EOF
}

# macOS-compatible timeout function
mac_timeout() {
    local duration="$1"
    shift
    local command="$@"
    
    # Start command in background
    $command &
    local cmd_pid=$!
    
    # Start timeout watcher in background
    (
        sleep "$duration"
        if kill -0 "$cmd_pid" 2>/dev/null; then
            log_warn "Command timed out after ${duration}s, killing PID $cmd_pid"
            kill "$cmd_pid" 2>/dev/null
        fi
    ) &
    local watcher_pid=$!
    
    # Wait for command to complete
    if wait "$cmd_pid" 2>/dev/null; then
        # Command completed successfully, kill the watcher
        kill "$watcher_pid" 2>/dev/null
        return 0
    else
        local exit_code=$?
        # Command failed or was killed
        kill "$watcher_pid" 2>/dev/null
        return $exit_code
    fi
}

# Enhanced pre-flight checks
run_preflight_checks() {
    log_info "Running comprehensive pre-flight checks..."
    
    # Check required commands
    for cmd in claude node gh git bc; do
        if command -v "$cmd" &> /dev/null; then
            log_success "$cmd is available"
        else
            log_error "$cmd not found"
            if [ "$cmd" = "bc" ]; then
                log_info "Install bc with: brew install bc"
            fi
            exit 1
        fi
    done
    
    # Check GitHub authentication
    if gh auth status >/dev/null 2>&1; then
        log_success "GitHub CLI authenticated"
    else
        log_error "GitHub CLI not authenticated - run 'gh auth login'"
        exit 1
    fi
    
    # Check required files
    local required_files=("OVERNIGHT_REQUEST.txt" "claude.md" "test-client.js")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "$file exists"
        else
            log_error "$file missing"
            exit 1
        fi
    done
    
    # Check disk space (need at least 1GB for logs)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 1000000 ]; then
        log_warn "Low disk space: ${available_space}KB available"
    else
        log_success "Sufficient disk space: ${available_space}KB available"
    fi
    
    # Check current git status
    local uncommitted=$(git status --porcelain | wc -l | tr -d ' ')
    if [ "$uncommitted" -gt 0 ]; then
        log_warn "$uncommitted uncommitted changes detected"
    else
        log_success "Git working directory clean"
    fi
    
    # Check open issues
    local open_issues=$(gh issue list | wc -l | tr -d ' ')
    log_info "Found $open_issues open GitHub issues to work on"
    
    log_success "All pre-flight checks passed"
}

# Smart activity detection
check_activity() {
    local since_minutes="$1"
    local activity_detected=false
    
    # Check for recent git commits
    local recent_commits=$(git log --since="${since_minutes} minutes ago" --oneline | wc -l)
    if [ "$recent_commits" -gt 0 ]; then
        log_success "Detected $recent_commits recent git commits"
        activity_detected=true
    fi
    
    # Check for recently modified files
    local recent_files=$(find . -name "*.js" -o -name "*.vue" -o -name "*.ts" -o -name "*.html" -o -name "*.sql" -mmin -"$since_minutes" 2>/dev/null | wc -l)
    if [ "$recent_files" -gt 0 ]; then
        log_success "Detected $recent_files recently modified files"
        activity_detected=true
    fi
    
    # Check for new/modified branches
    local recent_branches=$(git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | awk -v since="$(date -v -${since_minutes}M +%s)" '$2 > since' | wc -l 2>/dev/null || echo "0")
    if [ "$recent_branches" -gt 0 ]; then
        log_success "Detected $recent_branches recently active branches"
        activity_detected=true
    fi
    
    if [ "$activity_detected" = true ]; then
        return 0
    else
        log_warn "No development activity detected in last $since_minutes minutes"
        return 1
    fi
}

# Main execution cycle
run_claude_cycle() {
    local cycle="$1"
    
    log_info "Starting development cycle $cycle/$MAX_CYCLES"
    update_progress "$cycle" "starting" "Beginning new development cycle"
    
    # Prepare the request
    local request
    if [ "$cycle" -eq 1 ]; then
        request=$(cat "OVERNIGHT_REQUEST.txt")
        log_info "Sending initial overnight development request"
    else
        request="keep going with GitHub issue development. Run 'gh issue list', pick the next logical issue, create a branch, implement it, test with 'node test-client.js health', commit, and create a PR. This is cycle $cycle of $MAX_CYCLES."
        log_info "Sending continuation request for cycle $cycle"
    fi
    
    # Execute Claude with timeout and output capture
    local claude_success=false
    update_progress "$cycle" "working" "Claude is actively developing"
    
    # Use a simple approach: pipe the request plus continuous input
    (
        echo "$request"
        echo ""  # Extra newline
        # Keep the session alive with periodic input
        while true; do
            sleep 10
            echo ""  # Send Enter key
            sleep 50
            echo "keep going"
        done
    ) | mac_timeout "$WORK_DURATION" claude code --dangerously-skip-permissions >> "$CLAUDE_LOG" 2>&1
    
    if [ $? -eq 0 ] || [ $? -eq 143 ] || [ $? -eq 15 ]; then
        log_success "Claude cycle $cycle completed successfully"
        claude_success=true
    else
        local exit_code=$?
        if [ $exit_code -eq 143 ] || [ $exit_code -eq 15 ]; then
            log_info "Claude cycle $cycle timed out (expected after ${WORK_DURATION}s)"
            claude_success=true  # Timeout is expected, not a failure
        else
            log_error "Claude cycle $cycle failed with exit code $exit_code"
        fi
    fi
    
    # No cleanup needed for this approach
    
    # Check for activity after the cycle
    if check_activity 35; then  # Check last 35 minutes (work + buffer)
        update_progress "$cycle" "completed" "Cycle completed with development activity detected"
        log_success "Development activity confirmed for cycle $cycle"
    else
        update_progress "$cycle" "no-activity" "Cycle completed but no development activity detected"
        log_warn "No development activity detected for cycle $cycle - Claude may not be working properly"
    fi
    
    return 0
}

# Cleanup and final reporting
cleanup_and_report() {
    log_info "Starting cleanup and final reporting..."
    
    # Remove PID file
    rm -f "$PID_FILE"
    
    # Generate final report
    local total_cycles=$(grep -c "Starting development cycle" "$MAIN_LOG" 2>/dev/null || echo "0")
    local successful_cycles=$(grep -c "completed successfully" "$MAIN_LOG" 2>/dev/null || echo "0")
    local activity_cycles=$(grep -c "Development activity confirmed" "$MAIN_LOG" 2>/dev/null || echo "0")
    local errors=$(grep -c "ERROR" "$MAIN_LOG" 2>/dev/null || echo "0")
    local warnings=$(grep -c "WARN" "$MAIN_LOG" 2>/dev/null || echo "0")
    
    log_info "=== FINAL SESSION REPORT ==="
    log_info "Session ID: $SESSION_ID"
    log_info "Total cycles attempted: $total_cycles"
    log_info "Successful cycles: $successful_cycles"
    log_info "Cycles with confirmed activity: $activity_cycles"
    log_info "Errors encountered: $errors"
    log_info "Warnings issued: $warnings"
    log_info "Main log: $MAIN_LOG"
    log_info "Claude output log: $CLAUDE_LOG"
    log_info "Progress tracking: $PROGRESS_LOG"
    
    # Check final git status
    local final_commits=$(git log --since="24 hours ago" --oneline | wc -l)
    local final_prs=$(gh pr list --author="@me" | wc -l)
    log_info "Git commits in last 24h: $final_commits"
    log_info "Open PRs by this session: $final_prs"
    
    update_progress "$total_cycles" "completed" "Session finished - check logs for details"
    
    echo ""
    echo "🎯 Check your results:"
    echo "   git log --oneline -20    # See recent commits"
    echo "   gh pr list               # See created PRs"
    echo "   gh issue list            # See remaining issues"
    echo "   cat $MAIN_LOG           # See full session log"
    
    exit 0
}

# Signal handlers
trap cleanup_and_report EXIT
trap 'log_info "Received interrupt signal"; exit 0' INT TERM

# Store PID for monitoring
echo $$ > "$PID_FILE"

# Main execution
log_info "Starting Production Auto-Claude System"
log_info "Session ID: $SESSION_ID"
log_info "Expected runtime: ~$(echo "scale=1; $MAX_CYCLES * 35 / 60" | bc -l) hours"

run_preflight_checks

# Initialize progress tracking
update_progress "0" "initialized" "System started and pre-flight checks passed"

# Main cycle loop
for ((cycle=1; cycle<=MAX_CYCLES; cycle++)); do
    # Check for stop file
    if [ -f "STOP_AUTO_CLAUDE" ]; then
        log_info "Stop file detected - ending session gracefully"
        rm -f "STOP_AUTO_CLAUDE"
        break
    fi
    
    # Run the development cycle
    run_claude_cycle "$cycle"
    
    # Break if this was the last cycle
    if [ "$cycle" -eq "$MAX_CYCLES" ]; then
        log_info "Completed all $MAX_CYCLES cycles - ending session"
        break
    fi
    
    # Delay between cycles
    log_info "Cycle $cycle complete, waiting ${CYCLE_DELAY}s before next cycle..."
    update_progress "$cycle" "waiting" "Resting between cycles"
    sleep "$CYCLE_DELAY"
done

log_success "All development cycles completed successfully"