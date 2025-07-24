-- Add crew type system to crew_members table
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS crew_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS crew_type_name VARCHAR(100) DEFAULT 'General Crew';
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS crew_type_description TEXT DEFAULT 'Basic crew member with no specializations';
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS crew_bonuses JSONB DEFAULT '{}'::jsonb;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS salary INTEGER DEFAULT 50;

-- Add index for crew type queries
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_type ON crew_members(crew_type);

-- Update existing crew members to have general type
UPDATE crew_members 
SET crew_type = 'general', 
    crew_type_name = 'General Crew',
    crew_type_description = 'Basic crew member with no specializations',
    crew_bonuses = '{}'::jsonb,
    salary = COALESCE(hiring_cost * 0.1, 50)
WHERE crew_type IS NULL;