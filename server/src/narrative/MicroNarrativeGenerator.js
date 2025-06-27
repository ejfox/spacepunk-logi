import Chance from 'chance'
import MissionGenerator from '../missions/MissionGenerator.js'
import { LLMQueue } from '../utils/LLMQueue.js'

export class MicroNarrativeGenerator {
  constructor(seed = 'spacepunk-micro-narrative') {
    this.chance = new Chance(seed)
    this.missionGenerator = new MissionGenerator()
    
    // Initialize LLM queue with conservative rate limits
    this.llmQueue = new LLMQueue({
      requestsPerMinute: 25, // Conservative OpenRouter limit
      maxRetries: 3,
      retryDelay: 1000
    })
    
    // Set up queue event logging
    this.setupQueueLogging()
  }

  setupQueueLogging() {
    this.llmQueue.on('queued', ({ id, queueLength, priority }) => {
      console.log(`📝 LLM request queued: ${id} (${priority}) - Queue: ${queueLength}`)
    })
    
    this.llmQueue.on('processing', ({ id, attempt, queuedFor }) => {
      console.log(`🤖 Processing LLM request: ${id} (attempt ${attempt}, queued ${queuedFor}ms)`)
    })
    
    this.llmQueue.on('completed', ({ id, responseTime, attempts }) => {
      console.log(`✅ LLM request completed: ${id} in ${responseTime}ms (${attempts} attempts)`)
    })
    
    this.llmQueue.on('error', ({ id, error, attempt }) => {
      console.log(`❌ LLM request failed: ${id} - ${error} (attempt ${attempt})`)
    })
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

  // ============ ATOMIC CREW NARRATIVE SYSTEM ============
  
  // Core atomic building blocks
  statLevels = {
    health: [[90, 'EXCELLENT'], [70, 'GOOD'], [50, 'ACCEPTABLE'], [30, 'CONCERNING'], [0, 'CRITICAL']],
    morale: [[80, 'HIGHLY MOTIVATED'], [60, 'SATISFIED'], [40, 'ADEQUATE'], [20, 'DISENGAGED'], [0, 'SEVERELY UNMOTIVATED']],
    stress: [[80, 'CRITICAL STRESS'], [60, 'HIGH PRESSURE'], [40, 'ELEVATED TENSION'], [20, 'MODERATE STRESS'], [0, 'MINIMAL STRESS']],
    skill: [[90, 'EXPERT'], [70, 'PROFICIENT'], [50, 'COMPETENT'], [30, 'DEVELOPING'], [0, 'NOVICE']],
    performance: [[85, 'EXCEEDS EXPECTATIONS'], [70, 'MEETS EXPECTATIONS'], [55, 'SATISFACTORY'], [40, 'NEEDS IMPROVEMENT'], [0, 'BELOW STANDARDS']]
  }

  // Atomic narrative generator - pure LLM only
  async generateCrewNarrative(crewMember, type, context = {}, priority = 'normal') {
    const ctx = this.buildCrewContext(crewMember, context)
    const prompt = this.buildPrompt(type, ctx)
    
    // Let queue manager handle retries, return null if it ultimately fails
    return await this.llmQueue.enqueue(() => this.callMicroLLM(prompt), priority)
  }

  // Batch crew narrative generation - pure LLM only
  async batchGenerateCrewNarratives(crewMember, types = ['description', 'health', 'morale', 'stress', 'skill', 'trait'], priority = 'normal') {
    const ctx = this.buildCrewContext(crewMember)
    
    const llmFunctions = types.map(type => () => this.callMicroLLM(this.buildPrompt(type, ctx)))
    const results = await this.llmQueue.batchEnqueue(llmFunctions, priority)
    
    // Map results back to types - nulls are fine, UI deals with it
    const narratives = {}
    types.forEach((type, index) => {
      narratives[type] = results[index] // null if LLM failed, that's life
    })
    
    return narratives
  }

  // Generate system/ambient narratives - pure LLM only
  async generateSystemNarrative(type, context = {}, priority = 'low') {
    const systemPrompts = {
      station_announcement: `Generate a 1-sentence station announcement for ${context.station || 'a space station'} that sounds like corporate PA system but reveals weird space logistics. Example: "Attention personnel: Temporal displacement incident at docking bay 7 has been resolved and all crew members reported to correct timeline per safety protocols."`,
      
      corporate_memo: `Write a 1-sentence corporate memo from ${context.department || 'Management'} that treats cosmic horror as routine business operations. Example: "Reminder: All reality-anchor equipment must be calibrated weekly following recent interdimensional shipping manifest errors and associated staff disappearances."`,
      
      market_analysis: `Generate a 1-sentence market analysis treating space trading as normal business that accidentally reveals insane cargo types. Example: "Market volatility for sentient crystals remains ${context.trend || 'stable'} following successful negotiations with asteroid-based consciousness networks and routine piracy insurance claims."`,
      
      safety_bulletin: `Write a 1-sentence safety bulletin about ${context.incident || 'workplace hazards'} that makes cosmic dangers sound like OSHA violations. Example: "Safety reminder: All crew must wear reality-anchor harnesses when handling cargo manifests from alternate dimensions per corporate liability insurance requirements."`
    }
    
    const prompt = systemPrompts[type] || `Generate a 1-sentence corporate narrative about ${type} treating space weirdness as normal business operations.`
    
    // Pure LLM or nothing
    return await this.llmQueue.enqueue(() => this.callMicroLLM(prompt), priority)
  }

  // Get queue statistics for monitoring
  getQueueStats() {
    return this.llmQueue.getStats()
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
}