# Auto-Claude Manual: Autonomous Development System

## 🚀 Quick Start

```bash
# Test mode (shortened intervals)
./auto-claude.sh test

# Production mode (10min intervals)
./auto-claude.sh

# Emergency stop
touch STOP_AUTO_CLAUDE
```

## 🔧 System Overview

The auto-claude system provides **fully autonomous development** for Spacepunk while you're away. It:

1. **Runs Claude Code continuously** with `--dangerously-skip-permissions`
2. **Automatically handles the permission prompt** (down-arrow + enter)
3. **Sends "keep going" every 10 minutes** with testing instructions
4. **Auto-accepts responses** every 10 seconds
5. **Monitors game health** using the test client
6. **Logs everything** for review
7. **Gracefully handles crashes** and restarts

## 🛡️ Safety Features

### Pre-flight Checks
- Validates `claude` and `node` commands exist
- Confirms `test-client.js` is present and valid
- Tests FIFO pipe creation
- Verifies directory permissions

### Kill Switch
```bash
touch STOP_AUTO_CLAUDE
```
Creates a file that causes auto-claude to gracefully shut down on next cycle.

### Health Monitoring
- Runs `node test-client.js health` every cycle
- Logs health check results
- Continues development even if health checks fail

### Error Handling
- Detects clean exits (Ctrl+C) vs crashes
- Automatically restarts Claude on unexpected exits
- Preserves all logs for debugging
- Cleans up FIFO pipes and background processes

## 📋 Test Mode vs Production

### Test Mode (`./auto-claude.sh test`)
- **Keep Going**: Every 30 seconds
- **Enter Keys**: Every 3 seconds  
- **Purpose**: Quick validation before long runs

### Production Mode (`./auto-claude.sh`)
- **Keep Going**: Every 10 minutes
- **Enter Keys**: Every 10 seconds
- **Purpose**: Long-term autonomous development

## 🔍 Red Team Testing Results

The system has been tested for:

✅ **FIFO Pipe Management**: Creation, cleanup, collision handling  
✅ **Signal Handling**: Proper cleanup on interrupts  
✅ **Process Management**: Background processes, PID tracking  
✅ **Resource Constraints**: Disk space, permissions, process limits  
✅ **Error Conditions**: Missing dependencies, syntax errors  
✅ **Permission Issues**: /tmp access, file creation  
✅ **Network Connectivity**: Game server availability  
✅ **Database Access**: SQLite validation  

## 📁 Log Files

- `auto-claude-YYYYMMDD-HHMMSS.log`: Main auto-claude log
- `test-results.log`: Test client execution log

## 🎮 Integration with Game Testing

Every "keep going" command includes: `"keep going. first run: node test-client.js full"`

This ensures Claude will:
1. Run comprehensive game tests first
2. Validate all systems are working
3. Only proceed with development if tests pass
4. Fix any issues discovered during testing

## 🚨 Emergency Procedures

### Stop Auto-Claude Immediately
```bash
touch STOP_AUTO_CLAUDE
```

### Force Kill (if unresponsive)
```bash
pkill -f auto-claude
rm -f /tmp/claude_input_*
```

### Recovery from Crashes
1. Check log files for errors
2. Run `./test-auto-claude-safe.sh` to verify setup
3. Run `node test-client.js health` to check game state
4. Restart with appropriate mode

## 🔧 Troubleshooting

### "claude command not found"
Install Claude CLI or add to PATH

### "FIFO creation failed"
Check /tmp permissions: `ls -la /tmp`

### "test-client.js syntax errors"
Run: `node -c test-client.js`

### Game server not responding
Start the Spacepunk server first

### Database file not found
Ensure you're in the spacepunk-logi directory

## 🎯 Expected Behavior

1. **Startup**: Pre-flight checks, FIFO creation, background processes
2. **Permissions**: Auto-handles down-arrow + enter for Claude permissions
3. **Development Cycle**: 
   - Send "keep going" + test instruction
   - Claude runs tests, develops features
   - Auto-accept with Enter keys
   - Health monitoring
4. **Restart**: If Claude exits unexpectedly, restart automatically
5. **Shutdown**: Clean up all resources on Ctrl+C or kill switch

## 📈 Success Metrics

After running auto-claude, you should see:
- **Consistent log entries** every 10 minutes
- **Health checks passing** regularly
- **Game functionality preserved** via test validation
- **New features developed** based on Claude's autonomous decisions
- **No hanging processes** or resource leaks

This system enables **true autonomous development** where you can return from vacation to find significant progress made on Spacepunk, with confidence that all existing functionality remains intact.