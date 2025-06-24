import { gameRandom } from '../utils/seededRandom.js'

/**
 * Gossip Archetypes System
 * 
 * Defines the structural templates for different types of crew gossip.
 * Each archetype has predictable mechanics while using LLM for specific content.
 */

export const GOSSIP_ARCHETYPES = {
  office_romance: {
    name: 'Office Romance',
    description: 'Workplace crushes and romantic entanglements affecting crew dynamics',
    phases: ['CRUSH', 'OBVIOUS', 'CONFESSION', 'RELATIONSHIP', 'DRAMA', 'RESOLUTION'],
    baseDuration: 14, // days
    spreadProbability: 0.75,
    
    template: {
      initial: '[SUBJECT] has been showing romantic interest in [TARGET]',
      mutation: {
        exaggeration: '[SUBJECT] is completely obsessed with [TARGET]',
        diminishment: '[SUBJECT] maybe has a small crush on [TARGET]',
        target_shift: '[SUBJECT] is actually interested in [NEW_TARGET]',
        content_drift: '[SUBJECT] and [TARGET] were seen together in [LOCATION]'
      }
    },
    
    gameplayEffects: {
      productivity: -0.15, // 15% efficiency loss when working together
      morale: 0.1, // Slight morale boost from office drama
      relationships: {
        subject_to_target: 0.2, // Romance target gets relationship boost
        others_to_subject: -0.05 // Others slightly annoyed by distraction
      }
    },
    
    escalationTriggers: [
      'mutual_assignment', // Working together on same task
      'off_duty_encounter', // Seen together during break
      'gift_giving', // Subject gives gift to target
      'jealousy_incident' // Third party involvement
    ],
    
    llmPrompts: {
      initial: `Generate workplace romance gossip content about {subject} having feelings for {target}. Include specific behaviors like prolonged eye contact, finding excuses to work together, bringing coffee, or protective instincts. Keep it professional but with obvious romantic undertones. Use corporate humor - describe romantic behavior as "productivity metrics" or "resource allocation patterns". 50-100 words.`,
      
      phase_progression: `The romance gossip about {subject} and {target} is escalating to the {phase} phase. Generate specific workplace incidents that show the relationship progressing. Include awkward moments, jealousy from other crew, or attempts to maintain professionalism while failing. Corporate humor essential. 40-80 words.`,
      
      confrontation: `{subject} and {target} are being confronted about their workplace romance affecting ship operations. Generate dialogue where they try to deny/explain while maintaining corporate professionalism. Include HR-speak and policy violations. 60-120 words.`
    }
  },

  competence_crisis: {
    name: 'Competence Crisis',
    description: 'Crew member struggling with job responsibilities',
    phases: ['MISTAKES', 'PATTERN', 'COVERUP', 'EXPOSURE', 'INTERVENTION', 'OUTCOME'],
    baseDuration: 21, // days
    spreadProbability: 0.6,
    
    template: {
      initial: '[SUBJECT] has been making serious mistakes with [TASK/SYSTEM]',
      mutation: {
        exaggeration: '[SUBJECT] is completely incompetent and dangerous',
        diminishment: '[SUBJECT] just needs more training on [TASK/SYSTEM]',
        content_drift: '[SUBJECT] was caught trying to hide mistakes in [SYSTEM]'
      }
    },
    
    gameplayEffects: {
      skill_modifier: -0.25, // 25% skill penalty from reputation
      stress: 0.3, // High stress from being gossiped about
      safety_rating: -0.1, // Ship safety concerns
      training_effectiveness: -0.15 // Harder to train when demoralized
    },
    
    escalationTriggers: [
      'system_failure', // Equipment breaks due to improper use
      'near_miss', // Almost caused accident
      'supervisor_notice', // Captain notices the problems
      'peer_complaint' // Other crew formally complain
    ],
    
    llmPrompts: {
      initial: `Generate workplace incompetence gossip about {subject} struggling with {task}. Include specific technical failures, safety violations, or procedural mistakes. Describe as "quality assurance protocols" or "performance metrics below standards". Include corporate euphemisms for incompetence. 50-100 words.`,
      
      coverup: `{subject} is trying to hide their mistakes with {task}. Generate content about cover-up attempts, shifting blame, or falsifying reports. Use corporate language about "process optimization" and "incident documentation". Include paranoia and desperation. 40-80 words.`,
      
      intervention: `Management is intervening in {subject}'s performance issues. Generate content about mandatory training, performance improvement plans, or "voluntary" skill assessment. Corporate HR language essential. 60-120 words.`
    }
  },

  secret_past: {
    name: 'Secret Past',
    description: 'Hidden background or experience affecting current behavior',
    phases: ['HINTS', 'INVESTIGATION', 'DISCOVERY', 'CONFRONTATION', 'REVELATION', 'CONSEQUENCES'],
    baseDuration: 28, // days
    spreadProbability: 0.55,
    
    template: {
      initial: '[SUBJECT] has been acting strange about [TOPIC/SITUATION]',
      mutation: {
        exaggeration: '[SUBJECT] is definitely hiding something major from their past',
        target_shift: '[SUBJECT] and [OTHER] both seem to know something',
        content_drift: '[SUBJECT] was overheard making mysterious communications'
      }
    },
    
    gameplayEffects: {
      trust_modifier: -0.2, // Others trust them less
      mysterious_bonus: 0.1, // Some find mystery intriguing
      stress: 0.25, // Stress from keeping secrets
      faction_relations: 'variable' // Could affect various faction standings
    },
    
    escalationTriggers: [
      'slip_of_tongue', // Accidentally reveals information
      'outside_contact', // Mysterious communication received
      'behavioral_pattern', // Consistent strange behavior
      'document_discovery' // Someone finds evidence
    ],
    
    llmPrompts: {
      initial: `Generate gossip about {subject} having mysterious past. Include contradictory stories, gaps in employment history, unexpected skills, or reactions to specific topics. Use corporate language about "background verification" and "security clearance discrepancies". 50-100 words.`,
      
      investigation: `Crew are investigating {subject}'s mysterious background. Generate content about snooping, asking pointed questions, or connecting dots. Include paranoia and conspiracy theories framed as "personnel file auditing". 40-80 words.`,
      
      revelation: `{subject}'s secret past is being revealed. Generate dramatic disclosure about hidden identity, previous employment, or concealed experiences. Use corporate shock about "HR database inconsistencies" and "onboarding protocol failures". 60-120 words.`
    }
  },

  health_scare: {
    name: 'Health Scare',
    description: 'Concerns about crew member\'s physical or mental health',
    phases: ['SYMPTOMS', 'CONCERN', 'SPECULATION', 'INTERVENTION', 'DIAGNOSIS', 'TREATMENT'],
    baseDuration: 18, // days
    spreadProbability: 0.4, // More private, spreads slower
    
    template: {
      initial: '[SUBJECT] has been showing concerning health symptoms',
      mutation: {
        exaggeration: '[SUBJECT] might have a serious medical condition',
        diminishment: '[SUBJECT] just seems a bit tired lately'
      }
    },
    
    gameplayEffects: {
      work_capacity: -0.2, // Reduced effectiveness
      crew_concern: 0.15, // Others care about their wellbeing
      medical_costs: 100, // Potential medical expenses
      contagion_fear: -0.1 // If condition seems contagious
    },
    
    llmPrompts: {
      initial: `Generate health concern gossip about {subject}. Include specific symptoms, behavioral changes, or medical incidents. Frame as "workplace wellness protocols" and "occupational health monitoring". Include corporate concern about productivity impacts. 50-100 words.`,
      
      intervention: `Crew are trying to help {subject} with health concerns. Generate content about wellness checks, medical recommendations, or forced rest periods. Use corporate language about "mandatory health evaluations" and "fitness for duty assessments". 40-80 words.`
    }
  },

  loyalty_question: {
    name: 'Loyalty Question',
    description: 'Suspected divided loyalties or external allegiances',
    phases: ['SUSPICION', 'MONITORING', 'EVIDENCE', 'ACCUSATION', 'INVESTIGATION', 'RESOLUTION'],
    baseDuration: 35, // days - serious matter
    spreadProbability: 0.45, // Dangerous gossip spreads carefully
    
    template: {
      initial: '[SUBJECT] might be working for [FACTION/ORGANIZATION]',
      mutation: {
        exaggeration: '[SUBJECT] is definitely a spy/saboteur',
        content_drift: '[SUBJECT] was seen communicating with [FACTION] agents'
      }
    },
    
    gameplayEffects: {
      security_clearance: -0.5, // Major security concerns
      paranoia_level: 0.3, // Increases general crew paranoia
      faction_relations: 'negative', // Affects relevant faction standings
      investigation_time: 0.2 // Crew spend time watching them
    },
    
    llmPrompts: {
      initial: `Generate loyalty suspicion gossip about {subject} potentially working for {faction}. Include suspicious communications, conflicting priorities, or unexplained knowledge. Frame as "security clearance review" and "conflict of interest protocols". 50-100 words.`,
      
      investigation: `Crew are investigating {subject}'s potential divided loyalties. Generate content about surveillance, evidence gathering, or security protocol violations. Use corporate paranoia language about "insider threat assessment" and "counterintelligence procedures". 60-120 words.`
    }
  }
}

