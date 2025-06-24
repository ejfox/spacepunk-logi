-- Gossip Network Test Data
-- Sample gossip entries, relationships, and spread events

-- Ensure we have proper crew relationships for gossip spreading
INSERT INTO crew_relationships (crew_member_id_1, crew_member_id_2, relationship_type, strength, formed_at)
SELECT 
    c1.id,
    c2.id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'friend'
        WHEN RANDOM() < 0.6 THEN 'neutral'
        WHEN RANDOM() < 0.8 THEN 'rival'
        ELSE 'colleague'
    END,
    RANDOM() * 0.7 + 0.3,
    CURRENT_TIMESTAMP - INTERVAL '30 days' * RANDOM()
FROM crew_members c1
CROSS JOIN crew_members c2
WHERE c1.id < c2.id
AND c1.ship_id = c2.ship_id
AND RANDOM() < 0.4
ON CONFLICT (crew_member_id_1, crew_member_id_2) DO NOTHING;

-- Romance gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, secondary_subject_id, content, original_content, severity, credibility)
SELECT 
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'romance'),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    c1.id,
    c2.id,
    'Saw ' || c1.name || ' and ' || c2.name || ' holding hands in the cargo bay after hours',
    'Saw ' || c1.name || ' and ' || c2.name || ' holding hands in the cargo bay after hours',
    3,
    0.65
FROM crew_members c1
JOIN crew_members c2 ON c1.ship_id = c2.ship_id AND c1.id != c2.id
WHERE c1.ship_id = 1
ORDER BY RANDOM()
LIMIT 1;

-- Incompetence gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility)
SELECT 
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'incompetence'),
    (SELECT id FROM crew_members WHERE ship_id = 1 AND position != 'Engineer' ORDER BY RANDOM() LIMIT 1),
    id,
    name || ' forgot to run diagnostics three shifts in a row. Navigation systems almost failed.',
    name || ' forgot to run diagnostics three shifts in a row. Navigation systems almost failed.',
    4,
    0.70
FROM crew_members
WHERE ship_id = 1 AND position = 'Engineer'
ORDER BY RANDOM()
LIMIT 1;

-- Theft gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility, mutation_count, is_mutated)
VALUES (
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'theft'),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    'Someone saw them taking extra ration packs from storage. Said it was "for emergencies"',
    'Noticed them grab an extra ration pack from storage',
    2,
    0.45,
    1,
    TRUE
);

-- Health gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility)
SELECT 
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'health'),
    (SELECT id FROM crew_members WHERE ship_id = 1 AND position = 'Medic' ORDER BY RANDOM() LIMIT 1),
    id,
    name || ' has been complaining about headaches. Probably from staring at those old terminals.',
    name || ' has been complaining about headaches. Probably from staring at those old terminals.',
    2,
    0.75
FROM crew_members
WHERE ship_id = 1
ORDER BY RANDOM()
LIMIT 1;

-- Conspiracy gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility)
VALUES (
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'conspiracy'),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM crew_members WHERE ship_id = 1 AND role = 'Captain' LIMIT 1),
    'Captain''s been having secret comms with corporate. Heard they''re planning route changes.',
    'Captain''s been having secret comms with corporate. Heard they''re planning route changes.',
    3,
    0.40
);

-- Achievement gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility)
SELECT 
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'achievement'),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    id,
    name || ' fixed the reactor coolant leak in half the standard time. Saved us a fortune.',
    name || ' fixed the reactor coolant leak in half the standard time. Saved us a fortune.',
    1,
    0.85
FROM crew_members
WHERE ship_id = 1 AND position = 'Engineer'
ORDER BY RANDOM()
LIMIT 1;

-- Vice gossip
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, content, original_content, severity, credibility)
SELECT 
    1,
    (SELECT id FROM gossip_types WHERE type_name = 'vice'),
    (SELECT id FROM crew_members WHERE ship_id = 1 ORDER BY RANDOM() LIMIT 1),
    id,
    'Found ' || name || ' passed out in the rec room again. Empty synthohol bottles everywhere.',
    'Found ' || name || ' passed out in the rec room again. Empty synthohol bottles everywhere.',
    4,
    0.55
FROM crew_members
WHERE ship_id = 1
ORDER BY RANDOM()
LIMIT 1;

-- Create beliefs for existing gossip
INSERT INTO gossip_beliefs (gossip_id, crew_member_id, belief_level, exposure_count, last_heard_from, reaction)
SELECT 
    g.id,
    cm.id,
    CASE 
        WHEN cm.id = g.originator_id THEN 1.0
        WHEN cm.id = g.subject_id THEN RANDOM() * 0.3
        ELSE RANDOM() * 0.8 + 0.2
    END,
    FLOOR(RANDOM() * 3 + 1)::INTEGER,
    CASE 
        WHEN cm.id != g.originator_id THEN g.originator_id
        ELSE NULL
    END,
    CASE 
        WHEN RANDOM() < 0.25 THEN 'shocked'
        WHEN RANDOM() < 0.5 THEN 'skeptical'
        WHEN RANDOM() < 0.75 THEN 'amused'
        ELSE 'indifferent'
    END
