/**
 * Gossip Archetype System for Spacepunk
 * 
 * Each archetype defines a pattern of crew drama that:
 * - Has predictable gameplay mechanics
 * - Uses LLM for specific, contextual details
 * - Mutates and spreads through the crew network
 * - Maintains corporate dark humor tone
 */

export const GOSSIP_ARCHETYPES = {
  // 1. THE OFFICE ROMANCE
  OFFICE_ROMANCE: {
    id: 'office_romance',
    name: 'Office Romance',
    template: '{subjectA} has feelings for {subjectB}',
    
    // LLM content hooks - what the AI generates
    llmHooks: {
      behaviors: [
        'lingering glances during shift changes',
        'mysteriously appearing with extra coffee',
        'awkward elevator conversations',
        'sudden interest in {subjectB}\'s department meetings',
        'conspicuous grooming improvements'
      ],
      complications: [
        '{subjectB} is oblivious',
        '{subjectB} is dating {subjectC}',
        'company policy violations',
        'different shift schedules',
        'rank disparity issues'
      ]
    },
    
    // Gameplay impacts
    gameplayEffects: {
      positive: {
        workEfficiency: -0.1, // Distracted but happy
        morale: +0.2,
        teamwork: +0.15 // If reciprocated
      },
      negative: {
        workEfficiency: -0.25, // Very distracted
        morale: -0.3, // If rejected
        teamwork: -0.2 // Awkward dynamics
      }
    },
    
    // How gossip evolves
    mutationPatterns: [
      { phase: 'CRUSH', duration: 7, next: 'OBVIOUS' },
      { phase: 'OBVIOUS', duration: 14, next: ['CONFESSION', 'GIVING_UP'] },
      { phase: 'CONFESSION', duration: 3, next: ['DATING', 'REJECTION'] },
      { phase: 'DATING', duration: 30, next: ['STABLE', 'BREAKUP'] },
      { phase: 'REJECTION', duration: 21, next: 'AWKWARD_AFTERMATH' }
    ],
    
    // Who spreads this gossip and why
    spreadMechanics: {
      primarySpreaders: ['bestFriend', 'rival', 'gossip_trait'],
      spreadChance: 0.7,
      departmentSpreadBonus: 0.2,
      factorsIncreaseSpread: ['obvious_behavior', 'rank_difference', 'policy_violation']
    }
  },

  // 2. THE COMPETENCE CRISIS
  COMPETENCE_CRISIS: {
    id: 'competence_crisis',
    name: 'Competence Crisis',
    template: '{subject} can\'t handle {responsibility}',
    
    llmHooks: {
      incidents: [
        'forgot to calibrate the {system} again',
        'triple-checked simple calculations',
        'asked {colleague} for help with basic {task}',
        'automation scripts keep failing',
        'mysteriously busy during {responsibility} windows'
      ],
      coverups: [
        'blamed it on system lag',
        'claimed "new protocol confusion"',
        'got {colleague} to do it quietly',
        'submitted fake completion reports',
        'developed sudden "migraines" during shifts'
      ]
    },
    
    gameplayEffects: {
      direct: {
        skillRating: -0.3,
        taskFailureRate: +0.4,
        stressLevel: +0.35
      },
      cascade: {
        teamEfficiency: -0.15,
        safetyRating: -0.2,
        coverupStress: +0.25 // For those helping
      }
    },
    
    mutationPatterns: [
      { phase: 'STRUGGLING', duration: 5, next: 'NOTICED' },
      { phase: 'NOTICED', duration: 7, next: ['HELPED', 'REPORTED'] },
      { phase: 'HELPED', duration: 14, next: ['IMPROVING', 'DEPENDENT'] },
      { phase: 'REPORTED', duration: 3, next: ['DEMOTED', 'TRAINING'] },
      { phase: 'DEPENDENT', duration: 21, next: 'RESENTMENT' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['supervisor', 'shift_partner', 'safety_officer'],
      spreadChance: 0.8,
      criticalSystemBonus: 0.3,
      factorsIncreaseSpread: ['safety_incident', 'repeated_failures', 'cover_up_discovered']
    }
  },

  // 3. THE SECRET PAST
  SECRET_PAST: {
    id: 'secret_past',
    name: 'Secret Past',
    template: '{subject} has hidden {background}',
    
    llmHooks: {
      backgrounds: [
        'military black ops experience',
        'corporate espionage conviction',
        'lost an entire crew once',
        'wealthy family connections',
        'banned from three systems',
        'medical experimentation survivor'
      ],
      slipups: [
        'knew too much about {classified_system}',
        'flinched at mention of {location}',
        'received encrypted messages at odd hours',
        'recognized by mysterious visitor',
        'nightmares in three languages'
      ]
    },
    
    gameplayEffects: {
      revealed: {
        trust: -0.4, // Initial shock
        respect: +0.3, // Depending on secret
        factionRelations: '±0.5' // Varies by faction
      },
      hidden: {
        stress: +0.2,
        paranoia: +0.3,
        workFocus: -0.15
      }
    },
    
    mutationPatterns: [
      { phase: 'SUSPICIOUS', duration: 14, next: 'INVESTIGATING' },
      { phase: 'INVESTIGATING', duration: 21, next: ['CONFRONTATION', 'DROPPED'] },
      { phase: 'CONFRONTATION', duration: 1, next: ['REVEALED', 'DENIED'] },
      { phase: 'REVEALED', duration: 7, next: ['ACCEPTED', 'OSTRACIZED'] },
      { phase: 'ACCEPTED', duration: 30, next: 'INTEGRATED' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['roommate', 'security_chief', 'curious_trait'],
      spreadChance: 0.5,
      mysteryBonus: 0.4, // People love mysteries
      factorsIncreaseSpread: ['contradiction_noticed', 'database_search', 'drunk_confession']
    }
  },

  // 4. THE HEALTH SCARE
  HEALTH_SCARE: {
    id: 'health_scare',
    name: 'Health Scare',
    template: '{subject} might have {condition}',
    
    llmHooks: {
      symptoms: [
        'coughing during meetings',
        'dizzy spells at console',
        'unexplained weight loss',
        'trembling hands on controls',
        'frequent med-bay visits',
        'new dietary restrictions'
      ],
      conditions: [
        'zero-g bone deterioration',
        'radiation exposure syndrome',
        'jumpspace sickness',
        'synthetic food allergy',
        'chronic sleep deprivation',
        'early-onset space dementia'
      ]
    },
    
    gameplayEffects: {
      physical: {
        workCapacity: -0.3,
        reliability: -0.25,
        medicalCosts: +500 // Credits per cycle
      },
      social: {
        crewSympathy: +0.2,
        protectiveness: +0.3,
        workloadRedistribution: true
      }
    },
    
    mutationPatterns: [
      { phase: 'NOTICED', duration: 7, next: 'WORRIED' },
      { phase: 'WORRIED', duration: 14, next: ['DIAGNOSED', 'FALSE_ALARM'] },
      { phase: 'DIAGNOSED', duration: 30, next: ['MANAGING', 'DETERIORATING'] },
      { phase: 'MANAGING', duration: 60, next: 'STABLE' },
      { phase: 'FALSE_ALARM', duration: 3, next: 'EMBARRASSED' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['shift_partner', 'medical_staff', 'caring_trait'],
      spreadChance: 0.6,
      visibleSymptomsBonus: 0.3,
      factorsIncreaseSpread: ['collapse_incident', 'medical_leave', 'visible_medication']
    }
  },

  // 5. THE LOYALTY QUESTION
  LOYALTY_QUESTION: {
    id: 'loyalty_question',
    name: 'Loyalty Question',
    template: '{subject} might be working for {faction}',
    
    llmHooks: {
      suspiciousBehaviors: [
        'encrypted comms to {faction} space',
        'unexplained wealth increase',
        'defending {faction} policies',
        'routing changes favor {faction} territory',
        'meeting with {faction} representatives'
      ],
      factions: [
        'MegaCorp Oversight Division',
        'Independent Traders Union',
        'System Security Bureau',
        'Black Market Syndicate',
        'Religious Prosperity Cult',
        'AI Liberation Front'
      ]
    },
    
    gameplayEffects: {
      suspected: {
        crewTrust: -0.5,
        paranoia: +0.4,
        securityAlerts: +0.3
      },
      proven: {
        factionRelations: '±0.7',
        crewLoyalty: -0.6,
        espionageRisk: +0.8
      }
    },
    
    mutationPatterns: [
      { phase: 'SUSPICIOUS', duration: 10, next: 'INVESTIGATING' },
      { phase: 'INVESTIGATING', duration: 14, next: ['EVIDENCE', 'CLEARED'] },
      { phase: 'EVIDENCE', duration: 7, next: ['CONFRONTED', 'REPORTED'] },
      { phase: 'CONFRONTED', duration: 1, next: ['ADMITTED', 'DENIED', 'FLED'] },
      { phase: 'FLED', duration: 0, next: 'MANHUNT' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['security_officer', 'paranoid_trait', 'rival'],
      spreadChance: 0.75,
      evidenceBonus: 0.4,
      factorsIncreaseSpread: ['caught_transmitting', 'wealth_noticed', 'faction_visit']
    }
  },

  // 6. THE SUBSTANCE SITUATION
  SUBSTANCE_SITUATION: {
    id: 'substance_situation',
    name: 'Substance Situation',
    template: '{subject} has a problem with {substance}',
    
    llmHooks: {
      substances: [
        'syntho-stims',
        'gravity compensators',
        'memory enhancers',
        'sleep replacers',
        'mood stabilizers',
        'bootleg jump-juice'
      ],
      behaviors: [
        'jittery during morning briefings',
        'suspicious bathroom breaks',
        'mood swings mid-shift',
        'borrowing credits frequently',
        'avoiding medical scans',
        'new "pharmaceutical" contacts'
      ]
    },
    
    gameplayEffects: {
      active: {
        performance: '±0.4', // Varies by cycle
        reliability: -0.35,
        accidentRisk: +0.4
      },
      social: {
        crewConcern: +0.3,
        enablers: 0.2, // Chance someone helps
        interventionChance: 0.4
      }
    },
    
    mutationPatterns: [
      { phase: 'RECREATIONAL', duration: 30, next: ['CONTROLLED', 'ESCALATING'] },
      { phase: 'ESCALATING', duration: 14, next: ['OBVIOUS', 'CRISIS'] },
      { phase: 'CRISIS', duration: 3, next: ['INTERVENTION', 'ACCIDENT'] },
      { phase: 'INTERVENTION', duration: 21, next: ['RECOVERY', 'RELAPSE'] },
      { phase: 'RECOVERY', duration: 60, next: 'CLEAN' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['roommate', 'shift_partner', 'dealer_connection'],
      spreadChance: 0.5,
      incidentBonus: 0.5,
      factorsIncreaseSpread: ['performance_issues', 'caught_using', 'medical_emergency']
    }
  },

  // 7. THE TECHNICAL HERESY
  TECHNICAL_HERESY: {
    id: 'technical_heresy',
    name: 'Technical Heresy',
    template: '{subject} uses {unorthodox_method} for {system}',
    
    llmHooks: {
      methods: [
        'pre-war protocols',
        'alien-inspired algorithms',
        'lucky charm integration',
        'meditation-based diagnostics',
        'outlawed AI assistance',
        'percussive maintenance'
      ],
      results: [
        '40% efficiency increase',
        'unexplained stability',
        'impossible heat dissipation',
        'violates three physics laws',
        'makes other engineers nervous'
      ]
    },
    
    gameplayEffects: {
      successful: {
        systemEfficiency: +0.35,
        orthodoxAnger: +0.4,
        curiosity: +0.5
      },
      failed: {
        systemDamage: +0.6,
        reputation: -0.4,
        disciplinaryAction: 0.7
      }
    },
    
    mutationPatterns: [
      { phase: 'EXPERIMENTING', duration: 14, next: ['SUCCESS', 'FAILURE'] },
      { phase: 'SUCCESS', duration: 21, next: ['ADOPTED', 'BANNED'] },
      { phase: 'ADOPTED', duration: 30, next: 'NEW_STANDARD' },
      { phase: 'BANNED', duration: 7, next: ['SECRET_USE', 'ABANDONED'] },
      { phase: 'FAILURE', duration: 3, next: 'DISCIPLINED' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['engineering_dept', 'tech_curious', 'orthodox_engineers'],
      spreadChance: 0.65,
      successBonus: 0.4,
      factorsIncreaseSpread: ['visible_results', 'system_inspection', 'teaching_others']
    }
  },

  // 8. THE DEBT SPIRAL
  DEBT_SPIRAL: {
    id: 'debt_spiral',
    name: 'Debt Spiral',
    template: '{subject} owes {amount} to {creditor}',
    
    llmHooks: {
      creditors: [
        'station loan sharks',
        'gambling syndicate',
        'medical debt collectors',
        'family back home',
        'black market suppliers',
        'fellow crew members'
      ],
      desperateMeasures: [
        'selling personal items',
        'taking extra shifts',
        'suspicious side jobs',
        'borrowing from crew',
        'skipping meals',
        'falsifying expense reports'
      ]
    },
    
    gameplayEffects: {
      financial: {
        creditDrain: -100, // Per cycle
        stressLevel: +0.45,
        desperationIndex: +0.3
      },
      behavioral: {
        theftRisk: +0.35,
        workOverload: +0.4,
        loyalty: -0.3 // May take bribes
      }
    },
    
    mutationPatterns: [
      { phase: 'MANAGEABLE', duration: 30, next: ['PAID_OFF', 'GROWING'] },
      { phase: 'GROWING', duration: 14, next: ['DESPERATE', 'NEGOTIATED'] },
      { phase: 'DESPERATE', duration: 7, next: ['THEFT', 'BREAKDOWN', 'BAILOUT'] },
      { phase: 'BAILOUT', duration: 1, next: 'GRATEFUL' },
      { phase: 'THEFT', duration: 0, next: 'DISCOVERED' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['creditor_crew', 'financial_officer', 'concerned_friend'],
      spreadChance: 0.4, // People try to keep it quiet
      desperationBonus: 0.5,
      factorsIncreaseSpread: ['payment_missed', 'begging_witnessed', 'repo_attempt']
    }
  },

  // 9. THE FAMILY DRAMA
  FAMILY_DRAMA: {
    id: 'family_drama',
    name: 'Family Drama',
    template: '{subject} has {family_issue} back home',
    
    llmHooks: {
      issues: [
        'dying parent refusing treatment',
        'custody battle over kids',
        'sibling joining a cult',
        'inheritance dispute',
        'arranged marriage pressure',
        'family business collapse'
      ],
      manifestations: [
        'crying in supply closets',
        'angry calls at 0300',
        'legal documents everywhere',
        'suddenly religious/atheist',
        'planning emergency leave',
        'sending all money home'
      ]
    },
    
    gameplayEffects: {
      emotional: {
        focus: -0.35,
        morale: -0.4,
        absenteeism: +0.3
      },
      social: {
        crewSympathy: +0.4,
        supportNetwork: +0.3,
        sharePersonalStories: +0.5
      }
    },
    
    mutationPatterns: [
      { phase: 'PRIVATE', duration: 7, next: 'SHARING' },
      { phase: 'SHARING', duration: 14, next: ['SUPPORTED', 'ISOLATED'] },
      { phase: 'SUPPORTED', duration: 21, next: ['RESOLVED', 'ONGOING'] },
      { phase: 'ISOLATED', duration: 14, next: ['BREAKDOWN', 'HARDENED'] },
      { phase: 'RESOLVED', duration: 3, next: 'GRATEFUL' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['close_friend', 'counselor', 'shift_partner'],
      spreadChance: 0.55,
      visibleDistressBonus: 0.3,
      factorsIncreaseSpread: ['public_breakdown', 'leave_request', 'overheard_calls']
    }
  },

  // 10. THE RIVAL PROMOTION
  RIVAL_PROMOTION: {
    id: 'rival_promotion',
    name: 'Rival Promotion',
    template: '{subjectA} and {subjectB} both want {position}',
    
    llmHooks: {
      positions: [
        'shift supervisor',
        'department head',
        'bridge access',
        'hazard pay assignment',
        'cushy route selection',
        'new equipment privileges'
      ],
      tactics: [
        'subtle sabotage',
        'credit stealing',
        'brown-nosing intensifies',
        'spreading competence doubts',
        'forming alliances',
        'productivity warfare'
      ]
    },
    
    gameplayEffects: {
      competition: {
        productivity: +0.25, // Short term
        stress: +0.35,
        teamCohesion: -0.4
      },
      aftermath: {
        winnerMorale: +0.5,
        loserMorale: -0.6,
        departmentTension: +0.3
      }
    },
    
    mutationPatterns: [
      { phase: 'COMPETING', duration: 14, next: 'INTENSIFYING' },
      { phase: 'INTENSIFYING', duration: 7, next: ['DECIDED', 'SCANDAL'] },
      { phase: 'DECIDED', duration: 1, next: ['ACCEPTANCE', 'RESENTMENT'] },
      { phase: 'RESENTMENT', duration: 30, next: ['RESIGNATION', 'SABOTAGE'] },
      { phase: 'SCANDAL', duration: 3, next: 'BOTH_LOSE' }
    ],
    
    spreadMechanics: {
      primarySpreaders: ['department_members', 'betting_pool', 'management'],
      spreadChance: 0.85, // Everyone knows
      departmentBonus: 0.15,
      factorsIncreaseSpread: ['public_confrontation', 'obvious_sabotage', 'choosing_sides']
    }
  }
};

// Gossip state machine for managing transitions
export class GossipStateMachine {
  constructor(gossipInstance) {
    this.gossip = gossipInstance;
    this.archetype = GOSSIP_ARCHETYPES[gossipInstance.archetypeId];
    this.currentPhase = gossipInstance.phase || this.archetype.mutationPatterns[0].phase;
    this.phaseDuration = 0;
  }

  tick() {
    this.phaseDuration++;
    
    const currentPattern = this.archetype.mutationPatterns.find(p => p.phase === this.currentPhase);
    
    if (this.phaseDuration >= currentPattern.duration) {
      this.transitionPhase(currentPattern.next);
    }
  }

  transitionPhase(nextOptions) {
    if (Array.isArray(nextOptions)) {
      // Choose based on contextual factors
      this.currentPhase = this.selectNextPhase(nextOptions);
    } else {
      this.currentPhase = nextOptions;
    }
    
    this.phaseDuration = 0;
    this.gossip.phase = this.currentPhase;
  }

  selectNextPhase(options) {
    // This would use crew relationships, traits, and random factors
    // For now, random selection
    return options[Math.floor(Math.random() * options.length)];
  }
}

// Helper function to generate gossip from archetype
export function generateGossipFromArchetype(archetypeId, subjects, context = {}) {
  const archetype = GOSSIP_ARCHETYPES[archetypeId];
  
  if (!archetype) {
    throw new Error(`Unknown gossip archetype: ${archetypeId}`);
  }

  return {
    id: `gossip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    archetypeId,
    subjects,
    phase: archetype.mutationPatterns[0].phase,
    startTime: Date.now(),
    context,
    spreadTo: [],
    believers: [],
    deniers: [],
    effects: {
      current: {},
      accumulated: {}
    }
  };
}

// Corporate humor templates for fallback generation
export const CORPORATE_GOSSIP_TEMPLATES = {
  spread: [
    "{spreader} mentioned during the mandatory wellness check that {gossip}",
    "According to the water cooler terminal, {gossip}",
    "{spreader} cc'd half the crew on an 'accidental' reply-all about how {gossip}",
    "The suggestion box somehow contained details about how {gossip}",
    "During sensitivity training, {spreader} used the example that {gossip}"
  ],
  
  denial: [
    "{subject} filed form 42-B (Rumor Denial) claiming no knowledge of {gossip}",
    "{subject}'s official statement: 'That's a violation of privacy policy'",
    "{subject} threatened to report {gossip} to HR (like that ever helps)",
    "{subject} sent a cease-and-desist template about {gossip}",
    "{subject} claims {gossip} is 'fake news' and 'performance review manipulation'"
  ],
  
  confirmation: [
    "Security footage 'accidentally' leaked showing {gossip} is true",
    "{subject} forgot to mute during a vid-call, confirming {gossip}",
    "Medical posted a 'anonymous' health alert that basically confirms {gossip}",
    "The shift schedule changes basically prove {gossip}",
    "Accounting noticed the expense reports align with {gossip}"
  ]
};

export default {
  GOSSIP_ARCHETYPES,
  GossipStateMachine,
  generateGossipFromArchetype,
  CORPORATE_GOSSIP_TEMPLATES
};