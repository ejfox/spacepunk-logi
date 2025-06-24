/**
 * Gossip Narrative Generator
 * 
 * Specialized LLM integration for generating context-aware gossip content
 * with fallback templates maintaining corporate dark humor
 */

import { GOSSIP_ARCHETYPES, CORPORATE_GOSSIP_TEMPLATES } from './GossipArchetypes.js';

export class GossipNarrativeGenerator {
  constructor(llmService = null) {
    this.llmService = llmService;
  }

  /**
   * Generate gossip narrative for ship's log entries
   */
  async generateShipLogNarrative(gossipSummaries, tickData) {
    if (!this.llmService) {
      return this.generateFallbackShipLog(gossipSummaries, tickData);
    }

    const prompt = `
      Generate ship's log entries about crew gossip and drama. Write in a dry, corporate tone
      that treats incredible personal drama as mundane workplace issues.
      
      Current gossip:
      ${gossipSummaries.map(g => `- ${g.type}: ${g.phase} phase, ${g.spread}% crew aware`).join('\n')}
      
      Tick: ${tickData.currentTick}
      Date: ${tickData.date}
      
      Create 2-3 log entries that weave these dramas into routine ship operations.
      Focus on how personal drama affects productivity metrics and compliance.
      Include bureaucratic language and corporate euphemisms.
    `;

    try {
      const response = await this.llmService.generate(prompt);
      return this.formatShipLogEntries(response);
    } catch (error) {
      console.error('LLM generation failed:', error);
      return this.generateFallbackShipLog(gossipSummaries, tickData);
    }
  }

  /**
   * Generate specific gossip details for a phase transition
   */
  async generatePhaseTransition(gossip, oldPhase, newPhase) {
    const archetype = GOSSIP_ARCHETYPES[gossip.archetypeId];
    
    if (!this.llmService) {
      return this.generateFallbackTransition(gossip, oldPhase, newPhase);
    }

    const prompt = `
      Generate a brief corporate memo about a gossip development.
      
      Gossip type: ${archetype.name}
      Transition: ${oldPhase} → ${newPhase}
      
      Write 1-2 sentences in corporate speak that reveals this development
      while maintaining plausible deniability. Use passive voice and bureaucratic language.
    `;

    try {
      const response = await this.llmService.generate(prompt);
      return response.trim();
    } catch (error) {
      return this.generateFallbackTransition(gossip, oldPhase, newPhase);
    }
  }

  /**
   * Generate crew dialogue about gossip
   */
  async generateGossipDialogue(gossip, speaker, context) {
    const archetype = GOSSIP_ARCHETYPES[gossip.archetypeId];
    
    if (!this.llmService) {
      return this.generateFallbackDialogue(gossip, speaker, context);
    }

    const prompt = `
      Generate a single line of dialogue about workplace gossip.
      
      Speaker: ${speaker.name} (${speaker.traits.join(', ')})
      Gossip: ${archetype.template}
      Context: ${context}
      Phase: ${gossip.phase}
      
      The dialogue should:
      - Sound like water cooler talk in a dystopian corporation
      - Reveal information while maintaining plausible deniability
      - Match the speaker's personality traits
      - Be under 20 words
    `;

    try {
      const response = await this.llmService.generate(prompt);
      return response.trim();
    } catch (error) {
      return this.generateFallbackDialogue(gossip, speaker, context);
    }
  }

  /**
   * Fallback generation methods
   */
  generateFallbackShipLog(gossipSummaries, tickData) {
    const entries = [];
    
    for (const gossip of gossipSummaries.slice(0, 3)) {
      const template = this.selectRandomTemplate('log', gossip);
      entries.push(this.fillTemplate(template, gossip, tickData));
    }
    
    return entries;
  }

  generateFallbackTransition(gossip, oldPhase, newPhase) {
    const transitions = {
      'STRUGGLING_NOTICED': 'Performance Review Committee has flagged concerning patterns in {subject}\'s productivity metrics.',
      'NOTICED_HELPED': 'Peer Support Protocol activated for {subject} following efficiency assessment.',
      'SUSPECTED_INVESTIGATING': 'Internal Audit has opened routine inquiry RE: {subject}\'s external communications.',
      'PRIVATE_SHARING': '{subject} utilized Employee Assistance Program resources during scheduled break.',
      'COMPETING_INTENSIFYING': 'Productivity surge detected in {department} promotion candidacy pool.',
      'OBVIOUS_CONFESSION': 'HR Form 114-B (Interpersonal Disclosure) filed by involved parties.',
      'CRISIS_INTERVENTION': 'Mandatory Wellness Protocol initiated for {subject} per Corporate Care Guidelines.'
    };
    
    const key = `${oldPhase}_${newPhase}`;
    return transitions[key] || `Status update: ${gossip.archetypeId} situation has progressed to ${newPhase} phase.`;
  }

