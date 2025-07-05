import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import crypto from 'crypto';
import { PlayerRepository } from '../repositories/PlayerRepository.js';
import { ShipRepository } from '../repositories/ShipRepository.js';
import { CrewRepository } from '../repositories/CrewRepository.js';
import { MarketRepository } from '../repositories/MarketRepository.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import { ShipLogRepository } from '../repositories/ShipLogRepository.js';
import { TrainingQueueRepository } from '../repositories/TrainingQueueRepository.js';
import AbsenceStories from '../narrative/AbsenceStories.js';
import { MicroNarrativeGenerator } from '../narrative/MicroNarrativeGenerator.js';
import TrainingQueue from '../training/TrainingQueue.js';
import { query } from '../db/index.js';
import { ContentGenerator } from '../generators/ContentGenerator.js';
import { DialogGenerator } from '../generators/DialogGenerator.js';
import { DollhouseMarket } from '../markets/DollhouseMarket.js';
import { MarketIntelligence } from '../markets/MarketIntelligence.js';
import { PoliticalHierarchy } from '../politics/PoliticalHierarchy.js';
import { StoryConsequenceEngine } from '../narrative/StoryConsequenceEngine.js';
import { gameRandom } from '../utils/seededRandom.js';

const router = express.Router();
const playerRepo = new PlayerRepository();
const shipRepo = new ShipRepository();
const crewRepo = new CrewRepository();
const marketRepo = new MarketRepository();
const missionRepo = new MissionRepository();
const shipLogRepo = new ShipLogRepository();
const trainingQueueRepo = new TrainingQueueRepository();
const absenceStories = new AbsenceStories();
const microNarrative = new MicroNarrativeGenerator();
const trainingQueue = new TrainingQueue();
const contentGenerator = new ContentGenerator();
const dialogGenerator = new DialogGenerator();
const dollhouseMarket = new DollhouseMarket();
const marketIntelligence = new MarketIntelligence();
const politicalHierarchy = new PoliticalHierarchy();
const storyConsequenceEngine = new StoryConsequenceEngine();

// Connect the systems so they can share data
dialogGenerator.setStoryConsequenceEngine(storyConsequenceEngine);

// Create new player and starting ship
router.post('/player/create', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if username already exists
    const existingPlayer = await playerRepo.findByUsername(username);
    if (existingPlayer) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password (simplified for demo)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Create player
    const player = await playerRepo.create({
      username,
      email,
      passwordHash
    });
    
    // Create starting ship
    const ship = await shipRepo.create({
      playerId: player.id,
      name: `${username}'s Vessel`,
      hullType: 'basic_hauler',
      locationGalaxy: 'Sol System',
      locationStation: 'Earth Station Alpha',
      fuelMax: 100,
      cargoMax: 50
    });
    
    // Create some initial available crew
    await generateStartingCrew();
    
    res.json({ 
      player, 
      ship,
      message: 'Captain profile initialized successfully'
    });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player profile' });
  }
});


// Generate comprehensive crew narratives (rate-limited & queued)
router.post('/api/crew/generate-narratives', async (req, res) => {
  try {
    const { crewMember, priority = 'normal' } = req.body;
    
    // Use efficient batch generation instead of individual calls
    const narratives = await microNarrative.batchGenerateCrewNarratives(
      crewMember, 
      ['description', 'health', 'morale', 'stress', 'skill', 'trait', 'background', 'performance'],
      priority
    );

    res.json(narratives);
  } catch (error) {
    console.error('Error generating crew narratives:', error);
    res.status(500).json({ error: 'Failed to generate narratives' });
  }
});

