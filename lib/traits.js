/**
 * Spacepunk Trait System - Progressive Complexity
 * 
 * Level I traits (70% spawn rate): Basic competencies with corporate euphemisms
 * Level II traits (25% spawn rate): Rare abilities with quirky names  
 * Level III traits (5% spawn rate): Corrupted/evolved traits with risks
 */

export const TRAIT_DEFINITIONS = {
  // LEVEL I TRAITS - Basic competencies (70% spawn rate)
  'handy_with_tools': {
    level: 1,
    name: 'Handy With Tools',
    description: 'Demonstrates above-average mechanical aptitude with standard equipment.',
    effects: { engineering: +15, maintenance_speed: +20 },
    spawn_rate: 0.12,
    corporate_memo: 'Employee shows satisfactory tool utilization metrics.'
  },
  'good_with_people': {
    level: 1, 
    name: 'Good With People',
    description: 'Exhibits effective interpersonal communication protocols.',
    effects: { social: +15, crew_morale_bonus: +10 },
    spawn_rate: 0.10,
    corporate_memo: 'Demonstrates adequate social compliance behaviors.'
  },
  'steady_hands': {
    level: 1,
    name: 'Steady Hands', 
    description: 'Maintains consistent fine motor control under standard operating conditions.',
    effects: { piloting: +15, precision_tasks: +25 },
    spawn_rate: 0.09,
    corporate_memo: 'Manual dexterity scores within acceptable parameters.'
  },
  'quick_learner': {
    level: 1,
    name: 'Quick Learner',
    description: 'Absorbs new procedures at enhanced rate per training modules.',
    effects: { skill_training_speed: +30, adaptability: +20 },
    spawn_rate: 0.08,
    corporate_memo: 'Demonstrates accelerated knowledge acquisition protocols.'
  },
  'team_player': {
    level: 1,
    name: 'Team Player',
    description: 'Integrates smoothly with existing workforce structures.',
    effects: { crew_harmony: +15, conflict_resistance: +25 },
    spawn_rate: 0.11,
    corporate_memo: 'Exhibits collaborative optimization behaviors.'
  },
  'detail_oriented': {
    level: 1,
    name: 'Detail Oriented',
    description: 'Maintains consistent attention to procedural specifications.',
    effects: { error_reduction: +30, quality_control: +20 },
    spawn_rate: 0.10,
    corporate_memo: 'Error rates below standard deviation thresholds.'
  },
  'works_well_under_pressure': {
    level: 1,
    name: 'Works Well Under Pressure',
    description: 'Performance metrics remain stable during elevated stress conditions.',
    effects: { stress_resistance: +25, emergency_bonus: +15 },
    spawn_rate: 0.10,
    corporate_memo: 'Stress testing indicates acceptable threshold tolerances.'
  },

  // LEVEL II TRAITS - Rare abilities (25% spawn rate)
  'caffeinated_beyond_reason': {
    level: 2,
    name: 'Caffeinated Beyond Reason',
    description: 'Has transcended normal human sleep requirements through chemical enhancement.',
    effects: { fatigue_resistance: +50, work_speed: +35, health_decay: -5 },
    spawn_rate: 0.04,
    corporate_memo: 'Productivity metrics exceed baseline by 347%. Medical recommends monitoring.',
    unlock_condition: 'engineering > 60'
  },
  'bureaucracy_whisperer': {
    level: 2,
    name: 'Bureaucracy Whisperer',
    description: 'Possesses uncanny ability to navigate complex administrative systems.',
    effects: { permit_speed: +60, fee_reduction: +25, red_tape_immunity: true },
    spawn_rate: 0.03,
    corporate_memo: 'Paperwork completion rates suggest possible regulatory system exploitation.',
    unlock_condition: 'social > 70'
  },
  'void_touched': {
    level: 2, 
    name: 'Void Touched',
    description: 'Extended deep space exposure has altered perception of reality.',
    effects: { navigation_intuition: +40, sanity: -10, anomaly_detection: +50 },
    spawn_rate: 0.03,
    corporate_memo: 'Psychological profile shows space adaptation syndrome. Continue monitoring.',
    unlock_condition: 'piloting > 65'
  },
  'numbers_person': {
    level: 2,
    name: 'Numbers Person', 
    description: 'Processes financial data with suspicious efficiency and accuracy.',
    effects: { trade_profit: +30, market_prediction: +45, audit_immunity: +25 },
    spawn_rate: 0.04,
    corporate_memo: 'Revenue optimization capabilities noted. Recommend profit-sharing incentives.',
    unlock_condition: 'social > 50 && engineering > 40'
  },
  'lucky_streak': {
    level: 2,
    name: 'Lucky Streak',
    description: 'Demonstrates statistically improbable positive outcome frequency.',
    effects: { critical_success_chance: +15, accident_avoidance: +30, gambling_bonus: +40 },
    spawn_rate: 0.02,
    corporate_memo: 'Probability analysis suggests statistical anomaly. Insurance rates adjusted.',
    unlock_condition: 'random'
  },
  'silver_tongue': {
    level: 2,
    name: 'Silver Tongue',
    description: 'Persuasive communication abilities border on manipulation.',
    effects: { negotiation_bonus: +45, hiring_cost_reduction: +20, crew_loyalty: +25 },
    spawn_rate: 0.03,
    corporate_memo: 'Interpersonal influence metrics exceed normal human baselines.',
    unlock_condition: 'social > 80'
  },
  'systems_intuition': {
    level: 2,
    name: 'Systems Intuition',
    description: 'Understands complex machinery through inexplicable intuitive processes.',
    effects: { repair_speed: +50, diagnostic_accuracy: +40, breakdown_prediction: +35 },
    spawn_rate: 0.03,
    corporate_memo: 'Troubleshooting success rates suggest non-standard diagnostic methodologies.',
    unlock_condition: 'engineering > 75'
  },
  'corporate_stockholm_syndrome': {
    level: 2,
    name: 'Corporate Stockholm Syndrome',
    description: 'Has developed genuine affection for bureaucratic processes and procedures.',
    effects: { compliance_bonus: +40, regulation_love: +30, rebellion_immunity: true },
    spawn_rate: 0.02,
    corporate_memo: 'Employee exhibits model corporate loyalty behaviors. Recommend for advancement.',
    unlock_condition: 'loyalty > 85'
  },

  // LEVEL III TRAITS - Corrupted/evolved (5% spawn rate)
  'third_arm_efficiency': {
    level: 3,
    name: 'Third Arm Efficiency',
    description: 'Grew additional appendage after exposure to exotic matter. Productivity soared.',
    effects: { 
      multitasking: +75, 
      tool_speed: +60, 
      social_acceptance: -30,
      medical_costs: +15
    },
    spawn_rate: 0.008,
    corruption_risk: 'high',
    corporate_memo: 'Appendage deemed "productivity enhancement" rather than mutation. Legal cleared it.',
    unlock_condition: 'engineering > 85 && exotic_matter_exposure > 10',
    side_effects: ['Requires custom equipment', 'Startles other crew members', 'Extra food rations']
  },
  'temporal_displacement_syndrome': {
    level: 3,
    name: 'Temporal Displacement Syndrome', 
    description: 'Experiences time non-linearly. Sometimes finishes tasks before starting them.',
    effects: {
      precognitive_maintenance: +80,
      time_efficiency: +50,
      temporal_confusion: -25,
      aging_irregularity: true
    },
    spawn_rate: 0.005,
    corruption_risk: 'extreme',
    corporate_memo: 'Causality violations logged. Physics department requests interview.',
    unlock_condition: 'piloting > 90 && FTL_jumps > 100',
    side_effects: ['Age unpredictably', 'Confuses other crew', 'Temporal paradox risk']
  },
  'hive_mind_integration': {
    level: 3,
    name: 'Hive Mind Integration',
    description: 'Connected to collective consciousness of their homeworld. Knows things they shouldn\'t.',
    effects: {
      information_access: +90,
      collective_wisdom: +60,
      individual_identity: -40,
      privacy_violation: true
    },
    spawn_rate: 0.004,
    corruption_risk: 'extreme', 
    corporate_memo: 'Information leak containment protocols activated. Monitor all communications.',
    unlock_condition: 'social > 90 && cultural_background === "Collective"',
    side_effects: ['Violates privacy', 'Unpredictable loyalties', 'Corporate espionage risk']
  },
  'reality_bender': {
    level: 3,
    name: 'Reality Bender',
    description: 'Fundamental laws of physics seem negotiable around this individual.',
    effects: {
      impossible_repairs: +100,
      physics_immunity: +75,
      equipment_instability: +40,
      causality_violations: true
    },
    spawn_rate: 0.002,
    corruption_risk: 'maximum',
    corporate_memo: 'Phenomenon classified Level 7 Reality Distortion. All departments monitor.',
    unlock_condition: 'engineering > 95 && anomaly_encounters > 50',
    side_effects: ['Equipment behaves strangely', 'Physics-defying incidents', 'Corporate attention']
  },
  'crystalline_neural_structure': {
    level: 3,
    name: 'Crystalline Neural Structure',
    description: 'Brain partially crystallized after prolonged exposure to quantum computing arrays.',
    effects: {
      computational_thinking: +85,
      data_processing: +70,
      emotional_suppression: -50,
      quantum_sensitivity: true
    },
    spawn_rate: 0.003,
    corruption_risk: 'high',
    corporate_memo: 'Neural modifications noted. IT department requests consultation access.',
    unlock_condition: 'engineering > 80 && quantum_exposure > 25',
    side_effects: ['Emotional flatness', 'Speaks in technical jargon', 'Quantum interference']
  }
}

