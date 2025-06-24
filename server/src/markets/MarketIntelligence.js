import Chance from 'chance'

export class MarketIntelligence {
  constructor(seed = 'market-intel') {
    this.chance = new Chance(seed)
    
    // DOLLHOUSE: Simple but effective prediction system
    this.pendingEvents = new Map() // Events that will trigger in future ticks
    this.marketSentiment = new Map() // Current market mood per resource
    this.playerIntel = new Map() // What intel players have discovered
    
    this.initializeMarketSentiment()
  }
  
  initializeMarketSentiment() {
    const resources = ['oxygen', 'fuel', 'data', 'weapons', 'medical', 'luxury', 'components', 'intel']
    
    resources.forEach(resourceId => {
      this.marketSentiment.set(resourceId, {
        trend: this.chance.pickone(['bullish', 'bearish', 'neutral']),
        confidence: this.chance.floating({ min: 0.3, max: 0.9 }),
        volatility: this.chance.floating({ min: 0.1, max: 0.5 }),
        volume_trend: this.chance.pickone(['increasing', 'decreasing', 'stable'])
      })
    })
  }
  
  // CORE FUNCTION: Analyze player actions and generate market intel
  analyzePlayerActions(playerChoices, gameState) {
    const intelDiscovered = []
    
    // Different actions reveal different types of market intel
    for (const choice of playerChoices) {
      const intel = this.generateIntelFromAction(choice, gameState)
      if (intel) {
        intelDiscovered.push(intel)
        this.playerIntel.set(intel.id, intel)
      }
    }
    
    return intelDiscovered
  }
  
  generateIntelFromAction(choice, gameState) {
    const actionIntelMap = {
      'decrypt': () => this.generateCorporateIntel(gameState),
      'trace': () => this.generateSupplyChainIntel(gameState),
      'spy': () => this.generateMarketManipulationIntel(gameState),
      'aggressive': () => this.generateCompetitorIntel(gameState),
      'investigate': () => this.generateRegulatoryIntel(gameState),
      'report': () => this.generateOfficialIntel(gameState) // Reporting to corps gives you "official" intel
    }
    
    const generator = actionIntelMap[choice.choice || choice]
    if (!generator) return null
    
    // 60% chance to discover intel from each action
    if (this.chance.bool({ likelihood: 60 })) {
      return generator()
    }
    
    return null
  }
  
