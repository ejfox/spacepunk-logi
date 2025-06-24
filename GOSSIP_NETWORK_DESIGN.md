# Ship's Gossip Network Algorithm Design

## Core Concept
The Gossip Network transforms crew interactions into a living social ecosystem where information spreads, mutates, and affects gameplay through emergent workplace drama.

## 1. Data Structures

### Gossip Table Schema
```sql
CREATE TABLE gossip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    originator_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
    
    -- Core gossip data
    gossip_type VARCHAR(50) NOT NULL, -- see types below
    subject_type VARCHAR(50) NOT NULL, -- crew, captain, mission, ship
    subject_id UUID,
    content TEXT NOT NULL,
    
    -- Gossip metrics
    juiciness INTEGER DEFAULT 50, -- 0-100, how interesting
    credibility INTEGER DEFAULT 50, -- 0-100, how believable
    spread_count INTEGER DEFAULT 0, -- times shared
    mutation_level INTEGER DEFAULT 0, -- times content changed
    
    -- Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Effects
    morale_impact INTEGER DEFAULT 0, -- -10 to +10
    productivity_impact INTEGER DEFAULT 0 -- -10 to +10
);

CREATE TABLE gossip_knowledge (
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    gossip_id UUID REFERENCES gossip(id) ON DELETE CASCADE,
    heard_from UUID REFERENCES crew_members(id) ON DELETE SET NULL,
    heard_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    belief_level INTEGER DEFAULT 50, -- 0-100
    times_shared INTEGER DEFAULT 0,
    PRIMARY KEY (crew_member_id, gossip_id)
);
```

## 2. Gossip Types & Behaviors

### Type Categories
```javascript
const GOSSIP_TYPES = {
  // Crew-focused
  ROMANCE: { 
    juiciness: 80, 
    spreadRate: 0.8, 
    mutationRate: 0.3,
    triggers: ['high_relationship', 'private_meetings', 'gift_giving']
  },
  INCOMPETENCE: { 
    juiciness: 60, 
    spreadRate: 0.6, 
    mutationRate: 0.4,
    triggers: ['failed_task', 'skill_decrease', 'accident']
  },
  SECRET_SKILL: { 
    juiciness: 70, 
    spreadRate: 0.5, 
    mutationRate: 0.2,
    triggers: ['exceptional_performance', 'hidden_talent_revealed']
  },
  BACKSTORY: { 
    juiciness: 65, 
    spreadRate: 0.4, 
    mutationRate: 0.5,
    triggers: ['drunk_confession', 'memory_shared', 'homeworld_mentioned']
  },
  
  // Captain-focused
  CAPTAIN_FAVORITISM: { 
    juiciness: 75, 
    spreadRate: 0.7, 
    mutationRate: 0.3,
    triggers: ['repeated_promotions', 'special_treatment', 'private_meetings']
  },
  CAPTAIN_WEAKNESS: { 
    juiciness: 85, 
    spreadRate: 0.6, 
    mutationRate: 0.4,
    triggers: ['bad_decision', 'visible_failure', 'crew_complaint']
  },
  
  // Ship/Mission
  CONSPIRACY: { 
    juiciness: 90, 
    spreadRate: 0.5, 
    mutationRate: 0.6,
    triggers: ['secret_cargo', 'mysterious_mission', 'faction_contact']
  },
  EQUIPMENT_FAILURE: { 
    juiciness: 40, 
    spreadRate: 0.8, 
    mutationRate: 0.1,
    triggers: ['component_damage', 'maintenance_skip', 'strange_noise']
  },
  
  // Morale
  MUTINY_WHISPERS: { 
    juiciness: 95, 
    spreadRate: 0.3, 
    mutationRate: 0.5,
    triggers: ['very_low_morale', 'captain_hatred', 'failed_missions']
  },
  CELEBRATION: { 
    juiciness: 50, 
    spreadRate: 0.9, 
    mutationRate: 0.1,
    triggers: ['mission_success', 'bonus_received', 'milestone']
  }
};
```

## 3. Gossip Generation Algorithm

