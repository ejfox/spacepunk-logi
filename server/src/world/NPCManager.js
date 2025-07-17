import { Chance } from 'chance';
import { query } from '../db/index.js';

const chance = new Chance();

class NPCManager {
  constructor() {
    this.npcs = new Map();
    this.actionLog = [];
    this.maxActionLog = 100;
  }

  // Generate a new NPC with personality and goals
  async generateNPC() {
    const id = `npc_${Date.now()}_${chance.string({ length: 6, alpha: true, numeric: true })}`;
    
    // Cultural backgrounds from the game world
    const cultures = ['corporate', 'agricultural', 'mining', 'scientific', 'military', 'nomadic'];
    const cultural_background = chance.pickone(cultures);
    
    // Generate personality traits
    const personality = {
      risk_tolerance: chance.floating({ min: 0, max: 1 }),
      greed: chance.floating({ min: 0, max: 1 }),
      loyalty: chance.floating({ min: 0, max: 1 }),
      aggression: chance.floating({ min: 0, max: 1 }),
      curiosity: chance.floating({ min: 0, max: 1 })
    };
    
    // NPC archetypes based on personality
    const archetype = this.determineArchetype(personality);
    
    // Generate starting resources based on archetype
    const startingCredits = this.getStartingCredits(archetype);
    
    // Get random starting location
    const locationsResult = await query('SELECT id, name FROM stations');
    const locations = locationsResult.rows;
    const location = chance.pickone(locations);
    
    // Get random faction affiliation (create basic factions if none exist)
    const factions = [
      { id: 'corporate', name: 'Corporate Collective' },
      { id: 'independent', name: 'Independent Traders' },
      { id: 'military', name: 'Military Command' },
      { id: 'pirates', name: 'Pirate Syndicate' }
    ];
    const faction = chance.pickone(factions);
    
    const npc = {
      id,
      name: this.generateNPCName(cultural_background),
      archetype,
      cultural_background,
      personality,
      location_id: location.id,
      location_name: location.name,
      credits: startingCredits,
      faction_id: faction.id,
      faction_name: faction.name,
      reputation: {},
      inventory: {},
      current_goal: null,
      goal_progress: 0,
      traits: this.generateNPCTraits(archetype, personality),
      relationships: {},
      last_action_tick: 0,
      created_at: Date.now(),
      active: true
    };
    
    // Initialize faction reputations
    factions.forEach(f => {
      npc.reputation[f.id] = f.id === faction.id ? 50 : chance.integer({ min: -50, max: 50 });
    });
    
    // Set initial goal
    npc.current_goal = this.generateGoal(npc);
    
    this.npcs.set(id, npc);
    this.logAction(npc, `${npc.name} (${npc.archetype}) has entered the sector at ${npc.location_name}`);
    
    return npc;
  }
  
  // Determine NPC archetype based on personality
  determineArchetype(personality) {
    if (personality.greed > 0.7 && personality.risk_tolerance > 0.5) return 'merchant';
    if (personality.aggression > 0.7 && personality.loyalty < 0.3) return 'pirate';
    if (personality.loyalty > 0.7 && personality.aggression > 0.5) return 'enforcer';
    if (personality.curiosity > 0.7) return 'explorer';
    if (personality.risk_tolerance < 0.3 && personality.loyalty > 0.5) return 'hauler';
    return 'freelancer';
  }
  
  // Get starting credits based on archetype
  getStartingCredits(archetype) {
    const creditRanges = {
      merchant: { min: 50000, max: 200000 },
      pirate: { min: 10000, max: 50000 },
      enforcer: { min: 30000, max: 80000 },
      explorer: { min: 20000, max: 60000 },
      hauler: { min: 40000, max: 100000 },
      freelancer: { min: 15000, max: 40000 }
    };
    
    const range = creditRanges[archetype] || creditRanges.freelancer;
    return chance.integer(range);
  }
  
  // Generate culturally appropriate NPC names
  generateNPCName(cultural_background) {
    const namePatterns = {
      corporate: () => `${chance.pickone(['Director', 'Manager', 'Executive', 'Analyst'])} ${chance.last()}`,
      agricultural: () => `${chance.first()} "${chance.pickone(['Harvest', 'Seeds', 'Soil', 'Growth'])}" ${chance.last()}`,
      mining: () => `${chance.pickone(['Drill', 'Rock', 'Ore', 'Deep'])} ${chance.last()}`,
      scientific: () => `Dr. ${chance.first()} ${chance.last()}-${chance.integer({ min: 1, max: 9 })}`,
      military: () => `${chance.pickone(['Captain', 'Major', 'Colonel', 'Sergeant'])} ${chance.last()}`,
      nomadic: () => `${chance.first()} the ${chance.pickone(['Wanderer', 'Drifter', 'Traveler', 'Nomad'])}`
    };
    
    return namePatterns[cultural_background]?.() || `${chance.first()} ${chance.last()}`;
  }
  
