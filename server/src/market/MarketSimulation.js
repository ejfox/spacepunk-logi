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
    
    // No price floors or ceilings - let the chaos reign!
    // Markets can crash to near-zero or spike to astronomical prices
    // This is peak corporate dysfunction and we're here for it
    
    return Math.max(0.01, Math.round(newPrice * 100) / 100); // Only prevent negative prices
  }

  simulateSupplyDemand(currentSupply, currentDemand, resourceCategory, stationId = null, sector = null) {
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
    
    // Apply market events with enhanced scope handling
    this.marketEvents.forEach(event => {
      if (!event.active) return;
      
      let eventApplies = false;
      
      // Station-specific events
      if (event.resourceId && event.stationId === stationId) {
        eventApplies = true;
      }
      
      // Sector-wide events
      if (event.scope === 'sector' && sector && event.sector === sector) {
        if (event.affectedCategories.includes('all') || 
            event.affectedCategories.includes(resourceCategory)) {
          eventApplies = true;
        }
      }
      
      // Galaxy-wide catastrophic events (affect EVERYTHING)
      if (event.scope === 'galaxy') {
        eventApplies = true;
      }
      
      if (eventApplies) {
        newSupply *= event.supplyMultiplier || 1;
        newDemand *= event.demandMultiplier || 1;
      }
    });
    
    // Remove supply/demand limits - let the chaos flow!
    // Corporate markets can completely collapse or explode
    newSupply = Math.max(1, newSupply); // Only prevent zero supply
    newDemand = Math.max(1, newDemand); // Only prevent zero demand
    
    return {
      supply: Math.round(newSupply),
      demand: Math.round(newDemand)
    };
  }

  calculatePriceTrend(oldPrice, newPrice, currentTrend) {
    const priceChangePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    
    const newTrend = (currentTrend * this.config.trendDecay) + (priceChangePercent * (1 - this.config.trendDecay));
    
    // No trend caps - let runaway inflation and deflation spirals happen!
    // This creates authentic corporate market disasters
    return newTrend;
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
    // 15% chance for sector-wide events, 5% for galaxy-wide catastrophes
    const eventScope = Math.random();
    
    if (eventScope < 0.05) {
      // GALAXY-WIDE CATASTROPHIC EVENTS (5%)
      return this.generateGalaxyWideEvent(resources, stations);
    } else if (eventScope < 0.20) {
      // SECTOR-WIDE EVENTS (15%)
      return this.generateSectorWideEvent(resources, stations);
    }
    
    // Regular station-specific events (80%)
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

  generateSectorWideEvent(resources, stations) {
    const sectorEvents = [
      {
        name: 'Corporate Bureaucratic Meltdown',
        supplyMultiplier: 0.1,
        demandMultiplier: 0.8,
        categories: ['all'],
        template: 'Sector-wide supply chain collapse due to Form 27-B filing deadline confusion',
        duration: 25
      },
      {
        name: 'Hyperspace Route Recalibration',
        supplyMultiplier: 0.4,
        demandMultiplier: 1.8,
        categories: ['all'],
        template: 'All sector shipping routes require mandatory "efficiency optimization" reviews',
        duration: 30
      },
      {
        name: 'Union Strike Action',
        supplyMultiplier: 0.2,
        demandMultiplier: 1.2,
        categories: ['tech', 'consumable'],
        template: 'Galactic Workers Union declares sector-wide work slowdown over coffee quality',
        duration: 20
      },
      {
        name: 'Tax Audit Season',
        supplyMultiplier: 0.6,
        demandMultiplier: 0.3,
        categories: ['luxury'],
        template: 'Corporate accounting departments freeze all "non-essential" luxury purchases',
        duration: 35
      }
    ];

    const eventType = sectorEvents[Math.floor(Math.random() * sectorEvents.length)];
    const sector = ['Inner', 'Middle', 'Outer', 'Core', 'Rim'][Math.floor(Math.random() * 5)];

    return {
      name: eventType.name,
      description: `${sector} Sector: ${eventType.template}`,
      scope: 'sector',
      sector: sector,
      supplyMultiplier: eventType.supplyMultiplier,
      demandMultiplier: eventType.demandMultiplier,
      duration: eventType.duration,
      affectedCategories: eventType.categories
    };
  }

  generateGalaxyWideEvent(resources, stations) {
    const galaxyEvents = [
      {
        name: 'The Great Corporate Restructuring',
        supplyMultiplier: 0.05,
        demandMultiplier: 0.1,
        template: 'Galaxy-wide corporate merger creates "streamlined efficiency protocols" (nobody knows what they actually do)',
        duration: 50
      },
      {
        name: 'Universal Basic Caffeine Shortage',
        supplyMultiplier: 0.01,
        demandMultiplier: 15.0,
        template: 'Coffee bean blight affects all inhabited systems - productivity plummets, desperation rises',
        duration: 60
      },
      {
        name: 'The Digital Currency Glitch',
        supplyMultiplier: 50.0,
        demandMultiplier: 0.1,
        template: 'Accounting AI malfunctions, accidentally marks everything as "free promotional samples"',
        duration: 15
      },
      {
        name: 'Mandatory Efficiency Seminars',
        supplyMultiplier: 0.3,
        demandMultiplier: 0.3,
        template: 'All stations required to attend week-long seminars on "Optimizing Workplace Synergy Through Bureaucratic Innovation"',
        duration: 40
      },
      {
        name: 'The Great Licensing Crisis',
        supplyMultiplier: 0.02,
        demandMultiplier: 2.0,
        template: 'Galaxy-wide discovery that 98% of all business licenses were invalid due to "clerical oversight" in 2347',
        duration: 45
      }
    ];

    const eventType = galaxyEvents[Math.floor(Math.random() * galaxyEvents.length)];

    return {
      name: eventType.name,
      description: `GALAXY-WIDE ALERT: ${eventType.template}`,
      scope: 'galaxy',
      supplyMultiplier: eventType.supplyMultiplier,
      demandMultiplier: eventType.demandMultiplier,
      duration: eventType.duration,
      affectedCategories: ['all'] // Galaxy events affect everything
    };
  }
}

export default MarketSimulation;