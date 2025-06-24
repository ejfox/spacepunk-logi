-- Test Data for Gossip Network System
-- This file provides example gossip data for testing the system

-- Ensure we have test data to work with
DO $$
DECLARE
    v_ship_id UUID;
    v_crew1_id UUID;
    v_crew2_id UUID;
    v_crew3_id UUID;
    v_crew4_id UUID;
    v_gossip1_id UUID;
    v_gossip2_id UUID;
    v_gossip3_id UUID;
    v_gossip4_id UUID;
    v_gossip5_id UUID;
BEGIN
    -- Get the first ship (or create a test one)
    SELECT id INTO v_ship_id FROM ships LIMIT 1;
    
    IF v_ship_id IS NULL THEN
        -- Create a test ship if none exists
        INSERT INTO ships (name, hull_type, location_galaxy, location_station)
        VALUES ('Test Vessel', 'freighter', 'Sol', 'Earth Station')
        RETURNING id INTO v_ship_id;
    END IF;
    
    -- Get crew members for this ship
    SELECT id INTO v_crew1_id FROM crew_members WHERE ship_id = v_ship_id LIMIT 1 OFFSET 0;
    SELECT id INTO v_crew2_id FROM crew_members WHERE ship_id = v_ship_id LIMIT 1 OFFSET 1;
    SELECT id INTO v_crew3_id FROM crew_members WHERE ship_id = v_ship_id LIMIT 1 OFFSET 2;
    SELECT id INTO v_crew4_id FROM crew_members WHERE ship_id = v_ship_id LIMIT 1 OFFSET 3;
    
    -- Only create test gossip if we have crew members
    IF v_crew1_id IS NOT NULL AND v_crew2_id IS NOT NULL THEN
        
        -- =====================================================
        -- ROMANCE GOSSIP
        -- =====================================================
        INSERT INTO gossip_items (
            ship_id, gossip_type, priority, veracity,
            original_content, current_content,
            subject_crew_id, additional_subjects, origin_crew_id, origin_type,
            performance_impact
        ) VALUES (
            v_ship_id,
            'romance',
            'high',
            0.75,
            'Someone saw Chen and Rodriguez holding hands in the cargo bay last night.',
            'Someone saw Chen and Rodriguez holding hands in the cargo bay last night.',
            v_crew1_id,
            ARRAY[v_crew2_id]::UUID[],
            v_crew3_id,
            'witnessed',
            '{"morale": 5, "productivity": -5}'::JSONB
        ) RETURNING id INTO v_gossip1_id;
        
        -- Initial believers
        INSERT INTO gossip_beliefs (gossip_id, crew_member_id, belief_strength, heard_from_crew_id)
        VALUES 
            (v_gossip1_id, v_crew3_id, 1.00, NULL), -- Origin always believes
            (v_gossip1_id, v_crew4_id, 0.65, v_crew3_id);
        
        -- Spread event
        INSERT INTO gossip_spread_events (
            gossip_id, spreader_crew_id, receiver_crew_id,
            location, conversation_type, transmission_fidelity, was_believed,
            content_version
        ) VALUES (
            v_gossip1_id, v_crew3_id, v_crew4_id,
            'mess_hall', 'whisper', 0.95, true,
            'Someone saw Chen and Rodriguez holding hands in the cargo bay last night.'
        );
        
        -- =====================================================
        -- COMPETENCE GOSSIP (WITH MUTATION)
        -- =====================================================
        INSERT INTO gossip_items (
            ship_id, gossip_type, priority, veracity,
            original_content, current_content,
            subject_crew_id, origin_crew_id, origin_type,
            mutation_count, performance_impact
        ) VALUES (
            v_ship_id,
            'competence',
            'normal',
            0.30,
            'Torres made a minor calculation error during the last jump.',
            'Torres completely botched the jump calculations and almost killed us all!',
            v_crew2_id,
            v_crew4_id,
            'witnessed',
            2,
            '{"morale": -15, "stress": 10}'::JSONB
        ) RETURNING id INTO v_gossip2_id;
        
        -- Mutation history
        INSERT INTO gossip_mutations (
            gossip_id, mutated_by_crew_id, mutation_type,
            previous_content, new_content, mutation_severity, veracity_change
        ) VALUES 
            (v_gossip2_id, v_crew1_id, 'exaggeration',
             'Torres made a minor calculation error during the last jump.',
             'Torres made a serious error that could have been dangerous.',
             0.40, -0.20),
            (v_gossip2_id, v_crew3_id, 'exaggeration',
             'Torres made a serious error that could have been dangerous.',
             'Torres completely botched the jump calculations and almost killed us all!',
             0.60, -0.30);
        
        -- =====================================================
        -- HEALTH GOSSIP
        -- =====================================================
        INSERT INTO gossip_items (
            ship_id, gossip_type, priority, veracity,
            original_content, current_content,
            subject_crew_id, origin_crew_id, origin_type,
            expires_at, performance_impact
        ) VALUES (
            v_ship_id,
            'health',
            'high',
            0.90,
            'The Captain hasn''t been sleeping well. Dark circles under their eyes.',
            'The Captain hasn''t been sleeping well. Dark circles under their eyes.',
            v_crew1_id,
            v_crew2_id,
            'witnessed',
            CURRENT_TIMESTAMP + INTERVAL '7 days',
            '{"stress": 5, "morale": -5}'::JSONB
        ) RETURNING id INTO v_gossip3_id;
        
        -- =====================================================
        -- SCANDAL GOSSIP
        -- =====================================================
        INSERT INTO gossip_items (
            ship_id, gossip_type, priority, veracity,
            original_content, current_content,
            subject_crew_id, origin_crew_id, origin_type,
            times_spread, performance_impact
        ) VALUES (
            v_ship_id,
            'scandal',
            'urgent',
            0.10,
            'Someone''s been stealing rations from the food stores. Security footage was mysteriously deleted.',
            'Someone''s been stealing rations from the food stores. Security footage was mysteriously deleted.',
            NULL, -- Unknown subject
            v_crew4_id,
            'fabricated',
            8,
            '{"morale": -20, "stress": 15, "relationships": -10}'::JSONB
        ) RETURNING id INTO v_gossip4_id;
        
        -- Everyone has heard this one
        INSERT INTO gossip_beliefs (gossip_id, crew_member_id, belief_strength, skepticism_level, times_heard)
        VALUES 
            (v_gossip4_id, v_crew1_id, 0.40, 0.70, 3),
            (v_gossip4_id, v_crew2_id, 0.20, 0.90, 2),
            (v_gossip4_id, v_crew3_id, 0.80, 0.30, 4),
            (v_gossip4_id, v_crew4_id, 1.00, 0.00, 1);
        
        -- =====================================================
        -- CONSPIRACY GOSSIP
        -- =====================================================
        INSERT INTO gossip_items (
            ship_id, gossip_type, priority, veracity,
            original_content, current_content,
            subject_crew_id, origin_crew_id, origin_type,
            performance_impact
        ) VALUES (
            v_ship_id,
            'conspiracy',
            'high',
            0.05,
            'The company is monitoring our personal communications. I found strange code in the comm system.',
            'The company is monitoring our personal communications. I found strange code in the comm system.',
            NULL,
            v_crew3_id,
            'fabricated',
            '{"stress": 20, "relationships": -15, "morale": -10}'::JSONB
        ) RETURNING id INTO v_gossip5_id;
        
        -- =====================================================
        -- PERFORMANCE IMPACTS
        -- =====================================================
        
        -- Apply some active impacts
        INSERT INTO gossip_performance_impacts (
            gossip_id, affected_crew_id, impact_type, impact_value, expires_at
        ) VALUES
            (v_gossip1_id, v_crew1_id, 'morale', 5, CURRENT_TIMESTAMP + INTERVAL '3 days'),
            (v_gossip1_id, v_crew2_id, 'morale', 5, CURRENT_TIMESTAMP + INTERVAL '3 days'),
            (v_gossip2_id, v_crew2_id, 'morale', -15, CURRENT_TIMESTAMP + INTERVAL '7 days'),
            (v_gossip2_id, v_crew2_id, 'stress', 10, CURRENT_TIMESTAMP + INTERVAL '7 days'),
            (v_gossip4_id, v_crew1_id, 'stress', 15, NULL),
            (v_gossip4_id, v_crew2_id, 'stress', 15, NULL),
            (v_gossip4_id, v_crew3_id, 'stress', 15, NULL);
        
        -- =====================================================
        -- GOSSIP NETWORKS
        -- =====================================================
        
        -- Create a gossip clique
        INSERT INTO gossip_networks (
            ship_id, network_type, core_members, peripheral_members,
            gossip_frequency_modifier, mutation_resistance
        ) VALUES (
            v_ship_id,
            'friendship',
            ARRAY[v_crew1_id, v_crew3_id]::UUID[],
            ARRAY[v_crew4_id]::UUID[],
            1.5,
            0.70
        );
        
        RAISE NOTICE 'Test gossip data created successfully';
    ELSE
        RAISE NOTICE 'Insufficient crew members for test gossip data';
    END IF;
