import { query } from '../db/index.js';

export class TraitService {
  constructor() {
    this.traitCache = new Map(); // Cache trait definitions for performance
  }

  /**
   * Get all trait definitions, optionally filtered by level/category
   */
  async getTraitDefinitions(filters = {}) {
    let whereClause = 'WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.level) {
      whereClause += ` AND trait_level = $${paramCount}`;
      params.push(filters.level);
      paramCount++;
    }

    if (filters.category) {
      whereClause += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    const result = await query(`
      SELECT * FROM trait_definitions 
      ${whereClause}
      ORDER BY category, name
    `, params);

    return result.rows;
  }

  /**
   * Get traits for a specific entity (crew member)
   */
  async getEntityTraits(entityId, entityType = 'crew_member') {
    const result = await query(`
      SELECT 
        et.*,
        td.name,
        td.description,
        td.flavor_text,
        td.category,
        td.stat_modifiers,
        td.special_abilities,
        td.dialogue_tags
      FROM entity_traits et
      JOIN trait_definitions td ON et.trait_definition_id = td.id
      WHERE et.entity_id = $1 
        AND et.entity_type = $2 
        AND et.is_active = true
      ORDER BY td.category, td.name
    `, [entityId, entityType]);

    return result.rows;
  }

  /**
   * Assign a random set of traits to a new crew member
   */
  async assignRandomTraits(crewMemberId, numTraits = 3) {
    try {
      // Get Level 1 traits for random assignment
      const availableTraits = await this.getTraitDefinitions({ level: 1 });
      
      if (availableTraits.length === 0) {
        console.warn('No traits available for assignment');
        return [];
      }

      // Weighted random selection
      const selectedTraits = this.selectRandomTraits(availableTraits, numTraits);
      const assignedTraits = [];

      for (const trait of selectedTraits) {
        const assigned = await this.assignTrait(
          crewMemberId, 
          trait.id, 
          'generation',
          { source: 'crew_creation' }
        );
        if (assigned) {
          assignedTraits.push(assigned);
        }
      }

      console.log(`Assigned ${assignedTraits.length} traits to crew member ${crewMemberId}`);
      return assignedTraits;

    } catch (error) {
      console.error('Error assigning random traits:', error);
      return [];
    }
  }

  /**
   * Assign a specific trait to an entity
   */
  async assignTrait(entityId, traitDefinitionId, acquisitionMethod = 'manual', details = {}) {
    try {
      // Check if entity already has this trait
      const existing = await query(`
        SELECT id FROM entity_traits 
        WHERE entity_id = $1 AND trait_definition_id = $2 AND is_active = true
      `, [entityId, traitDefinitionId]);

      if (existing.rows.length > 0) {
        console.log(`Entity ${entityId} already has trait ${traitDefinitionId}`);
        return null;
      }

      // Get trait definition for validation
      const traitDef = await query(`
        SELECT * FROM trait_definitions WHERE id = $1 AND is_active = true
      `, [traitDefinitionId]);

      if (traitDef.rows.length === 0) {
        throw new Error('Trait definition not found');
      }

      const trait = traitDef.rows[0];

      // Check for conflicting traits
      if (trait.conflicting_traits && trait.conflicting_traits.length > 0) {
        const conflicts = await query(`
          SELECT td.name FROM entity_traits et
          JOIN trait_definitions td ON et.trait_definition_id = td.id
          WHERE et.entity_id = $1 
            AND et.is_active = true 
            AND td.id = ANY($2)
        `, [entityId, trait.conflicting_traits]);

        if (conflicts.rows.length > 0) {
          throw new Error(`Cannot assign trait: conflicts with ${conflicts.rows[0].name}`);
        }
      }

      // Assign the trait
      const result = await query(`
        INSERT INTO entity_traits (
          entity_id,
          entity_type,
          trait_definition_id,
          trait_level,
          trait_strength,
          acquired_through,
          acquired_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        entityId,
        'crew_member',
        traitDefinitionId,
        trait.trait_level,
        100.0, // Full strength initially
        acquisitionMethod,
        JSON.stringify(details)
      ]);

      // Log the acquisition
      await query(`
        INSERT INTO trait_evolution_log (
          entity_trait_id,
          evolution_type,
          new_value,
          trigger_event,
          details
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        result.rows[0].id,
        'gained',
        100.0,
        acquisitionMethod,
        JSON.stringify(details)
      ]);

      console.log(`Assigned trait ${trait.name} to entity ${entityId}`);
      return result.rows[0];

    } catch (error) {
      console.error('Error assigning trait:', error);
      throw error;
    }
  }

