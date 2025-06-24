-- Add missing skill_type column to training_queue table
ALTER TABLE training_queue 
ADD COLUMN IF NOT EXISTS skill_type VARCHAR(50);

-- Update existing records to have a default skill_type based on training_type
UPDATE training_queue 
SET skill_type = CASE 
  WHEN training_type LIKE '%engineering%' THEN 'engineering'
  WHEN training_type LIKE '%piloting%' THEN 'piloting'
  WHEN training_type LIKE '%social%' THEN 'social'
  WHEN training_type LIKE '%combat%' THEN 'combat'
  ELSE 'general'
END
WHERE skill_type IS NULL;