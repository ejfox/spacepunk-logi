import Chance from 'chance'

/**
 * Seeded Random Number Generator for Spacepunk
 * 
 * Uses chance.js to provide deterministic, seeded randomization across all game systems.
 * This ensures reproducible behavior for testing and consistent simulation results.
 */

class SeededRandom {
  constructor(seed = null) {
    // Use current tick or timestamp as default seed
    this.seed = seed || this.generateGameSeed()
    this.chance = new Chance(this.seed)
  }

  generateGameSeed() {
    // Create a game-state-based seed from current time and some game state
    const baseTime = Date.now()
    const gameState = process.env.NODE_ENV || 'development'
    return `spacepunk-${gameState}-${baseTime}`
  }

  // Core random methods
  random() {
    return this.chance.random()
  }

  integer(options = {}) {
    return this.chance.integer(options)
  }

  floating(options = {}) {
    return this.chance.floating(options)
  }

  bool(likelihood = 50) {
    return this.chance.bool({ likelihood })
  }

  // Game-specific randomization methods
  
  /**
   * Generate crew personality traits with Jungian archetypes
   */
  generateCrewTraits() {
    // Core traits (keep existing)
    const coreTraits = {
      bravery: this.chance.normal({ mean: 50, dev: 20 }),
      loyalty: this.chance.normal({ mean: 60, dev: 15 }),
      ambition: this.chance.normal({ mean: 45, dev: 25 }),
      work_ethic: this.chance.normal({ mean: 65, dev: 18 }),
      gossip_tendency: this.chance.normal({ mean: 40, dev: 20 })
    }

    // Jungian cognitive functions (mutually exclusive pairs)
    const extroversion = this.chance.normal({ mean: 50, dev: 25 })
    const introversion = 100 - extroversion

    const thinking = this.chance.normal({ mean: 50, dev: 25 })
    const feeling = 100 - thinking

    const sensing = this.chance.normal({ mean: 50, dev: 25 })
    const intuition = 100 - sensing

    const judging = this.chance.normal({ mean: 50, dev: 25 })
    const perceiving = 100 - judging

    // Jungian archetypes (each crew member has one dominant archetype)
    const archetypes = [
      'innocent', 'sage', 'explorer', 'outlaw', 'magician', 'hero',
      'lover', 'jester', 'caregiver', 'creator', 'ruler', 'orphan'
    ]
    const dominantArchetype = this.chance.pickone(archetypes)
    
    // Generate archetype scores (dominant one is high, others lower)
    const archetypeScores = {}
    archetypes.forEach(archetype => {
      if (archetype === dominantArchetype) {
        archetypeScores[archetype] = this.chance.normal({ mean: 75, dev: 10 })
      } else {
        archetypeScores[archetype] = this.chance.normal({ mean: 25, dev: 15 })
      }
    })

    return {
      ...coreTraits,
      // Cognitive functions
      extroversion,
      introversion,
      thinking,
      feeling,
      sensing,
      intuition,
      judging,
      perceiving,
      // Archetype scores
      ...archetypeScores,
      dominant_archetype: dominantArchetype
    }
  }

  /**
   * Generate crew skills with role-based weighting
   */
  generateCrewSkills(role = 'general') {
    const baseSkills = {
      engineering: this.chance.integer({ min: 20, max: 80 }),
      piloting: this.chance.integer({ min: 20, max: 80 }),
      social: this.chance.integer({ min: 20, max: 80 }),
      combat: this.chance.integer({ min: 20, max: 80 })
    }

    // Role-based skill bonuses
    const roleBonuses = {
      engineer: { engineering: 20 },
      pilot: { piloting: 20 },
      diplomat: { social: 20 },
      security: { combat: 20 },
      general: {}
    }

    const bonus = roleBonuses[role] || {}
    Object.keys(bonus).forEach(skill => {
      baseSkills[skill] = this.chance.integer({ min: baseSkills[skill] + bonus[skill], max: 100 })
    })

    return baseSkills
  }