  /**
   * Remove a trait from an entity
   */
  async removeTrait(entityId, traitDefinitionId, reason = 'manual') {
    try {
      const result = await query(`
        UPDATE entity_traits 
        SET is_active = false
        WHERE entity_id = $1 AND trait_definition_id = $2 AND is_active = true
        RETURNING *
      `, [entityId, traitDefinitionId]);

      if (result.rows.length > 0) {
        // Log the removal
        await query(`
          INSERT INTO trait_evolution_log (
            entity_trait_id,
            evolution_type,
            old_value,
            new_value,
            trigger_event
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          result.rows[0].id,
          'lost',
          result.rows[0].trait_strength,
          0,
          reason
        ]);

        console.log(`Removed trait from entity ${entityId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing trait:', error);
      throw error;
    }
  }

  /**
   * Calculate effective stat modifiers from all traits
   */
  async calculateTraitModifiers(entityId) {
    const traits = await this.getEntityTraits(entityId);
    const modifiers = {};

    for (const trait of traits) {
      if (trait.stat_modifiers) {
        const statMods = typeof trait.stat_modifiers === 'string' 
          ? JSON.parse(trait.stat_modifiers) 
          : trait.stat_modifiers;

        // Apply trait strength multiplier
        const strengthMultiplier = trait.trait_strength / 100.0;

        for (const [stat, value] of Object.entries(statMods)) {
          if (!modifiers[stat]) modifiers[stat] = 0;
          modifiers[stat] += Math.round(value * strengthMultiplier);
        }
      }
    }

    return modifiers;
  }

  /**
   * Weighted random trait selection
   */
  selectRandomTraits(availableTraits, numTraits) {
    const selected = [];
    const remaining = [...availableTraits];

    for (let i = 0; i < numTraits && remaining.length > 0; i++) {
      // Calculate total weight
      const totalWeight = remaining.reduce((sum, trait) => sum + trait.rarity_weight, 0);
      
      // Random selection based on weight
      let randomValue = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let j = 0; j < remaining.length; j++) {
        randomValue -= remaining[j].rarity_weight;
        if (randomValue <= 0) {
          selectedIndex = j;
          break;
        }
      }

      const selectedTrait = remaining[selectedIndex];
      selected.push(selectedTrait);

      // Remove selected trait and any conflicting traits
      remaining.splice(selectedIndex, 1);
      
      if (selectedTrait.conflicting_traits) {
        for (let k = remaining.length - 1; k >= 0; k--) {
          if (selectedTrait.conflicting_traits.includes(remaining[k].id)) {
            remaining.splice(k, 1);
          }
        }
      }
    }

    return selected;
  }

  /**
   * Get trait statistics for debugging/admin
   */
  async getTraitStatistics() {
    const result = await query(`
      SELECT 
        td.category,
        td.trait_level,
        COUNT(et.id) as assignment_count,
        AVG(et.trait_strength) as avg_strength
      FROM trait_definitions td
      LEFT JOIN entity_traits et ON td.id = et.trait_definition_id AND et.is_active = true
      WHERE td.is_active = true
      GROUP BY td.category, td.trait_level
      ORDER BY td.trait_level, td.category
    `);

    return result.rows;
  }

  /**
   * Update existing crew members to have traits (migration helper)
   */
  async assignTraitsToExistingCrew() {
    try {
      // Get crew members without traits
      const crewWithoutTraits = await query(`
        SELECT cm.id 
        FROM crew_members cm
        LEFT JOIN entity_traits et ON cm.id = et.entity_id AND et.is_active = true
        WHERE et.id IS NULL
        AND cm.died_at IS NULL
      `);

      console.log(`Found ${crewWithoutTraits.rows.length} crew members without traits`);

      let assigned = 0;
      for (const crew of crewWithoutTraits.rows) {
        const traits = await this.assignRandomTraits(crew.id, 2); // Give 2 traits to existing crew
        if (traits.length > 0) {
          assigned++;
        }
      }

      console.log(`Assigned traits to ${assigned} existing crew members`);
      return assigned;

    } catch (error) {
      console.error('Error assigning traits to existing crew:', error);
      throw error;
    }
  }
}

export default TraitService;