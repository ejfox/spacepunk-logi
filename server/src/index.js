import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';
import { initDatabase } from './db/index.js';
import { TickEngine } from './engine/tickEngine.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';
import apiRoutes, { setTickEngine } from './routes/api.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3666;
const TICK_INTERVAL = process.env.TICK_INTERVAL || 10000; // 10 seconds default

// Load OpenAPI specification
let swaggerDocument;
try {
  swaggerDocument = YAML.load(join(__dirname, '../openapi.yaml'));
  console.log('✅ OpenAPI specification loaded successfully');
} catch (error) {
  console.error('❌ Failed to load OpenAPI spec:', error.message);
  swaggerDocument = { openapi: '3.0.3', info: { title: 'API Error', version: '1.0.0' }, paths: {} };
}

// Load custom CSS for brutalist corporate theme
let customCss = '';
try {
  customCss = readFileSync(join(__dirname, 'public/swagger-theme.css'), 'utf8');
  console.log('✅ Custom CSS loaded successfully');
} catch (error) {
  console.error('❌ Failed to load custom CSS:', error.message);
}

// Swagger UI options with corporate branding
const swaggerOptions = {
  customCss,
  customSiteTitle: 'SpaceCorp™ API Documentation - CONFIDENTIAL',
  customfavIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMWExYTFhIi8+CjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzAwZmYwMCIvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmYwMDAwIi8+CjwvcG1nPg==',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    tryItOutEnabled: true,
    layout: 'BaseLayout'
  }
};

app.use(cors());
app.use(express.json());

// Serve static files for custom styling
app.use('/public', express.static(join(__dirname, 'public')));

// Swagger UI routes with corporate branding
console.log('📚 Setting up Swagger UI at /api-docs');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Redirect /docs to /api-docs for convenience
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// Corporate API documentation landing page
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerDocument);
});

// API routes
app.use('/api', apiRoutes);

// Corporate landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SpaceCorp™ API Terminal</title>
      <style>
        body { 
          background: #1a1a1a; 
          color: #00ff00; 
          font-family: 'Courier New', monospace; 
          padding: 20px; 
          line-height: 1.6;
        }
        .header { 
          background: #ff0000; 
          color: #1a1a1a; 
          padding: 20px; 
          text-align: center; 
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 30px;
        }
        .content { 
          background: #2a2a2a; 
          border: 2px solid #333; 
          padding: 20px; 
          margin: 20px 0;
        }
        a { 
          color: #ff0000; 
          text-decoration: underline; 
          font-weight: bold;
        }
        a:hover { color: #ffaa00; }
        .status { color: #00aa00; }
        .warning { color: #ffaa00; }
        .error { color: #ff0000; }
        .footer {
          background: #ff0000;
          color: #1a1a1a;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ⚠️ SpaceCorp™ API Terminal ⚠️<br>
        Spacepunk Logistics Sim
      </div>
      
      <div class="content">
        <h2>SYSTEM STATUS</h2>
        <p class="status">✅ Server Online</p>
        <p class="status">✅ Tick Engine: ${TICK_INTERVAL/1000}s intervals</p>
        <p class="status">✅ Current Tick: ${tickEngine.currentTick}</p>
        <p class="status">✅ WebSocket: Ready</p>
        <p class="status">✅ Database: Connected</p>
      </div>
      
      <div class="content">
        <h2>API DOCUMENTATION</h2>
        <p><a href="/api-docs">📖 Interactive API Documentation</a></p>
        <p><a href="/api-docs.json">📋 OpenAPI 3.0 Specification (JSON)</a></p>
        <p><a href="/docs">📖 Documentation Shortlink</a></p>
      </div>
      
      <div class="content">
        <h2>SYSTEM ENDPOINTS</h2>
        <p><a href="/health">🏥 Health Check</a></p>
        <p><a href="/api/server-status">📊 Server Status</a></p>
      </div>
      
      <div class="content">
        <h2 class="warning">⚠️ CORPORATE DISCLAIMER</h2>
        <p>This API is provided "as-is" with zero warranty. Side effects may include existential dread, bureaucratic nightmares, and an overwhelming desire to file digital paperwork.</p>
        <p>SpaceCorp™ is not responsible for any psychological damage caused by prolonged exposure to corporate dystopian humor.</p>
      </div>
      
      <div class="footer">
        SpaceCorp™ Confidential - Unauthorized Access Prohibited
      </div>
    </body>
    </html>
  `);
});

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

// Connect tick engine to API routes for NPC access
setTickEngine(tickEngine);

setupWebSocketHandlers(wss, tickEngine);

async function start() {
  try {
    console.log('\n🚀 SPACEPUNK LOGISTICS SERVER');
    console.log('════════════════════════════════');
    
    await initDatabase();
    console.log('✅ Database connection established');
    
    // Start tick engine with NPCs
    tickEngine.start();
    console.log(`⏰ Game tick engine: ENABLED (${TICK_INTERVAL/1000}s intervals)`);
    
    server.listen(PORT, () => {
      console.log(`🌐 Server running: http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📋 OpenAPI Spec: http://localhost:${PORT}/api-docs.json`);
      console.log(`🔌 WebSocket ready for real-time updates`);
      console.log('════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

start();