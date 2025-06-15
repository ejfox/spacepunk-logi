-- Training Queue System
-- Allows players to queue long-term training for crew members

-- Training programs table - defines available training courses
CREATE TABLE IF NOT EXISTS training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Program info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- engineering, piloting, social, combat, special
    
    -- Requirements
    skill_type VARCHAR(50) NOT NULL, -- skill_engineering, skill_piloting, etc.
    required_level INTEGER DEFAULT 0, -- minimum skill level required
    prerequisite_programs UUID[] DEFAULT ARRAY[]::UUID[], -- other programs that must be completed first
    
    -- Training parameters
    duration_ticks INTEGER NOT NULL, -- how many ticks to complete
    skill_improvement INTEGER NOT NULL, -- skill points gained on completion
    cost_credits INTEGER DEFAULT 0, -- cost to enroll
    
    -- Difficulty and failure
    difficulty_rating INTEGER DEFAULT 1, -- 1-10, affects success chance
    failure_penalty INTEGER DEFAULT 0, -- skill points lost on failure
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    faction_restricted VARCHAR(255), -- only available to certain factions
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training queue entries - crew members currently in training
CREATE TABLE IF NOT EXISTS training_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    training_program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    
    -- Progress tracking
    status VARCHAR(50) DEFAULT 'queued', -- queued, in_progress, completed, failed, cancelled
    progress_ticks INTEGER DEFAULT 0, -- ticks completed so far
    started_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    skill_gained INTEGER DEFAULT 0,
    success_rating INTEGER, -- 1-100, how well they performed
    
    -- Costs and payments
    credits_paid INTEGER DEFAULT 0,
    
    -- Metadata
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    UNIQUE(crew_member_id, training_program_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Training events - log important training milestones
CREATE TABLE IF NOT EXISTS training_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_queue_id UUID REFERENCES training_queue(id) ON DELETE CASCADE,
    
    -- Event info
    event_type VARCHAR(100) NOT NULL, -- enrolled, started, milestone, completed, failed, cancelled
    event_description TEXT,
    
    -- Progress data
    progress_percentage INTEGER DEFAULT 0,
    skill_progress INTEGER DEFAULT 0,
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training prerequisites tracking
CREATE TABLE IF NOT EXISTS training_completions (
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    training_program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    final_skill_level INTEGER NOT NULL,
    success_rating INTEGER DEFAULT 50,
    
    PRIMARY KEY (crew_member_id, training_program_id)
);

-- Create indexes for performance
CREATE INDEX idx_training_queue_crew_member ON training_queue(crew_member_id);
CREATE INDEX idx_training_queue_ship ON training_queue(ship_id);
CREATE INDEX idx_training_queue_status ON training_queue(status);
CREATE INDEX idx_training_queue_completion ON training_queue(estimated_completion);

CREATE INDEX idx_training_events_queue ON training_events(training_queue_id);
CREATE INDEX idx_training_events_type ON training_events(event_type);

CREATE INDEX idx_training_completions_crew ON training_completions(crew_member_id);
CREATE INDEX idx_training_programs_category ON training_programs(category);
CREATE INDEX idx_training_programs_skill ON training_programs(skill_type);

-- Insert some basic training programs
INSERT INTO training_programs (name, description, category, skill_type, duration_ticks, skill_improvement, cost_credits, difficulty_rating) VALUES
-- Engineering programs
('Basic Reactor Theory', 'Fundamental understanding of ship power systems and reactor maintenance protocols.', 'engineering', 'skill_engineering', 15, 10, 500, 2),
('Advanced Diagnostics', 'Complex system troubleshooting and predictive maintenance techniques.', 'engineering', 'skill_engineering', 25, 15, 1200, 4),
('Hyperdrive Certification', 'Specialized training in FTL drive operation and emergency procedures.', 'engineering', 'skill_engineering', 40, 20, 2500, 6),

-- Piloting programs  
('Navigation Fundamentals', 'Basic stellar navigation and traffic control protocols.', 'piloting', 'skill_piloting', 12, 8, 400, 2),
('Combat Maneuvering', 'Evasive tactics and aggressive piloting in hostile environments.', 'piloting', 'skill_piloting', 30, 18, 1800, 5),
('Precision Docking', 'Advanced docking procedures for challenging environments and emergency situations.', 'piloting', 'skill_piloting', 20, 12, 800, 3),

-- Social programs
('Diplomatic Protocol', 'Negotiation techniques and cultural sensitivity training for inter-faction relations.', 'social', 'skill_social', 18, 12, 600, 3),
('Leadership Development', 'Team management and crisis leadership skills for senior crew members.', 'social', 'skill_social', 35, 20, 2000, 5),

-- Combat programs
('Small Arms Proficiency', 'Personal weapon training and boarding action tactics.', 'combat', 'skill_combat', 15, 10, 700, 3),
('Tactical Analysis', 'Strategic thinking and battlefield awareness for combat situations.', 'combat', 'skill_combat', 28, 16, 1500, 4);