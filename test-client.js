#!/usr/bin/env node

/**
 * Spacepunk Autonomous Test Client
 * 
 * A comprehensive testing framework that simulates a real player
 * using curl + database validation + WebSocket monitoring.
 * 
 * This allows Claude to test all game functionality autonomously
 * without needing a browser or manual interaction.
 */

const fs = require('fs');
const { exec, spawn } = require('child_process');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

class SpacepunkTestClient {
    constructor() {
        this.baseUrl = 'http://localhost:3666';
        this.wsUrl = 'ws://localhost:3666';
        this.dbPath = './server/db/spacepunk.db';
        this.sessionId = null;
        this.ws = null;
        this.testResults = [];
        this.currentTick = 0;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type}] ${message}`;
        console.log(logMessage);
        
        // Also write to test log file
        fs.appendFileSync('test-results.log', logMessage + '\n');
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Make HTTP requests using curl
    async curlRequest(endpoint, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            let curlCmd = `curl -s -X ${method}`;
            
            // Add headers
            Object.entries(headers).forEach(([key, value]) => {
                curlCmd += ` -H "${key}: ${value}"`;
            });
            
            // Add data for POST/PUT requests
            if (data) {
                curlCmd += ` -H "Content-Type: application/json"`;
                curlCmd += ` -d '${JSON.stringify(data)}'`;
            }
            
            curlCmd += ` ${this.baseUrl}${endpoint}`;
            
            this.log(`Executing: ${curlCmd}`, 'CURL');
            
            exec(curlCmd, (error, stdout, stderr) => {
                if (error) {
                    this.log(`Curl error: ${error.message}`, 'ERROR');
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    this.log(`Curl stderr: ${stderr}`, 'WARN');
                }
                
                try {
                    const response = JSON.parse(stdout);
                    this.log(`Response: ${JSON.stringify(response, null, 2)}`, 'RESPONSE');
                    resolve(response);
                } catch (parseError) {
                    this.log(`Response (raw): ${stdout}`, 'RESPONSE');
                    resolve(stdout);
                }
            });
        });
    }

    // Database validation functions
    async queryDatabase(query, params = []) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    this.log(`Database error: ${err.message}`, 'ERROR');
                    reject(err);
                } else {
                    this.log(`Database query: ${query} | Results: ${rows.length} rows`, 'DB');
                    resolve(rows);
                }
                db.close();
            });
        });
    }

    async validateGameState() {
        this.log('Validating game state...', 'VALIDATE');
        
        try {
            // Check player exists
            const players = await this.queryDatabase('SELECT * FROM players LIMIT 1');
            if (players.length === 0) {
                throw new Error('No player found in database');
            }
            
            // Check crew members
            const crew = await this.queryDatabase('SELECT * FROM crew_members WHERE player_id = ?', [players[0].id]);
            this.log(`Found ${crew.length} crew members`, 'VALIDATE');
            
            // Check ship status
            const ships = await this.queryDatabase('SELECT * FROM ships WHERE player_id = ?', [players[0].id]);
            this.log(`Found ${ships.length} ships`, 'VALIDATE');
            
            // Check resources
            const resources = await this.queryDatabase('SELECT * FROM player_resources WHERE player_id = ?', [players[0].id]);
            this.log(`Found ${resources.length} resource types`, 'VALIDATE');
            
            return {
                player: players[0],
                crew: crew,
                ships: ships,
                resources: resources
            };
            
        } catch (error) {
            this.log(`Game state validation failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // WebSocket connection for real-time testing
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                this.log('WebSocket connected', 'WS');
                resolve();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.log(`WebSocket message: ${message.type}`, 'WS');
                    
                    if (message.type === 'tick_update') {
                        this.currentTick = message.data.current_tick;
                        this.log(`Current tick: ${this.currentTick}`, 'TICK');
                    }
                } catch (error) {
                    this.log(`WebSocket parse error: ${error.message}`, 'ERROR');
                }
            });
            
            this.ws.on('error', (error) => {
                this.log(`WebSocket error: ${error.message}`, 'ERROR');
                reject(error);
            });
            
            this.ws.on('close', () => {
                this.log('WebSocket disconnected', 'WS');
            });
        });
    }

    // Test all major game functions
    async runComprehensiveTest() {
        this.log('Starting comprehensive game test...', 'TEST');
        
        try {
            // 1. Connect to WebSocket
            await this.connectWebSocket();
            
            // 2. Validate initial game state
            const gameState = await this.validateGameState();
            
            // 3. Test API endpoints
            await this.testGameStatus();
            await this.testCrewManagement();
            await this.testTrading();
            await this.testMissions();
            await this.testTraining();
            await this.testExploration();
            
            // 4. Wait for a few ticks to see real-time updates
            await this.waitForTicks(3);
            
            // 5. Final validation
            await this.validateGameState();
            
            this.log('All tests completed successfully!', 'SUCCESS');
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            if (this.ws) {
                this.ws.close();
            }
        }
    }

    async testGameStatus() {
        this.log('Testing game status endpoint...', 'TEST');
        const status = await this.curlRequest('/api/game-status');
        
        if (!status.success) {
            throw new Error('Game status endpoint failed');
        }
        
        this.log(`Game status: ${status.data.current_tick} ticks elapsed`, 'TEST');
    }

    async testCrewManagement() {
        this.log('Testing crew management...', 'TEST');
        
        // Get crew list
        const crew = await this.curlRequest('/api/crew');
        if (!crew.success) {
            throw new Error('Failed to get crew list');
        }
        
        this.log(`Found ${crew.data.length} crew members`, 'TEST');
        
        // Test hiring (if crew slots available)
        if (crew.data.length < 10) {
            try {
                const newCrew = await this.curlRequest('/api/crew/hire', 'POST', {
                    crew_type: 'engineer',
                    cultural_background: 'corporate'
                });
                
                if (newCrew.success) {
                    this.log('Successfully hired new crew member', 'TEST');
                } else {
                    this.log('Hiring failed (expected if no money/slots)', 'TEST');
                }
            } catch (error) {
                this.log('Hiring endpoint error (may be expected)', 'TEST');
            }
        }
    }

    async testTrading() {
        this.log('Testing trading system...', 'TEST');
        
        // Get market data
        const market = await this.curlRequest('/api/market');
        if (!market.success) {
            throw new Error('Failed to get market data');
        }
        
        this.log(`Market has ${market.data.length} tradeable resources`, 'TEST');
        
        // Test a small trade if we have resources
        const resources = await this.queryDatabase('SELECT * FROM player_resources WHERE quantity > 0 LIMIT 1');
        if (resources.length > 0) {
            try {
                const trade = await this.curlRequest('/api/trade', 'POST', {
                    resource_id: resources[0].resource_id,
                    quantity: 1,
                    action: 'sell'
                });
                
                if (trade.success) {
                    this.log('Successfully executed trade', 'TEST');
                } else {
                    this.log('Trade failed (may be expected)', 'TEST');
                }
            } catch (error) {
                this.log('Trade endpoint error', 'TEST');
            }
        }
    }

    async testMissions() {
        this.log('Testing mission system...', 'TEST');
        
        // Get available missions
        const missions = await this.curlRequest('/api/missions');
        if (!missions.success) {
            throw new Error('Failed to get missions');
        }
        
        this.log(`Found ${missions.data.length} available missions`, 'TEST');
        
        // Try to accept a mission
        if (missions.data.length > 0) {
            try {
                const accept = await this.curlRequest(`/api/missions/${missions.data[0].id}/accept`, 'POST');
                if (accept.success) {
                    this.log('Successfully accepted mission', 'TEST');
                } else {
                    this.log('Mission acceptance failed (may be expected)', 'TEST');
                }
            } catch (error) {
                this.log('Mission acceptance error', 'TEST');
            }
        }
    }

    async testTraining() {
        this.log('Testing training system...', 'TEST');
        
        // Get crew for training
        const crew = await this.queryDatabase('SELECT * FROM crew_members LIMIT 1');
        if (crew.length > 0) {
            try {
                const training = await this.curlRequest('/api/training/start', 'POST', {
                    crew_member_id: crew[0].id,
                    skill: 'engineering',
                    duration: 60 // 1 minute for testing
                });
                
                if (training.success) {
                    this.log('Successfully started training', 'TEST');
                } else {
                    this.log('Training failed (may be expected)', 'TEST');
                }
            } catch (error) {
                this.log('Training endpoint error', 'TEST');
            }
        }
    }

    async testExploration() {
        this.log('Testing exploration system...', 'TEST');
        
        try {
            const explore = await this.curlRequest('/api/explore', 'POST', {
                action: 'scout',
                crew_member_ids: []
            });
            
            if (explore.success) {
                this.log('Successfully initiated exploration', 'TEST');
            } else {
                this.log('Exploration failed (may be expected)', 'TEST');
            }
        } catch (error) {
            this.log('Exploration endpoint error', 'TEST');
        }
    }

    async waitForTicks(count) {
        this.log(`Waiting for ${count} game ticks...`, 'TEST');
        const startTick = this.currentTick;
        
        while (this.currentTick < startTick + count) {
            await this.sleep(1000);
        }
        
        this.log(`Completed ${count} ticks`, 'TEST');
    }

    // Quick health check
    async healthCheck() {
        try {
            this.log('Running health check...', 'HEALTH');
            
            // Check server is running
            const status = await this.curlRequest('/api/game-status');
            if (!status.success) {
                throw new Error('Server not responding');
            }
            
            // Check database is accessible
            await this.queryDatabase('SELECT 1');
            
            // Check WebSocket is working
            await this.connectWebSocket();
            await this.sleep(2000);
            this.ws.close();
            
            this.log('Health check passed!', 'SUCCESS');
            return true;
            
        } catch (error) {
            this.log(`Health check failed: ${error.message}`, 'ERROR');
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const client = new SpacepunkTestClient();
    const command = process.argv[2] || 'health';
    
    async function run() {
        try {
            switch (command) {
                case 'health':
                    await client.healthCheck();
                    break;
                case 'full':
                    await client.runComprehensiveTest();
                    break;
                case 'validate':
                    await client.validateGameState();
                    break;
                default:
                    console.log('Usage: node test-client.js [health|full|validate]');
                    console.log('  health   - Quick health check');
                    console.log('  full     - Run comprehensive test suite');
                    console.log('  validate - Validate current game state');
            }
        } catch (error) {
            console.error('Test failed:', error.message);
            process.exit(1);
        }
    }
    
    run();
}

module.exports = SpacepunkTestClient;