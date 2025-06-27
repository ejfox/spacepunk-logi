import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { gameRandom } from '../utils/seededRandom.js';
import { LLMConfig } from '../utils/llmConfig.js';
import fetch from 'node-fetch';

export class CrewRepository {
  async create(crewData) {
    const {
      shipId = null,
      name,
      age = 25,
      homeworld = 'Unknown',
      culture = 'Unknown',
      skills = {},
      personality = {},
      parentIds = []
    } = crewData;
    
    const id = uuidv4();
    
    // Set default skill levels using seeded random
    const skillEngineering = skills.engineering || gameRandom.chance.integer({ min: 10, max: 60 });
    const skillPiloting = skills.piloting || gameRandom.chance.integer({ min: 10, max: 60 });
    const skillSocial = skills.social || gameRandom.chance.integer({ min: 10, max: 60 });
    const skillCombat = skills.combat || gameRandom.chance.integer({ min: 10, max: 60 });
    
    // Set default personality traits using seeded random
    const traitBravery = personality.bravery || gameRandom.chance.integer({ min: 20, max: 80 });
    const traitLoyalty = personality.loyalty || gameRandom.chance.integer({ min: 20, max: 80 });
    const traitAmbition = personality.ambition || gameRandom.chance.integer({ min: 20, max: 80 });
    const traitWorkEthic = personality.workEthic || gameRandom.chance.integer({ min: 20, max: 80 });
    
    const result = await query(
      `INSERT INTO crew_members (
         id, ship_id, name, age, homeworld, culture,
         skill_engineering, skill_piloting, skill_social, skill_combat,
         trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
         parent_ids
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, ship_id, name, age, homeworld, culture, hired_at`,
      [id, shipId, name, age, homeworld, culture,
       skillEngineering, skillPiloting, skillSocial, skillCombat,
       traitBravery, traitLoyalty, traitAmbition, traitWorkEthic,
       parentIds]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT id, ship_id, name, age, homeworld, culture,
              skill_engineering, skill_piloting, skill_social, skill_combat,
              trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
              health, morale, fatigue, parent_ids,
              hired_at, created_at, updated_at, died_at
       FROM crew_members 
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async findByShipId(shipId) {
    // Validate UUID format to prevent database errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shipId)) {
      console.warn(`Invalid ship ID format: ${shipId}`);
      return [];
    }

    const result = await query(
      `SELECT id, ship_id, name, age, homeworld, culture,
              skill_engineering, skill_piloting, skill_social, skill_combat,
              trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
              health, morale, fatigue, parent_ids,
              hired_at, created_at, updated_at, died_at
       FROM crew_members 
       WHERE ship_id = $1 AND died_at IS NULL
       ORDER BY hired_at ASC`,
      [shipId]
    );
    
    return result.rows;
  }

  async findActiveCrew() {
    const result = await query(
      `SELECT id, ship_id, name, age, homeworld, culture,
              skill_engineering, skill_piloting, skill_social, skill_combat,
              trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
              health, morale, fatigue, parent_ids,
              hired_at, created_at, updated_at
       FROM crew_members 
       WHERE ship_id IS NOT NULL AND died_at IS NULL
       ORDER BY hired_at ASC`
    );
    
    return result.rows;
  }

  async findAvailableForHire(limit = 20) {
    const result = await query(
      `SELECT id, name, age, homeworld, culture,
              skill_engineering, skill_piloting, skill_social, skill_combat,
              trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
              health, morale, fatigue
       FROM crew_members 
       WHERE ship_id IS NULL AND died_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  async assignToShip(id, shipId) {
    const result = await query(
      `UPDATE crew_members 
       SET ship_id = $2, hired_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND died_at IS NULL
       RETURNING id, name, ship_id, hired_at`,
      [id, shipId]
    );
    
    return result.rows[0] || null;
  }

  async removeFromShip(id) {
    const result = await query(
      `UPDATE crew_members 
       SET ship_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND died_at IS NULL
       RETURNING id, name, ship_id`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async updateSkills(id, skills) {
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (skills.engineering !== undefined) {
      updates.push(`skill_engineering = $${paramIndex++}`);
      const clampedEng = skills.engineering < 0 ? 0 : (skills.engineering > 100 ? 100 : skills.engineering);
      values.push(clampedEng);
    }
    if (skills.piloting !== undefined) {
      updates.push(`skill_piloting = $${paramIndex++}`);
      const clampedPilot = skills.piloting < 0 ? 0 : (skills.piloting > 100 ? 100 : skills.piloting);
      values.push(clampedPilot);
    }
    if (skills.social !== undefined) {
      updates.push(`skill_social = $${paramIndex++}`);
      const clampedSocial = skills.social < 0 ? 0 : (skills.social > 100 ? 100 : skills.social);
      values.push(clampedSocial);
    }
    if (skills.combat !== undefined) {
      updates.push(`skill_combat = $${paramIndex++}`);
      const clampedCombat = skills.combat < 0 ? 0 : (skills.combat > 100 ? 100 : skills.combat);
      values.push(clampedCombat);
    }
    
    if (updates.length === 0) return null;
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const result = await query(
      `UPDATE crew_members 
       SET ${updates.join(', ')}
       WHERE id = $1 AND died_at IS NULL
       RETURNING id, name, skill_engineering, skill_piloting, skill_social, skill_combat`,
      values
    );
    
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (status.health !== undefined) {
      updates.push(`health = $${paramIndex++}`);
      const clampedHealth = status.health < 0 ? 0 : (status.health > 100 ? 100 : status.health);
      values.push(clampedHealth);
    }
    if (status.morale !== undefined) {
      updates.push(`morale = $${paramIndex++}`);
      const clampedMorale = status.morale < 0 ? 0 : (status.morale > 100 ? 100 : status.morale);
      values.push(clampedMorale);
    }
    if (status.fatigue !== undefined) {
      updates.push(`fatigue = $${paramIndex++}`);
      const clampedFatigue = status.fatigue < 0 ? 0 : (status.fatigue > 100 ? 100 : status.fatigue);
      values.push(clampedFatigue);
    }
    
    if (updates.length === 0) return null;
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const result = await query(
      `UPDATE crew_members 
       SET ${updates.join(', ')}
       WHERE id = $1 AND died_at IS NULL
       RETURNING id, name, health, morale, fatigue`,
      values
    );
    
    return result.rows[0] || null;
  }

  async kill(id) {
    const result = await query(
      `UPDATE crew_members 
       SET died_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
           health = 0
       WHERE id = $1
       RETURNING id, name, died_at`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async addMemory(crewId, eventType, description, sentiment = 0, relatedEntityId = null, relatedEntityType = null) {
    const memoryId = uuidv4();
    
    const result = await query(
      `INSERT INTO crew_memories (
         id, crew_member_id, event_type, event_description, sentiment,
         related_entity_id, related_entity_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, event_type, event_description, sentiment, occurred_at`,
      [memoryId, crewId, eventType, description, sentiment, relatedEntityId, relatedEntityType]
    );
    
    return result.rows[0];
  }

  async getMemories(crewId, limit = 50) {
    const result = await query(
      `SELECT id, event_type, event_description, sentiment,
              related_entity_id, related_entity_type, occurred_at
       FROM crew_memories 
       WHERE crew_member_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2`,
      [crewId, limit]
    );
    
    return result.rows;
  }

  async updateRelationship(crewId1, crewId2, relationshipValue) {
    const value = relationshipValue < -100 ? -100 : (relationshipValue > 100 ? 100 : relationshipValue);
    
    const result = await query(
      `INSERT INTO crew_relationships (crew_member_id, other_crew_member_id, relationship_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (crew_member_id, other_crew_member_id)
       DO UPDATE SET 
         relationship_value = $3,
         last_interaction = CURRENT_TIMESTAMP
       RETURNING crew_member_id, other_crew_member_id, relationship_value`,
      [crewId1, crewId2, value]
    );
    
    return result.rows[0];
  }

  async getRelationships(crewId) {
    const result = await query(
      `SELECT cr.other_crew_member_id, cr.relationship_value, cr.last_interaction,
              cm.name as other_crew_name
       FROM crew_relationships cr
       JOIN crew_members cm ON cm.id = cr.other_crew_member_id
       WHERE cr.crew_member_id = $1
       ORDER BY cr.relationship_value DESC`,
      [crewId]
    );
    
    return result.rows;
  }

  async getCrewWithRelationships(shipId) {
    const result = await query(
      `SELECT 
         cm.*,
         json_agg(
           json_build_object(
             'other_crew_id', cr.other_crew_member_id,
             'other_crew_name', cm2.name,
             'relationship_value', cr.relationship_value,
             'last_interaction', cr.last_interaction
           )
         ) FILTER (WHERE cr.other_crew_member_id IS NOT NULL) as relationships
       FROM crew_members cm
       LEFT JOIN crew_relationships cr ON cr.crew_member_id = cm.id
       LEFT JOIN crew_members cm2 ON cm2.id = cr.other_crew_member_id
       WHERE cm.ship_id = $1 AND cm.died_at IS NULL
       GROUP BY cm.id
       ORDER BY cm.hired_at ASC`,
      [shipId]
    );
    
    return result.rows;
  }

  async generateAvailableCrew(count = 5) {
    const llmConfig = new LLMConfig();
    const crew = [];
    
    const homeworlds = [
      'Earth', 'Mars', 'Luna', 'Europa', 'Titan', 'Callisto', 'Ganymede',
      'Phobos', 'Asteroid-7', 'Ceres Station', 'Proxima Base', 'New Geneva'
    ];
    
    for (let i = 0; i < count; i++) {
      try {
        // Use chance.js for base attributes
        const { name, culture } = gameRandom.generateCrewName();
        const homeworld = gameRandom.chance.pickone(homeworlds);
        const age = gameRandom.chance.integer({ min: 22, max: 55 });
        const skills = gameRandom.generateCrewSkills();
        const traits = gameRandom.generateCrewTraits();
        
        // Generate LLM backstory and personality
        let backstory = "Standard personnel file.";
        let employmentNotes = "No additional notes.";
        
        if (llmConfig.isConfigured()) {
          const prompt = `You are HR personnel database for Spacepunk Logistics. Generate corporate backstory for:

NAME: ${name}
AGE: ${age}
HOMEWORLD: ${homeworld}
CULTURE: ${culture}
SKILLS: Engineering ${skills.engineering}, Piloting ${skills.piloting}, Social ${skills.social}, Combat ${skills.combat}
PERSONALITY: ${traits.extroversion > 50 ? 'Extroverted' : 'Introverted'}, ${traits.thinking > 50 ? 'Analytical' : 'People-focused'}, ${traits.sensing > 50 ? 'Practical' : 'Visionary'}
ARCHETYPE: ${traits.dominant_archetype} (primary personality driver)

Write 2-3 sentences of corporate HR backstory in cynical space trucking tone. Include previous employment, why they're available for hire, and one memorable workplace incident. Subtly reference their ${traits.dominant_archetype} archetype in corporate euphemisms.

ARCHETYPE CONTEXT:
- innocent: naive optimism, seeks harmony
- sage: wisdom-seeking, analytical
- explorer: freedom-loving, independent  
- outlaw: rule-breaking, revolutionary
- magician: transformative, visionary
- hero: courageous, determined
- lover: relationship-focused, passionate
- jester: humor, disrupts status quo
- caregiver: nurturing, protective
- creator: innovative, artistic
- ruler: leadership, control
- orphan: realistic, down-to-earth

Format as JSON:
{
  "backstory": "...",
  "employment_notes": "..."
}`;

          try {
            const response = await fetch(llmConfig.getEndpoint(), {
              method: 'POST',
              headers: llmConfig.config.headers,
              body: JSON.stringify({
                model: llmConfig.config.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.8
              })
            });

            if (response.ok) {
              const data = await response.json();
              const content = data.choices[0].message.content;
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                backstory = parsed.backstory || backstory;
                employmentNotes = parsed.employment_notes || employmentNotes;
              }
            }
          } catch (llmError) {
            console.log('LLM generation failed, using chance.js fallback');
          }
        }
        
        // Calculate hiring cost based on total skills using chance.js  
        const totalSkills = Object.values(skills).reduce((sum, skill) => sum + skill, 0);
        const baseCost = 300 + (totalSkills / 4) * 3;
        const costVariation = gameRandom.chance.integer({ min: -50, max: 50 });
        const hiringCost = baseCost + costVariation;
        
        const crewMember = {
          id: uuidv4(),
          name,
          age,
          homeworld,
          culture,
          cultural_background: culture,
          skill_engineering: skills.engineering,
          skill_piloting: skills.piloting,
          skill_social: skills.social,
          skill_combat: skills.combat,
          trait_bravery: traits.bravery,
          trait_loyalty: traits.loyalty,
          trait_ambition: traits.ambition,
          trait_work_ethic: traits.work_ethic,
          trait_extroversion: traits.extroversion,
          trait_thinking: traits.thinking,
          trait_sensing: traits.sensing,
          trait_judging: traits.judging,
          archetype_innocent: traits.innocent,
          archetype_sage: traits.sage,
          archetype_explorer: traits.explorer,
          archetype_outlaw: traits.outlaw,
          archetype_magician: traits.magician,
          archetype_hero: traits.hero,
          archetype_lover: traits.lover,
          archetype_jester: traits.jester,
          archetype_caregiver: traits.caregiver,
          archetype_creator: traits.creator,
          archetype_ruler: traits.ruler,
          archetype_orphan: traits.orphan,
          dominant_archetype: traits.dominant_archetype,
          hiring_cost: hiringCost,
          health: gameRandom.chance.integer({ min: 90, max: 100 }),
          morale: gameRandom.chance.integer({ min: 60, max: 90 }),
          fatigue: gameRandom.chance.integer({ min: 10, max: 30 }),
          backstory,
          employment_notes: employmentNotes
        };
        
        crew.push(crewMember);
      } catch (error) {
        console.error('Error generating crew member:', error);
        // Skip this crew member if generation fails completely
      }
    }
    
    return crew;
  }
}