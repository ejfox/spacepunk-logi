import Chance from 'chance'
import MissionGenerator from '../missions/MissionGenerator.js'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class StorytellerAgent {
  constructor(seed = 'spacepunk-storyteller') {
    this.chance = new Chance(seed)
    this.missionGenerator = new MissionGenerator()
    this.narrativeStyles = this.initializeNarrativeStyles()
    this.corporatePhrases = this.initializeCorporatePhrases()
    this.gameHistory = []
    this.narrativeMemory = new Map() // Track recurring themes/characters
    this.tropesDatabase = null
    this.loadTropesDatabase()
  }

  async loadTropesDatabase() {
    try {
      const tropesPath = join(__dirname, '../data/spacepunk-tropes.json')
      const tropesData = await fs.readFile(tropesPath, 'utf8')
      this.tropesDatabase = JSON.parse(tropesData)
      console.log(`StorytellerAgent loaded ${this.tropesDatabase.metadata.total_tropes} tropes`)
    } catch (error) {
      console.error('StorytellerAgent failed to load tropes:', error)
      this.tropesDatabase = { narrative: [], corporate: [], comedy_tropes: [] }
    }
  }

  initializeNarrativeStyles() {
    return {
      corporate_memo: {
        opening: [
          "INCIDENT REPORT FILED:",
          "OPERATIONAL UPDATE:",
          "COMPLIANCE NOTIFICATION:",
          "PRODUCTIVITY ASSESSMENT:",
          "QUARTERLY PERFORMANCE REVIEW:"
        ],
        tone: "bureaucratic",
        pov: "third_person_corporate"
      },
      
      ship_log: {
        opening: [
          "Personal log, supplemental:",
          "Captain's note:",
          "Ship status update:",
          "Course correction logged:",
          "Navigation entry:"
        ],
        tone: "personal",
        pov: "first_person"
      },
      
      news_brief: {
        opening: [
          "SPACECORP NEWS BRIEF:",
          "SECTOR UPDATE:",
          "TRADE BULLETIN:",
          "SECURITY ALERT:",
          "MARKET ANALYSIS:"
        ],
        tone: "news_corporate",
        pov: "third_person_news"
      },
      
      technical_report: {
        opening: [
          "SYSTEM DIAGNOSTIC:",
          "ENGINEERING REPORT:",
          "MAINTENANCE LOG:",
          "EQUIPMENT STATUS:",
          "TECHNICAL ASSESSMENT:"
        ],
        tone: "technical",
        pov: "systems"
      }
    }
  }

  initializeCorporatePhrases() {
    return {
      euphemisms: [
        "right-sized the operation",
        "optimized resource allocation", 
        "streamlined the workflow",
        "enhanced operational efficiency",
        "implemented strategic restructuring",
        "maximized shareholder value",
        "leveraged synergistic opportunities"
      ],
      
      bureaucratic_time: [
        "during the aforementioned timeframe",
        "within the specified operational window", 
        "concurrent with scheduled activities",
        "as per regulatory compliance requirements",
        "following standard protocols"
      ],
      
      corporate_threats: [
        "disciplinary action may be required",
        "performance review recommended",
        "compliance monitoring initiated",
        "additional training suggested",
        "operational oversight increased"
      ],
      
      success_metrics: [
        "exceeded projected targets",
        "demonstrated core competencies", 
        "achieved optimal performance parameters",
        "maintained regulatory compliance",
        "delivered measurable results"
      ]
    }
  }

  async generateNarrative(gameEvents, context = {}) {
    try {
      // Wait for tropes to load if needed
      if (!this.tropesDatabase) {
        await this.loadTropesDatabase()
      }

      // Select narrative style based on context and chance
      const style = this.selectNarrativeStyle(gameEvents, context)
      
      // Analyze events to identify narrative patterns
      const narrativePatterns = this.identifyNarrativePatterns(gameEvents, context)
      
      // Build narrative prompt with game events and tropes
      const prompt = this.buildNarrativePrompt(gameEvents, style, context, narrativePatterns)
      
      // Generate narrative using LLM
      const narrative = await this.callStorytellerLLM(prompt)
      
      // Post-process with corporate flavor
      const processedNarrative = this.addCorporateFlavor(narrative, style)
      
      // Update narrative memory
      this.updateNarrativeMemory(gameEvents, processedNarrative)
      
      return {
        text: processedNarrative,
        style: style.tone,
        timestamp: new Date(),
        events_covered: gameEvents.length,
        patterns_identified: narrativePatterns.map(p => p.name),
        seed: this.chance.seed
      }
      
    } catch (error) {
      console.error('Narrative generation failed:', error)
      return this.generateFallbackNarrative(gameEvents, context)
    }
  }

  identifyNarrativePatterns(gameEvents, context) {
    const patterns = []
    
    // Analyze event sequences for classic patterns
    const eventTypes = gameEvents.map(e => e.action)
    const eventSequence = eventTypes.join('-')
    
    // Check for Hero's Journey pattern
    if (eventSequence.includes('explore') && eventSequence.includes('spy') && context.heat_level > 50) {
      const heroJourney = this.tropesDatabase.classic_plots?.find(t => t.name === "The Hero's Journey")
      if (heroJourney) patterns.push(heroJourney)
    }
    
    // Check for David vs Goliath
    if (context.credits < 500 && eventTypes.includes('trade')) {
      const davidGoliath = this.tropesDatabase.classic_plots?.find(t => t.name === "David vs Goliath")
      if (davidGoliath) patterns.push(davidGoliath)
    }
    
    // Check for Escalating Bureaucracy comedy
    if (eventTypes.filter(e => e === 'wait').length > 2) {
      const escalating = this.tropesDatabase.comedy_tropes?.find(t => t.name === "Escalating Bureaucracy")
      if (escalating) patterns.push(escalating)
    }
    
    // Check for Man vs System conflict
    const totalHeatGain = gameEvents.reduce((sum, e) => sum + (e.heat_change || 0), 0)
    if (totalHeatGain > 30) {
      const manVsSystem = this.tropesDatabase.conflict_types?.find(t => t.name === "Man vs System")
      if (manVsSystem) patterns.push(manVsSystem)
    }
    
    // Add character archetype based on player behavior
    if (eventTypes.filter(e => e === 'spy').length > eventTypes.filter(e => e === 'trade').length) {
      const insider = this.tropesDatabase.character_archetypes?.find(t => t.name === "The Insider")
      if (insider) patterns.push(insider)
    }
    
    // Ensure we always have at least one pattern
    if (patterns.length === 0 && this.tropesDatabase.narrative) {
      patterns.push(this.chance.pickone(this.tropesDatabase.narrative))
    }
    
    return patterns
  }

  selectNarrativeStyle(gameEvents, context) {
    // Use chance.js for deterministic style selection
    const styles = Object.keys(this.narrativeStyles)
    
    // Weight selection based on event types and context
    let weights = {}
    
    // Default weights
    styles.forEach(style => weights[style] = 1)
    
    // Adjust weights based on game events
    gameEvents.forEach(event => {
      if (event.type === 'spy' || event.heat_change > 0) {
        weights.corporate_memo += 2
        weights.news_brief += 1
      }
      
      if (event.type === 'explore' || event.type === 'travel') {
        weights.ship_log += 2
      }
      
      if (event.fuel_change || event.type === 'refuel') {
        weights.technical_report += 1
      }
      
      if (event.credits_change) {
        weights.news_brief += 1
      }
    })
    
    // Use chance.weighted for deterministic selection
    const selectedStyle = this.chance.weighted(styles, Object.values(weights))
    return this.narrativeStyles[selectedStyle]
  }

  buildNarrativePrompt(gameEvents, style, context, narrativePatterns = []) {
    const eventSummary = this.summarizeEvents(gameEvents)
    const corporateContext = this.generateCorporateContext(context)
    const narrativeHooks = this.extractNarrativeHooks(gameEvents)
    
    // Build narrative pattern guidance
    const patternGuidance = narrativePatterns.map(pattern => 
      `${pattern.name}: ${pattern.description} (Example: "${pattern.narrative_hooks[0]}")`
    ).join('\n')
    
    return `You are a corporate storyteller agent for Spacepunk. Transform these game events into a compelling narrative.

NARRATIVE STYLE: ${style.tone}
POINT OF VIEW: ${style.pov}

GAME EVENTS TO NARRATE:
${eventSummary}

CORPORATE CONTEXT:
${corporateContext}

NARRATIVE HOOKS:
${narrativeHooks}

NARRATIVE PATTERNS DETECTED:
${patternGuidance}

IMPORTANT: Weave these narrative patterns naturally into the story. The events should feel like they're following these classic story structures, but filtered through corporate bureaucracy.

REQUIREMENTS:
- 2-4 sentences maximum
- Use corporate dystopia tone with dark humor
- Treat extraordinary events as mundane workplace occurrences
- Include specific numbers/consequences from events
- End with a bureaucratic flourish or corporate euphemism
- Style should match ${style.tone} perspective

TONE EXAMPLES:
corporate_memo: "Employee demonstrated suboptimal decision-making parameters during asteroid belt navigation exercise..."
ship_log: "Another day, another near-death experience filed under 'routine operations'..."
news_brief: "Local captain's creative interpretation of safety protocols yields mixed results..."
technical_report: "Fuel consumption exceeded projections by 15% due to 'unscheduled exploration activities'..."

Generate ONLY the narrative text. No additional formatting.`
  }

  summarizeEvents(gameEvents) {
    return gameEvents.map(event => {
      const changes = []
      if (event.fuel_change) changes.push(`fuel ${event.fuel_change > 0 ? '+' : ''}${event.fuel_change}`)
      if (event.credits_change) changes.push(`credits ${event.credits_change > 0 ? '+' : ''}${event.credits_change}`)
      if (event.heat_change) changes.push(`heat ${event.heat_change > 0 ? '+' : ''}${event.heat_change}`)
      
      return `${event.action}: ${event.description} (${changes.join(', ')})`
    }).join('\n')
  }

  generateCorporateContext(context) {
    const phrases = []
    
    if (context.heat_level > 50) {
      phrases.push(`Current compliance rating: ${this.getComplianceRating(context.heat_level)}`)
    }
    
    if (context.location) {
      phrases.push(`Operational theater: ${context.location}`)
    }
    
    if (context.credits) {
      phrases.push(`Asset portfolio: ${context.credits} CR`)
    }
    
    return phrases.join(' | ')
  }

  extractNarrativeHooks(gameEvents) {
    const hooks = []
    
    // Look for recurring patterns
    const actionCounts = {}
    gameEvents.forEach(event => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1
    })
    
    // Multiple of same action
    Object.entries(actionCounts).forEach(([action, count]) => {
      if (count > 2) {
        hooks.push(`Pattern detected: ${count} consecutive ${action} operations`)
      }
    })
    
    // Risk patterns
    const totalHeatGain = gameEvents.reduce((sum, e) => sum + (e.heat_change || 0), 0)
    if (totalHeatGain > 30) {
      hooks.push("Employee demonstrating concerning disregard for corporate oversight")
    }
    
    // Economic patterns  
    const totalCreditsChange = gameEvents.reduce((sum, e) => sum + (e.credits_change || 0), 0)
    if (totalCreditsChange > 500) {
      hooks.push("Significant revenue generation noted")
    } else if (totalCreditsChange < -200) {
      hooks.push("Asset depreciation requires managerial review")
    }
    
    return hooks.join(' | ')
  }

  getComplianceRating(heatLevel) {
    if (heatLevel < 25) return "EXEMPLARY"
    if (heatLevel < 50) return "SATISFACTORY" 
    if (heatLevel < 75) return "REQUIRES MONITORING"
    return "IMMEDIATE INTERVENTION REQUIRED"
  }

  async callStorytellerLLM(prompt) {
    const response = await this.missionGenerator.callLLM([
      {
        role: "system",
        content: `You are a corporate storyteller AI specializing in spacepunk narratives. You transform mundane game events into darkly humorous corporate-speak that treats space adventures as workplace incidents.

Key principles:
- Bureaucratic language for extraordinary events
- Corporate euphemisms for dangerous situations  
- Dark humor about capitalism in space
- Treat life-or-death as performance metrics
- Always maintain professional corporate tone

Keep responses brief (2-4 sentences) and punchy.`
      },
      {
        role: "user",
        content: prompt
      }
    ])
    
    return response.trim()
  }

  addCorporateFlavor(narrative, style) {
    let processed = narrative
    
    // Add random corporate phrases based on style
    if (style.tone === 'corporate_memo') {
      const euphemism = this.chance.pickone(this.corporatePhrases.euphemisms)
      const opening = this.chance.pickone(style.opening)
      processed = `${opening} ${processed}`
      
      // Chance to add corporate threat
      if (this.chance.bool({ likelihood: 30 })) {
        const threat = this.chance.pickone(this.corporatePhrases.corporate_threats)
        processed += ` ${threat.charAt(0).toUpperCase() + threat.slice(1)}.`
      }
    }
    
    if (style.tone === 'technical_report') {
      const opening = this.chance.pickone(style.opening)
      processed = `${opening} ${processed}`
    }
    
    // Add bureaucratic time references
    if (this.chance.bool({ likelihood: 40 })) {
      const timeRef = this.chance.pickone(this.corporatePhrases.bureaucratic_time)
      processed = processed.replace(/during|while|when/, timeRef)
    }
    
    return processed
  }

  updateNarrativeMemory(gameEvents, narrative) {
    // Track recurring themes and patterns for future narrative consistency
    const key = `events_${gameEvents.length}_${Date.now()}`
    this.narrativeMemory.set(key, {
      events: gameEvents,
      narrative: narrative,
      timestamp: Date.now()
    })
    
    // Keep memory manageable
    if (this.narrativeMemory.size > 100) {
      const oldestKey = Array.from(this.narrativeMemory.keys())[0]
      this.narrativeMemory.delete(oldestKey)
    }
  }

  generateFallbackNarrative(gameEvents, context) {
    // Use chance.js for deterministic fallback narrative
    const templates = [
      "Another routine operational period concluded with {eventCount} documented incidents. Corporate oversight remains {complianceLevel}.",
      "Employee #{id} continues to demonstrate creative interpretation of standard operating procedures. {eventCount} events logged for review.",
      "Quarterly assessment indicates {eventCount} actionable items requiring managerial attention. Performance metrics within acceptable parameters.",
      "Standard operational cycle completed. {eventCount} incidents filed under 'routine space logistics'. No additional corporate intervention required at this time."
    ]
    
    const template = this.chance.pickone(templates)
    const complianceLevel = this.getComplianceRating(context.heat_level || 0).toLowerCase()
    
    return template
      .replace('{eventCount}', gameEvents.length)
      .replace('{complianceLevel}', complianceLevel)
      .replace('{id}', this.chance.integer({ min: 1000, max: 9999 }))
  }

  // Utility method to generate seeded narrative from action history
  async generateActionSummary(actions, playerState) {
    const gameEvents = actions.map(action => ({
      action: action.type,
      description: action.description,
      fuel_change: action.fuel_change,
      credits_change: action.credits_change, 
      heat_change: action.heat_change,
      timestamp: action.timestamp
    }))
    
    return await this.generateNarrative(gameEvents, {
      heat_level: playerState.heat,
      location: playerState.location,
      credits: playerState.credits
    })
  }
}