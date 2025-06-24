import Chance from 'chance'

export class StoryConsequenceEngine {
  constructor(seed = 'story-consequences') {
    this.chance = new Chance(seed)
    
    // Track cascading consequences across all systems
    this.consequenceHistory = new Map() // playerId -> consequence chain
    this.globalReputation = new Map() // playerId -> reputation across different factions
    this.narrativeMemory = new Map() // playerId -> memorable events that affect future stories
  }

  // CORE FUNCTION: Process a player choice and cascade effects across ALL systems
  processPlayerChoice(playerId, choice, context, gameState) {
    console.log(`📖 Processing story consequences for choice: ${choice.id}`)
    
    const consequences = {
      immediate: {},
      cascading: [],
      narrative_memory: [],
      future_modifiers: []
    }
    
    // 1. IMMEDIATE CONSEQUENCES (existing systems)
    consequences.immediate = this.processImmediateEffects(choice, context, gameState)
    
    // 2. POLITICAL CONSEQUENCES
    const politicalEffects = this.processPoliticalConsequences(playerId, choice, context, gameState)
    consequences.cascading.push(...politicalEffects)
    
    // 3. CREW MORALE CONSEQUENCES  
    const crewEffects = this.processCrewConsequences(playerId, choice, context, gameState)
    consequences.cascading.push(...crewEffects)
    
    // 4. MARKET RIPPLE EFFECTS
    const marketEffects = this.processMarketConsequences(playerId, choice, context, gameState)
    consequences.cascading.push(...marketEffects)
    
    // 5. MISSION AVAILABILITY CHANGES
    const missionEffects = this.processMissionConsequences(playerId, choice, context, gameState)
    consequences.cascading.push(...missionEffects)
    
    // 6. REGIME IDEOLOGY REACTIONS
    const regimeEffects = this.processRegimeConsequences(playerId, choice, context, gameState)
    consequences.cascading.push(...regimeEffects)
    
    // 7. NARRATIVE MEMORY FORMATION
    const memoryEffects = this.processNarrativeMemory(playerId, choice, context, gameState)
    consequences.narrative_memory.push(...memoryEffects)
    
    // 8. FUTURE CHOICE MODIFIERS
    const futureEffects = this.processFutureModifiers(playerId, choice, context, gameState)
    consequences.future_modifiers.push(...futureEffects)
    
    // Store consequences for future reference
    this.storeConsequenceChain(playerId, choice, consequences)
    
    return consequences
  }
  
  processImmediateEffects(choice, context, gameState) {
    // These are the existing fuel/credits/heat changes
    return choice.consequences || {}
  }
  
  processPoliticalConsequences(playerId, choice, context, gameState) {
    const effects = []
    
    // Different choice types affect political standing differently
    const politicalImpacts = {
      // Espionage choices
      'decrypt': { heat: +15, corporate_suspicion: +20, underground_credibility: +10 },
      'trace': { heat: +10, investigative_reputation: +15 },
      'spy': { heat: +20, intelligence_network: +25, corporate_suspicion: +30 },
      
      // Political choices
      'bribe': { political_corruption: +30, corporate_connections: +20, moral_standing: -25 },
      'blackmail': { political_leverage: +40, enemies_made: +50, moral_standing: -40 },
      'report_politician': { corporate_standing: +30, whistleblower_reputation: +20, political_enemies: +25 },
      
      // Trade choices
      'negotiate': { diplomatic_reputation: +15, fair_dealer_reputation: +10 },
      'aggressive': { intimidation_reputation: +25, diplomatic_reputation: -15, future_cooperation: -20 },
      'withdraw': { cautious_reputation: +10, missed_opportunities: +5 },
      
      // Exploration choices
      'investigate': { explorer_reputation: +15, risk_taker_reputation: +20 },
      'scan': { methodical_reputation: +10, scientific_reputation: +15 },
      'report': { corporate_compliance: +20, bootlicker_reputation: +15 }
    }
    
    const impact = politicalImpacts[choice.id]
    if (impact) {
      Object.entries(impact).forEach(([reputationType, change]) => {
        effects.push({
          type: 'reputation_change',
          system: 'political',
          reputation_type: reputationType,
          change: change,
          description: `${choice.id} action affected ${reputationType} by ${change}`,
          affects_future_encounters: true
        })
      })
    }
    
    // REGIME-SPECIFIC REACTIONS
    const regime = gameState.politicalRegime || { ideology: 'corporate_authoritarianism' }
    const regimeReaction = this.calculateRegimeReaction(choice.id, regime.ideology)
    if (regimeReaction.severity > 10) {
      effects.push({
        type: 'regime_attention',
        system: 'political',
        regime: regime.name,
        reaction: regimeReaction.type,
        severity: regimeReaction.severity,
        description: `${regime.name} ${regimeReaction.description}`,
        future_choice_modifiers: regimeReaction.modifiers
      })
    }
    
    return effects
  }
  
