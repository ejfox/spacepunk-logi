import Chance from 'chance'
import MissionGenerator from '../missions/MissionGenerator.js'

export class MicroNarrativeGenerator {
  constructor(seed = 'spacepunk-micro-narrative') {
    this.chance = new Chance(seed)
    this.missionGenerator = new MissionGenerator()
    this.templates = this.initializeTemplates()
  }

  initializeTemplates() {
    return {
      crew_hiring: [
        "Employee {name} demonstrates acceptable compliance metrics for {skill} operations",
        "Personnel file {name}: Previous corporate violations within tolerable parameters",
        "Recruitment candidate {name} shows adequate {skill} competency scores",
        "Background check {name}: Loyalty indicators sufficient for operational deployment"
      ],
      
      crew_training: [
        "Skill enhancement program yielded {improvement}% productivity increase for {name}",
        "Employee {name} achieved Level {level} certification in {skill} methodology",
        "Training completion: {name} now authorized for {skill} operational procedures",
        "Performance metrics indicate {name}'s {skill} capabilities exceed minimum standards"
      ],

      market_price_change: [
        "Market volatility alert: {resource} pricing adjusted {change}% due to supply chain optimization",
        "Corporate memo: {resource} values fluctuated {change}% following sector-wide efficiency improvements",
        "Economic indicator: {resource} demand patterns shifted {change}% per quarterly projections",
        "Trade bulletin: {resource} pricing algorithms recalibrated, variance {change}%"
      ],

      fuel_consumption: [
        "Propulsion efficiency report: Fuel expenditure {amount} units within operational parameters",
        "Energy audit: {amount} fuel consumed during routine logistics operations",
        "Resource utilization: {amount} units allocated to propulsion systems per corporate guidelines",
        "Fuel management: {amount} units processed through authorized consumption channels"
      ],

      credits_earned: [
        "Revenue generation: {amount} CR deposited following successful completion of contractual obligations",
        "Financial update: Asset portfolio increased by {amount} CR through operational excellence",
        "Income statement: {amount} CR credited per approved transaction protocols",
        "Profit margin: {amount} CR earned within acceptable corporate performance metrics"
      ],

      credits_spent: [
        "Expenditure authorization: {amount} CR allocated for essential operational requirements",
        "Budget allocation: {amount} CR processed through approved procurement channels",
        "Financial outlay: {amount} CR invested in mission-critical resource acquisition",
        "Cost analysis: {amount} CR expenditure categorized as necessary operational overhead"
      ],

      heat_increase: [
        "Compliance monitoring: Corporate oversight interest increased by {amount} points",
        "Regulatory attention: Surveillance parameters adjusted upward by {amount} units",
        "Risk assessment: Corporate scrutiny levels elevated {amount} degrees",
        "Oversight alert: Management attention coefficients raised {amount} points"
      ],

      system_status: [
        "All systems operating within normal corporate-approved parameters",
        "Routine maintenance protocols executed according to regulatory compliance standards",
        "Equipment functionality verified per standardized operational procedures",
        "Technical specifications confirmed to meet minimum corporate requirements"
      ],

      location_travel: [
        "Navigation update: Vessel relocated to {location} per authorized flight plan",
        "Transit completion: Arrival at {location} logged in corporate database",
        "Position report: Current coordinates {location} confirmed by navigation systems",
        "Location status: Operational theater updated to {location} sector"
      ]
    }
  }

  async generateCrewHiringNarrative(crewMember) {
    try {
      // Try LLM first
      const prompt = `Transform this crew hiring data into a 1-sentence corporate memo about employee onboarding:

Crew Member: ${crewMember.name}
Background: ${crewMember.cultural_background}
Primary Skill: ${crewMember.engineering || crewMember.piloting || crewMember.combat ? 
  'Engineering' : 'Operations'}
Trait: ${crewMember.trait_handy ? 'Mechanically Inclined' : 'Standard Competency'}

Write as a corporate HR notification. Use bureaucratic language that treats space logistics as mundane office work.`

      const narrative = await this.callMicroLLM(prompt)
      return narrative || this.generateFallbackNarrative('crew_hiring', {
        name: crewMember.name,
        skill: this.getTopSkill(crewMember)
      })
    } catch (error) {
      return this.generateFallbackNarrative('crew_hiring', {
        name: crewMember.name,
        skill: this.getTopSkill(crewMember)
      })
    }
  }

