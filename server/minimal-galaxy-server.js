import express from 'express';
import cors from 'cors';
import { query, initDatabase } from './simple-sqlite-db.js';

const app = express();
const PORT = 3666;

// Middleware
app.use(cors());
app.use(express.json());

// Simple stations endpoint
app.get('/api/stations', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        name, 
        galaxy, 
        sector, 
        station_type, 
        faction, 
        population, 
        security_level
      FROM stations 
      ORDER BY galaxy, sector, name
    `);

    res.json({ stations: result.rows });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✅ Galaxy Map Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();