  processCrewConsequences(playerId, choice, context, gameState) {
    const effects = []
    
    // Crew members have opinions about player choices based on their personalities
    const crewReactions = {
      // Ethical/moral choices
      'bribe': { 
        moral_crew_disapproval: -20, 
        pragmatic_crew_approval: +10,
        affects_loyalty: true,
        narrative: "Crew members debate the ethics of your financial arrangements" 
      },
      'blackmail': { 
        moral_crew_disapproval: -30, 
        criminal_crew_approval: +15,
        affects_loyalty: true,
        affects_recruitment: true,
        narrative: "Your crew questions your methods - some approve, others are disturbed"
      },
      'report_politician': { 
        moral_crew_approval: +15, 
        anti_authority_crew_disapproval: -25,
        affects_loyalty: true,
        narrative: "Crew split on whether reporting corruption was brave or naive"
      },
      
      // Risk-taking choices  
      'investigate': { 
        brave_crew_approval: +10, 
        cautious_crew_disapproval: -5,
        affects_training_efficiency: true,
        narrative: "Bold crew members respect your initiative"
      },
      'aggressive': { 
        intimidating_crew_approval: +15, 
        peaceful_crew_disapproval: -20,
        affects_recruitment: true,
        narrative: "Your aggressive tactics impress some crew, alienate others"
      },
      'withdraw': { 
        cautious_crew_approval: +10, 
        brave_crew_disapproval: -10,
        affects_mission_selection: true,
        narrative: "Prudent crew members appreciate your caution"
      }
    }
    
    const reaction = crewReactions[choice.id]
    if (reaction) {
      Object.entries(reaction).forEach(([effect, value]) => {
        if (typeof value === 'number') {
          effects.push({
            type: 'crew_reaction',
            system: 'crew',
            reaction_type: effect,
            change: value,
            description: reaction.narrative,
            affects_future_recruitment: reaction.affects_recruitment || false,
            affects_loyalty: reaction.affects_loyalty || false,
            affects_training: reaction.affects_training_efficiency || false
          })
        }
      })
    }
    
    return effects
  }
  
  processMarketConsequences(playerId, choice, context, gameState) {
    const effects = []
    
    // Market participants remember how you do business
    const marketImpacts = {
      'negotiate': { 
        fair_trader_reputation: +15,
        market_access_improvement: +10,
        better_future_prices: +5,
        description: "Market participants remember your fair dealing"
      },
      'aggressive': { 
        intimidation_reputation: +20,
        market_access_restriction: +15,
        worse_future_prices: +10,
        hostile_trader_reputation: +25,
        description: "Your aggressive tactics earn respect but create enemies"
      },
      'bribe': { 
        corruption_reputation: +30,
        black_market_access: +40,
        law_enforcement_attention: +25,
        description: "Your willingness to pay bribes opens dark doors"
      },
      'report_politician': { 
        corporate_ally_reputation: +25,
        black_market_hostility: +35,
        law_enforcement_ally: +20,
        description: "Reporting corruption makes you friends and enemies"
      }
    }
    
    const impact = marketImpacts[choice.id]
    if (impact) {
      Object.entries(impact).forEach(([effect, value]) => {
        if (typeof value === 'number') {
          effects.push({
            type: 'market_reputation',
            system: 'market',
            reputation_type: effect,
            change: value,
            description: impact.description,
            affects_future_pricing: true,
            affects_market_access: true
          })
        }
      })
    }
    
    // MARKET INTELLIGENCE VALUE CHANGES
    if (['decrypt', 'spy', 'trace'].includes(choice.id)) {
      effects.push({
        type: 'intelligence_value',
        system: 'market',
        intelligence_quality: this.chance.integer({ min: 15, max: 45 }),
        market_sector: this.chance.pickone(['weapons', 'data', 'luxury', 'medical']),
        description: `Your ${choice.id} action revealed valuable market intelligence`,
        triggers_future_opportunities: true
      })
    }
    
    return effects
  }
  
