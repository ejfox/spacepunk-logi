import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Set default skill levels
    const skillEngineering = skills.engineering || Math.floor(Math.random() * 50) + 10;
    const skillPiloting = skills.piloting || Math.floor(Math.random() * 50) + 10;
    const skillSocial = skills.social || Math.floor(Math.random() * 50) + 10;
    const skillCombat = skills.combat || Math.floor(Math.random() * 50) + 10;
    
    // Set default personality traits
    const traitBravery = personality.bravery || Math.floor(Math.random() * 60) + 20;
    const traitLoyalty = personality.loyalty || Math.floor(Math.random() * 60) + 20;
    const traitAmbition = personality.ambition || Math.floor(Math.random() * 60) + 20;
    const traitWorkEthic = personality.workEthic || Math.floor(Math.random() * 60) + 20;
    
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
      values.push(Math.max(0, Math.min(100, skills.engineering)));
    }
    if (skills.piloting !== undefined) {
      updates.push(`skill_piloting = $${paramIndex++}`);
      values.push(Math.max(0, Math.min(100, skills.piloting)));
    }
    if (skills.social !== undefined) {
      updates.push(`skill_social = $${paramIndex++}`);
      values.push(Math.max(0, Math.min(100, skills.social)));
    }
    if (skills.combat !== undefined) {
      updates.push(`skill_combat = $${paramIndex++}`);
      values.push(Math.max(0, Math.min(100, skills.combat)));
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
      values.push(Math.max(0, Math.min(100, status.health)));
    }
    if (status.morale !== undefined) {
      updates.push(`morale = $${paramIndex++}`);
      values.push(Math.max(0, Math.min(100, status.morale)));
    }
    if (status.fatigue !== undefined) {
      updates.push(`fatigue = $${paramIndex++}`);
      values.push(Math.max(0, Math.min(100, status.fatigue)));
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
    const value = Math.max(-100, Math.min(100, relationshipValue));
    
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
}