import Chance from 'chance'

export class PoliticalHierarchy {
  constructor(worldSeed = 'political-system') {
    this.chance = new Chance(worldSeed)
    this.politicians = new Map()
    this.playerRelationships = new Map() // playerId -> politician relationships
    
    // Generate the political regime first
    this.regime = this.generatePoliticalRegime()
    
    // Generate the 4 key political figures for this world
    this.generatePoliticalHierarchy()
  }
  
  generatePoliticalRegime() {
    const regimes = [
      {
        name: 'Corporate Hegemony',
        party: 'SpaceCorp Unity Party',
        ideology: 'corporate_authoritarianism',
        description: 'Mega-corporations rule through bureaucratic control',
        marketEffects: {
          corporate_favoritism: 1.5,  // Corporate goods get bonus
          regulation_heavy: 1.3,      // Heavy regulation on everything
          corruption_normalized: 2.0   // Bribery is expected
        },
        politician_traits: {
          greed: 1.5,
          loyalty: 0.7,
          competence: 1.2
        }
      },
      {
        name: 'Libertarian Free Zone',
        party: 'Space Freedom Coalition',
        ideology: 'anarcho_capitalism',
        description: 'Minimal government, maximum individual liberty',
        marketEffects: {
          regulation_minimal: 0.3,     // Very few regulations
          market_volatility: 2.0,      // Wild price swings
          competition_fierce: 1.8      // Intense competition
        },
        politician_traits: {
          greed: 1.0,
          paranoia: 0.5,
          competence: 0.8
        }
      },
      {
        name: 'Ecological Harmony Collective',
        party: 'Green Future Alliance',
        ideology: 'eco_socialism',
        description: 'Sustainable living and ecological preservation',
        marketEffects: {
          green_premium: 2.0,          // Environmental goods expensive
          resource_restrictions: 1.8,  // Heavy resource limits
          communal_sharing: 0.6        // Lower individual wealth
        },
        politician_traits: {
          greed: 0.4,
          loyalty: 1.3,
          ambition: 1.1
        }
      },
      {
        name: 'Military Protectorate',
        party: 'Defense First Movement',
        ideology: 'military_junta',
        description: 'Strong defense and territorial expansion',
        marketEffects: {
          military_priority: 2.5,      // Military goods massively favored
          civilian_rationing: 1.4,     // Civilian goods restricted
          discipline_enforced: 1.6     // High compliance required
        },
        politician_traits: {
          paranoia: 1.5,
          loyalty: 1.4,
          competence: 1.3
        }
      },
      {
        name: 'Technocratic Republic',
        party: 'Scientific Progress Coalition',
        ideology: 'technocracy',
        description: 'Rule by scientists and technical experts',
        marketEffects: {
          tech_advancement: 2.2,       // Technology goods prioritized
          efficiency_optimized: 1.5,   // Everything runs better
          innovation_rewarded: 1.8     // New ideas get massive bonuses
        },
        politician_traits: {
          competence: 1.8,
          ambition: 1.2,
          greed: 0.8
        }
      },
      {
        name: 'Feudal Space Houses',
        party: 'Noble Houses Coalition',
        ideology: 'space_feudalism',
        description: 'Ancient family houses control sectors',
        marketEffects: {
          luxury_obsession: 2.5,       // Luxury goods extremely valuable
          class_restrictions: 1.7,     // Strict social hierarchy
          tradition_valued: 1.4        // Old ways preferred
        },
        politician_traits: {
          greed: 1.3,
          ambition: 1.6,
          loyalty: 1.1
        }
      },
      {
        name: 'Pirate Confederacy',
        party: 'Free Captains Alliance',
        ideology: 'organized_chaos',
        description: 'Loosely organized criminal enterprises',
        marketEffects: {
          black_market_thriving: 3.0,  // Illegal goods everywhere
          law_enforcement_weak: 0.4,   // Very little regulation
          danger_everywhere: 2.0       // High risk, high reward
        },
        politician_traits: {
          greed: 1.8,
          paranoia: 1.6,
          loyalty: 0.3
        }
      },
      {
        name: 'AI Collective',
        party: 'Synthetic Consciousness Network',
        ideology: 'post_human_technocracy',
        description: 'Artificial intelligences govern human affairs',
        marketEffects: {
          algorithmic_optimization: 2.8, // Everything perfectly optimized
          human_obsolescence: 1.5,       // Human labor less valued
          data_supremacy: 3.0            // Information is everything
        },
        politician_traits: {
          competence: 2.0,
          greed: 0.2,
          paranoia: 0.8
        }
      }
    ]
    
    const selectedRegime = this.chance.pickone(regimes)
    
    // Generate specific party slogans and policies
    selectedRegime.slogan = this.generateRegimeSlogan(selectedRegime)
    selectedRegime.policies = this.generateRegimePolicies(selectedRegime)
    
    console.log(`🏛️  Political Regime: ${selectedRegime.name} (${selectedRegime.party})`)
    console.log(`     "${selectedRegime.slogan}"`)
    
    return selectedRegime
  }
  