  // Generate NPC traits based on archetype and personality
  generateNPCTraits(archetype, personality) {
    const traits = [];
    
    // Archetype-specific traits
    const archetypeTraits = {
      merchant: ['shrewd_negotiator', 'market_savvy', 'credit_hoarder'],
      pirate: ['intimidating', 'quick_draw', 'black_market_connections'],
      enforcer: ['by_the_book', 'intimidating', 'faction_loyalist'],
      explorer: ['curious_mind', 'stellar_cartographer', 'risk_taker'],
      hauler: ['reliable', 'efficient_routes', 'cargo_specialist'],
      freelancer: ['adaptable', 'jack_of_all_trades', 'survivor']
    };
    
    // Pick 1-3 traits based on personality
    const availableTraits = archetypeTraits[archetype] || archetypeTraits.freelancer;
    const numTraits = chance.integer({ min: 1, max: 3 });
    
    for (let i = 0; i < numTraits; i++) {
      if (availableTraits.length > 0) {
        const trait = chance.pickone(availableTraits);
        traits.push(trait);
        availableTraits.splice(availableTraits.indexOf(trait), 1);
      }
    }
    
    return traits;
  }
  
  // Generate goals based on NPC type and current state
  generateGoal(npc) {
    const goals = {
      merchant: [
        { type: 'trade_profit', target: npc.credits * 1.5, description: 'Increase wealth by 50%' },
        { type: 'corner_market', resource: chance.pickone(['metals', 'food', 'tech']), description: 'Corner a market' },
        { type: 'establish_route', stations: 3, description: 'Establish profitable trade route' }
      ],
      pirate: [
        { type: 'raid_convoys', count: 5, description: 'Raid trade convoys' },
        { type: 'build_infamy', target: -100, description: 'Become feared across the sector' },
        { type: 'steal_credits', amount: 100000, description: 'Amass stolen wealth' }
      ],
      enforcer: [
        { type: 'faction_missions', count: 10, description: 'Complete faction missions' },
        { type: 'hunt_pirates', count: 3, description: 'Bring pirates to justice' },
        { type: 'increase_faction_rep', target: 100, description: 'Become faction hero' }
      ],
      explorer: [
        { type: 'visit_stations', count: 10, description: 'Chart new territories' },
        { type: 'discover_anomaly', description: 'Find something unusual' },
        { type: 'map_route', description: 'Map efficient travel routes' }
      ],
      hauler: [
        { type: 'deliver_cargo', tons: 1000, description: 'Deliver bulk cargo' },
        { type: 'perfect_record', deliveries: 20, description: 'Perfect delivery record' },
        { type: 'preferred_contractor', description: 'Become preferred contractor' }
      ],
      freelancer: [
        { type: 'survive', days: 30, description: 'Survive another month' },
        { type: 'find_work', jobs: 5, description: 'Complete various jobs' },
        { type: 'build_reputation', description: 'Build diverse reputation' }
      ]
    };
    
    const archetypeGoals = goals[npc.archetype] || goals.freelancer;
    return chance.pickone(archetypeGoals);
  }
  
  // Process all NPC actions during a tick
  async processNPCTick(currentTick) {
    const activeNPCs = Array.from(this.npcs.values()).filter(npc => npc.active);
    
    for (const npc of activeNPCs) {
      try {
        // NPCs act based on personality and goals
        if (currentTick - npc.last_action_tick >= this.getActionCooldown(npc)) {
          await this.executeNPCAction(npc, currentTick);
          npc.last_action_tick = currentTick;
        }
        
        // Check goal completion
        this.checkGoalProgress(npc);
        
        // Random events (10% chance)
        if (chance.bool({ likelihood: 10 })) {
          this.triggerRandomEvent(npc);
        }
        
        // NPC decay - they might leave the sector
        if (chance.bool({ likelihood: 1 }) && npc.credits < 1000) {
          this.retireNPC(npc, 'Ran out of credits and left the sector');
        }
      } catch (error) {
        console.error(`Error processing NPC ${npc.name}:`, error);
      }
    }
    
    // Generate new NPCs occasionally
    if (chance.bool({ likelihood: 5 })) {
      await this.generateNPC();
    }
    
    // Cleanup old action log entries
    if (this.actionLog.length > this.maxActionLog) {
      this.actionLog = this.actionLog.slice(-this.maxActionLog);
    }
  }
  