  processMissionConsequences(playerId, choice, context, gameState) {
    const effects = []
    
    // Different choices unlock different types of future missions
    const missionUnlocks = {
      'bribe': ['corruption_missions', 'political_influence_missions'],
      'blackmail': ['intelligence_missions', 'leverage_missions'],
      'spy': ['espionage_missions', 'corporate_infiltration_missions'],
      'decrypt': ['data_theft_missions', 'corporate_secrets_missions'],
      'aggressive': ['intimidation_missions', 'hostile_takeover_missions'],
      'investigate': ['exploration_missions', 'mystery_missions'],
      'report_politician': ['whistleblower_missions', 'corporate_compliance_missions']
    }
    
    const unlocks = missionUnlocks[choice.id]
    if (unlocks) {
      unlocks.forEach(missionType => {
        effects.push({
          type: 'mission_unlock',
          system: 'missions',
          mission_type: missionType,
          unlock_chance: this.chance.integer({ min: 25, max: 75 }),
          description: `Your ${choice.id} action may unlock ${missionType}`,
          availability_modifier: this.chance.floating({ min: 1.2, max: 2.5 })
        })
      })
    }
    
    // MISSION DIFFICULTY MODIFIERS based on reputation
    const difficultyModifiers = {
      'aggressive': { future_negotiation_difficulty: +20, future_intimidation_difficulty: -15 },
      'negotiate': { future_negotiation_difficulty: -10, future_diplomatic_difficulty: -15 },
      'spy': { future_stealth_difficulty: -10, future_security_difficulty: +20 },
      'bribe': { future_corruption_difficulty: -25, future_legal_difficulty: +30 }
    }
    
    const modifier = difficultyModifiers[choice.id]
    if (modifier) {
      Object.entries(modifier).forEach(([difficultyType, change]) => {
        effects.push({
          type: 'mission_difficulty_modifier',
          system: 'missions',
          difficulty_type: difficultyType,
          modifier: change,
          description: `Future ${difficultyType} affected by your ${choice.id} action`,
          permanent: false,
          decay_rate: 0.1 // Gradually loses effect over time
        })
      })
    }
    
    return effects
  }
  