```javascript
class GossipGenerator {
  generateFromEvent(event, ship) {
    const crew = ship.crew;
    const triggers = this.identifyTriggers(event);
    
    for (const trigger of triggers) {
      const gossipType = this.matchTriggerToType(trigger);
      if (!gossipType) continue;
      
      // Determine originator based on personality
      const originator = this.selectOriginator(crew, gossipType, event);
      if (!originator) continue;
      
      // Generate content with personality influence
      const content = this.generateContent(gossipType, event, originator);
      
      // Calculate initial metrics
      const juiciness = this.calculateJuiciness(gossipType, event, originator);
      const credibility = this.calculateCredibility(originator, event);
      
      // Create gossip entry
      const gossip = {
        type: gossipType,
        originator_id: originator.id,
        content: content,
        juiciness: juiciness,
        credibility: credibility,
        subject_type: event.subject_type,
        subject_id: event.subject_id,
        expires_at: this.calculateExpiration(gossipType, juiciness)
      };
      
      // Originator automatically knows
      this.addKnowledge(originator.id, gossip.id, null, 100);
      
      // Initial spread to nearby crew
      this.initialSpread(gossip, originator, crew);
    }
  }
  
  selectOriginator(crew, gossipType, event) {
    // Gossipy personalities more likely to start rumors
    const candidates = crew.filter(member => {
      const gossipScore = 
        (100 - member.trait_loyalty) * 0.3 + // Disloyal crew gossip more
        member.skill_social * 0.3 + // Social crew spread gossip
        member.trait_ambition * 0.2 + // Ambitious crew use gossip
        (100 - member.trait_work_ethic) * 0.2; // Lazy crew have time to gossip
      
      return gossipScore > 50 && member.morale > 20;
    });
    
    if (candidates.length === 0) return null;
    return this.weightedRandom(candidates);
  }
  
  calculateJuiciness(type, event, originator) {
    let base = GOSSIP_TYPES[type].juiciness;
    
    // Modify based on subject importance
    if (event.subject_type === 'captain') base += 10;
    if (event.subject_type === 'mission' && event.reward > 10000) base += 15;
    
    // Personality affects how juicy they make it
    base += (originator.skill_social / 10); // Social butterflies embellish
    
    return Math.min(100, base);
  }
  
  calculateCredibility(originator, event) {
    let credibility = 50;
    
    // Reputation affects credibility
    credibility += (originator.trait_loyalty / 5);
    credibility -= (originator.lies_told || 0) * 5;
    
    // Evidence affects credibility
    if (event.witnessed_by && event.witnessed_by.length > 2) {
      credibility += 20;
    }
    
    return Math.max(10, Math.min(90, credibility));
  }
}
```

## 4. Spread Mechanics

