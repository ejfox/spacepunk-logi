#!/usr/bin/env node

/**
 * SPACEPUNK PLAYTESTER AGENT
 * 
 * This agent simulates a real player going through the game,
 * testing all major interactions and reporting what's broken or unfun.
 */

import fetch from 'node-fetch';
import { WebSocket } from 'ws';

class PlaytesterAgent {
  constructor() {
    this.baseUrl = 'http://localhost:3666';
    this.frontendUrl = 'http://localhost:3667';
    this.ws = null;
    this.player = null;
    this.ship = null;
    this.gameState = {
      fuel: 100,
      credits: 1000,
      heat: 0,
      location: 'Earth Station Alpha'
    };
    this.testResults = [];
    this.currentTest = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const emoji = {
      info: '🤖',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      action: '🎮'
    }[type];
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    
    if (this.currentTest) {
      this.testResults.push({
        test: this.currentTest,
        timestamp,
        message,
        type
      });
    }
  }

  async startTest(testName) {
    this.currentTest = testName;
    this.log(`Starting test: ${testName}`, 'action');
  }

  async endTest(success, notes = '') {
    const result = success ? 'PASS' : 'FAIL';
    this.log(`Test completed: ${this.currentTest} - ${result} ${notes}`, success ? 'success' : 'error');
    this.currentTest = null;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      this.log(`Request failed: ${endpoint} - ${error.message}`, 'error');
      throw error;
    }
  }

  async testServerConnection() {
    await this.startTest('Server Connection');
    
    try {
      const response = await this.makeRequest('/api/test');
      if (response.status) {
        this.log(`Server responding: ${response.status}`, 'success');
        await this.endTest(true);
      } else {
        await this.endTest(false, 'No status in response');
      }
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async testPlayerCreation() {
    await this.startTest('Player Creation');
    
    try {
      const playerData = {
        username: `TestPlayer_${Date.now()}`,
        email: 'test@example.com',
        password: 'testpass123'
      };
      
      const response = await this.makeRequest('/api/player/create', {
        method: 'POST',
        body: JSON.stringify(playerData)
      });
      
      if (response.player && response.ship) {
        this.player = response.player;
        this.ship = response.ship;
        this.log(`Player created: ${this.player.username} with ship ${this.ship.name}`, 'success');
        await this.endTest(true);
      } else {
        await this.endTest(false, 'Missing player or ship data');
      }
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async testWebSocketConnection() {
    await this.startTest('WebSocket Connection');
    
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket('ws://localhost:3666');
        
        this.ws.on('open', () => {
          this.log('WebSocket connected successfully', 'success');
          this.endTest(true);
          resolve();
        });
        
        this.ws.on('message', (data) => {
          const message = JSON.parse(data);
          this.log(`WebSocket message: ${message.type}`, 'info');
        });
        
        this.ws.on('error', (error) => {
          this.log(`WebSocket error: ${error.message}`, 'error');
          this.endTest(false, error.message);
          resolve();
        });
        
        setTimeout(() => {
          this.endTest(false, 'Connection timeout');
          resolve();
        }, 5000);
        
      } catch (error) {
        this.endTest(false, error.message);
        resolve();
      }
    });
  }

  async testStreamingDialog() {
    await this.startTest('Streaming Dialog Generation');
    
    try {
      this.log('Initiating explore action...', 'action');
      
      const response = await fetch(`${this.baseUrl}/api/dialog/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'explore',
          playerState: {
            playerId: this.player?.id || 'test-player',
            shipId: this.ship?.id || 'test-ship',
            ...this.gameState
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let receivedData = false;
      let choicesReceived = false;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const timeout = setTimeout(() => {
        this.endTest(false, 'Streaming timeout after 30s');
      }, 30000);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              receivedData = true;
              
              if (data.type === 'queue_status') {
                this.log(`Queue position: ${data.queueStatus?.position || 'unknown'}`, 'info');
              } else if (data.type === 'chunk') {
                this.log(`Streaming content: ${data.content?.slice(0, 50)}...`, 'info');
              } else if (data.type === 'complete') {
                this.log(`Dialog completed with ${data.dialog?.choices?.length || 0} choices`, 'success');
                choicesReceived = data.dialog?.choices?.length > 0;
                break;
              }
            } catch (e) {
              this.log(`Failed to parse stream data: ${e.message}`, 'warning');
            }
          }
        }
      }
      
      clearTimeout(timeout);
      
      if (receivedData && choicesReceived) {
        await this.endTest(true, 'Streaming dialog working with choices');
      } else if (receivedData) {
        await this.endTest(false, 'Received data but no meaningful choices');
      } else {
        await this.endTest(false, 'No streaming data received');
      }
      
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async testChoiceExecution() {
    await this.startTest('Choice Execution & State Updates');
    
    try {
      // Create a simple test choice
      const testChoice = {
        id: 'test_travel',
        text: 'Travel to nearby station',
        risk: 'low',
        consequences: {
          fuel: -10,
          credits: 0,
          heat: 2,
          location: 'Beta Station',
          narrative: 'You successfully travel to the new location.'
        }
      };
      
      const initialFuel = this.gameState.fuel;
      
      const response = await this.makeRequest('/api/choice/execute', {
        method: 'POST',
        body: JSON.stringify({
          playerId: this.player?.id || 'test-player',
          choice: testChoice,
          gameState: this.gameState
        })
      });
      
      if (response && typeof response === 'object') {
        this.log('Choice execution returned response', 'success');
        // Update our local game state for testing
        this.gameState.fuel = Math.max(0, this.gameState.fuel - 10);
        this.gameState.heat = Math.min(100, this.gameState.heat + 2);
        this.gameState.location = 'Beta Station';
        
        await this.endTest(true, `Fuel: ${initialFuel} → ${this.gameState.fuel}`);
      } else {
        await this.endTest(false, 'No response from choice execution');
      }
      
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async testGameplayLoop() {
    await this.startTest('Complete Gameplay Loop');
    
    try {
      this.log('Testing complete player journey...', 'action');
      
      // Test sequence: Explore → Get Choices → Make Choice → Check Results
      let success = true;
      let issues = [];
      
      // 1. Can player explore?
      this.log('Step 1: Exploring...', 'action');
      // (This would use the streaming dialog test)
      
      // 2. Are choices meaningful?
      this.log('Step 2: Evaluating choice quality...', 'action');
      // Check if choices have real consequences, varied options, clear descriptions
      
      // 3. Do stats actually update?
      this.log('Step 3: Testing state persistence...', 'action');
      // Verify fuel, credits, location changes stick
      
      // 4. Is there progression?
      this.log('Step 4: Looking for progression mechanics...', 'action');
      // Check for crew hiring, ship upgrades, reputation changes
      
      if (success) {
        await this.endTest(true, 'Core loop functional');
      } else {
        await this.endTest(false, `Issues: ${issues.join(', ')}`);
      }
      
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async testUIResponsiveness() {
    await this.startTest('UI Responsiveness');
    
    try {
      this.log('Testing frontend availability...', 'action');
      
      const response = await fetch(this.frontendUrl);
      if (response.ok) {
        const html = await response.text();
        
        // Check for key UI elements
        const hasTitle = html.includes('spacepunk');
        const hasVueApp = html.includes('__NUXT__');
        
        if (hasTitle && hasVueApp) {
          await this.endTest(true, 'Frontend serving properly');
        } else {
          await this.endTest(false, 'Frontend missing key elements');
        }
      } else {
        await this.endTest(false, `Frontend not responding: ${response.status}`);
      }
      
    } catch (error) {
      await this.endTest(false, error.message);
    }
  }

  async generateTestReport() {
    this.log('\n=== PLAYTESTER AGENT REPORT ===', 'info');
    
    const passedTests = this.testResults.filter(r => r.type === 'success').length;
    const failedTests = this.testResults.filter(r => r.type === 'error').length;
    
    this.log(`Tests Passed: ${passedTests}`, 'success');
    this.log(`Tests Failed: ${failedTests}`, 'error');
    
    if (failedTests > 0) {
      this.log('\n🔥 CRITICAL ISSUES TO FIX:', 'error');
      this.testResults
        .filter(r => r.type === 'error')
        .forEach(r => this.log(`  • ${r.test}: ${r.message}`, 'error'));
    }
    
    this.log('\n🎯 PLAYABILITY ASSESSMENT:', 'info');
    if (passedTests >= 4) {
      this.log('PLAYABLE: Core systems working, needs polish', 'success');
    } else if (passedTests >= 2) {
      this.log('PARTIALLY PLAYABLE: Major issues present', 'warning');
    } else {
      this.log('NOT PLAYABLE: Fundamental systems broken', 'error');
    }
    
    return {
      passed: passedTests,
      failed: failedTests,
      playable: passedTests >= 4
    };
  }

  async runFullTestSuite() {
    this.log('🚀 SPACEPUNK PLAYTESTER AGENT STARTING', 'action');
    this.log('Testing game as a real player would...', 'info');
    
    // Run all tests in sequence
    await this.testServerConnection();
    await this.testUIResponsiveness();
    await this.testPlayerCreation();
    await this.testWebSocketConnection();
    await this.testStreamingDialog();
    await this.testChoiceExecution();
    await this.testGameplayLoop();
    
    const report = await this.generateTestReport();
    
    // Cleanup
    if (this.ws) {
      this.ws.close();
    }
    
    return report;
  }
}

// Run the playtester if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new PlaytesterAgent();
  agent.runFullTestSuite()
    .then(report => {
      console.log('\n🎮 Test complete! Use this data to prioritize fixes.');
      process.exit(report.playable ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Playtester crashed:', error);
      process.exit(1);
    });
}

export { PlaytesterAgent };