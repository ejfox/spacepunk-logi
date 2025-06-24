import { GOSSIP_ARCHETYPES, CorporateHumorizer, GossipMutationEngine } from './GossipArchetypes.js'
import { gameRandom } from '../utils/seededRandom.js'

/**
 * Gossip Narrative Generator
 * 
 * Integrates with LLM systems to generate contextual gossip content
 * while maintaining fallback templates and corporate humor tone.
 */

export class GossipNarrativeGenerator {
  constructor(llmProvider = null) {
    this.llmProvider = llmProvider
    this.fallbackMode = !llmProvider
  }

  /**
   * Generate initial gossip content for a specific archetype
   */
  async generateInitialGossip(archetype, context = {}) {
    const archetypeData = GOSSIP_ARCHETYPES[archetype]
    if (!archetypeData) {
      throw new Error(`Unknown gossip archetype: ${archetype}`)
    }

    // Try LLM generation first
    if (this.llmProvider && !this.fallbackMode) {
      try {
        const llmContent = await this.generateWithLLM(archetypeData.llmPrompts.initial, context)
        if (llmContent) {
          return {
            content: llmContent,
            source: 'llm',
            archetype,
            phase: archetypeData.phases[0],
            context
          }
        }
      } catch (error) {
        console.warn('LLM generation failed, falling back to templates:', error.message)
      }
    }

    // Fallback to template generation
    return this.generateFromTemplate(archetypeData.template.initial, context, archetype)
  }

  /**
   * Generate gossip for phase progression
   */
  async generatePhaseProgression(gossipId, newPhase, context = {}) {
    const archetype = context.archetype
    const archetypeData = GOSSIP_ARCHETYPES[archetype]
    
    if (this.llmProvider && !this.fallbackMode) {
      try {
        const promptTemplate = archetypeData.llmPrompts.phase_progression
        const contextWithPhase = { ...context, phase: newPhase }
        const llmContent = await this.generateWithLLM(promptTemplate, contextWithPhase)
        
        if (llmContent) {
          return {
            content: llmContent,
            source: 'llm',
            phase: newPhase,
            context: contextWithPhase
          }
        }
      } catch (error) {
        console.warn('LLM phase progression failed, using template:', error.message)
      }
    }

    // Fallback to phase-based template
    return this.generatePhaseTemplate(archetype, newPhase, context)
  }

  /**
   * Generate mutation content
   */
  async generateMutation(originalGossip, mutationType, context = {}) {
    const archetype = originalGossip.archetype || context.archetype
    
    if (this.llmProvider && !this.fallbackMode) {
      try {
        const mutationPrompt = this.buildMutationPrompt(archetype, mutationType, context)
        const llmContent = await this.generateWithLLM(mutationPrompt, context)
        
        if (llmContent) {
          return {
            content: llmContent,
            source: 'llm',
            mutationType,
            context
          }
        }
      } catch (error) {
        console.warn('LLM mutation failed, using template:', error.message)
      }
    }

    // Fallback to mutation engine
    return GossipMutationEngine.generateMutation(originalGossip, mutationType, context)
  }

  /**
   * Generate confrontation/resolution dialogue
   */
  async generateConfrontation(gossipData, context = {}) {
    const archetype = gossipData.archetype
    const archetypeData = GOSSIP_ARCHETYPES[archetype]
    
    if (this.llmProvider && !this.fallbackMode && archetypeData.llmPrompts.confrontation) {
      try {
        const llmContent = await this.generateWithLLM(archetypeData.llmPrompts.confrontation, context)
        if (llmContent) {
          return {
            content: llmContent,
            source: 'llm',
            type: 'confrontation',
            context
          }
        }
      } catch (error) {
        console.warn('LLM confrontation failed, using template:', error.message)
      }
    }

    // Fallback to confrontation templates
    return this.generateConfrontationTemplate(archetype, context)
  }

  /**
   * Generate content using LLM with proper context
   */
  async generateWithLLM(promptTemplate, context = {}) {
    if (!this.llmProvider) {
      throw new Error('No LLM provider available')
    }

    // Build the prompt with context substitution
    const prompt = this.buildPromptWithContext(promptTemplate, context)
    
    // Add system context for consistent tone
    const systemPrompt = `You are generating workplace gossip for a dark comedy space simulation game. 
    Maintain a cynical, bureaucratic corporate tone. Treat extraordinary space events as mundane workplace issues.
    Use corporate euphemisms and HR-speak. Keep content between 40-120 words.
    Focus on specific, observable behaviors rather than speculation.`

    try {
      const response = await this.llmProvider.generateText(prompt, {
        systemPrompt,
        maxTokens: 150,
        temperature: 0.8,
        timeout: 10000
      })

      // Clean and validate response
      return this.validateLLMResponse(response)
    } catch (error) {
      console.error('LLM generation error:', error)
      throw error
    }
  }

