import Chance from 'chance'

export class DollhouseMarket {
  constructor(seed = 'spacepunk-markets') {
    this.chance = new Chance(seed)
    
    // DOLLHOUSE: Only 8 key resources that matter
    this.coreResources = [
      { id: 'oxygen', name: 'Oxygen', category: 'life_support', basePrice: 50 },
      { id: 'fuel', name: 'Fusion Fuel', category: 'energy', basePrice: 200 },
      { id: 'data', name: 'Corporate Data', category: 'information', basePrice: 1000 },
      { id: 'weapons', name: 'Defense Systems', category: 'military', basePrice: 5000 },
      { id: 'medical', name: 'Medical Supplies', category: 'life_support', basePrice: 300 },
      { id: 'luxury', name: 'Luxury Goods', category: 'social', basePrice: 800 },
      { id: 'components', name: 'Ship Components', category: 'industrial', basePrice: 1500 },
      { id: 'intel', name: 'Intelligence', category: 'information', basePrice: 2500 }
    ]
    
    // DOLLHOUSE: Simple but complete order books
    this.orderBooks = new Map()
    this.priceHistory = new Map()
    this.insiderIntel = new Map()
    this.marketManipulation = new Map()
    
    this.initializeMarkets()
  }
  
  initializeMarkets() {
    for (const resource of this.coreResources) {
      // Initialize order book with realistic but small scale
      const orderBook = {
        bids: this.generateOrderSide('buy', resource.basePrice, 100), // 100 total units
        asks: this.generateOrderSide('sell', resource.basePrice, 100),
        lastPrice: resource.basePrice,
        volume24h: this.chance.integer({ min: 50, max: 500 }),
        marketCap: resource.basePrice * 1000 // Small but visible market caps
      }
      
      this.orderBooks.set(resource.id, orderBook)
      this.priceHistory.set(resource.id, [resource.basePrice])
    }
  }
  
  generateOrderSide(side, basePrice, totalVolume) {
    const orders = []
    const priceSpread = side === 'buy' ? 0.95 : 1.05 // 5% spread
    let remainingVolume = totalVolume
    
    // Generate 5-10 orders per side (DOLLHOUSE scale)
    const numOrders = this.chance.integer({ min: 5, max: 10 })
    
    for (let i = 0; i < numOrders && remainingVolume > 0; i++) {
      const maxVolume = Math.max(5, Math.floor(remainingVolume / 2))
      const volume = Math.min(
        this.chance.integer({ min: 5, max: maxVolume }),
        remainingVolume
      )
      
      const priceVariation = this.chance.floating({ min: 0.9, max: 1.1 })
      const price = Math.round(basePrice * priceSpread * priceVariation)
      
      orders.push({
        id: this.chance.hash({ length: 8 }),
        price,
        volume,
        side,
        timestamp: Date.now() - this.chance.integer({ min: 0, max: 3600000 }) // Last hour
      })
      
      remainingVolume -= volume
    }
    
    // Sort orders correctly (bids high→low, asks low→high)
    return side === 'buy' 
      ? orders.sort((a, b) => b.price - a.price)
      : orders.sort((a, b) => a.price - b.price)
  }
  
  // DOLLHOUSE INSIDER TRADING: Simple but effective
  addInsiderIntel(resourceId, intel) {
    this.insiderIntel.set(resourceId, {
      ...intel,
      timestamp: Date.now(),
      discovered: false // Player hasn't found this yet
    })
    
    console.log(`🕵️  Insider intel added: ${resourceId} - ${intel.type}`)
  }
  
  // Player discovers insider info through espionage
  discoverIntel(resourceId, playerChoices) {
    const intel = this.insiderIntel.get(resourceId)
    if (!intel || intel.discovered) return null
    
    // Different espionage methods reveal different intel
    const revealChance = this.calculateIntelRevealChance(intel, playerChoices)
    
    if (this.chance.bool({ likelihood: revealChance })) {
      intel.discovered = true
      console.log(`📊 Intel discovered: ${intel.description}`)
      return intel
    }
    
    return null
  }
  
  calculateIntelRevealChance(intel, playerChoices) {
    let baseChance = 30
    
    // Recent espionage actions improve chances
    if (playerChoices.includes('decrypt')) baseChance += 40
    if (playerChoices.includes('trace')) baseChance += 25
    if (playerChoices.includes('spy')) baseChance += 35
    
    // Intel difficulty affects discovery
    const difficulty = intel.difficulty || 'medium'
    const difficultyMod = { easy: 20, medium: 0, hard: -25, extreme: -50 }
    
    return Math.min(90, baseChance + (difficultyMod[difficulty] || 0))
  }
  