```javascript
class GossipSpreadEngine {
  spreadGossip(tickNumber) {
    const activeGossip = this.getActiveGossip();
    
    for (const gossip of activeGossip) {
      const knowers = this.getKnowers(gossip.id);
      
      for (const knower of knowers) {
        if (Math.random() > this.getSpreadChance(knower, gossip)) continue;
        
        // Select targets based on relationships
        const targets = this.selectSpreadTargets(knower, gossip);
        
        for (const target of targets) {
          this.attemptSpread(gossip, knower, target);
        }
      }
      
      // Decay and mutation
      this.decayGossip(gossip);
      if (Math.random() < gossip.mutation_chance) {
        this.mutateGossip(gossip);
      }
    }
  }
  
  getSpreadChance(crew, gossip) {
    const baseChance = GOSSIP_TYPES[gossip.type].spreadRate;
    
    // Personality modifiers
    const socialModifier = crew.skill_social / 100;
    const ethicsModifier = (100 - crew.trait_work_ethic) / 200; // Lazy people gossip
    const loyaltyModifier = (100 - crew.trait_loyalty) / 200; // Disloyal spread rumors
    
    // Belief affects spread
    const beliefModifier = crew.belief_level / 100;
    
    // Juiciness makes people want to share
    const juicinessModifier = gossip.juiciness / 100;
    
    return baseChance * socialModifier * ethicsModifier * 
           loyaltyModifier * beliefModifier * juicinessModifier;
  }
  
  selectSpreadTargets(spreader, gossip) {
    const relationships = this.getRelationships(spreader.id);
    const candidates = [];
    
    for (const rel of relationships) {
      // More likely to tell friends (positive) OR enemies (negative gossip)
      if (gossip.sentiment < 0 && rel.value < -30) {
        candidates.push({ id: rel.other_id, weight: Math.abs(rel.value) });
      } else if (rel.value > 30) {
        candidates.push({ id: rel.other_id, weight: rel.value });
      }
    }
    
    // Random encounters in common areas
    const randomEncounters = this.getRandomEncounters(spreader);
    candidates.push(...randomEncounters.map(id => ({ id, weight: 20 })));
    
    return this.weightedSelection(candidates, 1 + Math.floor(spreader.skill_social / 30));
  }
  
  attemptSpread(gossip, spreader, target) {
    // Check if target already knows
    if (this.knowsGossip(target.id, gossip.id)) {
      // Reinforce belief if heard from multiple sources
      this.reinforceBelief(target.id, gossip.id, 10);
      return;
    }
    
    // Calculate acceptance chance
    const acceptChance = this.calculateAcceptance(gossip, spreader, target);
    
    if (Math.random() < acceptChance) {
      // Target believes and stores gossip
      const belief = this.calculateInitialBelief(gossip, spreader, target);
      this.addKnowledge(target.id, gossip.id, spreader.id, belief);
      
      // Update spread metrics
      gossip.spread_count++;
      spreader.times_shared++;
      
      // Emotional reaction
      this.processEmotionalImpact(target, gossip);
    }
  }
  
  calculateAcceptance(gossip, spreader, target) {
    let chance = 0.5;
    
    // Relationship affects trust
    const relationship = this.getRelationship(spreader.id, target.id);
    chance += relationship.value / 200;
    
    // Credibility matters
    chance += (gossip.credibility - 50) / 100;
    
    // Some personalities are gullible
    chance += (100 - target.trait_bravery) / 200; // Cowards believe scary rumors
    chance += (target.trait_ambition) / 200; // Ambitious believe opportunity rumors
    
    return Math.max(0.1, Math.min(0.9, chance));
  }
}
```

## 5. Mutation System

```javascript
class GossipMutator {
  mutateGossip(gossip) {
    const mutationType = this.selectMutationType(gossip);
    
    switch(mutationType) {
      case 'EXAGGERATION':
        gossip.content = this.exaggerate(gossip.content);
        gossip.juiciness = Math.min(100, gossip.juiciness + 10);
        gossip.credibility = Math.max(0, gossip.credibility - 5);
        break;
        
      case 'DETAIL_LOSS':
        gossip.content = this.removeDetails(gossip.content);
        gossip.credibility = Math.max(0, gossip.credibility - 10);
        break;
        
      case 'SUBJECT_SHIFT':
        // Gossip morphs to be about someone else
        const newSubject = this.selectNewSubject(gossip);
        gossip.subject_id = newSubject.id;
        gossip.content = this.rewriteForNewSubject(gossip.content, newSubject);
        gossip.credibility = Math.max(0, gossip.credibility - 20);
        break;
        
      case 'MERGER':
        // Combines with another piece of gossip
        const otherGossip = this.findRelatedGossip(gossip);
        if (otherGossip) {
          gossip.content = this.mergeContent(gossip.content, otherGossip.content);
          gossip.juiciness = Math.min(100, gossip.juiciness + otherGossip.juiciness / 2);
        }
        break;
    }
    
    gossip.mutation_level++;
  }
  
  exaggerate(content) {
    const exaggerations = [
      { find: /saw (\w+) talking/g, replace: "caught $1 whispering suspiciously" },
      { find: /made a mistake/g, replace: "completely botched everything" },
      { find: /seemed tired/g, replace: "was practically unconscious" },
      { find: /got promoted/g, replace: "got promoted under mysterious circumstances" },
      { find: /went to (\w+)/g, replace: "snuck off to $1" }
    ];
    
    let mutated = content;
    for (const rule of exaggerations) {
      mutated = mutated.replace(rule.find, rule.replace);
    }
    return mutated;
  }
}
```

## 6. Player Impact System

