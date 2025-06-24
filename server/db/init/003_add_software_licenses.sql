-- Add software license tracking to players
ALTER TABLE players ADD COLUMN software_license VARCHAR(50) DEFAULT 'BASIC' CHECK (software_license IN ('BASIC', 'STANDARD', 'PROFESSIONAL'));

-- Add credits column for purchasing licenses
ALTER TABLE players ADD COLUMN credits INTEGER DEFAULT 10000;

-- Create index for quick license lookups
CREATE INDEX idx_players_software_license ON players(software_license);

-- Create license purchase history table for audit trail
CREATE TABLE license_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  previous_license VARCHAR(50) NOT NULL,
  new_license VARCHAR(50) NOT NULL,
  cost INTEGER NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_license_upgrade CHECK (
    (previous_license = 'BASIC' AND new_license IN ('STANDARD', 'PROFESSIONAL')) OR
    (previous_license = 'STANDARD' AND new_license = 'PROFESSIONAL')
  )
);

-- Add some corporate flavor text to the licenses
COMMENT ON COLUMN players.software_license IS 'SpaceCorp™ Software License Level - Determines available ship management features';
COMMENT ON TABLE license_purchases IS 'Audit trail for SpaceCorp™ Software License Agreement compliance tracking';