import { LLMConfig } from '../utils/llmConfig.js';
import { gameRandom } from '../utils/seededRandom.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * LLM-powered content generator for all game assets
 * Uses local LLM to create intricate, corporate-dystopian content
 */
export class ContentGenerator {
  constructor() {
    this.llmConfig = new LLMConfig();
  }

  /**
   * Generate additional resource types with corporate cynicism
   * Combines LLM creativity with chance.js seeded stats
   */
  async generateResources(count = 20) {
    const categories = ['tech', 'consumable', 'green', 'luxury', 'raw', 'contraband'];
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const category = gameRandom.chance.pickone(categories);
      
      // Generate stats using seeded chance.js
      const basePrice = this.generateResourcePrice(category);
      const weight = gameRandom.chance.floating({ min: 0.01, max: 10.0, fixed: 2 });
      const volume = gameRandom.chance.floating({ min: 0.01, max: 8.0, fixed: 2 });
      
      const prompt = `Generate 1 space logistics resource for a cynical corporate space trucking game.

IMPORTANT: Return ONLY a JSON object. No other text.

Category: ${category}
Base price range: ${basePrice} credits (adjust ±20% for corporate pricing schemes)
Weight: ${weight} kg
Volume: ${volume} m³

Must have: code, name, description

Focus on corporate dystopian humor. Make it feel like something a terrible space logistics company would actually trade.

Example:
{"code": "FORM_27B", "name": "Form 27-B: Equipment Transfer Authorization", "description": "Required paperwork for equipment transfers. Expires after 72 hours."}

Generate creative name and description only:`;

      const result = await this.callLLM(prompt);
      if (result) {
        // Combine LLM creativity with chance.js stats
        const priceVariation = gameRandom.chance.floating({ min: 0.8, max: 1.2, fixed: 2 });
        results.push({
          code: result.code,
          name: result.name,
          category,
          base_price: Math.round(basePrice * priceVariation * 100) / 100,
          weight,
          volume,
          description: result.description
        });
      }
    }
    
