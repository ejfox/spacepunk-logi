import { query } from '../db/index.js';

export class TrainingService {
  constructor(logService = null, eventEmitter = null) {
    this.logService = logService;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Get available training programs for a crew member
   */
  async getAvailablePrograms(crewMemberId) {
    // Get crew member's current skills and completed programs
    const crewResult = await query(
      'SELECT * FROM crew_members WHERE id = $1',
      [crewMemberId]
    );
    
    if (crewResult.rows.length === 0) {
      throw new Error('Crew member not found');
    }
    
    const crewMember = crewResult.rows[0];
    
    // Get completed programs
    const completedResult = await query(
      'SELECT training_program_id FROM training_completions WHERE crew_member_id = $1',
      [crewMemberId]
    );
    
    const completedProgramIds = completedResult.rows.map(row => row.training_program_id);
    
    // Get active programs they haven't completed
    const programsResult = await query(`
      SELECT p.*, 
        CASE 
          WHEN p.skill_type = 'skill_engineering' THEN $2
          WHEN p.skill_type = 'skill_piloting' THEN $3
          WHEN p.skill_type = 'skill_social' THEN $4
          WHEN p.skill_type = 'skill_combat' THEN $5
          ELSE 0
        END as current_skill_level
      FROM training_programs p 
      WHERE p.is_active = true
        AND ($6::uuid[] IS NULL OR p.id != ALL($6))
        AND (p.required_level <= CASE 
          WHEN p.skill_type = 'skill_engineering' THEN $2
          WHEN p.skill_type = 'skill_piloting' THEN $3
          WHEN p.skill_type = 'skill_social' THEN $4
          WHEN p.skill_type = 'skill_combat' THEN $5
          ELSE 0
        END)
      ORDER BY p.category, p.required_level
    `, [
      crewMemberId,
      crewMember.skill_engineering,
      crewMember.skill_piloting,
      crewMember.skill_social,
      crewMember.skill_combat,
      completedProgramIds.length > 0 ? completedProgramIds : null
    ]);
    
    return programsResult.rows;
  }

  /**
   * Enroll a crew member in a training program
   */
  async enrollInTraining(crewMemberId, trainingProgramId, shipId) {
    const client = await query.pool?.connect();
    
    try {
      await client?.query('BEGIN');
      
      // Check if crew member is already in training
      const existingResult = await query(
        'SELECT id FROM training_queue WHERE crew_member_id = $1 AND status IN ($2, $3)',
        [crewMemberId, 'queued', 'in_progress']
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error('Crew member is already in training');
      }
      
      // Get training program details
      const programResult = await query(
        'SELECT * FROM training_programs WHERE id = $1',
        [trainingProgramId]
      );
      
      if (programResult.rows.length === 0) {
        throw new Error('Training program not found');
      }
      
      const program = programResult.rows[0];
      
      // Get crew member details
      const crewResult = await query(
        'SELECT * FROM crew_members WHERE id = $1',
        [crewMemberId]
      );
      
      const crewMember = crewResult.rows[0];
      
      // Check skill requirements
      const currentSkill = crewMember[program.skill_type];
      if (currentSkill < program.required_level) {
        throw new Error(`Requires ${program.skill_type.replace('skill_', '')} level ${program.required_level}`);
      }
      
      // Check if player can afford it
      const shipResult = await query(
        'SELECT s.*, p.credits FROM ships s JOIN players p ON s.player_id = p.id WHERE s.id = $1',
        [shipId]
      );
      
      if (shipResult.rows.length === 0) {
        throw new Error('Ship not found');
      }
      
      const ship = shipResult.rows[0];
      if (ship.credits < program.cost_credits) {
        throw new Error(`Insufficient credits. Requires ${program.cost_credits} CR`);
      }
      
      // Deduct credits
      if (program.cost_credits > 0) {
        await query(
          'UPDATE players SET credits = credits - $1 WHERE id = $2',
          [program.cost_credits, ship.player_id]
        );
      }
      
      // Calculate estimated completion time (rough estimate)
      const estimatedCompletion = new Date(Date.now() + (program.duration_ticks * 30000)); // 30s per tick
      
      // Create training queue entry
      const queueResult = await query(`
        INSERT INTO training_queue (
          crew_member_id,
          ship_id,
          training_program_id,
          status,
          estimated_completion,
          credits_paid
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        crewMemberId,
        shipId,
        trainingProgramId,
        'queued',
        estimatedCompletion,
        program.cost_credits
      ]);
      
      const queueEntry = queueResult.rows[0];
      
      // Log enrollment event
      await query(`
        INSERT INTO training_events (
          training_queue_id,
          event_type,
          event_description,
          progress_percentage
        ) VALUES ($1, $2, $3, $4)
      `, [
        queueEntry.id,
        'enrolled',
        `${crewMember.name} enrolled in ${program.name}`,
        0
      ]);
      
      // Add log event for narrative generation
      if (this.logService) {
        await this.logService.addLogEvent(
          shipId,
          0, // Will be updated when tick processes
          'crew_training_enrollment',
          'crew',
          `${crewMember.name} enrolled in training program`,
          `${crewMember.name} has been enrolled in the ${program.name} training program. Expected completion in ${program.duration_ticks} system cycles.`,
          {
            crew_member_id: crewMemberId,
            training_program_id: trainingProgramId,
            program_name: program.name,
            cost: program.cost_credits,
            duration_ticks: program.duration_ticks
          },
          {
            severity: 'info',
            crewMemberIds: [crewMemberId],
            impactScore: 6,
            narrativeTags: ['training', 'crew_development', 'enrollment']
          }
        );
      }
      
      await client?.query('COMMIT');
      return queueEntry;
      
    } catch (error) {
      await client?.query('ROLLBACK');
      throw error;
    } finally {
      client?.release();
    }
  }

  /**
   * Process training progress for all active training
   */
  async processTrainingTick(currentTick) {
    console.log('Processing training queues...');
    
    try {
      // Get all active training entries
      const activeTraining = await query(`
        SELECT 
          tq.*,
          tp.name as program_name,
          tp.duration_ticks,
          tp.skill_improvement,
          tp.skill_type,
          tp.difficulty_rating,
          tp.failure_penalty,
          cm.name as crew_name,
          cm.ship_id
        FROM training_queue tq
        JOIN training_programs tp ON tq.training_program_id = tp.id
        JOIN crew_members cm ON tq.crew_member_id = cm.id
        WHERE tq.status IN ('queued', 'in_progress')
        ORDER BY tq.enrolled_at ASC
      `);
      
      for (const training of activeTraining.rows) {
        await this.processIndividualTraining(training, currentTick);
      }
      
    } catch (error) {
      console.error('Error processing training tick:', error);
    }
  }

  /**
   * Process a single training entry
   */
  async processIndividualTraining(training, currentTick) {
    try {
      // Start queued training
      if (training.status === 'queued') {
        await query(`
          UPDATE training_queue 
          SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [training.id]);
        
        await query(`
          INSERT INTO training_events (
            training_queue_id,
            event_type,
            event_description,
            progress_percentage
          ) VALUES ($1, $2, $3, $4)
        `, [
          training.id,
          'started',
          `${training.crew_name} began ${training.program_name} training`,
          0
        ]);
        
        console.log(`Started training: ${training.crew_name} - ${training.program_name}`);
        return;
      }
      
      // Progress in-progress training
      if (training.status === 'in_progress') {
        const newProgress = training.progress_ticks + 1;
        const progressPercentage = Math.floor((newProgress / training.duration_ticks) * 100);
        
        await query(`
          UPDATE training_queue 
          SET progress_ticks = $1
          WHERE id = $2
        `, [newProgress, training.id]);
        
        // Log milestone events (every 25% progress)
        if (progressPercentage > 0 && progressPercentage % 25 === 0) {
          await query(`
            INSERT INTO training_events (
              training_queue_id,
              event_type,
              event_description,
              progress_percentage
            ) VALUES ($1, $2, $3, $4)
          `, [
            training.id,
            'milestone',
            `${training.crew_name} is ${progressPercentage}% through ${training.program_name}`,
            progressPercentage
          ]);
          
          // Emit training progress event
          if (this.eventEmitter) {
            this.eventEmitter.emit('training:progress', {
              trainingId: training.id,
              shipId: training.ship_id,
              crewName: training.crew_name,
              programName: training.program_name,
              progressPercentage,
              progressTicks: newProgress,
              status: 'in_progress',
              event: 'milestone'
            });
          }
        }
        
        // Check if training is complete
        if (newProgress >= training.duration_ticks) {
          await this.completeTraining(training, currentTick);
        }
      }
      
    } catch (error) {
      console.error(`Error processing training for ${training.crew_name}:`, error);
    }
  }

