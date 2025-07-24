import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { gameRandom } from '../utils/seededRandom.js';
import { LLMConfig } from '../utils/llmConfig.js';
import fetch from 'node-fetch';
import { CrewGenerator } from '../generators/CrewGenerator.js';
import { CrewAvatarGenerator } from '../generators/CrewAvatarGenerator.js';

export class CrewRepository {
  constructor() {
    this.avatarGenerator = new CrewAvatarGenerator();
  }

  async create(crewData) {
    const {
      shipId = null,
      name,
      age = 25,
      homeworld = 'Unknown',
      culture = 'Unknown',
      skills = {},
      personality = {},
      parentIds = [],
      crew_type = 'general',
      crew_type_name = 'General Crew',
      crew_type_description = 'Basic crew member with no specializations',
      crew_bonuses = {},
      salary = 50
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
         parent_ids, crew_type, crew_type_name, crew_type_description, crew_bonuses, salary
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING id, ship_id, name, age, homeworld, culture, crew_type, crew_type_name, crew_type_description, crew_bonuses, salary, hired_at`,
      [id, shipId, name, age, homeworld, culture,
       skillEngineering, skillPiloting, skillSocial, skillCombat,
       traitBravery, traitLoyalty, traitAmbition, traitWorkEthic,
       parentIds, crew_type, crew_type_name, crew_type_description, JSON.stringify(crew_bonuses), salary]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT id, ship_id, name, age, homeworld, culture,
              skill_engineering, skill_piloting, skill_social, skill_combat,
              trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic,
              health, morale, fatigue, parent_ids,
              crew_type, crew_type_name, crew_type_description, crew_bonuses, salary,
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
              crew_type, crew_type_name, crew_type_description, crew_bonuses, salary,
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
              health, morale, fatigue,
              crew_type, crew_type_name, crew_type_description, crew_bonuses, salary, hiring_cost
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

  async generateAvailableCrew(count = 8) {
    const crewGenerator = new CrewGenerator();
    const crew = [];
    
    try {
      // Generate a mixed pool of crew types using CrewGenerator
      const generatedCrew = crewGenerator.generateCrewPool(count);
      
      for (const crewMember of generatedCrew) {
        // Insert into database
        const result = await this.create(crewMember);
        if (result) {
          crew.push(result);
        }
      }
      
      console.log(`Generated ${crew.length} crew members with specialized types`);
      return crew;
    } catch (error) {
      console.error('Error generating crew members:', error);
      return [];
    }
  }

  /**
   * Get crew bonuses that apply to ship operations
   * @param {string} shipId - The ship ID to get crew bonuses for
   * @returns {object} Combined bonuses from all crew members
   */
  async getCrewBonuses(shipId) {
    const crew = await this.findByShipId(shipId);
    
    const combinedBonuses = {
      fuel_efficiency: 0,
      fuel_decay_reduction: 0,
      illegal_cargo_profit: 0,
      heat_reduction_smuggling: 0,
      heat_reduction_politics: 0,
      reputation_bonus: 0
    };
    
    crew.forEach(crewMember => {
      if (crewMember.crew_bonuses) {
        const bonuses = typeof crewMember.crew_bonuses === 'string' 
          ? JSON.parse(crewMember.crew_bonuses) 
          : crewMember.crew_bonuses;
          
        Object.keys(bonuses).forEach(bonus => {
          if (combinedBonuses.hasOwnProperty(bonus)) {
            combinedBonuses[bonus] += bonuses[bonus];
          }
        });
      }
    });
    
    return combinedBonuses;
  }

  /**
   * Calculate total crew salaries for a ship
   * @param {string} shipId - The ship ID
   * @returns {number} Total salary cost per tick
   */
  async getTotalSalaries(shipId) {
    const crew = await this.findByShipId(shipId);
    return crew.reduce((total, crewMember) => total + (crewMember.salary || 50), 0);
  }

  /**
   * Enrich crew data with generated avatars
   * @param {Array|Object} crewData - Single crew member or array of crew members
   * @param {Array} playerMetaTraits - Player's meta-knowledge traits for progressive revelation
   * @returns {Array|Object} Crew data with avatar_svg field added
   */
  enrichWithAvatars(crewData, playerMetaTraits = []) {
    if (Array.isArray(crewData)) {
      // Batch generation for arrays
      const avatars = this.avatarGenerator.generateBatch(crewData, playerMetaTraits);
      return crewData.map(crew => ({
        ...crew,
        avatar_svg: avatars[crew.id]
      }));
    } else if (crewData && crewData.id) {
      // Single crew member
      return {
        ...crewData,
        avatar_svg: this.avatarGenerator.generateAvatar(crewData, playerMetaTraits)
      };
    }
    return crewData;
  }

  /**
   * Find crew by ship ID with avatars
   * @param {string} shipId - The ship ID
   * @param {Array} playerMetaTraits - Player's meta-knowledge traits
   * @returns {Array} Crew members with avatar SVGs
   */
  async findByShipIdWithAvatars(shipId, playerMetaTraits = []) {
    const crew = await this.findByShipId(shipId);
    return this.enrichWithAvatars(crew, playerMetaTraits);
  }
}