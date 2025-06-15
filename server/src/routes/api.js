import express from 'express';
import crypto from 'crypto';
import { PlayerRepository } from '../repositories/PlayerRepository.js';
import { ShipRepository } from '../repositories/ShipRepository.js';
import { CrewRepository } from '../repositories/CrewRepository.js';
import { MarketRepository } from '../repositories/MarketRepository.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import { query } from '../db/index.js';

const router = express.Router();
const playerRepo = new PlayerRepository();
const shipRepo = new ShipRepository();
const crewRepo = new CrewRepository();
const marketRepo = new MarketRepository();
const missionRepo = new MissionRepository();

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

// Get available crew for hiring
router.get('/crew/available', async (req, res) => {
  try {
    const availableCrew = await crewRepo.findAvailableForHire(10);
    res.json(availableCrew);
  } catch (error) {
    console.error('Error fetching available crew:', error);
    res.status(500).json({ error: 'Failed to fetch crew data' });
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

// Get market data (resources)
router.get('/market/data', async (req, res) => {
  try {
    const { stationId = 'earth-station-alpha' } = req.query;
    
    // Get market data for this station
    const marketData = await marketRepo.findByStation(stationId);
    
    if (marketData.length === 0) {
      // No market data yet, return resources with base prices
      const resources = await query('SELECT * FROM resources ORDER BY category, name');
      const resourcesWithPricing = resources.rows.map(resource => ({
        ...resource,
        current_price: resource.base_price,
        supply: 500,
        demand: 500,
        price_trend: 0
      }));
      res.json(resourcesWithPricing);
    } else {
      res.json(marketData);
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

// Get ship status
router.get('/ship/:shipId/status', async (req, res) => {
  try {
    const { shipId } = req.params;
    const ship = await shipRepo.getShipWithCrew(shipId);
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }
    res.json(ship);
  } catch (error) {
    console.error('Error fetching ship status:', error);
    res.status(500).json({ error: 'Failed to fetch ship status' });
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

export default router;