  // Get action cooldown based on NPC traits
  getActionCooldown(npc) {
    let baseCooldown = 5; // Base 5 ticks between actions
    
    if (npc.traits.includes('quick_draw')) baseCooldown -= 2;
    if (npc.traits.includes('efficient_routes')) baseCooldown -= 1;
    if (npc.personality.risk_tolerance > 0.7) baseCooldown -= 1;
    
    return Math.max(1, baseCooldown);
  }
  
  // Execute NPC action based on their current goal
  async executeNPCAction(npc, currentTick) {
    switch (npc.archetype) {
      case 'merchant':
        await this.executeMerchantAction(npc);
        break;
      case 'pirate':
        await this.executePirateAction(npc);
        break;
      case 'enforcer':
        await this.executeEnforcerAction(npc);
        break;
      case 'explorer':
        await this.executeExplorerAction(npc);
        break;
      case 'hauler':
        await this.executeHaulerAction(npc);
        break;
      default:
        await this.executeFreelancerAction(npc);
    }
  }
  
  // Merchant actions - trading and market manipulation
  async executeMerchantAction(npc) {
    try {
      // Simulate market data since we don't have full market integration yet
      const resources = ['metals', 'food', 'tech', 'fuel', 'medical'];
      const resource = chance.pickone(resources);
      const basePrice = chance.integer({ min: 10, max: 100 });
      const priceVariation = chance.floating({ min: 0.8, max: 1.2 });
      const currentPrice = Math.floor(basePrice * priceVariation);
      
      const isBuying = priceVariation < 0.9; // Buy when prices are low
      
      if (isBuying && npc.credits > currentPrice * 10) {
        // Buy low
        const quantity = Math.floor(npc.credits * 0.3 / currentPrice);
        const cost = quantity * currentPrice;
        
        npc.credits -= cost;
        npc.inventory[resource] = (npc.inventory[resource] || 0) + quantity;
        
        this.logAction(npc, `${npc.name} bought ${quantity} units of ${resource} at ${npc.location_name} for ${cost} credits`);
      } else if (!isBuying && npc.inventory[resource] > 0) {
        // Sell high
        const quantity = npc.inventory[resource];
        const revenue = quantity * currentPrice;
        
        npc.credits += revenue;
        npc.inventory[resource] = 0;
        
        this.logAction(npc, `${npc.name} sold ${quantity} units of ${resource} at ${npc.location_name} for ${revenue} credits`);
        
        // Update goal progress
        if (npc.current_goal.type === 'trade_profit') {
          npc.goal_progress = npc.credits;
        }
      } else {
        // Travel to find better deals
        this.travelToNewLocation(npc, 'Seeking better markets');
      }
    } catch (error) {
      console.error('Error in merchant action:', error);
      // Fallback to travel
      this.travelToNewLocation(npc, 'Looking for trading opportunities');
    }
  }
  
  // Pirate actions - raiding and intimidation
  async executePirateAction(npc) {
    // Find targets (other NPCs or simulated convoys)
    const targets = Array.from(this.npcs.values()).filter(
      target => target.id !== npc.id && 
                target.location_id === npc.location_id && 
                target.credits > 10000 &&
                target.archetype !== 'pirate' &&
                target.archetype !== 'enforcer'
    );
    
    if (targets.length > 0 && chance.bool({ likelihood: 60 })) {
      const target = chance.pickone(targets);
      const success = chance.bool({ likelihood: 50 + (npc.personality.aggression * 30) });
      
      if (success) {
        const stolen = Math.floor(target.credits * chance.floating({ min: 0.1, max: 0.3 }));
        target.credits -= stolen;
        npc.credits += stolen;
        
        // Update reputations
        npc.reputation[target.faction_id] = Math.max(-100, (npc.reputation[target.faction_id] || 0) - 20);
        
        this.logAction(npc, `${npc.name} successfully raided ${target.name}, stealing ${stolen} credits!`);
        
        // Target might leave
        if (target.credits < 1000) {
          this.retireNPC(target, `Left sector after being raided by ${npc.name}`);
        }
      } else {
        this.logAction(npc, `${npc.name} attempted to raid ${target.name} but failed`);
        
        // Enforcer response chance
        if (chance.bool({ likelihood: 30 })) {
          const enforcers = Array.from(this.npcs.values()).filter(e => e.archetype === 'enforcer');
          if (enforcers.length > 0) {
            const enforcer = chance.pickone(enforcers);
            enforcer.relationships[npc.id] = 'hunting';
            this.logAction(enforcer, `${enforcer.name} is now hunting pirate ${npc.name}`);
          }
        }
      }
    } else {
      // Move to find targets
      this.travelToNewLocation(npc, 'Prowling for victims');
    }
  }
  
