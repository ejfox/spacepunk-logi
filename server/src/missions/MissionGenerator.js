import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { LLMConfig } from '../utils/llmConfig.js';

class MissionGenerator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.llmConfig = new LLMConfig();
    this.config = {
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.8,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    if (!this.llmConfig.isConfigured()) {
      console.warn('MissionGenerator: No LLM configured. LLM features will be disabled.');
    } else {
      console.log(`MissionGenerator: Using ${this.llmConfig.useLocalLLM ? 'Local LLM' : 'OpenRouter'} at ${this.llmConfig.config.baseUrl}`);
    }
    
    this.missionTypes = [
      'cargo_delivery', 'passenger_transport', 'reconnaissance', 
      'research_collection', 'diplomatic_mission', 'emergency_response',
      'maintenance_contract', 'security_escort', 'salvage_operation'
    ];
    
    this.difficultyLevels = ['routine', 'standard', 'challenging', 'dangerous', 'legendary'];
    
    this.activeGenerations = new Map();
  }

  async generateMission(context = {}) {
    const generationId = Date.now() + Math.random();
    
    try {
      this.activeGenerations.set(generationId, { status: 'generating', startTime: Date.now() });
      
      const missionType = context.missionType || this.selectRandomMissionType();
      const difficulty = context.difficulty || this.selectRandomDifficulty();
      
      const prompt = this.buildMissionPrompt({
        missionType,
        difficulty,
        playerContext: context.player,
        crewContext: context.crew,
        shipContext: context.ship,
        stationContext: context.station,
        marketEvents: context.marketEvents || []
      });
      
      const llmResponse = await this.callLLM(prompt);
      const mission = this.parseMissionResponse(llmResponse, missionType, difficulty);
      
      this.activeGenerations.delete(generationId);
      
      this.emit('missionGenerated', {
        mission,
        context,
        generationTime: Date.now() - this.activeGenerations.get(generationId)?.startTime
      });
      
      return mission;
    } catch (error) {
      this.activeGenerations.delete(generationId);
      console.error('Mission generation failed:', error);
      
      // Fallback to template-based generation
      return this.generateFallbackMission(context);
    }
  }

  buildMissionPrompt(context) {
    const systemPrompt = `You are the mission dispatch system for Spacepunk Logistics, a cynical space trucking simulation. 

TONE & STYLE:
- Treat cosmic events with mundane, bureaucratic language
- Use corporate jargon and passive-aggressive undertones
- Make epic space adventures sound like office work
- Include specific technical details and numbers
- Reference forms, permits, and bureaucratic obstacles

MISSION STRUCTURE:
Generate a mission with these exact fields:
- title: [Corporate-sounding mission name]
- description: [2-3 sentences of bureaucratic mission briefing]  
- objectives: [Array of 3-4 specific tasks with corporate language]
- rewards: [Credits amount and reputation points]
- deadline: [Time limit in hours]
- risks: [Array of 2-3 potential complications]
- flavor_text: [1-2 sentences of cynical commentary or crew dialogue]

CONSTRAINTS:
- Keep rewards between 500-5000 credits based on difficulty
- Mission should be completable within the deadline
- Reference real ship systems, crew skills, and game mechanics
- Include at least one bureaucratic obstacle or form requirement`;

    const contextPrompt = `CURRENT CONTEXT:
Mission Type: ${context.missionType}
Difficulty: ${context.difficulty}
Station: ${context.stationContext?.name || 'Unknown Station'}
Ship: ${context.shipContext?.name || 'Player Vessel'} (${context.shipContext?.hull_type || 'basic_hauler'})
Crew Size: ${context.crewContext?.length || 0}
Recent Market Events: ${context.marketEvents.length > 0 ? context.marketEvents.map(e => e.name).join(', ') : 'None'}

Generate a ${context.difficulty} difficulty ${context.missionType.replace('_', ' ')} mission.`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt }
      ]
    };
  }

  async callLLM(prompt, retryCount = 0) {
    if (!this.llmConfig.isConfigured()) {
      throw new Error('No LLM configured for requests');
    }

    try {
      const llmConf = this.llmConfig.getConfig();
      const response = await fetch(this.llmConfig.getEndpoint('/chat/completions'), {
        method: 'POST',
        headers: llmConf.headers,
        body: JSON.stringify({
          model: llmConf.model,
          messages: prompt.messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid LLM response format');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        // Only log on first failure, not every retry
        if (retryCount === 0) {
          console.log(`⚠️  LLM unavailable, using fallback systems (${error.message})`);
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.callLLM(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  parseMissionResponse(response, missionType, difficulty) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndEnhanceMission(parsed, missionType, difficulty);
      }
      
      // If no JSON, try to parse structured text
      return this.parseStructuredText(response, missionType, difficulty);
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw new Error('Could not parse mission from LLM response');
    }
  }

  validateAndEnhanceMission(mission, missionType, difficulty) {
    // Ensure required fields exist
    const validated = {
      id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: missionType,
      difficulty,
      title: mission.title || `${missionType.replace('_', ' ')} Operation`,
      description: mission.description || 'Standard logistics operation required.',
      objectives: Array.isArray(mission.objectives) ? mission.objectives : ['Complete assigned task'],
      rewards: this.validateRewards(mission.rewards, difficulty),
      deadline: mission.deadline || this.getDefaultDeadline(difficulty),
      risks: Array.isArray(mission.risks) ? mission.risks : ['Standard operational risks'],
      flavor_text: mission.flavor_text || 'Another day, another credit.',
      created_at: new Date().toISOString(),
      status: 'available'
    };

    return validated;
  }

  parseStructuredText(response, missionType, difficulty) {
    // Fallback parser for non-JSON responses
    const lines = response.split('\n').filter(line => line.trim());
    
    let mission = {
      type: missionType,
      difficulty,
      title: `${missionType.replace('_', ' ')} Mission`,
      description: 'Generated mission briefing.',
      objectives: [],
      risks: [],
      flavor_text: ''
    };

    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('title:')) {
        mission.title = trimmed.split(':')[1]?.trim() || mission.title;
      } else if (trimmed.toLowerCase().includes('description:')) {
        mission.description = trimmed.split(':')[1]?.trim() || mission.description;
      } else if (trimmed.toLowerCase().includes('objective')) {
        currentSection = 'objectives';
      } else if (trimmed.toLowerCase().includes('risk')) {
        currentSection = 'risks';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const item = trimmed.substring(1).trim();
        if (currentSection === 'objectives') {
          mission.objectives.push(item);
        } else if (currentSection === 'risks') {
          mission.risks.push(item);
        }
      }
    }

    return this.validateAndEnhanceMission(mission, missionType, difficulty);
  }

  validateRewards(rewards, difficulty) {
    const baseRewards = {
      routine: { credits: 800, reputation: 5 },
      standard: { credits: 1500, reputation: 10 },
      challenging: { credits: 2500, reputation: 20 },
      dangerous: { credits: 4000, reputation: 35 },
      legendary: { credits: 7500, reputation: 60 }
    };

    if (typeof rewards === 'object' && rewards.credits) {
      return {
        credits: Math.max(100, Math.min(10000, rewards.credits)),
        reputation: Math.max(1, Math.min(100, rewards.reputation || baseRewards[difficulty].reputation))
      };
    }

    return baseRewards[difficulty] || baseRewards.standard;
  }

  getDefaultDeadline(difficulty) {
    const deadlines = {
      routine: 24,
      standard: 18,
      challenging: 12,
      dangerous: 8,
      legendary: 6
    };
    return deadlines[difficulty] || 18;
  }

  generateFallbackMission(context = {}) {
    const missionType = context.missionType || this.selectRandomMissionType();
    const difficulty = context.difficulty || this.selectRandomDifficulty();
    
    const templates = this.getMissionTemplates();
    const template = templates[missionType] || templates.cargo_delivery;
    
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: missionType,
      difficulty,
      title: template.title,
      description: template.description,
      objectives: [...template.objectives],
      rewards: this.validateRewards(null, difficulty),
      deadline: this.getDefaultDeadline(difficulty),
      risks: [...template.risks],
      flavor_text: template.flavor_text,
      created_at: new Date().toISOString(),
      status: 'available',
      generated_by: 'fallback_template'
    };
  }

  getMissionTemplates() {
    return {
      cargo_delivery: {
        title: 'Standard Cargo Transport Contract',
        description: 'Corporate client requires freight transport between stations. All necessary permits and customs documentation must be filed in triplicate.',
        objectives: [
          'Pick up cargo manifest at designated station',
          'Complete customs declaration forms C-47 through C-52',
          'Transport cargo without exceeding weight limits',
          'Submit delivery confirmation within 2 hours of arrival'
        ],
        risks: [
          'Potential customs inspection delays',
          'Cargo weight may exceed ship specifications',
          'Required paperwork filing fee (50 credits)'
        ],
        flavor_text: 'Just another milk run. What could possibly go wrong?'
      },
      
      passenger_transport: {
        title: 'Personnel Relocation Services',
        description: 'VIP client requires discrete transportation. Passenger liability waivers must be signed and notarized before departure.',
        objectives: [
          'Complete passenger screening and documentation',
          'Ensure life support systems meet corporate standards',
          'Maintain client confidentiality per NDA-7739-B',
          'File passenger manifest with station authority'
        ],
        risks: [
          'Passenger may have undisclosed medical conditions',
          'Additional insurance surcharge required',
          'Client reputation may affect future contracts'
        ],
        flavor_text: '"VIP treatment" usually means someone who pays extra to complain more.'
      },
      
      reconnaissance: {
        title: 'Routine Sensor Sweep Operation',
        description: 'Corporate security requires updated intelligence on sector activity. Standard reconnaissance protocols apply.',
        objectives: [
          'Perform long-range sensor sweeps of designated coordinates',
          'Document all vessel signatures and energy readings',
          'Submit encrypted data package within mission timeframe',
          'Maintain operational security throughout mission'
        ],
        risks: [
          'Potential detection by hostile sensors',
          'Data encryption key may expire during mission',
          'Extended time in deep space may affect crew morale'
        ],
        flavor_text: 'Corporate says it\'s "routine intelligence gathering." Crew says it\'s spying.'
      }
    };
  }

  selectRandomMissionType() {
    return this.missionTypes[Math.floor(Math.random() * this.missionTypes.length)];
  }

  selectRandomDifficulty() {
    // Weight towards easier missions
    const weights = [0.3, 0.4, 0.2, 0.08, 0.02]; // routine, standard, challenging, dangerous, legendary
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return this.difficultyLevels[i];
      }
    }
    
    return 'standard';
  }

  getGenerationStatus() {
    return {
      activeGenerations: this.activeGenerations.size,
      generations: Array.from(this.activeGenerations.entries()).map(([id, data]) => ({
        id,
        status: data.status,
        duration: Date.now() - data.startTime
      }))
    };
  }
}

export default MissionGenerator;