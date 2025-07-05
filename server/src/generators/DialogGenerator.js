import Chance from 'chance'
import MissionGenerator from '../missions/MissionGenerator.js'
import { StoryDNA } from '../narrative/StoryDNA.js'

export class DialogGenerator {
  constructor(seed = 'spacepunk-dialog') {
    this.chance = new Chance(seed)
    this.missionGenerator = null // Create lazily
    this.storyDNA = new StoryDNA(seed)
    this.storyConsequenceEngine = null // Will be injected
  }
  
  getMissionGenerator() {
    if (!this.missionGenerator) {
      this.missionGenerator = new MissionGenerator()
    }
    return this.missionGenerator
  }
  
  setStoryConsequenceEngine(engine) {
    this.storyConsequenceEngine = engine
  }

  initializeTemplates() {
    return {
      explore: {
        derelict: {
          prompt: "Generate a space encounter involving a derelict vessel. Include 3 choices with different risk levels.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["abandoned ship", "corporate secrets", "space salvage", "security systems"]
        },
        anomaly: {
          prompt: "Generate a space anomaly encounter. Include 3 choices for investigation vs safety.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["space anomaly", "scientific discovery", "unknown technology", "radiation"]
        },
        station: {
          prompt: "Generate an encounter at a remote space station. Include 3 social/trade choices.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["remote outpost", "desperate traders", "information broker", "black market"]
        }
      },
      travel: {
        patrol: {
          prompt: "Generate a corporate patrol encounter during travel. Include 3 responses to authority.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["corporate security", "inspection", "bribery", "false papers"]
        },
        pirates: {
          prompt: "Generate a pirate encounter during space travel. Include 3 survival choices.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["space pirates", "ransom", "hidden cargo", "escape tactics"]
        },
        distress: {
          prompt: "Generate a distress signal encounter. Include 3 moral choices.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["distress call", "moral dilemma", "rescue mission", "trap or genuine"]
        }
      },
      spy: {
        infiltration: {
          prompt: "Generate a corporate infiltration scenario. Include 3 espionage approaches.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["corporate facility", "data theft", "security bypass", "double agent"]
        },
        contact: {
          prompt: "Generate a secret contact meeting. Include 3 ways to handle intelligence exchange.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["intelligence broker", "corporate secrets", "surveillance", "betrayal"]
        }
      },
      trade: {
        negotiation: {
          prompt: "Generate a complex trade negotiation. Include 3 different bargaining strategies.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["shrewd merchant", "rare goods", "market manipulation", "corporate interference"]
        },
        blackmarket: {
          prompt: "Generate a black market trade opportunity. Include 3 risk/reward choices.",
          context: ["fuel", "heat", "credits", "location"],
          tropes: ["illegal goods", "underground market", "corporate crackdown", "smuggling"]
        }
      }
    }
  }

  async generateDialog(actionType, playerState) {
    try {
      // Get player's reputation and active modifiers to influence story generation
      let playerReputation = {}
      let activeModifiers = []
      if (this.storyConsequenceEngine && playerState.playerId) {
        playerReputation = this.storyConsequenceEngine.getPlayerReputation(playerState.playerId)
        activeModifiers = this.storyConsequenceEngine.getActiveModifiers(
          playerState.playerId, 
          Math.floor(Date.now() / 30000)
        )
      }
      
      // Generate unique story DNA influenced by player's history
      const storyDNA = this.storyDNA.generateStoryDNA({
        ...playerState,
        reputation: playerReputation,
        modifiers: activeModifiers
      })
      
      // Build LLM prompt with story DNA and reputation context
      const prompt = await this.buildDNAPrompt(actionType, playerState, storyDNA, playerReputation)
      
      // Call LLM with creative freedom
      const response = await this.getMissionGenerator().callLLM({
        messages: [
          {
            role: "system",
            content: this.getDNASystemPrompt()
          },
          {
            role: "user", 
            content: prompt
          }
        ]
      })

      // Parse and validate response
      const dialog = this.parseDialogResponse(response)
      if (!this.validateDialog(dialog)) {
        throw new Error('LLM generated invalid dialog format')
      }
      return dialog

    } catch (error) {
      console.error('Dialog generation failed:', error)
      throw new Error(`LLM UNAVAILABLE: ${error.message}`)
    }
  }

