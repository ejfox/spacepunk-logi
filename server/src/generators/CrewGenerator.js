import { v4 as uuidv4 } from 'uuid';
import { gameRandom } from '../utils/seededRandom.js';

/**
 * CrewGenerator - Generates specialized crew members with meaningful gameplay effects
 * 
 * CREW TYPES:
 * - Engineer: +25% fuel efficiency, reduces fuel decay
 * - Smuggler: +50% illegal cargo profits, reduces heat from smuggling
 * - Diplomat: -50% heat from politics, +bonus reputation gains
 */
export class CrewGenerator {
  constructor() {
    this.crewTypes = {
      engineer: {
        name: 'Engineer',
        description: 'Skilled in ship systems and maintenance',
        bonuses: {
          fuel_efficiency: 0.25,  // +25% fuel efficiency
          fuel_decay_reduction: 0.25,  // -25% fuel decay
          engineering_bonus: 20  // +20 engineering skill
        },
        salary_multiplier: 1.5,  // Engineers cost 50% more
        skills: {
          engineering: { min: 60, max: 90 },
          piloting: { min: 20, max: 50 },
          social: { min: 20, max: 60 },
          combat: { min: 10, max: 40 }
        },
        traits: {
          work_ethic: { min: 70, max: 95 },  // Engineers are hardworking
          loyalty: { min: 60, max: 85 },     // Reliable crew
          ambition: { min: 30, max: 70 }     // Moderate ambition
        }
      },
      
      smuggler: {
        name: 'Smuggler',
        description: 'Expert in avoiding authorities and black market dealings',
        bonuses: {
          illegal_cargo_profit: 0.50,  // +50% illegal cargo profits
          heat_reduction_smuggling: 0.40,  // -40% heat from smuggling
          social_bonus: 15  // +15 social skill for talking out of trouble
        },
        salary_multiplier: 1.3,  // Smugglers cost 30% more
        skills: {
          engineering: { min: 20, max: 60 },
          piloting: { min: 50, max: 80 },  // Need good piloting for escapes
          social: { min: 60, max: 90 },    // Need to talk their way out
          combat: { min: 40, max: 70 }     // Dangerous profession
        },
        traits: {
          bravery: { min: 60, max: 90 },     // Takes risks
          loyalty: { min: 40, max: 70 },     // Questionable loyalty
          ambition: { min: 70, max: 95 }     // Ambitious and greedy
        }
      },
      
      diplomat: {
        name: 'Diplomat',
        description: 'Skilled in negotiations and political maneuvering',
        bonuses: {
          heat_reduction_politics: 0.50,  // -50% heat from political actions
          reputation_bonus: 0.30,  // +30% reputation gains
          social_bonus: 25  // +25 social skill
        },
        salary_multiplier: 1.4,  // Diplomats cost 40% more
        skills: {
          engineering: { min: 10, max: 40 },
          piloting: { min: 20, max: 50 },
          social: { min: 70, max: 95 },    // Exceptional social skills
          combat: { min: 10, max: 30 }     // Avoid violence
        },
        traits: {
          bravery: { min: 40, max: 70 },     // Moderate courage
          loyalty: { min: 70, max: 90 },     // Very loyal when treated well
          ambition: { min: 60, max: 85 }     // Politically ambitious
        }
      },
      
      // General crew for comparison (no bonuses)
      general: {
        name: 'General Crew',
        description: 'Basic crew member with no specializations',
        bonuses: {},
        salary_multiplier: 1.0,  // Base salary
        skills: {
          engineering: { min: 20, max: 70 },
          piloting: { min: 20, max: 70 },
          social: { min: 20, max: 70 },
          combat: { min: 20, max: 70 }
        },
        traits: {
          bravery: { min: 30, max: 80 },
          loyalty: { min: 40, max: 80 },
          ambition: { min: 30, max: 80 }
        }
      }
    };
  }