// LLM queue status endpoint for monitoring
router.get('/api/llm/status', async (req, res) => {
  try {
    const stats = microNarrative.getQueueStats();
    res.json({
      status: 'operational',
      queue: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting LLM status:', error);
    res.status(500).json({ error: 'Failed to get LLM status' });
  }
});

// Get available crew for hiring
router.get('/crew/available', async (req, res) => {
  try {
    const availableCrew = await crewRepo.findAvailableForHire(10);
    
    let crewList = availableCrew.length === 0 ? 
      await crewRepo.generateAvailableCrew(5) : 
      availableCrew;

    // Add micro-narratives to each crew member
    const enrichedCrew = await Promise.all(crewList.map(async (member) => {
      const narrative = await microNarrative.generateCrewHiringNarrative(member);
      return {
        ...member,
        corporate_summary: narrative,
        hiring_memo: `Personnel File ${member.id.substr(0, 8).toUpperCase()}: ${narrative}`
      };
    }));
    
    res.json(enrichedCrew);
  } catch (error) {
    console.error('Error with crew system:', error);
    res.status(500).json({ error: 'Crew generation system failed' });
  }
});

// Get individual crew member details
router.get('/crew/:crewId', async (req, res) => {
  try {
    const { crewId } = req.params;
    const crewMember = await crewRepo.findById(crewId);
    
    if (!crewMember) {
      return res.status(404).json({ error: 'Crew member not found' });
    }

    // Add detailed corporate narratives
    const narrative = await microNarrative.generateCrewHiringNarrative(crewMember);
    const enrichedMember = {
      ...crewMember,
      corporate_summary: narrative,
      personnel_evaluation: `Employee ${crewMember.name}: ${narrative}`,
      status_report: await microNarrative.generateActionNarrative('system_check', {}),
      performance_notes: `Current assignment status: Active. Compliance rating: Satisfactory.`
    };
    
    res.json(enrichedMember);
  } catch (error) {
    console.error('Error fetching crew member:', error);
    res.status(500).json({ error: 'Failed to fetch crew member details' });
  }
});

// Hire crew member
router.post('/crew/:crewId/hire', async (req, res) => {
  try {
    const { crewId } = req.params;
    const { shipId } = req.body;
    
    if (!shipId) {
      return res.status(400).json({ error: 'Ship ID required' });
    }
    
    const result = await crewRepo.assignToShip(crewId, shipId);
    if (!result) {
      return res.status(404).json({ error: 'Crew member not found or unavailable' });
    }
    
    // Add hiring memory
    await crewRepo.addMemory(
      crewId,
      'hired',
      `Joined the crew of ship ${shipId}`,
      30
    );
    
    res.json({ 
      message: 'Crew member hired successfully',
      crewMember: result
    });
  } catch (error) {
    console.error('Error hiring crew:', error);
    res.status(500).json({ error: 'Failed to hire crew member' });
  }
});

// Get ship crew
router.get('/ship/:shipId/crew', async (req, res) => {
  try {
    const { shipId } = req.params;
    const crew = await crewRepo.findByShipId(shipId);
    res.json(crew);
  } catch (error) {
    console.error('Error fetching ship crew:', error);
    res.status(500).json({ error: 'Failed to fetch crew data' });
  }
});

// LLM Crew Generation Endpoints
router.post('/api/crew/generate-name', async (req, res) => {
  try {
    const { context = 'spacepunk_corporate_dystopia', cultural_background = 'corporate', seed } = req.body;
    
    const prompt = `Generate a single crew member name for a cynical corporate space logistics game.

IMPORTANT: Return ONLY the name. No other text, no JSON, just the plain name.

Cultural context: ${cultural_background}
Corporate dystopian setting: Spacepunk universe

Generate a name appropriate for: ${cultural_background} background in a corporate space environment.

Requirements:
- First and last name only
- Appropriate for the cultural background
- Sounds like someone who would work for a terrible space logistics company
- Not overly exotic or sci-fi - these are working people

Examples:
- Chen Martinez (corporate/mixed)
- Sarah Johnson (corporate)
- Yuki Tanaka (asian corporate)
- Marcus Thompson (corporate)

Generate name:`;

    const result = await contentGenerator.callLLM(prompt);
    if (result && result.trim()) {
      res.json({ name: result.trim() });
    } else {
      // Fallback to chance.js generation
      const firstName = gameRandom.chance.first();
      const lastName = gameRandom.chance.last();
      res.json({ name: `${firstName} ${lastName}` });
    }
  } catch (error) {
    console.error('Error generating crew name:', error);
    // Fallback to chance.js
    const firstName = gameRandom.chance.first();
    const lastName = gameRandom.chance.last();
    res.json({ name: `${firstName} ${lastName}` });
  }
});

router.post('/api/crew/generate-employment-note', async (req, res) => {
  try {
    const { crewMember, context = 'spacepunk_corporate_dystopia' } = req.body;
    
    const prompt = `Generate a brief employment note for this crew member in a cynical corporate space logistics company.

IMPORTANT: Return ONLY the employment note text. No quotes, no JSON, just the plain text.

Crew Member: ${crewMember?.name || 'Crew Member'}
Background: ${crewMember?.cultural_background || 'corporate'}
Experience: ${crewMember?.experience || 'moderate'}

Corporate setting: Terrible space logistics company with bureaucratic dysfunction

Generate a 1-2 sentence employment note that sounds like:
- Corporate HR documentation
- Slightly passive-aggressive or bureaucratic
- References their background or skills
- Has corporate dystopian humor

Examples:
- "Previously employed at Galactic Shipping Solutions until the incident with the coffee machine. Shows proficiency in heavy machinery operation."
- "Transferred from accounting division after demonstrating unexpected competence with reactor maintenance. Claims to enjoy the work."
- "Self-employed contractor with extensive experience in 'creative problem solving.' Background check pending."

Generate employment note:`;

    const result = await contentGenerator.callLLM(prompt);
    if (result && result.trim()) {
      res.json({ note: result.trim() });
    } else {
      // Fallback employment notes
      const fallbackNotes = [
        "Previously employed at competing logistics firm until 'restructuring.' References available upon request.",
        "Self-trained in essential ship operations. Claims to work well under pressure and tight deadlines.",
        "Transferred from administrative role after showing aptitude for technical problem-solving. Adapts quickly.",
        "Contract worker with solid reputation in the outer systems. Prefers practical solutions to complex problems."
      ];
      res.json({ note: gameRandom.chance.pickone(fallbackNotes) });
    }
  } catch (error) {
    console.error('Error generating employment note:', error);
    const fallbackNote = "Available for immediate assignment. Standard corporate background verification completed.";
    res.json({ note: fallbackNote });
  }
});

router.post('/api/crew/generate-candidate', async (req, res) => {
  try {
    const { context = 'spacepunk_corporate_dystopia', seed } = req.body;
    
    // Use seed for consistent generation
    if (seed) {
      gameRandom.setSeed(seed);
    }
    
    // Generate basic stats with chance.js
    const culturalBackgrounds = ['corporate', 'agricultural', 'mining', 'research', 'military', 'freelance'];
    const cultural_background = gameRandom.chance.pickone(culturalBackgrounds);
    
    const baseStats = {
      health: gameRandom.chance.integer({ min: 70, max: 100 }),
      morale: gameRandom.chance.integer({ min: 60, max: 90 }),
      stress: gameRandom.chance.integer({ min: 10, max: 40 }),
      experience: gameRandom.chance.integer({ min: 20, max: 80 }),
      cost: gameRandom.chance.integer({ min: 1500, max: 4500 })
    };
    
    // Generate LLM-powered narrative elements
    const prompt = `Generate a complete crew candidate for a cynical corporate space logistics game.

IMPORTANT: Return ONLY a JSON object. No other text.

Cultural background: ${cultural_background}
Health: ${baseStats.health}%
Morale: ${baseStats.morale}%  
Stress: ${baseStats.stress}%
Experience: ${baseStats.experience}%
Hiring cost: ${baseStats.cost} credits

Required JSON format:
{
  "name": "First Last",
  "employment_note": "Brief corporate HR-style note about their background",
  "personality_summary": "1-2 sentence personality description with corporate dystopian humor"
}

Focus on:
- Realistic names appropriate for ${cultural_background} background
- Corporate bureaucratic tone for employment notes
- Cynical humor in personality descriptions
- Make them feel like real people working for a terrible space company

Example:
{
  "name": "Maria Santos", 
  "employment_note": "Former quality assurance specialist at Titan Industries until the 'productivity optimization.' Shows initiative with equipment troubleshooting.",
  "personality_summary": "Quietly competent with a dry sense of humor about corporate policies. Prefers fixing things to attending mandatory team-building exercises."
}

Generate candidate:`;

    const llmResult = await contentGenerator.callLLM(prompt);
    let candidate = baseStats;
    
    if (llmResult) {
      try {
        const parsed = JSON.parse(llmResult);
        candidate = {
          ...baseStats,
          ...parsed,
          cultural_background,
          id: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      } catch (parseError) {
        console.error('Failed to parse LLM candidate response:', parseError);
        // Fall through to fallback generation
      }
    }
    
    // Fallback generation if LLM fails
    if (!candidate.name) {
      const firstName = gameRandom.chance.first();
      const lastName = gameRandom.chance.last();
      candidate.name = `${firstName} ${lastName}`;
    }
    
    if (!candidate.employment_note) {
      const fallbackNotes = [
        "Recently completed corporate training program. Demonstrates adequate competency in standard operating procedures.",
        "Transferred from different division after budget restructuring. Familiar with regulatory compliance requirements.",
        "Contract employee with acceptable performance ratings. Available for immediate deployment to active vessel.",
        "Self-directed learner with practical experience in multi-system operations. References available upon request."
      ];
      candidate.employment_note = gameRandom.chance.pickone(fallbackNotes);
    }
    
    if (!candidate.personality_summary) {
      candidate.personality_summary = "Maintains professional demeanor while adapting to changing operational requirements. Prefers practical solutions to bureaucratic procedures.";
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error generating crew candidate:', error);
    res.status(500).json({ error: 'Failed to generate crew candidate' });
  }
});

// Generate initial crew relationships using existing infrastructure
router.post('/api/crew/generate-relationships', async (req, res) => {
  try {
    const { shipId, seed } = req.body;
    
    if (!shipId) {
      return res.status(400).json({ error: 'Ship ID required' });
    }
    
    // Use seed for consistent generation
    if (seed) {
      gameRandom.setSeed(seed);
    }
    
    // Get current crew with existing relationships
    const crewWithRelationships = await crewRepo.getCrewWithRelationships(shipId);
    
    if (crewWithRelationships.length < 2) {
      return res.json({ message: 'Need at least 2 crew members to generate relationships' });
    }
    
    const generatedRelationships = [];
    
    // Generate relationships between crew pairs who don't already have them
    for (let i = 0; i < crewWithRelationships.length; i++) {
      for (let j = i + 1; j < crewWithRelationships.length; j++) {
        const crew1 = crewWithRelationships[i];
        const crew2 = crewWithRelationships[j];
        
        // Check if relationship already exists
        const existingRelation = await crewRepo.getRelationships(crew1.id);
        const hasRelation = existingRelation.some(r => r.other_crew_member_id === crew2.id);
        
        if (hasRelation) continue;
        
        // Calculate compatibility based on existing archetype system
        const culturalCompatibility = crew1.culture === crew2.culture ? 15 : 0;
        const archetypeCompatibility = calculateArchetypeCompatibility(crew1, crew2);
        const personalityCompatibility = calculatePersonalityCompatibility(crew1, crew2);
        
        const baseRelationship = gameRandom.chance.integer({ min: -30, max: 60 });
        const finalRelationship = Math.max(-100, Math.min(100, 
          baseRelationship + culturalCompatibility + archetypeCompatibility + personalityCompatibility
        ));
        
        // Use existing updateRelationship method
        await crewRepo.updateRelationship(crew1.id, crew2.id, finalRelationship);
        await crewRepo.updateRelationship(crew2.id, crew1.id, finalRelationship);
        
        // Generate backstory using LLM and add as memories
        const backstoryPrompt = `Generate a crew relationship backstory for a cynical corporate space logistics game.

IMPORTANT: Return ONLY the backstory text. No JSON, no other formatting.

Crew Member 1: ${crew1.name} (${crew1.culture}, ${crew1.dominant_archetype})
Crew Member 2: ${crew2.name} (${crew2.culture}, ${crew2.dominant_archetype})
Relationship Score: ${finalRelationship}/100

Generate a 1-2 sentence backstory explaining their history together, appropriate for a corporate space logistics setting. Focus on previous jobs, stations visited, or shared experiences in the shipping industry.

Examples:
- "Both worked graveyard shifts at the same orbital freight depot, bonding over terrible coffee and worse management."
- "Met during a cargo emergency at Titan Station - Chen's quick thinking saved Martinez's career review."
- "Previously assigned to competing logistics firms, developed mutual respect through professional rivalry."

Generate backstory:`;

        const backstory = await contentGenerator.callLLM(backstoryPrompt) || 
          "Met during previous assignment. Maintain professional working relationship.";
        
        // Add relationship memories to both crew members
        await crewRepo.addMemory(
          crew1.id,
          'relationship_formed',
          `Relationship established with ${crew2.name}: ${backstory.trim()}`,
          Math.round(finalRelationship / 10),
          crew2.id,
          'crew_member'
        );
        
        await crewRepo.addMemory(
          crew2.id,
          'relationship_formed',
          `Relationship established with ${crew1.name}: ${backstory.trim()}`,
          Math.round(finalRelationship / 10),
          crew1.id,
          'crew_member'
        );
        
        generatedRelationships.push({
          crew1: crew1.name,
          crew2: crew2.name,
          relationship_value: finalRelationship,
          backstory: backstory.trim()
        });
      }
    }
    
    res.json({ 
      message: `Generated ${generatedRelationships.length} new relationships`,
      relationships: generatedRelationships 
    });
  } catch (error) {
    console.error('Error generating crew relationships:', error);
    res.status(500).json({ error: 'Failed to generate crew relationships' });
  }
});

// Helper functions for relationship compatibility
function calculateArchetypeCompatibility(crew1, crew2) {
  // Archetype compatibility matrix - some archetypes work better together
  const compatibilityMatrix = {
    'innocent': { 'caregiver': 10, 'sage': 8, 'outlaw': -5 },
    'sage': { 'innocent': 8, 'explorer': 10, 'jester': -3 },
    'explorer': { 'outlaw': 12, 'hero': 8, 'ruler': -8 },
    'outlaw': { 'explorer': 12, 'magician': 10, 'ruler': -15 },
    'magician': { 'outlaw': 10, 'creator': 15, 'orphan': 5 },
    'hero': { 'caregiver': 8, 'explorer': 8, 'lover': 5 },
    'lover': { 'caregiver': 12, 'jester': 8, 'ruler': 3 },
    'jester': { 'lover': 8, 'orphan': 10, 'sage': -3 },
    'caregiver': { 'innocent': 10, 'lover': 12, 'hero': 8 },
    'creator': { 'magician': 15, 'explorer': 5, 'ruler': -5 },
    'ruler': { 'hero': 3, 'creator': -5, 'outlaw': -15 },
    'orphan': { 'caregiver': 8, 'jester': 10, 'magician': 5 }
  };
  
  const arch1 = crew1.dominant_archetype;
  const arch2 = crew2.dominant_archetype;
  
  return compatibilityMatrix[arch1]?.[arch2] || 0;
}

function calculatePersonalityCompatibility(crew1, crew2) {
  // Jung personality compatibility
  let compatibility = 0;
  
  // Extroversion compatibility
  const extrovertDiff = Math.abs(crew1.trait_extroversion - crew2.trait_extroversion);
  compatibility += extrovertDiff < 20 ? 5 : extrovertDiff > 60 ? -3 : 0;
  
  // Thinking vs Feeling compatibility
  const thinkingDiff = Math.abs(crew1.trait_thinking - crew2.trait_thinking);
  compatibility += thinkingDiff < 30 ? 3 : 0;
  
  return compatibility;
}

// Debug endpoint to check resources
router.get('/debug/resources', async (req, res) => {
  try {
    const resources = await query('SELECT * FROM resources LIMIT 10');
    const stations = await query('SELECT * FROM stations LIMIT 10');
    const marketData = await query('SELECT * FROM market_data LIMIT 10');
    
    res.json({
      resourceCount: resources.rows.length,
      resources: resources.rows,
      stationCount: stations.rows.length,
      stations: stations.rows,
      marketDataCount: marketData.rows.length,
      marketData: marketData.rows
    });
  } catch (error) {
    console.error('Debug query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get market data (resources)
router.get('/market/data', async (req, res) => {
  try {
    const { stationId = 'earth-station-alpha' } = req.query;
    
    console.log('Fetching market data for station:', stationId);
    
    // Get market data for this station
    const marketData = await marketRepo.findByStation(stationId);
    
    if (marketData.length === 0) {
      console.log('No market data found, returning resources with base prices');
      // No market data yet, return resources with base prices
      const resources = await query('SELECT * FROM resources ORDER BY category, name');
      const resourcesWithPricing = await Promise.all(resources.rows.map(async (resource) => {
        const priceTrend = (Math.random() - 0.5) * 20;
        const marketNarrative = await microNarrative.generateMarketNarrative({
          resourceName: resource.name,
          priceChange: priceTrend,
          stationName: stationId
        });
        
        return {
          ...resource,
          resource_name: resource.name,
          resource_category: resource.category,
          current_price: resource.base_price,
          supply: Math.floor(Math.random() * 400) + 100,
          demand: Math.floor(Math.random() * 400) + 100,
          price_trend: priceTrend,
          market_analysis: marketNarrative,
          corporate_memo: `Trade Advisory: ${marketNarrative}`
        };
      }));
      console.log(`Returning ${resourcesWithPricing.length} resources with simulated data`);
      res.json(resourcesWithPricing);
    } else {
      // Add narratives to existing market data
      const enrichedMarketData = await Promise.all(marketData.map(async (item) => {
        const marketNarrative = await microNarrative.generateMarketNarrative({
          resourceName: item.resource_name,
          priceChange: item.price_trend || 0,
          stationName: stationId
        });
        
        return {
          ...item,
          market_analysis: marketNarrative,
          corporate_memo: `Trade Advisory: ${marketNarrative}`,
          sector_report: `${item.resource_category}: Market conditions ${item.price_trend > 0 ? 'favorable' : 'challenging'}`
        };
      }));
      
      console.log(`Found ${enrichedMarketData.length} market entries`);
      res.json(enrichedMarketData);
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get market trends for a specific resource
router.get('/market/trends/:stationId/:resourceId', async (req, res) => {
  try {
    const { stationId, resourceId } = req.params;
    const { hours = 24 } = req.query;
    
    const trends = await marketRepo.getMarketTrends(stationId, resourceId, hours);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    res.status(500).json({ error: 'Failed to fetch market trends' });
  }
});

// Get available missions
router.get('/missions/available', async (req, res) => {
  try {
    const { stationId, limit = 10, type, difficulty } = req.query;
    
    let missions;
    if (type) {
      missions = await missionRepo.findByType(type, limit);
    } else if (difficulty) {
      missions = await missionRepo.findByDifficulty(difficulty, limit);
    } else {
      missions = await missionRepo.findAvailable(limit, stationId);
    }
    
    res.json(missions);
  } catch (error) {
    console.error('Error fetching available missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// Get mission details
router.get('/missions/:missionId', async (req, res) => {
  try {
    const { missionId } = req.params;
    const mission = await missionRepo.findById(missionId);
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    res.json(mission);
  } catch (error) {
    console.error('Error fetching mission:', error);
    res.status(500).json({ error: 'Failed to fetch mission details' });
  }
});

// Accept a mission
router.post('/missions/:missionId/accept', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { playerId, shipId } = req.body;
    
    if (!playerId || !shipId) {
      return res.status(400).json({ error: 'Player ID and Ship ID required' });
    }
    
    const mission = await missionRepo.acceptMission(missionId, playerId, shipId);
    
    res.json({
      message: 'Mission accepted successfully',
      mission
    });
  } catch (error) {
    console.error('Error accepting mission:', error);
    res.status(500).json({ error: error.message || 'Failed to accept mission' });
  }
});

// Complete a mission
router.post('/missions/:missionId/complete', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { playerId, rewards, notes } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }
    
    const mission = await missionRepo.completeMission(missionId, playerId, rewards, notes);
    
    res.json({
      message: 'Mission completed successfully',
      mission
    });
  } catch (error) {
    console.error('Error completing mission:', error);
    res.status(500).json({ error: error.message || 'Failed to complete mission' });
  }
});

// Get player's missions
router.get('/player/:playerId/missions', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { status } = req.query;
    
    const missions = await missionRepo.getPlayerMissions(playerId, status);
    res.json(missions);
  } catch (error) {
    console.error('Error fetching player missions:', error);
    res.status(500).json({ error: 'Failed to fetch player missions' });
  }
});

// Get mission statistics
router.get('/missions/stats', async (req, res) => {
  try {
    const stats = await missionRepo.getMissionStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching mission stats:', error);
    res.status(500).json({ error: 'Failed to fetch mission statistics' });
  }
});

// Test route
router.get('/debug/routes', (req, res) => {
  res.json({ message: 'Routes are working', timestamp: new Date() });
});

// Generate ship's log for player login  
router.post('/player/:playerId/generate-log', async (req, res) => {
  try {
    const { playerId } = req.params;
    console.log('🚀 Generate log endpoint called for player:', playerId);
    
    const logEntry = await shipLogRepo.generateAbsenceStoryForPlayer(playerId, absenceStories);
    
    if (!logEntry) {
      return res.json({ 
        message: 'No absence story generated (first login or too short absence)',
        logEntry: null 
      });
    }
    
    res.json({
      message: 'Ship\'s log entry generated successfully',
      logEntry
    });
  } catch (error) {
    console.error('Error generating ship\'s log:', error);
    res.status(500).json({ error: error.message || 'Failed to generate ship\'s log' });
  }
});

// Get player's ship logs
router.get('/player/:playerId/logs', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { limit = 10 } = req.query;
    
    const logs = await shipLogRepo.findByPlayerId(playerId, parseInt(limit));
    res.json(logs);
  } catch (error) {
    console.error('Error fetching ship logs:', error);
    res.status(500).json({ error: 'Failed to fetch ship logs' });
  }
});

// Get ship's logs by ship ID
router.get('/ship/:shipId/logs', async (req, res) => {
  try {
    const { shipId } = req.params;
    const { limit = 10 } = req.query;
    
    const logs = await shipLogRepo.findByShipId(shipId, parseInt(limit));
    res.json(logs);
  } catch (error) {
    console.error('Error fetching ship logs:', error);
    res.status(500).json({ error: 'Failed to fetch ship logs' });
  }
});

// Get specific log entry
router.get('/logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    
    const log = await shipLogRepo.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Error fetching log entry:', error);
    res.status(500).json({ error: 'Failed to fetch log entry' });
  }
});

// Get recent logs across all players
router.get('/logs/recent', async (req, res) => {
  try {
    const { limit = 20, complexity } = req.query;
    
    const logs = await shipLogRepo.findRecent(parseInt(limit), complexity);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
});

// Get ship log statistics
router.get('/logs/stats', async (req, res) => {
  try {
    const stats = await shipLogRepo.getLogStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

// Start training for crew member
router.post('/crew/:crewId/training/start', async (req, res) => {
  try {
    const { crewId } = req.params;
    const { trainingType, customDuration } = req.body;
    
    if (!trainingType) {
      return res.status(400).json({ error: 'Training type required' });
    }
    
    // Check if crew member exists and get their info
    const crewMember = await crewRepo.findById(crewId);
    if (!crewMember) {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    
    // Check if already training
    const existingTraining = await trainingQueueRepo.findActiveByCrewMember(crewId);
    if (existingTraining) {
      return res.status(400).json({ error: 'Crew member is already in training' });
    }
    
    // Start training session
    const session = trainingQueue.startTraining(crewId, trainingType, customDuration);
    
    // Save to database
    const savedSession = await trainingQueueRepo.createTrainingSession({
      crewMemberId: crewId,
      trainingType,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      intensity: session.training.intensity
    });
    
    res.json({
      message: 'Training started successfully',
      session: savedSession,
      trainingInfo: session.training
    });
    
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({ error: error.message || 'Failed to start training' });
  }
});

// Cancel training for crew member
router.post('/crew/:crewId/training/cancel', async (req, res) => {
  try {
    const { crewId } = req.params;
    const { reason = 'Cancelled by captain' } = req.body;
    
    const activeTraining = await trainingQueueRepo.findActiveByCrewMember(crewId);
    if (!activeTraining) {
      return res.status(404).json({ error: 'No active training found for crew member' });
    }
    
    // Cancel in memory
    trainingQueue.cancelTraining(crewId);
    
    // Cancel in database
    const cancelledSession = await trainingQueueRepo.cancelTraining(activeTraining.id, reason);
    
    res.json({
      message: 'Training cancelled successfully',
      session: cancelledSession
    });
    
  } catch (error) {
    console.error('Error cancelling training:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel training' });
  }
});

// Get training status for crew member
router.get('/crew/:crewId/training/status', async (req, res) => {
  try {
    const { crewId } = req.params;
    
    const activeTraining = await trainingQueueRepo.findActiveByCrewMember(crewId);
    
    if (!activeTraining) {
      return res.json({ 
        hasActiveTraining: false,
        training: null,
        corporate_status: "No active training sessions assigned to employee."
      });
    }

    // Add training narrative
    const trainingNarrative = await microNarrative.generateTrainingNarrative({
      crewMember: { name: `Employee-${crewId.substr(0, 8)}` },
      skill: activeTraining.skill_type,
      improvement: activeTraining.progress_made,
      trainingType: activeTraining.training_type
    });
    
    res.json({
      hasActiveTraining: true,
      training: {
        ...activeTraining,
        progress_narrative: trainingNarrative,
        corporate_update: `Training Department: ${trainingNarrative}`,
        status_memo: `Skill development program in progress. Current efficiency: ${Math.round(activeTraining.progress_made * 100)}%`
      }
    });
    
  } catch (error) {
    console.error('Error fetching training status:', error);
    res.status(500).json({ error: 'Failed to fetch training status' });
  }
});

// Get available training options for crew member
router.get('/crew/:crewId/training/available', async (req, res) => {
  try {
    const { crewId } = req.params;
    
    const crewMember = await crewRepo.findById(crewId);
    if (!crewMember) {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    
    const availableTraining = trainingQueue.getAvailableTraining(crewMember);
    
    res.json({
      crewMember: {
        id: crewMember.id,
        name: crewMember.name,
        skills: {
          engineering: crewMember.skill_engineering,
          piloting: crewMember.skill_piloting,
          social: crewMember.skill_social,
          combat: crewMember.skill_combat
        }
      },
      availableTraining
    });
    
  } catch (error) {
    console.error('Error fetching available training:', error);
    res.status(500).json({ error: 'Failed to fetch available training' });
  }
});

// Get training queue for ship
router.get('/ship/:shipId/training', async (req, res) => {
  try {
    const { shipId } = req.params;
    
    const activeTraining = await trainingQueueRepo.findActiveByShip(shipId);
    
    res.json({
      shipId,
      activeTraining,
      totalSessions: activeTraining.length
    });
    
  } catch (error) {
    console.error('Error fetching ship training queue:', error);
    
    // Return empty training data if table doesn't exist yet
    res.json({
      shipId: req.params.shipId,
      activeTraining: [],
      totalSessions: 0
    });
  }
});

// Get training history for crew member
router.get('/crew/:crewId/training/history', async (req, res) => {
  try {
    const { crewId } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await trainingQueueRepo.getTrainingHistory(crewId, parseInt(limit));
    
    res.json(history);
    
  } catch (error) {
    console.error('Error fetching training history:', error);
    res.status(500).json({ error: 'Failed to fetch training history' });
  }
});

// Get training recommendations for crew member
router.get('/crew/:crewId/training/recommendations', async (req, res) => {
  try {
    const { crewId } = req.params;
    
    const recommendations = await trainingQueueRepo.getCrewTrainingRecommendations(crewId);
    
    if (!recommendations) {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    
    res.json(recommendations);
    
  } catch (error) {
    console.error('Error fetching training recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch training recommendations' });
  }
});

// Get training statistics
router.get('/training/stats', async (req, res) => {
  try {
    const { shipId, days = 7 } = req.query;
    
    const stats = await trainingQueueRepo.getTrainingStatistics(shipId, parseInt(days));
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error fetching training statistics:', error);
    
    // Return default stats if table doesn't exist yet
    res.json({
      totalSessions: 0,
      completionRate: 0,
      avgTrainingTime: '0h',
      activeTraining: 0,
      completedToday: 0
    });
  }
});

// Get ship status
router.get('/ship/:shipId/status', async (req, res) => {
  try {
    const { shipId } = req.params;
    const ship = await shipRepo.getShipWithCrew(shipId);
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    // Add narrative enhancements
    const fuelStatus = await microNarrative.generateActionNarrative('fuel_used', { 
      fuel_change: ship.fuel_max - ship.fuel_current 
    });
    
    const systemStatus = await microNarrative.generateActionNarrative('system_check', {});
    
    const enrichedShip = {
      ...ship,
      system_status: systemStatus,
      fuel_narrative: fuelStatus,
      operational_summary: `Vessel ${ship.name}: All systems operating within corporate parameters.`,
      corporate_overview: `Ship status report: ${ship.name} maintains operational readiness per corporate standards.`
    };

    res.json(enrichedShip);
  } catch (error) {
    console.error('Error fetching ship status:', error);
    res.status(500).json({ error: 'Failed to fetch ship status' });
  }
});

// Get player info with license data
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await playerRepo.findById(playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error fetching player data:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Purchase software license upgrade
router.post('/player/:playerId/license/purchase', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { newLicense } = req.body;
    
    if (!newLicense || !['STANDARD', 'PROFESSIONAL'].includes(newLicense)) {
      return res.status(400).json({ 
        error: 'Invalid license type. Must be STANDARD or PROFESSIONAL' 
      });
    }
    
    const result = await playerRepo.purchaseLicense(playerId, newLicense);
    
    res.json({
      message: 'Software license upgraded successfully',
      player: result,
      licenseInfo: {
        newLicense: result.software_license,
        creditsRemaining: result.credits,
        agreementText: `SpaceCorp™ Software License Agreement v${newLicense === 'STANDARD' ? '2.0' : '3.0'} - By purchasing this license, you agree to all terms and conditions including but not limited to: mandatory telemetry reporting, algorithmic performance reviews, and waiver of all rights to software-related grievances.`
      }
    });
  } catch (error) {
    console.error('Error purchasing license:', error);
    
    // Handle specific error cases
    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({ error: error.message });
    }
    if (error.message.includes('Already at maximum')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Invalid upgrade path')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Player not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to process license purchase' });
  }
});

// Get player's license purchase history
router.get('/player/:playerId/license/history', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const history = await query(
      `SELECT * FROM license_purchases 
       WHERE player_id = $1 
       ORDER BY purchased_at DESC`,
      [playerId]
    );
    
    res.json(history.rows);
  } catch (error) {
    console.error('Error fetching license history:', error);
    res.status(500).json({ error: 'Failed to fetch license history' });
  }
});

// Update player credits (for trading/mission rewards)
router.post('/player/:playerId/credits', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { amount, reason } = req.body;
    
    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Amount must be a number' });
    }
    
    const result = await playerRepo.updateCredits(playerId, amount);
    
    if (!result) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({
      message: `Credits ${amount >= 0 ? 'added' : 'deducted'} successfully`,
      player: result,
      transaction: {
        amount,
        reason: reason || 'Unspecified transaction',
        newBalance: result.credits
      }
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

// Generate starting crew for new players
async function generateStartingCrew() {
  const crewNames = [
    'Chen Martinez', 'Alex Rivera', 'Sam Chen', 'Jordan Kim', 'Taylor Singh',
    'Morgan Torres', 'Casey Zhang', 'Riley Johnson', 'Avery Lopez', 'Blake Wu'
  ];
  
  const homeworlds = ['Mars', 'Europa', 'Titan', 'Ceres', 'Luna', 'Earth'];
  const cultures = ['Martian', 'Belter', 'Earther', 'Spacer', 'Corporate', 'Independent'];
  
  // Check if we have enough available crew
  const availableCount = await query('SELECT COUNT(*) FROM crew_members WHERE ship_id IS NULL');
  if (availableCount.rows[0].count < 5) {
    // Generate more crew
    for (let i = 0; i < 8; i++) {
      const name = crewNames[Math.floor(Math.random() * crewNames.length)];
      const homeworld = homeworlds[Math.floor(Math.random() * homeworlds.length)];
      const culture = cultures[Math.floor(Math.random() * cultures.length)];
      
      await crewRepo.create({
        name: `${name} ${Math.floor(Math.random() * 900) + 100}`,
        age: Math.floor(Math.random() * 30) + 25,
        homeworld,
        culture,
        skills: {
          engineering: Math.floor(Math.random() * 40) + 20,
          piloting: Math.floor(Math.random() * 40) + 20,
          social: Math.floor(Math.random() * 40) + 20,
          combat: Math.floor(Math.random() * 40) + 20
        }
      });
    }
  }
}

// Content Generation Endpoints (Development/Admin)
router.post('/generate/resources/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 20;
    const resources = await contentGenerator.generateResources(count);
    
    // Insert into database
    const insertPromises = resources.map(resource => 
      query(
        `INSERT INTO resources (code, name, category, base_price, weight, volume, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [resource.code, resource.name, resource.category, resource.base_price, 
         resource.weight, resource.volume, resource.description]
      )
    );
    
    await Promise.all(insertPromises);
    res.json({ 
      message: `Generated ${resources.length} resources`,
      resources: resources.slice(0, 5) // Show first 5 as preview
    });
  } catch (error) {
    console.error('Error generating resources:', error);
    res.status(500).json({ error: 'Failed to generate resources' });
  }
});

router.post('/generate/crew/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 10;
    const crewMembers = await contentGenerator.generateCrewMembers(count);
    
    res.json({ 
      message: `Generated ${crewMembers.length} crew members`,
      crew: crewMembers.slice(0, 3) // Show first 3 as preview
    });
  } catch (error) {
    console.error('Error generating crew:', error);
    res.status(500).json({ error: 'Failed to generate crew' });
  }
});

router.post('/generate/stations/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 15;
    const stations = await contentGenerator.generateStations(count);
    
    // Insert into database with all the detail fields
    const insertPromises = stations.map(station => 
      query(
        `INSERT INTO stations (name, galaxy, sector, station_type, faction, population, security_level, description, notorious_for, bureaucratic_nightmare, local_regulations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [station.name, station.galaxy, station.sector, station.station_type, 
         station.faction, station.population || 10000, station.security_level || 50,
         station.description, station.notorious_for, station.bureaucratic_nightmare, station.local_regulations]
      )
    );
    
    await Promise.all(insertPromises);
    res.json({ 
      message: `Generated ${stations.length} stations`,
      stations: stations.slice(0, 3) // Show first 3 as preview
    });
  } catch (error) {
    console.error('Error generating stations:', error);
    res.status(500).json({ error: 'Failed to generate stations' });
  }
});

router.post('/generate/missions/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 25;
    const missions = await contentGenerator.generateMissions(count);
    
    // Insert into database
    const insertPromises = missions.map(mission => 
      query(
        `INSERT INTO missions (title, description, mission_type, issuing_faction, reward_credits)
         VALUES ($1, $2, $3, $4, $5)`,
        [mission.title, mission.description, mission.mission_type, 
         mission.issuing_faction, mission.reward_credits]
      )
    );
    
    await Promise.all(insertPromises);
    res.json({ 
      message: `Generated ${missions.length} missions`,
      missions: missions.slice(0, 3) // Show first 3 as preview
    });
  } catch (error) {
    console.error('Error generating missions:', error);
    res.status(500).json({ error: 'Failed to generate missions' });
  }
});

// Generate everything at once (populate world)
router.post('/generate/world', async (req, res) => {
  try {
    const results = {};
    
    // Generate in parallel
    const [resources, stations, missions] = await Promise.allSettled([
      contentGenerator.generateResources(30),
      contentGenerator.generateStations(20), 
      contentGenerator.generateMissions(40)
    ]);
    
    // Process results
    if (resources.status === 'fulfilled') {
      results.resources = resources.value.length;
    }
    if (stations.status === 'fulfilled') {
      results.stations = stations.value.length;
    }
    if (missions.status === 'fulfilled') {
      results.missions = missions.value.length;
    }
    
    res.json({
      message: 'World population complete',
      generated: results
    });
  } catch (error) {
    console.error('Error populating world:', error);
    res.status(500).json({ error: 'Failed to populate world' });
  }
});

// Dialog Generation with Story DNA
router.post('/dialog/generate', async (req, res) => {
  try {
    const { actionType, playerState } = req.body;
    
    if (!actionType || !playerState) {
      return res.status(400).json({ 
        error: 'Missing required fields: actionType and playerState' 
      });
    }
    
    console.log(`Generating dialog for ${actionType} action with state:`, playerState);
    
    // ANALYZE PLAYER ACTIONS FOR MARKET INTEL
    if (playerState.previous_choices) {
      const newIntel = marketIntelligence.analyzePlayerActions(
        playerState.previous_choices, 
        { currentTick: Math.floor(Date.now() / 30000) } // 30-second ticks
      );
      
      if (newIntel.length > 0) {
        console.log(`🕵️  Discovered ${newIntel.length} pieces of market intel from player actions`);
      }
    }
    
    const dialog = await dialogGenerator.generateDialog(actionType, playerState);
    
    res.json(dialog);
  } catch (error) {
    console.error('Error generating dialog:', error);
    res.status(500).json({ 
      error: `LLM UNAVAILABLE: ${error.message}`,
      message: 'Start your local LLM server (LM Studio) on port 1234 to generate dynamic content'
    });
  }
});

// Execute player choice and process ALL cascading consequences
router.post('/choice/execute', async (req, res) => {
  try {
    const { playerId, choice, context, gameState } = req.body;
    
    if (!playerId || !choice) {
      return res.status(400).json({
        error: 'Missing required fields: playerId and choice'
      });
    }
    
    console.log(`🎭 Executing choice: ${choice.id} for player ${playerId}`);
    
    // Get current game state context
    const enrichedGameState = {
      ...gameState,
      politicalRegime: politicalHierarchy.regime,
      currentTick: Math.floor(Date.now() / 30000),
      marketSnapshot: dollhouseMarket.getMarketSnapshot()
    };
    
    // Process ALL consequences through the Story Consequence Engine
    const fullConsequences = storyConsequenceEngine.processPlayerChoice(
      playerId, 
      choice, 
      context || {}, 
      enrichedGameState
    );
    
    // APPLY IMMEDIATE EFFECTS
    const immediateResults = {
      fuel: 0,
      credits: 0,
      heat: 0,
      narrative: choice.consequences?.narrative || 'Action completed.'
    };
    
    // Apply resource changes
    if (choice.consequences?.fuel) {
      const fuelChange = parseInt(choice.consequences.fuel.replace(/\+/, ''));
      immediateResults.fuel = fuelChange;
    }
    if (choice.consequences?.credits) {
      const creditsMatch = choice.consequences.credits.match(/([+-]?\d+)/);
      if (creditsMatch) {
        immediateResults.credits = parseInt(creditsMatch[1]);
      }
    }
    if (choice.consequences?.heat) {
      const heatChange = parseInt(choice.consequences.heat.replace(/\+/, ''));
      immediateResults.heat = heatChange;
    }
    
    // APPLY POLITICAL EFFECTS
    const politicalEffects = [];
    if (choice.consequences?.political_effect) {
      try {
        const politicalResult = politicalHierarchy.influencePolitician(
          playerId, 
          choice.consequences.political_effect.politician,
          choice.id.includes('bribe') ? 'bribe' : choice.id.includes('blackmail') ? 'blackmail' : 'information_trade',
          Math.abs(immediateResults.credits) || 1000
        );
        politicalEffects.push(politicalResult);
      } catch (error) {
        console.log(`⚠️  Political effect failed: ${error.message}`);
      }
    }
    
    // APPLY MARKET EFFECTS
    const marketEffects = [];
    fullConsequences.cascading.forEach(effect => {
      if (effect.type === 'intelligence_value' && effect.system === 'market') {
        // Apply market intelligence discovery
        const intelEvent = {
          id: `player_${Date.now()}`,
          resourceId: effect.market_sector,
          type: 'player_discovery',
          impact: effect.intelligence_quality,
          description: effect.description,
          triggerTick: enrichedGameState.currentTick + 1
        };
        marketEffects.push(intelEvent);
      }
    });
    
    // APPLY CREW EFFECTS (placeholder for when crew system is enhanced)
    const crewEffects = fullConsequences.cascading.filter(effect => effect.system === 'crew');
    
    // Get updated reputation
    const currentReputation = storyConsequenceEngine.getPlayerReputation(playerId);
    
    // Get active modifiers for future choices
    const activeModifiers = storyConsequenceEngine.getActiveModifiers(playerId, enrichedGameState.currentTick);
    
    res.json({
      success: true,
      immediate_effects: immediateResults,
      political_effects: politicalEffects,
      market_effects: marketEffects,
      crew_effects: crewEffects,
      reputation: currentReputation,
      active_modifiers: activeModifiers,
      narrative_consequences: fullConsequences.narrative_memory,
      cascading_effects: fullConsequences.cascading.length,
      message: `Choice executed with ${fullConsequences.cascading.length} cascading effects across all systems`
    });
    
  } catch (error) {
    console.error('Error executing choice:', error);
    res.status(500).json({
      error: 'Failed to execute choice',
      details: error.message
    });
  }
});

// Get player's consequence history and reputation
router.get('/player/:playerId/consequences', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { limit = 20 } = req.query;
    
    const history = storyConsequenceEngine.getPlayerConsequenceHistory(playerId);
    const reputation = storyConsequenceEngine.getPlayerReputation(playerId);
    const activeModifiers = storyConsequenceEngine.getActiveModifiers(
      playerId, 
      Math.floor(Date.now() / 30000)
    );
    
    res.json({
      consequence_history: history.slice(-limit),
      reputation: reputation,
      active_modifiers: activeModifiers,
      total_choices: history.length
    });
    
  } catch (error) {
    console.error('Error fetching player consequences:', error);
    res.status(500).json({ error: 'Failed to fetch consequence data' });
  }
});

// DOLLHOUSE MARKET ENDPOINTS

// Get current market snapshot
router.get('/market/dollhouse', async (req, res) => {
  try {
    const snapshot = dollhouseMarket.getMarketSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching market snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Execute market trade
router.post('/market/trade', async (req, res) => {
  try {
    const { resourceId, side, volume, playerId, stationId } = req.body;
    
    if (!resourceId || !side || !volume || !playerId || !stationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: resourceId, side, volume, playerId, stationId' 
      });
    }
    
    const result = await marketRepo.executeTrade(stationId, resourceId, side, volume, playerId);
    
    res.json({
      message: 'Trade executed successfully',
      trade: result
    });
  } catch (error) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: error.message || 'Failed to execute trade' });
  }
});