  generateCorporateIntel(gameState) {
    const resource = this.chance.pickone(['data', 'intel', 'luxury', 'components'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 2, max: 5 })
    
    const events = [
      { type: 'merger', direction: 'up', impact: 35, description: 'SpaceCorp merger with subsidiary detected' },
      { type: 'restructuring', direction: 'down', impact: 25, description: 'Corporate downsizing planned' },
      { type: 'earnings_surprise', direction: 'up', impact: 20, description: 'Quarterly results exceed projections' },
      { type: 'scandal_cover', direction: 'down', impact: 40, description: 'Executive corruption evidence found' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `corp_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'corporate_decrypt',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.7, max: 0.95 }),
      discovered_at: Date.now()
    }
  }
  
  generateSupplyChainIntel(gameState) {
    const resource = this.chance.pickone(['oxygen', 'fuel', 'medical', 'components'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 1, max: 4 })
    
    const events = [
      { type: 'shortage', direction: 'up', impact: 50, description: 'Critical supply bottleneck identified' },
      { type: 'oversupply', direction: 'down', impact: 30, description: 'Warehouse overflow imminent' },
      { type: 'route_disruption', direction: 'up', impact: 25, description: 'Trade route security compromised' },
      { type: 'new_supplier', direction: 'down', impact: 20, description: 'Alternative supplier entering market' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `supply_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'supply_trace',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.6, max: 0.85 }),
      discovered_at: Date.now()
    }
  }
  
  generateMarketManipulationIntel(gameState) {
    const resource = this.chance.pickone(['weapons', 'data', 'intel', 'luxury'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 1, max: 3 })
    
    const events = [
      { type: 'pump_scheme', direction: 'up', impact: 60, description: 'Coordinated buying pressure detected' },
      { type: 'dump_incoming', direction: 'down', impact: 45, description: 'Large sell orders queued' },
      { type: 'corner_attempt', direction: 'up', impact: 35, description: 'Market cornering in progress' },
      { type: 'flash_crash', direction: 'down', impact: 55, description: 'Algorithmic sell trigger identified' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `manip_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'market_espionage',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.8, max: 0.95 }),
      discovered_at: Date.now()
    }
  }
  
  generateCompetitorIntel(gameState) {
    const resource = this.chance.pickone(['weapons', 'components', 'medical', 'fuel'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 2, max: 6 })
    
    const events = [
      { type: 'tech_breakthrough', direction: 'down', impact: 40, description: 'Competitor breakthrough makes tech obsolete' },
      { type: 'factory_sabotage', direction: 'up', impact: 30, description: 'Competitor production facility compromised' },
      { type: 'patent_dispute', direction: 'down', impact: 25, description: 'Legal challenges to production rights' },
      { type: 'exclusive_contract', direction: 'up', impact: 35, description: 'Competitor locked out of major deal' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `comp_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'competitor_intel',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.5, max: 0.8 }),
      discovered_at: Date.now()
    }
  }
  
  generateRegulatoryIntel(gameState) {
    const resource = this.chance.pickone(['weapons', 'medical', 'data', 'oxygen'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 3, max: 8 })
    
    const events = [
      { type: 'new_regulations', direction: 'down', impact: 35, description: 'Restrictive legislation in committee' },
      { type: 'deregulation', direction: 'up', impact: 25, description: 'Market liberalization proposed' },
      { type: 'safety_recall', direction: 'down', impact: 50, description: 'Product safety investigation launched' },
      { type: 'subsidy_program', direction: 'up', impact: 30, description: 'Government support package planned' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `reg_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'regulatory_investigation',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.6, max: 0.9 }),
      discovered_at: Date.now()
    }
  }
  
  generateOfficialIntel(gameState) {
    // Reporting to corps gives you "sanitized" but reliable intel
    const resource = this.chance.pickone(['luxury', 'components', 'medical', 'data'])
    const triggerTick = gameState.currentTick + this.chance.integer({ min: 4, max: 10 })
    
    const events = [
      { type: 'earnings_forecast', direction: 'up', impact: 15, description: 'Official earnings guidance raised' },
      { type: 'market_expansion', direction: 'up', impact: 20, description: 'New market opportunities identified' },
      { type: 'cost_optimization', direction: 'up', impact: 10, description: 'Efficiency improvements implemented' },
      { type: 'strategic_pivot', direction: 'down', impact: 15, description: 'Business model changes announced' }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `official_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      source: 'corporate_cooperation',
      resourceId: resource,
      triggerTick,
      ...event,
      confidence: this.chance.floating({ min: 0.9, max: 0.99 }), // Official intel is highly reliable
      discovered_at: Date.now()
    }
  }
  
  // CORE FUNCTION: Process pending market events each tick
  processTick(currentTick, dollhouseMarket) {
    const triggeredEvents = []
    
    // Check all pending events for this tick
    for (const [intelId, intel] of this.playerIntel) {
      if (intel.triggerTick === currentTick && !intel.triggered) {
        // Apply the market effect
        const effect = dollhouseMarket.applyInsiderTrading(
          intel.resourceId, 
          intel.type, 
          this.calculateSeverity(intel.impact, intel.confidence)
        )
        
        intel.triggered = true
        intel.actual_impact = effect.impact
        
        triggeredEvents.push({
          ...intel,
          market_effect: effect
        })
        
        console.log(`📊 Intel triggered: ${intel.description} → ${intel.resourceId} ${effect.direction} ${effect.impact.toFixed(1)}%`)
      }
    }
    
    // Generate random market events occasionally
    if (this.chance.bool({ likelihood: 15 })) {
      const randomEvent = this.generateRandomMarketEvent(currentTick)
      const effect = dollhouseMarket.applyInsiderTrading(
        randomEvent.resourceId,
        randomEvent.type,
        'medium'
      )
      
      triggeredEvents.push({
        ...randomEvent,
        market_effect: effect,
        source: 'market_volatility'
      })
    }
    
    return triggeredEvents
  }
  
  calculateSeverity(impact, confidence) {
    // Higher confidence intel has more accurate/severe market impact
    if (confidence > 0.9) return 'extreme'
    if (confidence > 0.8) return 'high' 
    if (confidence > 0.6) return 'medium'
    return 'low'
  }
  
  generateRandomMarketEvent(currentTick) {
    const resource = this.chance.pickone(['oxygen', 'fuel', 'data', 'weapons', 'medical', 'luxury', 'components', 'intel'])
    
    const events = [
      { type: 'supply_shortage', direction: 'up', impact: 25 },
      { type: 'technology_breakthrough', direction: 'down', impact: 20 },
      { type: 'scandal', direction: 'down', impact: 30 },
      { type: 'military_contract', direction: 'up', impact: 35 }
    ]
    
    const event = this.chance.pickone(events)
    
    return {
      id: `random_${Date.now()}_${this.chance.hash({ length: 6 })}`,
      resourceId: resource,
      triggerTick: currentTick,
      ...event,
      description: `Random market volatility: ${event.type}`,
      confidence: 1.0 // Random events always happen
    }
  }
  
  // Get all player-discovered intel for display
  getPlayerIntel(playerId) {
    const intel = Array.from(this.playerIntel.values())
    
    return intel.map(item => ({
      id: item.id,
      source: item.source,
      resourceId: item.resourceId,
      description: item.description,
      direction: item.direction,
      impact: item.impact,
      confidence: item.confidence,
      triggerTick: item.triggerTick,
      triggered: item.triggered || false,
      discovered_at: item.discovered_at,
      // DOLLHOUSE: Show predicted profit/loss
      potential_profit: this.calculatePotentialProfit(item)
    }))
  }
  
  calculatePotentialProfit(intel) {
    if (intel.triggered) return 0
    
    // Simple profit calculation based on expected price movement
    const baseInvestment = 1000 // Assume 1000 credit position
    const expectedReturn = (intel.impact / 100) * intel.confidence * baseInvestment
    
    return Math.round(expectedReturn)
  }
  
  // DOLLHOUSE: Get market predictions for the next few ticks
  getMarketPredictions(currentTick, lookahead = 5) {
    const predictions = {}
    
    // Check intel that will trigger in the next few ticks
    for (const intel of this.playerIntel.values()) {
      if (intel.triggerTick > currentTick && intel.triggerTick <= currentTick + lookahead && !intel.triggered) {
        if (!predictions[intel.resourceId]) {
          predictions[intel.resourceId] = []
        }
        
        predictions[intel.resourceId].push({
          tick: intel.triggerTick,
          ticks_until: intel.triggerTick - currentTick,
          direction: intel.direction,
          impact: intel.impact,
          confidence: intel.confidence,
          source: intel.source,
          description: intel.description
        })
      }
    }
    
    // Sort predictions by tick
    Object.keys(predictions).forEach(resourceId => {
      predictions[resourceId].sort((a, b) => a.tick - b.tick)
    })
    
    return predictions
  }
}