  /**
   * Generate a crew member of a specific type
   * @param {string} type - The crew type ('engineer', 'smuggler', 'diplomat', 'general')
   * @param {object} overrides - Optional overrides for specific attributes
   * @returns {object} Generated crew member data
   */
  generateCrew(type = 'general', overrides = {}) {
    const crewType = this.crewTypes[type];
    if (!crewType) {
      throw new Error(`Unknown crew type: ${type}`);
    }

    // Generate basic attributes
    const { name, culture } = gameRandom.generateCrewName();
    const homeworld = this.generateHomeworld(culture);
    const age = gameRandom.chance.integer({ min: 22, max: 55 });
    
    // Generate skills based on crew type
    const skills = this.generateTypeSkills(crewType);
    
    // Generate traits based on crew type
    const traits = this.generateTypeTraits(crewType);
    
    // Calculate hiring cost based on type and skills
    const baseCost = this.calculateHiringCost(skills, crewType.salary_multiplier);
    
    // Generate backstory based on crew type
    const backstory = this.generateBackstory(type, name, culture, homeworld);
    
    // Generate employment notes highlighting the crew member's specialization
    const employmentNotes = this.generateEmploymentNotes(type, crewType);

    const crewMember = {
      id: uuidv4(),
      name,
      age,
      homeworld,
      culture,
      cultural_background: culture,
      crew_type: type,
      crew_type_name: crewType.name,
      crew_type_description: crewType.description,
      crew_bonuses: crewType.bonuses,
      
      // Skills
      skill_engineering: skills.engineering,
      skill_piloting: skills.piloting,
      skill_social: skills.social,
      skill_combat: skills.combat,
      
      // Core traits
      trait_bravery: traits.bravery,
      trait_loyalty: traits.loyalty,
      trait_ambition: traits.ambition,
      trait_work_ethic: traits.work_ethic,
      
      // Jungian traits (use existing generation)
      trait_extroversion: traits.extroversion,
      trait_thinking: traits.thinking,
      trait_sensing: traits.sensing,
      trait_judging: traits.judging,
      
      // Archetypes (use existing generation)
      archetype_innocent: traits.innocent,
      archetype_sage: traits.sage,
      archetype_explorer: traits.explorer,
      archetype_outlaw: traits.outlaw,
      archetype_magician: traits.magician,
      archetype_hero: traits.hero,
      archetype_lover: traits.lover,
      archetype_jester: traits.jester,
      archetype_caregiver: traits.caregiver,
      archetype_creator: traits.creator,
      archetype_ruler: traits.ruler,
      archetype_orphan: traits.orphan,
      dominant_archetype: traits.dominant_archetype,
      
      // Status
      health: gameRandom.chance.integer({ min: 90, max: 100 }),
      morale: gameRandom.chance.integer({ min: 60, max: 90 }),
      fatigue: gameRandom.chance.integer({ min: 10, max: 30 }),
      
      // Financial
      hiring_cost: baseCost,
      salary: Math.floor(baseCost * 0.1), // 10% of hiring cost per tick
      
      // Background
      backstory,
      employment_notes: employmentNotes,
      
      // Apply any overrides
      ...overrides
    };

    return crewMember;
  }

  /**
   * Generate skills based on crew type constraints
   */
  generateTypeSkills(crewType) {
    const skills = {};
    
    Object.entries(crewType.skills).forEach(([skillName, range]) => {
      skills[skillName] = gameRandom.chance.integer(range);
    });
    
    return skills;
  }

  /**
   * Generate traits based on crew type constraints
   */
  generateTypeTraits(crewType) {
    // Start with standard trait generation
    const baseTraits = gameRandom.generateCrewTraits();
    
    // Override specific traits based on crew type
    const typeTraits = { ...baseTraits };
    
    Object.entries(crewType.traits).forEach(([traitName, range]) => {
      typeTraits[traitName] = gameRandom.chance.integer(range);
    });
    
    return typeTraits;
  }

  /**
   * Calculate hiring cost based on skills and type multiplier
   */
  calculateHiringCost(skills, multiplier) {
    const totalSkills = Object.values(skills).reduce((sum, skill) => sum + skill, 0);
    const baseCost = 300 + (totalSkills / 4) * 3;
    const costVariation = gameRandom.chance.integer({ min: -50, max: 50 });
    return Math.floor((baseCost + costVariation) * multiplier);
  }

  /**
   * Generate appropriate homeworld based on culture
   */
  generateHomeworld(culture) {
    const homeworlds = {
      Corporate: ['Earth', 'Mars', 'Luna', 'New Geneva'],
      Belter: ['Asteroid-7', 'Ceres Station', 'Vesta Mining'],
      Spacer: ['Proxima Base', 'Deep Space Station', 'Wanderer Fleet'],
      Agricultural: ['Europa', 'Titan', 'Ganymede'],
      Military: ['Phobos', 'Callisto', 'Mars Command']
    };
    
    const culturalWorlds = homeworlds[culture] || homeworlds.Corporate;
    return gameRandom.chance.pickone(culturalWorlds);
  }

