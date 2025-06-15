-- Trait System Tables
-- Implements the crew trait system with definitions and assignments

-- Trait definitions table
CREATE TABLE IF NOT EXISTS trait_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    flavor_text TEXT, -- Additional lore/humor text
    
    -- Classification
    category VARCHAR(50) NOT NULL, -- personality, skill, physical, background, quirk
    trait_level INTEGER NOT NULL DEFAULT 1, -- 1=common, 2=uncommon, 3=rare/corrupted
    rarity_weight INTEGER DEFAULT 100, -- Higher = more common in random selection
    
    -- Prerequisites and conflicts
    prerequisite_traits UUID[] DEFAULT ARRAY[]::UUID[], -- Must have these traits
    conflicting_traits UUID[] DEFAULT ARRAY[]::UUID[], -- Cannot have these traits
    min_skill_requirements JSONB DEFAULT '{}', -- e.g., {"skill_engineering": 20}
    
    -- Effects on gameplay
    stat_modifiers JSONB DEFAULT '{}', -- e.g., {"skill_engineering": 5, "morale": -10}
    special_abilities TEXT[] DEFAULT ARRAY[]::TEXT[], -- Special actions/behaviors
    event_modifiers JSONB DEFAULT '{}', -- Modifies event outcomes
    
    -- Narrative impact
    dialogue_tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Tags for LLM generation
    relationship_modifiers JSONB DEFAULT '{}', -- How they interact with others
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    can_be_learned BOOLEAN DEFAULT false, -- Can be gained through training/events
    can_be_lost BOOLEAN DEFAULT false, -- Can be lost through events
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entity traits table - links crew members to their traits
CREATE TABLE IF NOT EXISTS entity_traits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity reference
    entity_id UUID NOT NULL, -- crew_member.id
    entity_type VARCHAR(50) DEFAULT 'crew_member',
    trait_definition_id UUID REFERENCES trait_definitions(id) ON DELETE CASCADE,
    
    -- Trait instance data
    trait_level INTEGER DEFAULT 1, -- Level of this trait instance
    trait_strength NUMERIC(5,2) DEFAULT 100.00, -- 0-100, how strong this trait is
    
    -- Acquisition info
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acquired_through VARCHAR(100), -- 'generation', 'training', 'event', 'inheritance'
    acquired_details JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(entity_id, trait_definition_id)
);

-- Trait evolution history
CREATE TABLE IF NOT EXISTS trait_evolution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_trait_id UUID REFERENCES entity_traits(id) ON DELETE CASCADE,
    
    -- Evolution details
    evolution_type VARCHAR(50) NOT NULL, -- gained, lost, strengthened, weakened, corrupted
    old_value NUMERIC(5,2),
    new_value NUMERIC(5,2),
    trigger_event VARCHAR(100), -- What caused this change
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_trait_definitions_category ON trait_definitions(category);
CREATE INDEX idx_trait_definitions_level ON trait_definitions(trait_level);
CREATE INDEX idx_trait_definitions_active ON trait_definitions(is_active);

CREATE INDEX idx_entity_traits_entity ON entity_traits(entity_id, entity_type);
CREATE INDEX idx_entity_traits_definition ON entity_traits(trait_definition_id);
CREATE INDEX idx_entity_traits_active ON entity_traits(is_active);

CREATE INDEX idx_trait_evolution_entity_trait ON trait_evolution_log(entity_trait_id);
CREATE INDEX idx_trait_evolution_type ON trait_evolution_log(evolution_type);

-- Insert Level 1 Common Traits
INSERT INTO trait_definitions (name, description, flavor_text, category, trait_level, rarity_weight, stat_modifiers, special_abilities, dialogue_tags, relationship_modifiers) VALUES

-- PERSONALITY TRAITS
('Optimistic', 'Maintains positive outlook even in difficult situations', 'Always sees the bright side of hyperdrive malfunctions and supply shortages.', 'personality', 1, 100, '{"morale": 10, "trait_loyalty": 5}', '{"morale_boost_others"}', '{"positive", "encouraging", "hopeful"}', '{"default": 5}'),

('Pessimistic', 'Expects the worst outcome in most situations', 'Convinced that every mission will end in catastrophic failure. Usually right.', 'personality', 1, 80, '{"morale": -5, "skill_engineering": 5}', '{"problem_anticipation"}', '{"negative", "cautious", "realistic"}', '{"default": -3}'),

('Hot-Headed', 'Quick to anger and confrontation', 'Has strong opinions about reactor maintenance protocols and isn''t afraid to share them.', 'personality', 1, 70, '{"skill_combat": 8, "trait_work_ethic": -5}', '{"intimidation", "quick_action"}', '{"aggressive", "impulsive", "passionate"}', '{"authority": -10, "rebels": 5}'),

('Level-Headed', 'Remains calm under pressure', 'Could probably defuse a bomb while filing quarterly reports.', 'personality', 1, 90, '{"morale": 5, "trait_work_ethic": 5}', '{"crisis_management", "de_escalation"}', '{"calm", "rational", "steady"}', '{"stressed_crew": 8}'),

('Competitive', 'Driven to outperform others', 'Turns everything into a contest, including who can clean the reactor coolant filters fastest.', 'personality', 1, 75, '{"skill_improvement_rate": 15}', '{"skill_contests", "performance_boost"}', '{"driven", "ambitious", "comparative"}', '{"rivals": -5, "similar_competitive": 3}'),

