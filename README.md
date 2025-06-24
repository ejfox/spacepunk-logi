# Spacepunk Logistics Simulation

A server-authoritative space trucking game where you manage the corporate nightmare of interstellar logistics through deliberately terrible enterprise software.

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### Installation and Launch

**Step 1: Start the Backend Services**
```bash
./start-backend.sh
```
This initializes PostgreSQL, Redis, and the game server with procedurally generated universe data.

**Step 2: Launch the Frontend Interface**
```bash
./start-frontend.sh
```
This starts the brutalist management interface on port 3667.

### Access Points
- **Game Interface**: http://localhost:3667
- **God Mode Dashboard**: http://localhost:3667/god-mode (development oversight panel)
- **Backend API**: http://localhost:3666
- **WebSocket Connection**: ws://localhost:3666

### System Status Verification
The god mode dashboard provides real-time monitoring of all universe systems, market chaos levels, and crew psychological states. Use it to verify proper initialization before beginning operations.

### Common Issues
- **Connection failures**: Ensure backend services are fully initialized before accessing frontend
- **Permission errors**: Execute `chmod +x start-*.sh` to enable script execution
- **Port conflicts**: Terminate existing processes on ports 3666 and 3667

---

# Spacepunk Logistics Sim - Technical Design Brief

Executive Summary
We're building a server-authoritative, tick-based space logistics simulation with emergent narrative generation. Players manage a single ship with deep crew relationships, engage in complex resource trading across faction-controlled markets, and experience procedurally generated missions that reflect their unique playstyle over dozens of hours.

The game embraces progressive complexity revelation through a brutalist HTML interface that grows organically with player capabilities. An LLM system generates personalized missions and narrative consequences, creating emergent stories where players become the protagonists of their own space operas.

Core Pillars:

• Single ship focus with 40+ hour progression curves
• Dwarf Fortress-depth crew management with generational memory
• 150 resources across 4 categories with real-time market simulation
• LLM-driven mission generation that adapts to player behavior patterns
• Server-authoritative tick system with visible heartbeat (4-60 second intervals)
• Brutalist progressive UI that scales with earned complexity---Technical Architecture Overview

Server Infrastructure
• Docker containerized Node.js simulation engine
• PostgreSQL/Supabase for persistent data storage
• WebSocket real-time communication between client and server
• Redis for session management and real-time market data
• Tick-based world simulation running on server with configurable intervals
Client Architecture
• Vue.js 3 with Composition API for reactive interface management
• D3.js for data visualization (resource flows, crew relationships, ship schematics)
• Minimal client-side state - almost everything authoritative on server
• Progressive HTML interface that expands based on player progression
• WebSocket event handling for real-time updates
Data Flow

Client Input → WebSocket → Server Validation → Tick Processing → 
Database Update → WebSocket Broadcast → Client State Update
---Core Game Systems Design

1. Tick-Based World Simulation
Tick Architecture:

• World processes in discrete time steps (4-60 seconds depending on server load)
• All players experience simultaneous tick resolution
• Visible server heartbeat creates shared temporal experience
• Tick processing includes: crew actions, market fluctuations, mission generation, faction politics

Tick Processing Order:

1. Resource Systems - consumption, production, degradation
2. Crew Systems - skill development, relationship changes, aging
3. Market Systems - price fluctuations, supply/demand adjustments
4. Mission Systems - LLM generation, expiration, consequence resolution
5. Faction Systems - reputation changes, political shifts
6. Communication Systems - broadcast updates to all connected clients
2. Ship and Crew Management
Ship Modularity:

• Component-based architecture where every ship system is upgradeable
• Material choices affect aesthetics, efficiency, and cultural faction preferences
• Facility degradation requires maintenance and cleaning to prevent crew mutiny
• Size/weight trade-offs impact fuel consumption and maneuverability

Crew Depth System:

• Individual personality tracking - bravery, loyalty, work ethic, relationships
• Skill development based on assigned tasks and player treatment
• Memory persistence - crew remember player decisions and treatment over time
• Generational reputation - crew families and cultures maintain opinions across hiring cycles
• Relativistic aging - crew experience subjective time based on ship travel and player absence
• Social dynamics - crew relationships affect ship efficiency and potential for sabotage/mutiny

Data Models:

// Crew Member Schema
{
  id: UUID,
  name: String,
  skills: { engineering: 0-100, piloting: 0-100, social: 0-100, combat: 0-100 },
  personality: { bravery: 0-100, loyalty: 0-100, ambition: 0-100 },
  relationships: { [crewId]: -100 to 100 },
  memories: [{ event: String, sentiment: Number, timestamp: Date }],
  family: { homeworld: String, culture: String, lineage: [UUID] },
  status: { health: 0-100, morale: 0-100, fatigue: 0-100 }
}

// Ship Component Schema
{
  id: UUID,
  type: Enum[engine, weapon, sensor, living_quarters, cargo],
  material: Enum[steel, aluminum, carbon_fiber, exotic_matter],
  condition: 0-100,
  efficiency: 0-200,
  cultural_preference: [faction_ids],
  upgrade_tree: [component_ids]
}

3. Resource and Market System
Resource Categories:

• Tech - ship components, weapons, sensors, computers
• Consumable - fuel, food, medicine, ammunition
• Green - biological materials, agricultural products, environmental systems
• Luxury - art, entertainment, rare materials, cultural items

Market Dynamics:

• Real-time price fluctuations based on supply/demand algorithms
• Faction control - different factions prefer/restrict certain resources
• Player impact - large trades affect local market prices
• Smuggling alternatives - bypass faction restrictions through black market contacts
• Reputation pricing - faction standing affects base prices and availability

Economic Data Flow:

// Market Price Calculation (per tick)
base_price = resource.base_value
faction_modifier = player.reputation[controlling_faction] * 0.01
supply_demand = (local_supply / local_demand) * volatility_factor
final_price = base_price * faction_modifier * supply_demand

4. LLM Mission Generation System
Mission Template Architecture:

• Core patterns - transport, investigation, combat, diplomacy, exploration
• Narrative context injection - player history, crew personalities, faction standings
• Consequence tracking - previous mission outcomes affect future opportunities
• Specialization detection - identify player patterns (e.g., carrot trading) and generate themed content

LLM Integration Points:

1. Mission Brief Generation - contextualized objectives based on player profile
2. Crew Dialogue - unscripted responses based on crew personality and relationship status
3. Narrative Consequences - long-term world changes that reflect player choices
4. Flavor Text - ship logs, news reports, faction communications

Implementation Strategy:

// Mission Generation Pipeline
player_profile = analyze_player_behavior(last_50_actions)
available_templates = filter_by_ship_capabilities(mission_templates)
contextual_mission = llm_generate({
  template: selected_template,
  player_history: player_profile,
  crew_composition: current_crew,
  faction_standings: reputation_data,
  current_cargo: ship_inventory
})

5. Progressive Interface System
Complexity Scaling Philosophy:

• Earned complexity - new interface elements appear only when player gains relevant capabilities
• Organic growth - UI expands naturally rather than through arbitrary unlocks
• Brutalist aesthetic - unstyled HTML that gains beauty through functional depth
• Information density - complex players see more data, simple players see simplified views

UI Evolution Examples:

• Starting State - 3 buttons: "Launch", "Market", "Crew"
• Early Game - +inventory management, +basic ship status
• Mid Game - +crew relationships, +faction standings, +mission logs
• Late Game - +complex market analytics, +multi-system crew management, +reputation tracking---Technical Implementation Details

Database Schema Design
Core Tables:

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY,
  ship_id UUID REFERENCES ships(id),
  credits BIGINT DEFAULT 1000,
  reputation JSONB, -- {faction_id: -1000 to 1000}
  created_at TIMESTAMP,
  last_seen TIMESTAMP
);

-- Ships  
CREATE TABLE ships (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  components JSONB, -- array of component objects
  location JSONB, -- {galaxy: int, system: int, planet: int}
  condition_overall FLOAT DEFAULT 100.0
);

-- Crew
CREATE TABLE crew_members (
  id UUID PRIMARY KEY,
  current_ship_id UUID REFERENCES ships(id),
  personal_data JSONB, -- skills, personality, memories
  hiring_history JSONB, -- array of {ship_id, start_date, end_date, performance}
  family_data JSONB -- homeworld, culture, lineage
);

-- Resources & Market
CREATE TABLE market_data (
  id UUID PRIMARY KEY,
  location JSONB,
  resource_id INT,
  current_price FLOAT,
  supply_level INT,
  demand_level INT,
  controlling_faction UUID,
  last_updated TIMESTAMP
);

-- Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  mission_data JSONB, -- LLM generated content
  status ENUM('available', 'active', 'completed', 'failed'),
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

Real-Time Communication
WebSocket Event Types:

// Client → Server
{
  type: 'player_action',
  action: 'hire_crew' | 'buy_resource' | 'accept_mission' | 'move_ship',
  data: { /* action-specific payload */ }
}

// Server → Client  
{
  type: 'tick_update',
  tick_number: 12847,
  changes: {
    ship_status: { /* updated ship data */ },
    crew_updates: [{ crew_id, changes }],
    market_changes: [{ resource_id, new_price }],
    new_missions: [{ mission_data }]
  }
}

{
  type: 'server_heartbeat',
  tick_number: 12847,
  next_tick_eta: 4500, // milliseconds
  active_players: 47
}

LLM Integration Architecture
Mission Generation Service:

class MissionGenerator {
  async generateMission(player, context) {
    const prompt = this.buildPrompt({
      playerHistory: await this.getPlayerBehaviorProfile(player.id),
      crewComposition: player.ship.crew,
      currentLocation: player.ship.location,
      factionStandings: player.reputation,
      availableTemplates: this.getMissionTemplates()
    });
    
    const llmResponse = await this.callLLM(prompt);
    return this.validateAndFormatMission(llmResponse);
  }
  
  buildPrompt(context) {
    return `Generate a space mission for a player who has demonstrated these behavior patterns: ${context.playerHistory.summary}. 
    Their crew includes: ${context.crewComposition.map(c => c.specialty).join(', ')}.
    They are currently at: ${context.currentLocation.description}.
    Mission should reflect their established playstyle and create interesting consequences.`;
  }
}

Performance Optimization
Tick Processing Optimization:

• Dirty flagging - only process entities that changed since last tick
• Batch database operations - minimize individual queries within tick processing
• Predictive caching - preload commonly accessed player data
• Graceful degradation - extend tick intervals under high load rather than dropping updates

Client-Side Optimization:

• Minimal state synchronization - only send changed data to clients
• Progressive rendering - update UI components incrementally as data arrives
• Local prediction - show immediate feedback for player actions, confirm with server---Development Phases

Phase 1: Core Infrastructure (4-6 weeks)
• Goal: Basic tick system with ship movement and simple crew
• Deliverables:
• Docker containerized Node.js server with PostgreSQL
• WebSocket communication layer
• Basic ship and crew data models
• Simple tick processing for ship systems
• Minimal Vue.js client with brutalist HTML interface
Phase 2: Resource Economy (3-4 weeks)
• Goal: 150 resource system with real-time market
• Deliverables:
• Complete resource catalog and categorization
• Market price simulation with supply/demand
• Player trading interface
• Faction-based pricing modifiers
• Basic inventory management
Phase 3: Deep Crew System (5-6 weeks)
• Goal: Dwarf Fortress-level crew complexity
• Deliverables:
• Personality and relationship tracking
• Memory system for crew interactions
• Skill development and aging mechanics
• Crew hiring/firing with reputation consequences
• Mutiny and sabotage systems
Phase 4: LLM Mission Generation (4-5 weeks)
• Goal: Procedural mission system with narrative coherence
• Deliverables:
• LLM integration service
• Mission template system
• Player behavior analysis and profiling
• Narrative consequence tracking
• Mission outcome impact on world state
Phase 5: Progressive Interface (3-4 weeks)
• Goal: UI that scales with player complexity
• Deliverables:
• Dynamic interface generation based on player capabilities
• D3.js visualizations for complex data
• Contextual help and information density controls
• Mobile-responsive brutalist design
Phase 6: MMO Polish & Balance (4-6 weeks)
• Goal: Stable multi-player experience with long-term progression
• Deliverables:
• Player-to-player resource trading
• Faction politics and reputation consequences
• Long-term progression balance testing
• Performance optimization for 100+ concurrent players
• Anti-cheat and data validation systems---Success Metrics & Technical Requirements

Performance Targets
• Server capacity: 1000+ concurrent players with 4-6 second tick times
• Data persistence: 99.9% uptime with automated backups
• Client responsiveness: <100ms WebSocket round-trip for player actions
• Memory efficiency: <2GB RAM usage per 100 active players
Gameplay Metrics
• Retention: Players logging in after 1 week, 1 month, 3 months
• Progression depth: Average time to first major ship upgrade (target: 30-40 hours)
• Emergent complexity: Number of unique player specialization patterns detected
• Narrative quality: Player satisfaction with LLM-generated mission coherence
Technical Validation
• Data integrity: Crew memory and relationship consistency over multiple sessions
• Economic simulation: Market price stability and realistic supply/demand responses
• Mission relevance: LLM missions appropriately reflecting player behavior patterns
• Interface scaling: UI complexity growing smoothly with player capabilities---Risk Assessment & Mitigation

High-Risk Technical Challenges
LLM Integration Reliability:

• Risk: Inconsistent or inappropriate mission generation
• Mitigation: Robust prompt engineering, validation layers, fallback to template system

Real-Time Synchronization at Scale:

• Risk: Tick processing slowdown with high player count
• Mitigation: Horizontal scaling, database optimization, graceful degradation

Data Model Complexity:

• Risk: Crew relationship and memory systems becoming unwieldy
• Mitigation: Incremental feature development, extensive automated testing
Medium-Risk Design Challenges
Player Onboarding Complexity:

• Risk: New players overwhelmed by eventual system depth
• Mitigation: Careful progressive revelation, optional complexity layers

Economic Balance:

• Risk: Resource market exploitation or stagnation
• Mitigation: Simulation testing, player behavior monitoring, tuning parameters

Long-Term Engagement:

• Risk: Players exhausting content before emergent systems mature
• Mitigation: Focus on systemic depth over content breadth, robust procedural generation---Conclusion
This technical design provides a roadmap for building a genuinely innovative space simulation that combines the depth of traditional 4X games with the emergent storytelling potential of modern LLM technology. The server-authoritative tick system ensures fair play while the progressive interface philosophy creates an experience that grows with the player's mastery.

The key innovation lies in treating the LLM not as a chatbot, but as a dynamic content generator that creates personalized narratives reflecting each player's unique approach to the simulation. Combined with the deep crew relationship system and real-time economic simulation, this creates the potential for truly emergent gameplay where players become the protagonists of their own space operas.

