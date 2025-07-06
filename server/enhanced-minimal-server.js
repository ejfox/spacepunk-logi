// Enhanced minimal server with WebSocket and basic API endpoints
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const PORT = 3666;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Game state
let currentTick = 1;
const tickInterval = 30000; // 30 seconds

// In-memory storage for active ships and players
const activeShips = new Map(); // shipId -> ship data
const playerData = new Map(); // playerId -> player data

// Resource decay constants
const FUEL_DECAY_PER_TICK = 1;
const CREW_SALARY_PER_MEMBER = 10;
const LOW_FUEL_THRESHOLD = 20;
const BANKRUPTCY_THRESHOLD = 100;

// Connected clients
const clients = new Set();

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  clients.add(ws);
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection:established',
    data: {
      clientId: Math.random().toString(36).substr(2, 9),
      currentTick,
      tickInterval
    }
  }));
  
  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all clients
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  });
}

// Resource decay functions
function processResourceDecay() {
  const warnings = [];
  
  // Process each active ship
  activeShips.forEach((ship, shipId) => {
    const playerId = ship.player_id;
    let player = playerData.get(playerId);
    
    if (!player) {
      player = { credits: 1000, id: playerId }; // Default player data
      playerData.set(playerId, player);
    }
    
    // Calculate crew count (for now, use a simple crew count)
    const crewCount = ship.crew_count || 0;
    
    // Apply fuel decay
    const oldFuel = ship.fuel_current;
    ship.fuel_current = Math.max(0, ship.fuel_current - FUEL_DECAY_PER_TICK);
    
    // Apply crew salary costs
    const salaryCost = crewCount * CREW_SALARY_PER_MEMBER;
    const oldCredits = player.credits;
    player.credits = Math.max(0, player.credits - salaryCost);
    
    // Check for warnings
    if (ship.fuel_current < LOW_FUEL_THRESHOLD && oldFuel >= LOW_FUEL_THRESHOLD) {
      warnings.push({
        type: 'low_fuel',
        shipId: shipId,
        playerId: playerId,
        fuel: ship.fuel_current,
        message: `⚠️ LOW FUEL WARNING: ${ship.name} has only ${ship.fuel_current} fuel remaining!`
      });
    }
    
    if (player.credits < BANKRUPTCY_THRESHOLD && oldCredits >= BANKRUPTCY_THRESHOLD) {
      warnings.push({
        type: 'bankruptcy_risk',
        shipId: shipId,
        playerId: playerId,
        credits: player.credits,
        message: `💰 BANKRUPTCY WARNING: Captain has only ${player.credits} credits remaining!`
      });
    }
    
    // Store updated data
    activeShips.set(shipId, ship);
    playerData.set(playerId, player);
  });
  
  return warnings;
}

// Tick system
setInterval(() => {
  currentTick++;
  
  // Process resource decay
  const warnings = processResourceDecay();
  
  // Broadcast tick update with resource changes
  broadcast({
    type: 'tick:update',
    data: { 
      tick: currentTick,
      resourceUpdates: Array.from(activeShips.entries()).map(([shipId, ship]) => ({
        shipId,
        playerId: ship.player_id,
        fuel: ship.fuel_current,
        credits: playerData.get(ship.player_id)?.credits || 0
      })),
      warnings: warnings
    }
  });
  
  // Log warnings to console
  warnings.forEach(warning => {
    console.log(`⚠️  ${warning.message}`);
  });
  
  console.log(`🕐 Tick ${currentTick} - ${activeShips.size} active ships processed`);
}, tickInterval);

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Enhanced minimal server working', 
    timestamp: new Date().toISOString(),
    currentTick,
    features: ['WebSocket', 'Basic API', 'Streaming Dialog']
  });
});

