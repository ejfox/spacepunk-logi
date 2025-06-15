import express from 'express';
import crypto from 'crypto';
import { PlayerRepository } from '../repositories/PlayerRepository.js';
import { ShipRepository } from '../repositories/ShipRepository.js';
import { CrewRepository } from '../repositories/CrewRepository.js';
import { query } from '../db/index.js';
import TraitService from '../services/TraitService.js';

const router = express.Router();
const playerRepo = new PlayerRepository();
const shipRepo = new ShipRepository();
const crewRepo = new CrewRepository();
const traitService = new TraitService();

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
    const resources = await query('SELECT * FROM resources ORDER BY category, name LIMIT 20');
    
    // Add basic pricing (in real game, this would come from market_data table)
    const resourcesWithPricing = resources.rows.map(resource => ({
      ...resource,
      current_price: Math.round(resource.base_price * (0.8 + Math.random() * 0.4))
    }));
    
    res.json(resourcesWithPricing);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
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

// Trait system endpoints
router.get('/traits/definitions', async (req, res) => {
  try {
    const { level, category } = req.query;
    const filters = {};
    if (level) filters.level = parseInt(level);
    if (category) filters.category = category;
    
    const traits = await traitService.getTraitDefinitions(filters);
    res.json(traits);
  } catch (error) {
    console.error('Error fetching trait definitions:', error);
    res.status(500).json({ error: 'Failed to fetch trait definitions' });
  }
});

router.get('/crew/:crewId/traits', async (req, res) => {
  try {
    const { crewId } = req.params;
    const traits = await traitService.getEntityTraits(crewId);
    res.json(traits);
  } catch (error) {
    console.error('Error fetching crew traits:', error);
    res.status(500).json({ error: 'Failed to fetch crew traits' });
  }
});

router.post('/crew/:crewId/traits', async (req, res) => {
  try {
    const { crewId } = req.params;
    const { traitDefinitionId, method = 'manual' } = req.body;
    
    if (!traitDefinitionId) {
      return res.status(400).json({ error: 'Trait definition ID required' });
    }
    
    const assigned = await traitService.assignTrait(crewId, traitDefinitionId, method);
    res.json({ success: true, trait: assigned });
  } catch (error) {
    console.error('Error assigning trait:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/crew/:crewId/trait-modifiers', async (req, res) => {
  try {
    const { crewId } = req.params;
    const modifiers = await traitService.calculateTraitModifiers(crewId);
    res.json(modifiers);
  } catch (error) {
    console.error('Error calculating trait modifiers:', error);
    res.status(500).json({ error: 'Failed to calculate trait modifiers' });
  }
});

router.post('/traits/assign-to-existing', async (req, res) => {
  try {
    const assigned = await traitService.assignTraitsToExistingCrew();
    res.json({ success: true, crewAssigned: assigned });
  } catch (error) {
    console.error('Error assigning traits to existing crew:', error);
    res.status(500).json({ error: 'Failed to assign traits to existing crew' });
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
      
      const newCrew = await crewRepo.create({
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

      // Assign random traits to new crew member
      if (newCrew && newCrew.id) {
        await traitService.assignRandomTraits(newCrew.id, 2);
      }
    }
  }
}

export default router;