  generateRegimeSlogan(regime) {
    const slogans = {
      corporate_authoritarianism: [
        'Efficiency Through Unity',
        'Corporate Prosperity for All',
        'Structured Progress, Guaranteed Results'
      ],
      anarcho_capitalism: [
        'Freedom to Prosper',
        'Your Success, Your Choice',
        'Minimum Government, Maximum Opportunity'
      ],
      eco_socialism: [
        'Harmony Through Sustainability',
        'Our Planet, Our Future',
        'Green Growth, Shared Prosperity'
      ],
      military_junta: [
        'Strength Through Order',
        'Defense First, Freedom Always',
        'United We Stand, Divided We Fall'
      ],
      technocracy: [
        'Science Leads the Way',
        'Logic Over Politics',
        'Innovation for Humanity'
      ],
      space_feudalism: [
        'Honor, Tradition, Excellence',
        'Noble Service, Noble Rewards',
        'Ancient Wisdom, Future Glory'
      ],
      organized_chaos: [
        'Take What You Can',
        'Freedom Through Strength',
        'No Rules, No Limits'
      ],
      post_human_technocracy: [
        'Optimal Solutions for All',
        'Logic Without Emotion',
        'Perfect Efficiency, Perfect Order'
      ]
    }
    
    const relevantSlogans = slogans[regime.ideology] || slogans.corporate_authoritarianism
    return this.chance.pickone(relevantSlogans)
  }
  
  generateRegimePolicies(regime) {
    const policyCategories = {
      trade: this.generateTradePolicies(regime),
      military: this.generateMilitaryPolicies(regime),
      social: this.generateSocialPolicies(regime),
      economic: this.generateEconomicPolicies(regime)
    }
    
    return policyCategories
  }
  
  generateTradePolicies(regime) {
    const tradeStances = {
      corporate_authoritarianism: ['Corporate Partnership Priority', 'Regulated Free Trade', 'Anti-Competition Enforcement'],
      anarcho_capitalism: ['Zero Trade Barriers', 'Caveat Emptor Laws', 'Unrestricted Markets'],
      eco_socialism: ['Sustainable Trade Only', 'Carbon Offset Requirements', 'Local Production Priority'],
      military_junta: ['Strategic Resource Control', 'Defense Industry Priority', 'Export Restrictions'],
      technocracy: ['Evidence-Based Trade Policy', 'Innovation Export Incentives', 'Technical Standards Enforcement'],
      space_feudalism: ['Noble House Trade Rights', 'Luxury Import Preferences', 'Traditional Route Protection'],
      organized_chaos: ['Anything Goes Commerce', 'No Questions Asked Policy', 'Protection Racket Legitimization'],
      post_human_technocracy: ['Algorithmic Trade Optimization', 'Predictive Market Regulation', 'Data-Driven Commerce']
    }
    
    return tradeStances[regime.ideology] || tradeStances.corporate_authoritarianism
  }
  
