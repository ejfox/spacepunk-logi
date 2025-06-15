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
    
    const result = await query(
      `INSERT INTO missions (
        id, type, difficulty, title, description, 
        objectives, rewards, deadline_hours, risks, 
        flavor_text, station_id, expires_at, generated_by, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        id, type, difficulty, title, description,
        JSON.stringify(objectives), JSON.stringify(rewards), deadline, JSON.stringify(risks),
        flavor_text, station_id, expiresAt, generated_by, 'available'
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
      SELECT m.*, s.name as station_name 
      FROM missions m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.status = 'available' 
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
    `;
    const params = [];
    
    if (stationId) {
      queryText += ' AND (m.station_id = $1 OR m.station_id IS NULL)';
      params.push(stationId);
    }
    
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
      `SELECT m.*, s.name as station_name 
       FROM missions m
       LEFT JOIN stations s ON m.station_id = s.id
       WHERE m.type = $1 AND m.status = 'available'
         AND (m.expires_at IS NULL OR m.expires_at > NOW())
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [type, limit]
    );
    
    return result.rows.map(mission => this.transformMission(mission));
  }

  async findByDifficulty(difficulty, limit = 5) {
    const result = await query(
      `SELECT m.*, s.name as station_name 
       FROM missions m
       LEFT JOIN stations s ON m.station_id = s.id
       WHERE m.difficulty = $1 AND m.status = 'available'
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
    const client = await transaction();
    
    try {
      const expiredMissions = await client.query(
        `UPDATE missions 
         SET status = 'expired', updated_at = NOW()
         WHERE status = 'available' 
           AND expires_at IS NOT NULL 
           AND expires_at <= NOW()
         RETURNING id, title`
      );
      
      // Record expiration events
      for (const mission of expiredMissions.rows) {
        await client.query(
          `INSERT INTO mission_history (id, mission_id, action, action_at)
           VALUES ($1, $2, $3, NOW())`,
          [uuidv4(), mission.id, 'expired']
        );
      }
      
      await client.query('COMMIT');
      
      return expiredMissions.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    try {
      return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString);
      return fallback;
    }
  }
}

export default MissionRepository;