END $$;

-- =====================================================
-- EXAMPLE QUERIES FOR TESTING
-- =====================================================

-- View all active gossip with believer counts
/*
SELECT 
    gossip_type,
    priority,
    LEFT(current_content, 60) || '...' as content_preview,
    believer_count,
    ROUND(avg_belief_strength, 2) as avg_belief,
    times_spread
FROM v_active_gossip
ORDER BY priority DESC, believer_count DESC;
*/

-- Check crew gossip participation
/*
SELECT 
    name,
    gossip_known,
    gossip_spread,
    ROUND(avg_belief_strength, 2) as avg_belief
FROM v_crew_gossip_stats
ORDER BY gossip_spread DESC;
*/

-- Find gossip ready to spread
/*
SELECT 
    gi.gossip_type,
    cm.name as believer,
    gb.belief_strength,
    gb.times_spread,
    LEFT(gi.current_content, 50) || '...' as content
FROM gossip_beliefs gb
JOIN gossip_items gi ON gb.gossip_id = gi.id
JOIN crew_members cm ON gb.crew_member_id = cm.id
WHERE gb.belief_strength > 0.6
AND gb.has_spread = false
AND gi.is_active = true
ORDER BY gi.priority DESC, gb.belief_strength DESC;
*/

-- Track gossip mutations
/*
SELECT 
    gi.gossip_type,
    gm.mutation_type,
    gm.mutation_severity,
    LEFT(gm.previous_content, 40) || '...' as before,
    LEFT(gm.new_content, 40) || '...' as after
FROM gossip_mutations gm
JOIN gossip_items gi ON gm.gossip_id = gi.id
ORDER BY gm.mutated_at DESC;
*/