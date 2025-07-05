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

// Tick system
setInterval(() => {
  currentTick++;
  broadcast({
    type: 'tick:update',
    data: { tick: currentTick }
  });
  console.log(`🕐 Tick ${currentTick}`);
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
    created_at: new Date().toISOString()
  };
  
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
    status: 'docked',
    created_at: new Date().toISOString()
  };
  
  console.log('🚀 Created ship:', ship);
  res.json({ ship, success: true });
});

// Player data
app.get('/api/player/:playerId', (req, res) => {
  res.json({
    credits: 1000,
    reputation: {},
    stats: {
      total_jumps: 0,
      total_trades: 0,
      total_missions: 0
    }
  });
});

// Crew endpoint (empty for now)
app.get('/api/crew/available', (req, res) => {
  res.json([]);
});

app.get('/api/ship/:shipId/crew', (req, res) => {
  res.json([]);
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
  
  // Start immediately after a short delay
  setTimeout(() => {
    console.log('📡 FIRST CHUNK STARTING...');
    const streamInterval = setInterval(() => {
    tokens += Math.floor(Math.random() * 5) + 1;
    const newChunk = `Token ${tokens}... `;
    content += newChunk;
    
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
      
      // Send final dialog
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        dialog: {
          situation: 'MINIMAL SERVER TEST: You drift through the void, ship systems humming quietly. The absence of crew makes every sound echo through empty corridors.',
          choices: [
            {
              id: 'explore',
              text: 'Scan nearby systems',
              risk: 'low',
              consequences: { fuel: -5, credits: 0, heat: 0 }
            },
            {
              id: 'dock',
              text: 'Return to station',
              risk: 'none',
              consequences: { fuel: -2, credits: 0, heat: 0 }
            },
            {
              id: 'wait',
              text: 'Drift and conserve fuel',
              risk: 'low',
              consequences: { fuel: 0, credits: 0, heat: -1 }
            }
          ],
          id: 'minimal-test-complete'
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