  /**
   * Generate crew names with cultural backgrounds
   */
  generateCrewName(culture = null) {
    const cultures = ['Corporate', 'Belter', 'Spacer', 'Agricultural', 'Military']
    const selectedCulture = culture || this.chance.pickone(cultures)
    
    // Culture-specific naming patterns
    const namePools = {
      Corporate: {
        first: ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley'],
        last: ['Chen', 'Martinez', 'Johnson', 'Kim', 'Singh', 'Torres']
      },
      Belter: {
        first: ['Zara', 'Kai', 'Nova', 'Rex', 'Luna', 'Orion'],
        last: ['Voss', 'Kane', 'Stone', 'Drake', 'Cross', 'Vale']
      },
      Spacer: {
        first: ['Nyx', 'Zeph', 'Vega', 'Axis', 'Echo', 'Zero'],
        last: ['Station', 'Drift', 'Void', 'Star', 'Jump', 'Phase']
      },
      Agricultural: {
        first: ['Sam', 'Pat', 'Drew', 'Sage', 'River', 'Sky'],
        last: ['Green', 'Fields', 'Harvest', 'Grove', 'Meadow', 'Root']
      },
      Military: {
        first: ['Cole', 'Blake', 'Quinn', 'Reed', 'Stone', 'Gray'],
        last: ['Cross', 'Sharp', 'Steel', 'Pierce', 'Storm', 'Knight']
      }
    }

    const pool = namePools[selectedCulture] || namePools.Corporate
    const firstName = this.chance.pickone(pool.first)
    const lastName = this.chance.pickone(pool.last)
    
    return {
      name: `${firstName} ${lastName}`,
      culture: selectedCulture
    }
  }

  /**
   * Generate market price fluctuations
   */
  generatePriceFluctuation(basePrice, volatility = 0.1) {
    const fluctuation = this.chance.normal({ mean: 0, dev: volatility })
    const newPrice = basePrice * (1 + fluctuation)
    return this.chance.integer({ min: 1, max: this.chance.integer({ min: newPrice, max: newPrice + 1 }) })
  }

  /**
   * Generate gossip content based on type and participants
   */
  generateGossipSeed(type, participants = []) {
    const seeds = {
      romance: [
        'heart eyes', 'lunch together', 'late night shifts', 'shared smiles',
        'coffee dates', 'protection instinct', 'jealous looks', 'gift giving'
      ],
      incompetence: [
        'broken tool', 'wrong button', 'late again', 'confused orders',
        'safety violation', 'skill gap', 'mistake pattern', 'help needed'
      ],
      health: [
        'coughing', 'tired lately', 'medication', 'doctor visit',
        'injury concern', 'stress symptoms', 'dietary changes', 'exercise habits'
      ],
      scandal: [
        'secret meeting', 'hidden past', 'mysterious call', 'suspicious behavior',
        'unexplained absence', 'cover story', 'nervous energy', 'reputation risk'
      ],
      conspiracy: [
        'overheard planning', 'secret alliance', 'hidden agenda', 'suspicious timing',
        'coordinated action', 'private discussion', 'unusual cooperation', 'mystery meeting'
      ]
    }

    const typeSeeds = seeds[type] || seeds.scandal
    return this.chance.pickone(typeSeeds)
  }

  /**
   * Determine gossip spread probability based on relationships
   */
  calculateSpreadProbability(sourceRelationship, targetRelationship, gossipType) {
    // Base probability by gossip type
    const baseProbabilities = {
      romance: 0.7,      // Juicy gossip spreads fast
      incompetence: 0.5, // Work-related spreads moderately
      health: 0.3,       // Private matters spread slowly
      scandal: 0.8,      // Scandals spread very fast
      conspiracy: 0.4    // Dangerous gossip spreads cautiously
    }

    let probability = baseProbabilities[gossipType] || 0.5

    // Relationship modifiers
    if (sourceRelationship > 70) probability += 0.2  // Good friends share more
    if (sourceRelationship < 30) probability -= 0.3  // Enemies less likely to share
    if (targetRelationship < 20) probability += 0.1  // Negative gossip about enemies

    // Add some randomness
    probability += this.chance.floating({ min: -0.1, max: 0.1 })

    // Clamp between 0 and 1 using chance
    if (probability < 0) probability = 0
    if (probability > 1) probability = 1
    
    return probability
  }

  /**
   * Reset the random generator with a new seed
   */
  reseed(newSeed) {
    this.seed = newSeed
    this.chance = new Chance(this.seed)
  }

  /**
   * Get current seed (useful for debugging and testing)
   */
  getSeed() {
    return this.seed
  }
}

// Global instance for game-wide consistency
export const gameRandom = new SeededRandom()

// Export class for creating specific instances
export default SeededRandom