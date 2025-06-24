import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDatabase } from './db/index.js';
import { TickEngine } from './engine/tickEngine.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3666;
const TICK_INTERVAL = process.env.TICK_INTERVAL || 10000; // 10 seconds default

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    tick: tickEngine.currentTick
  });
});

app.get('/api/server-status', (req, res) => {
  res.json({
    status: 'online',
    currentTick: tickEngine.currentTick,
    tickInterval: TICK_INTERVAL,
    connectedClients: wss.clients.size,
    uptime: process.uptime()
  });
});

const tickEngine = new TickEngine(TICK_INTERVAL);

setupWebSocketHandlers(wss, tickEngine);

async function start() {
  try {
    console.log('\n🚀 SPACEPUNK LOGISTICS SERVER');
    console.log('════════════════════════════════');
    
    await initDatabase();
    console.log('✅ Database connection established');
    
    tickEngine.start();
    console.log(`⏰ Game tick engine: ${TICK_INTERVAL/1000}s intervals`);
    
    server.listen(PORT, () => {
      console.log(`🌐 Server running: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket ready for real-time updates`);
      console.log('════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

start();