  // DOLLHOUSE MARKET MANIPULATION: Immediate visible effects
  executeMarketOrder(resourceId, side, volume, playerId) {
    const orderBook = this.orderBooks.get(resourceId)
    if (!orderBook) throw new Error(`Market for ${resourceId} not found`)
    
    const opposingSide = side === 'buy' ? 'asks' : 'bids'
    const orders = orderBook[opposingSide]
    
    let remainingVolume = volume
    let totalCost = 0
    let averagePrice = 0
    const filledOrders = []
    
    // Fill orders from the book
    while (remainingVolume > 0 && orders.length > 0) {
      const topOrder = orders[0]
      const fillVolume = Math.min(remainingVolume, topOrder.volume)
      
      totalCost += fillVolume * topOrder.price
      filledOrders.push({
        price: topOrder.price,
        volume: fillVolume
      })
      
      // Update or remove the order
      topOrder.volume -= fillVolume
      if (topOrder.volume <= 0) {
        orders.shift()
      }
      
      remainingVolume -= fillVolume
    }
    
    if (filledOrders.length > 0) {
      averagePrice = totalCost / (volume - remainingVolume)
      orderBook.lastPrice = filledOrders[filledOrders.length - 1].price
      
      // DOLLHOUSE EFFECT: Big orders move prices dramatically
      this.applyMarketImpact(resourceId, side, volume, averagePrice)
      
      console.log(`📈 Market order: ${side} ${volume - remainingVolume} ${resourceId} @ avg ${averagePrice}`)
    }
    
    return {
      filled: volume - remainingVolume,
      averagePrice,
      totalCost,
      newPrice: orderBook.lastPrice,
      marketImpact: this.calculateMarketImpact(volume, orderBook.volume24h)
    }
  }
  
  applyMarketImpact(resourceId, side, volume, price) {
    const orderBook = this.orderBooks.get(resourceId)
    const impactPercent = this.calculateMarketImpact(volume, orderBook.volume24h)
    
    // DOLLHOUSE: Small volumes have big effects
    const priceMultiplier = side === 'buy' ? (1 + impactPercent/100) : (1 - impactPercent/100)
    
    // Update all orders in the book
    const updateSide = (orders, multiplier) => {
      orders.forEach(order => {
        order.price = Math.round(order.price * multiplier)
      })
    }
    
    updateSide(orderBook.bids, priceMultiplier)
    updateSide(orderBook.asks, priceMultiplier)
    
    // Update price history
    const history = this.priceHistory.get(resourceId)
    history.push(orderBook.lastPrice)
    if (history.length > 100) history.shift() // Keep last 100 prices
    
    // Trigger cascading effects on related resources
    this.triggerCascadingEffects(resourceId, impactPercent, side)
  }
  
  calculateMarketImpact(volume, dailyVolume) {
    // DOLLHOUSE: Exaggerated but visible impact
    const volumeRatio = volume / Math.max(dailyVolume / 24, 1) // Hourly volume
    return Math.min(50, volumeRatio * 10) // Max 50% price movement
  }
  
  triggerCascadingEffects(affectedResourceId, impactPercent, side) {
    // DOLLHOUSE: Simple but visible market relationships
    const relationships = {
      'oxygen': ['medical', 'luxury'], // Life support affects medical and luxury demand
      'fuel': ['components', 'weapons'], // Energy affects industrial production
      'data': ['intel', 'luxury'], // Information affects intelligence and luxury markets
      'weapons': ['components'], // Military affects industrial demand
      'intel': ['data'] // Intelligence affects data prices
    }
    
    const relatedResources = relationships[affectedResourceId] || []
    const secondaryImpact = impactPercent * 0.3 // 30% spillover effect
    
    relatedResources.forEach(resourceId => {
      const orderBook = this.orderBooks.get(resourceId)
      if (orderBook && secondaryImpact > 2) { // Only significant spillovers
        const multiplier = side === 'buy' ? (1 + secondaryImpact/100) : (1 - secondaryImpact/100)
        
        orderBook.bids.forEach(order => order.price = Math.round(order.price * multiplier))
        orderBook.asks.forEach(order => order.price = Math.round(order.price * multiplier))
        
        console.log(`📊 Cascade effect: ${resourceId} prices ${side === 'buy' ? 'up' : 'down'} ${secondaryImpact.toFixed(1)}%`)
      }
    })
  }
  
