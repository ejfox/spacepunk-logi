/**
 * Gossip Engine - Manages the lifecycle and spread of crew gossip
 * 
 * This engine handles:
 * - Gossip generation based on crew state
 * - Spread mechanics through social networks
 * - Effect calculation on crew performance
 * - LLM integration for narrative details
 * - Fallback templates when LLM unavailable
 */

import { GOSSIP_ARCHETYPES, GossipStateMachine, generateGossipFromArchetype, CORPORATE_GOSSIP_TEMPLATES } from './GossipArchetypes.js';

export class GossipEngine {
  constructor(crewRepository, llmService = null) {
    this.crewRepository = crewRepository;
    this.llmService = llmService;
    this.activeGossip = new Map(); // gossipId -> GossipStateMachine
    this.gossipHistory = [];
    this.socialNetwork = new Map(); // crewId -> Set of connected crewIds
  }

  /**
   * Main tick function - called every game cycle
   */
  async tick() {
    // Update existing gossip
    for (const [gossipId, stateMachine] of this.activeGossip.entries()) {
      stateMachine.tick();
      await this.spreadGossip(gossipId);
      await this.applyGossipEffects(gossipId);
    }

    // Check for new gossip triggers
    await this.checkGossipTriggers();

    // Clean up resolved gossip
    this.cleanupResolvedGossip();
  }

  /**
   * Check crew state for conditions that trigger new gossip
   */
  async checkGossipTriggers() {
    const crew = await this.crewRepository.getAllCrew();
    
    for (const member of crew) {
      // Office Romance triggers
      if (this.checkRomanceTrigger(member, crew)) {
        await this.createGossip('OFFICE_ROMANCE', member, crew);
      }

      // Competence Crisis triggers
      if (this.checkCompetenceTrigger(member)) {
        await this.createGossip('COMPETENCE_CRISIS', member);
      }

      // Health Scare triggers
      if (this.checkHealthTrigger(member)) {
        await this.createGossip('HEALTH_SCARE', member);
      }

      // Add more trigger checks...
    }
  }

  /**
   * Romance trigger - based on relationship scores and traits
   */
  checkRomanceTrigger(member, allCrew) {
    // Skip if already in active romance gossip
    if (this.hasActiveGossipType(member.id, 'OFFICE_ROMANCE')) return false;

    // Check for high relationship scores
    for (const other of allCrew) {
      if (other.id === member.id) continue;
      
      const relationship = member.relationships?.[other.id] || 0;
      const chemistry = this.calculateChemistry(member, other);
      
      if (relationship > 0.7 && chemistry > 0.6 && Math.random() < 0.1) {
        return { target: other };
      }
    }
    
    return false;
  }

  /**
   * Competence trigger - based on recent failures
   */
  checkCompetenceTrigger(member) {
    const recentFailures = member.performance?.recentFailures || 0;
    const stressLevel = member.traits?.stress || 0;
    
    // Higher chance if multiple failures and high stress
    const triggerChance = (recentFailures * 0.1) + (stressLevel * 0.05);
    
    return Math.random() < triggerChance && !this.hasActiveGossipType(member.id, 'COMPETENCE_CRISIS');
  }

  /**
   * Health trigger - based on performance degradation
   */
  checkHealthTrigger(member) {
    const performanceDropped = member.performance?.trend === 'declining';
    const age = member.age || 30;
    const stressLevel = member.traits?.stress || 0;
    
    // Higher chance for older, stressed crew with declining performance
    const triggerChance = performanceDropped ? 
      (age > 40 ? 0.15 : 0.05) + (stressLevel * 0.1) : 0.01;
    
    return Math.random() < triggerChance && !this.hasActiveGossipType(member.id, 'HEALTH_SCARE');
  }

  /**
   * Create new gossip instance
   */
  async createGossip(archetypeId, subject, additionalSubjects = []) {
    const gossipData = generateGossipFromArchetype(
      archetypeId,
      {
        subjectA: subject.id,
        subjectB: additionalSubjects[0]?.id,
        subjectC: additionalSubjects[1]?.id
      }
    );

    // Generate initial narrative content
    if (this.llmService) {
      gossipData.narrative = await this.generateGossipNarrative(archetypeId, gossipData);
    } else {
      gossipData.narrative = this.generateFallbackNarrative(archetypeId, gossipData);
    }

    const stateMachine = new GossipStateMachine(gossipData);
    this.activeGossip.set(gossipData.id, stateMachine);

    // Initial spread to close connections
    await this.initialSpread(gossipData);

    return gossipData;
  }