```javascript
class GossipImpactEngine {
  processGossipEffects(ship) {
    const activeGossip = this.getShipGossip(ship.id);
    const crew = this.getCrew(ship.id);
    
    // Calculate collective morale impact
    let totalMoraleImpact = 0;
    let totalProductivityImpact = 0;
    
    for (const gossip of activeGossip) {
      const believers = this.getBelievers(gossip.id);
      const beliefStrength = believers.reduce((sum, b) => sum + b.belief_level, 0) / believers.length;
      
      // Different gossip types have different effects
      const impact = this.calculateImpact(gossip, beliefStrength, believers.length);
      
      totalMoraleImpact += impact.morale;
      totalProductivityImpact += impact.productivity;
      
      // Specific behavioral changes
      this.applyBehavioralChanges(gossip, believers);
    }
    
    // Apply ship-wide effects
    this.updateShipMorale(ship.id, totalMoraleImpact);
    this.updateShipProductivity(ship.id, totalProductivityImpact);
  }
  
  calculateImpact(gossip, beliefStrength, believerCount) {
    const impact = { morale: 0, productivity: 0 };
    const intensity = (gossip.juiciness / 100) * (beliefStrength / 100) * (believerCount / 10);
    
    switch(gossip.type) {
      case 'ROMANCE':
        impact.morale = intensity * 5; // Generally positive
        impact.productivity = -intensity * 2; // Distraction
        break;
        
      case 'INCOMPETENCE':
        impact.morale = -intensity * 3;
        impact.productivity = -intensity * 5; // Trust issues
        break;
        
      case 'CAPTAIN_FAVORITISM':
        impact.morale = -intensity * 7; // Very divisive
        impact.productivity = -intensity * 3;
        break;
        
      case 'MUTINY_WHISPERS':
        impact.morale = -intensity * 10; // Extremely damaging
        impact.productivity = -intensity * 8;
        break;
        
      case 'CELEBRATION':
        impact.morale = intensity * 8;
        impact.productivity = intensity * 2;
        break;
    }
    
    return impact;
  }
  
  applyBehavioralChanges(gossip, believers) {
    for (const believer of believers) {
      switch(gossip.type) {
        case 'ROMANCE':
          if (gossip.subject_id) {
            // Believers become awkward around the couple
            this.modifyRelationship(believer.id, gossip.subject_id, -5);
          }
          break;
          
        case 'INCOMPETENCE':
          if (gossip.subject_id && believer.belief_level > 70) {
            // Strong believers avoid working with "incompetent" crew
            this.addMemory(believer.id, 'distrust', 
              `Started avoiding ${gossip.subject_name} due to competence concerns`, -20);
            this.modifyRelationship(believer.id, gossip.subject_id, -15);
          }
          break;
          
        case 'CAPTAIN_FAVORITISM':
          // Believers become resentful
          this.modifyRelationship(believer.id, 'CAPTAIN', -10);
          if (gossip.subject_id) {
            this.modifyRelationship(believer.id, gossip.subject_id, -20);
          }
          break;
      }
    }
  }
}
```

## 7. Gossip Lifecycle Management

```javascript
class GossipLifecycle {
  manageDailyGossip() {
    // Natural generation from daily events
    this.generateDailyGossip();
    
    // Spread existing gossip
    this.spreadEngine.spreadGossip();
    
    // Process mutations
    this.checkForMutations();
    
    // Apply effects
    this.impactEngine.processGossipEffects();
    
    // Decay old gossip
    this.decayOldGossip();
    
    // Archive expired gossip
    this.archiveExpiredGossip();
  }
  
  generateDailyGossip() {
    const ships = this.getAllActiveShips();
    
    for (const ship of ships) {
      const crew = this.getCrew(ship.id);
      
      // Chance for spontaneous gossip based on crew dynamics
      const gossipChance = this.calculateGossipChance(crew);
      
      if (Math.random() < gossipChance) {
        // Select gossip type based on current ship state
        const type = this.selectGossipType(ship, crew);
        
        // Generate appropriate gossip
        this.generator.generateFromShipState(type, ship, crew);
      }
    }
  }
  
  calculateGossipChance(crew) {
    // More crew = more gossip
    let base = crew.length * 0.05;
    
    // Low morale = more negative gossip
    const avgMorale = crew.reduce((sum, c) => sum + c.morale, 0) / crew.length;
    if (avgMorale < 40) base += 0.2;
    
    // High social skills = more gossip
    const avgSocial = crew.reduce((sum, c) => sum + c.skill_social, 0) / crew.length;
    base += avgSocial / 200;
    
    return Math.min(0.8, base);
  }
  
  decayOldGossip() {
    const activeGossip = this.getActiveGossip();
    
    for (const gossip of activeGossip) {
      // Reduce credibility over time
      gossip.credibility = Math.max(0, gossip.credibility - 2);
      
      // Reduce juiciness as it becomes old news
      const age = Date.now() - gossip.created_at;
      const ageInDays = age / (1000 * 60 * 60 * 24);
      gossip.juiciness = Math.max(0, gossip.juiciness - ageInDays * 5);
      
      // Mark as inactive if no longer interesting
      if (gossip.juiciness < 10 || gossip.credibility < 5) {
        gossip.is_active = false;
      }
    }
  }
}
```

