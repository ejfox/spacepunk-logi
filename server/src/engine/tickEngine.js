import EventEmitter from 'events';
import { query } from '../db/index.js';

export class TickEngine extends EventEmitter {
  constructor(tickInterval) {
    super();
    this.tickInterval = tickInterval;
    this.currentTick = 0;
    this.isRunning = false;
    this.tickTimer = null;
  }

  start() {
    if (this.isRunning) {
      console.warn('Tick engine is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting tick engine...');
    this.scheduleNextTick();
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
    console.log('Tick engine stopped');
  }

  scheduleNextTick() {
    if (!this.isRunning) return;

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
    // TODO: Implement crew skill development, relationship changes, aging
    console.log('Processing crew systems...');
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
}