// Get player's discovered intel
router.get('/market/intel/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const intel = marketIntelligence.getPlayerIntel(playerId);
    
    res.json({
      intel,
      totalIntel: intel.length,
      activeIntel: intel.filter(i => !i.triggered).length
    });
  } catch (error) {
    console.error('Error fetching player intel:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

// Get market predictions (INSIDER TRADING GOLD)
router.get('/market/predictions', async (req, res) => {
  try {
    const { lookahead = 5 } = req.query;
    const currentTick = Math.floor(Date.now() / 30000);
    
    const predictions = marketIntelligence.getMarketPredictions(currentTick, parseInt(lookahead));
    
    res.json({
      currentTick,
      predictions,
      message: predictions.length > 0 ? 'Market predictions available' : 'No upcoming market events predicted'
    });
  } catch (error) {
    console.error('Error fetching market predictions:', error);
    res.status(500).json({ error: 'Failed to fetch market predictions' });
  }
});

// Force market intelligence discovery (for testing)
router.post('/market/intel/discover', async (req, res) => {
  try {
    const { actionType, playerId } = req.body;
    const currentTick = Math.floor(Date.now() / 30000);
    
    const intel = marketIntelligence.generateIntelFromAction(
      actionType, 
      { currentTick, playerId }
    );
    
    if (intel) {
      marketIntelligence.playerIntel.set(intel.id, intel);
      res.json({
        message: 'Market intelligence discovered',
        intel
      });
    } else {
      res.json({
        message: 'No intelligence discovered from this action'
      });
    }
  } catch (error) {
    console.error('Error discovering intel:', error);
    res.status(500).json({ error: 'Failed to discover intelligence' });
  }
});

// Process market tick (called by tick engine)
router.post('/market/tick', async (req, res) => {
  try {
    const { currentTick } = req.body;
    
    const triggeredEvents = marketIntelligence.processTick(currentTick, dollhouseMarket);
    
    res.json({
      message: 'Market tick processed',
      triggeredEvents,
      marketSnapshot: dollhouseMarket.getMarketSnapshot()
    });
  } catch (error) {
    console.error('Error processing market tick:', error);
    res.status(500).json({ error: 'Failed to process market tick' });
  }
});

// POLITICAL SYSTEM ENDPOINTS

// Get all politicians in the current world
router.get('/politics/hierarchy', async (req, res) => {
  try {
    const politicians = politicalHierarchy.getAllPoliticians();
    
    // Return public info only (no weaknesses unless discovered)
    const publicInfo = politicians.map(p => ({
      id: p.id,
      name: p.name,
      title: p.title,
      power: p.power,
      marketInfluence: p.marketInfluence,
      background: p.background,
      currentAgenda: p.currentAgenda
    }));
    
    res.json({
      politicians: publicInfo,
      worldSeed: 'current' // TODO: Add actual world seed
    });
  } catch (error) {
    console.error('Error fetching political hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch political hierarchy' });
  }
});

// Get player's relationship with politicians
router.get('/politics/relationships/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const politicians = politicalHierarchy.getAllPoliticians();
    
    const relationships = politicians.map(politician => {
      const relationship = politicalHierarchy.getRelationship(playerId, politician.id);
      return {
        politicianId: politician.id,
        name: politician.name,
        title: politician.title,
        relationshipScore: relationship.score,
        knownWeaknesses: relationship.knownWeaknesses,
        lastInteraction: relationship.lastInteraction,
        history: relationship.history
      };
    });
    
    res.json({ relationships });
  } catch (error) {
    console.error('Error fetching political relationships:', error);
    res.status(500).json({ error: 'Failed to fetch political relationships' });
  }
});