/**
 * Corporate Humor Generator
 * Transforms normal workplace drama into bureaucratic language
 */
export class CorporateHumorizer {
  static euphemisms = {
    romance: [
      'non-standard break room utilization patterns',
      'irregular interpersonal productivity metrics',
      'unauthorized resource sharing protocols',
      'excessive collaborative consultation sessions',
      'abnormal eye contact frequency statistics'
    ],
    incompetence: [
      'performance optimization opportunities',
      'skill enhancement requirements',
      'quality assurance protocol deviations',
      'procedural compliance gaps',
      'efficiency metric anomalies'
    ],
    secrets: [
      'background verification discrepancies',
      'security clearance documentation gaps',
      'personnel file inconsistencies',
      'onboarding protocol oversights',
      'identity verification irregularities'
    ],
    health: [
      'wellness metric fluctuations',
      'occupational health monitoring alerts',
      'fitness for duty assessment triggers',
      'productivity impact indicators',
      'mandatory health screening requirements'
    ],
    loyalty: [
      'conflict of interest protocols',
      'security clearance review procedures',
      'insider threat assessment indicators',
      'corporate allegiance verification',
      'counterintelligence monitoring flags'
    ]
  }

  static getRandomEuphemism(category) {
    const options = this.euphemisms[category] || this.euphemisms.romance
    return gameRandom.chance.pickone(options)
  }

