-- Gossip Network Schema for Spacepunk
-- Implements a sophisticated gossip propagation system with belief tracking and mutation history

-- =====================================================
-- CORE GOSSIP TABLES
-- =====================================================

-- Gossip items table - stores individual pieces of gossip
CREATE TABLE IF NOT EXISTS gossip_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    
    -- Gossip metadata
    gossip_type VARCHAR(50) NOT NULL, -- romance, competence, health, loyalty, scandal, etc
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, high, normal, low
    veracity NUMERIC(3,2) DEFAULT 0.50, -- 0.00 to 1.00 truth probability
    
    -- Content (supports LLM-generated narratives)
    original_content TEXT NOT NULL,
    current_content TEXT NOT NULL, -- mutates over time
    
    -- Subject information
    subject_crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    subject_type VARCHAR(50) DEFAULT 'crew', -- crew, ship, player, external
    additional_subjects UUID[] DEFAULT ARRAY[]::UUID[], -- for multi-person gossip
    
    -- Origin tracking
    origin_crew_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
    origin_type VARCHAR(50) NOT NULL, -- witnessed, overheard, fabricated, system
    
    -- Temporal data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- some gossip fades
    last_mutated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    times_spread INTEGER DEFAULT 0,
    mutation_count INTEGER DEFAULT 0,
    
    -- Performance impact (cached for efficiency)
    performance_impact JSONB DEFAULT '{}', -- {morale: -5, productivity: 10}
    
    -- Indexes for common queries
    INDEX idx_gossip_ship_type (ship_id, gossip_type),
    INDEX idx_gossip_subject (subject_crew_id),
    INDEX idx_gossip_active_created (is_active, created_at DESC)
);

-- =====================================================
-- BELIEF AND SPREAD TRACKING
-- =====================================================

-- Tracks individual crew member beliefs about gossip
CREATE TABLE IF NOT EXISTS gossip_beliefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gossip_id UUID REFERENCES gossip_items(id) ON DELETE CASCADE,
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Belief metrics
    belief_strength NUMERIC(3,2) DEFAULT 0.50, -- 0.00 to 1.00
    skepticism_level NUMERIC(3,2) DEFAULT 0.50, -- affects spread probability
    
    -- Spread tracking
    heard_from_crew_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
    heard_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    times_heard INTEGER DEFAULT 1,
    last_heard_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Engagement
    has_spread BOOLEAN DEFAULT false,
    times_spread INTEGER DEFAULT 0,
    last_spread_at TIMESTAMP WITH TIME ZONE,
    
    -- Mutation tracking
    version_heard TEXT, -- tracks which version of gossip they believe
    
    UNIQUE(gossip_id, crew_member_id),
    INDEX idx_belief_crew_gossip (crew_member_id, gossip_id),
    INDEX idx_belief_spread_potential (has_spread, belief_strength DESC)
);

-- =====================================================
-- GOSSIP SPREAD EVENTS
-- =====================================================

-- Records each gossip transmission event
CREATE TABLE IF NOT EXISTS gossip_spread_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gossip_id UUID REFERENCES gossip_items(id) ON DELETE CASCADE,
    
    -- Participants
    spreader_crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    receiver_crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Context
    location VARCHAR(255), -- engineering_bay, mess_hall, corridor
    conversation_type VARCHAR(50), -- casual, whisper, argument, meeting
    
    -- Transmission details
    spread_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transmission_fidelity NUMERIC(3,2) DEFAULT 1.00, -- how accurately it was transmitted
    
    -- Outcome
    was_believed BOOLEAN DEFAULT true,
    belief_modifier NUMERIC(3,2) DEFAULT 0.00, -- -1.00 to 1.00
    
    -- Content at time of spread (for mutation tracking)
    content_version TEXT NOT NULL,
    
    INDEX idx_spread_gossip_time (gossip_id, spread_at DESC),
    INDEX idx_spread_participants (spreader_crew_id, receiver_crew_id)
);

-- =====================================================
-- GOSSIP MUTATIONS
-- =====================================================

-- Tracks how gossip changes over time
CREATE TABLE IF NOT EXISTS gossip_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gossip_id UUID REFERENCES gossip_items(id) ON DELETE CASCADE,
    
    -- Mutation details
    mutated_by_crew_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
    mutation_type VARCHAR(50) NOT NULL, -- exaggeration, minimization, detail_loss, reinterpretation
    
    -- Content changes
    previous_content TEXT NOT NULL,
    new_content TEXT NOT NULL,
    mutation_severity NUMERIC(3,2) DEFAULT 0.10, -- 0.00 to 1.00
    
    -- Timing
    mutated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Impact on veracity
    veracity_change NUMERIC(3,2) DEFAULT 0.00, -- -1.00 to 1.00
    
    INDEX idx_mutation_gossip_time (gossip_id, mutated_at DESC)
);

