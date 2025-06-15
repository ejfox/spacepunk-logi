import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDatabase } from './db/index.js';
import { TickEngine } from './engine/tickEngine.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const TICK_INTERVAL = process.env.TICK_INTERVAL || 10000; // 10 seconds default

app.use(cors());
app.use(express.json());

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
    await initDatabase();
    console.log('Database initialized successfully');
    
    tickEngine.start();
    console.log(`Tick engine started with ${TICK_INTERVAL}ms interval`);
    
    server.listen(PORT, () => {
      console.log(`Spacepunk server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();