  /**
   * Generate backstory based on crew type
   */
  generateBackstory(type, name, culture, homeworld) {
    const backstories = {
      engineer: [
        `${name} spent years maintaining life support systems on ${homeworld}. Left after a reactor incident that wasn't their fault, but management needed someone to blame.`,
        `Former shipyard worker from ${homeworld}. Got tired of Corporate cutting corners on safety equipment. Still has nightmares about the hull breach.`,
        `${name} worked maintenance on freight haulers for a decade. Quit after discovering their supervisor was skimming the parts budget.`
      ],
      smuggler: [
        `${name} used to run legitimate cargo between systems until the Corporate authorities started 'taxing' everything. Now they prefer the shadows.`,
        `Former customs officer who got tired of being the only honest person in the department. Knows all the inspection loopholes.`,
        `${name} grew up on ${homeworld} where asking questions got you disappeared. Learned early that some cargo is better left uninventoried.`
      ],
      diplomat: [
        `${name} worked in the ${culture} diplomatic corps until a political scandal left them unemployed. Still has contacts in high places.`,
        `Former trade negotiator who got blacklisted for refusing to sign off on a clearly fraudulent deal. Integrity doesn't pay the bills.`,
        `${name} spent years mediating disputes between crews. Left the mediation service after Corporate 'restructured' their department.`
      ],
      general: [
        `${name} is a standard crew member from ${homeworld}. Their employment history shows typical Corporate job-hopping.`,
        `Former ${culture} worker looking for steady employment. References are average but show up on time.`,
        `${name} has worked various positions across the sector. Nothing remarkable, but gets the job done.`
      ]
    };
    
    const typeBackstories = backstories[type] || backstories.general;
    return gameRandom.chance.pickone(typeBackstories);
  }

  /**
   * Generate employment notes highlighting specialization
   */
  generateEmploymentNotes(type, crewType) {
    const notes = {
      engineer: [
        'WARNING: Will complain about substandard equipment. Knows the difference between genuine and knockoff parts.',
        'NOTE: Has strong opinions about proper maintenance schedules. May refuse unsafe assignments.',
        'SKILL: Can perform emergency repairs under pressure. Saved previous ship from catastrophic failure.'
      ],
      smuggler: [
        'WARNING: May have contacts in questionable organizations. Background check inconclusive.',
        'NOTE: Unusually knowledgeable about customs procedures and inspection schedules.',
        'SKILL: Excellent at creative cargo manifesting. Previous employer reported no inspection issues.'
      ],
      diplomat: [
        'WARNING: May attempt to negotiate salary increases. Has connections in regulatory agencies.',
        'NOTE: Speaks fluent Corporate and can translate technical issues into management language.',
        'SKILL: Excellent at defusing crew conflicts. Previous ships reported 40% reduction in disciplinary issues.'
      ],
      general: [
        'Standard crew member. No special certifications or notable incidents.',
        'Average performance reviews. Shows up on time, follows basic instructions.',
        'Generic corporate worker. Completed mandatory safety training.'
      ]
    };
    
    const typeNotes = notes[type] || notes.general;
    return gameRandom.chance.pickone(typeNotes);
  }

  /**
   * Generate a mixed crew pool for hiring
   * @param {number} count - Total number of crew to generate
   * @returns {array} Array of crew members with mixed types
   */
  generateCrewPool(count = 8) {
    const crew = [];
    
    // Distribution: 30% engineers, 25% smugglers, 20% diplomats, 25% general
    const typeDistribution = [
      { type: 'engineer', weight: 30 },
      { type: 'smuggler', weight: 25 },
      { type: 'diplomat', weight: 20 },
      { type: 'general', weight: 25 }
    ];
    
    for (let i = 0; i < count; i++) {
      const roll = gameRandom.chance.integer({ min: 1, max: 100 });
      let cumulative = 0;
      let selectedType = 'general';
      
      for (const { type, weight } of typeDistribution) {
        cumulative += weight;
        if (roll <= cumulative) {
          selectedType = type;
          break;
        }
      }
      
      crew.push(this.generateCrew(selectedType));
    }
    
    return crew;
  }

  /**
   * Get crew type information for UI display
   */
  getCrewTypeInfo(type) {
    const crewType = this.crewTypes[type];
    if (!crewType) return null;
    
    return {
      name: crewType.name,
      description: crewType.description,
      bonuses: crewType.bonuses,
      salary_multiplier: crewType.salary_multiplier
    };
  }

  /**
   * Get all available crew types for UI
   */
  getAllCrewTypes() {
    return Object.keys(this.crewTypes).map(type => ({
      type,
      ...this.getCrewTypeInfo(type)
    }));
  }
}

export default CrewGenerator;