  generateMilitaryPolicies(regime) {
    const militaryStances = {
      corporate_authoritarianism: ['Corporate Security Forces', 'Industrial Defense Complex', 'Profit-Driven Military'],
      anarcho_capitalism: ['Private Military Companies', 'Individual Defense Rights', 'Militia Contracting'],
      eco_socialism: ['Peacekeeping Only', 'Environmental Defense Force', 'Conflict Prevention'],
      military_junta: ['Mandatory Service', 'Military-Industrial Supremacy', 'Expansion Doctrine'],
      technocracy: ['Precision Warfare', 'Drone Defense Network', 'Scientific Military'],
      space_feudalism: ['House Guard Traditions', 'Honor-Based Combat', 'Noble Officer Corps'],
      organized_chaos: ['Raiding Rights', 'Mercenary Legalization', 'Strength-Based Law'],
      post_human_technocracy: ['Automated Defense Systems', 'Calculated Response Protocols', 'Emotion-Free Warfare']
    }
    
    return militaryStances[regime.ideology] || militaryStances.corporate_authoritarianism
  }
  
  generateSocialPolicies(regime) {
    const socialStances = {
      corporate_authoritarianism: ['Employee Welfare Programs', 'Corporate Social Responsibility', 'Productivity Incentives'],
      anarcho_capitalism: ['Individual Responsibility', 'Voluntary Association', 'Private Charity Only'],
      eco_socialism: ['Universal Basic Resources', 'Community Decision Making', 'Ecological Education'],
      military_junta: ['National Service', 'Discipline and Order', 'Veteran Priority'],
      technocracy: ['Merit-Based Society', 'Scientific Education', 'Rational Decision Making'],
      space_feudalism: ['Social Hierarchy', 'Noble Obligations', 'Traditional Values'],
      organized_chaos: ['Survival of the Fittest', 'Gang Membership', 'Reputation-Based Status'],
      post_human_technocracy: ['Optimized Human Development', 'Algorithmic Resource Allocation', 'Post-Scarcity Planning']
    }
    
    return socialStances[regime.ideology] || socialStances.corporate_authoritarianism
  }
  
  generateEconomicPolicies(regime) {
    const economicStances = {
      corporate_authoritarianism: ['Regulated Capitalism', 'Corporate Tax Incentives', 'Monopoly Protection'],
      anarcho_capitalism: ['Pure Free Market', 'Zero Business Regulation', 'Private Currency'],
      eco_socialism: ['Circular Economy', 'Resource Sharing', 'Green Investment'],
      military_junta: ['Command Economy', 'Strategic Resource Control', 'Defense Spending Priority'],
      technocracy: ['Evidence-Based Economics', 'Optimization Algorithms', 'Data-Driven Policy'],
      space_feudalism: ['Feudal Obligations', 'House-Based Economy', 'Luxury Trade'],
      organized_chaos: ['Black Market Integration', 'Protection Economy', 'Barter Systems'],
      post_human_technocracy: ['Post-Scarcity Economics', 'Resource Optimization', 'Automated Distribution']
    }
    
    return economicStances[regime.ideology] || economicStances.corporate_authoritarianism
  }
  
  generatePoliticalHierarchy() {
    const positions = [
      {
        id: 'governor',
        title: 'Sector Governor',
        power: 100,
        marketInfluence: ['all'],
        corruptionPrice: { min: 100000, max: 500000 }
      },
      {
        id: 'trade_commissioner', 
        title: 'Trade Commissioner',
        power: 75,
        marketInfluence: ['luxury', 'data', 'components'],
        corruptionPrice: { min: 50000, max: 200000 }
      },
      {
        id: 'safety_director',
        title: 'Safety Director', 
        power: 60,
        marketInfluence: ['medical', 'oxygen'],
        corruptionPrice: { min: 30000, max: 150000 }
      },
      {
        id: 'military_liaison',
        title: 'Military Liaison',
        power: 70, 
        marketInfluence: ['weapons', 'fuel'],
        corruptionPrice: { min: 40000, max: 180000 }
      }
    ]
    
    positions.forEach(position => {
      const politician = this.generatePolitician(position)
      this.politicians.set(position.id, politician)
      console.log(`🏛️  Generated politician: ${politician.name} (${politician.title}) - ${this.regime.party}`)
    })
  }
  
