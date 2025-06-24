-- Add training_queue table for tracking crew training sessions
CREATE TABLE IF NOT EXISTS training_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  training_type VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  intensity VARCHAR(50) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completion_percentage INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_training_queue_crew_member ON training_queue(crew_member_id);
CREATE INDEX idx_training_queue_status ON training_queue(status);
CREATE INDEX idx_training_queue_end_time ON training_queue(end_time);

-- Add ship_logs table for storing ship narrative logs
CREATE TABLE IF NOT EXISTS ship_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
  log_type VARCHAR(50) NOT NULL DEFAULT 'narrative',
  complexity VARCHAR(50) DEFAULT 'normal',
  narrative TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ship_logs
CREATE INDEX idx_ship_logs_player ON ship_logs(player_id);
CREATE INDEX idx_ship_logs_ship ON ship_logs(ship_id);
CREATE INDEX idx_ship_logs_created ON ship_logs(created_at DESC);
CREATE INDEX idx_ship_logs_type ON ship_logs(log_type);

-- Add missing columns to players table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='players' AND column_name='software_license') THEN
    ALTER TABLE players ADD COLUMN software_license VARCHAR(50) DEFAULT 'BASIC' 
      CHECK (software_license IN ('BASIC', 'STANDARD', 'PROFESSIONAL'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='players' AND column_name='credits') THEN
    ALTER TABLE players ADD COLUMN credits INTEGER DEFAULT 10000;
  END IF;
END $$;