  /**
   * Generate gossip narrative using LLM
   */
  async generateGossipNarrative(archetypeId, gossipData) {
    const archetype = GOSSIP_ARCHETYPES[archetypeId];
    const subjects = await this.getSubjectDetails(gossipData.subjects);
    
    const prompt = `
      Generate specific gossip details for a spaceship crew drama.
      
      Archetype: ${archetype.name}
      Template: ${archetype.template}
      Current Phase: ${gossipData.phase}
      
      Subjects:
      ${Object.entries(subjects).map(([key, subject]) => 
        `${key}: ${subject.name} (${subject.position}, ${subject.traits.join(', ')})`
      ).join('\n')}
      
      Generate 2-3 specific behaviors or incidents that crew members have noticed.
      Keep it corporate, darkly humorous, and workplace-appropriate.
      Focus on mundane details that reveal the larger drama.
    `;

    try {
      const response = await this.llmService.generate(prompt);
      return this.parseGossipNarrative(response);
    } catch (error) {
      console.error('LLM generation failed, using fallback:', error);
      return this.generateFallbackNarrative(archetypeId, gossipData);
    }
  }

  /**
   * Fallback narrative generation
   */
  generateFallbackNarrative(archetypeId, gossipData) {
    const archetype = GOSSIP_ARCHETYPES[archetypeId];
    const hooks = archetype.llmHooks;
    
    // Randomly select from available hooks
    const behaviors = this.selectRandom(hooks.behaviors || [], 2);
    const complications = this.selectRandom(hooks.complications || [], 1);
    
    return {
      observations: behaviors,
      complications: complications,
      phase: gossipData.phase
    };
  }

  /**
   * Spread gossip through social network
   */
  async spreadGossip(gossipId) {
    const stateMachine = this.activeGossip.get(gossipId);
    if (!stateMachine) return;
    
    const gossip = stateMachine.gossip;
    const archetype = stateMachine.archetype;
    
    // Get current believers who will spread
    const spreaders = this.getActiveSpreaders(gossip, archetype);
    
    for (const spreaderId of spreaders) {
      const connections = this.socialNetwork.get(spreaderId) || new Set();
      
      for (const targetId of connections) {
        if (this.shouldSpreadTo(gossip, spreaderId, targetId, archetype)) {
          await this.infectWithGossip(gossip, targetId, spreaderId);
        }
      }
    }
  }

  /**
   * Determine if gossip should spread to target
   */
  shouldSpreadTo(gossip, spreaderId, targetId, archetype) {
    // Already knows
    if (gossip.believers.includes(targetId) || gossip.deniers.includes(targetId)) {
      return false;
    }

    const baseChance = archetype.spreadMechanics.spreadChance;
    let chance = baseChance;

    // Modify based on spreader type
    const spreader = this.getCrewMember(spreaderId);
    if (spreader.traits?.includes('gossip')) chance += 0.2;
    if (spreader.traits?.includes('discrete')) chance -= 0.3;

    // Modify based on relationship
    const relationship = spreader.relationships?.[targetId] || 0.5;
    chance *= relationship;

    // Phase-specific modifiers
    if (gossip.phase === 'OBVIOUS' || gossip.phase === 'CRISIS') {
      chance += 0.3;
    }

    return Math.random() < chance;
  }

  /**
   * Apply gossip effects to crew
   */
  async applyGossipEffects(gossipId) {
    const stateMachine = this.activeGossip.get(gossipId);
    if (!stateMachine) return;
    
    const gossip = stateMachine.gossip;
    const archetype = stateMachine.archetype;
    const effects = this.calculateCurrentEffects(gossip, archetype);
    
    // Apply to primary subjects
    for (const [subjectKey, subjectId] of Object.entries(gossip.subjects)) {
      if (subjectId) {
        await this.applyEffectsToCrewMember(subjectId, effects.primary);
      }
    }
    
    // Apply cascade effects to believers/participants
    for (const believerId of gossip.believers) {
      await this.applyEffectsToCrewMember(believerId, effects.cascade);
    }
  }

  /**
   * Calculate current effects based on phase and spread
   */
  calculateCurrentEffects(gossip, archetype) {
    const phase = gossip.phase;
    const effects = archetype.gameplayEffects;
    
    // Select effects based on current phase
    let primary = {};
    let cascade = {};
    
    switch (phase) {
      case 'REVEALED':
      case 'OBVIOUS':
      case 'CRISIS':
        primary = effects.negative || effects.direct || {};
        cascade = effects.cascade || {};
        break;
      
      case 'RESOLVED':
      case 'ACCEPTED':
      case 'STABLE':
        primary = effects.positive || {};
        cascade = { stress: -0.1 }; // Relief
        break;
        
      default:
        primary = effects.hidden || effects.direct || {};
        cascade = effects.cascade || {};
    }
    
    // Scale by spread percentage
    const spreadPercentage = gossip.believers.length / this.getTotalCrewSize();
    const scaling = 0.5 + (spreadPercentage * 0.5);
    
    return {
      primary: this.scaleEffects(primary, scaling),
      cascade: this.scaleEffects(cascade, scaling * 0.5)
    };
  }