## 8. Integration Examples

### Event: Failed Mission
```javascript
{
  event: 'MISSION_FAILED',
  triggers: [
    {
      type: 'INCOMPETENCE',
      subject: 'pilot_on_duty',
      content: "I heard Torres completely miscalculated the jump coordinates. We're lucky to be alive!"
    },
    {
      type: 'CAPTAIN_WEAKNESS',
      subject: 'captain',
      content: "The Captain's been making terrible decisions lately. This mission was doomed from the start."
    }
  ]
}
```

### Event: Crew Promotion
```javascript
{
  event: 'CREW_PROMOTED',
  triggers: [
    {
      type: 'CAPTAIN_FAVORITISM',
      subject: 'promoted_crew',
      content: "Chen got promoted again? Must be nice being the Captain's favorite..."
    },
    {
      type: 'SECRET_SKILL',
      subject: 'promoted_crew',
      content: "I always knew Chen had hidden talents. Saw them reprogram the nav system with their eyes closed!"
    }
  ]
}
```

### Emergent Scenario: The Love Triangle Disaster
1. **Day 1**: Romance gossip starts about Chen and Torres
2. **Day 3**: Gossip mutates - now includes Rodriguez in a love triangle
3. **Day 5**: Productivity drops 15% as crew takes sides
4. **Day 7**: Fight breaks out in mess hall, morale crashes
5. **Day 10**: Captain intervenes, but "favoritism" gossip begins
6. **Day 12**: Original romance was misunderstanding, but damage is done

### Emergent Scenario: The Competence Cascade
1. **Day 1**: Minor navigation error creates "incompetence" gossip about pilot
2. **Day 2**: Gossip spreads, other crew avoid working with pilot
3. **Day 4**: Isolation causes actual performance decrease
4. **Day 6**: More mistakes due to lack of support, reinforces gossip
5. **Day 8**: Pilot requests transfer, crew realizes gossip became self-fulfilling
6. **Day 10**: Guilt creates new gossip about "mob mentality"

## 9. Player Interface Elements

### Gossip Terminal (PROFESSIONAL License)
```
[SOCIAL DYNAMICS MONITOR v2.3]
[WARNING: Unofficial Communication Channels Detected]

ACTIVE INFORMATION STREAMS:
> "Chen's been spending a lot of time in Engineering..." (87% crew awareness)
> "Captain's new favorite can do no wrong apparently" (62% crew awareness)
> "That last jump felt wrong. Really wrong." (31% crew awareness)

[FILTER: High Impact] [FILTER: About You] [FILTER: Critical]

RECOMMENDATION: Address favoritism perception before morale degrades further.
```

### Captain's Response Options
- **Ignore**: Let gossip run its course (affects spread rate)
- **Address Publicly**: Make announcement (can backfire if low credibility)
- **Private Conversations**: Talk to key individuals (resource intensive)
- **Create Counter-Narrative**: Start positive gossip (requires social skill)

## 10. Balancing Considerations

1. **Gossip Generation Rate**: 1-3 pieces per ship per day maximum
2. **Spread Limits**: Each crew member can only spread to 2-3 others per tick
3. **Belief Decay**: Reduce belief by 5% per day without reinforcement
4. **Effect Caps**: No single gossip can impact morale/productivity by more than 20%
5. **Player Tools**: Give players ways to combat negative gossip spirals
6. **Positive Gossip**: Ensure 30% of gossip is positive/neutral to avoid grimness

This system creates authentic workplace drama where player actions have social consequences, crew relationships matter, and the ship becomes a living social organism that players must navigate carefully.