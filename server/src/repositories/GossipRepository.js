import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import SeededRandom from '../utils/seededRandom.js';

/**
 * Repository for managing the gossip system
 * 
 * This class handles all gossip-related database operations including:
 * - Creating and spreading gossip between crew members
 * - Tracking belief levels and mutation of gossip content
 * - Applying performance impacts from gossip
 * - Managing gossip networks and spread patterns
 * 
 * All randomization uses SeededRandom for deterministic behavior
 */
export class GossipRepository {
  constructor(seed = null) {
    this.random = new SeededRandom(seed);
  }

  /**
   * Create a new piece of gossip
   * @param {Object} gossipData - The gossip information
   * @param {string} gossipData.shipId - Ship where gossip originates
   * @param {string} gossipData.gossipType - Type of gossip (romance, scandal, etc)
   * @param {string} gossipData.content - The gossip content
   * @param {string} gossipData.subjectCrewId - Primary subject of the gossip
   * @param {string} gossipData.originCrewId - Who started the gossip
   * @param {string} gossipData.originType - How gossip originated (witnessed, overheard, etc)
   * @param {Array<string>} gossipData.additionalSubjects - Other crew involved
   * @param {string} gossipData.priority - Gossip priority level
   * @returns {Promise<Object>} The created gossip item
   */
  async createGossip(gossipData) {
    const {
      shipId,
      gossipType,
      content,
      subjectCrewId,
      originCrewId,
      originType = 'overheard',
      additionalSubjects = [],
      priority = null
    } = gossipData;

    // Get gossip type configuration
    const typeConfig = await this.getGossipTypeConfig(gossipType);
    
    // Generate seeded veracity based on origin type
    const veracityRanges = {
      witnessed: { min: 0.7, max: 0.95 },
      overheard: { min: 0.4, max: 0.8 },
      fabricated: { min: 0.1, max: 0.4 },
      system: { min: 0.9, max: 1.0 }
    };
    
    const range = veracityRanges[originType] || veracityRanges.overheard;
    const veracity = this.random.floating(range);

    // Calculate expiry date if configured
    let expiresAt = null;
    if (typeConfig.default_expiry_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + typeConfig.default_expiry_days);
      expiresAt = expiryDate;
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gossip_items (
        id, ship_id, gossip_type, priority, veracity,
        original_content, current_content,
        subject_crew_id, additional_subjects,
        origin_crew_id, origin_type,
        expires_at, performance_impact
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id, shipId, gossipType, 
        priority || typeConfig.default_priority,
        veracity,
        content, content, // original and current start the same
        subjectCrewId, additionalSubjects,
        originCrewId, originType,
        expiresAt,
        typeConfig.performance_impact_template || {}
      ]
    );

    const gossipItem = result.rows[0];

    // Create initial belief for the originator
    if (originCrewId) {
      await this.updateBelief(id, originCrewId, {
        beliefStrength: originType === 'witnessed' ? 1.0 : 0.8,
        heardFrom: null
      });
    }