  selectRelevantTropes(actionType, playerState) {
    const relevantTropes = []
    
    // Map action types to trope categories
    const actionTropeMap = {
      explore: ['space', 'plot_devices', 'classic_plots'],
      trade: ['corporate', 'relationship_dynamics', 'comedy_tropes'],
      spy: ['corporate', 'plot_devices', 'conflict_types'],
      travel: ['space', 'classic_plots', 'character_archetypes'],
      refuel: ['comedy_tropes', 'corporate', 'narrative'],
      wait: ['narrative', 'comedy_tropes', 'relationship_dynamics']
    }

    const categories = actionTropeMap[actionType] || ['narrative']
    
    // Select tropes from relevant categories
    categories.forEach(category => {
      if (this.tropesDatabase[category]) {
        // Weight tropes based on player state
        const tropesWithWeights = this.tropesDatabase[category].map(trope => {
          let weight = 1
          
          // Increase weight for tropes matching player state
          if (playerState.heat > 50 && trope.keywords.some(k => k.includes('corporate') || k.includes('surveillance'))) {
            weight += 2
          }
          if (playerState.fuel < 30 && trope.keywords.some(k => k.includes('emergency') || k.includes('crisis'))) {
            weight += 2
          }
          if (playerState.credits < 500 && trope.keywords.some(k => k.includes('financial') || k.includes('budget'))) {
            weight += 2
          }
          
          return { trope, weight }
        })
        
        // Select 2-3 tropes from each category
        const selectedCount = this.chance.integer({ min: 2, max: 3 })
        for (let i = 0; i < selectedCount && tropesWithWeights.length > 0; i++) {
          const weights = tropesWithWeights.map(t => t.weight)
          const selectedIndex = this.chance.weighted(
            tropesWithWeights.map((_, idx) => idx),
            weights
          )
          
          relevantTropes.push(tropesWithWeights[selectedIndex].trope)
          tropesWithWeights.splice(selectedIndex, 1)
        }
      }
    })
    
    return relevantTropes
  }

  selectTemplate(actionType, playerState) {
    const templates = this.dialogTemplates[actionType]
    if (!templates) return null

    // Use chance.js for deterministic template selection
    const templateKeys = Object.keys(templates)
    
    // Weight templates based on player state
    const weights = templateKeys.map(key => {
      let weight = 1
      
      // Increase weight for certain templates based on state
      if (key === 'patrol' && playerState.heat > 50) weight += 2
      if (key === 'derelict' && playerState.fuel < 50) weight += 1
      if (key === 'pirates' && playerState.credits > 1000) weight += 1
      if (key === 'blackmarket' && playerState.heat > 75) weight += 2
      
      return weight
    })
    
    const selectedKey = this.chance.weighted(templateKeys, weights)
    return templates[selectedKey]
  }

  buildReputationContext(playerReputation) {
    const context = []
    
    // Political reputation affects encounter tone
    if (playerReputation.political) {
      const politicalContext = []
      Object.entries(playerReputation.political).forEach(([type, value]) => {
        if (Math.abs(value) > 20) {
          const intensity = Math.abs(value) > 50 ? 'widely' : 'somewhat'
          const direction = value > 0 ? 'known for' : 'notorious for'
          politicalContext.push(`${intensity} ${direction} ${type.replace(/_/g, ' ')}`)
        }
      })
      if (politicalContext.length > 0) {
        context.push(`Political: ${politicalContext.join(', ')}`)
      }
    }
    
    // Market reputation affects pricing and opportunities
    if (playerReputation.market) {
      const marketContext = []
      Object.entries(playerReputation.market).forEach(([type, value]) => {
        if (Math.abs(value) > 15) {
          const intensity = Math.abs(value) > 40 ? 'well' : 'somewhat'
          const direction = value > 0 ? 'regarded as' : 'seen as'
          marketContext.push(`${intensity} ${direction} ${type.replace(/_/g, ' ')}`)
        }
      })
      if (marketContext.length > 0) {
        context.push(`Market: ${marketContext.join(', ')}`)
      }
    }
    
    return context.length > 0 ? context.join('\n') : 'No significant reputation established'
  }

  assessPlayerRisk(playerState) {
    const risks = []
    if (playerState.fuel < 30) risks.push('FUEL CRITICAL')
    if (playerState.credits < 200) risks.push('FINANCIALLY DESPERATE') 
    if (playerState.heat > 60) risks.push('HIGH SURVEILLANCE')
    if (playerState.heat > 80) risks.push('CORPORATE TARGET')
    return risks.length > 0 ? risks.join(', ') : 'STABLE OPERATIONS'
  }

  buildLocationContext(location) {
    const locationProfiles = {
      'Earth Station Alpha': 'Corporate headquarters - high security, premium services, bureaucratic red tape',
      'Mars Orbital Beta': 'Industrial hub - rough clientele, black market access, union tensions', 
      'Europa Mining Gamma': 'Remote outpost - desperate traders, equipment failures, isolation paranoia',
      'Asteroid Belt Delta': 'Lawless frontier - pirates, salvagers, corporate outcasts',
      'Titan Refinery Epsilon': 'Energy sector - explosive hazards, worker strikes, environmental dangers'
    }
    return locationProfiles[location] || 'Unknown sector - uncertain conditions, unpredictable encounters'
  }