  processRegimeConsequences(playerId, choice, context, gameState) {
    const effects = []
    const regime = gameState.politicalRegime || { ideology: 'corporate_authoritarianism' }
    
    // Each regime has different tolerance for different actions
    const regimeTolerances = {
      'corporate_authoritarianism': {
        'bribe': 'encouraged', 
        'report_politician': 'discouraged',
        'aggressive': 'tolerated',
        'negotiate': 'encouraged'
      },
      'anarcho_capitalism': {
        'bribe': 'tolerated',
        'report_politician': 'discouraged', 
        'aggressive': 'encouraged',
        'spy': 'encouraged'
      },
      'eco_socialism': {
        'bribe': 'forbidden',
        'report_politician': 'encouraged',
        'negotiate': 'encouraged',
        'aggressive': 'discouraged'
      },
      'military_junta': {
        'aggressive': 'encouraged',
        'spy': 'encouraged',
        'bribe': 'tolerated',
        'withdraw': 'discouraged'
      },
      'post_human_technocracy': {
        'spy': 'encouraged',
        'decrypt': 'encouraged',
        'investigate': 'encouraged',
        'report_politician': 'required'
      }
    }
    
    const tolerance = regimeTolerances[regime.ideology]?.[choice.id]
    if (tolerance) {
      const severities = {
        'encouraged': { reputation: +25, attention: -10, description: 'approves of your actions' },
        'tolerated': { reputation: 0, attention: +5, description: 'notes your actions with mild interest' },
        'discouraged': { reputation: -15, attention: +20, description: 'disapproves of your methods' },
        'forbidden': { reputation: -40, attention: +50, description: 'views your actions as criminal' },
        'required': { reputation: +40, attention: -5, description: 'expects this behavior from all citizens' }
      }
      
      const severity = severities[tolerance]
      effects.push({
        type: 'regime_standing',
        system: 'political',
        regime_name: regime.name,
        ideology: regime.ideology,
        reputation_change: severity.reputation,
        attention_change: severity.attention,
        tolerance_level: tolerance,
        description: `${regime.name} ${severity.description}`,
        affects_future_regime_encounters: true
      })
    }
    
    return effects
  }
  
  processNarrativeMemory(playerId, choice, context, gameState) {
    const memories = []
    
    // Significant choices create lasting narrative memories
    const significantChoices = {
      'bribe': {
        memory_type: 'corruption',
        narrative_weight: 'high',
        affects_character_arc: true,
        description: `Paid a bribe to ${context.target || 'an official'}`,
        moral_implications: 'negative'
      },
      'blackmail': {
        memory_type: 'coercion', 
        narrative_weight: 'very_high',
        affects_character_arc: true,
        description: `Used blackmail against ${context.target || 'a politician'}`,
        moral_implications: 'very_negative'
      },
      'report_politician': {
        memory_type: 'whistleblowing',
        narrative_weight: 'high', 
        affects_character_arc: true,
        description: `Reported corruption by ${context.target || 'a politician'}`,
        moral_implications: 'positive'
      },
      'aggressive': {
        memory_type: 'intimidation',
        narrative_weight: 'medium',
        affects_reputation: true,
        description: `Used aggressive tactics in ${context.situation || 'negotiations'}`,
        moral_implications: 'negative'
      }
    }
    
    const memoryData = significantChoices[choice.id]
    if (memoryData) {
      memories.push({
        type: 'narrative_memory',
        system: 'narrative',
        memory_type: memoryData.memory_type,
        narrative_weight: memoryData.narrative_weight,
        description: memoryData.description,
        moral_implications: memoryData.moral_implications,
        affects_character_arc: memoryData.affects_character_arc || false,
        affects_reputation: memoryData.affects_reputation || false,
        timestamp: Date.now(),
        context: context
      })
    }
    
    return memories
  }
  
  processFutureModifiers(playerId, choice, context, gameState) {
    const modifiers = []
    
    // Choices create modifiers that affect future choice availability and outcomes
    const futureModifiers = {
      'bribe': [
        { type: 'future_bribe_efficiency', modifier: 1.25, duration: 10, description: 'Better at bribing officials' },
        { type: 'moral_choice_difficulty', modifier: 1.15, duration: 15, description: 'Harder to make moral choices' }
      ],
      'blackmail': [
        { type: 'intimidation_effectiveness', modifier: 1.4, duration: 12, description: 'More intimidating in negotiations' },
        { type: 'trust_building_difficulty', modifier: 1.5, duration: 20, description: 'Harder to build genuine relationships' }
      ],
      'report_politician': [
        { type: 'whistleblower_opportunities', modifier: 2.0, duration: 25, description: 'More opportunities to report corruption' },
        { type: 'underground_access_difficulty', modifier: 1.3, duration: 15, description: 'Harder to access black markets' }
      ],
      'spy': [
        { type: 'intelligence_gathering', modifier: 1.3, duration: 10, description: 'Better at gathering intelligence' },
        { type: 'corporate_suspicion', modifier: 1.2, duration: 12, description: 'Corporations more suspicious of you' }
      ],
      'aggressive': [
        { type: 'intimidation_success', modifier: 1.35, duration: 8, description: 'More successful at intimidation' },
        { type: 'diplomatic_success', modifier: 0.75, duration: 15, description: 'Less successful at diplomacy' }
      ]
    }
    
    const choiceModifiers = futureModifiers[choice.id]
    if (choiceModifiers) {
      choiceModifiers.forEach(mod => {
        modifiers.push({
          type: 'future_modifier',
          system: 'choice_engine',
          modifier_type: mod.type,
          multiplier: mod.modifier,
          duration_ticks: mod.duration,
          description: mod.description,
          applied_timestamp: Date.now(),
          choice_origin: choice.id
        })
      })
    }
    
    return modifiers
  }
  
