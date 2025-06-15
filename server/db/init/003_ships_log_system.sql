-- Ship's Log System Tables
-- Creates the infrastructure for LLM-generated ship's log entries

-- Ship log entries table
CREATE TABLE IF NOT EXISTS ship_log_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    entry_number INTEGER NOT NULL, -- Sequential number for this ship
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    entry_type VARCHAR(50) DEFAULT 'automatic', -- automatic, manual, system_alert
    
    -- Metadata for generation
    tick_range_start INTEGER NOT NULL,
    tick_range_end INTEGER NOT NULL,
    events_processed INTEGER DEFAULT 0,
    generation_prompt TEXT,
    
    -- LLM metadata
    llm_model VARCHAR(100),
    generation_duration_ms INTEGER,
    token_count INTEGER,
    
    -- Timing
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    UNIQUE(ship_id, entry_number)
);

-- Log events table - raw data used to generate log entries
CREATE TABLE IF NOT EXISTS log_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    tick_number INTEGER NOT NULL,
    
    -- Event classification
    event_type VARCHAR(100) NOT NULL, -- crew_skill_gain, market_transaction, system_maintenance, etc.
    category VARCHAR(50) NOT NULL, -- crew, ship, trade, combat, exploration
    severity VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical
    
    -- Event data
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_data JSONB DEFAULT '{}', -- Structured data for the event
    
    -- Participants
    crew_member_ids UUID[] DEFAULT ARRAY[]::UUID[],
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    
    -- Impact tracking
    impact_score INTEGER DEFAULT 1, -- 1-10, how noteworthy this event is
    narrative_tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- tags for narrative generation
    
    -- Processing status
    processed_in_log_entry UUID REFERENCES ship_log_entries(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Log generation jobs table - tracks async log generation
CREATE TABLE IF NOT EXISTS log_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    
    -- Job parameters
    tick_range_start INTEGER NOT NULL,
    tick_range_end INTEGER NOT NULL,
    job_type VARCHAR(50) DEFAULT 'periodic', -- periodic, manual, emergency
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    generated_entry_id UUID REFERENCES ship_log_entries(id),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0
);

-- Captain preferences for log generation
CREATE TABLE IF NOT EXISTS log_preferences (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    
    -- Generation frequency
    auto_generate BOOLEAN DEFAULT true,
    generation_interval_ticks INTEGER DEFAULT 10, -- Generate log every N ticks
    
    -- Content preferences
    detail_level VARCHAR(20) DEFAULT 'normal', -- minimal, normal, verbose
    include_crew_gossip BOOLEAN DEFAULT true,
    include_technical_details BOOLEAN DEFAULT true,
    include_market_analysis BOOLEAN DEFAULT true,
    
    -- Style preferences
    narrative_style VARCHAR(50) DEFAULT 'professional', -- professional, casual, humorous, dramatic
    perspective VARCHAR(20) DEFAULT 'third_person', -- first_person, third_person
    
    -- Filtering
    min_event_impact INTEGER DEFAULT 3, -- Only include events with impact >= this
    max_entries_per_period INTEGER DEFAULT 1,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_ship_log_entries_ship_id ON ship_log_entries(ship_id);
CREATE INDEX idx_ship_log_entries_tick_range ON ship_log_entries(tick_range_start, tick_range_end);
CREATE INDEX idx_ship_log_entries_generated_at ON ship_log_entries(generated_at);

CREATE INDEX idx_log_events_ship_id ON log_events(ship_id);
CREATE INDEX idx_log_events_tick_number ON log_events(tick_number);
CREATE INDEX idx_log_events_category ON log_events(category);
CREATE INDEX idx_log_events_processed ON log_events(processed_in_log_entry);

CREATE INDEX idx_log_generation_jobs_ship_id ON log_generation_jobs(ship_id);
CREATE INDEX idx_log_generation_jobs_status ON log_generation_jobs(status);

-- Add update trigger for log preferences
CREATE TRIGGER update_log_preferences_updated_at BEFORE UPDATE ON log_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();