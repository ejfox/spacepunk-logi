-- Fixed Gossip Network Schema
-- Corrects type mismatches with existing schema

-- Clean up any partial installation
DROP TABLE IF EXISTS gossip_performance_impacts CASCADE;
DROP TABLE IF EXISTS gossip_spread_events CASCADE;
DROP TABLE IF EXISTS gossip_beliefs CASCADE;
DROP TABLE IF EXISTS gossip_network_stats CASCADE;
DROP TABLE IF EXISTS gossip CASCADE;
DROP TABLE IF EXISTS gossip_types CASCADE;
DROP FUNCTION IF EXISTS calculate_spread_probability CASCADE;
DROP FUNCTION IF EXISTS calculate_performance_impact CASCADE;

-- Gossip types configuration
CREATE TABLE gossip_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    base_spread_rate DECIMAL(3,2) DEFAULT 0.50,
    base_credibility DECIMAL(3,2) DEFAULT 0.50,
    mutation_chance DECIMAL(3,2) DEFAULT 0.10,
    description TEXT
);

-- Helper function for calculating spread probability
CREATE OR REPLACE FUNCTION calculate_spread_probability(
    relationship_value INTEGER,
    gossip_type VARCHAR(50),
    originator_credibility DECIMAL(3,2)
) RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN LEAST(1.0, GREATEST(0.0, 
        (relationship_value / 100.0) * 0.5 + 
        originator_credibility * 0.3 + 
        CASE gossip_type
            WHEN 'romance' THEN 0.3
            WHEN 'scandal' THEN 0.4
            WHEN 'incompetence' THEN 0.2
            WHEN 'conspiracy' THEN 0.15
            ELSE 0.25
        END
    ));
END;
$$ LANGUAGE plpgsql;

-- Helper function for performance impact calculation
CREATE OR REPLACE FUNCTION calculate_performance_impact(
    gossip_type VARCHAR(50),
    average_belief DECIMAL(5,2),
    intensity INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN CASE gossip_type
        WHEN 'incompetence' THEN -(average_belief * intensity * 0.5) / 100.0
        WHEN 'health' THEN -(average_belief * intensity * 0.3) / 100.0
        WHEN 'romance' THEN (average_belief * intensity * 0.1) / 100.0
        WHEN 'scandal' THEN -(average_belief * intensity * 0.4) / 100.0
        WHEN 'conspiracy' THEN -(average_belief * intensity * 0.2) / 100.0
        ELSE 0.0
    END;
END;
$$ LANGUAGE plpgsql;

-- Insert predefined gossip types
INSERT INTO gossip_types (type_name, base_spread_rate, base_credibility, mutation_chance, description) VALUES
('romance', 0.70, 0.60, 0.15, 'Romantic relationships and attractions'),
('incompetence', 0.50, 0.70, 0.10, 'Work performance and professional capability'),
('health', 0.30, 0.80, 0.05, 'Physical and mental health concerns'),
('scandal', 0.80, 0.40, 0.25, 'Controversial or embarrassing behavior'),
('conspiracy', 0.40, 0.30, 0.20, 'Secret plans or hidden agendas'),
('favoritism', 0.60, 0.65, 0.12, 'Preferential treatment from superiors'),
('wealth', 0.55, 0.50, 0.08, 'Financial status and material possessions'),
('addiction', 0.45, 0.75, 0.15, 'Substance abuse or compulsive behaviors'),
('family', 0.35, 0.85, 0.05, 'Personal family matters and relationships'),
('reputation', 0.65, 0.55, 0.18, 'General character and standing');

-- Main gossip table (FIXED: ship_id is now UUID)
CREATE TABLE gossip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    subject_crew_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    originator_crew_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    gossip_type VARCHAR(50) NOT NULL REFERENCES gossip_types(type_name),
    content TEXT,
    intensity INTEGER CHECK (intensity >= 0 AND intensity <= 100),
    veracity INTEGER CHECK (veracity >= 0 AND veracity <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Mutation tracking
    parent_gossip_id UUID REFERENCES gossip(id) ON DELETE SET NULL,
    mutation_type VARCHAR(50), -- 'exaggeration', 'diminishment', 'target_shift', 'content_drift'
    mutation_count INTEGER DEFAULT 0,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    decay_rate DECIMAL(5,4) DEFAULT 0.0100 -- 1% decay per tick by default
);

-- Belief tracking - who believes what gossip and how much
CREATE TABLE gossip_beliefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    gossip_id UUID NOT NULL REFERENCES gossip(id) ON DELETE CASCADE,
    belief_level INTEGER CHECK (belief_level >= 0 AND belief_level <= 100),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    first_heard_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_credibility DECIMAL(3,2) DEFAULT 0.50,
    
    UNIQUE(crew_member_id, gossip_id)
);

-- Spread events tracking - how gossip moves through the network
CREATE TABLE gossip_spread_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gossip_id UUID NOT NULL REFERENCES gossip(id) ON DELETE CASCADE,
    source_crew_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    target_crew_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    spread_probability DECIMAL(3,2),
    relationship_factor DECIMAL(3,2),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    mutation_occurred BOOLEAN DEFAULT FALSE,
    credibility_modifier DECIMAL(3,2) DEFAULT 0.0
);