// Discover politician through espionage
router.post('/politics/discover', async (req, res) => {
  try {
    const { playerId, actionType } = req.body;
    
    if (!playerId || !actionType) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerId, actionType' 
      });
    }
    
    // Random chance to discover a politician
    const politicians = ['governor', 'trade_commissioner', 'safety_director', 'military_liaison'];
    const targetPolitician = politicians[Math.floor(Math.random() * politicians.length)];
    
    const discovery = politicalHierarchy.discoverPolitician(playerId, targetPolitician, actionType);
    
    if (discovery) {
      console.log(`🏛️  Player ${playerId} discovered politician via ${actionType}`);
      res.json({
        message: 'Political intelligence discovered',
        discovery
      });
    } else {
      res.json({
        message: 'No political intelligence discovered'
      });
    }
  } catch (error) {
    console.error('Error discovering politician:', error);
    res.status(500).json({ error: 'Failed to discover politician' });
  }
});

// Attempt to influence a politician
router.post('/politics/influence', async (req, res) => {
  try {
    const { playerId, politicianId, method, amount } = req.body;
    
    if (!playerId || !politicianId || !method) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerId, politicianId, method' 
      });
    }
    
    const result = politicalHierarchy.influencePolitician(playerId, politicianId, method, amount);
    
    console.log(`🏛️  Political influence attempt: ${method} on ${politicianId} by ${playerId}`);
    
    res.json({
      message: 'Political influence attempt completed',
      result,
      newRelationship: politicalHierarchy.getRelationship(playerId, politicianId)
    });
  } catch (error) {
    console.error('Error influencing politician:', error);
    res.status(500).json({ error: error.message || 'Failed to influence politician' });
  }
});

