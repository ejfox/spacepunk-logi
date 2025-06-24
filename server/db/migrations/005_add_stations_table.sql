-- Add missing stations table for missions
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    galaxy VARCHAR(100) NOT NULL,
    sector VARCHAR(100),
    station_type VARCHAR(50) DEFAULT 'civilian',
    faction VARCHAR(100),
    population INTEGER DEFAULT 0,
    security_level INTEGER DEFAULT 50 CHECK (security_level >= 0 AND security_level <= 100),
    trade_volume NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some default stations
INSERT INTO stations (name, galaxy, sector, station_type, faction, population, security_level) VALUES
('Earth Station Alpha', 'Sol System', 'Inner', 'civilian', 'Federation', 50000, 85),
('Mars Orbital Platform', 'Sol System', 'Inner', 'mining', 'Federation', 25000, 70),
('Europa Research Station', 'Sol System', 'Outer', 'research', 'Federation', 5000, 90),
('Titan Refinery', 'Sol System', 'Outer', 'industrial', 'Independent', 15000, 45),
('Proxima Trade Hub', 'Proxima Centauri', 'Core', 'trade', 'Commercial Guild', 75000, 60);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stations_galaxy ON stations(galaxy);
CREATE INDEX IF NOT EXISTS idx_stations_faction ON stations(faction);