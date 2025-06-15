import EventEmitter from 'events';
import { query } from '../db/index.js';
import LogGenerationService from '../services/LogGenerationService.js';

export class TickEngine extends EventEmitter {
  constructor(tickInterval, openRouterApiKey = null) {
    super();
    this.tickInterval = tickInterval;
    this.currentTick = 0;
    this.isRunning = false;
    this.tickTimer = null;
    this.nextTickTime = null;
    this.heartbeatTimer = null;
    this.logService = new LogGenerationService(openRouterApiKey);
    this.logGenerationInterval = 10; // Generate logs every 10 ticks
  }

  start() {
    if (this.isRunning) {
      console.warn('Tick engine is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting tick engine...');
    this.scheduleNextTick();
    this.startHeartbeat();
  }

  stop() {
    if (!this.isRunning) {
      console.warn('Tick engine is not running');
      return;
    }

    this.isRunning = false;
    if (this.tickTimer) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    console.log('Tick engine stopped');
  }

  scheduleNextTick() {
    if (!this.isRunning) return;

    this.nextTickTime = Date.now() + this.tickInterval;
    this.tickTimer = setTimeout(() => {
      this.processTick();
    }, this.tickInterval);
  }

  async processTick() {
    const tickStartTime = Date.now();
    this.currentTick++;
    
    console.log(`Processing tick ${this.currentTick}`);
    this.emit('tick:start', this.currentTick);

    try {
      // Process all tick systems in order
      await this.processResourceSystems();
      await this.processCrewSystems();
      await this.processMarketSystems();
      await this.processMissionSystems();
      await this.processFactionSystems();
      
      // Generate ship logs periodically
      if (this.currentTick % this.logGenerationInterval === 0) {
        await this.processLogGeneration();
      }
      
      // Record tick completion
      await this.recordTickCompletion(tickStartTime);
      
      this.emit('tick:complete', {
        tick: this.currentTick,
        duration: Date.now() - tickStartTime
      });
    } catch (error) {
      console.error(`Error processing tick ${this.currentTick}:`, error);
      this.emit('tick:error', { tick: this.currentTick, error });
    }

    // Schedule next tick
    this.scheduleNextTick();
  }

  async processResourceSystems() {
    // TODO: Implement resource consumption, production, degradation
    console.log('Processing resource systems...');
  }

  async processCrewSystems() {
    console.log('Processing crew systems...');
    
    // Example: Generate some crew-related log events
    try {
      const activeShips = await query('SELECT id FROM ships WHERE status = $1', ['operational']);
      
      for (const ship of activeShips.rows) {
        // Simulate crew skill development
        const crewResult = await query('SELECT * FROM crew_members WHERE ship_id = $1 AND died_at IS NULL', [ship.id]);
        
        for (const crewMember of crewResult.rows) {
          // Random chance of skill improvement
          if (Math.random() < 0.1) { // 10% chance per tick
            const skills = ['skill_engineering', 'skill_piloting', 'skill_social', 'skill_combat'];
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            const improvement = Math.floor(Math.random() * 3) + 1;
            
            await query(`UPDATE crew_members SET ${randomSkill} = LEAST(${randomSkill} + $1, 100) WHERE id = $2`, 
              [improvement, crewMember.id]);
            
            // Log the skill improvement
            await this.logService.addLogEvent(
              ship.id,
              this.currentTick,
              'crew_skill_development',
              'crew',
              `${crewMember.name} improved ${randomSkill.replace('skill_', '')} skills`,
              `${crewMember.name} spent time practicing ${randomSkill.replace('skill_', '')} and gained ${improvement} skill points.`,
              { 
                crew_member_id: crewMember.id,
                skill_type: randomSkill,
                improvement: improvement
              },
              {
                severity: 'info',
                crewMemberIds: [crewMember.id],
                impactScore: 4,
                narrativeTags: ['skill_development', 'crew_growth']
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error processing crew systems:', error);
    }
  }

  async processMarketSystems() {
    // TODO: Implement market price fluctuations, supply/demand adjustments
    console.log('Processing market systems...');
  }

  async processMissionSystems() {
    // TODO: Implement LLM generation, expiration, consequence resolution
    console.log('Processing mission systems...');
  }

  async processFactionSystems() {
    // TODO: Implement reputation changes, political shifts
    console.log('Processing faction systems...');
  }

  async processLogGeneration() {
    console.log('Processing log generation...');
    
    try {
      // Get all active ships
      const activeShips = await query('SELECT id FROM ships WHERE status = $1', ['operational']);
      
      for (const ship of activeShips.rows) {
        // Check if this ship needs a log entry
        const tickRangeStart = this.currentTick - this.logGenerationInterval;
        const tickRangeEnd = this.currentTick;
        
        // Check if there are unprocessed events for this ship
        const eventsResult = await query(`
          SELECT COUNT(*) as event_count 
          FROM log_events 
          WHERE ship_id = $1 
            AND tick_number BETWEEN $2 AND $3 
            AND processed_in_log_entry IS NULL
        `, [ship.id, tickRangeStart, tickRangeEnd]);
        
        const eventCount = parseInt(eventsResult.rows[0].event_count);
        
        if (eventCount > 0) {
          console.log(`Generating log for ship ${ship.id} (${eventCount} events)`);
          
          // Generate log entry asynchronously (don't block tick processing)
          this.logService.generateLogEntry(ship.id, tickRangeStart, tickRangeEnd)
            .then(logEntry => {
              if (logEntry) {
                console.log(`Generated log entry ${logEntry.id} for ship ${ship.id}`);
                
                // Emit event for WebSocket clients
                this.emit('log:generated', {
                  shipId: ship.id,
                  logEntryId: logEntry.id,
                  title: logEntry.title,
                  tick: this.currentTick
                });
              }
            })
            .catch(error => {
              console.error(`Failed to generate log for ship ${ship.id}:`, error);
            });
        }
      }
    } catch (error) {
      console.error('Error in log generation process:', error);
    }
  }

  async recordTickCompletion(startTime) {
    try {
      await query(
        `INSERT INTO tick_history (tick_number, start_time, duration_ms, status) 
         VALUES ($1, $2, $3, $4)`,
        [
          this.currentTick,
          new Date(startTime),
          Date.now() - startTime,
          'completed'
        ]
      );
    } catch (error) {
      // Table might not exist yet, log but don't crash
      console.warn('Could not record tick history:', error.message);
    }
  }

  startHeartbeat() {
    // Send heartbeat every second
    this.heartbeatTimer = setInterval(() => {
      if (this.nextTickTime) {
        const timeUntilNextTick = Math.max(0, this.nextTickTime - Date.now());
        this.emit('heartbeat', {
          currentTick: this.currentTick,
          nextTickEta: Math.ceil(timeUntilNextTick / 1000), // seconds until next tick
          tickInterval: this.tickInterval,
          serverTime: Date.now()
        });
      }
    }, 1000);
  }
}