  async generateTrainingNarrative(trainingData) {
    try {
      const prompt = `Transform this training completion into a 1-sentence corporate performance review:

Employee: ${trainingData.crewMember.name}
Skill Improved: ${trainingData.skill}
Progress Made: ${trainingData.improvement}%
Training Type: ${trainingData.trainingType}

Write as a corporate training department memo. Treat space skills like office productivity improvements.`

      const narrative = await this.callMicroLLM(prompt)
      return narrative || this.generateFallbackNarrative('crew_training', {
        name: trainingData.crewMember.name,
        skill: trainingData.skill,
        improvement: trainingData.improvement,
        level: Math.floor(trainingData.improvement / 20) + 1
      })
    } catch (error) {
      return this.generateFallbackNarrative('crew_training', trainingData)
    }
  }

  async generateMarketNarrative(marketChange) {
    try {
      const prompt = `Transform this market data into a 1-sentence corporate trade bulletin:

Resource: ${marketChange.resourceName}
Price Change: ${marketChange.priceChange}%
Station: ${marketChange.stationName}
Direction: ${marketChange.priceChange > 0 ? 'Increased' : 'Decreased'}

Write as a corporate economics department memo. Treat galactic trade like quarterly earnings reports.`

      const narrative = await this.callMicroLLM(prompt)
      return narrative || this.generateFallbackNarrative('market_price_change', {
        resource: marketChange.resourceName,
        change: marketChange.priceChange
      })
    } catch (error) {
      return this.generateFallbackNarrative('market_price_change', {
        resource: marketChange.resourceName,
        change: marketChange.priceChange
      })
    }
  }

  async generateActionNarrative(actionType, actionData) {
    const narrativeMap = {
      'fuel_used': () => this.generateFallbackNarrative('fuel_consumption', { amount: actionData.fuel_change }),
      'credits_earned': () => this.generateFallbackNarrative('credits_earned', { amount: actionData.credits_change }),
      'credits_spent': () => this.generateFallbackNarrative('credits_spent', { amount: Math.abs(actionData.credits_change) }),
      'heat_gained': () => this.generateFallbackNarrative('heat_increase', { amount: actionData.heat_change }),
      'location_changed': () => this.generateFallbackNarrative('location_travel', { location: actionData.location }),
      'system_check': () => this.generateFallbackNarrative('system_status', {})
    }

    const generator = narrativeMap[actionType]
    return generator ? generator() : `Corporate log: ${actionType} operation completed within standard parameters.`
  }

  async callMicroLLM(prompt) {
    try {
      const response = await this.missionGenerator.callLLM([
        {
          role: "system",
          content: `You are a corporate AI assistant that transforms game data into brief corporate memos. Keep responses to exactly 1 sentence. Use bureaucratic language that treats space adventures as mundane office work. Examples:

- "Employee Chen demonstrates acceptable welding competency for routine maintenance operations."
- "Market analysis indicates Quantum Crystals experienced 12% price volatility due to sector-wide supply optimization."
- "Personnel file Torres: Loyalty metrics sufficient for deep space assignment authorization."`
        },
        {
          role: "user",
          content: prompt
        }
      ])
      
      return response.trim()
    } catch (error) {
      console.error('MicroLLM call failed:', error)
      return null
    }
  }

  generateFallbackNarrative(type, data) {
    const templates = this.templates[type] || ["Operation completed within standard parameters."]
    let template = this.chance.pickone(templates)
    
    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{${key}}`, 'g'), value)
    })
    
    return template
  }

  getTopSkill(crewMember) {
    const skills = {
      engineering: crewMember.engineering || 0,
      piloting: crewMember.piloting || 0,
      combat: crewMember.combat || 0,
      social: crewMember.social || 0
    }
    
    return Object.keys(skills).reduce((a, b) => skills[a] > skills[b] ? a : b)
  }

  // Utility method to batch generate narratives for UI components
  async generateUITooltips(gameState) {
    const tooltips = {}
    
    // Crew tooltips
    if (gameState.crew) {
      tooltips.crew = {}
      for (const member of gameState.crew) {
        tooltips.crew[member.id] = await this.generateCrewHiringNarrative(member)
      }
    }
    
    // Market tooltips
    if (gameState.marketChanges) {
      tooltips.market = {}
      for (const change of gameState.marketChanges) {
        tooltips.market[change.resourceName] = await this.generateMarketNarrative(change)
      }
    }
    
    return tooltips
  }
}

export default MicroNarrativeGenerator