  /**
   * Build prompt with context substitution
   */
  buildPromptWithContext(promptTemplate, context = {}) {
    let prompt = promptTemplate

    // Standard substitutions
    const substitutions = {
      '{subject}': context.subjectName || context.subject || 'the crew member',
      '{target}': context.targetName || context.target || 'another crew member',
      '{task}': context.task || this.getRandomTask(),
      '{faction}': context.faction || this.getRandomFaction(),
      '{phase}': context.phase || 'initial',
      '{location}': context.location || this.getRandomLocation(),
      '{department}': context.department || this.getRandomDepartment()
    }

    // Apply substitutions
    Object.entries(substitutions).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(key, 'g'), value)
    })

    // Add additional context if available
    if (context.recentEvents && context.recentEvents.length > 0) {
      prompt += `\n\nRecent ship events: ${context.recentEvents.slice(0, 3).join(', ')}`
    }

    if (context.relationships) {
      prompt += `\n\nCrew relationships: ${this.formatRelationshipContext(context.relationships)}`
    }

    return prompt
  }

  /**
   * Build mutation-specific prompt
   */
  buildMutationPrompt(archetype, mutationType, context) {
    const basePrompts = {
      exaggeration: `Take this gossip and make it more dramatic and exaggerated while maintaining corporate tone: "{originalContent}". Focus on escalating the severity and adding paranoid corporate concerns about productivity impact.`,
      
      diminishment: `Take this gossip and downplay it, making it seem less serious: "{originalContent}". Frame it as a minor HR concern that can be resolved through proper protocols.`,
      
      target_shift: `Modify this gossip to involve a different person: "{originalContent}". Change the target while keeping the same type of workplace drama. Maintain corporate language.`,
      
      content_drift: `Transform this gossip by changing what actually happened: "{originalContent}". Keep the same people but alter the specific incident. Use corporate euphemisms.`,
      
      corporate_spin: `Add more bureaucratic language and corporate policy references to this gossip: "{originalContent}". Include specific protocols, forms, and HR procedures.`,
      
      conspiracy: `Turn this gossip into a larger workplace conspiracy: "{originalContent}". Suggest broader implications while maintaining corporate paranoia tone.`
    }

    let prompt = basePrompts[mutationType] || basePrompts.exaggeration
    prompt = prompt.replace('{originalContent}', context.originalContent || 'workplace incident')
    
    return prompt
  }

  /**
   * Generate from template with corporate humor
   */
  generateFromTemplate(template, context, archetype) {
    let content = template
      .replace('[SUBJECT]', context.subjectName || 'crew member')
      .replace('[TARGET]', context.targetName || 'another crew member')
      .replace('[TASK/SYSTEM]', context.task || this.getRandomTask())
      .replace('[TOPIC/SITUATION]', context.topic || this.getRandomTopic())
      .replace('[FACTION/ORGANIZATION]', context.faction || this.getRandomFaction())

    // Add corporate humor
    const category = archetype.split('_')[0]
    content = CorporateHumorizer.corporatize(content, category)

    return {
      content,
      source: 'template',
      archetype,
      context
    }
  }

  /**
   * Generate phase-specific template content
   */
  generatePhaseTemplate(archetype, phase, context) {
    const phaseTemplates = {
      office_romance: {
        CRUSH: 'Initial attraction observed between {subject} and {target}. Monitoring interpersonal productivity metrics.',
        OBVIOUS: '{subject} and {target} showing clear workplace distraction. Break room utilization patterns abnormal.',
        CONFESSION: 'Emotional workplace disclosure reported between {subject} and {target}. HR notification pending.',
        RELATIONSHIP: 'Confirmed interpersonal relationship affecting department efficiency. Policy review required.',
        DRAMA: 'Relationship complications disrupting team productivity. Immediate intervention recommended.',
        RESOLUTION: 'Interpersonal situation resolved per Corporate Policy 847-B. Normal operations resumed.'
      },
      competence_crisis: {
        MISTAKES: '{subject} showing performance deviations in {task}. Quality assurance flags raised.',
        PATTERN: 'Recurring performance issues documented for {subject}. Skill assessment recommended.',
        COVERUP: '{subject} attempting to conceal performance gaps. Transparency protocols violated.',
        EXPOSURE: 'Performance issues fully documented. Formal review process initiated.',
        INTERVENTION: 'Mandatory skill enhancement program assigned to {subject}. Productivity optimization required.',
        OUTCOME: 'Performance review completed. {subject} reassigned per optimization protocols.'
      }
    }

    const templates = phaseTemplates[archetype] || phaseTemplates.office_romance
    let content = templates[phase] || templates[Object.keys(templates)[0]]

    // Apply context substitutions
    content = this.buildPromptWithContext(content, context)

    return {
      content,
      source: 'phase_template',
      phase,
      archetype,
      context
    }
  }

  /**
   * Generate confrontation template
   */
  generateConfrontationTemplate(archetype, context) {
    const confrontationTemplates = {
      office_romance: `Management meeting scheduled to address workplace relationship between {subject} and {target}. 
      Policy compliance review required. Personal relationships affecting operational efficiency metrics.
      Immediate behavioral modification or departmental reassignment recommended.`,
      
      competence_crisis: `Formal performance review initiated for {subject}. Quality standards not met for {task}.
      Mandatory skill verification testing scheduled. Productivity improvement plan required.
      Failure to meet benchmarks may result in role reassignment per Corporate Guidelines.`,
      
      secret_past: `Security clearance review triggered for {subject}. Background verification discrepancies noted.
      Full personnel audit required. All previous work assignments under review.
      Temporary access restrictions implemented pending investigation completion.`
    }

    let content = confrontationTemplates[archetype] || confrontationTemplates.office_romance
    content = this.buildPromptWithContext(content, context)

    return {
      content,
      source: 'confrontation_template',
      type: 'confrontation',
      context
    }
  }

  /**
   * Validate and clean LLM response
   */
  validateLLMResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid LLM response')
    }

    // Clean the response
    let cleaned = response.trim()
    
    // Remove quotes if wrapped
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1)
    }

    // Check length constraints
    if (cleaned.length < 20) {
      throw new Error('LLM response too short')
    }
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500) + '...'
    }

    return cleaned
  }

  /**
   * Format relationship context for LLM
   */
  formatRelationshipContext(relationships) {
    return relationships
      .slice(0, 3) // Limit to most relevant relationships
      .map(rel => `${rel.source} ${rel.value > 60 ? 'likes' : rel.value < 40 ? 'dislikes' : 'neutral to'} ${rel.target}`)
      .join(', ')
  }

  /**
   * Helper methods for random context
   */
  getRandomTask() {
    return gameRandom.chance.pickone([
      'reactor calibration', 'navigation systems', 'life support maintenance',
      'cargo bay operations', 'communications array', 'waste recycling',
      'atmospheric controls', 'power distribution', 'sensor arrays',
      'docking procedures', 'emergency protocols', 'inventory management'
    ])
  }

  getRandomFaction() {
    return gameRandom.chance.pickone([
      'Mars Corporate Alliance', 'Belter Mining Collective', 'Earth Defense Force',
      'Outer Rim Traders', 'Agricultural Consortium', 'Independent Spacers Union',
      'Titan Research Institute', 'Europa Free Port Authority'
    ])
  }

  getRandomLocation() {
    return gameRandom.chance.pickone([
      'cargo bay', 'engine room', 'break area', 'maintenance tunnel',
      'observation deck', 'medical bay', 'crew quarters', 'bridge',
      'storage compartment', 'workshop', 'recreation area', 'kitchen'
    ])
  }

  getRandomDepartment() {
    return gameRandom.chance.pickone([
      'Engineering', 'Navigation', 'Operations', 'Security',
      'Medical', 'Communications', 'Logistics', 'Maintenance'
    ])
  }

  getRandomTopic() {
    return gameRandom.chance.pickone([
      'family communications', 'medical appointments', 'personal history',
      'previous employment', 'financial status', 'recreational activities',
      'sleep patterns', 'dietary restrictions', 'training background'
    ])
  }

  /**
   * Set LLM provider (for when flexible LLM system is implemented)
   */
  setLLMProvider(provider) {
    this.llmProvider = provider
    this.fallbackMode = !provider
  }

  /**
   * Enable/disable fallback mode
   */
  setFallbackMode(enabled) {
    this.fallbackMode = enabled
  }
}

export default GossipNarrativeGenerator