-- =====================================================
-- PERFORMANCE IMPACT TRACKING
-- =====================================================

-- Links gossip to actual crew performance changes
CREATE TABLE IF NOT EXISTS gossip_performance_impacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gossip_id UUID REFERENCES gossip_items(id) ON DELETE CASCADE,
    affected_crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    
    -- Impact metrics
    impact_type VARCHAR(50) NOT NULL, -- morale, productivity, stress, relationships
    impact_value NUMERIC(5,2) NOT NULL, -- can be positive or negative
    
    -- Duration
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Stacking rules
    stacks_with_similar BOOLEAN DEFAULT false,
    max_stack_count INTEGER DEFAULT 1,
    
    UNIQUE(gossip_id, affected_crew_id, impact_type),
    INDEX idx_impact_crew_active (affected_crew_id, is_active)
);

-- =====================================================
-- GOSSIP NETWORKS AND CLIQUES
-- =====================================================

-- Tracks gossip networks/cliques that form
CREATE TABLE IF NOT EXISTS gossip_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    
    -- Network properties
    network_type VARCHAR(50) NOT NULL, -- friendship, professional, conspiracy
    core_members UUID[] NOT NULL, -- crew_member ids
    peripheral_members UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Behavior
    gossip_frequency_modifier NUMERIC(3,2) DEFAULT 1.00, -- multiplier
    mutation_resistance NUMERIC(3,2) DEFAULT 0.50, -- 0.00 to 1.00
    
    -- Status
    formed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dissolved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    INDEX idx_network_ship_active (ship_id, is_active)
);

-- =====================================================
-- SUPPORTING FUNCTIONS
-- =====================================================