FROM gossip g
CROSS JOIN crew_members cm
WHERE g.ship_id = cm.ship_id
AND RANDOM() < 0.6
ON CONFLICT (gossip_id, crew_member_id) DO NOTHING;

-- Create spread events
INSERT INTO gossip_spread_events (gossip_id, spreader_id, recipient_id, spread_type, location, success, belief_change, tick_number)
SELECT 
    gb.gossip_id,
    gb.crew_member_id,
    cm.id,
    CASE 
        WHEN RANDOM() < 0.7 THEN 'casual'
        WHEN RANDOM() < 0.9 THEN 'whisper'
        ELSE 'confrontation'
    END,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'mess_hall'
        WHEN RANDOM() < 0.6 THEN 'corridor'
        WHEN RANDOM() < 0.8 THEN 'engineering'
        ELSE 'quarters'
    END,
    RANDOM() > 0.2,
    (RANDOM() * 0.4 - 0.1)::DECIMAL(3,2),
    FLOOR(RANDOM() * 100)::INTEGER
FROM gossip_beliefs gb
JOIN crew_members cm ON cm.ship_id = 1 AND cm.id != gb.crew_member_id
WHERE gb.belief_level > 0.5
AND gb.has_spread = FALSE
AND RANDOM() < 0.4
LIMIT 20;

-- Update spread flags
UPDATE gossip_beliefs
SET has_spread = TRUE
WHERE id IN (
    SELECT DISTINCT gb.id
    FROM gossip_beliefs gb
    JOIN gossip_spread_events gse ON gse.gossip_id = gb.gossip_id AND gse.spreader_id = gb.crew_member_id
);

-- Create network stats for crew members
INSERT INTO gossip_network_stats (ship_id, crew_member_id, gossip_centrality, credibility_score, discretion_score, gossip_created_count, gossip_spread_count, gossip_received_count)
SELECT 
    cm.ship_id,
    cm.id,
    (RANDOM() * 0.6 + 0.2)::DECIMAL(3,2),
    (RANDOM() * 0.7 + 0.3)::DECIMAL(3,2),
    (RANDOM() * 0.8 + 0.2)::DECIMAL(3,2),
    (SELECT COUNT(*) FROM gossip WHERE originator_id = cm.id),
    (SELECT COUNT(*) FROM gossip_spread_events WHERE spreader_id = cm.id),
    (SELECT COUNT(*) FROM gossip_spread_events WHERE recipient_id = cm.id)
FROM crew_members cm
WHERE cm.ship_id = 1
ON CONFLICT (ship_id, crew_member_id) DO NOTHING;

-- Add some performance impacts
INSERT INTO gossip_performance_impacts (gossip_id, affected_crew_id, impact_type, impact_value, duration_ticks, remaining_ticks)
SELECT 
    g.id,
    g.subject_id,
    CASE g.gossip_type_id
        WHEN (SELECT id FROM gossip_types WHERE type_name = 'romance') THEN 'focus'
        WHEN (SELECT id FROM gossip_types WHERE type_name = 'incompetence') THEN 'trust'
        WHEN (SELECT id FROM gossip_types WHERE type_name = 'theft') THEN 'morale'
        WHEN (SELECT id FROM gossip_types WHERE type_name = 'health') THEN 'productivity'
        ELSE 'morale'
    END,
    CASE 
        WHEN g.severity >= 4 THEN -0.3
        WHEN g.severity >= 3 THEN -0.2
        ELSE -0.1
    END,
    10,
    FLOOR(RANDOM() * 10)::INTEGER
FROM gossip g
WHERE g.severity >= 2
ON CONFLICT (gossip_id, affected_crew_id, impact_type) DO NOTHING;

-- Create a mutated gossip chain
INSERT INTO gossip (ship_id, gossip_type_id, originator_id, subject_id, secondary_subject_id, content, original_content, severity, credibility, mutation_count, is_mutated, parent_gossip_id)
SELECT 
    g.ship_id,
    g.gossip_type_id,
    (SELECT id FROM crew_members WHERE ship_id = g.ship_id ORDER BY RANDOM() LIMIT 1),
    g.subject_id,
    g.secondary_subject_id,
    CASE 
        WHEN g.gossip_type_id = (SELECT id FROM gossip_types WHERE type_name = 'romance') 
        THEN REPLACE(g.content, 'holding hands', 'kissing passionately')
        ELSE g.content || ' And apparently it''s been happening for weeks!'
    END,
    g.original_content,
    LEAST(5, g.severity + 1),
    g.credibility * 0.8,
    g.mutation_count + 1,
    TRUE,
    g.id
FROM gossip g
WHERE g.gossip_type_id IN (SELECT id FROM gossip_types WHERE type_name IN ('romance', 'incompetence'))
LIMIT 2;