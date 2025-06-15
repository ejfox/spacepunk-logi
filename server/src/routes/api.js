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
import TrainingQueue from '../training/TrainingQueue.js';
import { query } from '../db/index.js';

const router = express.Router();
const playerRepo = new PlayerRepository();
const shipRepo = new ShipRepository();
const crewRepo = new CrewRepository();
const marketRepo = new MarketRepository();
const missionRepo = new MissionRepository();
const shipLogRepo = new ShipLogRepository();
const trainingQueueRepo = new TrainingQueueRepository();
const absenceStories = new AbsenceStories();
const trainingQueue = new TrainingQueue();

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

// Generate ship's log for player login
router.post('/player/:playerId/generate-log', async (req, res) => {
  try {
    const { playerId } = req.params;
    
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
        training: null 
      });
    }
    
    res.json({
      hasActiveTraining: true,
      training: activeTraining
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
    res.status(500).json({ error: 'Failed to fetch training queue' });
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
    res.status(500).json({ error: 'Failed to fetch training statistics' });
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