  /**
   * Build social network from crew relationships
   */
  async buildSocialNetwork() {
    const crew = await this.crewRepository.getAllCrew();
    
    for (const member of crew) {
      const connections = new Set();
      
      // Add department members
      const deptMembers = crew.filter(c => c.department === member.department);
      deptMembers.forEach(c => connections.add(c.id));
      
      // Add high relationship scores
      if (member.relationships) {
        Object.entries(member.relationships).forEach(([otherId, score]) => {
          if (score > 0.4) connections.add(otherId);
        });
      }
      
      // Add shift partners
      if (member.shift) {
        const shiftPartners = crew.filter(c => c.shift === member.shift);
        shiftPartners.forEach(c => connections.add(c.id));
      }
      
      // Remove self
      connections.delete(member.id);
      
      this.socialNetwork.set(member.id, connections);
    }
  }

  /**
   * Helper methods
   */
  hasActiveGossipType(crewId, archetypeId) {
    for (const [_, stateMachine] of this.activeGossip) {
      if (stateMachine.gossip.archetypeId === archetypeId) {
        const subjects = Object.values(stateMachine.gossip.subjects);
        if (subjects.includes(crewId)) return true;
      }
    }
    return false;
  }

  selectRandom(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  scaleEffects(effects, scaling) {
    const scaled = {};
    for (const [key, value] of Object.entries(effects)) {
      if (typeof value === 'number') {
        scaled[key] = value * scaling;
      } else {
        scaled[key] = value;
      }
    }
    return scaled;
  }

  calculateChemistry(memberA, memberB) {
    // Simple chemistry calculation based on compatible traits
    const compatibleTraits = [
      ['outgoing', 'shy'],
      ['organized', 'creative'],
      ['ambitious', 'supportive']
    ];
    
    let chemistry = 0.5;
    
    // Check trait compatibility
    for (const [traitA, traitB] of compatibleTraits) {
      if ((memberA.traits?.includes(traitA) && memberB.traits?.includes(traitB)) ||
          (memberA.traits?.includes(traitB) && memberB.traits?.includes(traitA))) {
        chemistry += 0.15;
      }
    }
    
    // Same department bonus
    if (memberA.department === memberB.department) chemistry += 0.1;
    
    // Age similarity
    const ageDiff = Math.abs((memberA.age || 30) - (memberB.age || 30));
    if (ageDiff < 5) chemistry += 0.1;
    
    return Math.min(chemistry, 1.0);
  }

  cleanupResolvedGossip() {
    const resolved = [];
    
    for (const [gossipId, stateMachine] of this.activeGossip.entries()) {
      const terminalPhases = ['RESOLVED', 'INTEGRATED', 'STABLE', 'ABANDONED', 'FORGOTTEN'];
      
      if (terminalPhases.includes(stateMachine.currentPhase)) {
        resolved.push(gossipId);
        this.gossipHistory.push({
          ...stateMachine.gossip,
          resolvedAt: Date.now(),
          finalPhase: stateMachine.currentPhase
        });
      }
    }
    
    // Remove resolved gossip
    resolved.forEach(id => this.activeGossip.delete(id));
  }

  async getSubjectDetails(subjects) {
    const details = {};
    
    for (const [key, id] of Object.entries(subjects)) {
      if (id) {
        const crew = await this.crewRepository.getCrewById(id);
        details[key] = {
          name: crew.name,
          position: crew.position,
          traits: crew.traits || []
        };
      }
    }
    
    return details;
  }

  getCrewMember(id) {
    // This would be cached in production
    return { id, traits: [], relationships: {} };
  }

  getTotalCrewSize() {
    return this.socialNetwork.size || 20; // Default crew size
  }

  getActiveSpreaders(gossip, archetype) {
    const spreaders = new Set(gossip.believers);
    
    // Add role-based spreaders
    const primarySpreaders = archetype.spreadMechanics.primarySpreaders;
    
    // This would check actual crew roles
    // For now, return believers
    return Array.from(spreaders);
  }

  async infectWithGossip(gossip, targetId, spreaderId) {
    // Determine if target believes or denies
    const believeChance = 0.7; // Base chance, would be modified by traits
    
    if (Math.random() < believeChance) {
      gossip.believers.push(targetId);
    } else {
      gossip.deniers.push(targetId);
    }
    
    gossip.spreadTo.push({
      from: spreaderId,
      to: targetId,
      timestamp: Date.now()
    });
  }

  async applyEffectsToCrewMember(crewId, effects) {
    // This would actually update the crew member's stats
    // For now, just log
    console.log(`Applying effects to ${crewId}:`, effects);
  }

  /**
   * Get current gossip summary for display
   */
  getGossipSummary() {
    const summary = [];
    
    for (const [_, stateMachine] of this.activeGossip.entries()) {
      const gossip = stateMachine.gossip;
      const archetype = stateMachine.archetype;
      
      summary.push({
        id: gossip.id,
        type: archetype.name,
        phase: gossip.phase,
        spread: (gossip.believers.length / this.getTotalCrewSize()) * 100,
        subjects: gossip.subjects,
        narrative: gossip.narrative
      });
    }
    
    return summary;
  }
}

export default GossipEngine;