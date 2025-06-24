-- Add Jungian personality traits and archetypes to crew_members table

-- Add cognitive function traits (mutually exclusive pairs)
ALTER TABLE crew_members 
ADD COLUMN trait_extroversion INTEGER DEFAULT 50,
ADD COLUMN trait_thinking INTEGER DEFAULT 50,
ADD COLUMN trait_sensing INTEGER DEFAULT 50,
ADD COLUMN trait_judging INTEGER DEFAULT 50;

-- Add Jungian archetype scores
ALTER TABLE crew_members
ADD COLUMN archetype_innocent INTEGER DEFAULT 25,
ADD COLUMN archetype_sage INTEGER DEFAULT 25,
ADD COLUMN archetype_explorer INTEGER DEFAULT 25,
ADD COLUMN archetype_outlaw INTEGER DEFAULT 25,
ADD COLUMN archetype_magician INTEGER DEFAULT 25,
ADD COLUMN archetype_hero INTEGER DEFAULT 25,
ADD COLUMN archetype_lover INTEGER DEFAULT 25,
ADD COLUMN archetype_jester INTEGER DEFAULT 25,
ADD COLUMN archetype_caregiver INTEGER DEFAULT 25,
ADD COLUMN archetype_creator INTEGER DEFAULT 25,
ADD COLUMN archetype_ruler INTEGER DEFAULT 25,
ADD COLUMN archetype_orphan INTEGER DEFAULT 25;

-- Add dominant archetype identifier
ALTER TABLE crew_members
ADD COLUMN dominant_archetype VARCHAR(50) DEFAULT 'innocent';

-- Add constraints to ensure valid ranges
ALTER TABLE crew_members
ADD CONSTRAINT check_trait_extroversion CHECK (trait_extroversion >= 0 AND trait_extroversion <= 100),
ADD CONSTRAINT check_trait_thinking CHECK (trait_thinking >= 0 AND trait_thinking <= 100),
ADD CONSTRAINT check_trait_sensing CHECK (trait_sensing >= 0 AND trait_sensing <= 100),
ADD CONSTRAINT check_trait_judging CHECK (trait_judging >= 0 AND trait_judging <= 100);

-- Add constraints for archetype scores
ALTER TABLE crew_members
ADD CONSTRAINT check_archetype_innocent CHECK (archetype_innocent >= 0 AND archetype_innocent <= 100),
ADD CONSTRAINT check_archetype_sage CHECK (archetype_sage >= 0 AND archetype_sage <= 100),
ADD CONSTRAINT check_archetype_explorer CHECK (archetype_explorer >= 0 AND archetype_explorer <= 100),
ADD CONSTRAINT check_archetype_outlaw CHECK (archetype_outlaw >= 0 AND archetype_outlaw <= 100),
ADD CONSTRAINT check_archetype_magician CHECK (archetype_magician >= 0 AND archetype_magician <= 100),
ADD CONSTRAINT check_archetype_hero CHECK (archetype_hero >= 0 AND archetype_hero <= 100),
ADD CONSTRAINT check_archetype_lover CHECK (archetype_lover >= 0 AND archetype_lover <= 100),
ADD CONSTRAINT check_archetype_jester CHECK (archetype_jester >= 0 AND archetype_jester <= 100),
ADD CONSTRAINT check_archetype_caregiver CHECK (archetype_caregiver >= 0 AND archetype_caregiver <= 100),
ADD CONSTRAINT check_archetype_creator CHECK (archetype_creator >= 0 AND archetype_creator <= 100),
ADD CONSTRAINT check_archetype_ruler CHECK (archetype_ruler >= 0 AND archetype_ruler <= 100),
ADD CONSTRAINT check_archetype_orphan CHECK (archetype_orphan >= 0 AND archetype_orphan <= 100);

-- Add constraint for valid archetype names
ALTER TABLE crew_members
ADD CONSTRAINT check_dominant_archetype CHECK (
  dominant_archetype IN (
    'innocent', 'sage', 'explorer', 'outlaw', 'magician', 'hero',
    'lover', 'jester', 'caregiver', 'creator', 'ruler', 'orphan'
  )
);

-- Create indexes for archetype queries
CREATE INDEX idx_crew_dominant_archetype ON crew_members(dominant_archetype);
CREATE INDEX idx_crew_extroversion ON crew_members(trait_extroversion);
CREATE INDEX idx_crew_thinking ON crew_members(trait_thinking);