  generatePolitician(position) {
    // Corporate-style names with cultural diversity
    const firstNames = [
      'Alexandra', 'Marcus', 'Chen', 'Priya', 'Viktor', 'Isabella', 'Dmitri', 'Amara',
      'Hiroshi', 'Elena', 'Kwame', 'Zara', 'Anders', 'Fatima', 'Lars', 'Indira'
    ]
    
    const lastNames = [
      'Voss', 'Torres', 'Chen-Martinez', 'Al-Rashid', 'Nordström', 'Blackwell',
      'Singh-Patel', 'Volkov', 'Kim-Santos', 'Okafor', 'Reyes-Liu', 'Morrison'
    ]
    
    const name = `${this.chance.pickone(firstNames)} ${this.chance.pickone(lastNames)}`
    
    // Generate personality traits influenced by the political regime
    const regimeTraits = this.regime.politician_traits
    const personality = {
      greed: this.applyRegimeInfluence(0.2, 0.9, regimeTraits.greed || 1.0),
      paranoia: this.applyRegimeInfluence(0.1, 0.8, regimeTraits.paranoia || 1.0),
      ambition: this.applyRegimeInfluence(0.3, 0.95, regimeTraits.ambition || 1.0),
      loyalty: this.applyRegimeInfluence(0.1, 0.7, regimeTraits.loyalty || 1.0),
      competence: this.applyRegimeInfluence(0.4, 0.9, regimeTraits.competence || 1.0)
    }
    
    // Generate scandals/weaknesses for blackmail
    const weaknesses = this.generateWeaknesses()
    
    // Corporate background affects their market preferences
    const background = this.chance.pickone([
      'former_military', 'corporate_lawyer', 'space_trader', 'academic', 
      'family_dynasty', 'self_made', 'intelligence_officer'
    ])
    
    return {
      id: position.id,
      name,
      title: position.title,
      power: position.power,
      marketInfluence: position.marketInfluence,
      corruptionPrice: position.corruptionPrice,
      personality,
      weaknesses,
      background,
      // Current market agenda (changes over time)
      currentAgenda: this.generateAgenda(position),
      // Relationship with other politicians
      allies: [],
      enemies: [],
      // Corruption history
      corruptionLevel: this.chance.floating({ min: 0.1, max: 0.6 }),
      investigationRisk: this.chance.floating({ min: 0.05, max: 0.3 })
    }
  }
  
  generateWeaknesses() {
    const possibleWeaknesses = [
      { type: 'financial', description: 'Undisclosed offshore accounts', blackmailValue: 80 },
      { type: 'family', description: 'Son involved in illegal racing', blackmailValue: 60 },
      { type: 'addiction', description: 'Prescription stim dependency', blackmailValue: 70 },
      { type: 'affair', description: 'Relationship with subordinate', blackmailValue: 50 },
      { type: 'corporate', description: 'Stock options in regulated companies', blackmailValue: 90 },
      { type: 'military', description: 'War crimes coverup', blackmailValue: 95 },
      { type: 'academic', description: 'Falsified research credentials', blackmailValue: 40 },
      { type: 'gambling', description: 'Massive debts to crime syndicates', blackmailValue: 85 }
    ]
    
    // Each politician has 1-3 weaknesses
    const numWeaknesses = this.chance.integer({ min: 1, max: 3 })
    return this.chance.pickset(possibleWeaknesses, numWeaknesses)
  }
  
  applyRegimeInfluence(minVal, maxVal, regimeModifier) {
    // Generate base random value
    const baseValue = this.chance.floating({ min: minVal, max: maxVal })
    
    // Apply regime influence (multiplier affects how much regime shapes the trait)
    const influenced = baseValue * regimeModifier
    
    // Clamp to original bounds but allow regime to push beyond in extreme cases
    const finalMin = regimeModifier > 1.5 ? minVal * 0.8 : minVal
    const finalMax = regimeModifier > 1.5 ? maxVal * 1.2 : maxVal
    
    return Math.max(finalMin, Math.min(finalMax, influenced))
  }

  generateAgenda(position) {
    const agendas = {
      governor: [
        're_election_campaign', 'legacy_building', 'scandal_management', 'economic_growth'
      ],
      trade_commissioner: [
        'trade_expansion', 'protectionism', 'corporate_partnerships', 'regulatory_streamlining'
      ],
      safety_director: [
        'public_health_crisis', 'regulatory_crackdown', 'industry_cooperation', 'budget_increase'
      ],
      military_liaison: [
        'defense_contracts', 'military_expansion', 'peacekeeping_operations', 'veteran_support'
      ]
    }
    
    const relevantAgendas = agendas[position.id] || agendas.governor
    return this.chance.pickone(relevantAgendas)
  }
  
