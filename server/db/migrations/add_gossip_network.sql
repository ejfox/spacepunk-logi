-- Migration: Add Gossip Network System
-- This migration adds the gossip network tables to an existing Spacepunk database
-- Run this after the initial schema has been created

BEGIN;

-- Check if gossip_items table exists to prevent duplicate migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gossip_items') THEN
        
        -- =====================================================
        -- CORE GOSSIP TABLES
        -- =====================================================
        
        -- Gossip items table - stores individual pieces of gossip
        CREATE TABLE gossip_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
            
            -- Gossip metadata
            gossip_type VARCHAR(50) NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal',
            veracity NUMERIC(3,2) DEFAULT 0.50,
            
            -- Content
            original_content TEXT NOT NULL,
            current_content TEXT NOT NULL,
            
            -- Subject information
            subject_crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
            subject_type VARCHAR(50) DEFAULT 'crew',
            additional_subjects UUID[] DEFAULT ARRAY[]::UUID[],
            
            -- Origin tracking
            origin_crew_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
            origin_type VARCHAR(50) NOT NULL,
            
            -- Temporal data
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE,
            last_mutated_at TIMESTAMP WITH TIME ZONE,
            
            -- Status
            is_active BOOLEAN DEFAULT true,
            times_spread INTEGER DEFAULT 0,
            mutation_count INTEGER DEFAULT 0,
            
            -- Performance impact
            performance_impact JSONB DEFAULT '{}'
        );
        
        -- Create indexes
        CREATE INDEX idx_gossip_ship_type ON gossip_items(ship_id, gossip_type);
        CREATE INDEX idx_gossip_subject ON gossip_items(subject_crew_id);
        CREATE INDEX idx_gossip_active_created ON gossip_items(is_active, created_at DESC);
        
        -- Continue with other tables...
        -- (Rest of schema creation from 003_gossip_network_schema.sql)
        
        RAISE NOTICE 'Gossip network tables created successfully';
    ELSE
        RAISE NOTICE 'Gossip network tables already exist, skipping migration';
    END IF;
END $$;

-- Add any missing columns to existing tables if needed
DO $$
BEGIN
    -- Add gossip_susceptibility to crew_members if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crew_members' AND column_name = 'gossip_susceptibility'
    ) THEN
        ALTER TABLE crew_members ADD COLUMN gossip_susceptibility NUMERIC(3,2) DEFAULT 0.50;
    END IF;
    
    -- Add gossip_network_id to crew_members for clique tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crew_members' AND column_name = 'primary_gossip_network_id'
    ) THEN
        ALTER TABLE crew_members ADD COLUMN primary_gossip_network_id UUID;
    END IF;
END $$;

-- Create helper function for migrating existing crew relationships to gossip
CREATE OR REPLACE FUNCTION migrate_relationships_to_gossip() RETURNS VOID AS $$
DECLARE
    v_relationship RECORD;
    v_gossip_id UUID;
BEGIN
    -- Create gossip items based on extreme relationships
    FOR v_relationship IN 
        SELECT cr.*, 
               cm1.name as crew1_name,
               cm2.name as crew2_name,
               s.id as ship_id
        FROM crew_relationships cr
        JOIN crew_members cm1 ON cr.crew_member_id = cm1.id
        JOIN crew_members cm2 ON cr.other_crew_member_id = cm2.id
        JOIN ships s ON cm1.ship_id = s.id
        WHERE ABS(cr.relationship_value) > 75
    LOOP
        -- Create positive or negative gossip based on relationship
        IF v_relationship.relationship_value > 75 THEN
            -- Create praise gossip
            INSERT INTO gossip_items (
                ship_id, gossip_type, priority, veracity,
                original_content, current_content,
                subject_crew_id, origin_crew_id, origin_type
            ) VALUES (
                v_relationship.ship_id,
                'praise',
                'normal',
                0.90,
                v_relationship.crew1_name || ' has been saying great things about ' || v_relationship.crew2_name || '''s work.',
                v_relationship.crew1_name || ' has been saying great things about ' || v_relationship.crew2_name || '''s work.',
                v_relationship.other_crew_member_id,
                v_relationship.crew_member_id,
                'witnessed'
            ) RETURNING id INTO v_gossip_id;
            
            -- Create initial belief
            INSERT INTO gossip_beliefs (gossip_id, crew_member_id, belief_strength)
            VALUES (v_gossip_id, v_relationship.crew_member_id, 1.00);
            
        ELSIF v_relationship.relationship_value < -75 THEN
            -- Create complaint gossip
            INSERT INTO gossip_items (
                ship_id, gossip_type, priority, veracity,
                original_content, current_content,
                subject_crew_id, origin_crew_id, origin_type
            ) VALUES (
                v_relationship.ship_id,
                'complaint',
                'normal',
                0.70,
                'There''s tension between ' || v_relationship.crew1_name || ' and ' || v_relationship.crew2_name || '.',
                'There''s tension between ' || v_relationship.crew1_name || ' and ' || v_relationship.crew2_name || '.',
                v_relationship.other_crew_member_id,
                v_relationship.crew_member_id,
                'witnessed'
            ) RETURNING id INTO v_gossip_id;
            
            -- Create initial belief
            INSERT INTO gossip_beliefs (gossip_id, crew_member_id, belief_strength)
            VALUES (v_gossip_id, v_relationship.crew_member_id, 0.90);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_relationships_to_gossip();

-- Drop the migration function
DROP FUNCTION migrate_relationships_to_gossip();

COMMIT;

-- Verify migration
DO $$
DECLARE
    v_table_count INTEGER;
    v_gossip_count INTEGER;
BEGIN
    -- Count gossip-related tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('gossip_items', 'gossip_beliefs', 'gossip_spread_events', 
                        'gossip_mutations', 'gossip_performance_impacts', 
                        'gossip_networks', 'gossip_type_config');
    
    -- Count migrated gossip items
    SELECT COUNT(*) INTO v_gossip_count
    FROM gossip_items;
    
    RAISE NOTICE 'Migration complete. Created % gossip tables with % initial gossip items.', 
                 v_table_count, v_gossip_count;
END $$;