  // DOLLHOUSE INSIDER TRADING: Apply discovered intel to markets
  applyInsiderTrading(resourceId, intelType, severity = 'medium') {
    const orderBook = this.orderBooks.get(resourceId)
    if (!orderBook) return
    
    const effects = {
      'corporate_merger': { direction: 'up', impact: 25 },
      'supply_shortage': { direction: 'up', impact: 35 },
      'technology_breakthrough': { direction: 'down', impact: 20 }, // Makes old tech cheaper
      'regulatory_change': { direction: 'down', impact: 30 },
      'scandal': { direction: 'down', impact: 40 },
      'military_contract': { direction: 'up', impact: 50 }
    }
    
    const effect = effects[intelType] || { direction: 'up', impact: 15 }
    const impactMultiplier = { low: 0.5, medium: 1.0, high: 1.5, extreme: 2.0 }[severity] || 1.0
    const finalImpact = effect.impact * impactMultiplier
    
    const priceMultiplier = effect.direction === 'up' 
      ? (1 + finalImpact/100) 
      : (1 - finalImpact/100)
    
    // Apply the insider information effect
    orderBook.bids.forEach(order => order.price = Math.round(order.price * priceMultiplier))
    orderBook.asks.forEach(order => order.price = Math.round(order.price * priceMultiplier))
    orderBook.lastPrice = Math.round(orderBook.lastPrice * priceMultiplier)
    
    console.log(`🕵️  Insider trading effect: ${resourceId} ${effect.direction} ${finalImpact.toFixed(1)}% (${intelType})`)
    
    return {
      resourceId,
      intelType,
      direction: effect.direction,
      impact: finalImpact,
      newPrice: orderBook.lastPrice
    }
  }
  
  // Get current market snapshot for display
  getMarketSnapshot() {
    const snapshot = {}
    
    for (const [resourceId, orderBook] of this.orderBooks) {
      const resource = this.coreResources.find(r => r.id === resourceId)
      const priceHistory = this.priceHistory.get(resourceId)
      const change24h = this.calculate24hChange(priceHistory)
      
      snapshot[resourceId] = {
        name: resource.name,
        category: resource.category,
        currentPrice: orderBook.lastPrice,
        change24h,
        volume24h: orderBook.volume24h,
        marketCap: orderBook.lastPrice * 1000,
        bestBid: orderBook.bids[0]?.price || 0,
        bestAsk: orderBook.asks[0]?.price || 0,
        spread: this.calculateSpread(orderBook),
        // DOLLHOUSE: Show top 3 orders for visibility
        topBids: orderBook.bids.slice(0, 3),
        topAsks: orderBook.asks.slice(0, 3)
      }
    }
    
    return snapshot
  }
  
  calculateSpread(orderBook) {
    const bestBid = orderBook.bids[0]?.price || 0
    const bestAsk = orderBook.asks[0]?.price || Infinity
    if (bestBid && bestAsk < Infinity) {
      return ((bestAsk - bestBid) / bestBid * 100).toFixed(2)
    }
    return 'N/A'
  }
  
  calculate24hChange(priceHistory) {
    if (priceHistory.length < 2) return 0
    const current = priceHistory[priceHistory.length - 1]
    const past = priceHistory[Math.max(0, priceHistory.length - 24)] // Assuming hourly updates
    return ((current - past) / past * 100).toFixed(2)
  }
  
  // Generate insider intel periodically
  generateRandomIntel() {
    const resourceId = this.chance.pickone(this.coreResources).id
    const intelTypes = [
      { type: 'corporate_merger', description: 'SpaceCorp merger negotiations leaked', difficulty: 'medium' },
      { type: 'supply_shortage', description: 'Critical supply chain disruption imminent', difficulty: 'easy' },
      { type: 'technology_breakthrough', description: 'Revolutionary new tech in development', difficulty: 'hard' },
      { type: 'regulatory_change', description: 'New corporate regulations being drafted', difficulty: 'medium' },
      { type: 'scandal', description: 'Executive misconduct under investigation', difficulty: 'easy' },
      { type: 'military_contract', description: 'Classified defense contract details', difficulty: 'extreme' }
    ]
    
    const intel = this.chance.pickone(intelTypes)
    this.addInsiderIntel(resourceId, intel)
    
    return { resourceId, ...intel }
  }
}