  // Travel to a new location
  async travelToNewLocation(npc, reason = 'Traveling') {
    try {
      const locationsResult = await query('SELECT id, name FROM stations WHERE id != $1', [npc.location_id]);
      const locations = locationsResult.rows;
      
      if (locations.length > 0) {
        const destination = chance.pickone(locations);
        
        // Travel cost
        const travelCost = chance.integer({ min: 100, max: 500 });
        if (npc.credits >= travelCost) {
          npc.credits -= travelCost;
          npc.location_id = destination.id;
          npc.location_name = destination.name;
          
          this.logAction(npc, `${npc.name} traveled to ${destination.name} - ${reason}`);
          
          // Update goal progress for explorers
          if (npc.archetype === 'explorer' && npc.current_goal.type === 'visit_stations') {
            npc.goal_progress++;
          }
        }
      }
    } catch (error) {
      console.error('Error in travel:', error);
      // Fallback - just log the attempt
      this.logAction(npc, `${npc.name} attempted to travel but encountered navigation issues`);
    }
  }
  
  // Simple enforcer action
  async executeEnforcerAction(npc) {
    // Hunt pirates
    const pirates = Array.from(this.npcs.values()).filter(
      p => p.archetype === 'pirate' && p.location_id === npc.location_id
    );
    
    if (pirates.length > 0) {
      const pirate = chance.pickone(pirates);
      this.logAction(npc, `${npc.name} is pursuing pirate ${pirate.name} at ${npc.location_name}`);
      
      // Combat resolution
      if (chance.bool({ likelihood: 70 })) {
        const fine = Math.floor(pirate.credits * 0.5);
        pirate.credits -= fine;
        npc.credits += fine * 0.1; // Bounty
        
        this.logAction(npc, `${npc.name} apprehended ${pirate.name} and collected a bounty`);
        
        if (pirate.credits < 1000) {
          this.retireNPC(pirate, 'Captured by authorities');
        }
      }
    } else {
      this.travelToNewLocation(npc, 'Patrolling for criminals');
    }
  }
  
  // Simple explorer action
  async executeExplorerAction(npc) {
    // Always moving, looking for the unusual
    if (chance.bool({ likelihood: 80 })) {
      this.travelToNewLocation(npc, 'Exploring the unknown');
      
      // Chance of discovery
      if (chance.bool({ likelihood: 5 })) {
        const discovery = chance.pickone([
          'ancient debris field',
          'temporal anomaly',
          'abandoned station',
          'rare mineral deposit',
          'encrypted data cache'
        ]);
        
        this.logAction(npc, `${npc.name} discovered a ${discovery} near ${npc.location_name}!`);
        
        // Reward
        npc.credits += chance.integer({ min: 5000, max: 20000 });
      }
    }
  }
  
  // Simple hauler action
  async executeHaulerAction(npc) {
    // Simulate cargo runs
    if (npc.inventory.cargo) {
      // Deliver
      const payment = npc.inventory.cargo * chance.integer({ min: 50, max: 150 });
      npc.credits += payment;
      delete npc.inventory.cargo;
      
      this.logAction(npc, `${npc.name} delivered cargo for ${payment} credits`);
      
      if (npc.current_goal.type === 'deliver_cargo') {
        npc.goal_progress += npc.inventory.cargo || 0;
      }
    } else {
      // Pick up cargo
      const cargoSize = chance.integer({ min: 10, max: 100 });
      npc.inventory.cargo = cargoSize;
      
      this.logAction(npc, `${npc.name} picked up ${cargoSize} tons of cargo at ${npc.location_name}`);
      this.travelToNewLocation(npc, 'Hauling cargo');
    }
  }
  