// Trait utility functions
export function getTraitsByLevel(level) {
  return Object.entries(TRAIT_DEFINITIONS)
    .filter(([_, trait]) => trait.level === level)
    .reduce((acc, [key, trait]) => ({ ...acc, [key]: trait }), {})
}

export function getTraitSpawnPool() {
  const pool = []
  Object.entries(TRAIT_DEFINITIONS).forEach(([key, trait]) => {
    const count = Math.floor(trait.spawn_rate * 1000) // Scale for random selection
    for (let i = 0; i < count; i++) {
      pool.push(key)
    }
  })
  return pool
}

export function generateRandomTrait(crewData = {}) {
  const pool = getTraitSpawnPool()
  const selectedKey = pool[Math.floor(Math.random() * pool.length)]
  const trait = TRAIT_DEFINITIONS[selectedKey]
  
  // Check unlock conditions
  if (trait.unlock_condition && !evaluateUnlockCondition(trait.unlock_condition, crewData)) {
    // Fall back to Level I trait if unlock condition not met
    const level1Traits = getTraitsByLevel(1)
    const level1Keys = Object.keys(level1Traits)
    const fallbackKey = level1Keys[Math.floor(Math.random() * level1Keys.length)]
    return { key: fallbackKey, ...level1Traits[fallbackKey] }
  }
  
  return { key: selectedKey, ...trait }
}

