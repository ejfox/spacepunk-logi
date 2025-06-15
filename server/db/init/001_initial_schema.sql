-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    deaths INTEGER DEFAULT 0
);

-- Ships table
CREATE TABLE IF NOT EXISTS ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hull_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'operational',
    location_galaxy VARCHAR(100),
    location_station VARCHAR(255),
    fuel_current NUMERIC(10,2) DEFAULT 100,
    fuel_max NUMERIC(10,2) DEFAULT 100,
    cargo_used INTEGER DEFAULT 0,
    cargo_max INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    destroyed_at TIMESTAMP WITH TIME ZONE
);

-- Ship components table
CREATE TABLE IF NOT EXISTS ship_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    material VARCHAR(50) DEFAULT 'steel',
    condition NUMERIC(5,2) DEFAULT 100.00,
    efficiency NUMERIC(5,2) DEFAULT 100.00,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_maintenance TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crew members table
CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    homeworld VARCHAR(255),
    culture VARCHAR(255),
    
    -- Skills (0-100)
    skill_engineering INTEGER DEFAULT 0,
    skill_piloting INTEGER DEFAULT 0,
    skill_social INTEGER DEFAULT 0,
    skill_combat INTEGER DEFAULT 0,
    
    -- Personality traits (0-100)
    trait_bravery INTEGER DEFAULT 50,
    trait_loyalty INTEGER DEFAULT 50,
    trait_ambition INTEGER DEFAULT 50,
    trait_work_ethic INTEGER DEFAULT 50,
    
    -- Status
    health INTEGER DEFAULT 100,
    morale INTEGER DEFAULT 50,
    fatigue INTEGER DEFAULT 0,
    
    -- Metadata
    hired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    died_at TIMESTAMP WITH TIME ZONE,
    
    -- Family lineage
    parent_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Crew relationships table
CREATE TABLE IF NOT EXISTS crew_relationships (
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    other_crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    relationship_value INTEGER DEFAULT 0, -- -100 to 100
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (crew_member_id, other_crew_member_id),
    CHECK (crew_member_id != other_crew_member_id)
);

-- Crew memories table
CREATE TABLE IF NOT EXISTS crew_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    sentiment INTEGER DEFAULT 0, -- -100 to 100
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- tech, consumable, green, luxury
    base_price NUMERIC(10,2) NOT NULL,
    weight NUMERIC(10,2) DEFAULT 1.0,
    volume NUMERIC(10,2) DEFAULT 1.0,
    description TEXT
);

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(255) NOT NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    current_price NUMERIC(10,2) NOT NULL,
    supply INTEGER DEFAULT 0,
    demand INTEGER DEFAULT 0,
    price_trend NUMERIC(5,2) DEFAULT 0.00, -- percentage
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, resource_id)
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(100) NOT NULL,
    issuing_faction VARCHAR(255),
    target_location VARCHAR(255),
    reward_credits NUMERIC(10,2) DEFAULT 0,
    reward_reputation JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Player missions table
CREATE TABLE IF NOT EXISTS player_missions (
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, failed, abandoned
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (player_id, mission_id)
);

-- Tick history table
CREATE TABLE IF NOT EXISTS tick_history (
    id SERIAL PRIMARY KEY,
    tick_number INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_ships_player_id ON ships(player_id);
CREATE INDEX idx_ship_components_ship_id ON ship_components(ship_id);
CREATE INDEX idx_crew_members_ship_id ON crew_members(ship_id);
CREATE INDEX idx_crew_memories_crew_member_id ON crew_memories(crew_member_id);
CREATE INDEX idx_market_data_station_resource ON market_data(station_id, resource_id);
CREATE INDEX idx_player_missions_player_id ON player_missions(player_id);
CREATE INDEX idx_tick_history_tick_number ON tick_history(tick_number);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ships_updated_at BEFORE UPDATE ON ships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_members_updated_at BEFORE UPDATE ON crew_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();