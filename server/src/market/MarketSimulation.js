import { EventEmitter } from 'events';

class MarketSimulation extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      priceFluctuationRange: config.priceFluctuationRange || 0.1,
      supplyDemandWeight: config.supplyDemandWeight || 0.3,
      trendWeight: config.trendWeight || 0.2,
      randomWeight: config.randomWeight || 0.1,
      minSupply: config.minSupply || 10,
      maxSupply: config.maxSupply || 1000,
      minDemand: config.minDemand || 10,
      maxDemand: config.maxDemand || 1000,
      trendDecay: config.trendDecay || 0.9,
      eventImpactMultiplier: config.eventImpactMultiplier || 2.0,
      ...config
    };
    
    this.marketEvents = [];
  }

  calculatePrice(basePrice, currentPrice, supply, demand, priceTrend = 0) {
    const supplyDemandRatio = demand / supply;
    
    const supplyDemandFactor = Math.log10(supplyDemandRatio * 10) / 2;
    
    const trendFactor = priceTrend / 100;
    
    const randomFactor = (Math.random() - 0.5) * 2 * this.config.priceFluctuationRange;
    
    const totalFactor = 
      (supplyDemandFactor * this.config.supplyDemandWeight) +
      (trendFactor * this.config.trendWeight) +
      (randomFactor * this.config.randomWeight);
    
    const priceMultiplier = 1 + totalFactor;
    
    let newPrice = currentPrice * priceMultiplier;
    
    const minPrice = basePrice * 0.2;
    const maxPrice = basePrice * 5.0;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
    
    return Math.round(newPrice * 100) / 100;
  }

  simulateSupplyDemand(currentSupply, currentDemand, resourceCategory) {
    const categoryFactors = {
      tech: { supplyVolatility: 0.15, demandVolatility: 0.2 },
      consumable: { supplyVolatility: 0.25, demandVolatility: 0.3 },
      green: { supplyVolatility: 0.2, demandVolatility: 0.15 },
      luxury: { supplyVolatility: 0.1, demandVolatility: 0.25 }
    };
    
    const factors = categoryFactors[resourceCategory] || { supplyVolatility: 0.2, demandVolatility: 0.2 };
    
    const supplyChange = (Math.random() - 0.5) * 2 * factors.supplyVolatility;
    const demandChange = (Math.random() - 0.5) * 2 * factors.demandVolatility;
    
    let newSupply = currentSupply * (1 + supplyChange);
    let newDemand = currentDemand * (1 + demandChange);
    
    this.marketEvents.forEach(event => {
      if (event.resourceId && event.active) {
        newSupply *= event.supplyMultiplier || 1;
        newDemand *= event.demandMultiplier || 1;
      }
    });
    
    newSupply = Math.max(this.config.minSupply, Math.min(this.config.maxSupply, newSupply));
    newDemand = Math.max(this.config.minDemand, Math.min(this.config.maxDemand, newDemand));
    
    return {
      supply: Math.round(newSupply),
      demand: Math.round(newDemand)
    };
  }

  calculatePriceTrend(oldPrice, newPrice, currentTrend) {
    const priceChangePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    
    const newTrend = (currentTrend * this.config.trendDecay) + (priceChangePercent * (1 - this.config.trendDecay));
    
    return Math.max(-50, Math.min(50, newTrend));
  }

  addMarketEvent(event) {
    this.marketEvents.push({
      id: event.id || Date.now(),
      name: event.name,
      description: event.description,
      resourceId: event.resourceId,
      resourceCategory: event.resourceCategory,
      stationId: event.stationId,
      supplyMultiplier: event.supplyMultiplier || 1,
      demandMultiplier: event.demandMultiplier || 1,
      duration: event.duration || 10,
      ticksRemaining: event.duration || 10,
      active: true,
      createdAt: new Date()
    });
    
    this.emit('marketEvent', event);
  }

  processMarketEvents() {
    this.marketEvents = this.marketEvents.filter(event => {
      if (event.ticksRemaining > 0) {
        event.ticksRemaining--;
        return true;
      }
      event.active = false;
      this.emit('marketEventExpired', event);
      return false;
    });
  }

  simulateMarketTick(marketData) {
    const results = [];
    
    this.processMarketEvents();
    
    for (const market of marketData) {
      const { supply, demand } = this.simulateSupplyDemand(
        market.supply,
        market.demand,
        market.resourceCategory
      );
      
      const newPrice = this.calculatePrice(
        market.basePrice,
        market.currentPrice,
        supply,
        demand,
        market.priceTrend
      );
      
      const priceTrend = this.calculatePriceTrend(
        market.currentPrice,
        newPrice,
        market.priceTrend
      );
      
      results.push({
        stationId: market.stationId,
        resourceId: market.resourceId,
        currentPrice: newPrice,
        supply,
        demand,
        priceTrend,
        updatedAt: new Date()
      });
      
      if (Math.abs(priceTrend) > 20) {
        this.emit('significantPriceChange', {
          stationId: market.stationId,
          resourceId: market.resourceId,
          resourceName: market.resourceName,
          oldPrice: market.currentPrice,
          newPrice,
          priceTrend
        });
      }
    }
    
    return results;
  }

  generateRandomEvent(resources, stations) {
    const eventTypes = [
      {
        name: 'Supply Shortage',
        supplyMultiplier: 0.3,
        demandMultiplier: 1.5,
        categories: ['tech', 'consumable'],
        template: 'Critical shortage of {resource} at {station} due to {reason}'
      },
      {
        name: 'Surplus Shipment',
        supplyMultiplier: 2.5,
        demandMultiplier: 0.8,
        categories: ['consumable', 'green'],
        template: 'Massive shipment of {resource} arrives at {station}'
      },
      {
        name: 'Tech Breakthrough',
        supplyMultiplier: 0.7,
        demandMultiplier: 2.0,
        categories: ['tech'],
        template: 'New technology increases demand for {resource} components'
      },
      {
        name: 'Luxury Trend',
        supplyMultiplier: 1.0,
        demandMultiplier: 3.0,
        categories: ['luxury'],
        template: '{resource} becomes the latest status symbol among the elite'
      }
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const eligibleResources = resources.filter(r => eventType.categories.includes(r.category));
    const resource = eligibleResources[Math.floor(Math.random() * eligibleResources.length)];
    const station = stations[Math.floor(Math.random() * stations.length)];
    
    if (!resource || !station) return null;
    
    const reasons = [
      'pirate raids', 'manufacturing defects', 'labor strikes', 
      'hyperspace anomalies', 'regulatory changes', 'market speculation'
    ];
    
    const description = eventType.template
      .replace('{resource}', resource.name)
      .replace('{station}', station.name)
      .replace('{reason}', reasons[Math.floor(Math.random() * reasons.length)]);
    
    return {
      name: eventType.name,
      description,
      resourceId: resource.id,
      resourceCategory: resource.category,
      stationId: station.id,
      supplyMultiplier: eventType.supplyMultiplier,
      demandMultiplier: eventType.demandMultiplier,
      duration: Math.floor(Math.random() * 20) + 5
    };
  }
}

export default MarketSimulation;