    return results;
  }

  /**
   * Generate resource pricing based on category using seeded random
   */
  generateResourcePrice(category) {
    const priceRanges = {
      tech: { min: 100, max: 2000 },
      consumable: { min: 5, max: 200 },
      green: { min: 50, max: 800 },
      luxury: { min: 200, max: 5000 },
      raw: { min: 10, max: 150 },
      contraband: { min: 500, max: 10000 }
    };
    
    const range = priceRanges[category] || priceRanges.consumable;
    return gameRandom.chance.integer(range);
  }

  /**
   * Generate crew members with detailed backgrounds
   */
  async generateCrewMembers(count = 10) {
    const cultures = ['Corporate', 'Asteroid', 'Martian', 'Terran', 'Spacer', 'Fringe', 'Colonial'];
    const homeworlds = ['Earth', 'Mars', 'Europa', 'Titan', 'Ceres', 'Proxima', 'New Shanghai', 'Alpha Station'];

    const crew = [];
    for (let i = 0; i < count; i++) {
      const culture = gameRandom.chance.pickone(cultures);
      const homeworld = gameRandom.chance.pickone(homeworlds);
      const age = gameRandom.chance.integer({ min: 22, max: 65 });
      
      const prompt = `Generate a crew member for cynical space logistics company. Corporate dystopian tone with dark humor.

TEMPLATE:
Culture: ${culture}
Homeworld: ${homeworld} 
Age: ${age}

Generate JSON with: name, previous_job, availability_reason, notable_incident, employment_red_flags, skills_summary, personality_quirks

Focus on bureaucratic absurdity, workplace dysfunction, and space trucking industry cynicism. Make it feel like reading terrible HR files.

Example:
{
  "name": "Chen Martinez-Singh",
  "previous_job": "Waste Recycling Compliance Officer at Ganymede Sanitation Corp",
  "availability_reason": "Department eliminated due to 'efficiency optimization' (actual reason: discovered supervisor selling recycled air to black market)",
  "notable_incident": "Reported 47 safety violations in single shift, causing complete facility shutdown",
  "employment_red_flags": "Tendency to actually read safety manuals, asks too many questions about 'liability'",
  "skills_summary": "Obsessive attention to detail, knows every regulation by heart, surprisingly good at jury-rigging broken systems",
  "personality_quirks": "Organizes tools by regulation compliance level, keeps backup copies of all forms in triplicate"
}`;

      const result = await this.callLLM(prompt);
      if (result) {
        const crewData = { ...result, culture, homeworld, age };
        crew.push(crewData);
      }
    }
    
    return crew;
  }

  /**
   * Generate additional stations with rich lore
   * Combines LLM creativity with chance.js seeded stats
   */
  async generateStations(count = 15) {
    const stationTypes = ['mining', 'research', 'trade', 'industrial', 'military', 'civilian', 'prison', 'agricultural'];
    const factions = ['Federation', 'Independent', 'Corporate', 'Pirate', 'Religious', 'Scientific', 'Criminal'];
    const galaxies = ['Sol System', 'Proxima Centauri', 'Wolf 359', 'Barnards Star', 'Vega System'];
    const sectors = ['Inner', 'Middle', 'Outer', 'Core', 'Rim', 'Deep'];
    const results = [];

    for (let i = 0; i < count; i++) {
      // Generate stats using seeded chance.js
      const stationType = gameRandom.chance.pickone(stationTypes);
      const faction = gameRandom.chance.pickone(factions);
      const galaxy = gameRandom.chance.pickone(galaxies);
      const sector = gameRandom.chance.pickone(sectors);
      
      // Generate realistic stats based on station type
      const stats = this.generateStationStats(stationType);
      
      const prompt = `Generate 1 space station for corporate space logistics game.

IMPORTANT: Return ONLY a JSON object. No other text.

Station type: ${stationType}
Faction: ${faction}
Galaxy: ${galaxy}
Sector: ${sector}
Population: ~${stats.population}
Security level: ${stats.securityLevel}% (affects bureaucracy and safety)

Must have: name, description

Make it feel dysfunctional with corporate dystopian humor. Focus on workplace frustrations and bureaucratic absurdity.

Example:
{"name": "Efficiency Station Gamma-7", "description": "Massive industrial complex producing essential corporate widgets with mandatory productivity monitoring"}

Generate creative content only:`;

      const result = await this.callLLM(prompt);
      if (result) {
        results.push({
          name: result.name,
          galaxy,
          sector,
          station_type: stationType,
          faction,
          population: stats.population,
          security_level: stats.securityLevel,
          description: result.description,
          docking_fee: stats.dockingFee,
          fuel_price: stats.fuelPrice,
          repair_quality: stats.repairQuality
        });
      }
    }

    return results;
  }

  /**
   * Generate station stats based on type using seeded random
   */
  generateStationStats(stationType) {
    const baseStats = {
      mining: { popMin: 5000, popMax: 30000, secMin: 30, secMax: 70 },
      research: { popMin: 1000, popMax: 8000, secMin: 70, secMax: 95 },
      trade: { popMin: 20000, popMax: 100000, secMin: 40, secMax: 80 },
      industrial: { popMin: 10000, popMax: 50000, secMin: 25, secMax: 60 },
      military: { popMin: 5000, popMax: 25000, secMin: 85, secMax: 99 },
      civilian: { popMin: 15000, popMax: 75000, secMin: 60, secMax: 90 },
      prison: { popMin: 2000, popMax: 15000, secMin: 95, secMax: 99 },
      agricultural: { popMin: 3000, popMax: 20000, secMin: 40, secMax: 75 }
    };

    const stats = baseStats[stationType] || baseStats.civilian;
    
    return {
      population: gameRandom.chance.integer({ min: stats.popMin, max: stats.popMax }),
      securityLevel: gameRandom.chance.integer({ min: stats.secMin, max: stats.secMax }),
      dockingFee: gameRandom.chance.integer({ min: 25, max: 300 }),
      fuelPrice: gameRandom.chance.floating({ min: 35, max: 80, fixed: 2 }),
      repairQuality: gameRandom.chance.integer({ min: 20, max: 95 }),
      blackMarket: gameRandom.chance.integer({ min: 5, max: 70 }),
      corruption: gameRandom.chance.integer({ min: 10, max: 85 })
    };
  }

  /**
   * Generate mission types with corporate absurdity
   */
  async generateMissions(count = 25) {
    const missionTypes = ['transport', 'retrieval', 'investigation', 'escort', 'repair', 'diplomatic', 'salvage'];
    
    const prompt = `Generate exactly ${count} space logistics missions with corporate dystopian humor.

IMPORTANT: Return ONLY a JSON array of objects. No other text.

Each object must have: title, description, mission_type, issuing_faction, reward_credits, hidden_complications, bureaucratic_catch

Mission types: ${missionTypes.join(', ')}

Example format:
[
  {
    "title": "Critical Widget Replacement Initiative",
    "description": "Transport 'high-priority' replacement widget to Efficiency Station Gamma-7 within 72 hours",
    "mission_type": "transport",
    "issuing_faction": "Corporate",
    "reward_credits": 850,
    "hidden_complications": "Widget is identical to widgets already on station, but this one has 'improved efficiency metrics' (slightly different color)",
    "bureaucratic_catch": "Delivery must be made to Widget Receiving Department, which is only open Tuesdays between 2-3 PM"
  }
]

Generate ${count} missions with varying difficulty and absurdity. Return JSON array only:`;

    return await this.generateBatchContent(prompt, count, 'missions');
  }

  /**
   * Generate ship components and equipment
   */
  async generateShipComponents(count = 30) {
    const componentTypes = ['engine', 'weapon', 'shield', 'sensor', 'cargo', 'life_support', 'communication'];
    
    const prompt = `Generate ${count} ship components for space logistics vessels. Corporate-issued equipment with planned obsolescence and bureaucratic licensing.

Component types: ${componentTypes.join(', ')}

For each component, create JSON with: name, component_type, description, base_cost, maintenance_nightmare, license_required, failure_modes

Example:
{
  "name": "SynerTech Mark-IV 'Reliable' Engine Module",
  "component_type": "engine", 
  "description": "Standard-issue propulsion system with 'improved efficiency' (actually same as Mark-III but costs 30% more)",
  "base_cost": 15000,
  "maintenance_nightmare": "Requires proprietary SynerTech tools (sold separately) and certified technician with Level-7 clearance",
  "license_required": "Engine Operation Permit (Class-B), Maintenance Authorization (Form 18-C), Environmental Impact Assessment",
  "failure_modes": "Spontaneous shutdown when detecting non-licensed fuel additives, mysteriously expires exactly 1 day after warranty"
}

Generate ${count} components with corporate dystopian dysfunction:`;

    return await this.generateBatchContent(prompt, count, 'components');
  }

  /**
   * Call LLM and parse JSON response
   */
  async callLLM(prompt) {
    if (!this.llmConfig.isConfigured()) {
      throw new Error('LLM not configured');
    }

    try {
      const response = await fetch(this.llmConfig.getEndpoint(), {
        method: 'POST',
        headers: this.llmConfig.config.headers,
        body: JSON.stringify({
          model: this.llmConfig.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Try to parse as direct JSON first
      try {
        return JSON.parse(content);
      } catch (e) {
        // If that fails, try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in LLM response');
      }
    } catch (error) {
      console.error('LLM generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate batch content with retry logic
   */
  async generateBatchContent(prompt, count, type) {
    const results = [];
    const batchSize = 5; // Generate in smaller batches to avoid overwhelming LLM
    
    for (let i = 0; i < count; i += batchSize) {
      const currentBatch = Math.min(batchSize, count - i);
      const batchPrompt = prompt.replace(new RegExp(`Generate ${count}`, 'g'), `Generate ${currentBatch}`);
      
      try {
        const result = await this.callLLM(batchPrompt);
        if (Array.isArray(result)) {
          results.push(...result);
        } else {
          results.push(result);
        }
        
        // Small delay between requests to be nice to local LLM
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to generate ${type} batch ${i}-${i + currentBatch}:`, error.message);
      }
    }
    
    return results;
  }

}