-- Function to calculate gossip spread probability
CREATE OR REPLACE FUNCTION calculate_gossip_spread_probability(
    p_gossip_id UUID,
    p_spreader_id UUID,
    p_receiver_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_probability NUMERIC := 0.5;
    v_relationship_value INTEGER;
    v_gossip_type VARCHAR(50);
    v_spreader_personality JSONB;
    v_receiver_personality JSONB;
BEGIN
    -- Get relationship value
    SELECT relationship_value INTO v_relationship_value
    FROM crew_relationships
    WHERE crew_member_id = p_spreader_id 
    AND other_crew_member_id = p_receiver_id;
    
    -- Get gossip type
    SELECT gossip_type INTO v_gossip_type
    FROM gossip_items
    WHERE id = p_gossip_id;
    
    -- Get personalities
    SELECT jsonb_build_object(
        'trait_loyalty', trait_loyalty,
        'trait_work_ethic', trait_work_ethic
    ) INTO v_spreader_personality
    FROM crew_members
    WHERE id = p_spreader_id;
    
    -- Base probability on relationship
    v_probability := 0.5 + (COALESCE(v_relationship_value, 0) / 200.0);
    
    -- Adjust based on gossip type
    CASE v_gossip_type
        WHEN 'scandal' THEN v_probability := v_probability * 1.5;
        WHEN 'romance' THEN v_probability := v_probability * 1.3;
        WHEN 'competence' THEN v_probability := v_probability * 0.8;
    END CASE;
    
    -- Ensure probability is between 0 and 1
    RETURN GREATEST(0, LEAST(1, v_probability));
END;
$$ LANGUAGE plpgsql;

-- Function to apply gossip performance impacts
CREATE OR REPLACE FUNCTION apply_gossip_impacts(p_gossip_id UUID) RETURNS VOID AS $$
DECLARE
    v_impact RECORD;
    v_crew_member RECORD;
BEGIN
    -- Get all active impacts for this gossip
    FOR v_impact IN 
        SELECT * FROM gossip_performance_impacts
        WHERE gossip_id = p_gossip_id AND is_active = true
    LOOP
        -- Update crew member stats based on impact type
        UPDATE crew_members
        SET morale = CASE 
                WHEN v_impact.impact_type = 'morale' 
                THEN GREATEST(0, LEAST(100, morale + v_impact.impact_value))
                ELSE morale
            END,
            fatigue = CASE
                WHEN v_impact.impact_type = 'stress'
                THEN GREATEST(0, LEAST(100, fatigue + v_impact.impact_value))
                ELSE fatigue
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_impact.affected_crew_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update gossip spread count
CREATE OR REPLACE FUNCTION update_gossip_spread_count() RETURNS TRIGGER AS $$
BEGIN
    -- Update spread count on gossip item
    UPDATE gossip_items
    SET times_spread = times_spread + 1
    WHERE id = NEW.gossip_id;
    
    -- Update spreader's belief record
    UPDATE gossip_beliefs
    SET has_spread = true,
        times_spread = times_spread + 1,
        last_spread_at = NEW.spread_at
    WHERE gossip_id = NEW.gossip_id
    AND crew_member_id = NEW.spreader_crew_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gossip_spread_count
    AFTER INSERT ON gossip_spread_events
    FOR EACH ROW
    EXECUTE FUNCTION update_gossip_spread_count();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active gossip with belief counts
CREATE OR REPLACE VIEW v_active_gossip AS
SELECT 
    gi.*,
    COUNT(DISTINCT gb.crew_member_id) as believer_count,
    AVG(gb.belief_strength) as avg_belief_strength,
    MAX(gb.last_heard_at) as last_spread_time
FROM gossip_items gi
LEFT JOIN gossip_beliefs gb ON gi.id = gb.gossip_id
WHERE gi.is_active = true
AND (gi.expires_at IS NULL OR gi.expires_at > CURRENT_TIMESTAMP)
GROUP BY gi.id;

-- Crew gossip participation
CREATE OR REPLACE VIEW v_crew_gossip_stats AS
SELECT 
    cm.id as crew_id,
    cm.name,
    COUNT(DISTINCT gb.gossip_id) as gossip_known,
    COUNT(DISTINCT gse.gossip_id) as gossip_spread,
    AVG(gb.belief_strength) as avg_belief_strength,
    SUM(CASE WHEN gb.has_spread THEN 1 ELSE 0 END) as times_spread_gossip
FROM crew_members cm
LEFT JOIN gossip_beliefs gb ON cm.id = gb.crew_member_id
LEFT JOIN gossip_spread_events gse ON cm.id = gse.spreader_crew_id
GROUP BY cm.id, cm.name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_gossip_ship_active_type ON gossip_items(ship_id, is_active, gossip_type);
CREATE INDEX idx_belief_crew_active ON gossip_beliefs(crew_member_id, belief_strength) 
    WHERE belief_strength > 0.5;
CREATE INDEX idx_spread_recent ON gossip_spread_events(spread_at DESC) 
    WHERE spread_at > CURRENT_TIMESTAMP - INTERVAL '7 days';
CREATE INDEX idx_impact_active_crew ON gossip_performance_impacts(affected_crew_id, is_active, impact_type);

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Function to archive old gossip
CREATE OR REPLACE FUNCTION archive_old_gossip() RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER := 0;
BEGIN
    -- Deactivate gossip older than 30 days with low engagement
    UPDATE gossip_items
    SET is_active = false
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND times_spread < 5
    AND is_active = true;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    -- Deactivate expired gossip
    UPDATE gossip_items
    SET is_active = false
    WHERE expires_at < CURRENT_TIMESTAMP
    AND is_active = true;
    
    GET DIAGNOSTICS v_archived_count = v_archived_count + ROW_COUNT;
    
    -- Clean up performance impacts for inactive gossip
    UPDATE gossip_performance_impacts
    SET is_active = false
    WHERE gossip_id IN (
        SELECT id FROM gossip_items WHERE is_active = false
    )
    AND is_active = true;
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL GOSSIP TYPE CONFIGURATION
-- =====================================================

-- Gossip type configuration table
CREATE TABLE IF NOT EXISTS gossip_type_config (
    gossip_type VARCHAR(50) PRIMARY KEY,
    spread_rate_modifier NUMERIC(3,2) DEFAULT 1.00,
    mutation_rate NUMERIC(3,2) DEFAULT 0.10,
    default_priority VARCHAR(20) DEFAULT 'normal',
    default_expiry_days INTEGER,
    performance_impact_template JSONB DEFAULT '{}'
);

-- Insert default gossip types
INSERT INTO gossip_type_config (gossip_type, spread_rate_modifier, mutation_rate, default_priority, default_expiry_days, performance_impact_template) VALUES
('romance', 1.5, 0.20, 'high', 14, '{"morale": 5, "productivity": -5}'),
('competence', 0.8, 0.15, 'normal', 30, '{"morale": -10, "stress": 5}'),
('health', 1.2, 0.10, 'high', 7, '{"morale": -5, "stress": 10}'),
('loyalty', 1.0, 0.25, 'high', NULL, '{"morale": -15, "relationships": -10}'),
('scandal', 2.0, 0.30, 'urgent', 21, '{"morale": -20, "stress": 15}'),
('achievement', 0.9, 0.05, 'normal', 60, '{"morale": 10, "productivity": 5}'),
('rumor', 1.3, 0.35, 'low', 14, '{"stress": 5}'),
('complaint', 1.1, 0.20, 'normal', 7, '{"morale": -5, "productivity": -5}'),
('praise', 0.7, 0.10, 'normal', 30, '{"morale": 15, "relationships": 5}'),
('conspiracy', 1.8, 0.40, 'high', NULL, '{"stress": 20, "relationships": -15}')
ON CONFLICT (gossip_type) DO NOTHING;