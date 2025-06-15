import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class TrainingQueueRepository {
  async createTrainingSession(sessionData) {
    const {
      crewMemberId,
      trainingType,
      startTime,
      endTime,
      duration,
      intensity = 50,
      status = 'active'
    } = sessionData;
    
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO training_queue (
        id, crew_member_id, training_type, start_time, end_time,
        duration_hours, intensity, status, progress_made, efficiency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [id, crewMemberId, trainingType, startTime, endTime, duration, intensity, status, 0, 1.0]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT tq.*, cm.name as crew_member_name, cm.skill_engineering, 
              cm.skill_piloting, cm.skill_social, cm.skill_combat,
              cm.trait_bravery, cm.trait_loyalty, cm.trait_ambition, cm.trait_work_ethic
       FROM training_queue tq
       JOIN crew_members cm ON tq.crew_member_id = cm.id
       WHERE tq.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    return this.transformTrainingSession(result.rows[0]);
  }

  async findActiveByCrewMember(crewMemberId) {
    const result = await query(
      `SELECT tq.*, cm.name as crew_member_name, cm.skill_engineering, 
              cm.skill_piloting, cm.skill_social, cm.skill_combat,
              cm.trait_bravery, cm.trait_loyalty, cm.trait_ambition, cm.trait_work_ethic
       FROM training_queue tq
       JOIN crew_members cm ON tq.crew_member_id = cm.id
       WHERE tq.crew_member_id = $1 AND tq.status = 'active'
       ORDER BY tq.start_time DESC
       LIMIT 1`,
      [crewMemberId]
    );
    
    if (result.rows.length === 0) return null;
    return this.transformTrainingSession(result.rows[0]);
  }

  async findActiveByShip(shipId) {
    const result = await query(
      `SELECT tq.*, cm.name as crew_member_name, cm.skill_engineering, 
              cm.skill_piloting, cm.skill_social, cm.skill_combat,
              cm.trait_bravery, cm.trait_loyalty, cm.trait_ambition, cm.trait_work_ethic
       FROM training_queue tq
       JOIN crew_members cm ON tq.crew_member_id = cm.id
       WHERE cm.ship_id = $1 AND tq.status = 'active'
       ORDER BY tq.start_time`,
      [shipId]
    );
    
    return result.rows.map(row => this.transformTrainingSession(row));
  }

  async findAllActive() {
    const result = await query(
      `SELECT tq.*, cm.name as crew_member_name, cm.ship_id,
              cm.skill_engineering, cm.skill_piloting, cm.skill_social, cm.skill_combat,
              cm.trait_bravery, cm.trait_loyalty, cm.trait_ambition, cm.trait_work_ethic
       FROM training_queue tq
       JOIN crew_members cm ON tq.crew_member_id = cm.id
       WHERE tq.status = 'active'
       ORDER BY tq.start_time`
    );
    
    return result.rows.map(row => this.transformTrainingSession(row));
  }

  async findCompletedSince(since) {
    const result = await query(
      `SELECT tq.*, cm.name as crew_member_name, cm.ship_id,
              cm.skill_engineering, cm.skill_piloting, cm.skill_social, cm.skill_combat
       FROM training_queue tq
       JOIN crew_members cm ON tq.crew_member_id = cm.id
       WHERE tq.status = 'completed' AND tq.completed_at > $1
       ORDER BY tq.completed_at DESC`,
      [since]
    );
    
    return result.rows.map(row => this.transformTrainingSession(row));
  }

  async updateProgress(id, progressMade, efficiency = null, burnout = null) {
    let queryText = 'UPDATE training_queue SET progress_made = $2, updated_at = NOW()';
    const params = [id, progressMade];
    let paramCount = 2;

    if (efficiency !== null) {
      queryText += `, efficiency = $${++paramCount}`;
      params.push(efficiency);
    }

    if (burnout !== null) {
      queryText += `, burnout = $${++paramCount}`;
      params.push(burnout);
    }

    queryText += ' WHERE id = $1 RETURNING *';

    const result = await query(queryText, params);
    
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async completeTraining(id, skillIncrease, narrative = null) {
    const client = await transaction();
    
    try {
      // Update training session
      const trainingResult = await client.query(
        `UPDATE training_queue 
         SET status = 'completed', completed_at = NOW(), 
             skill_increase = $2, completion_narrative = $3
         WHERE id = $1 AND status = 'active'
         RETURNING *`,
        [id, skillIncrease, narrative]
      );

      if (trainingResult.rows.length === 0) {
        throw new Error('Training session not found or already completed');
      }

      const training = trainingResult.rows[0];
      
      // Get training type to determine which skill to update
      const skillType = training.skill_type || this.extractSkillFromTrainingType(training.training_type);
      
      // Update crew member's skill
      if (skillType && skillIncrease > 0) {
        await client.query(
          `UPDATE crew_members 
           SET skill_${skillType} = skill_${skillType} + $1, updated_at = NOW()
           WHERE id = $2`,
          [skillIncrease, training.crew_member_id]
        );
      }

      // Record training completion in crew memories
      await client.query(
        `INSERT INTO crew_memories (id, crew_member_id, event_type, event_description, impact_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          training.crew_member_id,
          'training_completed',
          narrative || `Completed ${training.training_type} training`,
          Math.min(30, skillIncrease * 3) // Positive memory impact
        ]
      );

      await client.query('COMMIT');
      return training;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelTraining(id, reason = 'cancelled') {
    const result = await query(
      `UPDATE training_queue 
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [id, reason]
    );
    
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async getTrainingHistory(crewMemberId, limit = 10) {
    const result = await query(
      `SELECT * FROM training_queue 
       WHERE crew_member_id = $1 
       ORDER BY start_time DESC 
       LIMIT $2`,
      [crewMemberId, limit]
    );
    
    return result.rows.map(row => this.transformTrainingSession(row));
  }

  async getTrainingStatistics(shipId = null, days = 7) {
    let queryText = `
      SELECT 
        training_type,
        skill_type,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
        AVG(CASE WHEN status = 'completed' THEN progress_made END) as avg_progress,
        AVG(CASE WHEN status = 'completed' THEN skill_increase END) as avg_skill_increase,
        AVG(efficiency) as avg_efficiency,
        COUNT(CASE WHEN burnout = true THEN 1 END) as burnout_count
      FROM training_queue tq
    `;
    
    const params = [];
    let whereClause = `WHERE tq.start_time >= NOW() - INTERVAL '${days} days'`;
    
    if (shipId) {
      queryText += ' JOIN crew_members cm ON tq.crew_member_id = cm.id';
      whereClause += ' AND cm.ship_id = $1';
      params.push(shipId);
    }
    
    queryText += ` ${whereClause} GROUP BY training_type, skill_type ORDER BY total_sessions DESC`;
    
    const result = await query(queryText, params);
    return result.rows;
  }

  async getCrewTrainingRecommendations(crewMemberId) {
    const result = await query(
      `SELECT 
        cm.*,
        COALESCE(COUNT(tq.id), 0) as training_sessions_completed,
        MAX(tq.completed_at) as last_training_completed
       FROM crew_members cm
       LEFT JOIN training_queue tq ON cm.id = tq.crew_member_id AND tq.status = 'completed'
       WHERE cm.id = $1
       GROUP BY cm.id`,
      [crewMemberId]
    );
    
    if (result.rows.length === 0) return null;
    
    const crew = result.rows[0];
    const recommendations = [];
    
    // Analyze skills and recommend training
    const skills = {
      engineering: crew.skill_engineering || 0,
      piloting: crew.skill_piloting || 0,
      social: crew.skill_social || 0,
      combat: crew.skill_combat || 0
    };
    
    // Find lowest skills for improvement recommendations
    const sortedSkills = Object.entries(skills).sort(([,a], [,b]) => a - b);
    
    for (const [skill, level] of sortedSkills) {
      if (level < 70) { // Room for improvement
        let trainingType;
        if (level < 30) trainingType = `basic_${skill}`;
        else if (level < 60) trainingType = `advanced_${skill}`;
        else trainingType = `expert_${skill}`;
        
        recommendations.push({
          skill,
          currentLevel: level,
          recommendedTraining: trainingType,
          priority: level < 30 ? 'high' : level < 50 ? 'medium' : 'low',
          reason: `${skill} skill below optimal level`
        });
      }
    }
    
    return {
      crewMember: crew,
      recommendations: recommendations.slice(0, 3) // Top 3 recommendations
    };
  }

  async cleanupOldTraining(daysOld = 30) {
    const result = await query(
      `DELETE FROM training_queue 
       WHERE status IN ('completed', 'cancelled') 
         AND (completed_at < NOW() - INTERVAL '${daysOld} days' 
              OR cancelled_at < NOW() - INTERVAL '${daysOld} days')
       RETURNING COUNT(*) as deleted_count`
    );
    
    return result.rows[0]?.deleted_count || 0;
  }

  async batchUpdateProgress(progressUpdates) {
    const client = await transaction();
    
    try {
      const results = [];
      
      for (const update of progressUpdates) {
        const result = await client.query(
          `UPDATE training_queue 
           SET progress_made = $2, efficiency = $3, burnout = $4, updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [update.id, update.progressMade, update.efficiency, update.burnout]
        );
        
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  extractSkillFromTrainingType(trainingType) {
    // Extract skill from training type name
    if (trainingType.includes('engineering')) return 'engineering';
    if (trainingType.includes('piloting')) return 'piloting';
    if (trainingType.includes('combat')) return 'combat';
    if (trainingType.includes('social') || trainingType.includes('leadership')) return 'social';
    return null;
  }

  transformTrainingSession(session) {
    if (!session) return null;
    
    return {
      ...session,
      crew_member: {
        id: session.crew_member_id,
        name: session.crew_member_name,
        skills: {
          engineering: session.skill_engineering || 0,
          piloting: session.skill_piloting || 0,
          social: session.skill_social || 0,
          combat: session.skill_combat || 0
        },
        traits: {
          bravery: session.trait_bravery || 50,
          loyalty: session.trait_loyalty || 50,
          ambition: session.trait_ambition || 50,
          work_ethic: session.trait_work_ethic || 50
        }
      },
      time_remaining: session.end_time ? 
        Math.max(0, Math.floor((new Date(session.end_time) - new Date()) / 1000 / 60 / 60)) : null,
      progress_percentage: session.duration_hours > 0 ? 
        Math.min(100, (session.progress_made / (session.duration_hours * 2)) * 100) : 0
    };
  }
}

export default TrainingQueueRepository;