  calculateRegimeReaction(choiceId, ideology) {
    // Calculate how strongly a regime reacts to specific choices
    const reactions = {
      'corporate_authoritarianism': {
        'bribe': { type: 'approval', severity: 5, description: 'notes your business acumen', modifiers: { future_corruption_easier: 1.2 } },
        'report_politician': { type: 'suspicion', severity: 25, description: 'questions your loyalty', modifiers: { future_surveillance: 1.4 } }
      },
      'eco_socialism': {
        'bribe': { type: 'condemnation', severity: 40, description: 'condemns your capitalist corruption', modifiers: { eco_missions_blocked: true } },
        'report_politician': { type: 'celebration', severity: 15, description: 'praises your civic responsibility', modifiers: { eco_missions_unlocked: true } }
      },
      'anarcho_capitalism': {
        'report_politician': { type: 'hostility', severity: 35, description: 'despises your statist cooperation', modifiers: { anarchist_missions_blocked: true } },
        'aggressive': { type: 'respect', severity: 20, description: 'respects your self-reliance', modifiers: { anarchist_missions_unlocked: true } }
      }
      // Add more regime-specific reactions
    }
    
    return reactions[ideology]?.[choiceId] || { type: 'indifference', severity: 0, description: 'shows no particular interest', modifiers: {} }
  }
  
  storeConsequenceChain(playerId, choice, consequences) {
    if (!this.consequenceHistory.has(playerId)) {
      this.consequenceHistory.set(playerId, [])
    }
    
    const history = this.consequenceHistory.get(playerId)
    history.push({
      choice: choice,
      consequences: consequences,
      timestamp: Date.now()
    })
    
    // Keep only last 50 choices to prevent memory bloat
    if (history.length > 50) {
      history.shift()
    }
  }
  
  // Get player's consequence history for narrative generation
  getPlayerConsequenceHistory(playerId) {
    return this.consequenceHistory.get(playerId) || []
  }
  
  // Get current reputation across all systems
  getPlayerReputation(playerId) {
    const history = this.getPlayerConsequenceHistory(playerId)
    const reputation = {
      political: {},
      market: {},
      crew: {},
      regime: {}
    }
    
    // Aggregate reputation changes from all consequences
    history.forEach(entry => {
      entry.consequences.cascading.forEach(effect => {
        if (effect.type === 'reputation_change') {
          const system = effect.system
          const repType = effect.reputation_type
          if (!reputation[system][repType]) {
            reputation[system][repType] = 0
          }
          reputation[system][repType] += effect.change
        }
      })
    })
    
    return reputation
  }
  
  // Get active modifiers affecting future choices
  getActiveModifiers(playerId, currentTick) {
    const history = this.getPlayerConsequenceHistory(playerId)
    const activeModifiers = []
    
    history.forEach(entry => {
      entry.consequences.future_modifiers.forEach(modifier => {
        const ticksElapsed = currentTick - Math.floor(entry.timestamp / 30000)
        if (ticksElapsed < modifier.duration_ticks) {
          activeModifiers.push({
            ...modifier,
            ticks_remaining: modifier.duration_ticks - ticksElapsed
          })
        }
      })
    })
    
    return activeModifiers
  }
}