// Trigger political market event (for testing or as consequence of high relationships)
router.post('/politics/market-event', async (req, res) => {
  try {
    const { politicianId, eventType, targetResource, playerId } = req.body;
    
    // Check if player has sufficient relationship
    const relationship = politicalHierarchy.getRelationship(playerId, politicianId);
    if (relationship.score < 50) {
      return res.status(403).json({ 
        error: 'Insufficient political relationship for market manipulation' 
      });
    }
    
    const politicalEvent = politicalHierarchy.triggerPoliticalMarketEvent(
      politicianId, 
      eventType, 
      targetResource
    );
    
    if (politicalEvent.success === false) {
      return res.status(400).json({ 
        error: politicalEvent.reason 
      });
    }
    
    // Apply the market effect
    const marketEffect = dollhouseMarket.applyInsiderTrading(
      targetResource,
      eventType,
      'high' // Political events are high impact
    );
    
    // Reduce relationship after using political favor
    politicalHierarchy.updateRelationship(
      playerId, 
      politicianId, 
      -15, 
      'political_favor_used'
    );
    
    console.log(`🏛️  Political market event triggered: ${eventType} on ${targetResource}`);
    
    res.json({
      message: 'Political market event triggered',
      politicalEvent,
      marketEffect,
      newRelationship: politicalHierarchy.getRelationship(playerId, politicianId)
    });
  } catch (error) {
    console.error('Error triggering political market event:', error);
    res.status(500).json({ error: 'Failed to trigger political market event' });
  }
});

