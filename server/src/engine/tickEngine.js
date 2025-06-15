import EventEmitter from 'events';
import { query } from '../db/index.js';
import MarketSimulation from '../market/MarketSimulation.js';
import { MarketRepository } from '../repositories/MarketRepository.js';
import MissionGenerator from '../missions/MissionGenerator.js';
import { MissionRepository } from '../repositories/MissionRepository.js';

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
    
    // Initialize mission systems
    this.missionGenerator = new MissionGenerator();
    this.missionRepository = new MissionRepository();
    
    // Forward market events
    this.marketSimulation.on('marketEvent', (event) => {
      this.emit('market:event', event);
    });
    
    this.marketSimulation.on('significantPriceChange', (change) => {
      this.emit('market:priceChange', change);
    });
    
    // Forward mission events
    this.missionGenerator.on('missionGenerated', (data) => {
      this.emit('mission:generated', data);
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
    console.log('Processing mission systems...');
    
    try {
      // Expire old missions
      const expiredMissions = await this.missionRepository.expireMissions();
      if (expiredMissions.length > 0) {
        console.log(`Expired ${expiredMissions.length} missions`);
        this.emit('missions:expired', { count: expiredMissions.length, missions: expiredMissions });
      }
      
      // Check if we need to generate new missions
      const availableMissions = await this.missionRepository.findAvailable(20);
      const missionCount = availableMissions.length;
      
      // Generate new missions if we have fewer than 10 available
      if (missionCount < 10) {
        const missionsToGenerate = Math.min(3, 15 - missionCount);
        await this.generateNewMissions(missionsToGenerate);
      }
      
      // Occasionally generate a special mission (5% chance per tick)
      if (Math.random() < 0.05) {
        await this.generateSpecialMission();
      }
      
      this.emit('missions:processed', {
        tick: this.currentTick,
        availableMissions: missionCount,
        expiredMissions: expiredMissions.length
      });
      
    } catch (error) {
      console.error('Error processing mission systems:', error);
      throw error;
    }
  }
  
  async generateNewMissions(count = 1) {
    try {
      const generatedMissions = [];
      
      // Get context for mission generation
      const stations = await query('SELECT id, name FROM stations');
      const recentMarketEvents = this.marketSimulation.marketEvents || [];
      
      for (let i = 0; i < count; i++) {
        try {
          // Select random station for mission
          const station = stations.rows[Math.floor(Math.random() * stations.rows.length)];
          
          const context = {
            station: station,
            marketEvents: recentMarketEvents.slice(0, 3), // Recent events only
            tick: this.currentTick
          };
          
          // Generate mission using LLM or fallback to templates
          const mission = await this.missionGenerator.generateMission(context);
          
          // Save to database
          const savedMission = await this.missionRepository.create({
            ...mission,
            station_id: station?.id,
            generated_by: mission.generated_by || 'llm'
          });
          
          generatedMissions.push(savedMission);
          
          console.log(`Generated mission: ${savedMission.title} at ${station?.name || 'Unknown Station'}`);
          
        } catch (error) {
          console.error(`Failed to generate mission ${i + 1}:`, error);
        }
      }
      
      if (generatedMissions.length > 0) {
        this.emit('missions:generated', {
          tick: this.currentTick,
          count: generatedMissions.length,
          missions: generatedMissions
        });
      }
      
      return generatedMissions;
    } catch (error) {
      console.error('Error generating new missions:', error);
      return [];
    }
  }
  
  async generateSpecialMission() {
    try {
      // Special missions are high-difficulty with unique context
      const stations = await query('SELECT id, name FROM stations');
      const station = stations.rows[Math.floor(Math.random() * stations.rows.length)];
      
      const context = {
        difficulty: Math.random() < 0.7 ? 'dangerous' : 'legendary',
        missionType: ['reconnaissance', 'emergency_response', 'salvage_operation'][Math.floor(Math.random() * 3)],
        station: station,
        marketEvents: this.marketSimulation.marketEvents || [],
        special: true
      };
      
      const mission = await this.missionGenerator.generateMission(context);
      
      const savedMission = await this.missionRepository.create({
        ...mission,
        station_id: station?.id,
        generated_by: 'special_event'
      });
      
      console.log(`Generated SPECIAL mission: ${savedMission.title} (${savedMission.difficulty})`);
      
      this.emit('mission:special', {
        tick: this.currentTick,
        mission: savedMission
      });
      
      return savedMission;
    } catch (error) {
      console.error('Error generating special mission:', error);
      return null;
    }
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