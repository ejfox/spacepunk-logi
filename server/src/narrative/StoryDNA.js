import Chance from 'chance'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class StoryDNA {
  constructor(seed = 'spacepunk-dna') {
    this.chance = new Chance(seed)
    this.atoms = {
      // Basic story atoms that can combine infinitely
      motivations: [],
      obstacles: [],
      stakes: [],
      tones: [],
      relationships: [],
      objects: [],
      settings: [],
      emotions: [],
      conflicts: [],
      outcomes: []
    }
    
    // Always ensure we have fallback atoms immediately
    this.addFundamentalAtoms()
    this.loadStoryAtoms() // Load additional atoms asynchronously
  }

  async loadStoryAtoms() {
    try {
      // Load the structured tropes as raw material, not templates
      const tropesPath = join(__dirname, '../data/spacepunk-tropes.json')
      const tropesData = JSON.parse(await fs.readFile(tropesPath, 'utf8'))
      
      // Extract story atoms from all tropes
      this.extractAtomsFromTropes(tropesData)
      
      // Add fundamental story DNA
      this.addFundamentalAtoms()
      
      console.log(`StoryDNA loaded ${this.getTotalAtoms()} story atoms`)
    } catch (error) {
      console.error('Failed to load story atoms:', error)
      this.addFundamentalAtoms() // Fallback to basic atoms
    }
  }

  extractAtomsFromTropes(tropesData) {
    // Extract reusable story components from all tropes
    Object.values(tropesData).flat().forEach(trope => {
      if (!trope.keywords) return
      
      // Parse keywords for story atoms
      trope.keywords.forEach(keyword => {
        this.categorizeKeyword(keyword, trope)
      })
      
      // Extract from narrative hooks
      if (trope.narrative_hooks) {
        trope.narrative_hooks.forEach(hook => {
          this.extractFromNarrativeHook(hook)
        })
      }
    })
  }

  categorizeKeyword(keyword, source) {
    const word = keyword.toLowerCase()
    
    // Motivations (why characters act)
    if (word.match(/seek|want|need|desire|pursue|avoid|escape|gain|lose/)) {
      this.atoms.motivations.push({
        text: keyword,
        corporate_spin: this.corporatize(keyword),
        source: source.name
      })
    }
    
    // Obstacles (what blocks progress)  
    if (word.match(/problem|barrier|block|prevent|stop|difficult|challenge|risk/)) {
      this.atoms.obstacles.push({
        text: keyword,
        corporate_spin: this.corporatize(keyword),
        source: source.name
      })
    }
    
    // Stakes (what's at risk)
    if (word.match(/danger|risk|threat|loss|death|failure|success|reward|benefit/)) {
      this.atoms.stakes.push({
        text: keyword,
        corporate_spin: this.corporatize(keyword),
        source: source.name
      })
    }
    
    // Relationships (how characters connect)
    if (word.match(/friend|enemy|ally|rival|mentor|student|family|colleague|partner/)) {
      this.atoms.relationships.push({
        text: keyword,
        corporate_spin: this.corporatize(keyword),
        source: source.name
      })
    }
    
    // Objects (important things)
    if (word.match(/weapon|tool|device|ship|cargo|data|information|secret|resource/)) {
      this.atoms.objects.push({
        text: keyword,
        corporate_spin: this.corporatize(keyword),
        source: source.name
      })
    }
  }

  extractFromNarrativeHook(hook) {
    // Extract emotional tones
    if (hook.match(/fear|hope|anger|joy|sadness|surprise|disgust|trust/i)) {
      this.atoms.emotions.push({
        text: hook.substring(0, 50),
        emotion: this.extractEmotion(hook)
      })
    }
    
    // Extract conflict patterns
    if (hook.match(/vs|against|conflict|fight|struggle|compete/i)) {
      this.atoms.conflicts.push({
        text: hook.substring(0, 50),
        type: this.extractConflictType(hook)
      })
    }
  }

  addFundamentalAtoms() {
    // Core story DNA that combines with everything
    this.atoms.motivations.push(
      { text: "survival", corporate_spin: "performance optimization" },
      { text: "revenge", corporate_spin: "corrective action implementation" },
      { text: "love", corporate_spin: "strategic partnership development" },
      { text: "power", corporate_spin: "organizational influence expansion" },
      { text: "knowledge", corporate_spin: "information asset acquisition" },
      { text: "freedom", corporate_spin: "operational independence achievement" },
      { text: "justice", corporate_spin: "policy compliance enforcement" },
      { text: "wealth", corporate_spin: "financial portfolio enhancement" }
    )

    this.atoms.obstacles.push(
      { text: "time pressure", corporate_spin: "deadline constraints" },
      { text: "resource scarcity", corporate_spin: "budget limitations" },
      { text: "opposition", corporate_spin: "stakeholder resistance" },
      { text: "incompetence", corporate_spin: "skill gap identification" },
      { text: "corruption", corporate_spin: "compliance irregularities" },
      { text: "technology failure", corporate_spin: "system performance issues" },
      { text: "miscommunication", corporate_spin: "information transfer inefficiencies" },
      { text: "moral conflict", corporate_spin: "ethical policy alignment challenges" }
    )

    this.atoms.stakes.push(
      { text: "life or death", corporate_spin: "critical business continuity" },
      { text: "reputation", corporate_spin: "brand image management" },
      { text: "career", corporate_spin: "professional development trajectory" },
      { text: "relationships", corporate_spin: "stakeholder relationship maintenance" },
      { text: "ideals", corporate_spin: "organizational value alignment" },
      { text: "home", corporate_spin: "operational base security" },
      { text: "future", corporate_spin: "long-term strategic positioning" }
    )

    this.atoms.tones.push(
      "darkly humorous", "cynically optimistic", "bureaucratically absurd",
      "corporately dystopian", "mundanely epic", "professionally threatening",
      "administratively chaotic", "systematically broken", "efficiently dysfunctional"
    )
  }

  // Safe array picker with fallbacks
  safePickone(array, fallback) {
    if (!array || array.length === 0) {
      return fallback
    }
    return this.chance.pickone(array)
  }

  // Generate infinite story combinations by mixing atoms
  generateStoryDNA(context = {}) {
    const dna = {
      // Core story structure (randomly combined)
      motivation: this.safePickone(this.atoms.motivations, { text: "profit", corporate_spin: "revenue optimization" }),
      obstacle: this.safePickone(this.atoms.obstacles, { text: "corporate interference", corporate_spin: "regulatory compliance" }),
      stakes: this.safePickone(this.atoms.stakes, { text: "business continuity", corporate_spin: "operational excellence" }),
      tone: this.safePickone(this.atoms.tones, { text: "professional", corporate_spin: "administratively efficient" }),
      
      // Relationship dynamics
      primary_relationship: this.safePickone(this.atoms.relationships, { text: "colleague", corporate_spin: "team member" }),
      relationship_tension: this.generateRelationshipTension(),
      
      // Story objects and setting elements
      key_object: this.safePickone(this.atoms.objects, { text: "equipment", corporate_spin: "corporate assets" }),
      setting_pressure: this.generateSettingPressure(context),
      
      // Emotional through-line
      emotional_arc: this.generateEmotionalArc(),
      
      // Conflict evolution
      conflict_pattern: this.generateConflictPattern(),
      
      // Corporate translation layer
      corporate_filter: this.generateCorporateFilter(),
      
      // Chance for mutation/variation
      mutation_factor: this.chance.floating({ min: 0.1, max: 0.3 })
    }
    
    return dna
  }

  generateRelationshipTension() {
    const tensions = [
      "competing for same resources",
      "different corporate loyalties", 
      "conflicting performance metrics",
      "information asymmetry",
      "unclear chain of command",
      "resource allocation disputes",
      "policy interpretation differences",
      "personal vs professional boundaries"
    ]
    return this.chance.pickone(tensions)
  }

  generateSettingPressure(context) {
    const basePressures = [
      "time constraints", "budget limitations", "regulatory oversight",
      "equipment failures", "supply chain disruptions", "security concerns",
      "communication breakdowns", "policy changes", "market volatility"
    ]
    
    // Add context-specific pressures
    if (context.heat > 50) basePressures.push("corporate surveillance", "compliance audit", "performance review")
    if (context.fuel < 30) basePressures.push("resource depletion", "emergency protocols", "operational limitations")
    if (context.credits < 500) basePressures.push("financial constraints", "budget approval needed", "cost optimization required")
    
    return this.chance.pickone(basePressures)
  }

  generateEmotionalArc() {
    const arcs = [
      "hope → frustration → cynical acceptance",
      "confidence → doubt → determined resolve",
      "excitement → boredom → unexpected engagement", 
      "fear → courage → overconfidence",
      "anger → understanding → strategic patience",
      "curiosity → knowledge → responsibility burden"
    ]
    return this.chance.pickone(arcs)
  }

  generateConflictPattern() {
    const patterns = [
      "escalating miscommunication",
      "competing interpretations of rules",
      "resource scarcity creating alliances",
      "information revealing hidden connections",
      "small problems cascading into crises",
      "individual agency vs institutional pressure",
      "short-term vs long-term thinking",
      "efficiency vs thoroughness trade-offs"
    ]
    return this.chance.pickone(patterns)
  }

  generateCorporateFilter() {
    return {
      euphemism_level: this.chance.integer({ min: 1, max: 5 }),
      bureaucracy_density: this.chance.floating({ min: 0.2, max: 0.8 }),
      humor_cynicism_ratio: this.chance.floating({ min: 0.3, max: 0.7 }),
      workplace_metaphor_strength: this.chance.floating({ min: 0.5, max: 1.0 })
    }
  }

  corporatize(word) {
    const corporateTranslations = {
      "fight": "strategic engagement",
      "kill": "terminate with extreme prejudice", 
      "steal": "unauthorized asset transfer",
      "lie": "strategic information management",
      "betray": "realign loyalties",
      "escape": "exit strategy implementation",
      "hide": "maintain operational security",
      "attack": "assertive intervention",
      "destroy": "comprehensive asset depreciation"
    }
    
    return corporateTranslations[word.toLowerCase()] || `${word} (pending policy clarification)`
  }

  extractEmotion(text) {
    const emotions = ["fear", "hope", "anger", "joy", "sadness", "surprise", "disgust", "trust"]
    return emotions.find(emotion => text.toLowerCase().includes(emotion)) || "professional concern"
  }

  extractConflictType(text) {
    if (text.includes("vs")) return "direct opposition"
    if (text.includes("compete")) return "resource competition"
    if (text.includes("struggle")) return "systemic resistance"
    return "policy interpretation dispute"
  }

  getTotalAtoms() {
    return Object.values(this.atoms).reduce((sum, category) => sum + category.length, 0)
  }

  // Export DNA as LLM-consumable instructions
  exportDNAForLLM(dna) {
    return `STORY DNA SEQUENCE:
Core Drive: ${dna.motivation.corporate_spin} (${dna.motivation.text})
Primary Obstacle: ${dna.obstacle.corporate_spin} (${dna.obstacle.text})
Stakes: ${dna.stakes.corporate_spin} (${dna.stakes.text})
Tone: ${dna.tone}

Relationship Dynamic: ${dna.primary_relationship.corporate_spin} with ${dna.relationship_tension}
Key Object/Focus: ${dna.key_object.corporate_spin}
Environmental Pressure: ${dna.setting_pressure}
Emotional Journey: ${dna.emotional_arc}
Conflict Evolution: ${dna.conflict_pattern}

Corporate Translation Guidelines:
- Euphemism Level: ${dna.corporate_filter.euphemism_level}/5
- Bureaucracy Density: ${Math.round(dna.corporate_filter.bureaucracy_density * 100)}%
- Cynical Humor: ${Math.round(dna.corporate_filter.humor_cynicism_ratio * 100)}%
- Workplace Metaphor Strength: ${Math.round(dna.corporate_filter.workplace_metaphor_strength * 100)}%

INSTRUCTIONS: Use this DNA to generate a unique story that combines these elements naturally. The LLM should feel free to interpret, combine, and mutate these elements creatively while maintaining the corporate spacepunk tone.`
  }
}