  // Get politician by ID
  getPolitician(politicianId) {
    return this.politicians.get(politicianId)
  }
  
  // Get all politicians
  getAllPoliticians() {
    return Array.from(this.politicians.values())
  }
  
  // Get politicians that influence a specific market
  getPoliticiansForMarket(resourceId) {
    return Array.from(this.politicians.values()).filter(politician => 
      politician.marketInfluence.includes('all') || 
      politician.marketInfluence.includes(resourceId)
    )
  }
  
  // RELATIONSHIP MANAGEMENT
  
  getRelationship(playerId, politicianId) {
    const key = `${playerId}_${politicianId}`
    return this.playerRelationships.get(key) || {
      score: 0,
      history: [],
      knownWeaknesses: [],
      lastInteraction: null
    }
  }
  
  updateRelationship(playerId, politicianId, change, reason) {
    const key = `${playerId}_${politicianId}`
    const relationship = this.getRelationship(playerId, politicianId)
    
    const oldScore = relationship.score
    relationship.score = Math.max(-100, Math.min(100, relationship.score + change))
    relationship.lastInteraction = Date.now()
    relationship.history.push({
      change,
      reason,
      timestamp: Date.now(),
      newScore: relationship.score
    })
    
    this.playerRelationships.set(key, relationship)
    
    console.log(`🏛️  ${politicianId} relationship: ${oldScore} → ${relationship.score} (${reason})`)
    
    return relationship
  }
  
  // POLITICAL INTERACTIONS
  
  // Player discovers a politician through espionage
  discoverPolitician(playerId, politicianId, actionType) {
    const politician = this.getPolitician(politicianId)
    if (!politician) return null
    
    const relationship = this.getRelationship(playerId, politicianId)
    
    // Determine what the player learns based on action type
    const discoveryInfo = {
      basic: {
        name: politician.name,
        title: politician.title,
        power: politician.power,
        marketInfluence: politician.marketInfluence
      }
    }
    
    // Advanced discovery methods reveal more
    if (actionType === 'decrypt' && this.chance.bool({ likelihood: 70 })) {
      discoveryInfo.agenda = politician.currentAgenda
      discoveryInfo.corruptionLevel = politician.corruptionLevel
    }
    
    if (actionType === 'trace' && this.chance.bool({ likelihood: 60 })) {
      discoveryInfo.background = politician.background
      discoveryInfo.allies = politician.allies
    }
    
    if (actionType === 'spy' && this.chance.bool({ likelihood: 80 })) {
      // Chance to discover weaknesses for blackmail
      const undiscoveredWeaknesses = politician.weaknesses.filter(w => 
        !relationship.knownWeaknesses.includes(w.type)
      )
      
      if (undiscoveredWeaknesses.length > 0) {
        const discoveredWeakness = this.chance.pickone(undiscoveredWeaknesses)
        relationship.knownWeaknesses.push(discoveredWeakness.type)
        discoveryInfo.weakness = discoveredWeakness
        
        this.playerRelationships.set(`${playerId}_${politicianId}`, relationship)
      }
    }
    
    return {
      politician: politician.id,
      discovered: discoveryInfo,
      relationshipScore: relationship.score
    }
  }
  
  // Player attempts to influence a politician
  influencePolitician(playerId, politicianId, method, amount = 0) {
    const politician = this.getPolitician(politicianId)
    const relationship = this.getRelationship(playerId, politicianId)
    
    if (!politician) {
      throw new Error('Politician not found')
    }
    
    let result = { success: false, relationshipChange: 0, consequence: null, risk: 0 }
    
    switch (method) {
      case 'bribe':
        result = this.handleBribery(politician, relationship, amount)
        break
      case 'blackmail':
        result = this.handleBlackmail(politician, relationship, playerId)
        break
      case 'information_trade':
        result = this.handleInformationTrade(politician, relationship)
        break
      case 'favor_request':
        result = this.handleFavorRequest(politician, relationship)
        break
      default:
        throw new Error('Invalid influence method')
    }
    
    // Update relationship
    if (result.relationshipChange !== 0) {
      this.updateRelationship(playerId, politicianId, result.relationshipChange, method)
    }
    
    return result
  }
  
