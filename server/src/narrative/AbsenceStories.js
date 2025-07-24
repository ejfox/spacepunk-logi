import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { LLMQueue } from '../utils/LLMQueue.js';

class AbsenceStories extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      model: config.model || 'anthropic/claude-3-haiku',
      maxTokens: config.maxTokens || 1500,
      temperature: config.temperature || 0.9,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    // TEMPORARILY DISABLED - prioritizing user dialog
    this.llmQueue = new LLMQueue({
      requestsPerMinute: 1, // Nearly disabled - user comes first!
      maxRetries: 1,
      retryDelay: 20000 // Very slow background generation
    })
    
    // Set up queue event logging
    this.setupQueueLogging()
    
    this.storyTypes = [
      'crew_development', 'market_observation', 'system_maintenance',
      'crew_interaction', 'unexpected_event', 'routine_operations',
      'technical_incident', 'social_dynamics', 'resource_management'
    ];
    
    this.narrativeTemplates = this.initializeTemplates();
  }

  setupQueueLogging() {
    this.llmQueue.on('queued', ({ id, queueLength, priority }) => {
      console.log(`📖 Ship log LLM request queued: ${id} (${priority}) - Queue: ${queueLength}`)
    })
    
    this.llmQueue.on('processing', ({ id, attempt, queuedFor }) => {
      console.log(`🤖 Processing ship log LLM request: ${id} (attempt ${attempt}, queued ${queuedFor}ms)`)
    })
    
    this.llmQueue.on('completed', ({ id, responseTime, attempts }) => {
      console.log(`✅ Ship log LLM request completed: ${id} in ${responseTime}ms (${attempts} attempts)`)
    })
    
    this.llmQueue.on('error', ({ id, error, attempt }) => {
      console.log(`❌ Ship log LLM request failed: ${id} - ${error} (attempt ${attempt})`)
    })
  }

  async generateAbsenceStory(context = {}) {
    try {
      const {
        playerId,
        shipId,
        absenceDuration, // in hours
        crewActivities = [],
        marketChanges = [],
        missionProgress = [],
        systemEvents = [],
        lastLogin,
        currentLogin = new Date()
      } = context;

      // Determine story complexity based on absence duration
      const storyComplexity = this.getStoryComplexity(absenceDuration);
      
      // Build narrative context from game data
      const narrativeContext = await this.buildNarrativeContext({
        crewActivities,
        marketChanges,
        missionProgress,
        systemEvents,
        absenceDuration,
        storyComplexity
      });

      // Generate story using LLM through queue
      const story = await this.llmQueue.enqueue(
        () => this.generateLLMStoryDirect(narrativeContext),
        'normal' // Normal priority for ship logs
      );
      
      // Enhance with Spacepunk flavor
      const enhancedStory = this.addSpacepunkFlavor(story, narrativeContext);
      
      const logEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        playerId,
        shipId,
        generatedAt: currentLogin,
        absencePeriod: {
          start: lastLogin,
          end: currentLogin,
          durationHours: absenceDuration
        },
        story: enhancedStory,
        context: narrativeContext,
        complexity: storyComplexity,
        generatedBy: 'llm'
      };

      this.emit('storyGenerated', logEntry);
      return logEntry;
      
    } catch (error) {
      console.error('Story generation failed:', error);
      return this.generateFallbackStory(context);
    }
  }

  getStoryComplexity(absenceDuration) {
    if (absenceDuration < 2) return 'brief';
    if (absenceDuration < 8) return 'short';
    if (absenceDuration < 24) return 'medium';
    if (absenceDuration < 72) return 'long';
    return 'epic';
  }

  async buildNarrativeContext(data) {
    const {
      crewActivities,
      marketChanges,
      missionProgress,
      systemEvents,
      absenceDuration,
      storyComplexity
    } = data;

    // Process crew training completions and skill improvements
    const crewDevelopments = crewActivities
      .filter(activity => activity.type === 'training_completed')
      .map(activity => ({
        crewMember: activity.crewMember,
        skillImproved: activity.skill,
        improvement: activity.improvement,
        trainingType: activity.trainingType,
        personalityTraits: activity.traits || []
      }));

    // Process significant market events
    const marketEvents = marketChanges
      .filter(change => Math.abs(change.priceChange) > 15)
      .map(change => ({
        resource: change.resourceName,
        station: change.stationName,
        priceChange: change.priceChange,
        impact: change.priceChange > 0 ? 'surge' : 'crash',
        cause: change.marketEvent || 'unknown factors'
      }));

    // Process mission completions and failures
    const missionOutcomes = missionProgress.map(mission => ({
      title: mission.title,
      outcome: mission.status,
      rewards: mission.rewards,
      complications: mission.complications || []
    }));

    // Process system events (maintenance, repairs, etc.)
    const systemActivity = systemEvents.map(event => ({
      type: event.type,
      component: event.component,
      outcome: event.outcome,
      impact: event.impact
    }));

    return {
      absenceDuration,
      storyComplexity,
      crewDevelopments,
      marketEvents,
      missionOutcomes,
      systemActivity,
      totalEvents: crewDevelopments.length + marketEvents.length + missionOutcomes.length + systemActivity.length
    };
  }

  async generateLLMStoryDirect(context) {
    if (!this.config.apiKey) {
      throw new Error('No API key configured for story generation');
    }

    const prompt = this.buildStoryPrompt(context);
    
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://spacepunk-logi.com',
          'X-Title': 'Spacepunk Logistics'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: prompt.messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('LLM story generation failed:', error);
      throw error;
    }
  }

  // Public generateLLMStory method that uses the queue
  async generateLLMStory(context) {
    return await this.llmQueue.enqueue(
      () => this.generateLLMStoryDirect(context),
      'normal'
    )
  }

  // Get queue statistics for monitoring
  getQueueStats() {
    return this.llmQueue.getStats()
  }

  buildStoryPrompt(context) {
    const systemPrompt = `You are the ship's computer AI for Spacepunk Logistics, generating captain's log entries. 

CRITICAL STYLE REQUIREMENTS:
- Write in the tone of a cynical, bureaucratic space trucking operation
- Treat cosmic events with mundane corporate language
- Use passive-aggressive undertones and corporate jargon
- Make epic space adventures sound like tedious office work
- Include specific technical details and crew member names
- Reference forms, permits, and bureaucratic obstacles
- End with darkly humorous observations about space logistics

STRUCTURE:
- Start with "CAPTAIN'S LOG - AUTOMATED SUMMARY"
- Include timestamp and absence duration
- Describe events in chronological order
- Focus on crew development, market conditions, and operational status
- End with a cynical observation about space trucking life

TONE EXAMPLES:
- "Chen's engineering training resulted in 15% efficiency gains. Forms 27-B through 27-D filed accordingly."
- "Market volatility in luxury goods sector attributed to 'unknown market forces' (probably pirates again)."
- "Reactor maintenance completed without major explosions. A good day by corporate standards."`;

    const contextPrompt = this.buildContextPrompt(context);

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt }
      ]
    };
  }

  buildContextPrompt(context) {
    const {
      absenceDuration,
      storyComplexity,
      crewDevelopments,
      marketEvents,
      missionOutcomes,
      systemActivity
    } = context;

    let prompt = `Generate a ship's log entry covering ${absenceDuration} hours of operations.

CREW DEVELOPMENTS:`;
    
    if (crewDevelopments.length > 0) {
      crewDevelopments.forEach(dev => {
        prompt += `\n- ${dev.crewMember.name}: Completed ${dev.trainingType} training, ${dev.skillImproved} skill improved by ${dev.improvement} points`;
        if (dev.personalityTraits.length > 0) {
          prompt += ` (Personality: ${dev.personalityTraits.join(', ')})`;
        }
      });
    } else {
      prompt += '\n- No significant crew training events';
    }

    prompt += '\n\nMARKET CONDITIONS:';
    if (marketEvents.length > 0) {
      marketEvents.forEach(event => {
        prompt += `\n- ${event.resource} prices ${event.impact === 'surge' ? 'surged' : 'crashed'} ${Math.abs(event.priceChange)}% at ${event.station}`;
        if (event.cause !== 'unknown factors') {
          prompt += ` due to ${event.cause}`;
        }
      });
    } else {
      prompt += '\n- Markets remained stable (suspiciously so)';
    }

    prompt += '\n\nMISSION STATUS:';
    if (missionOutcomes.length > 0) {
      missionOutcomes.forEach(mission => {
        prompt += `\n- "${mission.title}": ${mission.outcome}`;
        if (mission.complications.length > 0) {
          prompt += ` (Complications: ${mission.complications.join(', ')})`;
        }
      });
    } else {
      prompt += '\n- No active missions during this period';
    }

    prompt += '\n\nSYSTEM OPERATIONS:';
    if (systemActivity.length > 0) {
      systemActivity.forEach(activity => {
        prompt += `\n- ${activity.type} on ${activity.component}: ${activity.outcome}`;
      });
    } else {
      prompt += '\n- All systems nominal (which is concerning)';
    }

    prompt += `\n\nGenerate a ${storyComplexity} complexity log entry that weaves these events into a cohesive narrative with Spacepunk's signature cynical corporate tone.`;

    return prompt;
  }

  addSpacepunkFlavor(story, context) {
    // Add extra bureaucratic flourishes
    const flavorElements = [
      '\n\n[Form 15-C: Captain Absence Report filed automatically]',
      '\n\n[Insurance claims pending review by Risk Management Department]',
      '\n\n[Next scheduled maintenance inspection: Overdue]',
      '\n\n[Corporate reminder: All crew must complete Workplace Safety Modules 1-47]',
      '\n\n[Note: Coffee machine still broken. Morale impact: Severe]'
    ];

    const randomFlavor = flavorElements[Math.floor(Math.random() * flavorElements.length)];
    
    // Add cynical footnotes based on events
    let footnote = '';
    if (context.crewDevelopments.length > 0) {
      footnote += '\n\n[HR Note: Crew development costs will be deducted from next quarter\'s profit sharing]';
    }
    if (context.marketEvents.length > 0) {
      footnote += '\n\n[Finance Note: Market volatility blamed on "external factors beyond corporate control"]';
    }

    return story + randomFlavor + footnote;
  }

  generateFallbackStory(context) {
    const {
      playerId,
      shipId,
      absenceDuration,
      crewActivities = [],
      marketChanges = [],
      lastLogin,
      currentLogin = new Date()
    } = context;

    const template = this.selectFallbackTemplate(absenceDuration);
    
    let story = template.opening;
    
    // Add crew activities
    if (crewActivities.length > 0) {
      story += '\n\nCREW ACTIVITIES:\n';
      crewActivities.forEach(activity => {
        story += `- ${activity.crewMember?.name || 'Unknown crew member'}: ${activity.description}\n`;
      });
    }

    // Add market summary
    if (marketChanges.length > 0) {
      story += '\nMARKET SUMMARY:\n';
      const significantChanges = marketChanges.filter(change => Math.abs(change.priceChange) > 10);
      if (significantChanges.length > 0) {
        significantChanges.forEach(change => {
          story += `- ${change.resourceName}: ${change.priceChange > 0 ? '+' : ''}${change.priceChange}%\n`;
        });
      } else {
        story += '- Markets remained suspiciously stable\n';
      }
    }

    story += template.closing;

    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      shipId,
      generatedAt: currentLogin,
      absencePeriod: {
        start: lastLogin,
        end: currentLogin,
        durationHours: absenceDuration
      },
      story,
      context: { fallback: true, absenceDuration },
      complexity: this.getStoryComplexity(absenceDuration),
      generatedBy: 'fallback_template'
    };
  }

  selectFallbackTemplate(absenceDuration) {
    if (absenceDuration < 2) {
      return this.narrativeTemplates.brief;
    } else if (absenceDuration < 8) {
      return this.narrativeTemplates.short;
    } else if (absenceDuration < 24) {
      return this.narrativeTemplates.medium;
    } else {
      return this.narrativeTemplates.long;
    }
  }

  initializeTemplates() {
    return {
      brief: {
        opening: 'CAPTAIN\'S LOG - AUTOMATED SUMMARY\nBrief operational period recorded. Standard procedures maintained.',
        closing: '\n\nAll systems nominal. Coffee machine still broken. Another thrilling day in the void.'
      },
      short: {
        opening: 'CAPTAIN\'S LOG - AUTOMATED SUMMARY\nShort-term operations completed according to corporate guidelines.',
        closing: '\n\nOperational efficiency within acceptable parameters. Insurance premiums remain catastrophically high.'
      },
      medium: {
        opening: 'CAPTAIN\'S LOG - AUTOMATED SUMMARY\nExtended operational period documented. Multiple bureaucratic forms generated.',
        closing: '\n\nAll required paperwork filed in triplicate. The void stares back, unimpressed by our productivity metrics.'
      },
      long: {
        opening: 'CAPTAIN\'S LOG - AUTOMATED SUMMARY\nLong-term operations concluded. Significant data for quarterly performance review.',
        closing: '\n\nCorporate will be pleased with efficiency ratings. Crew morale remains "adequate" according to HR metrics. The endless dance of space logistics continues.'
      }
    };
  }

  async generateCrewInteractionStory(crewMembers) {
    // Generate stories about crew interactions based on personality traits
    const interactions = [];
    
    for (let i = 0; i < crewMembers.length - 1; i++) {
      for (let j = i + 1; j < crewMembers.length; j++) {
        const crew1 = crewMembers[i];
        const crew2 = crewMembers[j];
        
        // Simple personality compatibility check
        const compatibility = this.calculatePersonalityCompatibility(crew1, crew2);
        
        if (Math.random() < 0.3) { // 30% chance of interaction
          interactions.push({
            participants: [crew1.name, crew2.name],
            type: compatibility > 0.5 ? 'positive' : 'negative',
            description: this.generateInteractionDescription(crew1, crew2, compatibility)
          });
        }
      }
    }
    
    return interactions;
  }

  calculatePersonalityCompatibility(crew1, crew2) {
    // Simple compatibility based on personality traits
    const traits1 = {
      bravery: crew1.trait_bravery || 50,
      loyalty: crew1.trait_loyalty || 50,
      ambition: crew1.trait_ambition || 50,
      workEthic: crew1.trait_work_ethic || 50
    };
    
    const traits2 = {
      bravery: crew2.trait_bravery || 50,
      loyalty: crew2.trait_loyalty || 50,
      ambition: crew2.trait_ambition || 50,
      workEthic: crew2.trait_work_ethic || 50
    };

    const differences = Object.keys(traits1).map(trait => 
      Math.abs(traits1[trait] - traits2[trait])
    );
    
    const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    return 1 - (avgDifference / 100); // Convert to compatibility score
  }

  generateInteractionDescription(crew1, crew2, compatibility) {
    if (compatibility > 0.7) {
      return `${crew1.name} and ${crew2.name} collaborated effectively on routine maintenance`;
    } else if (compatibility > 0.3) {
      return `${crew1.name} and ${crew2.name} had minor disagreements about optimal procedures`;
    } else {
      return `${crew1.name} and ${crew2.name} filed competing efficiency reports with management`;
    }
  }
}

export default AbsenceStories;