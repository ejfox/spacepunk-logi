import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class MissionRepository {
  async create(missionData) {
    const {
      type,
      difficulty = 'standard',
      title,
      description,
      objectives = [],
      rewards = {},
      deadline = 24,
      risks = [],
      flavor_text = '',
      station_id = null,
      expires_at = null,
      generated_by = 'system'
    } = missionData;
    
    const id = uuidv4();
    const expiresAt = expires_at || new Date(Date.now() + (deadline * 60 * 60 * 1000));
    
    // Convert difficulty strings to integers
    const difficultyMap = {
      'trivial': 1,
      'easy': 2,
      'standard': 3,
      'challenging': 4,
      'hard': 5,
      'extreme': 6
    };
    const difficultyLevel = difficultyMap[difficulty] || 3;
    
    const result = await query(
      `INSERT INTO missions (
        id, mission_type, difficulty_level, title, description, 
        requirements, reward_credits, risk_level, 
        target_location, expires_at, created_at, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id, type, difficultyLevel, title, description,
        JSON.stringify(objectives || {}), rewards?.credits || 1000, risks || 'low',
        station_id || 'Unknown Location', expiresAt, new Date(), true
      ]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM missions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    return this.transformMission(result.rows[0]);
  }

  async findAvailable(limit = 10, stationId = null) {
    let queryText = `
      SELECT m.*
      FROM missions m
      WHERE m.is_active = true 
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
    `;
    const params = [];
    
    // Station filtering removed since missions table doesn't have station_id
    
    queryText += ' ORDER BY m.created_at DESC';
    
    if (limit) {
      queryText += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    const result = await query(queryText, params);
    return result.rows.map(mission => this.transformMission(mission));
  }

  async findByType(type, limit = 5) {
    const result = await query(
      `SELECT m.*
       FROM missions m
       WHERE m.mission_type = $1 AND m.is_active = true
         AND (m.expires_at IS NULL OR m.expires_at > NOW())
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [type, limit]
    );
    
    return result.rows.map(mission => this.transformMission(mission));
  }

  async findByDifficulty(difficulty, limit = 5) {
    const result = await query(
      `SELECT m.*
       FROM missions m
       WHERE m.difficulty_level = $1 AND m.is_active = true
         AND (m.expires_at IS NULL OR m.expires_at > NOW())
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [difficulty, limit]
    );
    
    return result.rows.map(mission => this.transformMission(mission));
  }

  async findExpired() {
    const result = await query(
      `SELECT * FROM missions 
       WHERE status = 'available' 
         AND expires_at IS NOT NULL 
         AND expires_at <= NOW()`
    );
    
    return result.rows.map(mission => this.transformMission(mission));
  }

  async updateStatus(id, status, notes = null) {
    const result = await query(
      `UPDATE missions 
       SET status = $2, updated_at = NOW(), completion_notes = $3
       WHERE id = $1
       RETURNING *`,
      [id, status, notes]
    );
    
    if (result.rows.length === 0) return null;
    return this.transformMission(result.rows[0]);
  }

  async acceptMission(missionId, playerId, shipId) {
    const client = await transaction();
    
    try {
      // Check if mission is still available
      const missionResult = await client.query(
        'SELECT * FROM missions WHERE id = $1 AND status = $2',
        [missionId, 'available']
      );
      
      if (missionResult.rows.length === 0) {
        throw new Error('Mission not available');
      }
      
      // Update mission status
      await client.query(
        `UPDATE missions 
         SET status = 'accepted', accepted_by = $2, accepted_at = NOW(), ship_id = $3
         WHERE id = $1`,
        [missionId, playerId, shipId]
      );
      
      // Record mission acceptance in player history
      await client.query(
        `INSERT INTO mission_history (id, mission_id, player_id, ship_id, action, action_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), missionId, playerId, shipId, 'accepted']
      );
      
      await client.query('COMMIT');
      
      return await this.findById(missionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async completeMission(missionId, playerId, rewards = null, notes = null) {
    const client = await transaction();
    
    try {
      const mission = await client.query(
        'SELECT * FROM missions WHERE id = $1 AND accepted_by = $2',
        [missionId, playerId]
      );
      
      if (mission.rows.length === 0) {
        throw new Error('Mission not found or not accepted by player');
      }
      
      const missionData = mission.rows[0];
      const actualRewards = rewards || JSON.parse(missionData.rewards || '{}');
      
      // Update mission status
      await client.query(
        `UPDATE missions 
         SET status = 'completed', completed_at = NOW(), completion_notes = $3,
             actual_rewards = $4
         WHERE id = $1 AND accepted_by = $2`,
        [missionId, playerId, notes, JSON.stringify(actualRewards)]
      );
      
      // Award rewards to player
      if (actualRewards.credits) {
        await client.query(
          'UPDATE players SET credits = credits + $1 WHERE id = $2',
          [actualRewards.credits, playerId]
        );
      }
      
      if (actualRewards.reputation) {
        await client.query(
          'UPDATE players SET reputation = reputation + $1 WHERE id = $2',
          [actualRewards.reputation, playerId]
        );
      }
      
      // Record completion in history
      await client.query(
        `INSERT INTO mission_history (id, mission_id, player_id, action, action_at, rewards)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [uuidv4(), missionId, playerId, 'completed', JSON.stringify(actualRewards)]
      );
      
      await client.query('COMMIT');
      
      return await this.findById(missionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async expireMissions() {
    return await transaction(async (client) => {
      const expiredMissions = await client.query(
        `UPDATE missions 
         SET is_active = false
         WHERE is_active = true 
           AND expires_at IS NOT NULL 
           AND expires_at <= NOW()
         RETURNING id, title`
      );
      
      // Skip mission_history for now since table may not exist
      
      return expiredMissions.rows;
    });
  }

  async getPlayerMissions(playerId, status = null) {
    let queryText = `
      SELECT m.*, s.name as station_name
      FROM missions m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.accepted_by = $1
    `;
    const params = [playerId];
    
    if (status) {
      queryText += ' AND m.status = $2';
      params.push(status);
    }
    
    queryText += ' ORDER BY m.accepted_at DESC';
    
    const result = await query(queryText, params);
    return result.rows.map(mission => this.transformMission(mission));
  }

  async getMissionStats() {
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at))/3600) as avg_completion_hours
      FROM missions 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY status
    `);
    
    return result.rows.reduce((stats, row) => {
      stats[row.status] = {
        count: parseInt(row.count),
        avgCompletionHours: row.avg_completion_hours ? parseFloat(row.avg_completion_hours) : null
      };
      return stats;
    }, {});
  }

  async cleanupOldMissions(daysOld = 30) {
    const result = await query(
      `DELETE FROM missions 
       WHERE status IN ('completed', 'expired', 'failed')
         AND created_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING COUNT(*) as deleted_count`
    );
    
    return result.rows[0]?.deleted_count || 0;
  }

  transformMission(mission) {
    if (!mission) return null;
    
    return {
      ...mission,
      objectives: this.parseJSON(mission.objectives, []),
      rewards: this.parseJSON(mission.rewards, {}),
      risks: this.parseJSON(mission.risks, []),
      actual_rewards: this.parseJSON(mission.actual_rewards, null),
      time_remaining: mission.expires_at ? 
        Math.max(0, Math.floor((new Date(mission.expires_at) - new Date()) / 1000 / 60 / 60)) : null
    };
  }

  parseJSON(jsonString, fallback) {
    if (!jsonString || jsonString === null || jsonString === 'null' || jsonString === '') {
      return fallback;
    }
    
    try {
      // Handle case where jsonString is already an object
      if (typeof jsonString === 'object') {
        return jsonString;
      }
      
      // If it's a string that looks like it might be already parsed
      if (typeof jsonString === 'string' && (jsonString === '[]' || jsonString === '{}')) {
        return JSON.parse(jsonString);
      }
      
      // Try to parse as JSON
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      
      return jsonString;
    } catch (error) {
      // Only log if it's an actual parsing issue, not if we're getting invalid strings
      if (typeof jsonString === 'string' && jsonString.trim().length > 0) {
        console.warn('MissionRepository: Failed to parse JSON field:', {
          value: jsonString.substring(0, 100),
          type: typeof jsonString,
          length: jsonString?.length,
          error: error.message
        });
      }
      return fallback;
    }
  }
}

export default MissionRepository;