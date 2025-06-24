-- Fix all missing database tables for the full application

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  galaxy VARCHAR(255) NOT NULL,
  station_type VARCHAR(100) DEFAULT 'trading_post',
  population INTEGER DEFAULT 1000,
  security_level VARCHAR(50) DEFAULT 'medium',
  facilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create log_events table for narrative system
CREATE TABLE IF NOT EXISTS log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  entity_type VARCHAR(100),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add basic stations
INSERT INTO stations (name, galaxy, station_type) VALUES 
('Earth Station Alpha', 'Sol System', 'major_hub'),
('Mars Central', 'Sol System', 'trading_post'),
('Europa Outpost', 'Sol System', 'mining_station'),
('Titan Industrial', 'Sol System', 'industrial'),
('Ceres Trading Post', 'Sol System', 'trading_post')
ON CONFLICT DO NOTHING;

-- Fix market_data table to have station references
ALTER TABLE market_data 
ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id);

-- Create default market data for stations
INSERT INTO market_data (resource_id, station_id, current_price, supply, demand, price_trend, last_updated)
SELECT 
  r.id as resource_id,
  s.id as station_id,
  r.base_price * (0.8 + random() * 0.4) as current_price,
  (400 + random() * 200)::integer as supply,
  (400 + random() * 200)::integer as demand,
  (random() * 2 - 1) as price_trend,
  CURRENT_TIMESTAMP as last_updated
FROM resources r
CROSS JOIN stations s
WHERE NOT EXISTS (
  SELECT 1 FROM market_data md 
  WHERE md.resource_id = r.id AND md.station_id = s.id
);

-- Add tick_history table for tracking game state
CREATE TABLE IF NOT EXISTS tick_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tick_number INTEGER NOT NULL,
  tick_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active_players INTEGER DEFAULT 0,
  active_ships INTEGER DEFAULT 0,
  market_transactions INTEGER DEFAULT 0,
  missions_generated INTEGER DEFAULT 0
);

-- Update docker-compose environment port
UPDATE players SET software_license = 'BASIC' WHERE software_license IS NULL;
UPDATE players SET credits = 10000 WHERE credits IS NULL;