Success depends on careful attention to performance optimization, data model design, and the progressive revelation of complexity that allows both casual and hardcore players to find their optimal level of engagement within the same shared universe.
---
Spacepunk Logistics Sim - Core Systems Architecture Brief

Executive Summary
We're building a server-authoritative, tick-based space logistics simulation with emergent narrative generation, focusing on permadeath progression and deep social systems. Players manage a single ship with complex crew relationships, engage in resource trading across faction-controlled markets, and experience procedurally generated missions that reflect their unique playstyle.

The game operates on degrading information networks where intel spreads organically through crew and faction relationships, creating emergent storytelling opportunities. Players experience the universe through indirect command structure, managing ship operations through trusted lieutenants while dealing with hidden crew problems that fester until they explode.

Core Innovation: Permadeath with persistent crew memory - crew members survive player death and remember your treatment across multiple lives, creating long-term reputation consequences that span generations.---Fundamental Design Principles

1. Permadeath with Continuity
• Player characters die permanently - no save games, no resurrection
• Crew members persist in the world after player death
• Relationship memory survives across player lives through:
• Direct crew memory (if they survive)
• Family/lineage reputation inheritance
• Cultural legends and stories
• Recorded intel networks
2. Indirect Command Structure
• Players remain in quarters except for exceptional circumstances
• Information flows through hierarchy - department heads, trusted seconds
• Hidden problems fester until they cause major failures or complaints
• Probability-based crew behavior influenced by relationship scores
3. Organic Information Networks
• Intel spreads naturally through crew relationships and social connections
• Information degrades and mutates as it passes through unreliable sources
• Liar entities actively corrupt true intel into gossip and disinformation
• Reputation affects intel reliability and propagation patterns
4. Economic Specialization Rewards
• Thematic consistency provides gameplay advantages
• Crew + equipment synergies reward focused playstyles
• Cultural preferences create market opportunities and restrictions
• Long-term reputation affects availability of specialized opportunities---Core Data Architecture

Component System (150 Items, 4 Categories)
Category Structure:

• Core (25 components) - Essential ship systems, starting equipment
• Standard (50 components) - Common upgrades, reliable improvements
• Advanced (50 components) - Specialized equipment, faction-specific tech
• Legendary (25 components) - Rare/unique items with extraordinary capabilities

Role-Focused Distribution:

• Hauler - Cargo optimization, fuel efficiency, automation systems
• Fighter - Weapons, armor, targeting systems, tactical equipment
• Explorer - Sensors, long-range systems, survival equipment
• Social - Crew facilities, communication arrays, diplomatic tools

Component Data Model:

{
  id: "organic_matter_lab_mk3",
  name: "Organic Matter Laboratory Mk3",
  category: "advanced",
  role_focus: ["social", "hauler"],
  base_stats: {
    power_consumption: 45,
    crew_requirement: 2,
    space_requirement: 8
  },
  economic_impact: {
    operating_cost_multiplier: 1.3,
    market_access: ["biotech_black_market", "agricultural_guilds"],
    revenue_potential: ["genetic_modification", "pharmaceutical_synthesis"]
  },
  crew_synergies: {
    scientist: { efficiency: +25, unlock_capabilities: ["crispr_modification"] },
    criminal: { efficiency: +15, unlock_capabilities: ["drug_synthesis"] },
    agricultural: { efficiency: +20, unlock_capabilities: ["crop_optimization"] }
  },
  cultural_preferences: {
    mars_colonies: +15,
    corporate_sectors: -10,
    agricultural_worlds: +25
  },
  hidden_capabilities: [
    {
      trigger: "crew_scientist_level_5",
      unlock: "rare_genetic_templates"
    },
    {
      trigger: "component_bio_reactor",
      unlock: "self_sustaining_ecosystem"
    }
  ]
}

Relationship and Opinion System
Opinion Target Types:

• Individual - Specific crew members, NPCs, other players
• Lineage - Family bloodlines spanning multiple generations
• Organization - Factions, guilds, criminal organizations
• Legacy - Previous player captain identities across multiple lives

Relationship Data Model:

{
  source_entity_id: "crew_member_zara_morrison",
  target_entity_type: "legacy_captain",
  target_entity_id: "captain_vex_nightshade_life_3",
  opinion_score: 73,
  relationship_tags: ["former_captain", "mars_colonial", "corporate_trader"],
  memory_note: "Saved my family's mining operation from bankruptcy. Never forgot crew birthdays. Shot first, asked questions later.",
  last_interaction: "2387-03-15T14:30:00Z",
  interaction_count: 47,
  cultural_modifiers: {
    mars_colonial_loyalty: +15,
    family_honor_debt: +25,
    corporate_distrust: -5
  }
}


Cultural Interpretation Layer:
Each crew member's cultural background affects how they interpret entity tags:

crew_cultural_profile: {
  homeworld: "mars_colonies",
  social_class: "working_class",
  family_tradition: "mining_guild",
  personal_values: ["loyalty", "pragmatism", "family_honor"],
  tag_interpretations: {
    "corporate_trader": -15,
    "crew_loyal": +20,
    "mars_colonial": +30,
    "family_employer": +25
  }
}

Intel and Information Propagation
Intel Packet Structure:

{
  id: "intel_vex_carrot_operation_2387",
  content: "Captain Vex has cornered 40% of the carrot seed market in Sector 7",
  intel_type: "market_opportunity",
  reliability_score: 85, // 0-100, degrades as it spreads
  entity_references: [
    "captain_vex_nightshade_life_3",
    "carrot_seeds_resource",
    "sector_7_trade_routes"
  ],
  source_entity: "merchant_trader_kim",
  creation_timestamp: "2387-03-20T10:15:00Z",
  propagation_path: [
    {entity: "merchant_trader_kim", reliability_impact: 0},
    {entity: "bartender_omega_station", reliability_impact: -5},
    {entity: "crew_member_jones", reliability_impact: -3}
  ],
  mutation_history: [
    "Captain Vex controls most carrot trading in the sector",
    "Some captain is manipulating agricultural markets",
    "There's money to be made in carrot smuggling"
  ]
}


Information Propagation Rules:

• Direct Transfer - Intel passes between entities with relationship connections
• Reliability Decay - Each transfer reduces reliability based on source credibility
• Network Clustering - Intel tends to stay within cultural/factional groups
• Mutation Probability - Unreliable sources may alter intel content
• Liar Entity Corruption - Some NPCs intentionally spread false information

Propagation Algorithm:

function propagateIntel(intel, currentEntity, targetEntity) {
  const relationship = getRelationship(currentEntity, targetEntity);
  const transferProbability = calculateTransferProbability(relationship);
  
  if (random() < transferProbability) {
    const reliabilityLoss = calculateReliabilityLoss(currentEntity, intel);
    const mutationChance = calculateMutationChance(currentEntity, intel);
    
    if (random() < mutationChance) {
      intel = mutateIntelContent(intel, currentEntity);
    }
    
    intel.reliability_score -= reliabilityLoss;
    intel.propagation_path.push({
      entity: targetEntity.id,
      reliability_impact: -reliabilityLoss
    });
    
    return intel;
  }
  return null;
}

Crew Agency and Autonomous Behavior
Crew Decision Making Framework:
Crew members make autonomous decisions based on:

• Opinion scores toward player, other crew, factions
• Personality traits (ambition, loyalty, competence, reliability)
• Current stress levels (workload, ship condition, recent events)
• Peer influence (other crew members' opinions and actions)

Autonomous Action Categories:

1. Work Performance:

performance_modifier = base_competence * 
  (1 + opinion_of_captain * 0.01) * 
  (1 - stress_level * 0.005) * 
  cultural_work_ethic_modifier


2. Social Actions:

• Gossip propagation - spread intel and opinions through crew network
• Recruitment influence - affect hiring success of friends/family
• Reputation building - enhance or damage player reputation in home networks

3. Sabotage and Resistance:

sabotage_probability = Math.max(0, 
  (50 - opinion_of_captain) * 0.02 * 
  stress_multiplier * 
  personality_vindictiveness
);


4. Initiative and Loyalty:

• Overtime work - exceed assigned duties when highly motivated
• Problem solving - proactively address ship issues
• Protective actions - defend player reputation in social networks

Crew Task Assignment System:

ship_departments: {
  engineering: {
    head: "crew_member_zara",
    staff: ["crew_member_torres", "crew_member_chen"],
    responsibilities: ["power_systems", "life_support", "repairs"],
    performance_impact: "ship_efficiency"
  },
  navigation: {
    head: "crew_member_pilot_jones",
    staff: ["crew_member_navigator_kim"],
    responsibilities: ["route_planning", "sensor_operations"],
    performance_impact: "fuel_efficiency"
  },
  security: {
    head: "crew_member_security_chief_rivera",
    staff: ["crew_member_martinez", "crew_member_okafor"],
    responsibilities: ["crew_discipline", "cargo_protection"],
    performance_impact: "crew_morale"
  }
}
---Technical Implementation Architecture

Server Infrastructure
Tick-Based Processing Engine:

class WorldSimulator {
  async processTick() {
    const tickStart = Date.now();
    
    // Phase 1: Resource and Ship Systems
    await this.processShipSystems();
    await this.processResourceConsumption();
    
    // Phase 2: Crew Behavior and Relationships
    await this.processCrewActions();
    await this.updateRelationships();
    
    // Phase 3: Intel Propagation
    await this.propagateIntel();
    
    // Phase 4: Market Fluctuations
    await this.updateMarketPrices();
    
    // Phase 5: Mission Generation
    await this.generateMissions();
    
    // Phase 6: Broadcast Updates
    await this.broadcastTickUpdates();
    
    const tickDuration = Date.now() - tickStart;
    this.adjustTickInterval(tickDuration);
  }
}


Database Schema for Core Systems:

-- Ships and Components
CREATE TABLE ships (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  name VARCHAR(255),
  hull_type VARCHAR(100),
  location JSONB, -- {galaxy, system, coordinates}
  condition_overall FLOAT DEFAULT 100.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ship_components (
  id UUID PRIMARY KEY,
  ship_id UUID REFERENCES ships(id),
  component_type VARCHAR(100),
  component_id VARCHAR(100), -- references component catalog
  condition FLOAT DEFAULT 100.0,
  upgrade_level INTEGER DEFAULT 0,
  installation_date TIMESTAMP DEFAULT NOW(),
  last_maintenance TIMESTAMP
);

-- Crew and Relationships
CREATE TABLE crew_members (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  current_ship_id UUID REFERENCES ships(id),
  skills JSONB, -- {engineering: 45, piloting: 67, social: 23, combat: 12}
  personality JSONB, -- {loyalty: 78, ambition: 34, competence: 89}
  cultural_background JSONB,
  hire_date TIMESTAMP,
  birth_date DATE,
  homeworld VARCHAR(100),
  family_lineage UUID[] -- array of related crew member IDs
);

CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  source_entity_id UUID,
  source_entity_type VARCHAR(50), -- crew_member, player, faction, etc.
  target_entity_id UUID,
  target_entity_type VARCHAR(50),
  opinion_score INTEGER CHECK (opinion_score >= -100 AND opinion_score <= 100),
  relationship_tags TEXT[],
  memory_note VARCHAR(140),
  last_interaction TIMESTAMP,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Intel System
CREATE TABLE intel_packets (
  id UUID PRIMARY KEY,
  content TEXT,
  intel_type VARCHAR(100),
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  entity_references UUID[], -- entities this intel is about
  source_entity_id UUID,
  source_entity_type VARCHAR(50),
  creation_timestamp TIMESTAMP DEFAULT NOW(),
  propagation_path JSONB, -- array of {entity, reliability_impact}
  mutation_history TEXT[],
  expires_at TIMESTAMP
);

CREATE TABLE intel_entity_knowledge (
  entity_id UUID,
  entity_type VARCHAR(50),
  intel_id UUID REFERENCES intel_packets(id),
  learned_at TIMESTAMP DEFAULT NOW(),
  reliability_when_learned INTEGER,
  PRIMARY KEY (entity_id, entity_type, intel_id)
);

-- Market and Economy
CREATE TABLE market_data (
  id UUID PRIMARY KEY,
  location JSONB, -- {galaxy, system, station}
  resource_id VARCHAR(100),
  current_price DECIMAL(10,2),
  supply_level INTEGER,
  demand_level INTEGER,
  controlling_faction_id UUID,
  price_history JSONB, -- recent price points for trend analysis
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE player_transactions (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  transaction_type VARCHAR(50), -- buy, sell, trade
  resource_id VARCHAR(100),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  location JSONB,
  counterparty_id UUID, -- other player, NPC, or market
  counterparty_type VARCHAR(50),
  transaction_timestamp TIMESTAMP DEFAULT NOW()
);

Real-Time Communication System
WebSocket Event Architecture:

// Client → Server Events
const CLIENT_EVENTS = {
  PLAYER_ACTION: 'player_action',
  REQUEST_CREW_REPORT: 'request_crew_report',
  GIVE_SHIP_ORDER: 'give_ship_order',
  TRADE_RESOURCES: 'trade_resources',
  HIRE_CREW: 'hire_crew',
  UPGRADE_COMPONENT: 'upgrade_component'
};

// Server → Client Events  
const SERVER_EVENTS = {
  TICK_UPDATE: 'tick_update',
  CREW_REPORT: 'crew_report',
  INTEL_UPDATE: 'intel_update',
  MARKET_CHANGE: 'market_change',
  SHIP_EMERGENCY: 'ship_emergency',
  SERVER_HEARTBEAT: 'server_heartbeat'
};

// Example tick update payload
{
  type: 'tick_update',
  tick_number: 15847,
  ship_status: {
    hull_condition: 94.2,
    power_level: 78.5,
    crew_morale: 67.3,
    fuel_remaining: 2847
  },
  crew_updates: [
    {
      crew_id: "zara_morrison_engineer",
      status_change: "completed_reactor_optimization",
      performance_delta: +5,
      mood_change: +3
    }
  ],
  intel_received: [
    {
      intel_id: "market_opportunity_omega_station",
      content: "Rare metals shortage at Omega Station driving prices up 200%",
      reliability: 73,
      source: "bartender_networks"
    }
  ],
  market_updates: [
    {
      resource: "fusion_fuel",
      location: "sector_7_hub",
      price_change: -0.15,
      new_price: 12.85
    }
  ]
}

LLM Integration for Mission Generation
Mission Context Builder:

class MissionContextBuilder {
  buildPlayerProfile(playerId) {
    return {
      current_specialization: this.detectSpecialization(playerId),
      recent_actions: this.getRecentActions(playerId, 50),
      crew_composition: this.getCrewSpecialties(playerId),
      faction_standings: this.getFactionReputation(playerId),
      economic_focus: this.getTradePatterns(playerId),
      risk_tolerance: this.calculateRiskProfile(playerId),
      reputation_summary: this.getReputationSummary(playerId)
    };
  }
  
  generateMissionPrompt(playerProfile, context) {
    return `Generate a space logistics mission for a captain with this profile:
    
    Specialization: ${playerProfile.current_specialization}
    Crew Strengths: ${playerProfile.crew_composition.join(', ')}
    Faction Relations: ${JSON.stringify(playerProfile.faction_standings)}
    Recent Focus: ${playerProfile.economic_focus}
    
    Mission should:
    - Reflect their established playstyle patterns
    - Create opportunities for their crew's skills
    - Have consequences that affect their reputation networks
    - Include specific details about locations, people, and resources
    
    Current context: ${context.current_location} - ${context.local_situation}
    
    Format response as JSON with: objective, background, requirements, rewards, risks, special_notes`;
  }
}


Mission Outcome Processing:

class MissionOutcomeProcessor {
  async processMissionCompletion(missionId, outcome) {
    const mission = await this.getMission(missionId);
    const player = await this.getPlayer(mission.player_id);
    
    // Update player reputation based on mission outcome
    await this.updateReputationFromMission(player, mission, outcome);
    
    // Generate intel about mission results
    const intel = await this.generateMissionIntel(mission, outcome);
    await this.injectIntelIntoNetwork(intel, mission.location);
    
    // Update crew relationships based on mission stress/success
    await this.updateCrewFromMission(player.ship_id, mission, outcome);
    
    // Generate follow-up opportunities
    await this.generateFollowUpMissions(player, mission, outcome);
  }
}
---Game Flow and Player Experience

New Player Onboarding Flow
Character Creation:

1. Basic ship assignment - small cargo hauler with basic life support
2. Initial crew hiring - 3-4 crew members from starting location
3. Starting resources - minimal credits, basic fuel and supplies
4. Tutorial mission - simple cargo delivery to adjacent system

Progressive Complexity Revelation:

• First 2 hours: Basic movement, simple trading, crew status monitoring
• Hours 3-10: Component upgrades, crew relationship management
• Hours 11-25: Faction reputation, intel networks, crew specialization
• Hours 26-40: Advanced component synergies, complex mission chains
• Hours 40+: Full system mastery, reputation legacy, crew dynasties
Death and Continuity Mechanics
Player Death Triggers:

• Ship destruction - combat, accident, sabotage
• Crew mutiny - relationship failures leading to violent overthrow
• System failure - critical ship systems failing during dangerous situations
• Faction execution - severe reputation consequences

Post-Death Sequence:

1. Crew survival determination - based on circumstances of death
2. Reputation inheritance - surviving crew spread stories about player
3. Intel generation - death circumstances become intel in networks
4. Crew dispersal - survivors join other ships or return to homeworlds
5. Legacy tracking - player's actions become part of NPC memory systems

New Life Initialization:

1. Fresh character creation - new identity, starting ship
2. World continuity - same universe with consequences of previous actions
3. Crew reconnection opportunities - former crew may be found and hired
4. Reputation echoes - stories about previous identity affect new character
5. Intel inheritance - some information about previous life may be discoverable
Long-Term Progression and Emergent Narratives
Reputation Legacy System:

• Family lineages remember - crew families maintain opinions across generations
• Cultural group memory - entire planets/factions remember significant actions
• Mythological status - exceptional players become legends affecting all interactions
• Historical intel - major actions become permanent part of universe history

Emergent Specialization Examples:

The Carrot Kingpin:

• Focuses on agricultural trade routes
• Crews with agricultural specialists and scientists
• Develops black market networks for genetic modification
• Intel networks spread stories about "carrot mafia" operations
• Crew families become agricultural crime dynasties

The Crew Whisperer:

• Invests heavily in crew relationships and facilities
• Develops reputation for treating crew exceptionally well
• Attracts high-quality crew through family recommendations
• Creates networks of loyal former crew across the galaxy
• Ship becomes traveling university for crew development

The Ghost Captain:

• Dies and returns multiple times with same specialized approach
• Former crew become believers in captain's "immortality"
• Intel networks spread supernatural rumors
• Each death and return strengthens mythological reputation
• Crew loyalty transcends normal relationship mechanics---Technical Performance Requirements

Scalability Targets
• 100 concurrent players - 4-6 second tick processing
• 500 concurrent players - 6-15 second tick processing
• 1000+ concurrent players - 15-60 second tick processing with graceful degradation
Data Storage Optimization
• Relationship pruning - remove relationships below threshold values
• Intel expiration - automatic cleanup of old, irrelevant intel
• Historical compression - aggregate old transaction and action data
• Crew lifecycle management - retire old crew members to improve performance
Memory Management
• Lazy loading - load crew/relationship data only when needed
• Caching layers - Redis for frequently accessed reputation data
• Batch processing - group database operations during tick processing
• Background tasks - move non-critical updates to separate processes---Security and Anti-Cheat Architecture

Server-Side Validation
• All state changes must be validated on server before persistence
• Rate limiting on player actions to prevent automation abuse
• Economic validation - impossible transactions are rejected and logged
• Relationship validation - opinion changes must have valid triggers
Data Integrity Protection
• Cryptographic signatures on critical game state changes
• Audit logging for all player actions affecting economy or reputation
• Anomaly detection for impossible progression or reputation changes
• Rollback capabilities for detected cheating or data corruption
Privacy and Consent
• Crew memory limitations - NPCs remember only game-relevant information
• Intel sanitization - personal information filtering in intel propagation
• Player data separation - clear boundaries between player and NPC data
• Opt-out mechanisms - players can request reputation data deletion---Development Priorities and Risk Assessment

High-Priority Core Systems (Weeks 1-8)
1. Tick processing engine with basic ship and crew state management
2. Component system with economic stat impacts and crew synergies
3. Relationship database with opinion tracking and cultural modifiers
4. Basic intel propagation without complex mutation or corruption
Medium-Priority Features (Weeks 9-16)
1. LLM mission generation with player behavior analysis
2. Advanced crew agency with autonomous decision-making
3. Intel corruption and mutation by unreliable sources
4. Death and continuity mechanics with crew memory persistence
Lower-Priority Polish (Weeks 17-24)
1. Advanced UI scaling with complexity revelation
2. Cross-player crew interactions and rare MMO elements
3. Performance optimization for large player populations
4. Anti-cheat hardening and security audit
Technical Risk Mitigation
High Risk - LLM Integration:

• Mitigation: Robust fallback systems, extensive prompt testing, cost controls

Medium Risk - Relationship Complexity:

• Mitigation: Incremental feature rollout, performance monitoring, data pruning

Medium Risk - Intel System Performance:

• Mitigation: Efficient graph algorithms, caching layers, background processing

Low Risk - Economic Balance:

• Mitigation: Simulation testing, player behavior monitoring, tuning parameters---Success Metrics and Analytics

Player Engagement Metrics
• Session length trends - are players staying engaged longer over time?
• Death/restart frequency - how often do players accept permadeath and continue?
• Crew relationship depth - percentage of players investing in crew systems
• Specialization emergence - variety and creativity of player specializations
System Health Metrics
• Tick processing performance - maintaining target intervals under load
• Database growth rates - ensuring sustainable data storage patterns
• Intel network activity - healthy information flow through crews and factions
• Economic stability - market prices and trade volume sustainability
Emergent Narrative Quality
• Mission relevance scores - player satisfaction with LLM-generated content
• Reputation consequence impact - how often past actions affect current gameplay
• Cross-life continuity - successful crew reconnections and reputation inheritance
• Unique story generation - diversity and creativity of emergent player narratives

Spacepunk Trait System - Complete Design Document

Core Philosophy
The trait system embraces hilariously banal descriptions for incredible cosmic abilities, fitting the spacepunk aesthetic where extraordinary things are treated as mundane workplace skills. Players experience traits through emergent gameplay rather than mechanical optimization, with trait awareness itself requiring specialized knowledge.---System Architecture Overview

Trait Ownership Scope
• Captains - Player characters can acquire and develop traits
• Active Crew Members - NPCs currently serving on player ships develop traits
• Dynamic NPC Generation - Non-crew NPCs only generate traits when they become "important" through frequent interaction or hiring
Trait Acquisition Methods (Hybrid System)
• Experience-Based Unlocking - Predetermined thresholds unlock reliable progression
• Random Event Triggers - Critical moments and emergencies create unique trait opportunities
• Relationship-Driven Development - Interactions between entities generate new traits through social chemistry
Trait Effect Categories
• Stat Modifiers - Numerical bonuses to ship systems, crew efficiency, economic activities
• Capability Unlocks - Binary abilities that enable new actions or access to restricted content
• No Behavioral Changes - Traits do not alter autonomous AI decision-making (keeps complexity manageable)---Trait Level Progression System

Three-Tier Structure
Each trait has exactly 3 levels with escalating power and risk:

Level I (Basic)

• Small stat bonuses (5-15%)
• Basic capability access
• No negative side effects
• Easily acquired through normal gameplay

Level II (Improved)

• Moderate stat bonuses (15-25%)
• Enhanced capabilities
• No negative side effects
• Requires sustained specialization or exceptional circumstances

Level III (Mastery)

• Major stat bonuses (25-40%)
• Powerful unique capabilities
• Corruption Risk - 33% chance to gain related negative trait
• Represents true expertise with potential downsides
Corruption Mechanics
When acquiring Level III traits, roll for negative trait acquisition:

• 67% chance - Clean mastery, no downsides
• 33% chance - Gain complementary negative trait that reflects the personality quirks of extreme specialization---Rarity and Distribution System

Pyramid Rarity Structure
• Common (60%) - Basic workplace competencies, small bonuses
• Uncommon (30%) - Specialized skills, moderate bonuses
• Rare (9%) - Exceptional talents, significant bonuses
• Legendary (1%) - Reality-bending abilities, game-changing capabilities
Cultural Background Exclusives
Certain traits are locked to specific crew backgrounds:

• Mars Colonials - Low-gravity engineering, asteroid mining expertise
• Venus Merchants - Luxury market access, corporate network connections
• Outer Rim Survivors - Jury-rigging, resource scavenging, crisis management
• Corporate Worlds - Bureaucratic navigation, regulatory compliance, quality control---Monetization and Player Limits

Trait Slot Limitations
• Free Players - Maximum 6 traits per entity (captain or crew member)
• Paid Players - Unlimited trait accumulation
• Asymmetric Gameplay - Veteran paid players become legendary figures that free players encounter
Progression Equity
• All trait types available to both free and paid players
• Free players can experience full game depth within their 6-trait limit
• Paid players gain long-term character development and become walking legends---Trait Discovery and Awareness System

Meta-Knowledge As Gameplay Mechanic
Understanding the trait system itself requires specialized traits:

"Pays Attention To People" - Can see basic trait information for crew members
"Good Judge Of Character" - Reveals trait levels and progression potential
"Knows The Business" - Shows exact stat bonuses and mechanical effects
"Has Connections" - Intel about exceptional crew spreads through network faster
Information Revelation Levels
• Trait-Blind Players - Experience benefits without mechanical awareness ("Jenkins is just good with engines")
• Basic Awareness - Can see trait names but not effects or levels
• Full Analysis - Complete mechanical information visible
• Network Intelligence - Receives rumors and stories about traits on other ships---Trait Naming Convention

Deliberately Mundane Descriptions
All traits use hilariously banal workplace terminology:

Technical Traits:

• "Good With Engines" - Reactor efficiency and emergency overcharge capabilities
• "Handy With Tools" - Repair speed and jury-rigging abilities
• "Decent At Math" - Navigation optimization and complex calculations

Social Traits:

• "People Person" - Crew relations and diplomatic access
• "Knows A Guy" - Black market connections and faction introductions
• "Good Listener" - Intel gathering and crew problem awareness

Combat Traits:

• "Shoots Straight" - Weapon accuracy and targeting systems
• "Stays Cool" - Crisis management and emergency response
• "Tough Cookie" - Damage resistance and injury recovery

Economic Traits:

• "Good Eye For Value" - Market analysis and trade optimization
• "Honest Face" - Reputation bonuses and faction trust
• "Knows The Ropes" - Reduced operating costs and bureaucratic efficiency---Technical Implementation

Database Schema

CREATE TABLE entity_traits (
  id UUID PRIMARY KEY,
  entity_id UUID, -- captain or crew member
  entity_type VARCHAR(50), -- 'captain' or 'crew'
  trait_name VARCHAR(100),
  trait_level INTEGER CHECK (trait_level >= 1 AND trait_level <= 3),
  acquired_at TIMESTAMP DEFAULT NOW(),
  acquisition_method VARCHAR(50), -- 'experience', 'event', 'relationship'
  cultural_exclusive BOOLEAN DEFAULT FALSE,
  corruption_traits UUID[] -- array of negative trait IDs if corrupted
);

CREATE TABLE trait_definitions (
  trait_name VARCHAR(100) PRIMARY KEY,
  rarity VARCHAR(20), -- 'common', 'uncommon', 'rare', 'legendary'
  category VARCHAR(50), -- 'technical', 'social', 'combat', 'economic'
  cultural_restrictions TEXT[], -- backgrounds that can access this trait
  level_1_effects JSONB, -- {stat_bonuses: {}, capabilities: []}
  level_2_effects JSONB,
  level_3_effects JSONB,
  corruption_options TEXT[] -- possible negative traits for level 3
);

Trait Application Logic

function applyTraitEffects(entity) {
  const traits = getEntityTraits(entity.id);
  let statModifiers = {};
  let capabilities = [];
  
  traits.forEach(trait => {
    const definition = getTraitDefinition(trait.trait_name);
    const effects = definition[`level_${trait.trait_level}_effects`];
    
    // Apply stat bonuses
    Object.keys(effects.stat_bonuses).forEach(stat => {
      statModifiers[stat] = (statModifiers[stat] || 0) + effects.stat_bonuses[stat];
    });
    
    // Add capabilities
    capabilities = capabilities.concat(effects.capabilities || []);
  });
  
  return { statModifiers, capabilities };
}

Corruption Roll System

function attemptTraitLevelUp(entityId, traitName, targetLevel) {
  if (targetLevel === 3) {
    const corruptionRoll = Math.random();
    if (corruptionRoll < 0.33) {
      const traitDef = getTraitDefinition(traitName);
      const negativeTraitOptions = traitDef.corruption_options;
      const selectedNegativeTrait = randomChoice(negativeTraitOptions);
      
      // Add both positive and negative traits
      addEntityTrait(entityId, traitName, 3);
      addEntityTrait(entityId, selectedNegativeTrait, 1);
      
      return {
        success: true,
        corrupted: true,
        negativeTrait: selectedNegativeTrait
      };
    }
  }
  
  addEntityTrait(entityId, traitName, targetLevel);
  return { success: true, corrupted: false };
}
---Example Trait Progressions

"Good With Engines"
Level I: +10% reactor efficiency
Level II: +20% reactor efficiency, can perform standard maintenance 25% faster
Level III: +30% reactor efficiency, unlocks emergency overcharge (+50% power for 10 minutes), Corruption Risk: "Bit Of A Perfectionist" (repairs take 50% longer but never fail)
"People Person"
Level I: +10 starting opinion with new crew members
Level II: +15 starting opinion, can resolve minor crew disputes diplomatically
Level III: +20 starting opinion, unlocks faction diplomatic immunity, Corruption Risk: "Talks Too Much" (-5 stealth on covert missions)
"Lucky, I Guess" (Legendary)
Level I: 2% chance to avoid any negative random event
Level II: 4% chance to avoid negative events, 2% chance for bonus resources on trades
Level III: 5% chance to avoid catastrophic failures, 5% chance for exceptional outcomes, Corruption Risk: "Superstitious" (refuses missions on "unlucky" calendar days)
"Knows A Guy" (Cultural Exclusive - Mars Colonial)
Level I: Access to asteroid mining job postings, +5% mining efficiency
Level II: Access to black market mining equipment, +10% rare mineral yield
Level III: Access to illegal mining territories, can fence stolen minerals, Corruption Risk: "Old Debts" (random demands for favors from criminal contacts)---Integration with Existing Systems

Relationship System Integration
• Traits affect opinion score calculations based on cultural preferences
• Shared traits between entities create positive relationship bonuses
• Negative traits may cause friction with certain crew members or factions
Intel Network Integration
• Exceptional trait displays generate intel ("Captain Vex's engineer can fix anything")
• Trait-based capabilities become part of player reputation
• Crew recruitment intel includes trait rumors and recommendations
Mission System Integration
• Certain missions require specific trait capabilities
• LLM mission generation considers available traits when creating opportunities
• Trait-based solutions create unique mission resolution paths
Economic System Integration
• Traits affect market prices and available trading opportunities
• Cultural exclusive traits provide access to restricted markets
• Reputation bonuses from traits improve faction standing and pricing---Balancing and Progression Design

Experience Thresholds for Common Traits
• 500 successful actions - Level I unlock eligibility
• 2000 successful actions - Level II unlock eligibility
• 5000 successful actions - Level III unlock eligibility
• Random events and relationships can accelerate or bypass thresholds
Corruption Balancing
• Negative traits provide meaningful drawbacks without crippling characters
• Some corruption traits have hidden benefits (perfectionist repairs never fail)
• Players can work around negative traits through strategic planning
Long-Term Character Development
• Free players develop focused specialists within 6-trait limits
• Paid players become renaissance captains with diverse capabilities
• Veteran characters become recognizable figures in the universe through trait combinations---Narrative and Flavor Integration

Trait Descriptions in Game
All trait information uses workplace vernacular:

• Performance Reviews: "Jenkins continues to demonstrate competence with mechanical systems"
• Crew Gossip: "New engineer seems handy with tools, fixed the coffee machine in ten minutes"
• Intel Reports: "Captain Vex's crew includes someone who's apparently decent at math"
Cultural Context
• Mars colonials treat engineering prowess as basic survival skills
• Corporate worlds value bureaucratic navigation and quality control
• Outer rim survivors prize adaptability and resource management
• Each culture interprets the same traits differently through their lens
Emergent Storytelling
• Trait combinations create unique character archetypes naturally
• Corruption risks add personality quirks that generate story moments
• Cross-cultural trait combinations reflect diverse crew backgrounds
• Long-term trait development becomes character biography

This trait system creates depth through simplicity, allowing complex character development to emerge from straightforward mechanical foundations while maintaining the game's core aesthetic of treating extraordinary abilities as mundane workplace competencies.

Spacepunk Universe - Lore & Technical Implementation

The Simulation Paradox: Core Worldbuilding

The Mapping Project
Humanity has embarked on an impossibly vast undertaking: building a simulation detailed enough to perfectly model all four galaxies. This requires creating a map as large as the territory itself - every asteroid catalogued, every grain of space dust measured, every economic transaction recorded. The project has consumed civilization for generations, turning exploration into bureaucratic data collection and adventure into cosmic census work.
The Unholy Alliance
Two seemingly incompatible factions drive the simulation project with religious fervor:

The Techno-Corporate Optimists believe perfect simulation will enable optimal resource allocation, eliminate market inefficiencies, and create a rationalized universe where every economic decision can be predicted and optimized. They see the mapping project as humanity's greatest achievement in applied mathematics and social engineering.

The Radical Christian Environmentalists view the simulation as humanity's ark before cosmic judgment. They believe God commands them to preserve every detail of creation in digital form - a technological Noah's ark that will allow righteous souls to transcend physical reality when the universe reaches its prophesied end.
The Methhead Dissidents
The only faction that rejects the simulation project consists of drug-addled anarchists, paranoid libertarians, and violent extremists who consume military explosives as recreational drugs. Their rambling manifestos claim humanity is already trapped in a simulation, that reality has multiple nested layers, and that the mapping project is designed to distract people from the truth. Most citizens dismiss them as obviously insane, but their core message - "we're already in the machine" - contains a terrifying accuracy that nobody wants to acknowledge.
The Hidden Truth
The universe operates on simulation substrate. Reality benders exist - individuals who can unconsciously exploit glitches in the cosmic operating system. Market crashes occur when someone accidentally triggers integer overflow errors in economic subroutines. "Lucky" people are those who've inherited administrative privileges they don't understand. The mapping project isn't building a simulation - it's rebuilding the prison everyone already inhabits.

The cruelest truth: every time the simulation reaches completion, humanity collectively chooses to add suffering, scarcity, and struggle rather than accept paradise. Comfort feels meaningless; only hardship generates the sense of meaning and accomplishment that human psychology craves. The simulation project is humanity's way of ensuring their own perpetual misery while telling themselves they're working toward transcendence.---Galactic Political Economy

Galaxy-Based Faction Structure
Galaxy 1: Corporate Technocratic Federation

• Government: Hyper-efficient corporate bureaucracy with 47 regulatory agencies
• Economy: High-tech manufacturing, financial services, data processing, simulation hardware
• Culture: Obsessed with optimization, paperwork, and quantified metrics
• Needs: Raw materials, agricultural products, manual labor
• Crew Traits: Administrative efficiency, technical precision, bureaucratic navigation

Galaxy 2: Religious Agricultural Commune Network

• Government: Decentralized spiritual communities with shared environmental ethics
• Economy: Organic farming, biotechnology, textiles, "natural" consumer goods
• Culture: Community-focused, environmentally conscious, morally rigid about corporate excess
• Needs: Advanced technology, luxury goods, industrial components, medical equipment
• Crew Traits: Agricultural expertise, community building, moral conviction

Galaxy 3: Anarchist Mining Collectives

• Government: Loose confederations of independent worker cooperatives
• Economy: Raw material extraction, rare mineral mining, heavy industrial production
• Culture: Fiercely independent, anti-authority, dangerous work creates strong solidarity
• Needs: Food, consumer technology, medical supplies, entertainment
• Crew Traits: Resource extraction, jury-rigging, crisis management, anti-corporate sentiment

Galaxy 4: Imperial Aristocratic Remnants

• Government: Hereditary nobility maintaining traditional hierarchies
• Economy: Luxury craftsmanship, cultural artifacts, art, "authentic" handmade goods
• Culture: Obsessed with status, tradition, and maintaining superior bloodlines
• Needs: Everything practical - they produce little of value beyond prestige items
• Crew Traits: Cultural refinement, diplomatic protocol, luxury market access
Economic Interdependence
The galaxy-based political structure creates natural trade dependencies:

• Corporate Galaxy 1 needs Galaxy 3's raw materials to manufacture technology
• Agricultural Galaxy 2 requires Galaxy 1's advanced tech for efficient farming
• Mining Galaxy 3 depends on Galaxy 2's food production to feed dangerous extraction work
• Aristocratic Galaxy 4 consumes luxury versions of everything the other galaxies produce

This interdependence drives the hyperwarp freight economy that players navigate. No galaxy is self-sufficient; every specialized economy creates arbitrage opportunities for independent traders willing to navigate the bureaucratic and cultural barriers between worlds.---Interface Design Philosophy: Zero-CSS Brutalism

Aesthetic Principles
The game interface deliberately uses no CSS styling whatsoever - only raw HTML with browser defaults. This creates a brutalist aesthetic that reinforces the worldbuilding themes:

• Bureaucratic Mundanity: Managing a spaceship feels like filing digital paperwork
• Simulation Substrate: The crude interface hints at the underlying computational reality
• Resource Scarcity: Even user interface design feels starved of resources
• Corporate Efficiency: Maximum functionality with zero aesthetic consideration
Progressive Interface Complexity
Starting Interface (3 tabs):

<nav>
  <button>Ship Status</button>
  <button>Crew</button>
  <button>Market</button>
</nav>


Mid-Game Interface (8 tabs):

<nav>
  <button>Ship Status</button>
  <button>Hull Systems</button>
  <button>Power Grid</button>
  <button>Crew Management</button>
  <button>Market Data</button>
  <button>Navigation</button>
  <button>Communications</button>
  <button>Cargo Bay</button>
</nav>


Endgame Interface (15+ tabs):

<nav>
  <button>Ship Status</button>
  <button>Hull Integrity</button>
  <button>Power Systems</button>
  <button>Life Support</button>
  <button>Crew Management</button>
  <button>Individual Status</button>
  <button>Relationship Matrix</button>
  <button>Market Analysis</button>
  <button>Trade History</button>
  <button>Navigation</button>
  <button>Sensor Data</button>
  <button>Communications</button>
  <button>Intel Reports</button>
  <button>Faction Standing</button>
  <button>Component Status</button>
  <button>Maintenance Logs</button>
</nav>

Information Density Evolution
As players upgrade ship systems, their interface becomes overwhelmingly information-dense:

Basic Ship Status:

<p>Hull: 78%</p>
<p>Power: 67%</p>
<p>Crew: 6/8</p>


Advanced Ship Status:

<p>Hull: 78.3% (Fwd: 82% | Mid: 71% | Aft: 83% | Ventral: 79% | Dorsal: 77%)</p>
<p>Power: 67% (Reactor: 89% efficiency | Backup: standby | Solar: 12% | Battery: 67%)</p>
<p>Life Support: O2: 98.7% | CO2: 1.1% | H2O: 87% recycled | Waste: 23% capacity</p>
<p>Crew: Torres(Bridge,Alert) Chen(Sick,Recovering) Kim(Galley,Hungry) Rodriguez(Engineering,Focused)</p>

Interaction Mechanics
Input Fields for Repetitive Actions:

<form>
  Buy Rare Metals: <input type="number" value="50"> units
  <input type="submit" value="Purchase">
</form>

<form>
  Assign Chen to: <select><option>Reactor Bay</option><option>Hull Repair</option></select>
  for <input type="number" value="4"> hours
  <input type="submit" value="Assign">
</form>


Right-Click Context Menus for Complex Actions:

• Right-click crew names for: [Send Message] [Reassign] [Performance Review] [Medical Scan]
• Right-click system status for: [Detailed Report] [Schedule Maintenance] [Emergency Override]
• Right-click market data for: [Price History] [Set Alerts] [Comparative Analysis]
Vue.js Single Page Application Structure

const { createApp } = Vue;

createApp({
  data() {
    return {
      currentTab: 'main',
      ship: {
        hull: 78.3,
        power: 67,
        crew_count: 6,
        max_crew: 8
      },
      crewMembers: [
        {id: 1, name: "Torres, Miguel", status: "Alert", location: "Bridge"},
        {id: 2, name: "Chen, Elena", status: "Sick", location: "Medical Bay"},
        {id: 3, name: "Kim, Sarah", status: "Hungry", location: "Galley"}
      ],
      availableTabs: ['main', 'crew', 'market'] // expands as ship upgrades
    }
  },
  methods: {
    switchTab(tab) {
      this.currentTab = tab;
    },
    callCrew(crewId) {
      // Simulate communication delay based on crew location and ship size
      const crew = this.crewMembers.find(c => c.id === crewId);
      const delay = this.calculateCommDelay(crew.location);
      setTimeout(() => {
        this.receiveCrewResponse(crew);
      }, delay);
    },
    calculateCommDelay(location) {
      // Larger ships = longer delays to reach crew
      const baseDelay = 2000; // 2 seconds minimum
      const shipSizeMultiplier = this.ship.max_crew / 8;
      const locationMultiplier = {
        'Bridge': 1,
        'Engineering': 1.5,
        'Cargo Bay': 2,
        'Medical Bay': 1.2
      };
      return baseDelay * shipSizeMultiplier * (locationMultiplier[location] || 1);
    }
  }
}).mount('#app');
---Combat and Crisis Management

Indirect Command Structure
Players never directly control combat - they manage it through incomplete information and delayed communication while isolated in captain's quarters.

Combat Information Flow:

1. Initial Alert: Vague notification of hostile contact
2. Crew Reports: Filtered information from department heads with personal biases
3. Status Updates: Delayed damage reports as crew assesses situations
4. Communication Delays: Orders take time to reach crew based on ship size and system damage

Example Combat Sequence:

<h3>COMBAT ALERT - 14:23:07</h3>
<p>First Mate Torres: "Captain, we've got company. Hostile vessel closing fast."</p>

<form>
  Response: <select>
    <option>Request status report</option>
    <option>Order evasive maneuvers</option>
    <option>Attempt to hail hostile</option>
    <option>Prepare for combat</option>
  </select>
  <input type="submit" value="Send Order">
</form>

<p><em>Waiting for crew response... (15 seconds)</em></p>

<h3>UPDATE - 14:23:22</h3>
<p>Torres: "Evasive maneuvers initiated. Hull integrity holding. Chen reports reactor stable."</p>
<p>Chen (Engineering): "Captain, we're taking hits on the port side. Nothing critical yet."</p>
<p>Rodriguez (Security): "Weapons systems online. Awaiting orders."</p>

Interface Upgrades Improve Information Access
Basic Combat Interface:

<p>Combat Status: Active</p>
<p>Hull: Damaged</p>
<p>Enemy: Present</p>


Advanced Combat Interface:

<table border="1">
  <tr><td>System</td><td>Status</td><td>Efficiency</td></tr>
  <tr><td>Forward Hull</td><td>82%</td><td>Nominal</td></tr>
  <tr><td>Port Hull</td><td>67%</td><td>Compromised</td></tr>
  <tr><td>Weapons Array</td><td>94%</td><td>Ready</td></tr>
  <tr><td>Shields</td><td>45%</td><td>Regenerating</td></tr>
</table>

<h4>Enemy Analysis</h4>
<p>Vessel Type: Korvari Interceptor</p>
<p>Distance: 1.2km</p>
<p>Weapons: 2x Plasma Cannon, 1x Missile Launcher</p>
<p>Estimated Hull: 78%</p>
---Economic Minigames and Market Mechanics

Trading Interface Complexity
Basic Market Access:

<h3>Omega Station Market</h3>
<table border="1">
  <tr><td>Resource</td><td>Price</td><td>Available</td></tr>
  <tr><td>Rare Metals</td><td>847 credits/unit</td><td>2,847 units</td></tr>
  <tr><td>Food Supplies</td><td>23 credits/unit</td><td>15,000 units</td></tr>
</table>

<form>
  Buy: <input type="number" placeholder="quantity"> 
  <select><option>Rare Metals</option><option>Food Supplies</option></select>
  <input type="submit" value="Purchase">
</form>


Advanced Market Analysis:

<h3>Omega Station Market - Real-Time Data</h3>
<table border="1">
  <tr><td>Resource</td><td>Current Price</td><td>24h Change</td><td>Volume</td><td>Prediction</td></tr>
  <tr><td>Rare Metals</td><td>847.23 (+0.15)</td><td>+2.3%</td><td>2,847</td><td>Volatile ↑</td></tr>
  <tr><td>Food Supplies</td><td>23.67 (-0.04)</td><td>-0.8%</td><td>15,234</td><td>Stable →</td></tr>
  <tr><td>Luxury Goods</td><td>1,247.89 (+15.23)</td><td>+12.7%</td><td>89</td><td>Bubble ↑↑</td></tr>
</table>

<h4>Market Intelligence</h4>
<p>Source: Bartender Networks (67% reliable)</p>
<p>"Miners strike on Asteroid 7 driving rare metal shortage. Prices volatile but trending up."</p>

<h4>Faction Pricing Modifiers</h4>
<p>Corporate Rep (+23): Base prices</p>
<p>Mining Union Rep (-12): +15% markup on industrial goods</p>
<p>Smuggler Contacts (+45): Access to black market prices</p>

Resource Trading Complexity
Players navigate increasingly complex economic systems:

Beginner Trading:

• Simple buy/sell at posted prices
• Basic supply/demand visibility
• Single-step transactions

Advanced Trading:

• Multi-step arbitrage opportunities
• Faction reputation affects pricing
• Black market access through crew connections
• Future contracts and commodity speculation
• Economic intelligence gathering through crew networks---Technical Implementation Architecture

Vue.js Component Structure

// Main Application Component
const SpaceshipManagement = {
  data() {
    return {
      currentTab: 'main',
      ship: {
        systems: {},
        crew: [],
        cargo: {},
        upgrades: []
      },
      gameState: {
        tick: 0,
        location: {},
        market: {},
        intel: []
      }
    }
  },
  computed: {
    availableTabs() {
      // Tabs unlock based on ship upgrades
      const baseTabs = ['main', 'crew', 'market'];
      const upgradeTabs = this.ship.upgrades.map(upgrade => upgrade.unlocked_tabs).flat();
      return [...baseTabs, ...upgradeTabs];
    },
    informationDensity() {
      // Interface complexity scales with ship sophistication
      return this.ship.upgrades.filter(u => u.category === 'interface').length;
    }
  },
  methods: {
    handleCrewCommunication(crewId, message) {
      const crew = this.ship.crew.find(c => c.id === crewId);
      const delay = this.calculateResponseDelay(crew);
      
      setTimeout(() => {
        this.receiveCrewResponse(crew, message);
      }, delay);
    },
    
    processMarketTransaction(resource, quantity, action) {
      // Server-side validation required
      this.sendToServer({
        type: 'market_transaction',
        resource,
        quantity,
        action,
        location: this.gameState.location
      });
    }
  }
};

WebSocket Integration for Real-Time Updates

// Real-time game state synchronization
const websocket = new WebSocket('ws://localhost:8080/game');

websocket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch(update.type) {
    case 'tick_update':
      this.processTickUpdate(update.data);
      break;
    case 'crew_response':
      this.displayCrewMessage(update.data);
      break;
    case 'market_change':
      this.updateMarketData(update.data);
      break;
    case 'intel_received':
      this.addIntelReport(update.data);
      break;
  }
};

Progressive Interface Complexity

// Interface elements appear based on ship upgrades
const InterfaceManager = {
  methods: {
    renderShipStatus() {
      const density = this.informationDensity;
      
      if (density === 0) {
        return `<p>Hull: ${this.ship.hull}%</p>`;
      } else if (density < 3) {
        return `
          <p>Hull: ${this.ship.hull}% | Power: ${this.ship.power}%</p>
          <p>Crew: ${this.ship.crew.length}/${this.ship.max_crew}</p>
        `;
      } else {
        return `
          <table border="1">
            <tr><td>Forward Hull</td><td>${this.ship.hull_sections.forward}%</td></tr>
            <tr><td>Port Hull</td><td>${this.ship.hull_sections.port}%</td></tr>
            <tr><td>Starboard Hull</td><td>${this.ship.hull_sections.starboard}%</td></tr>
            <tr><td>Aft Hull</td><td>${this.ship.hull_sections.aft}%</td></tr>
          </table>
          <p>Power Grid: ${this.ship.power_grid.efficiency}% efficient</p>
          <p>Life Support: O2 ${this.ship.life_support.oxygen}% | CO2 ${this.ship.life_support.co2}%</p>
        `;
      }
    }
  }
};


This technical architecture supports the core worldbuilding themes: players experience the universe through crude interfaces that gradually reveal overwhelming complexity, mirroring humanity's relationship with the simulation they inhabit. The zero-CSS aesthetic reinforces the sense that even basic user experience design has been sacrificed to the demands of cosmic bureaucracy and resource scarcity. 
---
Spacepunk Universe - Final Worldbuilding Design Document

Core Universe Structure

The Four Galaxies - Political Economy Overview
30 worlds distributed equally across 4 distinct galactic cultures (7-8 worlds per galaxy), connected by natural hyperwarp phenomena. Each galaxy maintains economic interdependence while preserving distinct cultural identity and specialization.
Galaxy 1: Corporate Technocratic Federation
Population Dynamics: 80% pharmaceutical-assisted masses, 20% ruthless perfectionist engineers
Economic Specialization: High-tech manufacturing, advanced components, precision engineering
Cultural Philosophy: Autistic engineering perfectionism taken to dehumanizing extremes
Work Culture: Performance-based hierarchy, process obsession, optimization enforcement
Spice Lounge: W Hotel lobby meets BDSM rave - masked figures in black navigating labyrinthine pleasure complex with strict corporate hierarchy determining access levels. Anonymous but rigidly stratified by wealth and position.
Galaxy 2: Religious Agricultural Commune Network
Economic Specialization: Organic farming, biotechnology, natural goods, food production
Cultural Philosophy: Authentic environmental sustainability through spiritual practice
Work Culture: Cooperative abundance, shared labor, community care systems
Spice Lounge: Stonehenge-like hippy raves in forest clearings with mystical stone circles and communal huts. Spiritual intoxication through natural substances and collective experiences.
Galaxy 3: Anarchist Mining Collectives
Economic Specialization: Raw material extraction, heavy industrial production, rare minerals
Cultural Philosophy: True worker ownership, frontier independence, anti-corporate resistance
Work Culture: Democratic workplace decisions, shared risk/reward, solidarity through danger
Spice Lounge: Wild West anarchist bars with Texas roadhouse vibes. Guns everywhere, whiskey and gambling, organized fighting in designated areas, public stocks for rule-breakers. Anarchist heaven with surprisingly civilized violence protocols.
Galaxy 4: Imperial Aristocratic Remnants
Economic Specialization: Luxury craftsmanship, cultural artifacts, artistic goods, prestige items
Cultural Philosophy: Elegant social rituals, refined cultural sophistication, traditional protocols
Work Culture: Hereditary hierarchy, ceremonial complexity, aesthetic perfectionism
Spice Lounge: London afternoon tea facades hiding debased speakeasies. Strict culture of secrecy and intelligence OPSEC, with elaborate underground networks for aristocratic debauchery behind perfect manners.---Economic and Trade Systems

Universal Credit System
• Single currency accepted across all 4 galaxies
• No exchange rates or currency speculation complexity
• Neutral banking managed by cross-galaxy consortium
• Focus remains on resource trading and faction reputation rather than monetary mechanics
Resource Interdependence Matrix
• Corporate Galaxy 1 needs raw materials and food, produces technology
• Agricultural Galaxy 2 needs technology and luxury goods, produces food and bio-organics
• Mining Galaxy 3 needs food and consumer goods, produces raw materials and components
• Aristocratic Galaxy 4 needs everything practical, produces luxury and cultural items
Technology Compatibility Framework
• Universal component interfaces - all ship parts work together regardless of origin
• Cultural specialization - different galaxies excel at specific component types
• Exclusive technologies - some advanced components only available from specific cultures
• Crew expertise requirements - cultural components need crew members with appropriate background and skills
• Black market access - need "a guy" and proper connections to acquire restricted technology---Transportation and Infrastructure

Hyperwarp Route Network
• Natural cosmic phenomena - hyperwarp lanes exist as uncontrollable space-time features
• Decentralized chaos - no single authority controls the network
• Attempted toll collection - bandits and opportunists set up checkpoints
• Vigilante enforcement - Galaxy 2 and 3 populations murder toll collectors who interfere with free movement
• Route unpredictability - natural phenomena create variable travel times and occasional hazards
World Distribution
• 7-8 worlds per galaxy maintaining balanced representation
• Hub and satellite structure - major trade stations plus smaller specialized outposts
• Cultural homogeneity within galaxies - each world reflects its galaxy's dominant culture
• Specialization diversity - individual worlds focus on specific aspects of their galaxy's economy---Information and Communication Systems

Courier-Based Intelligence Network
• No affordable ansible - instant communication monopolized by ultra-wealthy elite
• Physical message delivery - information travels at ship speed between systems
• Players as living internet - courier missions compete with cargo space
• Intel expiration - time-sensitive information loses value if not delivered quickly
• Data packet cargo - digital information becomes physical trade good
Cultural Information Interpretation
• Galaxy-specific perspectives - same events interpreted through different cultural lenses
• Intelligence translation services - crew members who can interpret cross-cultural information
• Faction blind spots - each culture systematically misses certain types of intelligence
• Traditional trade routes - information flows follow established commercial and diplomatic channels---The Simulation Project

Background Cosmic Horror
• Mapping the territory - humanity attempting to build simulation as large as reality itself
• Unholy alliance - techno-corporate optimists and radical Christian environmentalists driving project
• Methhead dissidents - drug-addled anarchists correctly claiming "we're already in the simulation"
• Hidden truth - reality operates on simulation substrate, "lucky" people exploit cosmic glitches
• Perpetual suffering choice - humanity repeatedly chooses hardship over paradise because comfort feels meaningless
Daily Life Impact
• Mostly background lore - mentioned in news, conversations, flavor text
• Occasional survey missions - data collection contracts provide steady but boring income
• Bureaucratic overhead - minimal paperwork requirements for trade documentation
• Processing facilities - simulation infrastructure requires supply deliveries and maintenance---Crew Culture and Social Dynamics

Skill-Based Hierarchy
• Competent crew hate incompetent crew - realistic workplace tensions
• Teaching as rare trait - crew members who mentor others become incredibly valuable
• Cultural background conflicts - Galaxy origins create interpersonal friction
• Below deck social dynamics - 50% chores, 50% procedural drama generated by LLM
Shore Leave Patterns
• 90% hit spice lounges - exhausted workers just want to decompress with drugs/alcohol
• 10% weird exploration - crew members with unusual traits pursue personal interests
• Cultural immersion challenges - crew comfort varies dramatically between galaxy stations
• Station relationship building - regular customers develop valuable local connections
Daily Ship Life
• Captain isolation - players remain in quarters, manage through intermediaries
• Information delays - crew reports filtered through department heads and personal biases
• Hidden problems fester - issues develop undetected until major failures occur
• Communication timing - reaching crew takes time based on ship size and their location---Combat and Crisis Management

Indirect Command Structure
• No direct control - players manage crises through incomplete information and delayed communication
• Crew competence determines outcomes - battle results depend on crew skills and equipment quality
• Mini-games for real-time events - reaction-based skill challenges during boarding, reactor emergencies, critical navigation
• Interface upgrades improve information access - better sensors and communication systems provide more detailed battle data
Repair and Maintenance Philosophy
• Jury-rigged survival - official parts expensive/unavailable, everything improvised
• Crew skill signatures - repair quality depends entirely on who performed the work
• Visible degradation - player can see immediate quality differences in repairs
• Hidden time bombs - poor repairs fail catastrophically at worst possible moments
• Cascading system effects - shoddy work on one system affects related ship functions---Interface Design Philosophy

Zero-CSS Brutalism
• No styling whatsoever - raw HTML with browser defaults only
• Progressive tab proliferation - interface complexity grows through additional tabs
• Information density scaling - more detailed readouts as ship systems upgrade
• Functional ugliness - managing spaceship feels like filing digital paperwork
• Vue.js single-page application - modern reactive functionality within brutalist aesthetic
Interaction Mechanics
• Input fields for repetitive actions - buying/selling, crew assignments, navigation
• Right-click context menus - complex actions like detailed reports, maintenance scheduling
• Form-based everything - all player actions through HTML forms and buttons
• Tab-based organization - all ship functions accessible through expanding tab structure---Trait and Character Development

Hilariously Banal Naming Convention
• Mundane workplace terminology for incredible cosmic abilities
• "Good With Engines" provides reactor efficiency and emergency overcharge capabilities
• "People Person" unlocks diplomatic immunity and crew relationship bonuses
• "Lucky, I Guess" enables reality-bending probability manipulation
Three-Level Progression with Corruption Risk
• Level I & II - pure beneficial progression with no downsides
• Level III - 33% chance to gain complementary negative trait
• Cultural exclusives - certain traits only available to specific galaxy backgrounds
• Free vs paid limits - 6 traits maximum for free players, unlimited for paid players
Meta-Knowledge as Gameplay Mechanic
• Trait awareness requires traits - understanding the system itself needs specialized knowledge
• Invisible benefits - most players experience trait effects without mechanical awareness
• Progressive revelation - interface complexity and trait understanding develop together---Economic Gameplay Mechanics

Resource Trading Complexity
• 150 resources across 4 categories (Tech, Consumable, Green, Luxury)
• Faction preference modifiers - cultural background affects pricing and availability
• Black market alternatives - smuggling options bypass official restrictions
• Real-time market fluctuations - supply/demand creates trading opportunities
• Intel-driven arbitrage - information about market conditions becomes valuable cargo
Maintenance and Upgrade Economics
• Component quality affects longevity - cheap parts fail more frequently
• Crew expertise determines installation success - skilled technicians provide better results
• Cultural component preferences - crew work better with familiar technology
• Synergy bonuses - thematic equipment combinations provide gameplay advantages---Narrative Integration

Emergent Storytelling Through Systems
• Player actions generate intel - crew spreads stories about captain's reputation
• Relationship consequences span multiple lives - crew families remember treatment across player deaths
• Cultural reputation cascades - actions affect entire planetary populations over time
• LLM mission generation reflects established player behavior patterns
Death and Continuity Mechanics
• Permadeath with crew survival - crew members persist in universe after player death
• Reputation inheritance - new player characters encounter consequences of previous actions
• Crew reconnection opportunities - former crew may be found and rehired in subsequent lives
• Mythological status development - exceptional players become legends affecting all future interactions

This worldbuilding framework provides the foundation for a genuinely innovative space simulation that treats extraordinary cosmic concepts through the lens of mundane workplace dynamics, creating depth through simplicity while maintaining consistent internal logic across all game systems.
---
Spacepunk Logistics Sim - Technical Implementation Memo

Executive Summary
We're building a server-authoritative space logistics game with permadeath, deep crew relationships, and emergent narrative generation. The technical architecture prioritizes data integrity and real-time multiplayer while maintaining a deliberately ugly interface that grows organically with player progression.

Key technical decisions favor robust data storage over performance optimization - we're building this like "absolute database gangsters" with full price matrices and comprehensive entity tracking.---Core Technical Philosophy

Data Storage Strategy: Maximum Information Retention
• Full price matrix storage - maintain complete 150 resources × 30 worlds pricing data
• JSONB for complex data - ship components, crew opinions, traits stored as flexible JSON
• UUID primary keys throughout for distributed system compatibility
• No data deletion - crew members, relationships, and intel persist indefinitely
Real-Time Architecture: Hybrid Efficiency
• Tick-based world simulation running every 4-60 seconds based on load
• WebSocket hybrid updates - immediate for critical events, batched for routine changes
• Server-side validation for all player actions to prevent cheating
• Graceful degradation under load rather than system failures
Interface Philosophy: Progressive Brutalism
• Zero CSS styling - raw HTML with browser defaults only
• Tab proliferation - complexity through additional interface sections
• Vue.js single-page app for modern reactivity within brutalist aesthetic
• Earned complexity - interface grows organically with player capabilities---Game Systems Implementation

Ship and Component Management
Component Storage: All ship components stored in single JSONB column per ship. Each component tracks condition, upgrade level, installation date, and cultural origin.

Degradation Mechanics: Components only lose condition during hyperspace jumps (0-10% based on ship size) plus random failure events. No passive decay during normal operations.

Technology Integration: Universal component compatibility with cultural specialization. Players need appropriate crew expertise and black market connections for advanced/restricted components.
Crew Behavior and Relationships
Autonomous Decision Making: Crew members make independent choices every tick based on personality traits, opinion scores, and current ship conditions.

Opinion System: Each entity stores JSONB opinion data about other entities including numeric scores (-100 to +100) and 140-character memory notes for LLM reference.

Skill Development: Variable XP based on task difficulty and performance quality. Crew members cross-train and develop relationships that affect ship efficiency.

Hiring Dynamics: Dynamic crew pools generated randomly on each station visit. Better player reputation unlocks access to higher-quality crew members.
Economic and Market Systems
Market Dynamics: Full 150×30 price matrix updated every tick except during individual world weekends/religious schedules. Each world maintains its own calendar and cultural trading patterns.

Trade Validation: Server validates all resource transactions before processing. Players cannot manipulate inventory or credits client-side.

Faction Economics: Cultural background affects component efficiency, market access, and pricing modifiers. Economic specialization creates natural trade dependencies between galaxies.
Information and Intel Networks
Courier-Based Communication: Information travels at ship speed between systems. Players function as living internet carrying data packets and messages.

Intel Propagation: Information spreads during ticks when entities meet in space or on stations. Intel reliability degrades and content mutates as it passes through unreliable sources.

Mission Generation: On-demand LLM mission creation with pooled API responses and template fallbacks. Missions reflect player behavior patterns and current universe state.---Combat and Crisis Management

Indirect Command Structure
Players never directly control combat. All crisis management happens through filtered information from crew members with realistic communication delays.

Information Flow: Initial alerts → crew reports with personal biases → status updates as crew assesses damage → delayed responses to captain orders.

Interface Upgrades: Better ship systems provide more detailed and timely information during crises. Basic ships show "Hull: Damaged" while advanced ships display section-by-section damage analysis.

Mini-Game Integration: Real-time skill challenges during boarding actions, reactor emergencies, and critical navigation. Text-based decision making for all routine operations.
Death and Continuity Mechanics
Permadeath Triggers: Only personal captain death causes permadeath - ship destruction, crew mutiny, or system failures don't automatically kill the player character.

Crew Survival: Crew members persist in universe after player death. Former crew can be encountered and hired in subsequent lives, carrying memories and opinions from previous service.

Reputation Inheritance: New player characters enter universe with consequences of previous captain's actions already embedded in faction standings and crew relationships.---Performance and Scalability

Database Optimization Strategy
Calculated Inefficiency: We deliberately over-store data for gameplay richness rather than optimizing for performance. Full price matrices and complete relationship webs prioritized over query speed.

Tick Processing Targets:

• 100 players: 4-6 second ticks
• 500 players: 6-15 second ticks
• 1000+ players: 15-60 second ticks with graceful degradation

Data Lifecycle Management: Historical data compression and relationship pruning only for abandoned/inactive entities. Active game data never deleted.
Real-Time Communication Efficiency
WebSocket Message Types:

• tick_update: Batch ship/crew/market changes every tick
• immediate_alert: Critical events requiring instant notification
• crew_response: Delayed communication from ship departments
• server_heartbeat: Visible countdown to next tick

Client State Management: Minimal client-side state with server as single source of truth. Vue.js reactive updates based on WebSocket events.---Security and Anti-Cheat Architecture

Server-Side Authority
Transaction Validation: All resource trades, crew hiring, and component purchases validated server-side before persistence.

Action Rate Limiting: Player actions throttled to prevent automation and maintain realistic pacing.

Audit Logging: Complete history of player actions affecting economy, reputation, and crew relationships.
Data Integrity Protection
Cryptographic Signatures: Critical game state changes signed to prevent tampering.

Anomaly Detection: Automated monitoring for impossible progression patterns or economic manipulation.

Rollback Capabilities: System can revert to previous game states when cheating detected.---Development Priorities

Phase 1: Core Infrastructure (Weeks 1-4)
Primary Focus: Tick processing engine, basic ship/crew data models, WebSocket communication.

Deliverables: Players can create ships, hire crew, move between systems, and see real-time tick updates.
Phase 2: Economic Foundation (Weeks 5-8)
Primary Focus: Full market system implementation, resource trading, world calendars.

Deliverables: Complete 150×30 market matrix, faction-based pricing, weekend closures.
Phase 3: Crew Complexity (Weeks 9-12)
Primary Focus: Autonomous crew behavior, trait system, relationship mechanics.

Deliverables: Crew make independent decisions, develop skills, form opinions about captain.
Phase 4: Intel and Missions (Weeks 13-16)
Primary Focus: Information propagation networks, LLM mission generation.

Deliverables: Intel spreads through crew networks, missions reflect player behavior.
Phase 5: Interface and Polish (Weeks 17-20)
Primary Focus: Progressive complexity revelation, mini-game integration.

Deliverables: Interface scales with ship upgrades, combat mini-games functional.---Risk Assessment and Mitigation

High-Risk Technical Challenges
LLM Integration Costs: Mitigated through response pooling, template fallbacks, and rate limiting.

Database Performance: Accepted trade-off for gameplay depth. Horizontal scaling and caching planned for player growth.

Real-Time Synchronization: Tick-based architecture naturally handles latency and provides predictable performance characteristics.
Medium-Risk Design Challenges
Player Onboarding Complexity: Progressive interface revelation and trait-based awareness systems ease learning curve.

Economic Balance: Full price matrices enable detailed monitoring and rapid adjustment of market dynamics.

Crew Relationship Complexity: JSONB storage provides flexibility for relationship system evolution during development.---Success Metrics and Monitoring

Technical Performance Indicators
• Tick processing time: Maintain target intervals under increasing player load
• WebSocket message volume: Monitor real-time communication efficiency
• Database query performance: Track impact of full matrix storage on response times
• LLM API costs: Control mission generation expenses through pooling and caching
Gameplay Quality Metrics
• Player retention across permadeath: Measure willingness to restart after character death
• Crew relationship depth: Track percentage of players engaging with crew systems
• Economic participation: Monitor trading volume and market price stability
• Mission relevance: Player satisfaction with LLM-generated content quality

This technical architecture supports our core design philosophy: building systems complex enough to generate emergent narratives while maintaining the brutal aesthetic of managing bureaucratic infrastructure in a dying universe.
---
Spacepunk Logistics Sim - Final MVP Design Document

Meta-Narrative Interface Design

The Interface IS the Story
Your brutal HTML interface is your ship's actual computer system. The ugly enterprise software aesthetic isn't lazy design - it's canonical world-building. You're literally using terrible corporate-issued ship management software.
Progressive Software Licensing
• Start: "Emergency Command Protocol v2.1" (3 basic buttons)
• Upgrade: Purchase software licenses to unlock new interface elements
• "Navigation Suite Professional" adds route planning tabs
• "Market Analysis Corporate Package" turns trading into spreadsheet hell
• "Crew Management Enterprise Edition" reveals relationship matrices
Faction-Specific Operating Systems
Corporate Galaxy 1 Stations: Interface becomes hyper-bureaucratic with confirmation dialogs and "processing delays"

Agricultural Galaxy 2 Stations: Earth tones appear in HTML, community voting forms, organic styling

Anarchist Galaxy 3 Stations: "Hacked" interface with broken CSS, DIY modifications, visible HTML comments saying "FUCK THE SYSTEM"

Aristocratic Galaxy 4 Stations: Ornate styling with excessive dividers, formal language, everything requires "proper protocols"
Computer Personality Decay
Your ship's interface develops quirks over time:

• Buttons require double-clicks (aging hardware)
• Error messages become passive-aggressive
• Random [MEMORY ERROR] text appears
• Forms occasionally refuse to submit until you "try again"---Offline Gameplay: The Absence Story Engine

Real-Time Training Queues
Set crew development goals before logging off:

• "Torres: Advanced Reactor Theory (48 hours)"
• "Chen: Corporate Negotiation Techniques (6 days)" Skills develop whether you're playing or not.
LLM-Generated Ship's Log Summaries
Return to beautifully written narratives about what happened during your absence:

"Day 3 of your absence: Torres finished his reactor training and immediately boosted engine efficiency by 12%. He's been humming old mining songs while he works. Chen organized a poker game but Rodriguez accused Kim of card counting. The argument lasted two hours and ended with synthetic whiskey. Market prices for rare metals spiked 15% due to a Galaxy 3 mining accident - we missed a profitable opportunity."
Story Emerges From Real Data
• LLM weaves actual crew skill progression into personal narratives
• Real market fluctuations become story beats about missed opportunities
• Crew relationship changes become dramatic character moments
• Ship maintenance becomes slice-of-life details

The Emotional Hook: Logging back in feels like hearing stories from friends about what happened while you were gone.---Entity State Tracking for Narrative Generation

Simple Data Foundation
Track concrete impacts on real entities:

entity_impacts: [
  {entity_id: "mining_station_7", impact_type: "medical_supply_boost", value: +15},
  {entity_id: "torres_miguel", impact_type: "loyalty_gain", value: +23},
  {entity_id: "carrot_market_galaxy2", impact_type: "price_increase", value: +45}
]

LLM Storytelling From Facts
Use tracked data to generate truthful consequence narratives:
"Medical facilities at Mining Station 7 increased from 2 to 4 after your supply delivery. The Chen family reputation improved significantly. Dr. Sarah Chen now credits you in her research papers on zero-g trauma surgery."
Reputation Consequence System
Track how player actions create long-term universe changes that persist across multiple lives and generate ongoing story content.---Asymmetric Player Cooperation

Crew Skill Trading Networks
Players can temporarily exchange specialist crew members for specific missions:

• "My engineer Torres has a cousin perfect for corporate infiltration work"
• "Your demolitions expert and my pilot want to work together on this heist"
• "Crew member personal favors based on shared military history"
Intel-Driven Skill Discovery
Crew abilities become part of the gossip network:

• "Word around the galaxy is Captain Sarah's engineer can crack any corporate safe"
• Creates natural "I need to call Sarah" moments when specific skills required
Social Obligation Networks
Temporary crew loans create reputation consequences - get someone's specialist killed and face lasting relationship damage.---Technical Implementation Priorities

MVP Core Loop
1. Hire crew from randomly generated station pools
2. Trade resources between galaxies using ugly HTML forms
3. Upgrade ship software to unlock new interface tabs
4. Set training queues before logging off
5. Return to LLM-generated stories about crew activities
6. Die and restart with former crew remembering past treatment
Database Architecture
• UUID primary keys throughout
• JSONB storage for crew skills, relationships, ship components
• Entity impact tracking for LLM narrative generation
• Real-time training queues with offline progression
Interface Philosophy
• Zero CSS styling - raw HTML with browser defaults
• Progressive tab proliferation as ships upgrade
• Meta-narrative integration where UI improvements are story elements
• Vue.js reactivity within brutalist aesthetic constraints---Launch Strategy and Hooks

Unique Selling Points
"Your crew remembers you across multiple deaths" - Build relationships that persist beyond permadeath

"The interface gets more complicated as you earn complexity" - Start with 3 buttons, end with 47 tabs of overwhelming information

"Your ship's computer runs on terrible enterprise software" - Managing a spaceship feels like using corporate IT systems

"Stories generate from your actual gameplay data" - LLM creates personalized narratives based on tracked entity changes
Target Audience
• Fans of complex simulation games who appreciate emergent storytelling
• Players seeking meaningful permadeath where death isn't just punishment
• Gamers interested in innovative narrative techniques and meta-fictional elements
• Space trading enthusiasts wanting deeper crew relationship mechanics---Success Metrics

Player Engagement
• Return rate after permadeath - willingness to restart and reconnect with former crew
• Offline session frequency - players setting training queues and checking absence stories
• Crew relationship investment - time spent developing crew bonds vs pure efficiency
Technical Performance
• LLM narrative quality - player satisfaction with generated absence stories
• Entity tracking accuracy - story elements matching actual gameplay data
• Interface complexity scaling - smooth progression from simple to overwhelming
Innovation Validation
• Meta-narrative resonance - players connecting with interface-as-story concept
• Asymmetric cooperation usage - frequency of crew trading between players
• Emergent storytelling success - unique narratives generated from system interactions

This MVP focuses on three core innovations: meta-narrative interfaces, absence storytelling, and persistent crew relationships across permadeath. These systems work together to create a space simulation unlike anything currently available.

Spacepunk Community Memes & In-Jokes

"Torres Always Knows"
The universal truth that every player's first decent engineer is named Torres, and he mysteriously always knows how to fix things despite nobody understanding how. Players share "Torres Saves" - screenshots of critical repairs at 1% hull integrity.

Common variations:

• "In Torres We Trust"
• "What Would Torres Do?" (WWTD)
• "Torres knew about the reactor leak three days ago but didn't want to worry you"
The Coffee Machine Saga
Every ship's coffee machine breaks. Every crew tries to fix it. It becomes a morale crisis. The LLM consistently generates paragraph-long narratives about coffee machine politics.

Peak meme: Screenshot compilations of increasingly elaborate coffee machine repair stories, culminating in someone's crew starting a religious cult around the broken machine.
"Chen's Drunk Again"
The LLM has a weird tendency to make crew members named Chen get intoxicated and cause diplomatic incidents. The community tracks "Chen Incident Reports" (CIRs).

Hall of Fame CIRs:

• "Chen told the Archbishop of Galaxy 4 that his mother handles freight"
• "Chen challenged a Corporate auditor to a drinking contest and won"
• "Chen married a pirate queen while you were offline"
The Carrot Monopoly Pipeline
New players: "Why is everyone obsessed with carrots?"
100 hours: "Haha carrot trading"
500 hours: "I'm cornering the Galaxy 2 carrot market"
1000 hours: "I AM the carrot market"
2000 hours: "The Carrot Throne remains empty since my 12th death"
"Just One More Tab" (JOMT)
Players posting increasingly cluttered screenshots as they unlock more interface tabs. The ultimate flex is having so many tabs they don't fit on screen. Someone always comments "you merely adopted the tabs, I was born in them."
Life 7 Syndrome
The mystical life where everything clicks - crew relationships perfect, trade routes optimized, reputation golden. Players desperately trying to recreate their "Life 7" is a running joke. "This run has Life 7 energy" is the highest compliment.
The Rodriguez Network
Every Rodriguez "knows a guy." Players share impossible chains of connections. The record is 17 levels deep: "Rodriguez knows a guy who knows a guy who knows a guy..." ending with acquiring a Galaxy 4 Princess's personal yacht.
"Comfortable Concrete" Reviews
Ironic 5-star reviews of the most basic ship upgrades. "Finally installed seats in the cargo bay. Luxury living. 5/5 stars would sit again."
Training Queue Tragedies
• "Set Chen on 72-hour Advanced Navigation training"
• "Chen spent 71 hours teaching himself interpretive dance"
• "Chen now refuses to navigate without dancing"
The Spreadsheet Ascension
Players gradually evolving from "wtf is this interface" to maintaining 47 external spreadsheets, 12 trade route calculators, and a crew relationship matrix. "You haven't truly played until you've made a pivot table for your crew's bathroom schedules."
Famous Captain Epithets
• "Three Button Johnson" (players who refuse to buy interface upgrades)
• "The Permadeath Speedrunner" (dies within 10 minutes each life)
• "Comma Placement Error Kate" (lost 50K credits to a decimal mistake)
• "The Ghost of Station 7" (that one player whose crew keeps showing up everywhere)
Crew Family Feuds
"The Nguyens remember" - when you wrong one crew member, their entire extended family across all galaxies holds grudges. Players tracking multi-generational revenge plots. "This is my 15th life and the Nguyen family still won't sell me fuel."
The Efficiency Paradox
Screenshots of crew with 95% efficiency who refuse to work because you forgot their birthday 3 lives ago. "Martinez could fix our reactor in 10 minutes but she's still mad about the overtime incident of Life 8."
"Explain Your Build"
Community challenge where players explain character builds using only corporate buzzword salad:
"My synergistic crew leverages cross-functional competencies to maximize stakeholder value in the carrot vertical integration pipeline."
Weekend Market Crashes
Forgetting that Galaxy 2 markets close for "Spiritual Reflection Saturdays" and watching your entire trade route collapse. #SaturdayCarrotPanic trends weekly.
The Mythological Captains
• "Immortal Vex" - the first player to hit Life 20
• "Sarah the Crew Whisperer" - leaked screenshot of 15 crew at 100% loyalty
• "The Butcher of Beacon-5" - lost 47 crew members in a single life
• "Weekend Warrior William" - only plays on Galaxy 2 weekends, somehow rich
Ship Software Patch Notes
Players write fake patch notes for their terrible ship software:
"v2.1.47 - Fixed: Buttons now require only 2 clicks instead of 3"
"v2.1.48 - Known issue: Navigation tab sometimes displays in Latin"
The Absence Story Hall of Fame
Players share the wildest LLM-generated absence summaries. Current record holder: "Your crew started, fought, and ended a civil war while you were at work. Chen is now democratically elected Cargo Bay President. The coffee machine remains broken."
"Just Like Real Work"
Comparing game frustrations to actual jobs:

• "My crew filed a complaint because I scheduled maintenance during lunch"
• "Chen put in a PTO request for the day we're being attacked by pirates"
• "Rodriguez started a union. I'm the only non-member."
The Secret Final Boss
Persistent joke that the real final boss is the interface itself. "I've conquered the galaxy but I still can't find the crew payment tab."

These memes create a shared language where "Chen's drunk, Rodriguez knows a guy, Torres will fix it, but the Nguyens remember" tells an entire story that any veteran player immediately understands.

Time Debt: Hard Science Edition

The Discovery
Players notice crew aging discrepancies after long hauls between systems. Torres aged 3.7 years during what ship chronometer logged as 18 months. The math matches relativistic time dilation perfectly - but the economy hasn't adjusted for it.

The revelation: Every hyperwarp jump creates real time dilation debt. You arrive having aged less than the universe around you. That difference has to be paid back.
The Physics
Relativistic Arbitrage:

• Hyperwarp travel near light-speed creates time dilation
• 6-month journey at 0.99c = 3.5 years pass in normal space
• Traders age 6 months while markets age 3.5 years
• Compound interest accumulates in the difference

The Debt Mechanism:
Banks discovered this temporal gap represents real economic value. While you traveled for 6 months, your debts accumulated 3.5 years of interest. The 3-year difference becomes collateralized "Time Debt" - a tradeable security based on relativistic physics.
How Banks Monetized Time Dilation
Temporal Futures Contracts:

CONTRACT TD-7847:
Departure: Sol Station (Universal Time: 2387.147)
Arrival: Proxima (Ship Time: +180 days)
Dilation Factor: 7.2x
Collateral: 1,296 days temporal arbitrage
Current Bid: 47,000 credits per year


Compound Interest Exploitation:

• Borrow 100,000 credits at 5% annually
• Take relativistic journey (age 1 year)
• Universe ages 7 years
• Owe 140,710 credits (compound interest over 7 years)
• The 40,710 credit difference is your "Time Debt"
The Time Debt Mines (Economic Reality)
High-Dilation Zones:
Massive gravity wells where time moves slower. Mining colonies established in orbit around black holes and neutron stars. Workers experience 1 day while the universe experiences 10.

The Economics:

• Miners work 1 subjective year
• Universe ages 10 years
• Paid for 1 year of labor
• Banks collect 10 years of interest on their mortgages
• 9-year difference becomes extractable debt

Mining Colony Reality:

Station Chronos-Deep:
Orbital Period: 0.3c around neutron star
Dilation Factor: 1:8.7
Worker Contract: 5 subjective years
Universal Time Elapsed: 43.5 years
Worker Returns: Middle-aged
Their Children: Elderly

Biological Interest Rates
Aging Arbitrage:
Young workers sign contracts to work in high-dilation zones. They age 5 years while their peers age 40. Return still young enough to enjoy earnings, but everyone they knew is dead.

Generational Wealth Destruction:
Children inherit parents' debts. Due to dilation, debts compound faster than inheritance can grow. Entire bloodlines enslaved to temporal compound interest.
Market Mechanics
Time Debt as Currency:

• Measured in "year-hours" (hours of time dilation differential)
• Trades on commodity exchanges
• Price fluctuates based on interest rates and travel routes
• High-speed traders literally age slower than their portfolios

Temporal Carry Trade:

1. Borrow money in high-time zones (where time moves fast)
2. Invest in low-time zones (near massive gravity)
3. Debt compounds slowly while investments grow quickly
4. The differential is profit
The Cruel Mathematics
Example Career Path:

Age 20: Sign 10-year mining contract at 1:10 dilation
Age 30 (subjective): Complete contract
Age 30 (universal time): 120 years have passed
Family status: Great-grandchildren you've never met
Pension value: Destroyed by 100 years of inflation
Debt status: Student loans compounded to unpayable levels


Compound Horror:
Initial loan: 50,000 credits for pilot training
Interest rate: 3% annually
Time in service: 2 years subjective (20 years universal)
Amount owed: 50,000 × (1.03)^20 = 90,305 credits
Time Debt generated: 18 years of compound interest
Corporate Exploitation
Indenture Contracts:
Companies offer to "buy" your Time Debt in exchange for labor. Work in high-dilation zones to prevent debt from compounding. Essentially selling years of your life to pause interest accumulation.

The Temporal Company Store:
Prices in mining colonies adjust for time dilation. Coffee costs 10x because it aged 10 years during your "quick" supply run. Fresh food impossible - everything spoils in transit.
Social Consequences
Dilation Widows:
Spouses of relativistic traders who age alone. Support groups for women whose husbands return young to find them elderly. Children who meet fathers younger than themselves.

Temporal Refugees:
Entire populations fleeing to high-dilation zones to escape debt. Living in time-slow hell to prevent interest accumulation. Generations born in 0.1x time, experiencing one year per decade.
The Time Debt Securities Market
Collateralized Temporal Obligations (CTOs):
Bundle Time Debts from multiple traders. Sell to investors who bet on route efficiency. 2387 financial crisis caused by mass CTO defaults when hyperlane collapsed.

Mortality Derivatives:
Betting on whether debtors will live long enough to pay. Actuarial tables adjusted for time dilation. "He owes 200 years of compound interest but only has 50 years of subjective life."
The Resistance
Linear Liberation Front:
Activists who refuse relativistic travel. Live and die in single timeframe. Considered economic terrorists by banks losing compound interest opportunities.

Debt Bombing:
Deliberately taking massive loans then entering permanent high-dilation orbit. Debt becomes worthless as universe ages around frozen debtors. Banks hire "repo-men" to extract them.
The Hidden Truth
The entire interstellar economy depends on Time Debt. Without relativistic interest slavery, trade would collapse. The navigation guilds maintain monopoly on "safe" routes that minimize dilation, selling convenience to the wealthy while the poor take high-dilation paths.

Every hyperwarp jump is a devil's bargain: reach your destination quickly in ship-time, but pay with years of compound interest. The universe's economy runs on the stolen time between departure and arrival.

The cruelest part? It's all perfectly legal. The math is sound. The physics are real. And the debt... the debt is forever.

Story Building Blocks (Not Variables)

The Discovery Block
"Find something that wasn't supposed to be there"

• In cargo
• In crew quarters
• In ship systems
• In someone's past
• In the fine print
The Countdown Block
"Running out of [resource] while [problem]"

• Fuel while pursued
• Air while negotiating
• Time while sick
• Money while docked
• Patience while waiting
The Double Identity Block
"Someone is not who they claim"

• Crew member
• Passenger
• Authority figure
• Buyer/seller
• Your ship's previous owner
The Old Debt Block
"Someone remembers what you did"

• Former crew
• Abandoned family
• Cheated merchant
• Saved official
• Failed partner
The Broken Promise Block
"Deal changes after commitment"

• Price doubles mid-delivery
• Cargo becomes illegal
• Destination moves
• Contact disappears
• Terms were lies
The Suspicious Kindness Block
"Help offered for 'no reason'"

• Free repairs
• Discount fuel
• Easy job
• Friendly official
• Generous credit
The Expertise Dependency Block
"Only one person can fix this"

• And they hate you
• And they're expensive
• And they're missing
• And they want favors
• And they're your ex
The Jurisdiction Trap Block
"Legal here, illegal there"

• Cargo status changes
• Crew member wanted
• Ship mods forbidden
• Currency invalid
• License expired
The Crew Conflict Block
"Two people can't work together"

• Love triangle
• Old grudge
• Class conflict
• Skill rivalry
• Past betrayal
The Resource Spiral Block
"Fixing A breaks B"

• Power to engines = no life support
• Speed = burning fuel
• Cheap parts = frequent repairs
• Quick route = dangerous space
• More crew = less supplies
The Information Asymmetry Block
"They know something you don't"

• About your cargo
• About your route
• About your crew
• About your ship
• About your past
The Loyalty Test Block
"Choose between [person] and [need]"

• Crew vs profit
• Friend vs law
• Promise vs survival
• Truth vs peace
• Individual vs group
The Blackmail Hook Block
"We know what you did"

• Recorded evidence
• Witness testimony
• Paper trail
• Digital logs
• Crew confession
The Failing Disguise Block
"Pretense slowly collapses"

• Fake credentials scrutinized
• Cover story unraveling
• Hidden damage spreading
• Secret cargo leaking
• False identity exposed
The Competing Obligations Block
"Can't satisfy both demands"

• Two deliveries, one slot
• Two bosses, one job
• Two emergencies, one medkit
• Two repairs, one part
• Two debts, one payment
The Cascading Failure Block
"Small problem triggers chain reaction"

• Leak → system failure → crew panic → mutiny
• Late payment → credit freeze → fuel shortage → stranded
• Sick crew → work undone → deadline missed → contract lost
The Protection Racket Block
"Pay for problem to go away"

• Pirates
• Inspectors
• Competitors
• Information
• "Insurance"
The Bitter Medicine Block
"Solution is worse than problem"

• Medicine that addicts
• Repair that cripples
• Deal that enslaves
• Help that obligates
• Loan that ruins
The Moving Goalpost Block
"Success keeps getting redefined"

• Deliver here → now there → now there
• Pay this → now more → now more
• Fix this → breaks that → fix that too
• One trip → one more → one more
The Trojan Horse Block
"Gift contains threat"

• Helpful passenger
• Free upgrade
• Bonus cargo
• New crew member
• Software patch
How They Combine
Discovery + Countdown = Find bomb with timer
Double Identity + Old Debt = Your engineer is here for revenge
Broken Promise + Jurisdiction Trap = Legal job becomes smuggling
Crew Conflict + Expertise Dependency = Only the person who hates you can save everyone
Information Asymmetry + Blackmail Hook = They know your secret before you do

Each block is a narrative shape that can be filled with specific content but maintains its essential dramatic function. Mix 2-3 blocks for any mission or event.

File Structure for Spacepunk MVP

Root Structure

spacepunk/
├── client/                 # Vue.js frontend
├── server/                 # Node.js backend
├── shared/                 # Shared constants/types
├── database/              # SQL schemas and migrations
└── docker-compose.yml     # Local dev environment

Client (Vue.js)

client/
├── src/
│   ├── main.js
│   ├── App.vue
│   │
│   ├── views/              # Main page components
│   │   ├── Login.vue       # Username entry (no auth)
│   │   ├── Ship.vue        # Main game view with tabs
│   │   ├── Death.vue       # Permadeath screen
│   │   └── Loading.vue     # "Connecting to universe..."
│   │
│   ├── components/         # Reusable pieces
│   │   ├── tabs/
│   │   │   ├── ShipStatus.vue
│   │   │   ├── CrewManagement.vue
│   │   │   ├── Market.vue
│   │   │   ├── Navigation.vue
│   │   │   ├── Messages.vue
│   │   │   └── CargoHold.vue
│   │   │
│   │   ├── crew/
│   │   │   ├── CrewList.vue
│   │   │   ├── CrewMember.vue
│   │   │   ├── HireInterface.vue
│   │   │   └── CrewMessage.vue
│   │   │
│   │   ├── market/
│   │   │   ├── ResourceList.vue
│   │   │   ├── TradeForm.vue
│   │   │   ├── PriceHistory.vue    # Unlockable
│   │   │   └── MarketIntel.vue     # Unlockable
│   │   │
│   │   ├── interface/
│   │   │   ├── TabBar.vue          # Grows with upgrades
│   │   │   ├── TickCounter.vue     # "Next tick: 3:47"
│   │   │   ├── StatusBar.vue       # Credits, location, fuel
│   │   │   └── ErrorModal.vue      # "SYSTEM ERROR: Reality buffer overflow"
│   │   │
│   │   └── shared/
│   │       ├── BrutalistButton.vue  # Decays over time
│   │       ├── BrutalistForm.vue    # Gets personality
│   │       └── LoadingText.vue      # "Processing..." with delays
│   │
│   ├── composables/        # Vue 3 composition functions
│   │   ├── useWebSocket.js # Server connection
│   │   ├── useGameState.js # Central state management
│   │   ├── useCrewAI.js    # Crew personality logic
│   │   └── useDecay.js     # Interface degradation
│   │
│   ├── stores/            # Pinia stores
│   │   ├── ship.js
│   │   ├── crew.js
│   │   ├── market.js
│   │   ├── messages.js
│   │   └── player.js
│   │
│   └── utils/
│       ├── formatters.js   # "47.3%" not "47.293847%"
│       ├── constants.js    # GALAXIES, RESOURCES, etc.
│       └── decay.js        # Interface decay patterns

Server (Node.js)

server/
├── index.js               # Entry point
├── app.js                # Express setup
│
├── core/
│   ├── TickEngine.js     # The beast - processes world state
│   ├── WorldState.js     # In-memory game state
│   ├── EventQueue.js     # Queued actions between ticks
│   └── TimeDebt.js       # Relativistic calculations
│
├── systems/              # Game systems
│   ├── crew/
│   │   ├── CrewBehavior.js      # Autonomous decisions
│   │   ├── CrewRelationships.js # Who hates who
│   │   ├── CrewMemory.js        # Cross-death persistence
│   │   └── CrewSkills.js        # Training/development
│   │
│   ├── market/
│   │   ├── MarketSimulation.js  # Supply/demand
│   │   ├── PriceCalculator.js   # Faction modifiers
│   │   ├── ResourceManager.js   # 150 resources
│   │   └── MarketCalendar.js    # "Spiritual Reflection Saturdays"
│   │
│   ├── ship/
│   │   ├── ShipSystems.js       # Components/degradation
│   │   ├── Navigation.js        # Hyperjump calculations
│   │   ├── ComponentDecay.js    # Things breaking
│   │   └── FuelConsumption.js   # Travel costs
│   │
│   ├── intel/
│   │   ├── IntelNetwork.js      # Information propagation
│   │   ├── IntelMutation.js     # Truth → Gossip
│   │   └── IntelReliability.js  # Trust calculations
│   │
│   └── missions/
│       ├── MissionGenerator.js   # LLM integration
│       ├── MissionTemplates.js   # Pre-built patterns
│       └── MissionOutcomes.js    # Consequence tracking
│
├── websocket/
│   ├── SocketManager.js          # Client connections
│   ├── MessageHandler.js         # Route messages
│   └── BroadcastService.js       # Tick updates
│
├── database/
│   ├── connection.js             # PostgreSQL setup
│   ├── repositories/
│   │   ├── PlayerRepository.js
│   │   ├── ShipRepository.js
│   │   ├── CrewRepository.js
│   │   └── MarketRepository.js
│   └── migrations/
│       ├── 001_initial_schema.js
│       ├── 002_add_time_debt.js
│       └── 003_add_crew_memory.js
│
├── narrative/
│   ├── MessageGenerator.js       # Crew messages
│   ├── AbsenceStories.js        # Offline narratives
│   ├── templates/
│   │   ├── torres.json          # Torres-specific messages
│   │   ├── chen.json            # Chen getting drunk
│   │   └── station_greetings.json
│   └── personalities/
│       ├── CrewPersonality.js
│       └── InterfacePersonality.js  # Buttons getting moody
│
└── utils/
    ├── logger.js
    ├── constants.js
    └── helpers.js

Shared

shared/
├── constants.js
│   ├── RESOURCES         # All 150 resources
│   ├── GALAXIES         # 4 galaxy definitions
│   ├── CREW_TRAITS      # Trait definitions
│   └── MESSAGE_TYPES    # WebSocket event types
│
├── types.js             # If using TypeScript later
└── formulas.js          # Shared calculations

The Critical Files to Nail First
1. TickEngine.js - This is your game's heartbeat

class TickEngine {
  async processTick() {
    // This runs every 4-60 seconds and updates EVERYTHING
  }
}


2. CrewBehavior.js - This creates emergent stories

class CrewBehavior {
  makeDecisions(crew, shipState, relationships) {
    // Torres fixes things, Chen gets drunk, magic happens
  }
}


3. Ship.vue - The main game interface

<template>
  <!-- Raw HTML brutalism -->
  <div>
    <h1>SSV {{ shipName }}</h1>
    <div class="tabs">
      <button v-for="tab in unlockedTabs">{{ tab }}</button>
    </div>
  </div>
</template>


4. MessageGenerator.js - The soul of the game

generateCrewMessage(crew, context) {
  // This makes Torres feel like Torres
}

Files You DON'T Need (Yet)
• Authentication.js - Just username
• Graphics.js - It's HTML
• Animations.js - No animations
• SoundManager.js - Silent space
• Analytics.js - Track nothing
• PaymentProcessor.js - Free to play first
• CloudSave.js - Local only
• SocialFeatures.js - No friends
• Achievements.js - Playing is achievement
• Tutorial.js - Figure it out, spacer

Start with the boring infrastructure, but keep the weird soul in mind with every line.

Modern tools for building high-performance real-time multiplayer game backends in 2025
The landscape of multiplayer game backend development has evolved dramatically in 2025, with specialized tools emerging to handle the unique demands of real-time gaming at scale. This comprehensive research reveals that Colyseus dominates the Node.js game server framework space, Redis and ScyllaDB lead database performance, and WebTransport has revolutionized real-time networking with 5-15ms latency improvements over traditional WebSockets. 
Node.js game server frameworks excel beyond raw Express
The Node.js ecosystem offers several purpose-built frameworks specifically designed for real-time multiplayer games, moving far beyond generic web frameworks. 

Colyseus provides an authoritative server architecture that prevents client-side cheating through server-controlled game state. Its automatic state synchronization uses binary delta compression 


For physics-heavy games, Lance offers advanced client-side prediction with sophisticated extrapolation and interpolation algorithms. It integrates seamlessly with physics engines like Cannon.js and P2.js, providing deterministic simulation with intelligent lag compensation through step correction. 


Pomelo, developed by NetEase, targets enterprise-scale MMO games with its distributed multi-process architecture. It supports 20,000+ concurrent players per area server and has proven itself in production with millions of users. 


Nakama takes a unique hybrid approach, combining a Go-based server core with TypeScript/JavaScript runtime support for custom game logic. While not purely Node.js, it offers comprehensive backend features including user accounts, chat, social features, and built-in matchmaking, making it attractive for studios needing a complete backend infrastructure solution.
High-performance databases optimize for gaming workloads
Gaming databases in 2025 prioritize sub-millisecond latency, JSON flexibility, and massive concurrent operations. Redis dominates real-time gaming operations with sub-millisecond read/write latency and over 1 million operations per second. 

ScyllaDB delivers exceptional performance for high-throughput gaming scenarios, handling millions of operations per second with predictable single-digit millisecond latencies. 

MongoDB 8.0 shows impressive gains with 32% performance improvements and 75% reduction in query latencies. SEGA uses MongoDB for FIFA Online 3 across 250+ servers and 80 shards, while EA leverages it for scalable game backends. 

For SQL needs, PostgreSQL with JSONB offers excellent support for complex gaming queries, while CockroachDB provides distributed SQL capabilities crucial for multi-region deployments. A sports betting company using CockroachDB achieved 98% faster time-to-market for new regions while avoiding the need to hire 30+ additional engineers. 

Specialized time-series databases like TimescaleDB deliver up to 350x faster queries than regular PostgreSQL for gaming analytics, making them essential for player behavior analysis, game performance monitoring, and A/B testing metrics.
State synchronization libraries enable seamless multiplayer experiences
WebTransport has emerged as the definitive networking solution for 2025, showing 5-15ms latency improvements over WebSockets. Adoption has jumped from 8% to 27% among top websites in early 2025. FPS games see 35% reduction in perceived lag, RTS games support 2-3x more concurrent units on the same hardware, and MMO environments handle position updates for 200+ players at 10Hz with minimal bandwidth. Built on HTTP/3 and QUIC, WebTransport provides UDP-like speed with TCP-like reliability through multiple parallel streams and built-in TLS 1.3 encryption. 

For state synchronization, Yjs leverages Conflict-free Replicated Data Types (CRDTs) for automatic conflict resolution in collaborative gaming scenarios. Its offline-first architecture with eventual consistency supports multiple transport protocols and provides real-time awareness for cursor positions and user presence. 

Colyseus also excels at state management with its authoritative server pattern and automatic synchronization using delta compression. It scales to millions of players across different game rooms while maintaining lower operational costs than alternatives. 

Modern client prediction techniques include maintaining server timestamp correlation, storing input history for rollback scenarios, and implementing smoothing algorithms to prevent visual "snapping." 
WebSocket alternatives deliver unprecedented performance
Beyond WebTransport, enhanced WebSocket solutions continue to evolve. Socket.IO optimizations for 2025 include binary add-ons like bufferutil and utf-8-validate, custom parsers using msgpack for binary efficiency, and alternative engines like eiows. Properly configured Socket.IO instances handle 10,000-30,000 concurrent connections. 


WebRTC Data Channels offer peer-to-peer connections that reduce server costs, with both unreliable transmission for real-time data and reliable delivery for critical game events. 


The underlying QUIC protocol combines UDP speed with TCP reliability, offering multiplexed streams that prevent head-of-line blocking, faster connection establishment through 0-RTT handshakes, and built-in congestion control with native TLS 1.3 encryption. 


Message queues and event streaming handle game events at scale
Apache Kafka handles millions of events per second with sub-millisecond latency, making it ideal for real-time game telemetry, player event processing, and matchmaking queues. 


NATS offers ultra-low latency (sub-2ms) with a lightweight footprint, excelling at real-time player messaging and microservice communication. 

Redis Streams and Pub/Sub patterns power real-time multiplayer game state synchronization, player action queues, and session management. 


Cloud-managed solutions like AWS Kinesis integrate seamlessly with AWS GameLift for session-based games, while Google Pub/Sub provides global message distribution with ~100ms latency, excellent for cross-region game event distribution.
Caching layers optimize for massive in-memory state
Gaming-specific Redis patterns include session storage across distributed game servers, Sorted Sets for real-time ranking systems, temporary storage for active game sessions, and efficient matchmaking queues. 


For distributed caching, Apache Ignite outperforms competitors with superior SQL support (ANSI-99 compliant), better indexing for complex game queries, and cross-cache JOINs for player/organization relationships. 


Edge caching strategies reduce latency by processing game data within 1-2 network hops from clients, achieving 58% average latency reduction versus traditional public cloud deployment. Platforms like Edgegap have proven scalability to 14M concurrent users across 615+ global locations. 


Infrastructure and deployment tools streamline operations
Agones leads container orchestration for game servers as an open-source platform built on Kubernetes. 


Emerging platforms include Pragma Engine, which powers matchmaking, analytics, and monetization for studios including People Can Fly and Square Enix External Studios. Founded by League of Legends and Destiny 2 veterans, Pragma recently raised $12.75 million with Square Enix participation. 

Major cloud providers offer comprehensive solutions: AWS GameLift supports up to 100 million concurrent users and can launch 9,000 game servers per minute, 


For monitoring, Datadog successfully handles 12+ billion log events per day for EA DICE's Battlefield V, reducing troubleshooting time from weeks to hours. 

Performance comparisons show containers on bare metal deliver 25-30% better performance than VMs, 

The 2025 game backend technology stack represents a mature ecosystem optimized for the unique demands of real-time multiplayer gaming. Success requires carefully selecting tools based on specific game requirements: Colyseus for general multiplayer games, Lance for physics simulations, 


