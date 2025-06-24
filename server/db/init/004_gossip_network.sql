-- Gossip Network Schema
-- Implements the Ship's Gossip Network with belief tracking, spread mechanics, and mutation

-- Gossip types configuration
CREATE TABLE gossip_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    base_spread_rate DECIMAL(3,2) DEFAULT 0.50,
    base_credibility DECIMAL(3,2) DEFAULT 0.50,
    mutation_chance DECIMAL(3,2) DEFAULT 0.10,
    performance_impact_type VARCHAR(50),
    description TEXT
);

-- Main gossip entries
CREATE TABLE gossip (
    id SERIAL PRIMARY KEY,
    ship_id INTEGER REFERENCES ships(id) ON DELETE CASCADE,
    gossip_type_id INTEGER REFERENCES gossip_types(id),
    originator_id INTEGER REFERENCES crew_members(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    secondary_subject_id INTEGER REFERENCES crew_members(id) ON DELETE SET NULL,
    
    -- Content and metadata
    content TEXT NOT NULL,
    original_content TEXT NOT NULL, -- Preserved for mutation tracking
    severity INTEGER CHECK (severity BETWEEN 1 AND 5) DEFAULT 3,
    credibility DECIMAL(3,2) CHECK (credibility BETWEEN 0 AND 1) DEFAULT 0.50,
    
    -- Mutation tracking
    mutation_count INTEGER DEFAULT 0,
    is_mutated BOOLEAN DEFAULT FALSE,
    parent_gossip_id INTEGER REFERENCES gossip(id) ON DELETE SET NULL,
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_spread_at TIMESTAMP,
    decay_rate DECIMAL(3,2) DEFAULT 0.05,
    is_active BOOLEAN DEFAULT TRUE,
    suppressed_by INTEGER REFERENCES crew_members(id) ON DELETE SET NULL,
    suppressed_at TIMESTAMP,
    
    -- Performance impacts
    performance_impact JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT unique_active_gossip UNIQUE (ship_id, subject_id, gossip_type_id, content) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Tracks individual crew beliefs about gossip
CREATE TABLE gossip_beliefs (
    id SERIAL PRIMARY KEY,
    gossip_id INTEGER REFERENCES gossip(id) ON DELETE CASCADE,
    crew_member_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Belief metrics
    belief_level DECIMAL(3,2) CHECK (belief_level BETWEEN 0 AND 1) DEFAULT 0.50,
    exposure_count INTEGER DEFAULT 1,
    last_heard_from INTEGER REFERENCES crew_members(id) ON DELETE SET NULL,
    
    -- Reactions
    reaction VARCHAR(50), -- 'shocked', 'skeptical', 'amused', 'angry', etc.
    has_confronted BOOLEAN DEFAULT FALSE,
    has_spread BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(gossip_id, crew_member_id)
);

-- Tracks gossip spread events
CREATE TABLE gossip_spread_events (
    id SERIAL PRIMARY KEY,
    gossip_id INTEGER REFERENCES gossip(id) ON DELETE CASCADE,
    spreader_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Spread mechanics
    spread_type VARCHAR(50) DEFAULT 'casual', -- 'casual', 'whisper', 'confrontation', 'broadcast'
    location VARCHAR(100), -- 'mess_hall', 'engineering', 'quarters', etc.
    success BOOLEAN DEFAULT TRUE,
    belief_change DECIMAL(3,2),
    
    -- Mutation tracking
    mutated BOOLEAN DEFAULT FALSE,
    mutation_type VARCHAR(50), -- 'exaggeration', 'minimization', 'detail_change', etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tick_number INTEGER
);

-- Gossip network analysis cache
CREATE TABLE gossip_network_stats (
    id SERIAL PRIMARY KEY,
    ship_id INTEGER REFERENCES ships(id) ON DELETE CASCADE,
    crew_member_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Network metrics
    gossip_centrality DECIMAL(3,2) DEFAULT 0.50, -- How central to gossip network
    credibility_score DECIMAL(3,2) DEFAULT 0.50, -- How believable their gossip is
    discretion_score DECIMAL(3,2) DEFAULT 0.50, -- How selective in spreading
    
    -- Activity metrics
    gossip_created_count INTEGER DEFAULT 0,
    gossip_spread_count INTEGER DEFAULT 0,
    gossip_received_count INTEGER DEFAULT 0,
    gossip_suppressed_count INTEGER DEFAULT 0,
    
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ship_id, crew_member_id)
);

-- Gossip impacts on crew performance
CREATE TABLE gossip_performance_impacts (
    id SERIAL PRIMARY KEY,
    gossip_id INTEGER REFERENCES gossip(id) ON DELETE CASCADE,
    affected_crew_id INTEGER REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Impact details
    impact_type VARCHAR(50), -- 'productivity', 'morale', 'focus', etc.
    impact_value DECIMAL(3,2), -- -1.0 to 1.0
    duration_ticks INTEGER DEFAULT 10,
    remaining_ticks INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(gossip_id, affected_crew_id, impact_type)
);

-- Indexes for performance
CREATE INDEX idx_gossip_ship_active ON gossip(ship_id, is_active);
CREATE INDEX idx_gossip_subject ON gossip(subject_id);
CREATE INDEX idx_gossip_type ON gossip(gossip_type_id);
CREATE INDEX idx_gossip_created ON gossip(created_at DESC);

CREATE INDEX idx_beliefs_crew ON gossip_beliefs(crew_member_id);
CREATE INDEX idx_beliefs_gossip ON gossip_beliefs(gossip_id);
CREATE INDEX idx_beliefs_belief_level ON gossip_beliefs(belief_level);

CREATE INDEX idx_spread_gossip ON gossip_spread_events(gossip_id);
CREATE INDEX idx_spread_spreader ON gossip_spread_events(spreader_id);
CREATE INDEX idx_spread_recipient ON gossip_spread_events(recipient_id);
CREATE INDEX idx_spread_tick ON gossip_spread_events(tick_number DESC);

CREATE INDEX idx_network_stats_ship ON gossip_network_stats(ship_id);
CREATE INDEX idx_network_stats_centrality ON gossip_network_stats(gossip_centrality DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_gossip_beliefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gossip_beliefs_timestamp
    BEFORE UPDATE ON gossip_beliefs
    FOR EACH ROW
    EXECUTE FUNCTION update_gossip_beliefs_timestamp();

-- Function to calculate gossip decay
CREATE OR REPLACE FUNCTION apply_gossip_decay()
RETURNS void AS $$
BEGIN
    UPDATE gossip_beliefs
    SET belief_level = GREATEST(0, belief_level - g.decay_rate)
    FROM gossip g
    WHERE gossip_beliefs.gossip_id = g.id
    AND g.is_active = TRUE
    AND gossip_beliefs.updated_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    -- Deactivate gossip with no believers
    UPDATE gossip
    SET is_active = FALSE
    WHERE id IN (
        SELECT g.id
        FROM gossip g
        LEFT JOIN gossip_beliefs gb ON g.id = gb.gossip_id AND gb.belief_level > 0.1
        WHERE g.is_active = TRUE
        GROUP BY g.id
        HAVING COUNT(gb.id) = 0
    );
END;
$$ LANGUAGE plpgsql;

-- Insert default gossip types
INSERT INTO gossip_types (type_name, base_spread_rate, base_credibility, mutation_chance, performance_impact_type, description) VALUES
('romance', 0.75, 0.60, 0.15, 'focus', 'Romantic entanglements and relationship drama'),
('incompetence', 0.65, 0.55, 0.20, 'trust', 'Questions about crew member abilities and mistakes'),
('theft', 0.80, 0.45, 0.10, 'morale', 'Accusations of stealing or misappropriation'),
('health', 0.70, 0.65, 0.05, 'productivity', 'Concerns about physical or mental health'),
('conspiracy', 0.60, 0.35, 0.25, 'paranoia', 'Theories about hidden agendas or plots'),
('achievement', 0.55, 0.70, 0.10, 'morale', 'Positive accomplishments and recognition'),
('conflict', 0.85, 0.50, 0.15, 'cooperation', 'Interpersonal disputes and arguments'),
('vice', 0.70, 0.40, 0.20, 'reliability', 'Substance abuse or behavioral issues'),
('origin', 0.45, 0.60, 0.30, 'trust', 'Speculation about backgrounds and histories'),
('loyalty', 0.65, 0.50, 0.15, 'unity', 'Questions about allegiance and dedication');