function evaluateUnlockCondition(condition, crewData) {
  // Simple condition evaluator - in real implementation would be more robust
  if (condition === 'random') return Math.random() < 0.1
  
  // Parse conditions like "engineering > 60" or "social > 70"
  const skillConditions = condition.match(/(\w+) > (\d+)/g)
  if (skillConditions) {
    return skillConditions.every(cond => {
      const [skill, threshold] = cond.split(' > ')
      return (crewData.skills?.[skill] || 0) > parseInt(threshold)
    })
  }
  
  return true // Default to unlocked if we can't parse condition
}

export function getPlayerVisibleTraits(traits, playerTraits = []) {
  // Progressive revelation based on player's meta-knowledge traits
  const visibilityLevel = getTraitVisibilityLevel(playerTraits)
  
  return traits.map(trait => {
    const traitDef = TRAIT_DEFINITIONS[trait.key] || {}
    
    switch (visibilityLevel) {
      case 'basic':
        // Only show trait exists, not details
        return {
          name: '???',
          description: 'Requires personnel evaluation training to identify.',
          level: '?',
          hidden: true
        }
        
      case 'moderate':
        // Show trait name and level, but not effects
        return {
          name: traitDef.name,
          description: traitDef.description,
          level: traitDef.level,
          effects_hidden: true
        }
        
      case 'advanced':
        // Show everything except corporate memos
        return {
          ...traitDef,
          corporate_memo_hidden: true
        }
        
      case 'expert':
        // Show everything
        return traitDef
        
      default:
        return traitDef
    }
  })
}

function getTraitVisibilityLevel(playerTraits) {
  if (playerTraits.includes('knows_the_business')) return 'expert'
  if (playerTraits.includes('good_judge_of_character')) return 'advanced' 
  if (playerTraits.includes('pays_attention_to_people')) return 'moderate'
  return 'basic'
}