import EventEmitter from 'events';
import { query } from '../db/index.js';
import MarketSimulation from '../market/MarketSimulation.js';
import { MarketRepository } from '../repositories/MarketRepository.js';

export class TickEngine extends EventEmitter {
  constructor(tickInterval) {
    super();
    this.tickInterval = tickInterval;
    this.currentTick = 0;
    this.isRunning = false;
    this.tickTimer = null;
    
    // Initialize market systems
    this.marketSimulation = new MarketSimulation();
    this.marketRepository = new MarketRepository();
    
    // Forward market events
    this.marketSimulation.on('marketEvent', (event) => {
      this.emit('market:event', event);
    });
    
    this.marketSimulation.on('significantPriceChange', (change) => {
      this.emit('market:priceChange', change);
    });
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
    console.log('Processing market systems...');
    
    try {
      // Get all current market data
      const currentMarkets = await this.marketRepository.findAllMarkets();
      
      if (currentMarkets.length === 0) {
        console.log('No market data found, initializing markets...');
        await this.initializeMarkets();
        return;
      }
      
      // Simulate market changes
      const marketUpdates = this.marketSimulation.simulateMarketTick(currentMarkets);
      
      // Update database with new prices
      await this.marketRepository.updateMarketData(marketUpdates);
      
      // Emit market update event
      this.emit('market:updated', {
        tick: this.currentTick,
        updatedMarkets: marketUpdates.length
      });
      
      // Randomly generate market events (10% chance per tick)
      if (Math.random() < 0.1) {
        await this.generateMarketEvent();
      }
      
      console.log(`Updated ${marketUpdates.length} market prices`);
    } catch (error) {
      console.error('Error processing market systems:', error);
      throw error;
    }
  }
  
  async initializeMarkets() {
    try {
      // Get all stations and resources
      const stationsResult = await query('SELECT id FROM stations');
      const resourcesResult = await query('SELECT id FROM resources');
      
      const stationIds = stationsResult.rows.map(s => s.id);
      const resourceIds = resourcesResult.rows.map(r => r.id);
      
      // Initialize all market combinations
      await this.marketRepository.initializeAllMarkets(stationIds, resourceIds);
      
      console.log(`Initialized markets for ${stationIds.length} stations and ${resourceIds.length} resources`);
    } catch (error) {
      console.error('Error initializing markets:', error);
      throw error;
    }
  }
  
  async generateMarketEvent() {
    try {
      const resourcesResult = await query('SELECT id, name, category FROM resources');
      const stationsResult = await query('SELECT id, name FROM stations');
      
      const event = this.marketSimulation.generateRandomEvent(
        resourcesResult.rows,
        stationsResult.rows
      );
      
      if (event) {
        this.marketSimulation.addMarketEvent(event);
        console.log(`Market event generated: ${event.name} - ${event.description}`);
      }
    } catch (error) {
      console.error('Error generating market event:', error);
    }
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