// Player creation (minimal)
app.post('/api/player', (req, res) => {
  const playerId = Math.random().toString(36).substr(2, 9);
  const player = {
    id: playerId,
    username: req.body.username || `CAPTAIN-${playerId.toUpperCase()}`,
    deaths: 0,
    credits: 1000,
    reputation: {
      corporate: 0,
      pirate: 0,
      independent: 0
    },
    stats: {
      total_jumps: 0,
      total_trades: 0,
      total_missions: 0
    },
    created_at: new Date().toISOString()
  };
  
  // Store in player data for resource decay processing
  playerData.set(playerId, player);
  
  console.log('👤 Created player:', player);
  res.json({ player, success: true });
});

// Ship creation (minimal)
app.post('/api/ship', (req, res) => {
  const shipId = Math.random().toString(36).substr(2, 9);
  const ship = {
    id: shipId,
    player_id: req.body.player_id,
    name: `VESSEL-${shipId.toUpperCase()}`,
    hull_type: 'STANDARD_CARGO',
    location_station: 'ALPHA_STATION',
    location_galaxy: 'CORE_SECTOR',
    fuel_current: 100,
    fuel_max: 100,
    cargo_used: 0,
    cargo_max: 100,
    crew_count: 0,
    status: 'docked',
    created_at: new Date().toISOString()
  };
  
  // Store in active ships for resource decay processing
  activeShips.set(shipId, ship);
  
  console.log('🚀 Created ship:', ship);
  res.json({ ship, success: true });
});

// Player data
app.get('/api/player/:playerId', (req, res) => {
  const playerId = req.params.playerId;
  let player = playerData.get(playerId);
  
  if (!player) {
    player = { 
      id: playerId,
      credits: 1000,
      reputation: {
        corporate: 0,
        pirate: 0,
        independent: 0
      },
      stats: {
        total_jumps: 0,
        total_trades: 0,
        total_missions: 0
      }
    };
    playerData.set(playerId, player);
  }
  
  res.json(player);
});

// Ship data endpoint
app.get('/api/ship/:shipId', (req, res) => {
  const shipId = req.params.shipId;
  const ship = activeShips.get(shipId);
  
  if (!ship) {
    return res.status(404).json({ error: 'Ship not found' });
  }
  
  res.json(ship);
});

// Crew endpoint (empty for now)
app.get('/api/crew/available', (req, res) => {
  res.json([]);
});

app.get('/api/ship/:shipId/crew', (req, res) => {
  const shipId = req.params.shipId;
  const ship = activeShips.get(shipId);
  
  if (!ship) {
    return res.status(404).json({ error: 'Ship not found' });
  }
  
  res.json({
    crew_count: ship.crew_count || 0,
    crew_members: []
  });
});

// Add crew member (simulated)
app.post('/api/ship/:shipId/crew', (req, res) => {
  const shipId = req.params.shipId;
  const ship = activeShips.get(shipId);
  
  if (!ship) {
    return res.status(404).json({ error: 'Ship not found' });
  }
  
  ship.crew_count = (ship.crew_count || 0) + 1;
  activeShips.set(shipId, ship);
  
  console.log(`👥 Added crew member to ship ${shipId}, total crew: ${ship.crew_count}`);
  res.json({ success: true, crew_count: ship.crew_count });
});

// Missions endpoint
app.get('/api/missions/available', (req, res) => {
  res.json([{
    id: 'test-mission-1',
    mission_type: 'cargo_delivery',
    title: 'TEST: Deliver Medical Supplies',
    description: 'A simple test mission for the minimal server',
    difficulty_level: 1,
    reward_credits: 500,
    requirements: { fuel: 20 },
    risk_level: 'low',
    corporate_sponsor: 'TEST_CORP',
    target_location: 'BETA_STATION',
    expires_at: new Date(Date.now() + 86400000).toISOString()
  }]);
});

// Training endpoint
app.get('/api/training/stats', (req, res) => {
  res.json({
    ship_id: req.query.ship_id,
    total_active: 0,
    total_completed: 0,
    total_xp_gained: 0
  });
});

