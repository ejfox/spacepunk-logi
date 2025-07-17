-- SQLite-compatible stations table
CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    galaxy TEXT NOT NULL,
    sector TEXT,
    station_type TEXT DEFAULT 'civilian',
    faction TEXT,
    population INTEGER DEFAULT 0,
    security_level INTEGER DEFAULT 50,
    trade_volume REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add some default stations
INSERT OR REPLACE INTO stations (id, name, galaxy, sector, station_type, faction, population, security_level) VALUES
('earth-station-alpha', 'Earth Station Alpha', 'Sol System', 'Inner', 'civilian', 'Federation', 50000, 85),
('mars-orbital-platform', 'Mars Orbital Platform', 'Sol System', 'Inner', 'mining', 'Federation', 25000, 70),
('europa-research-station', 'Europa Research Station', 'Sol System', 'Outer', 'research', 'Federation', 5000, 90),
('titan-refinery', 'Titan Refinery', 'Sol System', 'Outer', 'industrial', 'Independent', 15000, 45),
('proxima-trade-hub', 'Proxima Trade Hub', 'Proxima Centauri', 'Core', 'trade', 'Commercial Guild', 75000, 60),
('alpha-centauri-station', 'Alpha Centauri Station', 'Alpha Centauri', 'Core', 'civilian', 'Federation', 35000, 75),
('vega-mining-outpost', 'Vega Mining Outpost', 'Vega System', 'Outer', 'mining', 'Mining Consortium', 8000, 40),
('sirius-trading-post', 'Sirius Trading Post', 'Sirius System', 'Mid', 'trade', 'Commercial Guild', 45000, 65),
('rigel-research-facility', 'Rigel Research Facility', 'Rigel System', 'Outer', 'research', 'Scientific Union', 12000, 80),
('betelgeuse-freight-depot', 'Betelgeuse Freight Depot', 'Betelgeuse System', 'Mid', 'industrial', 'Independent', 28000, 55),
('arcturus-defense-station', 'Arcturus Defense Station', 'Arcturus System', 'Core', 'military', 'Federation', 15000, 95),
('polaris-waystation', 'Polaris Waystation', 'Polaris System', 'Outer', 'civilian', 'Independent', 6000, 50),
('capella-tech-hub', 'Capella Tech Hub', 'Capella System', 'Mid', 'research', 'Tech Coalition', 20000, 70),
('aldebaran-port', 'Aldebaran Port', 'Aldebaran System', 'Core', 'trade', 'Commercial Guild', 60000, 80),
('antares-fuel-depot', 'Antares Fuel Depot', 'Antares System', 'Outer', 'industrial', 'Fuel Syndicate', 10000, 45);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stations_galaxy ON stations(galaxy);
CREATE INDEX IF NOT EXISTS idx_stations_faction ON stations(faction);
CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(station_type);