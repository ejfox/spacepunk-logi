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
        "Cost center update: {amount} CR expended per quarterly fiscal guidelines",
        "Payment processing: {amount} CR transferred through corporate financial networks"
      ],

      // COMPREHENSIVE CREW NARRATIVE TEMPLATES
      crew_description: [
        "Employee {name} demonstrates exceptional competency in {role} operations despite documented paranoia regarding interdimensional shipping manifests and recurring nightmares about vacuum exposure incidents.",
        "Personnel file #{id}: {name} maintains productivity standards with minimal psychotic episodes and acceptable levels of radiation-induced mutation following {experience} hours of deep space logistics operations.",
        "HR Assessment: {name} exhibits professional {role} qualifications including successful completion of corporate anger management protocols and basic reality-anchor certification.",
        "Staff Directory: Level {level} {name} cleared for operational deployment despite ongoing existential crisis and three documented temporal paradox incidents during routine cargo transfers."
      ],

      crew_health_status: [
        "Medical Assessment: {name}'s cybernetic implants show minimal rejection symptoms and cosmic radiation scarring remains within acceptable disfigurement parameters for {status} operational status.",
        "Health Screening: Employee {name} demonstrates {status} physiological integrity despite recurring void-whisper hallucinations and three documented cases of temporal displacement syndrome.",
        "Occupational Wellness: {name} cleared for {status} duty classification following successful treatment for interdimensional parasite exposure and reality-anchor recalibration procedures.",
        "Corporate Medical: {name} maintains {status} fitness standards with acceptable levels of mutation and psychological fracturing from prolonged exposure to quantum shipping calculations."
      ],

      crew_morale_assessment: [
        "Employee Satisfaction: {name} reports {level} job satisfaction despite recurring nightmares about deceased crew members and ongoing existential dread regarding time-dilated family aging rates.",
        "Psychological Profile: {name} exhibits {level} workplace motivation while successfully managing survivor guilt from fourteen previous shipping disasters and chronic anxiety regarding cargo manifest anomalies.",
        "Morale Evaluation: {name} demonstrates {level} engagement with corporate values despite documented cases of reality dissociation and periodic episodes involving conversation with sentient asteroid mining equipment.",
        "Workplace Assessment: {name} maintains {level} productivity enthusiasm ratings while coping with mild space madness and recurring visions of alternate timeline catastrophes."
      ],

      crew_stress_analysis: [
        "Stress Management: {name} operates at {level} psychological pressure tolerance despite ongoing trauma from black hole proximity negotiations and chronic insomnia caused by interdimensional shipping schedules.",
        "Mental Health Alert: {name} experiencing {level} occupational stress indicators including reality dissociation episodes and documented attempts to communicate with deceased navigation systems.",
        "Wellness Assessment: {name} managing {level} operational demand coefficients while successfully containing psychological breakdown symptoms and maintaining basic reality-anchor functionality.",
        "Psychological Monitoring: {name} exhibits {level} stress response patterns following exposure to cosmic horror entities and routine filing of insurance claims for dimension-based cargo damage."
      ],

      crew_skill_evaluation: [
        "Technical Competency: {name} demonstrates {level} {skill} proficiency including successful negotiation with sentient machinery and documented expertise in reality-storm equipment repair protocols.",
        "Skills Assessment: {name}'s {level} {skill} capabilities include specialized training in interdimensional pirate conflict resolution and advanced certification in temporal paradox incident management.",
        "Professional Review: {name} maintains {level} certification in {skill} operations with documented success in black hole proximity shipping and expertise in cargo manifest discrepancy resolution procedures.",
        "Competency Analysis: {name} achieved {level} mastery of {skill} protocols including advanced training in void-exposure survival techniques and successful completion of sentient asteroid negotiation seminars."
      ],

      crew_trait_analysis: [
        "Behavioral Assessment: {name}'s '{trait}' characteristics translate effectively to space logistics operations including improved performance during reality storms and enhanced compatibility with malfunctioning AI systems.",
        "Personality Review: Employee {name}'s '{trait}' traits provide valuable workplace advantages including resistance to cosmic horror-induced madness and natural aptitude for interdimensional cargo handling.",
        "Character Evaluation: {name}'s '{trait}' disposition proves beneficial for corporate objectives including successful mediation of crew conflicts during temporal displacement incidents and effective communication with hostile alien customs officials.",
        "Psychological Profile: {name}'s '{trait}' behavioral patterns enhance operational efficiency including demonstrated ability to maintain sanity during reality-bending shipping emergencies and natural talent for explosive problem-solving in pirate encounter scenarios."
      ],

      crew_assignment_update: [
        "Duty Roster Update: {name} reassigned to {task} per operational requirements",
        "Work Order Assignment: Employee {name} allocated to {task} responsibilities",
        "Task Distribution: {name} designated for {task} completion per workflow optimization",
        "Resource Allocation: {name} deployed to {task} duties following efficiency analysis"
      ],

      crew_experience_gain: [
        "Professional Development: {name} accumulated additional {amount} experience units in {skill}",
        "Learning Metrics: Employee {name} achieved {amount} competency points through field operations",
        "Skill Enhancement: {name} logged {amount} training hours advancing {skill} proficiency",
        "Career Progression: {name} earned {amount} experience credits toward next certification level"
      ],

      crew_level_promotion: [
        "Advancement Notice: {name} promoted to Level {level} {role} effective immediately",
        "Career Ladder Update: Employee {name} elevated to {level} classification per performance review",
        "Promotion Authorization: {name} approved for Level {level} responsibilities and compensation",
        "Rank Progression: {name} advanced to {level} status following competency evaluation"
      ],

      crew_hiring_cost: [
        "Recruitment Expense: {name} onboarding processed at {cost} CR total acquisition cost",
        "Human Capital Investment: {cost} CR allocated for {name}'s integration into corporate structure",
        "Personnel Acquisition: {name} recruitment finalized with {cost} CR budgetary allocation",
        "Staffing Cost Analysis: {name} hiring represents {cost} CR human resources expenditure"
      ],

      crew_background_lore: [
        "Personnel Origin: {name} transferred from {background} sector with applicable skill transferability",
        "Employment History: {name}'s {background} experience provides relevant operational context",
        "Cultural Integration: {name}'s {background} heritage offers valuable perspective for team dynamics",
        "Background Verification: {name} originates from {background} region with standard corporate clearance"
      ],

      crew_relationship_dynamics: [
        "Interpersonal Assessment: {name} maintains {relationship} working relationships with crew members",
        "Team Integration Report: {name} demonstrates {relationship} collaborative effectiveness",
        "Social Dynamic Analysis: {name} exhibits {relationship} interaction patterns with colleagues",
        "Workplace Harmony Index: {name} contributes {relationship} social cohesion to team environment"
      ],

      crew_performance_review: [
        "Quarterly Evaluation: {name} achieved {rating} performance metrics across all operational categories",
        "Employee Assessment: {name} demonstrates {rating} competency levels per corporate standards",
        "Performance Analysis: {name} maintains {rating} productivity output within acceptable ranges",
        "Efficiency Rating: {name} operates at {rating} effectiveness compared to departmental averages"
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

  async callMicroLLM(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.missionGenerator.callLLM([
          {
            role: "system",
            content: `You are a cynical corporate AI writing employee reports for a space logistics company. Your job is to make cosmic horror and dangerous space adventures sound like boring office work, while accidentally revealing how unhinged and badass these people actually are.

CRITICAL: Respond with ONLY valid JSON in this exact format: {"text": "your one sentence here"}

TONE: Bureaucratic, passive-aggressive corporate HR language that treats interdimensional pirates as "external compliance issues" and reality-bending technology as "productivity tools."

RULES:
- Return ONLY valid JSON: {"text": "sentence"}
- Exactly 1 sentence in the "text" field
- Make space weirdness sound like normal business operations  
- Accidentally reveal cool backstories through corporate euphemisms
- Treat terrifying cosmic events as workplace incidents
- Include specific technical details that hint at wild space adventures
- Sound like HR desperately trying to make insane shit seem professional

EXAMPLE RESPONSES:
{"text": "Employee Rodriguez's third cybernetic arm shows minimal rejection symptoms and maintains productivity standards despite recurring void-whisper hallucinations."}
{"text": "Medical assessment confirms Kim's radiation scarring remains within acceptable disfigurement parameters following successful black hole proximity shipping negotiations."}
{"text": "Performance review indicates excellent workplace productivity despite three documented temporal paradox incidents and ongoing existential crisis regarding family aging rates."}`
          },
          {
            role: "user", 
            content: prompt
          }
        ])
        
        // Try to parse JSON response
        try {
          const parsed = JSON.parse(response.trim())
          if (parsed.text && typeof parsed.text === 'string') {
            return parsed.text
          }
        } catch (parseError) {
          console.warn(`Attempt ${attempt}: Invalid JSON from LLM:`, response)
          if (attempt === maxRetries) {
            // Last attempt - try to extract text manually
            const textMatch = response.match(/"text"\s*:\s*"([^"]+)"/)
            return textMatch ? textMatch[1] : null
          }
        }
      } catch (error) {
        console.error(`LLM call attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) return null
      }
    }
    return null
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

  // ============ ATOMIC CREW NARRATIVE SYSTEM ============
  
  // Core atomic building blocks
  statLevels = {
    health: [[90, 'EXCELLENT'], [70, 'GOOD'], [50, 'ACCEPTABLE'], [30, 'CONCERNING'], [0, 'CRITICAL']],
    morale: [[80, 'HIGHLY MOTIVATED'], [60, 'SATISFIED'], [40, 'ADEQUATE'], [20, 'DISENGAGED'], [0, 'SEVERELY UNMOTIVATED']],
    stress: [[80, 'CRITICAL STRESS'], [60, 'HIGH PRESSURE'], [40, 'ELEVATED TENSION'], [20, 'MODERATE STRESS'], [0, 'MINIMAL STRESS']],
    skill: [[90, 'EXPERT'], [70, 'PROFICIENT'], [50, 'COMPETENT'], [30, 'DEVELOPING'], [0, 'NOVICE']],
    performance: [[85, 'EXCEEDS EXPECTATIONS'], [70, 'MEETS EXPECTATIONS'], [55, 'SATISFACTORY'], [40, 'NEEDS IMPROVEMENT'], [0, 'BELOW STANDARDS']]
  }

  // Atomic narrative generator
  async generateCrewNarrative(crewMember, type, context = {}) {
    const ctx = this.buildCrewContext(crewMember, context)
    const prompt = this.buildPrompt(type, ctx)
    
    try {
      return await this.callMicroLLM(prompt) || this.generateFallbackNarrative(`crew_${type}`, ctx)
    } catch (error) {
      return this.generateFallbackNarrative(`crew_${type}`, ctx)
    }
  }

  // Context builder - atomically extracts all crew data
  buildCrewContext(crewMember, additional = {}) {
    const skills = this.extractSkills(crewMember)
    const performance = this.calculatePerformance(crewMember)
    return {
      name: crewMember.name || 'Employee',
      id: crewMember.id?.slice(0, 8) || 'UNKNOWN',
      role: crewMember.role || 'Specialist',
      level: crewMember.level || 1,
      experience: crewMember.experience || 0,
      health: crewMember.health || 100,
      morale: crewMember.morale || 50,
      stress: crewMember.stress || 0,
      traits: crewMember.traits || [],
      task: crewMember.currentTask || 'General Operations',
      background: crewMember.cultural_background || crewMember.homeworld || 'Corporate Sector',
      topSkill: this.getTopSkill(skills),
      skillLevel: this.levelFor('skill', Math.max(...Object.values(skills))),
      healthLevel: this.levelFor('health', crewMember.health || 100),
      moraleLevel: this.levelFor('morale', crewMember.morale || 50),
      stressLevel: this.levelFor('stress', crewMember.stress || 0),
      performance,
      performanceLevel: this.levelFor('performance', performance),
      ...additional
    }
  }

  // SICK WORLDBUILDING PROMPTS - Each stat becomes a mini-story
  buildPrompt(type, ctx) {
    const prompts = {
      description: `Write a 1-sentence corporate personnel file for ${ctx.name} (${ctx.role}, Level ${ctx.level}) that reveals their personality through bureaucratic language. Include: their weird ${ctx.traits.join('/')} traits treated as "professional qualifications", their ${ctx.experience} hours logged as "operational experience", and hint at their ${ctx.background} origins as if it's a previous corporate assignment. Make it sound like HR trying to be professional about someone totally unhinged. Example: "Employee Chen demonstrates exceptional wrench-throwing accuracy and caffeine dependency levels optimal for reactor maintenance, with previous experience in Mars Industrial anger management protocols."`,

      health: `Write 1 sentence explaining ${ctx.name}'s ${ctx.health}% health (${ctx.healthLevel}) as a corporate medical report that accidentally reveals cool space injuries or augmentations. Treat cosmic radiation burns as "workplace exposure incidents" and cybernetic implants as "productivity enhancement devices". Example: "Medical review confirms Rodriguez's third arm installation shows minimal rejection symptoms and vacuum exposure scarring remains within acceptable disfigurement parameters."`,

      morale: `Write 1 sentence about ${ctx.name}'s ${ctx.morale}% morale (${ctx.moraleLevel}) that sounds like corporate HR but reveals their actual emotional state about space trucking. Include subtle hints about what really motivates or depresses them. Example: "Employee Morrison reports high job satisfaction despite recurring nightmares about interdimensional cargo manifests and deceased crew members from previous shipping accidents."`,

      stress: `Write 1 sentence describing ${ctx.name}'s ${ctx.stress}% stress (${ctx.stressLevel}) as a corporate wellness assessment that accidentally reveals the terrifying reality of space logistics. Example: "Stress evaluation indicates Park maintains operational effectiveness despite ongoing existential dread regarding quantum shipping calculations and time-dilated family aging."`,

      skill: `Write 1 sentence about ${ctx.name}'s ${ctx.skillLevel} ${ctx.topSkill} abilities that makes their space expertise sound like mundane office skills but hints at crazy shit they can actually do. Example: "Technical assessment confirms Kim's 'filing system organization' includes successful navigation through 47 different dimensional sectors and filing insurance claims for reality-based cargo damage."`,

      trait: `Write 1 sentence analyzing ${ctx.name}'s "${ctx.trait || ctx.traits[0] || 'Professional'}" trait as corporate personality assessment that makes their weird space-person quirk sound like a valuable business skill. Example: "Behavioral analysis indicates Johnson's 'tendency toward explosive problem-solving' translates effectively to pirate negotiation scenarios and asteroid demolition contracts."`,

      assignment: `Write 1 sentence about ${ctx.name} being assigned to "${ctx.task}" that sounds like boring office work but is obviously dangerous space shit. Example: "Resource allocation assigns Martinez to 'routine paperwork filing' involving black hole proximity reports and smuggling manifest discrepancy resolution in hostile territory."`,

      cost: `Write 1 sentence justifying hiring ${ctx.name} for ${ctx.cost || 1000} CR that sounds like normal recruitment costs but hints at their dangerous background or rare skills. Example: "Acquisition cost of 2500 CR for Torres reflects standard hazard pay rates for personnel with experience in medical treatment during reality storms and interdimensional parasite removal."`,

      background: `Write 1 sentence about ${ctx.name} being from ${ctx.background} that makes their homeworld/culture sound like a previous corporate posting but reveals cool space lore. Example: "Previous assignment in Mars Industrial Complex provided Chen with valuable experience in low-gravity welding, corporate union disputes, and traditional Martian blood-ritual conflict resolution."`,

      performance: `Write 1 sentence quarterly review for ${ctx.name} (${ctx.performanceLevel}) that sounds like normal employee evaluation but accidentally reveals their badass space adventures. Example: "Performance metrics indicate excellent workplace productivity despite three documented temporal paradox incidents and one successful negotiation with sentient asteroid mining equipment."`
    }
    return prompts[type] || `Write a 1-sentence corporate assessment of ${ctx.name}'s ${type} that treats space weirdness as normal business operations.`
  }

  // Utility methods
  extractSkills(crew) { return Object.fromEntries(['engineering', 'piloting', 'combat', 'social', 'medical', 'science'].map(s => [s, crew[s] || crew.skills?.[s] || 0])) }
  getTopSkill(skills) { return Object.keys(skills).reduce((a, b) => skills[a] > skills[b] ? a : b) }
  levelFor(type, value) { return this.statLevels[type]?.find(([threshold]) => value >= threshold)?.[1] || 'UNKNOWN' }
  calculatePerformance(crew) { return Math.max(0, Math.min(100, ((crew.morale || 50) + (crew.health || 100) - (crew.stress || 0)) / 2)) }

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