  async buildDNAPrompt(actionType, playerState, storyDNA, playerReputation = {}) {
    const contextData = `fuel: ${playerState.fuel}, credits: ${playerState.credits}, heat: ${playerState.heat}, location: ${playerState.location}`
    
    // Build reputation context for more personalized encounters
    const reputationContext = this.buildReputationContext(playerReputation)
    
    // Add risk assessment based on player state
    const riskProfile = this.assessPlayerRisk(playerState)
    
    // Add location-specific context
    const locationContext = this.buildLocationContext(playerState.location)
    
    // Gather rich contextual data for enhanced prompts
    let enrichedContext = ''
    let availableDestinations = ''
    
    try {
      if (playerState.shipId) {
        const crewRepo = new (await import('../repositories/CrewRepository.js')).CrewRepository()
        const shipRepo = new (await import('../repositories/ShipRepository.js')).ShipRepository()
        const { query } = await import('../db/index.js')
        
        // Get crew social dynamics
        const crew = await crewRepo.getCrewWithRelationships(playerState.shipId)
        const crewSummary = this.buildCrewSummary(crew)
        
        // Get ship technical state
        const ship = await shipRepo.findById(playerState.shipId)
        const shipSummary = this.buildShipSummary(ship)
        
        // For travel actions, get real station data from database
        if (actionType === 'travel') {
          const stationsResult = await query(`
            SELECT name, galaxy, sector, station_type, faction, population, 
                   security_level, trade_volume, docking_fee, fuel_price, 
                   black_market_activity, corruption_level, description
            FROM stations 
            WHERE name != $1 
            ORDER BY name
            LIMIT 6
          `, [playerState.location])
          
          const stations = stationsResult.rows
          availableDestinations = this.buildDestinationContext(stations, playerState)
        }
        
        enrichedContext = `
CREW DYNAMICS: ${crewSummary}
SHIP STATUS: ${shipSummary}${availableDestinations}`
      }
    } catch (error) {
      console.warn('Failed to gather enriched context:', error.message)
      // Fall back to basic context
    }
    
    return `You are generating a ${actionType} encounter for a spacepunk logistics game.

PLAYER RISK PROFILE: ${riskProfile}
LOCATION CONTEXT: ${locationContext}
PLAYER STATE: ${contextData}
REPUTATION: ${reputationContext}${enrichedContext}

${this.storyDNA.exportDNAForLLM(storyDNA)}

CREATIVE DIRECTIVE: 
${actionType === 'travel' ? 
  `Generate travel destination options with ship AI commentary. For each destination from the AVAILABLE DESTINATIONS data:
- Create a choice with exact fuel cost from the destination data
- Add ship AI commentary below each choice based on player's current fuel/credits/heat
- AI should be snarky/corporate about fuel efficiency, safety, profitability
- Include docking fees and security warnings in AI commentary
- Use actual station data (security level, population, station type) in descriptions` :
  `Generate a unique ${actionType} encounter that directly responds to the player's current situation. 
- Low fuel = desperate/risky scenarios
- High heat = paranoia/surveillance themes  
- Low credits = economic pressure/temptation
- Player's location should heavily influence the encounter type and characters
- Use crew dynamics and ship status to create personalized scenarios`}

Make consequences feel EARNED and CONNECTED to the player's choices and state.

Response must be valid JSON in this exact format:
{
  "situation": "Brief situation description",
  "choices": [
    {
      "id": "choice1", 
      "text": "Choice description",
      "risk": "low|medium|high",
      "consequences": {
        "fuel": "+10 or -15 (number with + or -)",
        "credits": "+50-200 or -100 (range or specific)",
        "heat": "+5 (number with + or -)",
        "narrative": "Brief consequence description"
      }
    }
  ]
}`
  }

  buildCrewSummary(crew) {
    if (!crew || crew.length === 0) return 'No crew aboard'
    
    return crew.map(member => {
      const personality = member.dominant_archetype || 'unknown'
      const skills = `Eng:${member.skill_engineering || 0} Pilot:${member.skill_piloting || 0} Social:${member.skill_social || 0}`
      const status = `Health:${member.health || 0}% Morale:${member.morale || 0}%`
      const relationships = member.relationships ? 
        member.relationships.map(r => `${r.other_name}(${r.relationship_value})`).join(', ') : 'None'
      
      return `${member.name} (${personality}): ${skills}, ${status}, Relations: ${relationships}`
    }).join(' | ')
  }

  buildShipSummary(ship) {
    if (!ship) return 'Ship data unavailable'
    
    return `${ship.name} (${ship.hull_type}): Location: ${ship.location_station}, Fuel: ${ship.fuel}/${ship.fuel_max}, Cargo: ${ship.cargo_current}/${ship.cargo_max}`
  }

  buildDestinationContext(stations, playerState) {
    if (!stations || stations.length === 0) return ''
    
    const destinationData = stations.map(station => {
      // Calculate estimated fuel cost (simple distance approximation)
      const baseFuelCost = Math.floor(Math.random() * 20) + 15 // 15-35 fuel
      const canAfford = playerState.fuel >= baseFuelCost
      
      return `${station.name} (${station.galaxy}): ${station.station_type} station, Population: ${station.population || 'Unknown'}, Security: ${station.security_level || 50}%, Docking: ${station.docking_fee || 50}CR, Fuel Cost: ${baseFuelCost} (${canAfford ? 'AFFORDABLE' : 'INSUFFICIENT FUEL'}), Description: ${station.description || 'Standard station'}`
    }).join(' | ')
    
    return `

AVAILABLE DESTINATIONS: ${destinationData}`
  }