-- Network statistics per ship for analysis
CREATE TABLE gossip_network_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Gossip activity metrics
    gossip_originated INTEGER DEFAULT 0,
    gossip_spread INTEGER DEFAULT 0,
    gossip_received INTEGER DEFAULT 0,
    gossip_believed INTEGER DEFAULT 0,
    
    -- Network position metrics
    centrality_score DECIMAL(5,2) DEFAULT 0.0,
    credibility_score DECIMAL(5,2) DEFAULT 50.0,
    influence_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Time tracking
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ship_id, crew_member_id)
);

-- Performance impacts from gossip on crew effectiveness
CREATE TABLE gossip_performance_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    gossip_id UUID NOT NULL REFERENCES gossip(id) ON DELETE CASCADE,
    
    impact_type VARCHAR(50) NOT NULL, -- 'skill_modifier', 'morale_modifier', 'stress_modifier'
    impact_value DECIMAL(5,2) NOT NULL, -- Can be positive or negative
    impact_duration INTEGER DEFAULT 100, -- Duration in ticks
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_gossip_ship_id ON gossip(ship_id);
CREATE INDEX idx_gossip_subject_crew ON gossip(subject_crew_id);
CREATE INDEX idx_gossip_originator_crew ON gossip(originator_crew_id);
CREATE INDEX idx_gossip_type ON gossip(gossip_type);
CREATE INDEX idx_gossip_active ON gossip(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_gossip_created_at ON gossip(created_at);

CREATE INDEX idx_gossip_beliefs_crew ON gossip_beliefs(crew_member_id);
CREATE INDEX idx_gossip_beliefs_gossip ON gossip_beliefs(gossip_id);
CREATE INDEX idx_gossip_beliefs_level ON gossip_beliefs(belief_level);

CREATE INDEX idx_gossip_spread_events_gossip ON gossip_spread_events(gossip_id);
CREATE INDEX idx_gossip_spread_events_source ON gossip_spread_events(source_crew_id);
CREATE INDEX idx_gossip_spread_events_target ON gossip_spread_events(target_crew_id);
CREATE INDEX idx_gossip_spread_events_success ON gossip_spread_events(success);

CREATE INDEX idx_gossip_network_stats_ship ON gossip_network_stats(ship_id);
CREATE INDEX idx_gossip_network_stats_crew ON gossip_network_stats(crew_member_id);
CREATE INDEX idx_gossip_network_stats_credibility ON gossip_network_stats(credibility_score);

CREATE INDEX idx_gossip_performance_impacts_crew ON gossip_performance_impacts(crew_member_id);
CREATE INDEX idx_gossip_performance_impacts_active ON gossip_performance_impacts(is_active) WHERE is_active = TRUE;

-- Views for common queries
CREATE VIEW active_gossip AS
SELECT g.*, gt.base_spread_rate, gt.base_credibility
FROM gossip g
JOIN gossip_types gt ON g.gossip_type = gt.type_name
WHERE g.is_active = TRUE;

CREATE VIEW gossip_with_belief_stats AS
SELECT 
    g.*,
    COUNT(gb.id) as believer_count,
    AVG(gb.belief_level) as average_belief,
    MAX(gb.belief_level) as max_belief,
    MIN(gb.belief_level) as min_belief
FROM gossip g
LEFT JOIN gossip_beliefs gb ON g.id = gb.gossip_id
GROUP BY g.id;

CREATE VIEW crew_gossip_summary AS
SELECT 
    cm.id as crew_member_id,
    cm.name,
    cm.ship_id,
    COUNT(DISTINCT g1.id) as gossip_originated,
    COUNT(DISTINCT gse.id) as gossip_spread_attempts,
    COUNT(DISTINCT CASE WHEN gse.success THEN gse.id END) as successful_spreads,
    COUNT(DISTINCT gb.id) as gossip_believed,
    AVG(gb.belief_level) as average_belief_level,
    COALESCE(gns.credibility_score, 50.0) as credibility_score
FROM crew_members cm
LEFT JOIN gossip g1 ON cm.id = g1.originator_crew_id
LEFT JOIN gossip_spread_events gse ON cm.id = gse.source_crew_id
LEFT JOIN gossip_beliefs gb ON cm.id = gb.crew_member_id
LEFT JOIN gossip_network_stats gns ON cm.id = gns.crew_member_id
GROUP BY cm.id, cm.name, cm.ship_id, gns.credibility_score;

-- Comments for documentation
COMMENT ON TABLE gossip IS 'Core gossip entries with mutation tracking and lifecycle management';
COMMENT ON TABLE gossip_beliefs IS 'Tracks individual crew member beliefs in specific gossip';
COMMENT ON TABLE gossip_spread_events IS 'Audit trail of gossip propagation attempts';
COMMENT ON TABLE gossip_network_stats IS 'Crew network analysis and influence metrics';
COMMENT ON TABLE gossip_performance_impacts IS 'Performance effects of gossip on crew effectiveness';