  /**
   * Complete a training program
   */
  async completeTraining(training, currentTick) {
    try {
      // Calculate success based on difficulty and random factors
      const successChance = Math.max(20, 100 - (training.difficulty_rating * 8)); // 20% minimum chance
      const randomRoll = Math.random() * 100;
      const succeeded = randomRoll <= successChance;
      
      const successRating = succeeded ? 
        Math.floor(60 + (Math.random() * 40)) : // 60-100 on success
        Math.floor(10 + (Math.random() * 30)); // 10-40 on failure
      
      let skillGained = 0;
      let finalStatus = 'completed';
      let eventDescription = '';
      
      if (succeeded) {
        skillGained = training.skill_improvement;
        eventDescription = `${training.crew_name} successfully completed ${training.program_name} training`;
        
        // Apply skill improvement
        await query(`
          UPDATE crew_members 
          SET ${training.skill_type} = LEAST(${training.skill_type} + $1, 100)
          WHERE id = $2
        `, [skillGained, training.crew_member_id]);
        
        // Record completion
        await query(`
          INSERT INTO training_completions (
            crew_member_id,
            training_program_id,
            final_skill_level,
            success_rating
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (crew_member_id, training_program_id) DO UPDATE SET
            completed_at = CURRENT_TIMESTAMP,
            final_skill_level = EXCLUDED.final_skill_level,
            success_rating = EXCLUDED.success_rating
        `, [
          training.crew_member_id,
          training.training_program_id,
          skillGained,
          successRating
        ]);
        
      } else {
        finalStatus = 'failed';
        eventDescription = `${training.crew_name} failed to complete ${training.program_name} training`;
        
        // Apply failure penalty if any
        if (training.failure_penalty > 0) {
          await query(`
            UPDATE crew_members 
            SET ${training.skill_type} = GREATEST(${training.skill_type} - $1, 0)
            WHERE id = $2
          `, [training.failure_penalty, training.crew_member_id]);
        }
      }
      
      // Update training queue entry
      await query(`
        UPDATE training_queue 
        SET 
          status = $1,
          completed_at = CURRENT_TIMESTAMP,
          skill_gained = $2,
          success_rating = $3
        WHERE id = $4
      `, [finalStatus, skillGained, successRating, training.id]);
      
      // Log completion event
      await query(`
        INSERT INTO training_events (
          training_queue_id,
          event_type,
          event_description,
          progress_percentage,
          skill_progress
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        training.id,
        finalStatus,
        eventDescription,
        100,
        skillGained
      ]);
      
      // Add log event for narrative generation
      if (this.logService) {
        await this.logService.addLogEvent(
          training.ship_id,
          currentTick,
          succeeded ? 'crew_training_completed' : 'crew_training_failed',
          'crew',
          eventDescription,
          succeeded ? 
            `${training.crew_name} has successfully completed the ${training.program_name} training program, gaining ${skillGained} ${training.skill_type.replace('skill_', '')} skill points.` :
            `${training.crew_name} struggled with the ${training.program_name} training program and was unable to complete it successfully.`,
          {
            crew_member_id: training.crew_member_id,
            training_program_id: training.training_program_id,
            program_name: training.program_name,
            skill_gained: skillGained,
            success_rating: successRating,
            succeeded: succeeded
          },
          {
            severity: succeeded ? 'info' : 'warning',
            crewMemberIds: [training.crew_member_id],
            impactScore: succeeded ? 8 : 6,
            narrativeTags: ['training', 'crew_development', succeeded ? 'success' : 'failure']
          }
        );
      }
      
      // Emit training completion event
      if (this.eventEmitter) {
        this.eventEmitter.emit('training:progress', {
          trainingId: training.id,
          shipId: training.ship_id,
          crewName: training.crew_name,
          programName: training.program_name,
          progressPercentage: 100,
          progressTicks: training.duration_ticks,
          status: finalStatus,
          event: finalStatus,
          skillGained,
          successRating
        });
      }
      
      console.log(`Training ${succeeded ? 'completed' : 'failed'}: ${training.crew_name} - ${training.program_name}`);
      
    } catch (error) {
      console.error('Error completing training:', error);
    }
  }

  /**
   * Cancel a training program
   */
  async cancelTraining(trainingQueueId, reason = 'cancelled') {
    try {
      // Get training details
      const trainingResult = await query(`
        SELECT tq.*, tp.name as program_name, cm.name as crew_name
        FROM training_queue tq
        JOIN training_programs tp ON tq.training_program_id = tp.id  
        JOIN crew_members cm ON tq.crew_member_id = cm.id
        WHERE tq.id = $1
      `, [trainingQueueId]);
      
      if (trainingResult.rows.length === 0) {
        throw new Error('Training not found');
      }
      
      const training = trainingResult.rows[0];
      
      // Update status
      await query(`
        UPDATE training_queue 
        SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [trainingQueueId]);
      
      // Log cancellation
      await query(`
        INSERT INTO training_events (
          training_queue_id,
          event_type,
          event_description,
          progress_percentage
        ) VALUES ($1, $2, $3, $4)
      `, [
        trainingQueueId,
        'cancelled',
        `${training.crew_name}'s ${training.program_name} training was cancelled: ${reason}`,
        Math.floor((training.progress_ticks / 1) * 100) // Rough progress percentage
      ]);
      
      console.log(`Training cancelled: ${training.crew_name} - ${training.program_name}`);
      return true;
      
    } catch (error) {
      console.error('Error cancelling training:', error);
      throw error;
    }
  }