// ==========================================
// GOD MODE / ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Get comprehensive world overview
router.get('/god-mode/world-overview', async (req, res) => {
  try {
    const [
      playersResult,
      shipsResult,
      crewResult,
      stationsResult,
      missionsResult,
      marketResult,
      trainingResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM players'),
      query('SELECT COUNT(*) as count FROM ships'),
      query('SELECT COUNT(*) as count FROM crew_members WHERE died_at IS NULL'),
      query('SELECT COUNT(*) as count FROM stations'),
      query('SELECT COUNT(*) as count, status FROM missions GROUP BY status'),
      query('SELECT COUNT(*) as count FROM market_data'),
      query('SELECT COUNT(*) as count FROM training_queue WHERE completed_at IS NULL')
    ]);

    res.json({
      summary: {
        totalPlayers: parseInt(playersResult.rows[0].count),
        totalShips: parseInt(shipsResult.rows[0].count),
        livingCrewMembers: parseInt(crewResult.rows[0].count),
        totalStations: parseInt(stationsResult.rows[0].count),
        marketItems: parseInt(marketResult.rows[0].count),
        activeTraining: parseInt(trainingResult.rows[0].count)
      },
      missionsByStatus: missionsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching world overview:', error);
    res.status(500).json({ error: 'Failed to fetch world overview' });
  }
});

// Get all players with detailed info
router.get('/god-mode/players', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        s.name as ship_name,
        s.hull_type,
        s.status as ship_status,
        (SELECT COUNT(*) FROM crew_members WHERE ship_id = s.id AND died_at IS NULL) as crew_count,
        (SELECT COUNT(*) FROM missions WHERE accepted_by = p.id AND status = 'accepted') as active_missions
      FROM players p
      LEFT JOIN ships s ON s.player_id = p.id AND s.status = 'active'
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get all ships with crew and mission info
router.get('/god-mode/ships', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.*,
        p.username as player_name,
        p.email as player_email
      FROM ships s
      LEFT JOIN players p ON s.player_id = p.id
      ORDER BY s.created_at DESC
    `);

    // Add counts separately to avoid subquery issues
    for (let ship of result.rows) {
      try {
        const crewCount = await query('SELECT COUNT(*) FROM crew_members WHERE ship_id = $1 AND died_at IS NULL', [ship.id]);
        ship.crew_count = parseInt(crewCount.rows[0].count) || 0;
        
        const missionCount = await query('SELECT COUNT(*) FROM missions WHERE ship_id = $1 AND status = $2', [ship.id, 'accepted']);
        ship.active_missions = parseInt(missionCount.rows[0].count) || 0;
        
        const trainingCount = await query('SELECT COUNT(*) FROM training_queue WHERE crew_member_id IN (SELECT id FROM crew_members WHERE ship_id = $1) AND completed_at IS NULL', [ship.id]);
        ship.active_training = parseInt(trainingCount.rows[0].count) || 0;
      } catch (countError) {
        console.warn('Error fetching counts for ship:', ship.id, countError.message);
        ship.crew_count = 0;
        ship.active_missions = 0;
        ship.active_training = 0;
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ships:', error);
    res.status(500).json({ error: 'Failed to fetch ships' });
  }
});

// Get all crew members with ship and player info
router.get('/god-mode/crew', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        cm.*,
        s.name as ship_name,
        p.username as player_name,
        (SELECT COUNT(*) FROM training_queue WHERE crew_member_id = cm.id AND completed_at IS NULL) as active_training,
        (SELECT COUNT(*) FROM crew_memories WHERE crew_member_id = cm.id) as memory_count
      FROM crew_members cm
      LEFT JOIN ships s ON cm.ship_id = s.id
      LEFT JOIN players p ON s.player_id = p.id
      ORDER BY cm.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching crew members:', error);
    res.status(500).json({ error: 'Failed to fetch crew members' });
  }
});

// Get all stations with market and mission activity
router.get('/god-mode/stations', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM stations ORDER BY name
    `);

    // Add counts separately to avoid subquery issues
    for (let station of result.rows) {
      try {
        const marketCount = await query('SELECT COUNT(*) FROM market_data WHERE station_id = $1', [station.id]);
        station.market_items = parseInt(marketCount.rows[0].count) || 0;
        
        const totalMissions = await query('SELECT COUNT(*) FROM missions WHERE station_id = $1', [station.id]);
        station.total_missions = parseInt(totalMissions.rows[0].count) || 0;
        
        const availableMissions = await query('SELECT COUNT(*) FROM missions WHERE station_id = $1 AND status = $2', [station.id, 'available']);
        station.available_missions = parseInt(availableMissions.rows[0].count) || 0;
      } catch (countError) {
        console.warn('Error fetching counts for station:', station.id, countError.message);
        station.market_items = 0;
        station.total_missions = 0;
        station.available_missions = 0;
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// Get comprehensive mission data
router.get('/god-mode/missions', async (req, res) => {
  try {
    // First get missions without complex joins to avoid parsing errors
    const result = await query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.type,
        m.difficulty,
        m.status,
        m.deadline_hours,
        m.created_at,
        m.expires_at,
        m.station_id,
        m.accepted_by,
        m.ship_id
      FROM missions m
      ORDER BY m.created_at DESC
      LIMIT 100
    `);

    // Add related data separately to avoid join issues
    for (let mission of result.rows) {
      try {
        // Get station name
        if (mission.station_id) {
          const stationResult = await query('SELECT name FROM stations WHERE id = $1', [mission.station_id]);
          mission.station_name = stationResult.rows[0]?.name || null;
        } else {
          mission.station_name = null;
        }

        // Get player name
        if (mission.accepted_by) {
          const playerResult = await query('SELECT username FROM players WHERE id = $1', [mission.accepted_by]);
          mission.accepted_by_player = playerResult.rows[0]?.username || null;
        } else {
          mission.accepted_by_player = null;
        }

        // Get ship name
        if (mission.ship_id) {
          const shipResult = await query('SELECT name FROM ships WHERE id = $1', [mission.ship_id]);
          mission.ship_name = shipResult.rows[0]?.name || null;
        } else {
          mission.ship_name = null;
        }

        // Add rewards formatting (basic object, no parsing needed)
        mission.rewards = { credits: 0, reputation: 0 }; // Default safe value
      } catch (relatedError) {
        console.warn('Error fetching related data for mission:', mission.id, relatedError.message);
        mission.station_name = null;
        mission.accepted_by_player = null;
        mission.ship_name = null;
        mission.rewards = { credits: 0, reputation: 0 };
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// Get market overview with pricing trends
router.get('/god-mode/market', async (req, res) => {
  try {
    // Get market data with resources first
    const result = await query(`
      SELECT 
        md.*,
        r.name as resource_name,
        r.category as resource_category,
        r.base_price
      FROM market_data md
      JOIN resources r ON md.resource_id = r.id
      ORDER BY md.last_updated DESC
      LIMIT 200
    `);

    // Add station info separately since station_id is varchar not uuid
    for (let item of result.rows) {
      try {
        const stationResult = await query('SELECT name, galaxy, sector FROM stations WHERE name = $1', [item.station_id]);
        if (stationResult.rows.length > 0) {
          item.station_name = stationResult.rows[0].name;
          item.galaxy = stationResult.rows[0].galaxy;
          item.sector = stationResult.rows[0].sector;
        } else {
          item.station_name = item.station_id; // Use station_id as fallback
          item.galaxy = 'Unknown';
          item.sector = 'Unknown';
        }
      } catch (stationError) {
        console.warn('Error fetching station for market item:', item.id, stationError.message);
        item.station_name = item.station_id;
        item.galaxy = 'Unknown';
        item.sector = 'Unknown';
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get training queue overview
router.get('/god-mode/training', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        tq.*,
        cm.name as crew_name,
        s.name as ship_name,
        p.username as player_name
      FROM training_queue tq
      JOIN crew_members cm ON tq.crew_member_id = cm.id
      LEFT JOIN ships s ON cm.ship_id = s.id
      LEFT JOIN players p ON s.player_id = p.id
      ORDER BY tq.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({ error: 'Failed to fetch training data' });
  }
});


// Get system resources and performance
router.get('/god-mode/system-status', async (req, res) => {
  try {
    // Simple database stats that should work on all PostgreSQL versions
    const databaseStats = await query(`
      SELECT 
        'public' as schemaname,
        tablename,
        0 as inserts,
        0 as updates,
        0 as deletes,
        0 as live_rows
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    res.json({
      databaseStats: databaseStats.rows,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    // Fallback response if database query fails
    res.json({
      databaseStats: [],
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      error: 'Database stats unavailable'
    });
  }
});

export default router;