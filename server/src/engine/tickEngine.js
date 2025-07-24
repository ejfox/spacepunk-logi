import EventEmitter from 'events';
import { query } from '../db/index.js';
import MarketSimulation from '../market/MarketSimulation.js';
import { MarketRepository } from '../repositories/MarketRepository.js';
import { MarketDataGenerator } from '../generators/MarketDataGenerator.js';
import MissionGenerator from '../missions/MissionGenerator.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import TrainingQueue from '../training/TrainingQueue.js';
import { TrainingQueueRepository } from '../repositories/TrainingQueueRepository.js';
import { MicroNarrativeGenerator } from '../narrative/MicroNarrativeGenerator.js';
import { CrewRepository } from '../repositories/CrewRepository.js';
import { ShipRepository } from '../repositories/ShipRepository.js';
import { PlayerRepository } from '../repositories/PlayerRepository.js';
import NPCManager from '../world/NPCManager.js';

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
    this.marketDataGenerator = new MarketDataGenerator();
    
    // Initialize mission systems
    this.missionGenerator = new MissionGenerator();
    this.missionRepository = new MissionRepository();
    
    // Initialize training systems
    this.trainingQueue = new TrainingQueue();
    this.trainingQueueRepository = new TrainingQueueRepository();
    
    // Initialize narrative generation systems
    this.microNarrative = new MicroNarrativeGenerator();
    this.crewRepository = new CrewRepository();
    this.shipRepository = new ShipRepository();
    this.playerRepository = new PlayerRepository();
    this.narrativeRotationIndex = 0; // Rotate through crew for narrative generation
    
    // Initialize NPC systems
    this.npcManager = NPCManager;
    
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
    
    // Forward training events
    this.trainingQueue.on('trainingStarted', (data) => {
      this.emit('training:started', data);
    });
    
    this.trainingQueue.on('trainingProgress', (data) => {
      this.emit('training:progress', data);
    });
    
    this.trainingQueue.on('trainingCompleted', (data) => {
      this.emit('training:completed', data);
    });
    
    this.trainingQueue.on('trainingBurnout', (data) => {
      this.emit('training:burnout', data);
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
    
    // Only log every 10 ticks to reduce spam
    if (this.currentTick % 10 === 1) {
      console.log(`⚡ Processing game tick ${this.currentTick}...`);
    }
    this.emit('tick:start', this.currentTick);

    try {
      // Process all tick systems in order
      await this.processResourceSystems();
      await this.processCrewSystems();
      await this.processMarketSystems();
      await this.processMissionSystems();
      await this.processFactionSystems();
      await this.processNPCSystems();
      await this.processNarrativeGeneration();
      
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
    try {
      // Process crew salaries and fuel consumption for all active ships
      const activeShips = await this.shipRepository.getActiveShips();
      
      for (const ship of activeShips) {
        await this.processShipExpenses(ship);
      }
      
      // Only log if there are notable events
    } catch (error) {
      console.error('Error processing resource systems:', error);
    }
  }

  async processShipExpenses(ship) {
    try {
      // Get crew bonuses for this ship
      const crewBonuses = await this.crewRepository.getCrewBonuses(ship.id);
      const totalSalaries = await this.crewRepository.getTotalSalaries(ship.id);
      
      // Calculate fuel consumption with crew bonuses
      const baseFuelDecay = 1.0; // Base fuel consumption per tick
      const fuelEfficiencyBonus = crewBonuses.fuel_efficiency || 0;
      const fuelDecayReduction = crewBonuses.fuel_decay_reduction || 0;
      
      // Apply bonuses: efficiency reduces consumption, decay reduction also reduces consumption
      const actualFuelConsumption = baseFuelDecay * (1 - fuelEfficiencyBonus) * (1 - fuelDecayReduction);
      
      // Only consume fuel if ship has any
      if (ship.fuel_current > 0) {
        const newFuelLevel = Math.max(0, ship.fuel_current - actualFuelConsumption);
        await this.shipRepository.updateFuel(ship.id, newFuelLevel);
        
        // Emit event if fuel is getting low
        if (newFuelLevel < 20 && ship.fuel_current >= 20) {
          this.emit('ship:lowFuel', { 
            shipId: ship.id, 
            fuelLevel: newFuelLevel,
            bonuses: crewBonuses
          });
        }
      }
      
      // Deduct crew salaries from player credits
      if (totalSalaries > 0) {
        const player = await this.playerRepository.findById(ship.player_id);
        if (player) {
          // updateCredits adds the amount, so use negative for deduction
          const result = await this.playerRepository.updateCredits(player.id, -totalSalaries);
          
          // Emit event if player is running low on credits
          if (result && result.credits < 1000 && player.credits >= 1000) {
            this.emit('player:lowCredits', { 
              playerId: player.id, 
              credits: result.credits,
              salariesOwed: totalSalaries
            });
          }
        }
      }
      
      // Log significant changes
      if (fuelEfficiencyBonus > 0 || fuelDecayReduction > 0) {
        console.log(`🔧 Ship ${ship.name}: Fuel consumption reduced by ${Math.round((fuelEfficiencyBonus + fuelDecayReduction) * 100)}% due to crew bonuses`);
      }
      
    } catch (error) {
      console.error(`Error processing expenses for ship ${ship.id}:`, error);
    }
  }

  async processCrewSystems() {
    try {
      // Get all active training sessions
      const activeTraining = await this.trainingQueueRepository.findAllActive();
      
      if (activeTraining.length === 0) {
        return;
      }
      
      console.log(`🎓 Processing ${activeTraining.length} active training sessions`);
      
      // Load training sessions into the TrainingQueue service
      for (const session of activeTraining) {
        if (!this.trainingQueue.activeTraining.has(session.crew_member_id)) {
          // Reconstruct training session in memory
          this.trainingQueue.activeTraining.set(session.crew_member_id, {
            crewMemberId: session.crew_member_id,
            trainingType: session.training_type,
            training: this.trainingQueue.trainingTypes[session.training_type] || {
              name: session.training_type,
              skill: this.trainingQueueRepository.extractSkillFromTrainingType(session.training_type),
              intensity: session.intensity || 50
            },
            startTime: new Date(session.start_time),
            endTime: new Date(session.end_time),
            duration: session.duration_hours,
            progressMade: parseFloat(session.progress_made || 0),
            completed: false,
            burnout: session.burnout || false,
            totalTicks: 0,
            efficiency: parseFloat(session.efficiency || 1.0),
            status: session.status,
            databaseId: session.id
          });
        }
      }
      
      // Get crew members for active training
      const crewMembers = [];
      for (const session of activeTraining) {
        crewMembers.push(session.crew_member);
      }
      
      // Process training tick
      const results = this.trainingQueue.processTrainingTick(crewMembers);
      
      // Update database with progress
      if (results.progressUpdates.length > 0) {
        await this.updateTrainingProgress(results.progressUpdates);
      }
      
      // Handle completed training
      if (results.completedSessions.length > 0) {
        await this.handleCompletedTraining(results.completedSessions);
      }
      
      this.emit('crew:processed', {
        tick: this.currentTick,
        activeTraining: activeTraining.length,
        progressUpdates: results.progressUpdates.length,
        completedSessions: results.completedSessions.length
      });
      
      console.log(`Processed ${activeTraining.length} training sessions`);
      
    } catch (error) {
      console.error('Error processing crew systems:', error);
      throw error;
    }
  }
  
  async updateTrainingProgress(progressUpdates) {
    try {
      const dbUpdates = [];
      
      for (const update of progressUpdates) {
        const session = this.trainingQueue.activeTraining.get(update.crewMemberId);
        if (session && session.databaseId) {
          // Ensure all values are proper numbers
          const progressMade = parseFloat(session.progressMade);
          const efficiency = parseFloat(session.efficiency);
          const burnout = Boolean(session.burnout);
          
          // Validate numbers before database update
          if (isNaN(progressMade) || isNaN(efficiency)) {
            console.error(`Invalid training data for session ${session.databaseId}:`, {
              originalProgressMade: session.progressMade,
              originalEfficiency: session.efficiency,
              parsedProgressMade: progressMade,
              parsedEfficiency: efficiency
            });
            continue;
          }
          
          dbUpdates.push({
            id: session.databaseId,
            progressMade: progressMade,
            efficiency: efficiency,
            burnout: burnout
          });
        }
      }
      
      if (dbUpdates.length > 0) {
        await this.trainingQueueRepository.batchUpdateProgress(dbUpdates);
      }
      
    } catch (error) {
      console.error('Error updating training progress:', error);
    }
  }
  
  async handleCompletedTraining(completedSessions) {
    try {
      for (const completion of completedSessions) {
        const session = this.trainingQueue.activeTraining.get(completion.crewMemberId);
        if (session && session.databaseId) {
          await this.trainingQueueRepository.completeTraining(
            session.databaseId,
            completion.skillIncrease,
            completion.narrative
          );
          
          console.log(`Training completed: ${completion.crewMemberId} - ${completion.trainingType} (+${completion.skillIncrease} ${completion.skillImproved})`);
        }
      }
    } catch (error) {
      console.error('Error handling completed training:', error);
    }
  }

  async processMarketSystems() {
    try {
      // Get all current market data
      const currentMarkets = await this.marketRepository.findAllMarkets();
      
      if (currentMarkets.length === 0) {
        console.log('📈 Initializing market systems...');
        await this.initializeMarkets();
        return;
      }
      
      // Simulate market changes
      const marketUpdates = this.marketSimulation.simulateMarketTick(currentMarkets);
      
      // Generate commentary for significant price changes
      const enhancedUpdates = [];
      for (const update of marketUpdates) {
        const market = currentMarkets.find(m => 
          m.station_id === update.stationId && 
          m.resource_id === update.resourceId
        );
        
        if (market && Math.abs(update.priceTrend) > 5) {
          // Generate LLM commentary for significant changes
          const commentary = await this.marketDataGenerator.generateMarketCommentary({
            resourceName: market.resource_name,
            stationName: market.station_name,
            currentPrice: update.currentPrice,
            priceTrend: update.priceTrend,
            supply: update.supply,
            demand: update.demand
          });
          
          enhancedUpdates.push({
            ...update,
            commentary
          });
        } else {
          enhancedUpdates.push(update);
        }
      }
      
      // Update database with new prices
      await this.marketRepository.updateMarketData(marketUpdates);
      
      // Emit market update event with commentary
      this.emit('market:updated', {
        tick: this.currentTick,
        updatedMarkets: marketUpdates.length,
        marketData: enhancedUpdates
      });
      
      // Randomly generate market events (10% chance per tick)
      if (Math.random() < 0.1) {
        await this.generateMarketEvent();
      }
      
      // Only log if significant market activity
      if (enhancedUpdates.length > 0) {
        console.log(`📈 Market activity: ${enhancedUpdates.length} significant price changes`);
      }
    } catch (error) {
      console.error('Error processing market systems:', error);
      throw error;
    }
  }
  
  async initializeMarkets() {
    try {
      // Get all stations and resources
      const stationsResult = await query('SELECT id, name FROM stations');
      const resourcesResult = await query('SELECT id FROM resources');
      
      // Use lowercase station names as IDs for market_data
      const stationData = stationsResult.rows.map(s => ({
        id: s.name.toLowerCase().replace(/\s+/g, '-'),
        name: s.name
      }));
      const resourceIds = resourcesResult.rows.map(r => r.id);
      
      // Initialize all market combinations
      await this.marketRepository.initializeAllMarkets(
        stationData.map(s => s.id), 
        resourceIds
      );
      
      console.log(`Initialized markets for ${stationData.length} stations and ${resourceIds.length} resources`);
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
        // Generate enhanced event description using LLM
        const enhancedDescription = await this.marketDataGenerator.generateEventDescription({
          ...event,
          resourceName: resourcesResult.rows.find(r => r.id === event.resourceId)?.name,
          stationName: stationsResult.rows.find(s => s.id === event.stationId)?.name
        });
        
        event.description = enhancedDescription;
        this.marketSimulation.addMarketEvent(event);
        console.log(`📊 Market event: ${event.name} - ${event.description}`);
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
          // Only log mission generation failures once per tick, not per mission
          if (i === 0 && !this.llmFailureLogged) {
            console.log(`📋 Mission generation: Using fallback templates (LLM unavailable)`);
            this.llmFailureLogged = true;
          }
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

  async processNPCSystems() {
    try {
      // Process all NPCs during this tick
      await this.npcManager.processNPCTick(this.currentTick);
      
      // Get recent NPC activity for client updates
      const recentActivity = this.npcManager.getRecentActivity(5);
      
      // Emit NPC activity updates
      if (recentActivity.length > 0) {
        this.emit('npc:activity', {
          tick: this.currentTick,
          activity: recentActivity,
          activeNPCs: this.npcManager.npcs.size
        });
      }
      
      // Only log if there are active NPCs
      if (this.npcManager.npcs.size > 0 && this.currentTick % 5 === 0) {
        console.log(`👥 Active NPCs: ${this.npcManager.npcs.size}`);
      }
    } catch (error) {
      console.error('Error processing NPC systems:', error);
      throw error;
    }
  }

  async processNarrativeGeneration() {
    try {
      // Only generate narratives every few ticks to avoid overwhelming the LLM queue
      const shouldGenerateNarratives = this.currentTick % 3 === 0; // Every 3rd tick
      
      if (!shouldGenerateNarratives) return;
      
      console.log('🎭 Processing narrative generation...');
      
      // Get all active crew members across all players
      const activeCrew = await this.crewRepository.findActiveCrew();
      
      if (activeCrew.length === 0) return;
      
      // Rotate through crew members - process 2-3 per tick to spread load
      const crewPerTick = Math.min(3, activeCrew.length);
      const startIndex = this.narrativeRotationIndex % activeCrew.length;
      const crewToProcess = [];
      
      for (let i = 0; i < crewPerTick; i++) {
        const index = (startIndex + i) % activeCrew.length;
        crewToProcess.push(activeCrew[index]);
      }
      
      // Update rotation index for next tick
      this.narrativeRotationIndex = (this.narrativeRotationIndex + crewPerTick) % activeCrew.length;
      
      // Generate narratives for selected crew (low priority - don't block other operations)
      const narrativePromises = crewToProcess.map(async (crew) => {
        try {
          // Pick 1-2 random narrative types to refresh each tick
          const narrativeTypes = ['description', 'health', 'morale', 'stress', 'skill', 'trait', 'background', 'performance'];
          const typesToGenerate = this.selectRandomNarrativeTypes(narrativeTypes);
          
          for (const type of typesToGenerate) {
            // Generate with low priority so it doesn't interfere with user requests
            const narrative = await this.microNarrative.generateCrewNarrative(crew, type, {}, 'low');
            
            // Store the generated narrative in crew record
            await this.updateCrewNarrative(crew.id, type, narrative);
          }
          
          console.log(`📝 Generated ${typesToGenerate.join(', ')} narratives for ${crew.name}`);
          
        } catch (error) {
          console.warn(`Failed to generate narratives for ${crew.name}:`, error.message);
        }
      });
      
      // Process narratives without blocking tick completion
      await Promise.allSettled(narrativePromises);
      
      // Also generate ambient world narratives occasionally
      if (this.currentTick % 10 === 0) {
        await this.generateAmbientWorldNarratives();
      }
      
      this.emit('narrative:generated', {
        tick: this.currentTick,
        crewProcessed: crewToProcess.length,
        queueStats: this.microNarrative.getQueueStats()
      });
      
    } catch (error) {
      console.error('Error in narrative generation:', error);
    }
  }

  selectRandomNarrativeTypes(allTypes) {
    // Generate 1-2 random narrative types per crew member per tick
    const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 types
    const shuffled = [...allTypes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async updateCrewNarrative(crewId, narrativeType, narrative) {
    try {
      // Store narrative in crew_narratives table or update crew record
      await query(
        `UPDATE crew_members 
         SET ${narrativeType}_narrative = $1, ${narrativeType}_narrative_updated = NOW()
         WHERE id = $2`,
        [narrative, crewId]
      );
    } catch (error) {
      // Table might not have narrative columns yet, that's okay
      console.warn(`Could not store ${narrativeType} narrative for crew ${crewId}:`, error.message);
    }
  }

  async generateAmbientWorldNarratives() {
    try {
      // Generate ambient station announcements, news, corporate memos
      const ambientTypes = [
        { type: 'station_announcement', context: { station: 'Earth Station Alpha' } },
        { type: 'corporate_memo', context: { department: 'Operations' } },
        { type: 'market_analysis', context: { trend: 'volatile' } },
        { type: 'safety_bulletin', context: { incident: 'reality_storm' } }
      ];
      
      const selected = ambientTypes[Math.floor(Math.random() * ambientTypes.length)];
      
      // Generate ambient narrative with low priority
      const narrative = await this.microNarrative.generateSystemNarrative(selected.type, selected.context, 'low');
      
      console.log(`🌌 Generated ambient narrative: ${selected.type}`);
      
      // Broadcast to all connected clients
      this.emit('ambient:narrative', {
        type: selected.type,
        narrative,
        tick: this.currentTick
      });
      
    } catch (error) {
      console.warn('Failed to generate ambient narratives:', error.message);
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

  // Helper methods for NPC integration
  getNPCsAtLocation(locationId) {
    return this.npcManager.getNPCsAtLocation(locationId);
  }

  getRandomNPCEncounter(locationId, playerFaction) {
    return this.npcManager.getRandomEncounter(locationId, playerFaction);
  }

  getNPCActivity(limit = 20) {
    return this.npcManager.getRecentActivity(limit);
  }

  async generateNPC() {
    return await this.npcManager.generateNPC();
  }
}