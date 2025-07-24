#!/bin/bash

# Action Tracker for Auto-Claude 30-minute test
# Tracks EVERY action taken by the autonomous system

TRACKER_LOG="action-tracker-$(date +%Y%m%d-%H%M%S).log"
START_TIME=$(date +%s)

log_action() {
    local timestamp="[$(date '+%H:%M:%S')]"
    local elapsed=$(($(date +%s) - START_TIME))
    echo "$timestamp [+${elapsed}s] $1" | tee -a "$TRACKER_LOG"
}

log_action "🚀 AUTO-CLAUDE ACTION TRACKER STARTED"
log_action "Target duration: 30 minutes"
log_action "Main process PIDs: $(ps aux | grep production-auto-claude | grep -v grep | awk '{print $2}' | tr '\n' ' ')"

# Track for 30 minutes (1800 seconds)
END_TIME=$((START_TIME + 1800))

while [ $(date +%s) -lt $END_TIME ]; do
    current_time=$(date +%s)
    elapsed=$((current_time - START_TIME))
    
    # Check every 10 seconds
    sleep 10
    
    # Check if auto-claude is still running
    if ! ps aux | grep production-auto-claude | grep -v grep > /dev/null; then
        log_action "❌ AUTO-CLAUDE PROCESS DIED"
        break
    fi
    
    # Check for file changes
    recent_files=$(find . -name "*.js" -o -name "*.vue" -o -name "*.ts" -o -name "*.html" -o -name "*.sql" -mmin -1 2>/dev/null | wc -l)
    if [ "$recent_files" -gt 0 ]; then
        log_action "📁 FILE ACTIVITY: $recent_files files modified in last minute"
        find . -name "*.js" -o -name "*.vue" -o -name "*.ts" -o -name "*.html" -o -name "*.sql" -mmin -1 2>/dev/null | head -5 | while read file; do
            log_action "  ✏️  Modified: $file"
        done
    fi
    
    # Check for git activity
    recent_commits=$(git log --since="1 minute ago" --oneline 2>/dev/null | wc -l)
    if [ "$recent_commits" -gt 0 ]; then
        log_action "📝 GIT ACTIVITY: $recent_commits new commits"
        git log --since="1 minute ago" --oneline | while read commit; do
            log_action "  🔗 Commit: $commit"
        done
    fi
    
    # Check for new branches
    if [ -f "/tmp/auto_claude_last_branches" ]; then
        current_branches=$(git branch -r | wc -l)
        last_branches=$(cat /tmp/auto_claude_last_branches)
        if [ "$current_branches" -gt "$last_branches" ]; then
            log_action "🌳 NEW BRANCH DETECTED"
            git branch -r | tail -$((current_branches - last_branches)) | while read branch; do
                log_action "  🌿 Branch: $branch"
            done
        fi
        echo "$current_branches" > /tmp/auto_claude_last_branches
    else
        git branch -r | wc -l > /tmp/auto_claude_last_branches
    fi
    
    # Check logs for activity
    if [ -f "live-test-run.log" ]; then
        last_log_line=$(tail -1 live-test-run.log 2>/dev/null)
        if [ -f "/tmp/auto_claude_last_log_line" ]; then
            if [ "$last_log_line" != "$(cat /tmp/auto_claude_last_log_line)" ]; then
                log_action "📋 LOG ACTIVITY: $last_log_line"
            fi
        fi
        echo "$last_log_line" > /tmp/auto_claude_last_log_line
    fi
    
    # Check for Claude CLI activity (look for claude processes)
    claude_processes=$(ps aux | grep -E "(claude|claude code)" | grep -v grep | wc -l)
    if [ "$claude_processes" -gt 0 ]; then
        log_action "🤖 CLAUDE CLI ACTIVE: $claude_processes processes"
    fi
    
    # Progress report every 5 minutes
    if [ $((elapsed % 300)) -eq 0 ]; then
        minutes=$((elapsed / 60))
        log_action "⏰ PROGRESS REPORT: $minutes minutes elapsed"
        log_action "  📊 Process status: $(ps aux | grep production-auto-claude | grep -v grep | wc -l) processes running"
        log_action "  💾 Log file size: $(wc -l < live-test-run.log 2>/dev/null || echo 0) lines"
        log_action "  🗂️  Total files in directory: $(ls | wc -l)"
    fi
done

log_action "⏱️  30-MINUTE TRACKING COMPLETE"
log_action "📊 FINAL REPORT:"
log_action "  Total runtime: $(($(date +%s) - START_TIME)) seconds"
log_action "  Log file: $TRACKER_LOG"
log_action "  Auto-claude log: live-test-run.log"

# Clean up temp files
rm -f /tmp/auto_claude_last_branches /tmp/auto_claude_last_log_line

echo "🎯 Check detailed results in: $TRACKER_LOG"