  static corporatize(text, category) {
    const euphemism = this.getRandomEuphemism(category)
    return `${text} - Triggering ${euphemism} per Corporate Policy 847-B.`
  }
}

/**
 * Gossip Phase Manager
 * Handles progression through gossip lifecycle phases
 */
export class GossipPhaseManager {
  static getPhaseProgression(archetype, currentPhase, intensity, believerCount) {
    const phases = GOSSIP_ARCHETYPES[archetype].phases
    const currentIndex = phases.indexOf(currentPhase)
    
    // Calculate progression probability based on intensity and spread
    const baseProgression = 0.1 // 10% base chance per tick
    const intensityBonus = intensity / 1000 // Higher intensity = faster progression
    const believerBonus = believerCount / 50 // More believers = faster progression
    
    const progressionChance = baseProgression + intensityBonus + believerBonus
    
    if (gameRandom.chance.bool({ likelihood: progressionChance * 100 })) {
      const nextIndex = Math.min(currentIndex + 1, phases.length - 1)
      return phases[nextIndex]
    }
    
    return currentPhase
  }

  static getPhaseEffects(archetype, phase) {
    const archetypeData = GOSSIP_ARCHETYPES[archetype]
    const phaseIndex = archetypeData.phases.indexOf(phase)
    const totalPhases = archetypeData.phases.length
    
    // Effects intensify as phases progress
    const phaseMultiplier = (phaseIndex + 1) / totalPhases
    
    const effects = { ...archetypeData.gameplayEffects }
    
    // Scale numeric effects by phase
    Object.keys(effects).forEach(key => {
      if (typeof effects[key] === 'number') {
        effects[key] *= phaseMultiplier
      }
    })
    
    return effects
  }
}

/**
 * Mutation Pattern Generator
 * Handles how gossip evolves and changes over time
 */
export class GossipMutationEngine {
  static mutationTypes = [
    'exaggeration', // Makes things worse/more dramatic
    'diminishment', // Downplays the situation
    'target_shift', // Changes who is involved
    'content_drift', // Changes what actually happened
    'corporate_spin', // Adds bureaucratic angle
    'conspiracy', // Adds paranoid elements
    'resolution_rumor' // Suggests how it might be resolved
  ]

  static generateMutation(originalGossip, mutationType, context = {}) {
    const archetype = originalGossip.archetype
    const archetypeData = GOSSIP_ARCHETYPES[archetype]
    
    // Get base template for this mutation type
    let template = archetypeData.template.mutation[mutationType]
    
    if (!template) {
      // Fallback to random mutation type
      const availableTypes = Object.keys(archetypeData.template.mutation)
      mutationType = gameRandom.chance.pickone(availableTypes)
      template = archetypeData.template.mutation[mutationType]
    }
    
    // Apply context substitutions
    let mutatedContent = template
      .replace('[SUBJECT]', context.subject || 'crew member')
      .replace('[TARGET]', context.target || 'someone')
      .replace('[NEW_TARGET]', context.newTarget || gameRandom.chance.pickone(['Chen', 'Martinez', 'Singh', 'Torres']))
      .replace('[LOCATION]', context.location || gameRandom.chance.pickone(['cargo bay', 'engine room', 'break area', 'maintenance tunnel']))
      .replace('[TASK/SYSTEM]', context.task || gameRandom.chance.pickone(['reactor calibration', 'navigation systems', 'life support', 'communications']))
    
    // Add corporate humor
    mutatedContent = CorporateHumorizer.corporatize(mutatedContent, archetype.split('_')[0])
    
    return {
      content: mutatedContent,
      mutationType,
      intensityChange: GossipMutationEngine.getIntensityChange(mutationType),
      veracityChange: GossipMutationEngine.getVeracityChange(mutationType)
    }
  }

  static getIntensityChange(mutationType) {
    const changes = {
      exaggeration: 15,
      diminishment: -10,
      target_shift: 5,
      content_drift: 8,
      corporate_spin: 3,
      conspiracy: 20,
      resolution_rumor: -5
    }
    
    return changes[mutationType] || 0
  }

  static getVeracityChange(mutationType) {
    const changes = {
      exaggeration: -15,
      diminishment: 5,
      target_shift: -20,
      content_drift: -25,
      corporate_spin: 0,
      conspiracy: -30,
      resolution_rumor: 10
    }
    
    return changes[mutationType] || 0
  }
}

export default GOSSIP_ARCHETYPES