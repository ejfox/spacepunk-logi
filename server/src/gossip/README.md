# Gossip System Design Document

## Overview
The Gossip System creates emergent crew drama through 10 archetypal patterns that combine predictable gameplay mechanics with LLM-generated narrative details. This system makes players care about their crew while maintaining Spacepunk's corporate dark humor.

## Core Archetypes

### 1. **Office Romance**
- **Pattern**: Crew member develops feelings, creating workplace tension
- **Phases**: CRUSH → OBVIOUS → CONFESSION → [DATING/REJECTION]
- **Effects**: -10% efficiency (distracted), ±30% morale (outcome dependent)
- **Spread**: 70% base chance, gossips love this

### 2. **Competence Crisis**
- **Pattern**: Crew member struggles with responsibilities
- **Phases**: STRUGGLING → NOTICED → [HELPED/REPORTED]
- **Effects**: -30% skill rating, +40% failure rate, team stress cascade
- **Spread**: 80% base chance, safety concerns spread fast

### 3. **Secret Past**
- **Pattern**: Hidden background creates trust issues
- **Phases**: SUSPICIOUS → INVESTIGATING → [REVEALED/DROPPED]
- **Effects**: -40% trust shock, ±50% faction relations
- **Spread**: 50% base chance, mysteries fascinate crew

### 4. **Health Scare**
- **Pattern**: Medical concerns affect performance
- **Phases**: NOTICED → WORRIED → [DIAGNOSED/FALSE_ALARM]
- **Effects**: -30% capacity, +500cr/cycle medical, crew sympathy
- **Spread**: 60% base chance, visible symptoms increase spread

### 5. **Loyalty Question**
- **Pattern**: Suspected faction allegiance
- **Phases**: SUSPICIOUS → INVESTIGATING → [EVIDENCE/CLEARED]
- **Effects**: -50% trust, +40% paranoia, security alerts
- **Spread**: 75% base chance, paranoia is contagious

### 6. **Substance Situation**
- **Pattern**: Dependency issues emerge
- **Phases**: RECREATIONAL → [CONTROLLED/ESCALATING] → [INTERVENTION/ACCIDENT]
- **Effects**: ±40% performance swings, +40% accident risk
- **Spread**: 50% base chance, incidents trigger spread

### 7. **Technical Heresy**
- **Pattern**: Unorthodox methods challenge protocol
- **Phases**: EXPERIMENTING → [SUCCESS/FAILURE]
- **Effects**: +35% efficiency OR +60% system damage
- **Spread**: 65% base chance, engineers argue loudly

### 8. **Debt Spiral**
- **Pattern**: Financial pressure affects behavior
- **Phases**: MANAGEABLE → GROWING → [DESPERATE/BAILOUT]
- **Effects**: -100cr/cycle, +45% stress, theft risk
- **Spread**: 40% base chance, people keep it quiet

### 9. **Family Drama**
- **Pattern**: External family issues impact work
- **Phases**: PRIVATE → SHARING → [SUPPORTED/ISOLATED]
- **Effects**: -35% focus, crew sympathy networks form
- **Spread**: 55% base chance, emotional distress visible

### 10. **Rival Promotion**
- **Pattern**: Competition for advancement
- **Phases**: COMPETING → INTENSIFYING → [DECIDED/SCANDAL]
- **Effects**: +25% short-term productivity, -40% team cohesion
- **Spread**: 85% base chance, everyone picks sides

## System Mechanics

### Spread Networks
- **Primary spreaders**: Role-based (supervisors, gossips, friends)
- **Department bonus**: Same department = +20% spread chance
- **Relationship modifier**: High relationships increase spread
- **Trait effects**: "gossip" +20%, "discrete" -30%

### Phase Progression
- Each phase has a duration in ticks
- Transitions can branch based on context
- Terminal phases: RESOLVED, STABLE, ABANDONED
- Crisis phases trigger immediate effects

### LLM Integration Points
1. **Initial Details**: Specific behaviors and incidents
2. **Phase Transitions**: Corporate memos about developments
3. **Crew Dialogue**: Personality-appropriate gossip
4. **Ship's Log**: Weaving drama into operational reports

### Fallback Templates
- Pre-written templates for each archetype
- Corporate humor maintained without LLM
- Randomized selection prevents repetition
- Context-aware template filling

## Gameplay Impact

### Performance Effects
- Cascading impacts through departments
- Positive and negative effect branches
- Severity scales with spread percentage
- Long-term reputation consequences

### Narrative Integration
- Ship's log automatically includes gossip
- Productivity reports show drama impact
- HR memos provide corporate perspective
- Crew dialogue reveals relationships

## Implementation Notes

### Trigger Conditions
- Romance: High relationship scores + chemistry
- Competence: Multiple failures + stress
- Health: Performance decline + age/stress
- All triggers check for existing gossip

### Corporate Humor Examples
- "Productivity down 12% due to interpersonal dynamics"
- "Form 114-B (Interpersonal Disclosure) filed"
- "Mandatory sensitivity training scheduled"
- "Anonymous tip box yielding above-average submissions"

### Design Philosophy
- Personal drama treated as productivity metrics
- Incredible events described mundanely
- Bureaucratic language masks human emotion
- Players care through corporate abstraction

This system creates authentic workplace drama that emerges from crew relationships while maintaining predictable gameplay mechanics and Spacepunk's signature tone.