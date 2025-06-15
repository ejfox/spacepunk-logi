import { EventEmitter } from 'events';

class TrainingQueue extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baseProgressRate: config.baseProgressRate || 1.0, // Points per tick
      skillCapModifier: config.skillCapModifier || 0.02, // Slower progress as skills get higher
      personalityModifier: config.personalityModifier || 0.3, // Personality impact on training
      burnoutThreshold: config.burnoutThreshold || 80, // Training intensity that causes burnout
      burnoutPenalty: config.burnoutPenalty || 0.5, // Progress penalty when burned out
      maxTrainingIntensity: config.maxTrainingIntensity || 100,
      ...config
    };
    
    // Training types with different characteristics
    this.trainingTypes = {
      basic_engineering: {
        name: 'Basic Engineering Training',
        skill: 'engineering',
        duration: 12, // hours
        intensity: 30,
        description: 'Fundamental reactor maintenance and emergency leak patching. Insurance requires signed acknowledgment that "fundamental" does not guarantee survival during actual emergencies.',
        requirements: { engineering: 0 },
        maxSkillBonus: 40
      },
      
      advanced_engineering: {
        name: 'Advanced Engineering Protocols',
        skill: 'engineering',
        duration: 24,
        intensity: 60,
        description: 'Complex diagnostics and catastrophic failure mitigation. Participants learn to identify which alarms can be safely ignored (most) and which indicate imminent death (some).',
        requirements: { engineering: 30 },
        maxSkillBonus: 80
      },
      
      expert_engineering: {
        name: 'Expert Engineering Certification',
        skill: 'engineering',
        duration: 48,
        intensity: 90,
        description: 'Direct reactor core manipulation without protective equipment. Corporate medical coverage explicitly excludes resulting mutations. Third arm may improve work efficiency.',
        requirements: { engineering: 60 },
        maxSkillBonus: 100
      },
      
      basic_piloting: {
        name: 'Basic Flight Training',
        skill: 'piloting',
        duration: 8,
        intensity: 25,
        description: 'Standard docking without property damage. Insurance deductible remains crew responsibility. "Standard" defined as less than 3 hull breaches per docking attempt.',
        requirements: { piloting: 0 },
        maxSkillBonus: 35
      },
      
      advanced_piloting: {
        name: 'Advanced Maneuvers',
        skill: 'piloting',
        duration: 20,
        intensity: 55,
        description: 'Evasive flying for tax collectors and debris fields. Simulator includes authentic panic mode. Vomit bags not provided but strongly recommended.',
        requirements: { piloting: 25 },
        maxSkillBonus: 75
      },
      
      combat_basics: {
        name: 'Basic Combat Training',
        skill: 'combat',
        duration: 16,
        intensity: 50,
        description: 'Point dangerous end away from self. Covers trigger discipline, acceptable casualty ratios, and filling out incident reports in triplicate.',
        requirements: { combat: 0 },
        maxSkillBonus: 45
      },
      
      social_protocols: {
        name: 'Diplomatic Protocols',
        skill: 'social',
        duration: 10,
        intensity: 20,
        description: 'Smile while negotiating terrible contracts. Includes suppressing homicidal urges during customer complaints and mandatory cheerfulness metrics.',
        requirements: { social: 0 },
        maxSkillBonus: 50
      },
      
      leadership_training: {
        name: 'Leadership Development',
        skill: 'social',
        duration: 32,
        intensity: 40,
        description: 'Learn to delegate blame effectively. Covers scapegoat selection, motivational threats, and taking credit for subordinate achievements. Ethics sold separately.',
        requirements: { social: 40, engineering: 20 },
        maxSkillBonus: 90
      },
      
      // Advanced specialized training (inspired by hacker skill tree)
      lockpicking_fundamentals: {
        name: 'Physical Security Assessment',
        skill: 'engineering',
        duration: 20,
        intensity: 45,
        description: 'Basic lockpicking and security bypass. HR requires signed waiver acknowledging "assessment" skills may violate station regulations. Clear practice locks provided.',
        requirements: { engineering: 40 },
        maxSkillBonus: 70
      },
      
      social_engineering: {
        name: 'Advanced Personnel Manipulation',
        skill: 'social',
        duration: 28,
        intensity: 65,
        description: 'Pretexting, psychological exploitation, and trust establishment protocols. Ethics module removed due to budget constraints. Use responsibly (this is not legal advice).',
        requirements: { social: 50 },
        maxSkillBonus: 85
      },
      
      cryptographic_systems: {
        name: 'Applied Cryptography & OpSec',
        skill: 'engineering',
        duration: 36,
        intensity: 80,
        description: 'PGP key management, onion routing, and corporate surveillance countermeasures. NSA-proof not guaranteed. Side effects include paranoia and increased caffeine dependency.',
        requirements: { engineering: 70 },
        maxSkillBonus: 95
      },
      
      void_navigation: {
        name: 'Anarchist Piloting Techniques',
        skill: 'piloting',
        duration: 40,
        intensity: 85,
        description: 'Navigate without corporate beacons using only stellar positions and gut instinct. Includes freight-hopping protocols and authorities evasion. Not endorsed by Transit Authority.',
        requirements: { piloting: 60 },
        maxSkillBonus: 90
      },
      
      combat_hacking: {
        name: 'Offensive Electronic Warfare',
        skill: 'combat',
        duration: 30,
        intensity: 75,
        description: 'Buffer overflow exploitation in combat scenarios. Transform enemy systems into expensive paperweights. Geneva Convention compliance module costs extra.',
        requirements: { combat: 40, engineering: 50 },
        maxSkillBonus: 85
      },
      
      biohacking_basics: {
        name: 'Personal Enhancement Protocols',
        skill: 'engineering',
        duration: 44,
        intensity: 90,
        description: 'DIY nootropics, stimulant optimization, and basic genetic modification. Medical insurance void upon enrollment. Third arm coverage explicitly excluded.',
        requirements: { engineering: 80 },
        maxSkillBonus: 100
      },
      
      consensus_facilitation: {
        name: 'Anarchist Meeting Survival',
        skill: 'social',
        duration: 48,
        intensity: 95,
        description: 'Navigate 8-hour consensus meetings about 15-minute decisions. Master hand signals, blocking wisely, and caffeine rationing. Patience sold separately.',
        requirements: { social: 70 },
        maxSkillBonus: 95
      }
    };
    
    this.activeTraining = new Map(); // crew_member_id -> training_data
  }

  startTraining(crewMemberId, trainingType, customDuration = null) {
    const training = this.trainingTypes[trainingType];
    if (!training) {
      throw new Error(`Unknown training type: ${trainingType}`);
    }

    // Check if crew member is already training
    if (this.activeTraining.has(crewMemberId)) {
      throw new Error('Crew member is already in training');
    }

    const duration = customDuration || training.duration;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (duration * 60 * 60 * 1000));

    const trainingSession = {
      crewMemberId,
      trainingType,
      training,
      startTime,
      endTime,
      duration,
      progressMade: 0,
      completed: false,
      burnout: false,
      totalTicks: 0,
      efficiency: 1.0,
      status: 'active'
    };

    this.activeTraining.set(crewMemberId, trainingSession);
    
    this.emit('trainingStarted', {
      crewMemberId,
      trainingType,
      duration,
      startTime,
      endTime
    });

    return trainingSession;
  }

  cancelTraining(crewMemberId) {
    const session = this.activeTraining.get(crewMemberId);
    if (!session) {
      throw new Error('No active training session found');
    }

    session.status = 'cancelled';
    this.activeTraining.delete(crewMemberId);
    
    this.emit('trainingCancelled', {
      crewMemberId,
      trainingType: session.trainingType,
      progressMade: session.progressMade,
      timeSpent: (new Date() - session.startTime) / (1000 * 60 * 60)
    });

    return session;
  }

  processTrainingTick(crewMembers) {
    const completedSessions = [];
    const progressUpdates = [];

    for (const [crewMemberId, session] of this.activeTraining.entries()) {
      if (session.status !== 'active') continue;

      const crewMember = crewMembers.find(c => c.id === crewMemberId);
      if (!crewMember) {
        console.warn(`Crew member ${crewMemberId} not found, cancelling training`);
        this.activeTraining.delete(crewMemberId);
        continue;
      }

      const now = new Date();
      
      // Check if training is complete
      if (now >= session.endTime) {
        this.completeTraining(crewMemberId, crewMember);
        completedSessions.push(session);
        continue;
      }

      // Calculate progress for this tick
      const progress = this.calculateTrainingProgress(session, crewMember);
      session.progressMade += progress;
      session.totalTicks++;

      // Check for burnout
      if (session.training.intensity > this.config.burnoutThreshold) {
        const burnoutChance = (session.training.intensity - this.config.burnoutThreshold) / 100;
        if (Math.random() < burnoutChance * 0.01) { // Per-tick burnout chance
          session.burnout = true;
          session.efficiency *= this.config.burnoutPenalty;
          
          this.emit('trainingBurnout', {
            crewMemberId,
            trainingType: session.trainingType,
            efficiency: session.efficiency
          });
        }
      }

      progressUpdates.push({
        crewMemberId,
        trainingType: session.trainingType,
        progressMade: progress,
        totalProgress: session.progressMade,
        efficiency: session.efficiency,
        burnout: session.burnout,
        timeRemaining: (session.endTime - now) / (1000 * 60 * 60)
      });
    }

    // Emit batch updates
    if (progressUpdates.length > 0) {
      this.emit('trainingProgress', progressUpdates);
    }

    if (completedSessions.length > 0) {
      this.emit('trainingCompleted', completedSessions);
    }

    return { progressUpdates, completedSessions };
  }

  calculateTrainingProgress(session, crewMember) {
    const training = session.training;
    const currentSkill = crewMember[`skill_${training.skill}`] || 0;
    
    // Base progress rate
    let progress = this.config.baseProgressRate;
    
    // Apply skill cap modifier (harder to improve high skills)
    const skillFactor = 1 - (currentSkill * this.config.skillCapModifier / 100);
    progress *= Math.max(0.1, skillFactor);
    
    // Apply personality modifiers
    const personalityBonus = this.calculatePersonalityBonus(crewMember, training);
    progress *= (1 + personalityBonus);
    
    // Apply training efficiency (affected by burnout)
    progress *= session.efficiency;
    
    // Apply training type intensity
    progress *= (training.intensity / 50); // Normalized to 50 intensity = 1x multiplier
    
    // Random variance (±20%)
    const variance = 0.8 + (Math.random() * 0.4);
    progress *= variance;
    
    return Math.max(0.1, progress); // Minimum progress to prevent stalling
  }

  calculatePersonalityBonus(crewMember, training) {
    let bonus = 0;
    
    // Work ethic affects all training
    const workEthic = (crewMember.trait_work_ethic || 50) / 100;
    bonus += (workEthic - 0.5) * this.config.personalityModifier;
    
    // Skill-specific personality bonuses
    switch (training.skill) {
      case 'engineering':
        // High bravery helps with dangerous engineering work
        const bravery = (crewMember.trait_bravery || 50) / 100;
        bonus += (bravery - 0.5) * this.config.personalityModifier * 0.5;
        break;
        
      case 'social':
        // Loyalty affects social training
        const loyalty = (crewMember.trait_loyalty || 50) / 100;
        bonus += (loyalty - 0.5) * this.config.personalityModifier * 0.5;
        break;
        
      case 'piloting':
        // Ambition drives piloting excellence
        const ambition = (crewMember.trait_ambition || 50) / 100;
        bonus += (ambition - 0.5) * this.config.personalityModifier * 0.5;
        break;
        
      case 'combat':
        // Bravery is crucial for combat training
        const combatBravery = (crewMember.trait_bravery || 50) / 100;
        bonus += (combatBravery - 0.5) * this.config.personalityModifier * 0.8;
        break;
    }
    
    return Math.max(-0.5, Math.min(0.5, bonus)); // Cap bonus between -50% and +50%
  }

  completeTraining(crewMemberId, crewMember) {
    const session = this.activeTraining.get(crewMemberId);
    if (!session) return null;

    session.completed = true;
    session.status = 'completed';
    session.completedAt = new Date();
    
    // Calculate final skill increase
    const skillIncrease = Math.round(session.progressMade);
    const training = session.training;
    
    // Calculate efficiency rating for narrative purposes
    const expectedProgress = session.duration * this.config.baseProgressRate;
    const efficiency = session.progressMade / expectedProgress;
    
    let efficiencyRating;
    if (efficiency >= 1.5) efficiencyRating = 'exceptional';
    else if (efficiency >= 1.2) efficiencyRating = 'excellent';
    else if (efficiency >= 1.0) efficiencyRating = 'satisfactory';
    else if (efficiency >= 0.8) efficiencyRating = 'adequate';
    else efficiencyRating = 'poor';

    // Generate completion narrative
    const narrative = this.generateCompletionNarrative(crewMember, training, {
      skillIncrease,
      efficiency: efficiencyRating,
      burnout: session.burnout,
      duration: session.duration
    });

    const completion = {
      crewMemberId,
      trainingType: session.trainingType,
      skillImproved: training.skill,
      skillIncrease,
      startTime: session.startTime,
      endTime: session.endTime,
      completedAt: session.completedAt,
      efficiency: efficiencyRating,
      burnout: session.burnout,
      narrative,
      progressMade: session.progressMade,
      totalTicks: session.totalTicks
    };

    this.activeTraining.delete(crewMemberId);
    
    this.emit('trainingCompleted', completion);
    
    return completion;
  }

  generateCompletionNarrative(crewMember, training, results) {
    const templates = {
      exceptional: [
        `${crewMember.name} exceeded all expectations during ${training.name}. Performance metrics forwarded to Sector HR for potential fast-track consideration. Previous fast-track participants experienced 73% higher burnout rates.`,
        `Outstanding performance by ${crewMember.name} in ${training.name}. Efficiency ratings place them in top 2% company-wide. Mandatory excellence counseling scheduled to manage unrealistic future expectations.`,
        `${crewMember.name} completed ${training.name} with exceptional results. Automatic promotion to Senior ${training.skill} Specialist Level III. Additional responsibilities commence immediately. Salary adjustment pending budget review Q4 2387.`
      ],
      excellent: [
        `${crewMember.name} performed admirably during ${training.name}. Achievement unlocked voluntary overtime opportunities. Voluntary participation is strongly encouraged and tracked for annual reviews.`,
        `Solid performance by ${crewMember.name} in ${training.name}. New certification permits operation of equipment previously restricted due to insurance liability concerns. Waiver forms 77-B through 77-K require immediate signature.`,
        `${crewMember.name} demonstrated strong competency in ${training.name}. Corporate has approved their inclusion in the Mentorship Obligation Program. They must now train three junior crew members while maintaining current workload.`
      ],
      satisfactory: [
        `${crewMember.name} completed ${training.name} within acceptable parameters. Standard performance bonus of 0.3% applied to next paycheck. Taxes will consume approximately 0.31%.`,
        `Standard completion of ${training.name} by ${crewMember.name}. Meets corporate minimum requirements. Failure to exceed minimum requirements noted in permanent record.`,
        `${crewMember.name} successfully finished ${training.name}. Competency card updated. Card must be displayed at all times. Replacement cards available for 50 credits after mandatory 6-hour retraining course.`
      ],
      adequate: [
        `${crewMember.name} completed ${training.name} after multiple attempts. Remedial training costs will be deducted from next three paychecks per Employee Development Agreement clause 9.7.`,
        `Marginal completion of ${training.name} by ${crewMember.name}. Mandatory Performance Improvement Plan initiated. Daily check-ins with supervising AI begin tomorrow at 0500 hours.`,
        `${crewMember.name} finished ${training.name} with adequate results. Placed on probationary competency status. Random skill audits will occur during sleep cycles to ensure retention.`
      ],
      poor: [
        `${crewMember.name} struggled through ${training.name}. Corporate Wellness Division has prescribed mandatory meditation modules. Meditation module failures will result in additional meditation modules.`,
        `Concerning performance by ${crewMember.name} during ${training.name}. Automated HR interview scheduled. Please note: crying during HR interviews is considered unprofessional and will be documented.`,
        `${crewMember.name} completed ${training.name} despite significant difficulties. Motivational Realignment Seminar attendance now required. Seminar occurs during designated rest periods. Rest period reduction is not grounds for overtime.`
      ]
    };

    const efficiencyTemplates = templates[results.efficiency] || templates.satisfactory;
    let narrative = efficiencyTemplates[Math.floor(Math.random() * efficiencyTemplates.length)];

    // Add burnout context if applicable
    if (results.burnout) {
      const burnoutAdditions = [
        ' Medical has diagnosed training-induced exhaustion. Prescription stimulants available from ship pharmacy. Side effects may include additional exhaustion.',
        ' Crew member submitted 14 wellness concern forms during training. Forms have been filed appropriately. Wellness committee will review within 6-8 business months.',
        ' Biometric implants detected dangerous stress levels during final training phase. Stress Management Workshop enrollment is now mandatory. Workshop known to cause significant stress.'
      ];
      narrative += burnoutAdditions[Math.floor(Math.random() * burnoutAdditions.length)];
    }

    // Add skill improvement context
    narrative += ` ${training.skill.charAt(0).toUpperCase() + training.skill.slice(1)} skills improved by ${results.skillIncrease} points.`;

    return narrative;
  }

  getTrainingStatus(crewMemberId) {
    return this.activeTraining.get(crewMemberId) || null;
  }

  getAllActiveTraining() {
    return Array.from(this.activeTraining.values());
  }

  getAvailableTraining(crewMember) {
    const available = [];
    
    for (const [key, training] of Object.entries(this.trainingTypes)) {
      // Check skill requirements
      let canTrain = true;
      for (const [skill, required] of Object.entries(training.requirements)) {
        const currentSkill = crewMember[`skill_${skill}`] || 0;
        if (currentSkill < required) {
          canTrain = false;
          break;
        }
      }
      
      // Check if current skill is below training's max benefit
      const currentSkill = crewMember[`skill_${training.skill}`] || 0;
      if (currentSkill >= training.maxSkillBonus) {
        canTrain = false;
      }
      
      if (canTrain) {
        available.push({
          key,
          ...training,
          estimatedProgress: this.estimateTrainingProgress(crewMember, training),
          personalityBonus: this.calculatePersonalityBonus(crewMember, training)
        });
      }
    }
    
    return available.sort((a, b) => a.intensity - b.intensity); // Sort by difficulty
  }

  estimateTrainingProgress(crewMember, training) {
    const currentSkill = crewMember[`skill_${training.skill}`] || 0;
    const personalityBonus = this.calculatePersonalityBonus(crewMember, training);
    
    // Rough estimation based on training parameters
    const baseProgress = this.config.baseProgressRate * training.duration;
    const skillFactor = 1 - (currentSkill * this.config.skillCapModifier / 100);
    const personalityFactor = 1 + personalityBonus;
    const intensityFactor = training.intensity / 50;
    
    return Math.round(baseProgress * skillFactor * personalityFactor * intensityFactor);
  }

  getTrainingStatistics() {
    const active = this.getAllActiveTraining();
    const stats = {
      totalActiveTraining: active.length,
      trainingByType: {},
      trainingBySkill: {},
      averageProgress: 0,
      burnoutCount: 0
    };

    let totalProgress = 0;
    
    active.forEach(session => {
      // Count by training type
      stats.trainingByType[session.trainingType] = 
        (stats.trainingByType[session.trainingType] || 0) + 1;
      
      // Count by skill
      const skill = session.training.skill;
      stats.trainingBySkill[skill] = 
        (stats.trainingBySkill[skill] || 0) + 1;
      
      totalProgress += session.progressMade;
      
      if (session.burnout) {
        stats.burnoutCount++;
      }
    });
    
    stats.averageProgress = active.length > 0 ? totalProgress / active.length : 0;
    
    return stats;
  }
}

export default TrainingQueue;