  /**
   * Get training queue for a ship
   */
  async getShipTrainingQueue(shipId) {
    const result = await query(`
      SELECT 
        tq.*,
        tp.name as program_name,
        tp.description as program_description,
        tp.duration_ticks,
        tp.skill_improvement,
        tp.skill_type,
        cm.name as crew_name,
        ROUND((tq.progress_ticks::float / tp.duration_ticks::float) * 100, 1) as progress_percentage
      FROM training_queue tq
      JOIN training_programs tp ON tq.training_program_id = tp.id
      JOIN crew_members cm ON tq.crew_member_id = cm.id
      WHERE tq.ship_id = $1 
        AND tq.status IN ('queued', 'in_progress')
      ORDER BY tq.enrolled_at ASC
    `, [shipId]);
    
    return result.rows;
  }

  /**
   * Get training history for a crew member
   */
  async getCrewTrainingHistory(crewMemberId) {
    const result = await query(`
      SELECT 
        tq.*,
        tp.name as program_name,
        tp.skill_type,
        tp.skill_improvement
      FROM training_queue tq
      JOIN training_programs tp ON tq.training_program_id = tp.id
      WHERE tq.crew_member_id = $1 
        AND tq.status IN ('completed', 'failed')
      ORDER BY tq.completed_at DESC
    `, [crewMemberId]);
    
    return result.rows;
  }
}

export default TrainingService;