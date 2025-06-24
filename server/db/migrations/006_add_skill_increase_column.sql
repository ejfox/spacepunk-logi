-- Add missing skill_increase column to training_queue table
ALTER TABLE training_queue 
ADD COLUMN IF NOT EXISTS skill_increase NUMERIC(5,2) DEFAULT 0;

-- Update existing records to have a default skill increase
UPDATE training_queue 
SET skill_increase = CASE 
  WHEN intensity >= 80 THEN 5.0
  WHEN intensity >= 60 THEN 3.0
  WHEN intensity >= 40 THEN 2.0
  ELSE 1.0
END
WHERE skill_increase = 0;