// Faction reputation endpoint
app.post('/api/player/:playerId/reputation', (req, res) => {
  const playerId = req.params.playerId;
  const { reputationChanges } = req.body;
  
  let player = playerData.get(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Apply reputation changes
  if (reputationChanges) {
    Object.keys(reputationChanges).forEach(faction => {
      const change = reputationChanges[faction];
      if (typeof change === 'number') {
        player.reputation[faction] = Math.max(-100, Math.min(100, (player.reputation[faction] || 0) + change));
      }
    });
  }
  
  playerData.set(playerId, player);
  
  console.log(`📊 Reputation updated for ${playerId}:`, player.reputation);
  res.json({ reputation: player.reputation, success: true });
});

// Enhanced dialog generation with faction reputation consideration
function generateFactionSpecificChoices(playerReputation) {
  const corporateRep = playerReputation.corporate || 0;
  const pirateRep = playerReputation.pirate || 0;
  const independentRep = playerReputation.independent || 0;
  
  const choices = [];
  
  // Base choices always available
  choices.push({
    id: 'basic_trade',
    text: 'Accept basic courier contract',
    risk: 'low',
    faction: 'neutral',
    consequences: { 
      fuel: -5, 
      credits: 150, 
      heat: 0,
      reputation: { corporate: 2, pirate: 0, independent: 1 },
      narrative: 'A simple delivery job. Nothing fancy, but it pays the bills.'
    }
  });
  
  // Corporate-specific choices (unlocked at 50+ corporate rep)
  if (corporateRep >= 50) {
    choices.push({
      id: 'corporate_contract',
      text: '[CORPORATE ACCESS] Executive priority shipment',
      risk: 'low',
      faction: 'corporate',
      consequences: { 
        fuel: -15, 
        credits: 2000, 
        heat: -5,
        reputation: { corporate: 15, pirate: -10, independent: 0 },
        narrative: 'Corporate brass trusts you with their most sensitive cargo. The pay is excellent and security escorts ensure safe passage.'
      }
    });
  }
  
  // Pirate-specific choices (unlocked at 50+ pirate rep)
  if (pirateRep >= 50) {
    choices.push({
      id: 'raid_opportunity',
      text: '[PIRATE ACCESS] Join coordinated raid on corporate convoy',
      risk: 'extreme',
      faction: 'pirate',
      consequences: { 
        fuel: -25, 
        credits: 5000, 
        heat: 50,
        reputation: { corporate: -25, pirate: 25, independent: -10 },
        narrative: 'The pirates trust you enough to share their biggest score. Corporate security will remember this, but the payout is massive.'
      }
    });
  }
  
  // Independent-specific choices (unlocked at 50+ independent rep)
  if (independentRep >= 50) {
    choices.push({
      id: 'humanitarian_mission',
      text: '[INDEPENDENT ACCESS] Emergency colony relief mission',
      risk: 'medium',
      faction: 'independent',
      consequences: { 
        fuel: -20, 
        credits: -200,
        heat: -10,
        crew: 2,
        morale: 30,
        reputation: { corporate: 5, pirate: 0, independent: 20 },
        narrative: 'The independent colonies remember your past help. They offer you skilled refugees as crew members in exchange for transport.'
      }
    });
  }
  
  // Block faction choices if reputation is too negative
  if (corporateRep <= -25) {
    // Remove corporate-friendly options
    return choices.filter(choice => choice.faction !== 'corporate');
  }
  
  if (pirateRep <= -25) {
    // Remove pirate options
    return choices.filter(choice => choice.faction !== 'pirate');
  }
  
  if (independentRep <= -25) {
    // Remove independent options
    return choices.filter(choice => choice.faction !== 'independent');
  }
  
  return choices;
}

app.get('/api/ship/:shipId/training', (req, res) => {
  res.json([]);
});

// Ship log generation (simple version)
app.post('/api/player/:playerId/generate-log', async (req, res) => {
  console.log('📜 Generating ship log for player:', req.params.playerId);
  
  res.json({
    narrative: 'TEST LOG: The ship remains docked at Alpha Station. All systems nominal. The crew quarters are quiet - perhaps too quiet. You should hire some crew members to begin operations.',
    timestamp: new Date().toISOString(),
    events: []
  });
});

// Streaming dialog endpoint (from minimal server)
app.post('/api/dialog/generate-stream', async (req, res) => {
  console.log('🎬 Streaming request received:', req.body);
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send immediate queue status
  res.write(`data: ${JSON.stringify({
    type: 'queue_status',
    queueStatus: {
      position: 1,
      queueLength: 0,
      priority: 'high'
    },
    dialog: {
      situation: '',
      choices: [],
      id: 'minimal-test-dialog',
      queueStatus: {},
      streamProgress: { characters: 0, percentage: 0 },
      elapsedTime: 0
    }
  })}\n\n`);
  
  // Force flush the initial response
  if (res.flush) res.flush();

  let tokens = 0;
  let content = '';
  const maxTokens = 100;
  
  console.log('📡 Starting simulated streaming...');
  
  // Actual story content to stream
  const storyParts = [
    "You drift through the void between stars. ",
    "The silence of empty space presses against your ship's hull. ",
    "Navigation sensors detect faint signals from nearby systems. ",
    "Your fuel reserves are adequate, but crew quarters remain empty. ",
    "The ship's AI hums quietly, awaiting your command. ",
    "Trade routes beckon from distant stations. ",
    "Corporate transmissions crackle through the comm system. ",
    "Your captain's quarters feel unnaturally quiet. ",
    "The cargo bay echoes with possibility. ",
    "What will you do next?"
  ];
  
  let partIndex = 0;
  
  // Start immediately after a short delay
  setTimeout(() => {
    console.log('📡 FIRST CHUNK STARTING...');
    const streamInterval = setInterval(() => {
    let newChunk = '';
    if (partIndex >= storyParts.length) {
      // We've sent all story parts, complete the stream
      tokens = maxTokens;
      newChunk = '[STREAM COMPLETE]';
    } else {
      newChunk = storyParts[partIndex];
      content += newChunk;
      tokens += Math.floor(newChunk.length / 4); // Rough token estimation
      partIndex++;
    }
    
    console.log(`📤 Sending chunk: "${newChunk}" (${tokens}/${maxTokens})`);
    
    // Send streaming chunk
    res.write(`data: ${JSON.stringify({
      type: 'chunk',
      content: newChunk,
      fullContent: content,
      tokensReceived: tokens,
      maxTokens: maxTokens,
      dialog: {
        situation: content,
        choices: [],
        isStreaming: true,
        tokensReceived: tokens,
        maxTokens: maxTokens,
        streamingContent: content,
        elapsedTime: Math.floor(tokens / 5)
      }
    })}\n\n`);
    
    // Force flush the response
    if (res.flush) res.flush();

    if (tokens >= maxTokens) {
      clearInterval(streamInterval);
      
      console.log('✅ Streaming complete, sending final dialog');
      
      // Get player data for reputation-based choices
      const playerIdFromBody = req.body.playerState?.playerId;
      let playerReputation = { corporate: 0, pirate: 0, independent: 0 };
      
      if (playerIdFromBody) {
        const player = playerData.get(playerIdFromBody);
        if (player && player.reputation) {
          playerReputation = player.reputation;
        }
      }
      
      console.log('📊 Player reputation for choices:', playerReputation);
      
      // Generate faction-specific choices based on reputation
      const factionChoices = generateFactionSpecificChoices(playerReputation);
      
      // Send final dialog with reputation-based choices
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        dialog: {
          situation: content,
          choices: factionChoices,
          id: 'minimal-test-complete',
          playerReputation: playerReputation
        }
      })}\n\n`);
      
      res.end();
    }
  }, 300); // Send update every 300ms

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('🔌 Client disconnected, cleaning up...');
    clearInterval(streamInterval);
  });
  }, 500); // Wait 500ms before starting interval
});

// Handle 404s
app.use((req, res) => {
  console.log(`⚠️  404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not found', 
    message: 'This minimal server only supports basic endpoints',
    path: req.path 
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 ENHANCED MINIMAL SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`🔌 WebSocket support enabled`);
  console.log(`📡 Streaming dialog at /api/dialog/generate-stream`);
  console.log(`🧪 Test API at /api/test`);
  console.log(`🕐 Game tick every ${tickInterval/1000} seconds`);
});