-- WORK ETHIC TRAITS  
('Workaholic', 'Compulsively works long hours', 'Submits maintenance reports at 3 AM because "the ship doesn''t sleep."', 'work_ethic', 1, 60, '{"trait_work_ethic": 15, "health": -5}', '{"overtime_bonus", "fatigue_resistance"}', '{"dedicated", "obsessive", "thorough"}', '{"lazy_crew": -8}'),

('Perfectionist', 'Cannot tolerate substandard work', 'Recalibrates instruments that are already within acceptable parameters.', 'work_ethic', 1, 65, '{"skill_engineering": 10, "trait_work_ethic": 5}', '{"quality_bonus", "slow_completion"}', '{"meticulous", "critical", "precise"}', '{"sloppy_workers": -10}'),

('Efficient', 'Completes tasks quickly without sacrificing quality', 'Somehow makes bureaucratic forms feel streamlined.', 'work_ethic', 1, 85, '{"trait_work_ethic": 8, "task_completion_speed": 20}', '{"fast_completion", "resource_conservation"}', '{"organized", "practical", "streamlined"}', '{"disorganized": -5}'),

('Team Player', 'Works well with others and supports group efforts', 'Actually enjoys mandatory team-building exercises.', 'work_ethic', 1, 90, '{"trait_loyalty": 10}', '{"cooperation_bonus", "group_morale_boost"}', '{"supportive", "collaborative", "harmonious"}', '{"default": 5, "loners": -3}'),

-- SKILL-RELATED TRAITS
('Natural Pilot', 'Innate understanding of vehicle operation', 'Makes docking look as easy as parallel parking a delivery truck.', 'skill', 1, 40, '{"skill_piloting": 15, "piloting_learning_rate": 25}', '{"emergency_piloting", "fuel_efficiency"}', '{"skilled", "intuitive", "confident"}', '{}'),

('Tech Savvy', 'Comfortable with all kinds of technology', 'The person who actually reads the manual before operating new equipment.', 'skill', 1, 70, '{"skill_engineering": 10, "learning_rate_bonus": 10}', '{"quick_diagnosis", "system_optimization"}', '{"technical", "logical", "adaptable"}', '{}'),

('People Person', 'Natural ability to connect with others', 'Somehow makes customs officials smile during surprise inspections.', 'skill', 1, 75, '{"skill_social": 12, "trait_loyalty": 5}', '{"negotiation_bonus", "information_gathering"}', '{"charismatic", "empathetic", "diplomatic"}', '{"antisocial": -10}'),

('Combat Veteran', 'Experience in dangerous situations', 'Has stories about "the war" that may or may not be entirely fabricated.', 'skill', 1, 30, '{"skill_combat": 18, "trait_bravery": 10}', '{"tactical_planning", "weapon_expertise"}', '{"experienced", "hardened", "strategic"}', '{"pacifists": -5}'),

-- QUIRK TRAITS
('Coffee Addict', 'Requires caffeine to function properly', 'Measures time in cups of coffee rather than standard hours.', 'quirk', 1, 80, '{"trait_work_ethic": -10, "performance_with_coffee": 15}', '{"caffeine_dependency", "late_night_productivity"}', '{"jittery", "focused", "dependent"}', '{}'),

('Neat Freak', 'Obsessively maintains clean and organized spaces', 'Alphabetizes the spare parts inventory in their free time.', 'quirk', 1, 60, '{"trait_work_ethic": 5, "health": 5}', '{"contamination_resistance", "organization_boost"}', '{"clean", "orderly", "particular"}', '{"messy_crew": -8}'),

('Storyteller', 'Loves to share tales and experiences', 'Turns routine maintenance into epic narratives about "the great coolant leak of last Tuesday."', 'quirk', 1, 85, '{"skill_social": 5, "crew_entertainment": 10}', '{"morale_boost_storytelling", "memory_keeper"}', '{"entertaining", "verbose", "memorable"}', '{"antisocial": -5}'),

('Lucky', 'Things tend to work out in their favor', 'Equipment rarely breaks when they''re on duty. Coincidence? Probably.', 'quirk', 1, 25, '{"event_success_bonus": 15, "accident_avoidance": 20}', '{"fortune_favor", "disaster_mitigation"}', '{"fortunate", "confident", "blessed"}', '{}'),

-- BACKGROUND TRAITS
('Corporate Background', 'Trained in large organizational structures', 'Understands the proper forms for requisitioning emergency toilet paper.', 'background', 1, 70, '{"skill_social": 5, "bureaucracy_bonus": 20}', '{"paperwork_expertise", "regulation_knowledge"}', '{"professional", "formal", "systematic"}', '{"rebels": -8}'),

('Spacer Born', 'Raised in zero-gravity environments', 'More comfortable in a spacesuit than planetary casual wear.', 'background', 1, 40, '{"skill_piloting": 8, "space_adaptation": 25}', '{"zero_g_expertise", "radiation_resistance"}', '{"adapted", "experienced", "hardy"}', '{}'),

('Academic', 'Strong educational background', 'Has multiple degrees in subjects that sound impressive at parties.', 'background', 1, 50, '{"learning_rate_bonus": 20, "skill_engineering": 5}', '{"research_skills", "theoretical_knowledge"}', '{"educated", "analytical", "theoretical"}', '{"anti_intellectual": -10}'),

('Self-Taught', 'Learned skills through experience rather than formal education', 'Believes practical knowledge beats textbook theory every time.', 'background', 1, 80, '{"improvisation_bonus": 15, "trait_work_ethic": 5}', '{"creative_solutions", "resource_improvisation"}', '{"practical", "independent", "resourceful"}', '{"academics": -5}');