  // Simple freelancer action
  async executeFreelancerAction(npc) {
    // Random odd jobs
    const actions = [
      () => {
        const payment = chance.integer({ min: 500, max: 2000 });
        npc.credits += payment;
        this.logAction(npc, `${npc.name} completed an odd job for ${payment} credits`);
      },
      () => this.travelToNewLocation(npc, 'Looking for work'),
      () => {
        const cost = chance.integer({ min: 100, max: 500 });
        if (npc.credits > cost) {
          npc.credits -= cost;
          this.logAction(npc, `${npc.name} spent ${cost} credits on supplies`);
        }
      }
    ];
    
    chance.pickone(actions)();
  }
  
  // Check and update goal progress
  checkGoalProgress(npc) {
    const goal = npc.current_goal;
    if (!goal) return;
    
    let completed = false;
    
    switch (goal.type) {
      case 'trade_profit':
        completed = npc.credits >= goal.target;
        break;
      case 'visit_stations':
        completed = npc.goal_progress >= goal.count;
        break;
      case 'deliver_cargo':
        completed = npc.goal_progress >= goal.tons;
        break;
      default:
        // Simple time-based completion for now
        completed = chance.bool({ likelihood: 5 });
    }
    
    if (completed) {
      this.logAction(npc, `${npc.name} completed goal: ${goal.description}`);
      npc.current_goal = this.generateGoal(npc);
      npc.goal_progress = 0;
    }
  }
  
  // Random events that can happen to NPCs
  triggerRandomEvent(npc) {
    const events = [
      () => {
        const loss = Math.floor(npc.credits * 0.1);
        npc.credits -= loss;
        this.logAction(npc, `${npc.name} lost ${loss} credits to station fees`);
      },
      () => {
        const otherNPC = chance.pickone(Array.from(this.npcs.values()).filter(n => n.id !== npc.id));
        if (otherNPC) {
          npc.relationships[otherNPC.id] = chance.pickone(['friend', 'rival', 'contact']);
          this.logAction(npc, `${npc.name} formed a ${npc.relationships[otherNPC.id]} relationship with ${otherNPC.name}`);
        }
      },
      () => {
        npc.personality.risk_tolerance = Math.min(1, npc.personality.risk_tolerance + 0.1);
        this.logAction(npc, `${npc.name} is feeling more adventurous after recent experiences`);
      }
    ];
    
    chance.pickone(events)();
  }
  
  // Retire an NPC from active play
  retireNPC(npc, reason) {
    npc.active = false;
    this.logAction(npc, `${npc.name} left the sector: ${reason}`);
    
    // Don't delete immediately - keep for history/encounters
    setTimeout(() => {
      this.npcs.delete(npc.id);
    }, 3600000); // Delete after 1 hour
  }
  
  // Log NPC action
  logAction(npc, message) {
    const entry = {
      timestamp: Date.now(),
      npc_id: npc.id,
      npc_name: npc.name,
      archetype: npc.archetype,
      message,
      location: npc.location_name
    };
    
    this.actionLog.push(entry);
    console.log(`[NPC] ${message}`);
  }
  
  // Get recent NPC activity for display
  getRecentActivity(limit = 20) {
    return this.actionLog.slice(-limit).reverse();
  }
  
  // Get NPCs at a specific location
  getNPCsAtLocation(locationId) {
    return Array.from(this.npcs.values()).filter(
      npc => npc.active && npc.location_id === locationId
    );
  }
  
  // Get NPC for random encounters
  getRandomEncounter(locationId, playerFaction) {
    const localNPCs = this.getNPCsAtLocation(locationId);
    if (localNPCs.length === 0) return null;
    
    // Weight encounters by reputation and personality
    const weights = localNPCs.map(npc => {
      let weight = 50;
      
      // Faction reputation affects encounter chance
      const rep = npc.reputation[playerFaction] || 0;
      weight += rep > 0 ? rep / 2 : rep / 4;
      
      // Personality affects encounter chance
      weight += npc.personality.curiosity * 20;
      weight -= npc.personality.risk_tolerance * 10;
      
      return Math.max(1, weight);
    });
    
    return chance.weighted(localNPCs, weights);
  }
  
  // Get market influence from NPC actions
  getMarketInfluence(locationId, resourceId) {
    const merchants = this.getNPCsAtLocation(locationId).filter(
      npc => npc.archetype === 'merchant' && npc.inventory[resourceId]
    );
    
    let influence = 0;
    merchants.forEach(merchant => {
      const holding = merchant.inventory[resourceId] || 0;
      influence += holding > 100 ? 0.1 : holding > 50 ? 0.05 : 0.02;
    });
    
    return Math.min(0.3, influence); // Cap at 30% influence
  }
}

export default new NPCManager();