import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ShipLogRepository {
  async createLogEntry(logData) {
    const {
      playerId,
      shipId,
      story,
      absencePeriod,
      context = {},
      complexity = 'medium',
      generatedBy = 'system'
    } = logData;
    
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO ship_logs (
        id, player_id, ship_id, story_content, 
        absence_start, absence_end, absence_duration_hours,
        story_context, complexity, generated_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        id, playerId, shipId, story,
        absencePeriod.start, absencePeriod.end, absencePeriod.durationHours,
        JSON.stringify(context), complexity, generatedBy
      ]
    );
    
    return result.rows[0];
  }

  async findByPlayerId(playerId, limit = 10) {
    const result = await query(
      `SELECT sl.*, s.name as ship_name, p.username as captain_name
       FROM ship_logs sl
       LEFT JOIN ships s ON sl.ship_id = s.id
       LEFT JOIN players p ON sl.player_id = p.id
       WHERE sl.player_id = $1
       ORDER BY sl.created_at DESC
       LIMIT $2`,
      [playerId, limit]
    );
    
    return result.rows.map(log => this.transformLogEntry(log));
  }

  async findByShipId(shipId, limit = 10) {
    const result = await query(
      `SELECT sl.*, s.name as ship_name, p.username as captain_name
       FROM ship_logs sl
       LEFT JOIN ships s ON sl.ship_id = s.id
       LEFT JOIN players p ON sl.player_id = p.id
       WHERE sl.ship_id = $1
       ORDER BY sl.created_at DESC
       LIMIT $2`,
      [shipId, limit]
    );
    
    return result.rows.map(log => this.transformLogEntry(log));
  }

  async findById(id) {
    const result = await query(
      `SELECT sl.*, s.name as ship_name, p.username as captain_name
       FROM ship_logs sl
       LEFT JOIN ships s ON sl.ship_id = s.id
       LEFT JOIN players p ON sl.player_id = p.id
       WHERE sl.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    return this.transformLogEntry(result.rows[0]);
  }

  async findRecent(limit = 20, complexity = null) {
    let queryText = `
      SELECT sl.*, s.name as ship_name, p.username as captain_name
      FROM ship_logs sl
      LEFT JOIN ships s ON sl.ship_id = s.id
      LEFT JOIN players p ON sl.player_id = p.id
      WHERE sl.created_at >= NOW() - INTERVAL '7 days'
    `;
    const params = [];
    
    if (complexity) {
      queryText += ' AND sl.complexity = $1';
      params.push(complexity);
    }
    
    queryText += ' ORDER BY sl.created_at DESC';
    
    if (limit) {
      queryText += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    const result = await query(queryText, params);
    return result.rows.map(log => this.transformLogEntry(log));
  }

  async getPlayerLastLogin(playerId) {
    const result = await query(
      `SELECT last_login_at 
       FROM players 
       WHERE id = $1`,
      [playerId]
    );
    
    return result.rows[0]?.last_login_at || null;
  }

  async updatePlayerLastLogin(playerId) {
    await query(
      `UPDATE players 
       SET last_login_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [playerId]
    );
  }

  async getAbsenceData(playerId, shipId, lastLogin) {
    const client = await transaction();
    
    try {
      // Get crew training completions during absence
      const crewActivities = await client.query(
        `SELECT 
          cm.name as crew_member_name,
          cm.id as crew_member_id,
          tq.skill_type,
          tq.progress_made,
          tq.completed_at,
          tq.training_type,
          cm.trait_bravery,
          cm.trait_loyalty,
          cm.trait_ambition,
          cm.trait_work_ethic
         FROM training_queue tq
         JOIN crew_members cm ON tq.crew_member_id = cm.id
         WHERE cm.ship_id = $1 
           AND tq.completed_at > $2 
           AND tq.completed_at <= NOW()
         ORDER BY tq.completed_at`,
        [shipId, lastLogin]
      );

      // Get market changes during absence
      const marketChanges = await client.query(
        `SELECT 
          r.name as resource_name,
          s.name as station_name,
          mph.price as price,
          mph.supply,
          mph.demand,
          mph.created_at
         FROM market_price_history mph
         JOIN market_data md ON mph.market_data_id = md.id
         JOIN resources r ON md.resource_id = r.id
         JOIN stations s ON md.station_id = s.id
         WHERE mph.created_at > $1 
           AND mph.created_at <= NOW()
         ORDER BY mph.created_at`,
        [lastLogin]
      );

      // Get mission progress during absence
      const missionProgress = await client.query(
        `SELECT 
          m.title,
          m.type,
          m.difficulty,
          m.status,
          m.rewards,
          mh.action,
          mh.action_at,
          mh.rewards as actual_rewards
         FROM mission_history mh
         JOIN missions m ON mh.mission_id = m.id
         WHERE mh.player_id = $1 
           AND mh.action_at > $2 
           AND mh.action_at <= NOW()
         ORDER BY mh.action_at`,
        [playerId, lastLogin]
      );

      // Get system events (maintenance, repairs, etc.)
      const systemEvents = await client.query(
        `SELECT 
          'maintenance' as type,
          'automated_systems' as component,
          'completed' as outcome,
          'routine' as impact,
          NOW() as event_time
         WHERE EXISTS (
           SELECT 1 FROM ships WHERE id = $1
         )`,
        [shipId]
      );

      await client.query('COMMIT');

      return {
        crewActivities: crewActivities.rows.map(activity => ({
          type: 'training_completed',
          crewMember: {
            id: activity.crew_member_id,
            name: activity.crew_member_name
          },
          skill: activity.skill_type,
          improvement: activity.progress_made,
          trainingType: activity.training_type,
          completedAt: activity.completed_at,
          traits: [
            { name: 'bravery', value: activity.trait_bravery },
            { name: 'loyalty', value: activity.trait_loyalty },
            { name: 'ambition', value: activity.trait_ambition },
            { name: 'work_ethic', value: activity.trait_work_ethic }
          ].filter(trait => trait.value > 70) // Only high traits
        })),
        
        marketChanges: this.analyzeMarketChanges(marketChanges.rows),
        
        missionProgress: missionProgress.rows.map(mission => ({
          title: mission.title,
          type: mission.type,
          difficulty: mission.difficulty,
          status: mission.status,
          action: mission.action,
          actionAt: mission.action_at,
          rewards: this.parseJSON(mission.actual_rewards, mission.rewards)
        })),
        
        systemEvents: systemEvents.rows
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  analyzeMarketChanges(rawChanges) {
    // Group by resource and calculate price changes
    const pricesByResource = {};
    
    rawChanges.forEach(change => {
      const key = `${change.resource_name}_${change.station_name}`;
      if (!pricesByResource[key]) {
        pricesByResource[key] = {
          resourceName: change.resource_name,
          stationName: change.station_name,
          prices: []
        };
      }
      pricesByResource[key].prices.push({
        price: change.price,
        time: change.created_at
      });
    });

    // Calculate percentage changes
    return Object.values(pricesByResource).map(resource => {
      const prices = resource.prices.sort((a, b) => new Date(a.time) - new Date(b.time));
      if (prices.length < 2) return null;
      
      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      return {
        resourceName: resource.resourceName,
        stationName: resource.stationName,
        priceChange: Math.round(priceChange * 10) / 10,
        firstPrice,
        lastPrice,
        dataPoints: prices.length
      };
    }).filter(change => change && Math.abs(change.priceChange) > 5); // Only significant changes
  }

  async generateAbsenceStoryForPlayer(playerId, absenceStories) {
    try {
      // Get player's current ship
      const playerShip = await query(
        `SELECT s.*, p.last_login_at 
         FROM ships s
         JOIN players p ON s.player_id = p.id
         WHERE p.id = $1 AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [playerId]
      );

      if (playerShip.rows.length === 0) {
        throw new Error('No active ship found for player');
      }

      const ship = playerShip.rows[0];
      const lastLogin = ship.last_login_at;
      const currentLogin = new Date();
      
      if (!lastLogin) {
        // First login, no absence story needed
        await this.updatePlayerLastLogin(playerId);
        return null;
      }

      const absenceDuration = (currentLogin - new Date(lastLogin)) / (1000 * 60 * 60); // hours
      
      if (absenceDuration < 0.5) {
        // Too short to generate a story
        return null;
      }

      // Get absence data
      const absenceData = await this.getAbsenceData(playerId, ship.id, lastLogin);
      
      // Generate story
      const storyContext = {
        playerId,
        shipId: ship.id,
        absenceDuration,
        lastLogin,
        currentLogin,
        ...absenceData
      };

      const storyEntry = await absenceStories.generateAbsenceStory(storyContext);
      
      // Save to database
      const savedLog = await this.createLogEntry(storyEntry);
      
      // Update player's last login time
      await this.updatePlayerLastLogin(playerId);
      
      return savedLog;
      
    } catch (error) {
      console.error('Error generating absence story:', error);
      throw error;
    }
  }

  async getLogStats() {
    const result = await query(`
      SELECT 
        complexity,
        generated_by,
        COUNT(*) as count,
        AVG(absence_duration_hours) as avg_absence_hours
      FROM ship_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY complexity, generated_by
      ORDER BY complexity, generated_by
    `);
    
    return result.rows;
  }

  async cleanupOldLogs(daysOld = 90) {
    const result = await query(
      `DELETE FROM ship_logs 
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING COUNT(*) as deleted_count`
    );
    
    return result.rows[0]?.deleted_count || 0;
  }

  transformLogEntry(log) {
    if (!log) return null;
    
    return {
      ...log,
      story_context: this.parseJSON(log.story_context, {}),
      absence_period: {
        start: log.absence_start,
        end: log.absence_end,
        duration_hours: log.absence_duration_hours
      }
    };
  }

  parseJSON(jsonString, fallback = {}) {
    try {
      return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString);
      return fallback;
    }
  }
}

export default ShipLogRepository;