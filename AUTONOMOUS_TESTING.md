# Spacepunk Autonomous Testing Framework

This document outlines the autonomous testing framework designed for Claude to test all game functionality without browser access during autonomous development sessions.

## Quick Start

```bash
# Health check - verify everything is working
node test-client.js health

# Full test suite - comprehensive game testing
node test-client.js full

# Database validation only
node test-client.js validate
```

## Testing Architecture

### 1. HTTP API Testing (curl-based)
- Tests all REST endpoints using curl commands
- Validates responses and error handling
- Simulates real player actions

### 2. Database Validation
- Direct SQLite database access for state verification
- Validates data consistency and game state
- Tracks changes across game ticks

### 3. WebSocket Monitoring
- Real-time connection to game updates
- Monitors tick progression and live data
- Tests streaming features (LLM dialog, etc.)

## Test Categories

### Core Game Functions
- **Game Status**: Server health, tick progression
- **Crew Management**: Hiring, crew data, traits
- **Trading System**: Market data, buy/sell operations
- **Mission System**: Mission generation, acceptance
- **Training System**: Skill progression, queues
- **Exploration**: Scouting, encounters, LLM integration

### Data Validation
- **Player State**: Resources, credits, reputation
- **Crew State**: Skills, traits, status, memories
- **Ship State**: Upgrades, licenses, condition
- **World State**: Markets, missions, faction relations

### Real-time Features
- **Tick Updates**: Game progression, state changes
- **LLM Streaming**: Dialog generation, narrative
- **Queue Systems**: Training, LLM requests

## Usage During Autonomous Development

### Before Making Changes
```bash
node test-client.js health
```

### After Implementing Features
```bash
node test-client.js full
```

### Debugging Issues
```bash
node test-client.js validate
tail -f test-results.log
```

## Log Files

- `test-results.log`: Detailed test execution log
- `auto-claude-*.log`: Auto-claude script logs

## Integration with Auto-Claude

The test client is designed to work with the auto-claude script:

1. Auto-claude sends "keep going" 
2. Claude makes changes
3. Claude runs `node test-client.js full` to validate
4. Claude continues development based on results

## Test Client Features

### Comprehensive API Coverage
- All major game endpoints tested
- Error handling validation
- Response format verification

### Database Integration
- Direct SQLite access for validation
- State consistency checks
- Data integrity verification

### WebSocket Monitoring
- Real-time update tracking
- Tick progression monitoring
- Live feature testing

### Autonomous Operation
- No manual interaction required
- Detailed logging for debugging
- Graceful error handling

## Expected Test Flow

1. **Health Check**: Verify server/database/websocket
2. **Initial State**: Validate starting game state
3. **API Testing**: Test all major endpoints
4. **Real-time Monitoring**: Wait for ticks, monitor updates
5. **Final Validation**: Confirm state consistency
6. **Results**: Log success/failure with details

This framework enables Claude to develop autonomously while maintaining confidence that all game systems remain functional.