  generateFallbackDialogue(gossip, speaker, context) {
    const dialogueTemplates = {
      gossip_trait: [
        "Did you hear about the {phase} situation in {department}?",
        "I'm not saying anything, but check the shift schedules...",
        "Someone should really update their privacy settings.",
        "The vending machine saw everything, just saying."
      ],
      concerned_trait: [
        "I'm worried about {subject}, they seem... different.",
        "Maybe we should check if {subject} needs help?",
        "This can't be good for productivity metrics.",
        "Should someone talk to {subject} about this?"
      ],
      cynical_trait: [
        "Called it. Page 47 of the employee handbook.",
        "This is why we can't have nice things.",
        "Corporate's gonna love this in the quarterly.",
        "At least it's not my department this time."
      ],
      professional_trait: [
        "This matter requires discretion and proper channels.",
        "I'll be filing the appropriate concern forms.",
        "Let's maintain professional boundaries, shall we?",
        "HR has protocols for these situations."
      ]
    };
    
    const trait = speaker.traits.find(t => dialogueTemplates[`${t}_trait`]) || 'professional';
    const templates = dialogueTemplates[`${trait}_trait`] || dialogueTemplates.professional_trait;
    
    return this.selectRandom(templates);
  }

  /**
   * Template filling and formatting
   */
  fillTemplate(template, gossip, additionalData = {}) {
    let filled = template;
    
    // Replace archetype data
    const archetype = GOSSIP_ARCHETYPES[gossip.archetypeId];
    filled = filled.replace(/{phase}/g, gossip.phase);
    filled = filled.replace(/{type}/g, archetype.name);
    
    // Replace subject data
    Object.entries(gossip.subjects || {}).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    // Replace additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    return filled;
  }

  selectRandomTemplate(type, gossip) {
    const templates = {
      log: [
        "Productivity impact assessment ongoing regarding {type} incident (Phase: {phase}).",
        "Employee Relations has noted developing situation: {type} - monitoring for compliance.",
        "Shift efficiency down 12% in affected departments due to {type} distractions.",
        "Anonymous tip box yielding above-average submissions RE: {type} situation.",
        "Mandatory sensitivity training scheduled following {type} developments."
      ],
      spread: CORPORATE_GOSSIP_TEMPLATES.spread,
      denial: CORPORATE_GOSSIP_TEMPLATES.denial,
      confirmation: CORPORATE_GOSSIP_TEMPLATES.confirmation
    };
    
    const selectedTemplates = templates[type] || templates.log;
    return this.selectRandom(selectedTemplates);
  }

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  formatShipLogEntries(rawResponse) {
    // Parse LLM response into structured entries
    const lines = rawResponse.split('\n').filter(line => line.trim());
    
    return lines.map(line => ({
      text: line.trim(),
      type: 'gossip',
      severity: this.calculateSeverity(line)
    }));
  }

  calculateSeverity(logEntry) {
    const severityKeywords = {
      critical: ['crisis', 'emergency', 'immediate', 'critical'],
      high: ['concerning', 'significant', 'escalated', 'reported'],
      medium: ['noted', 'observed', 'developing', 'ongoing'],
      low: ['minor', 'routine', 'standard', 'normal']
    };
    
    const lowerEntry = logEntry.toLowerCase();
    
    for (const [severity, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(keyword => lowerEntry.includes(keyword))) {
        return severity;
      }
    }
    
    return 'medium';
  }

  /**
   * Generate gossip impact summary for reports
   */
  generateImpactSummary(gossipList) {
    const summary = {
      totalActive: gossipList.length,
      departmentMorale: this.calculateDepartmentImpact(gossipList, 'morale'),
      productivityImpact: this.calculateDepartmentImpact(gossipList, 'productivity'),
      riskAssessment: this.assessGossipRisks(gossipList),
      recommendations: this.generateRecommendations(gossipList)
    };
    
    return summary;
  }

  calculateDepartmentImpact(gossipList, metric) {
    const impacts = {};
    
    // Aggregate impacts by department
    // This would use actual crew data in production
    
    return impacts;
  }

  assessGossipRisks(gossipList) {
    const risks = [];
    
    for (const gossip of gossipList) {
      const archetype = GOSSIP_ARCHETYPES[gossip.archetypeId];
      
      // Check for high-risk phases
      const highRiskPhases = ['CRISIS', 'CONFRONTATION', 'BREAKDOWN', 'THEFT'];
      if (highRiskPhases.includes(gossip.phase)) {
        risks.push({
          type: archetype.name,
          severity: 'high',
          description: `${archetype.name} in critical phase`
        });
      }
    }
    
    return risks;
  }

  generateRecommendations(gossipList) {
    const recommendations = [];
    
    // Count gossip types
    const typeCounts = {};
    gossipList.forEach(g => {
      typeCounts[g.archetypeId] = (typeCounts[g.archetypeId] || 0) + 1;
    });
    
    // Generate recommendations based on patterns
    if (typeCounts.COMPETENCE_CRISIS > 2) {
      recommendations.push('Schedule department-wide skills assessment and training.');
    }
    
    if (typeCounts.OFFICE_ROMANCE > 1) {
      recommendations.push('Review and communicate fraternization policy.');
    }
    
    if (typeCounts.SUBSTANCE_SITUATION > 0) {
      recommendations.push('Implement random wellness checks per Protocol 7.3.2.');
    }
    
    return recommendations;
  }
}

export default GossipNarrativeGenerator;