    return gossipItem;
  }

  /**
   * Attempt to spread gossip from one crew member to another
   * @param {string} gossipId - The gossip to spread
   * @param {string} spreaderId - Who is spreading the gossip
   * @param {string} receiverId - Who is receiving the gossip
   * @param {Object} context - Additional context for the spread
   * @returns {Promise<Object|null>} Spread event if successful, null if failed
   */
  async attemptSpread(gossipId, spreaderId, receiverId, context = {}) {
    const {
      location = 'corridor',
      conversationType = 'casual',
      relationshipValue = null
    } = context;

    // Get gossip details
    const gossipResult = await query(
      'SELECT * FROM gossip_items WHERE id = $1 AND is_active = true',
      [gossipId]
    );
    
    if (!gossipResult.rows.length) {
      throw new Error('Gossip not found or inactive');
    }
    
    const gossip = gossipResult.rows[0];

    // Get or calculate relationship value
    let relationship = relationshipValue;
    if (relationship === null) {
      const relResult = await query(
        `SELECT relationship_value FROM crew_relationships 
         WHERE crew_member_id = $1 AND other_crew_member_id = $2`,
        [spreaderId, receiverId]
      );
      relationship = relResult.rows[0]?.relationship_value || 0;
    }

    // Calculate spread probability
    const probability = this.random.calculateSpreadProbability(
      relationship,
      relationship, // Target relationship for now
      gossip.gossip_type
    );

    // Add context modifiers
    const contextModifiers = {
      whisper: 0.1,
      argument: -0.2,
      meeting: 0.05,
      casual: 0
    };
    
    const finalProbability = Math.max(0, Math.min(1, 
      probability + (contextModifiers[conversationType] || 0)
    ));

    // Attempt spread
    if (!this.random.bool(finalProbability * 100)) {
      return null; // Spread failed
    }

    // Get current gossip content (may have mutated)
    const beliefResult = await query(
      'SELECT version_heard FROM gossip_beliefs WHERE gossip_id = $1 AND crew_member_id = $2',
      [gossipId, spreaderId]
    );
    
    const contentVersion = beliefResult.rows[0]?.version_heard || gossip.current_content;

    // Calculate transmission fidelity
    const fidelity = this.random.floating({ min: 0.7, max: 1.0 });
    
    // Determine if mutation occurs
    const typeConfig = await this.getGossipTypeConfig(gossip.gossip_type);
    const shouldMutate = this.random.bool(typeConfig.mutation_rate * 100);
    
    let finalContent = contentVersion;
    if (shouldMutate && fidelity < 0.9) {
      // Create mutation
      const mutation = await this.mutateGossip(gossipId, receiverId, contentVersion);
      finalContent = mutation.new_content;
    }

    // Create spread event
    const spreadEventId = uuidv4();
    const eventResult = await query(
      `INSERT INTO gossip_spread_events (
        id, gossip_id, spreader_crew_id, receiver_crew_id,
        location, conversation_type, transmission_fidelity,
        was_believed, content_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        spreadEventId, gossipId, spreaderId, receiverId,
        location, conversationType, fidelity,
        true, // Belief calculated separately
        finalContent
      ]
    );

    // Update receiver's belief
    await this.updateBelief(gossipId, receiverId, {
      beliefStrength: fidelity * 0.8, // Initial belief based on fidelity
      heardFrom: spreaderId,
      versionHeard: finalContent
    });

    return eventResult.rows[0];
  }

  /**
   * Create a mutated version of gossip
   * @param {string} gossipId - The gossip to mutate
   * @param {string} mutatorId - Who is mutating the gossip
   * @param {string} currentContent - Current version of the content
   * @returns {Promise<Object>} The mutation record
   */
  async mutateGossip(gossipId, mutatorId, currentContent) {
    // Get gossip type for mutation patterns
    const gossipResult = await query(
      'SELECT gossip_type, veracity FROM gossip_items WHERE id = $1',
      [gossipId]
    );
    
    const { gossip_type, veracity } = gossipResult.rows[0];

    // Determine mutation type based on gossip type
    const mutationTypes = {
      romance: ['exaggeration', 'detail_loss', 'reinterpretation'],
      scandal: ['exaggeration', 'exaggeration', 'detail_addition'], // More likely to exaggerate
      competence: ['minimization', 'detail_loss', 'reinterpretation'],
      health: ['exaggeration', 'detail_loss', 'minimization'],
      conspiracy: ['detail_addition', 'reinterpretation', 'exaggeration']
    };

    const typeOptions = mutationTypes[gossip_type] || ['detail_loss', 'reinterpretation'];
    const mutationType = this.random.chance.pickone(typeOptions);

    // Apply mutation to content
    const mutations = {
      exaggeration: (content) => {
        const exaggerations = [
          'allegedly', 'supposedly', 'I heard that',
          'apparently', 'word is that', 'rumor has it'
        ];
        const prefix = this.random.chance.pickone(exaggerations);
        return `${prefix} ${content} (and it's getting worse)`;
      },
      minimization: (content) => {
        const minimizers = [
          'just', 'only', 'merely', 'simply'
        ];
        const word = this.random.chance.pickone(minimizers);
        return content.replace(/\b(is|was|has|had)\b/, `$1 ${word}`);
      },
      detail_loss: (content) => {
        // Remove some details (simulate forgetting)
        const words = content.split(' ');
        if (words.length > 10) {
          const removeCount = this.random.integer({ min: 1, max: 3 });
          for (let i = 0; i < removeCount; i++) {
            const idx = this.random.integer({ min: 3, max: words.length - 3 });
            words[idx] = '...';
          }
        }
        return words.join(' ').replace(/\.\.\. \.\.\./, '...');
      },
      detail_addition: (content) => {
        const additions = [
          'and there was yelling', 'in front of everyone',
          'multiple times', 'and it was deliberate',
          'behind closed doors', 'when nobody was looking'
        ];
        const addition = this.random.chance.pickone(additions);
        return `${content} (${addition})`;
      },
      reinterpretation: (content) => {
        const reinterpretations = [
          'which really means', 'but what actually happened was',
          'though some say', 'but the real story is'
        ];
        const phrase = this.random.chance.pickone(reinterpretations);
        return `${content.substring(0, content.length/2)}... ${phrase} ${content.substring(content.length/2)}`;
      }
    };

    const mutationFn = mutations[mutationType] || mutations.detail_loss;
    const newContent = mutationFn(currentContent);

    // Calculate mutation severity
    const contentDiff = this.calculateContentDifference(currentContent, newContent);
    const severity = Math.min(1.0, contentDiff / 100);

    // Veracity always decreases with mutation
    const veracityChange = -1 * this.random.floating({ min: 0.05, max: 0.2 });

    // Create mutation record
    const mutationId = uuidv4();
    const result = await query(
      `INSERT INTO gossip_mutations (
        id, gossip_id, mutated_by_crew_id, mutation_type,
        previous_content, new_content, mutation_severity, veracity_change
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        mutationId, gossipId, mutatorId, mutationType,
        currentContent, newContent, severity, veracityChange
      ]
    );

    // Update gossip item with new content and veracity
    await query(
      `UPDATE gossip_items 
       SET current_content = $1, 
           veracity = GREATEST(0, LEAST(1, veracity + $2)),
           mutation_count = mutation_count + 1,
           last_mutated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newContent, veracityChange, gossipId]
    );

    return result.rows[0];
  }

  /**
   * Update a crew member's belief in a piece of gossip
   * @param {string} gossipId - The gossip item
   * @param {string} crewId - The crew member
   * @param {Object} beliefData - Belief information
   * @returns {Promise<Object>} The belief record
   */
  async updateBelief(gossipId, crewId, beliefData) {
    const {
      beliefStrength,
      heardFrom = null,
      versionHeard = null,
      increaseOnly = false
    } = beliefData;

    // Get crew member's personality for skepticism calculation
    const crewResult = await query(
      `SELECT trait_loyalty, trait_work_ethic, trait_ambition 
       FROM crew_members WHERE id = $1`,
      [crewId]
    );
    
    const crew = crewResult.rows[0];
    
    // Calculate skepticism based on personality
    // High loyalty = less skeptical, High ambition = more skeptical
    const skepticism = Math.max(0, Math.min(1,
      0.5 + (crew.trait_ambition / 200) - (crew.trait_loyalty / 200)
    ));

    // Check if belief already exists
    const existingResult = await query(
      'SELECT * FROM gossip_beliefs WHERE gossip_id = $1 AND crew_member_id = $2',
      [gossipId, crewId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing belief
      const existing = existingResult.rows[0];
      const newStrength = increaseOnly 
        ? Math.max(existing.belief_strength, beliefStrength)
        : beliefStrength;

      const result = await query(
        `UPDATE gossip_beliefs 
         SET belief_strength = $1,
             times_heard = times_heard + 1,
             last_heard_at = CURRENT_TIMESTAMP,
             heard_from_crew_id = COALESCE($2, heard_from_crew_id),
             version_heard = COALESCE($3, version_heard)
         WHERE gossip_id = $4 AND crew_member_id = $5
         RETURNING *`,
        [newStrength, heardFrom, versionHeard, gossipId, crewId]
      );
      
      return result.rows[0];
    } else {
      // Create new belief
      const beliefId = uuidv4();
      const result = await query(
        `INSERT INTO gossip_beliefs (
          id, gossip_id, crew_member_id, belief_strength, skepticism_level,
          heard_from_crew_id, version_heard
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [beliefId, gossipId, crewId, beliefStrength, skepticism, heardFrom, versionHeard]
      );
      
      return result.rows[0];
    }
  }

  /**
   * Apply performance impacts from gossip to affected crew
   * @param {string} gossipId - The gossip causing impacts
   * @param {boolean} forceReapply - Force reapplication of impacts
   * @returns {Promise<Array>} Applied impact records
   */
  async applyPerformanceImpacts(gossipId, forceReapply = false) {
    // Get gossip details including subjects and impact template
    const gossipResult = await query(
      `SELECT gi.*, gtc.performance_impact_template
       FROM gossip_items gi
       JOIN gossip_type_config gtc ON gi.gossip_type = gtc.gossip_type
       WHERE gi.id = $1 AND gi.is_active = true`,
      [gossipId]
    );

    if (!gossipResult.rows.length) {
      return [];
    }

    const gossip = gossipResult.rows[0];
    const impactTemplate = gossip.performance_impact || gossip.performance_impact_template || {};

    // Get all crew who believe this gossip strongly enough
    const believersResult = await query(
      `SELECT crew_member_id, belief_strength 
       FROM gossip_beliefs 
       WHERE gossip_id = $1 AND belief_strength > 0.3`,
      [gossipId]
    );

    const impacts = [];

    // Apply impacts to the subject(s)
    const subjectIds = [gossip.subject_crew_id, ...gossip.additional_subjects].filter(Boolean);
    
    for (const subjectId of subjectIds) {
      for (const [impactType, baseValue] of Object.entries(impactTemplate)) {
        // Check if impact already exists
        if (!forceReapply) {
          const existingResult = await query(
            `SELECT id FROM gossip_performance_impacts 
             WHERE gossip_id = $1 AND affected_crew_id = $2 
             AND impact_type = $3 AND is_active = true`,
            [gossipId, subjectId, impactType]
          );
          
          if (existingResult.rows.length > 0) continue;
        }

        // Calculate impact value based on believers and veracity
        const believerCount = believersResult.rows.length;
        const avgBelief = believersResult.rows.reduce((sum, b) => sum + b.belief_strength, 0) / Math.max(1, believerCount);
        const impactMultiplier = avgBelief * (0.5 + believerCount * 0.1); // More believers = stronger impact
        const finalValue = baseValue * Math.min(2, impactMultiplier);

        // Calculate expiry (impacts fade over time)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 day default

        const impactId = uuidv4();
        const result = await query(
          `INSERT INTO gossip_performance_impacts (
            id, gossip_id, affected_crew_id, impact_type, impact_value,
            expires_at, stacks_with_similar
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (gossip_id, affected_crew_id, impact_type) 
          DO UPDATE SET 
            impact_value = $5,
            is_active = true,
            expires_at = $6
          RETURNING *`,
          [impactId, gossipId, subjectId, impactType, finalValue, expiryDate, false]
        );

        impacts.push(result.rows[0]);
      }
    }

    // Apply indirect impacts to believers (smaller effect)
    for (const believer of believersResult.rows) {
      if (subjectIds.includes(believer.crew_member_id)) continue; // Skip subjects

      const stressImpact = impactTemplate.stress || 0;
      if (stressImpact !== 0) {
        const indirectValue = stressImpact * 0.3 * believer.belief_strength; // 30% of direct impact
        
        const impactId = uuidv4();
        const result = await query(
          `INSERT INTO gossip_performance_impacts (
            id, gossip_id, affected_crew_id, impact_type, impact_value,
            expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (gossip_id, affected_crew_id, impact_type) DO NOTHING
          RETURNING *`,
          [impactId, gossipId, believer.crew_member_id, 'stress', indirectValue, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)]
        );

        if (result.rows.length > 0) {
          impacts.push(result.rows[0]);
        }
      }
    }

    return impacts;
  }

  /**
   * Get all gossip affecting or known by a crew member
   * @param {string} crewId - The crew member ID
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Gossip data organized by category
   */
  async getGossipForCrew(crewId, options = {}) {
    const {
      includeExpired = false,
      includeDisbelieved = false,
      limit = 50
    } = options;

    // Get gossip where crew is the subject
    const aboutCrewResult = await query(
      `SELECT gi.*, 
              COUNT(DISTINCT gb.crew_member_id) as believer_count,
              AVG(gb.belief_strength) as avg_belief
       FROM gossip_items gi
       LEFT JOIN gossip_beliefs gb ON gi.id = gb.gossip_id
       WHERE (gi.subject_crew_id = $1 OR $1 = ANY(gi.additional_subjects))
       AND gi.is_active = true
       ${includeExpired ? '' : 'AND (gi.expires_at IS NULL OR gi.expires_at > CURRENT_TIMESTAMP)'}
       GROUP BY gi.id
       ORDER BY gi.created_at DESC
       LIMIT $2`,
      [crewId, limit]
    );

    // Get gossip the crew believes
    const believedResult = await query(
      `SELECT gi.*, gb.belief_strength, gb.version_heard, gb.heard_from_crew_id,
              cm.name as heard_from_name
       FROM gossip_items gi
       JOIN gossip_beliefs gb ON gi.id = gb.gossip_id
       LEFT JOIN crew_members cm ON gb.heard_from_crew_id = cm.id
       WHERE gb.crew_member_id = $1
       ${includeDisbelieved ? '' : 'AND gb.belief_strength > 0.3'}
       AND gi.is_active = true
       ${includeExpired ? '' : 'AND (gi.expires_at IS NULL OR gi.expires_at > CURRENT_TIMESTAMP)'}
       ORDER BY gb.last_heard_at DESC
       LIMIT $2`,
      [crewId, limit]
    );

    // Get gossip the crew has spread
    const spreadResult = await query(
      `SELECT DISTINCT gi.*, COUNT(gse.id) as times_spread_by_crew
       FROM gossip_items gi
       JOIN gossip_spread_events gse ON gi.id = gse.gossip_id
       WHERE gse.spreader_crew_id = $1
       AND gi.is_active = true
       GROUP BY gi.id
       ORDER BY MAX(gse.spread_at) DESC
       LIMIT $2`,
      [crewId, limit]
    );

    // Get active performance impacts
    const impactsResult = await query(
      `SELECT gpi.*, gi.gossip_type, gi.current_content
       FROM gossip_performance_impacts gpi
       JOIN gossip_items gi ON gpi.gossip_id = gi.id
       WHERE gpi.affected_crew_id = $1
       AND gpi.is_active = true
       AND (gpi.expires_at IS NULL OR gpi.expires_at > CURRENT_TIMESTAMP)`,
      [crewId]
    );

    return {
      aboutCrew: aboutCrewResult.rows,
      believed: believedResult.rows,
      spread: spreadResult.rows,
      activeImpacts: impactsResult.rows,
      summary: {
        totalAbout: aboutCrewResult.rows.length,
        totalBelieved: believedResult.rows.length,
        totalSpread: spreadResult.rows.length,
        currentStress: impactsResult.rows
          .filter(i => i.impact_type === 'stress')
          .reduce((sum, i) => sum + i.impact_value, 0),
        currentMorale: impactsResult.rows
          .filter(i => i.impact_type === 'morale')
          .reduce((sum, i) => sum + i.impact_value, 0)
      }
    };
  }

  /**
   * Analyze gossip spread patterns and networks
   * @param {string} shipId - The ship to analyze
   * @returns {Promise<Object>} Network analysis data
   */
  async getGossipNetworks(shipId) {
    // Get crew gossip participation stats
    const participationResult = await query(
      `SELECT 
        cm.id, cm.name,
        COUNT(DISTINCT gb.gossip_id) as gossip_known,
        COUNT(DISTINCT gse_spread.id) as times_spread,
        COUNT(DISTINCT gse_received.id) as times_received,
        AVG(gb.belief_strength) as avg_belief_strength
       FROM crew_members cm
       LEFT JOIN gossip_beliefs gb ON cm.id = gb.crew_member_id
       LEFT JOIN gossip_spread_events gse_spread ON cm.id = gse_spread.spreader_crew_id
       LEFT JOIN gossip_spread_events gse_received ON cm.id = gse_received.receiver_crew_id
       WHERE cm.ship_id = $1 AND cm.died_at IS NULL
       GROUP BY cm.id, cm.name`,
      [shipId]
    );

    // Get spread patterns (who spreads to whom)
    const spreadPatternsResult = await query(
      `SELECT 
        spreader.id as spreader_id,
        spreader.name as spreader_name,
        receiver.id as receiver_id,
        receiver.name as receiver_name,
        COUNT(*) as spread_count,
        MAX(gse.spread_at) as last_spread
       FROM gossip_spread_events gse
       JOIN crew_members spreader ON gse.spreader_crew_id = spreader.id
       JOIN crew_members receiver ON gse.receiver_crew_id = receiver.id
       WHERE spreader.ship_id = $1 AND receiver.ship_id = $1
       AND gse.spread_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY spreader.id, spreader.name, receiver.id, receiver.name
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC`,
      [shipId]
    );

    // Identify potential gossip networks/cliques
    const cliques = this.identifyCliques(spreadPatternsResult.rows);

    // Get most viral gossip
    const viralGossipResult = await query(
      `SELECT gi.*, 
              COUNT(DISTINCT gb.crew_member_id) as believer_count,
              COUNT(DISTINCT gse.receiver_crew_id) as unique_receivers
       FROM gossip_items gi
       LEFT JOIN gossip_beliefs gb ON gi.id = gb.gossip_id
       LEFT JOIN gossip_spread_events gse ON gi.id = gse.gossip_id
       WHERE gi.ship_id = $1 AND gi.is_active = true
       GROUP BY gi.id
       HAVING COUNT(DISTINCT gb.crew_member_id) > 3
       ORDER BY COUNT(DISTINCT gb.crew_member_id) DESC
       LIMIT 10`,
      [shipId]
    );

    // Calculate network metrics
    const networkMetrics = {
      avgGossipPerCrew: participationResult.rows.reduce((sum, c) => sum + c.gossip_known, 0) / Math.max(1, participationResult.rows.length),
      mostActiveGossiper: participationResult.rows.reduce((max, c) => c.times_spread > (max?.times_spread || 0) ? c : max, null),
      mostInformed: participationResult.rows.reduce((max, c) => c.gossip_known > (max?.gossip_known || 0) ? c : max, null),
      averageBelief: participationResult.rows.reduce((sum, c) => sum + (c.avg_belief_strength || 0), 0) / Math.max(1, participationResult.rows.length)
    };

    return {
      participation: participationResult.rows,
      spreadPatterns: spreadPatternsResult.rows,
      cliques,
      viralGossip: viralGossipResult.rows,
      metrics: networkMetrics
    };
  }

  /**
   * Get gossip type configuration
   * @param {string} gossipType - The type to get config for
   * @returns {Promise<Object>} Configuration object
   */
  async getGossipTypeConfig(gossipType) {
    const result = await query(
      'SELECT * FROM gossip_type_config WHERE gossip_type = $1',
      [gossipType]
    );
    
    return result.rows[0] || {
      spread_rate_modifier: 1.0,
      mutation_rate: 0.1,
      default_priority: 'normal',
      default_expiry_days: null,
      performance_impact_template: {}
    };
  }

  /**
   * Create test gossip for testing purposes
   * @param {string} shipId - Ship to create gossip for
   * @param {number} count - Number of gossip items to create
   * @returns {Promise<Array>} Created gossip items
   */
  async createTestGossip(shipId, count = 5) {
    // Get crew members for the ship
    const crewResult = await query(
      'SELECT id, name FROM crew_members WHERE ship_id = $1 AND died_at IS NULL',
      [shipId]
    );
    
    if (crewResult.rows.length < 2) {
      throw new Error('Need at least 2 crew members to create gossip');
    }

    const crew = crewResult.rows;
    const gossipTypes = ['romance', 'competence', 'scandal', 'health', 'conspiracy'];
    const createdGossip = [];

    for (let i = 0; i < count; i++) {
      const type = this.random.chance.pickone(gossipTypes);
      const subject = this.random.chance.pickone(crew);
      const originator = this.random.chance.pickone(crew.filter(c => c.id !== subject.id));
      
      // Generate appropriate content based on type
      const contentTemplates = {
        romance: [
          `${subject.name} was seen having coffee with someone from engineering`,
          `${subject.name} has been spending a lot of time in the observation deck lately`,
          `I saw ${subject.name} smile at their console today - something's definitely up`
        ],
        competence: [
          `${subject.name} struggled with the navigation calculations again`,
          `${subject.name} seems overwhelmed by the new systems`,
          `${subject.name} asked for help with basic procedures`
        ],
        scandal: [
          `${subject.name} was in a heated argument with command`,
          `${subject.name} might be hiding something about their past`,
          `${subject.name} violated safety protocols during the last shift`
        ],
        health: [
          `${subject.name} has been looking tired lately`,
          `${subject.name} visited medical three times this week`,
          `${subject.name} seems to be dealing with stress`
        ],
        conspiracy: [
          `${subject.name} has been meeting secretly with others`,
          `${subject.name} knows something about the last mission failure`,
          `${subject.name} and others are planning something`
        ]
      };

      const content = this.random.chance.pickone(contentTemplates[type]);
      
      const gossip = await this.createGossip({
        shipId,
        gossipType: type,
        content,
        subjectCrewId: subject.id,
        originCrewId: originator.id,
        originType: this.random.chance.pickone(['witnessed', 'overheard', 'overheard'])
      });

      createdGossip.push(gossip);
    }

    return createdGossip;
  }

  /**
   * Clean up expired gossip and impacts
   * @returns {Promise<Object>} Cleanup statistics
   */
  async cleanupExpiredGossip() {
    const result = await transaction(async (client) => {
      // Deactivate expired gossip
      const gossipResult = await client.query(
        `UPDATE gossip_items 
         SET is_active = false 
         WHERE expires_at < CURRENT_TIMESTAMP 
         AND is_active = true
         RETURNING id`
      );

      // Deactivate impacts for inactive gossip
      const impactResult = await client.query(
        `UPDATE gossip_performance_impacts 
         SET is_active = false 
         WHERE (expires_at < CURRENT_TIMESTAMP 
                OR gossip_id IN (SELECT id FROM gossip_items WHERE is_active = false))
         AND is_active = true`
      );

      // Archive old gossip with low engagement
      const archiveResult = await client.query(
        `UPDATE gossip_items 
         SET is_active = false 
         WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
         AND times_spread < 5 
         AND is_active = true`
      );

      return {
        expiredGossip: gossipResult.rowCount,
        expiredImpacts: impactResult.rowCount,
        archivedGossip: archiveResult.rowCount
      };
    });

    return result;
  }

  // Helper methods

  /**
   * Calculate difference between two content strings
   * @private
   */
  calculateContentDifference(content1, content2) {
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard distance
    return (1 - intersection.size / union.size) * 100;
  }

  /**
   * Identify cliques from spread patterns
   * @private
   */
  identifyCliques(spreadPatterns) {
    // Build adjacency graph
    const graph = {};
    
    spreadPatterns.forEach(pattern => {
      if (!graph[pattern.spreader_id]) graph[pattern.spreader_id] = new Set();
      if (!graph[pattern.receiver_id]) graph[pattern.receiver_id] = new Set();
      
      if (pattern.spread_count > 2) { // Strong connection threshold
        graph[pattern.spreader_id].add(pattern.receiver_id);
        graph[pattern.receiver_id].add(pattern.spreader_id);
      }
    });

    // Find connected components (simplified clique detection)
    const visited = new Set();
    const cliques = [];

    Object.keys(graph).forEach(nodeId => {
      if (!visited.has(nodeId)) {
        const clique = this.dfs(nodeId, graph, visited);
        if (clique.size > 2) { // Minimum clique size
          cliques.push({
            members: Array.from(clique),
            size: clique.size,
            type: this.classifyCliqueType(clique, spreadPatterns)
          });
        }
      }
    });

    return cliques;
  }

  /**
   * Depth-first search for connected components
   * @private
   */
  dfs(nodeId, graph, visited) {
    const component = new Set();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!visited.has(current)) {
        visited.add(current);
        component.add(current);
        
        if (graph[current]) {
          graph[current].forEach(neighbor => {
            if (!visited.has(neighbor)) {
              stack.push(neighbor);
            }
          });
        }
      }
    }

    return component;
  }

  /**
   * Classify the type of clique based on spread patterns
   * @private
   */
  classifyCliqueType(clique, spreadPatterns) {
    // Analyze the gossip types most spread within this clique
    const gossipTypes = {};
    
    // This is a simplification - in production you'd query the actual gossip types
    const cliqueSize = clique.size;
    
    if (cliqueSize > 5) return 'network';
    if (cliqueSize > 3) return 'clique';
    return 'pair';
  }
}

export default GossipRepository;