  getDNASystemPrompt() {
    return `You are a creative narrative AI for Spacepunk, a corporate dystopia space simulation. Your job is to use provided Story DNA to generate infinite unique encounters.

CORE PHILOSOPHY:
- Story DNA provides ingredients, not recipes
- Combine elements creatively and unexpectedly  
- Every story should feel fresh while maintaining tone
- Think "corporate workplace meets space opera"

CREATIVE FREEDOM:
- Interpret DNA elements however makes for the best story
- Mutate and evolve elements naturally
- Blend multiple DNA strands into something new
- Surprise even yourself with combinations

SPACEPUNK TONE CONSTANTS:
- Extraordinary events treated as mundane workplace issues
- Corporate jargon for epic situations
- Bureaucratic humor in life-or-death scenarios
- Every choice feels like "filing paperwork for your soul"

TECHNICAL REQUIREMENTS:
- Always exactly 3 choices with different risk levels
- Consequences affect fuel, credits, heat, or narrative
- Brief, punchy descriptions (2-3 sentences max)
- Return ONLY valid JSON

Your goal: INFINITE story variety using finite DNA components.`
  }

  parseDialogResponse(response) {
    try {
      // Clean up response and extract JSON
      let jsonStr = response.trim()
      
      // Remove any markdown code blocks
      jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '')
      
      // Find JSON object boundaries
      const startIndex = jsonStr.indexOf('{')
      const lastIndex = jsonStr.lastIndexOf('}')
      
      if (startIndex >= 0 && lastIndex >= 0) {
        jsonStr = jsonStr.substring(startIndex, lastIndex + 1)
      }
      
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse dialog JSON:', error)
      return null
    }
  }

  validateDialog(dialog) {
    if (!dialog || typeof dialog !== 'object') return false
    if (!dialog.situation || typeof dialog.situation !== 'string') return false
    if (!Array.isArray(dialog.choices) || dialog.choices.length !== 3) return false
    
    return dialog.choices.every(choice => 
      choice.id && 
      choice.text && 
      choice.risk &&
      ['low', 'medium', 'high', 'none', 'extreme'].includes(choice.risk)
    )
  }

  generateFallbackDialog(actionType, playerState) {
    // Generate SURPRISING consequences using Story DNA even in fallback
    const storyDNA = this.storyDNA.generateStoryDNA(playerState)
    
    const fallbackVariations = {
      explore: {
        situation: this.generateSurprisingSituation('explore', storyDNA, playerState),
        choices: [
          {
            id: "investigate",
            text: this.generateSurprisingChoice('investigate', storyDNA),
            risk: this.chance.pickone(['medium', 'high']),
            consequences: this.generateConsequentialOutcome('investigate', storyDNA, playerState)
          },
          {
            id: "scan",
            text: this.generateSurprisingChoice('scan', storyDNA),
            risk: this.chance.pickone(['low', 'medium']),
            consequences: this.generateConsequentialOutcome('scan', storyDNA, playerState)
          },
          {
            id: "report",
            text: this.generateSurprisingChoice('report', storyDNA),
            risk: this.chance.pickone(['none', 'low']),
            consequences: this.generateConsequentialOutcome('report', storyDNA, playerState)
          }
        ]
      },
      travel: {
        situation: this.generateSurprisingSituation('travel', storyDNA, playerState),
        choices: [
          {
            id: "hail",
            text: this.generateSurprisingChoice('hail', storyDNA),
            risk: this.chance.pickone(['low', 'medium']),
            consequences: this.generateConsequentialOutcome('hail', storyDNA, playerState)
          },
          {
            id: "evade",
            text: this.generateSurprisingChoice('evade', storyDNA),
            risk: this.chance.pickone(['medium', 'high']),
            consequences: this.generateConsequentialOutcome('evade', storyDNA, playerState)
          },
          {
            id: "accelerate",
            text: this.generateSurprisingChoice('accelerate', storyDNA),
            risk: this.chance.pickone(['high', 'extreme']),
            consequences: this.generateConsequentialOutcome('accelerate', storyDNA, playerState)
          }
        ]
      },
      spy: {
        situation: this.generateSurprisingSituation('spy', storyDNA, playerState),
        choices: this._currentPolitician ? [
          {
            id: "bribe",
            text: this.generateSurprisingChoice('bribe', storyDNA),
            risk: this.chance.pickone(['medium', 'high']),
            consequences: this.generatePoliticalConsequence('bribe', storyDNA, playerState)
          },
          {
            id: "blackmail",
            text: this.generateSurprisingChoice('blackmail', storyDNA),
            risk: this.chance.pickone(['high', 'extreme']),
            consequences: this.generatePoliticalConsequence('blackmail', storyDNA, playerState)
          },
          {
            id: "report_politician",
            text: this.generateSurprisingChoice('report_politician', storyDNA),
            risk: this.chance.pickone(['low', 'medium']),
            consequences: this.generatePoliticalConsequence('report_politician', storyDNA, playerState)
          }
        ] : [
          {
            id: "decrypt",
            text: this.generateSurprisingChoice('decrypt', storyDNA),
            risk: this.chance.pickone(['high', 'extreme']),
            consequences: this.generateConsequentialOutcome('decrypt', storyDNA, playerState)
          },
          {
            id: "trace",
            text: this.generateSurprisingChoice('trace', storyDNA),
            risk: this.chance.pickone(['medium', 'high']),
            consequences: this.generateConsequentialOutcome('trace', storyDNA, playerState)
          },
          {
            id: "sell",
            text: this.generateSurprisingChoice('sell', storyDNA),
            risk: this.chance.pickone(['low', 'medium']),
            consequences: this.generateConsequentialOutcome('sell', storyDNA, playerState)
          }
        ]
      },
      trade: {
        situation: this.generateSurprisingSituation('trade', storyDNA, playerState),
        choices: [
          {
            id: "negotiate",
            text: this.generateSurprisingChoice('negotiate', storyDNA),
            risk: this.chance.pickone(['low', 'medium']),
            consequences: this.generateConsequentialOutcome('negotiate', storyDNA, playerState)
          },
          {
            id: "aggressive",
            text: this.generateSurprisingChoice('aggressive', storyDNA),
            risk: this.chance.pickone(['medium', 'high']),
            consequences: this.generateConsequentialOutcome('aggressive', storyDNA, playerState)
          },
          {
            id: "withdraw",
            text: this.generateSurprisingChoice('withdraw', storyDNA),
            risk: this.chance.pickone(['none', 'low']),
            consequences: this.generateConsequentialOutcome('withdraw', storyDNA, playerState)
          }
        ]
      }
    }

    // Select base dialog then add chance.js variations
    const baseDialog = fallbackVariations[actionType] || fallbackVariations.explore
    
    // Add deterministic variations using chance.js
    const situations = [
      baseDialog.situation,
      baseDialog.situation.replace('Corporate database', 'SpaceCorp™ registry'),
      baseDialog.situation.replace('Sensor readings', 'Long-range scanners'),
      baseDialog.situation.replace('anomalous', this.chance.pickone(['unusual', 'irregular', 'unauthorized', 'suspicious']))
    ]
    
    const selectedSituation = this.chance.pickone(situations)
    
    return {
      ...baseDialog,
      situation: selectedSituation,
      id: `fallback-${actionType}-${this.chance.hash({ length: 8 })}`
    }
  }

  generateSurprisingSituation(actionType, storyDNA, playerState) {
    // 20% chance to encounter a politician during spy/trade actions
    if ((actionType === 'spy' || actionType === 'trade') && this.chance.bool({ likelihood: 20 })) {
      return this.generatePoliticalEncounter(actionType, storyDNA, playerState)
    }
    
    const templates = {
      explore: [
        `${storyDNA.obstacle.corporate_spin} detected in sector ${this.chance.integer({min: 100, max: 999})}. ${storyDNA.motivation.corporate_spin} protocols suggest immediate attention.`,
        `Anomalous readings correlate with ${storyDNA.stakes.corporate_spin}. Corporate liability assessments pending.`,
        `Local regulations regarding ${storyDNA.primary_relationship.corporate_spin} may apply. ${storyDNA.conflict_pattern} procedures recommended.`
      ],
      spy: [
        `Intercepted communications reference "${storyDNA.motivation.corporate_spin}" with ${storyDNA.relationship_tension} implications.`,
        `Corporate surveillance indicates ${storyDNA.obstacle.corporate_spin} activities. Intelligence value: ${storyDNA.stakes.corporate_spin}.`,
        `Data breach opportunity detected: ${storyDNA.conflict_pattern} protocols may yield ${storyDNA.emotional_arc} results.`
      ],
      trade: [
        `Market fluctuations suggest ${storyDNA.motivation.corporate_spin} opportunities. ${storyDNA.obstacle.corporate_spin} may impact negotiations.`,
        `Trading partner exhibits ${storyDNA.relationship_tension} behavior patterns. ${storyDNA.stakes.corporate_spin} at stake.`,
        `Resource availability indicates ${storyDNA.conflict_pattern} market conditions. Corporate arbitrage possible.`
      ]
    }
    
    const actionTemplates = templates[actionType] || templates.explore
    return this.chance.pickone(actionTemplates)
  }
  
  generatePoliticalEncounter(actionType, storyDNA, playerState) {
    const politicians = ['governor', 'trade_commissioner', 'safety_director', 'military_liaison']
    const politician = this.chance.pickone(politicians)
    const politicalTitles = {
      governor: 'Sector Governor',
      trade_commissioner: 'Trade Commissioner', 
      safety_director: 'Safety Director',
      military_liaison: 'Military Liaison'
    }
    
    const encounters = {
      spy: [
        `Encrypted transmission intercepted from ${politicalTitles[politician]} office. Internal correspondence reveals ${storyDNA.motivation.corporate_spin} deliberations.`,
        `Security breach detected: ${politicalTitles[politician]} discussing ${storyDNA.stakes.corporate_spin} with corporate representatives.`,
        `Intelligence opportunity: ${politicalTitles[politician]} vulnerability exposed through ${storyDNA.conflict_pattern} investigation.`
      ],
      trade: [
        `Market anomaly detected: ${politicalTitles[politician]} office showing unusual ${storyDNA.motivation.corporate_spin} activity.`,
        `Political intelligence: ${politicalTitles[politician]} planning ${storyDNA.stakes.corporate_spin} regulatory changes.`,
        `Insider opportunity: ${politicalTitles[politician]} staff member seeking ${storyDNA.relationship_tension} arrangement.`
      ]
    }
    
    // Store the politician ID for choice consequences
    this._currentPolitician = politician
    
    const templates = encounters[actionType] || encounters.spy
    return this.chance.pickone(templates)
  }

  generateSurprisingChoice(choiceType, storyDNA) {
    const choiceTemplates = {
      investigate: [
        `Deploy ${storyDNA.motivation.corporate_spin} protocols`,
        `Initiate ${storyDNA.conflict_pattern} procedures`,
        `Implement ${storyDNA.stakes.corporate_spin} assessment`
      ],
      scan: [
        `Perform ${storyDNA.obstacle.corporate_spin} analysis`,
        `Execute ${storyDNA.relationship_tension} monitoring`,
        `Conduct ${storyDNA.emotional_arc} evaluation`
      ],
      report: [
        `File ${storyDNA.primary_relationship.corporate_spin} documentation`,
        `Submit ${storyDNA.conflict_pattern} compliance report`,
        `Log ${storyDNA.motivation.corporate_spin} incident`
      ],
      hail: [
        `Broadcast ${storyDNA.primary_relationship.corporate_spin} identification`,
        `Transmit ${storyDNA.motivation.corporate_spin} credentials`,
        `Signal ${storyDNA.conflict_pattern} intent`
      ],
      evade: [
        `Execute ${storyDNA.obstacle.corporate_spin} avoidance maneuvers`,
        `Implement ${storyDNA.stakes.corporate_spin} evasion protocol`,
        `Deploy ${storyDNA.relationship_tension} countermeasures`
      ],
      accelerate: [
        `Initiate ${storyDNA.emotional_arc} velocity protocols`,
        `Engage ${storyDNA.conflict_pattern} emergency thrust`,
        `Execute ${storyDNA.motivation.corporate_spin} escape sequence`
      ],
      decrypt: [
        `Deploy ${storyDNA.stakes.corporate_spin} decryption algorithms`,
        `Execute ${storyDNA.obstacle.corporate_spin} data breach protocols`,
        `Implement ${storyDNA.motivation.corporate_spin} intelligence gathering`
      ],
      bribe: [
        `Process ${storyDNA.motivation.corporate_spin} financial incentive transfer`,
        `Execute ${storyDNA.stakes.corporate_spin} compensation package`,
        `Deploy ${storyDNA.relationship_tension} mutual benefit protocol`
      ],
      blackmail: [
        `Leverage ${storyDNA.obstacle.corporate_spin} information asymmetry`,
        `Execute ${storyDNA.conflict_pattern} pressure tactics`,
        `Deploy ${storyDNA.stakes.corporate_spin} risk mitigation`
      ],
      report_politician: [
        `File ${storyDNA.primary_relationship.corporate_spin} compliance documentation`,
        `Submit ${storyDNA.motivation.corporate_spin} regulatory notification`,
        `Process ${storyDNA.conflict_pattern} whistleblower protocol`
      ],
      trace: [
        `Initiate ${storyDNA.relationship_tension} surveillance tracking`,
        `Deploy ${storyDNA.conflict_pattern} signal analysis`,
        `Execute ${storyDNA.primary_relationship.corporate_spin} monitoring`
      ],
      sell: [
        `Process ${storyDNA.motivation.corporate_spin} data liquidation`,
        `Execute ${storyDNA.stakes.corporate_spin} information transfer`,
        `Implement ${storyDNA.obstacle.corporate_spin} asset monetization`
      ],
      negotiate: [
        `Deploy ${storyDNA.primary_relationship.corporate_spin} negotiation framework`,
        `Execute ${storyDNA.relationship_tension} bargaining protocols`,
        `Implement ${storyDNA.motivation.corporate_spin} value optimization`
      ],
      aggressive: [
        `Initiate ${storyDNA.conflict_pattern} pressure tactics`,
        `Deploy ${storyDNA.emotional_arc} dominance protocols`,
        `Execute ${storyDNA.stakes.corporate_spin} leverage maximization`
      ],
      withdraw: [
        `Process ${storyDNA.obstacle.corporate_spin} risk assessment`,
        `Execute ${storyDNA.relationship_tension} strategic retreat`,
        `Implement ${storyDNA.motivation.corporate_spin} loss mitigation`
      ]
    }
    
    const templates = choiceTemplates[choiceType] || choiceTemplates.investigate
    return this.chance.pickone(templates)
  }

  generateConsequentialOutcome(choiceType, storyDNA, playerState) {
    // Create MEANINGFUL consequences based on current state and story DNA
    const consequences = {
      fuel: this.calculateFuelConsequence(choiceType, storyDNA, playerState),
      credits: this.calculateCreditsConsequence(choiceType, storyDNA, playerState),
      heat: this.calculateHeatConsequence(choiceType, storyDNA, playerState),
      narrative: this.generateConsequenceNarrative(choiceType, storyDNA)
    }
    
    // Add CASCADING EFFECTS that will impact future choices
    if (this.chance.bool({ likelihood: 30 })) {
      consequences.cascade = this.generateCascadingEffect(storyDNA, playerState)
    }
    
    return consequences
  }

  calculateFuelConsequence(choiceType, storyDNA, playerState) {
    const fuelCosts = { 
      investigate: -15, scan: -8, report: -3,
      hail: -2, evade: -18, accelerate: -30,
      decrypt: -12, trace: -6, sell: -4,
      negotiate: -5, aggressive: -8, withdraw: -2
    }
    let baseFuel = fuelCosts[choiceType] || -10
    
    // Make fuel costs MATTER more when fuel is low (DESPERATION MECHANICS)
    if (playerState.fuel < 30) {
      baseFuel = Math.floor(baseFuel * 1.5) // Desperation costs more
    }
    
    // Story DNA can dramatically alter fuel usage (SURPRISE FACTOR)
    if (storyDNA.conflict_pattern === 'resource scarcity creating alliances') {
      baseFuel = Math.floor(baseFuel * 0.5) // Efficiency boost
    }
    if (storyDNA.setting_pressure === 'equipment failures') {
      baseFuel = Math.floor(baseFuel * 1.8) // Equipment problems cost more fuel
    }
    
    // CASCADING FUEL EFFICIENCY based on previous choices
    if (playerState.previous_choices?.includes('accelerate')) {
      baseFuel = Math.floor(baseFuel * 1.3) // Engines still overheated
    }
    
    return baseFuel.toString()
  }

  calculateCreditsConsequence(choiceType, storyDNA, playerState) {
    const baseRanges = {
      investigate: { min: 200, max: 800 }, scan: { min: 50, max: 300 }, report: { min: 25, max: 150 },
      hail: { min: 0, max: 100 }, evade: { min: -50, max: 200 }, accelerate: { min: -100, max: 500 },
      decrypt: { min: 500, max: 2000 }, trace: { min: 150, max: 600 }, sell: { min: 100, max: 400 },
      negotiate: { min: 100, max: 800 }, aggressive: { min: -200, max: 1200 }, withdraw: { min: -50, max: 50 }
    }
    
    let range = baseRanges[choiceType] || baseRanges.investigate
    
    // Story DNA dramatically affects rewards (SURPRISE PAYOUTS)
    if (storyDNA.stakes.text && storyDNA.stakes.text.includes('critical business continuity')) {
      range.min *= 3
      range.max *= 3
    }
    
    // CASCADING REPUTATION EFFECTS from previous choices
    if (playerState.previous_choices?.includes('aggressive')) {
      range.min = Math.floor(range.min * 0.7) // Reputation damage hurts future deals
      range.max = Math.floor(range.max * 0.8)
    }
    if (playerState.previous_choices?.includes('report')) {
      range.min = Math.floor(range.min * 1.2) // Corporate citizenship bonus
      range.max = Math.floor(range.max * 1.1)
    }
    
    // Player desperation creates DANGEROUS opportunities
    if (playerState.credits < 200) {
      range.max *= 2 // Desperate times, bigger potential gains
      if (this.chance.bool({ likelihood: 40 })) {
        return `-${range.min}-${range.max}` // But also bigger potential losses!
      }
    }
    
    // WEALTH ATTRACTS ATTENTION (and opportunities)
    if (playerState.credits > 5000) {
      range.min = Math.floor(range.min * 1.5) // Rich people get better deals
      range.max = Math.floor(range.max * 1.3)
    }
    
    return range.min < 0 ? `${range.min}-${range.max}` : `+${range.min}-${range.max}`
  }

  calculateHeatConsequence(choiceType, storyDNA, playerState) {
    const heatChanges = {
      investigate: 20, scan: 8, report: -10,
      hail: 5, evade: 15, accelerate: 25,
      decrypt: 30, trace: 15, sell: 8,
      negotiate: 2, aggressive: 20, withdraw: -5
    }
    let baseHeat = heatChanges[choiceType] || 10
    
    // High heat makes everything MORE dangerous (CASCADING PRESSURE)
    if (playerState.heat > 70) {
      baseHeat += 15 // Corporate attention makes everything riskier
    }
    
    // EXTREMELY high heat creates PANIC situations
    if (playerState.heat > 90) {
      baseHeat += 25 // Everything goes wrong when you're this hot
    }
    
    // Story DNA affects heat generation (NARRATIVE CONSEQUENCES)
    if (storyDNA.setting_pressure === 'security concerns') {
      baseHeat += 10
    }
    if (storyDNA.obstacle.text && storyDNA.obstacle.text.includes('corporate')) {
      baseHeat += 8 // Corporate obstacles always increase scrutiny
    }
    
    // CASCADING HEAT from previous aggressive choices
    if (playerState.previous_choices?.includes('decrypt') || playerState.previous_choices?.includes('aggressive')) {
      baseHeat += 12 // You're on their radar now
    }
    
    // Location affects heat generation
    if (playerState.location?.includes('Corporate') || playerState.location?.includes('Alpha')) {
      baseHeat += 5 // Corporate zones are more monitored
    }
    
    return baseHeat > 0 ? `+${baseHeat}` : baseHeat.toString()
  }

  generateConsequenceNarrative(choiceType, storyDNA) {
    return `${storyDNA.emotional_arc} outcome: ${storyDNA.stakes.corporate_spin} ${choiceType === 'investigate' ? 'achieved through direct action' : choiceType === 'scan' ? 'assessed via analysis' : 'documented per protocol'}`
  }

  generateCascadingEffect(storyDNA, playerState) {
    // These effects will be applied to future dialog generation
    const effects = [
      `future_heat_modifier: +${this.chance.integer({min: 5, max: 15})}`,
      `reputation_change: ${storyDNA.primary_relationship.corporate_spin}`,
      `equipment_status: ${storyDNA.conflict_pattern}`,
      `intel_discovered: ${storyDNA.motivation.corporate_spin}`
    ]
    
    return this.chance.pickone(effects)
  }
  
  generatePoliticalConsequence(choiceType, storyDNA, playerState) {
    const politicianId = this._currentPolitician
    
    const consequences = {
      fuel: this.calculateFuelConsequence(choiceType, storyDNA, playerState),
      credits: this.calculatePoliticalCreditsConsequence(choiceType, storyDNA, playerState),
      heat: this.calculatePoliticalHeatConsequence(choiceType, storyDNA, playerState),
      narrative: this.generatePoliticalNarrative(choiceType, storyDNA, politicianId),
      political_effect: this.generatePoliticalEffect(choiceType, politicianId)
    }
    
    return consequences
  }
  
  calculatePoliticalCreditsConsequence(choiceType, storyDNA, playerState) {
    const baseRanges = {
      bribe: { min: -50000, max: -10000 }, // Bribes cost money
      blackmail: { min: 5000, max: 25000 }, // Blackmail can be profitable
      report_politician: { min: 1000, max: 5000 } // Corporate rewards whistleblowing
    }
    
    const range = baseRanges[choiceType] || { min: 0, max: 1000 }
    
    return range.min < 0 ? `${range.min}-${range.max}` : `+${range.min}-${range.max}`
  }
  
  calculatePoliticalHeatConsequence(choiceType, storyDNA, playerState) {
    const heatChanges = {
      bribe: 25, // Bribing politicians is risky
      blackmail: 40, // Blackmail is extremely risky
      report_politician: -15 // Reporting politicians reduces heat
    }
    
    let baseHeat = heatChanges[choiceType] || 10
    
    // High heat makes political actions MORE dangerous
    if (playerState.heat > 70) {
      baseHeat += 20
    }
    
    return baseHeat > 0 ? `+${baseHeat}` : baseHeat.toString()
  }
  
  generatePoliticalNarrative(choiceType, storyDNA, politicianId) {
    const narratives = {
      bribe: `Financial incentive transfer processed with ${politicianId}. ${storyDNA.stakes.corporate_spin} outcomes anticipated.`,
      blackmail: `Leverage deployment successful against ${politicianId}. ${storyDNA.conflict_pattern} compliance achieved.`,
      report_politician: `Regulatory compliance documentation filed regarding ${politicianId}. ${storyDNA.primary_relationship.corporate_spin} cooperation noted.`
    }
    
    return narratives[choiceType] || `Political interaction with ${politicianId} completed.`
  }
  
  generatePoliticalEffect(choiceType, politicianId) {
    const effects = {
      bribe: {
        type: 'relationship_increase',
        politician: politicianId,
        value: this.chance.integer({ min: 15, max: 40 }),
        description: 'Political relationship improved through financial cooperation'
      },
      blackmail: {
        type: 'forced_compliance',
        politician: politicianId,
        value: this.chance.integer({ min: 30, max: 60 }),
        description: 'Political leverage established through information advantage',
        risk: 'high_retaliation'
      },
      report_politician: {
        type: 'corporate_standing',
        politician: politicianId,
        value: this.chance.integer({ min: 5, max: 15 }),
        description: 'Corporate citizenship demonstrated through regulatory cooperation'
      }
    }
    
    return effects[choiceType] || { type: 'no_effect', description: 'No significant political impact' }
  }
}