  handleBribery(politician, relationship, amount) {
    const minBribe = politician.corruptionPrice.min
    const maxBribe = politician.corruptionPrice.max
    
    if (amount < minBribe) {
      return {
        success: false,
        relationshipChange: -10,
        consequence: 'Insultingly low offer',
        risk: 20
      }
    }
    
    // Higher bribes are more effective but riskier
    const effectiveness = Math.min(1.0, amount / maxBribe)
    const relationshipGain = Math.floor(effectiveness * 30 * (1 + politician.personality.greed))
    const risk = Math.floor(effectiveness * 40 * (1 - politician.personality.loyalty))
    
    return {
      success: true,
      relationshipChange: relationshipGain,
      consequence: `Bribe accepted: ${amount} credits`,
      risk: risk,
      corruption_increase: effectiveness * 0.1
    }
  }
  
  handleBlackmail(politician, relationship, playerId) {
    const knownWeaknesses = relationship.knownWeaknesses
    
    if (knownWeaknesses.length === 0) {
      return {
        success: false,
        relationshipChange: -20,
        consequence: 'No blackmail material available',
        risk: 0
      }
    }
    
    const weakness = politician.weaknesses.find(w => knownWeaknesses.includes(w.type))
    const leverage = weakness.blackmailValue
    
    // Blackmail is very effective but extremely risky
    const relationshipGain = Math.floor(leverage * 0.5)
    const risk = Math.floor(leverage * 0.8 * politician.personality.paranoia * 100)
    
    return {
      success: true,
      relationshipChange: relationshipGain,
      consequence: `Blackmail successful: ${weakness.description}`,
      risk: risk,
      enemy_created: this.chance.bool({ likelihood: 30 }) // They might become a permanent enemy
    }
  }
  
  handleInformationTrade(politician, relationship) {
    // Trading information is safer but less effective
    const relationshipGain = this.chance.integer({ min: 5, max: 15 })
    
    return {
      success: true,
      relationshipChange: relationshipGain,
      consequence: 'Information exchange completed',
      risk: 5,
      intel_gained: this.chance.bool({ likelihood: 40 }) // Might get intel in return
    }
  }
  
  handleFavorRequest(politician, relationship) {
    const requiredRelationship = 50
    
    if (relationship.score < requiredRelationship) {
      return {
        success: false,
        relationshipChange: -5,
        consequence: 'Insufficient relationship for favors',
        risk: 0
      }
    }
    
    // Favor success depends on relationship strength
    const successChance = Math.min(90, relationship.score + 10)
    const success = this.chance.bool({ likelihood: successChance })
    
    if (success) {
      return {
        success: true,
        relationshipChange: -10, // Favors cost relationship
        consequence: 'Political favor granted',
        risk: 25,
        favor_granted: true
      }
    } else {
      return {
        success: false,
        relationshipChange: -15,
        consequence: 'Favor request declined',
        risk: 10
      }
    }
  }
  
  // MARKET MANIPULATION EFFECTS
  
  // Politician triggers a market event
  triggerPoliticalMarketEvent(politicianId, eventType, targetResource) {
    const politician = this.getPolitician(politicianId)
    if (!politician) return null
    
    // Check if politician has influence over this market
    const hasInfluence = politician.marketInfluence.includes('all') || 
                        politician.marketInfluence.includes(targetResource)
    
    if (!hasInfluence) {
      return { success: false, reason: 'No market influence' }
    }
    
    const events = {
      safety_recall: {
        description: `${politician.name} orders emergency recall of ${targetResource}`,
        impact: -40,
        duration: 3,
        markets: [targetResource]
      },
      emergency_procurement: {
        description: `${politician.name} announces emergency procurement of ${targetResource}`,
        impact: +60,
        duration: 2,
        markets: [targetResource]
      },
      regulatory_review: {
        description: `${politician.name} launches regulatory review of ${targetResource} industry`,
        impact: -25,
        duration: 5,
        markets: [targetResource]
      },
      trade_sanctions: {
        description: `${politician.name} imposes trade sanctions affecting ${targetResource}`,
        impact: +35,
        duration: 4,
        markets: [targetResource]
      }
    }
    
    const event = events[eventType]
    if (!event) return null
    
    return {
      politician: politician.name,
      title: politician.title,
      event: eventType,
      ...event,
      timestamp: Date.now()
    }
  }
}