# Gossip Network System Integration Guide

## Overview

The Gossip Network system implements a sophisticated social dynamics engine that tracks how information spreads, mutates, and impacts crew performance aboard ships in Spacepunk.

## Database Schema Components

### Core Tables

1. **`gossip_items`** - Central gossip storage
   - Stores all gossip with metadata (type, priority, veracity)
   - Tracks original and current content (supporting mutations)
   - Links to subjects (crew members) and originators
   - Includes performance impact cache for efficiency

2. **`gossip_beliefs`** - Individual crew beliefs
   - Tracks what each crew member believes and how strongly
   - Records spread history and skepticism levels
   - Enables gossip propagation algorithms

3. **`gossip_spread_events`** - Transmission history
   - Records every gossip exchange between crew members
   - Captures context (location, conversation type)
   - Tracks transmission fidelity and belief outcomes

4. **`gossip_mutations`** - Content evolution
   - Documents how gossip changes over time
   - Tracks mutation types and severity
   - Maintains veracity degradation

5. **`gossip_performance_impacts`** - Gameplay effects
   - Links gossip to concrete stat changes
   - Supports temporary and permanent effects
   - Enables stacking rules and expiration

6. **`gossip_networks`** - Social cliques
   - Models gossip networks within crews
   - Affects spread rates and mutation resistance
   - Supports different network types

### Supporting Infrastructure

- **Views**: Pre-built queries for common operations
- **Functions**: Spread probability calculations, impact applications
- **Triggers**: Automatic update of spread counts
- **Indexes**: Optimized for performance-critical queries

## Integration Points

### With Existing Tables

1. **`crew_members`**
   - Add columns: `gossip_susceptibility`, `primary_gossip_network_id`
   - Gossip affects: `morale`, `fatigue`, skill effectiveness

2. **`crew_relationships`**
   - Relationship values influence gossip spread probability
   - Gossip can modify relationship values over time

3. **`crew_memories`**
   - Significant gossip events create memories
   - Memories can spawn new gossip

4. **`ships`**
   - Gossip is scoped to ships
   - Ship events can generate system gossip

### With Game Systems

1. **Tick Engine Integration**
   ```javascript
   // In tickEngine.js
   async function processGossipSpread(shipId) {
     // Find gossip ready to spread
     const activeGossip = await getSpreadableGossip(shipId);
     
     // Calculate spread probabilities
     for (const gossip of activeGossip) {
       const spreaders = await getPotentialSpreaders(gossip.id);
       const receivers = await getPotentialReceivers(spreaders);
       
       // Process spread events
       await processGossipTransmissions(gossip, spreaders, receivers);
     }
     
     // Apply performance impacts
     await applyGossipImpacts(shipId);
     
     // Check for mutations
     await checkGossipMutations(shipId);
   }
   ```

2. **LLM Integration**
   ```javascript
   // Generate gossip content
   async function generateGossipContent(type, subject, context) {
     const prompt = buildGossipPrompt(type, subject, context);
     const content = await llmService.generate(prompt);
     return sanitizeGossipContent(content);
   }
   
   // Mutate gossip
   async function mutateGossipContent(original, mutationType, crew) {
     const prompt = buildMutationPrompt(original, mutationType, crew);
     return await llmService.generate(prompt);
   }
   ```

3. **Ship's Log Integration**
   ```javascript
   // Include gossip in ship's logs
   async function generateShipLog(shipId, tickNumber) {
     const gossipEvents = await getRecentGossipEvents(shipId);
     const significantGossip = filterSignificantGossip(gossipEvents);
     
     // Include in narrative context
     const context = {
       ...existingContext,
       gossip: significantGossip
     };
     
     return generateNarrative(context);
   }
   ```

## Implementation Workflow

### 1. Database Setup
```bash
# Run the schema creation
psql -d spacepunk -f server/db/init/003_gossip_network_schema.sql

# For existing databases, run migration
psql -d spacepunk -f server/db/migrations/add_gossip_network.sql

# Load test data (optional)
psql -d spacepunk -f server/db/init/004_gossip_test_data.sql
```

### 2. Repository Layer
Create `GossipRepository.js`:
```javascript
class GossipRepository {
  async createGossip(gossipData) {
    // Validate gossip type
    // Insert into gossip_items
    // Create initial belief for originator
    // Return gossip with ID
  }
  
  async spreadGossip(gossipId, spreaderId, receiverId, context) {
    // Calculate spread probability
    // Create spread event
    // Update/create receiver belief
    // Check for mutations
  }
  
  async getActiveGossipForShip(shipId) {
    // Query v_active_gossip view
    // Include belief counts and impact data
  }
  
  async applyGossipImpacts(shipId) {
    // Get active impacts
    // Update crew stats
    // Handle expiration
  }
}
```

### 3. Gossip Engine
Create `engine/gossipEngine.js`:
```javascript
class GossipEngine {
  // Gossip generation
  async generateGossipFromEvent(event, ship) {
    const gossipType = determineGossipType(event);
    const content = await generateContent(event, gossipType);
    const gossip = await gossipRepo.createGossip({
      ship_id: ship.id,
      gossip_type: gossipType,
      content,
      // ... other fields
    });
    return gossip;
  }
  
  // Spread simulation
  async simulateGossipSpread(shipId) {
    const gossip = await gossipRepo.getSpreadableGossip(shipId);
    for (const item of gossip) {
      await this.processGossipItem(item);
    }
  }
  
  // Mutation handling
  async checkMutations(gossipId) {
    const spreadCount = await gossipRepo.getSpreadCount(gossipId);
    if (shouldMutate(spreadCount)) {
      await this.mutateGossip(gossipId);
    }
  }
}
```

### 4. API Endpoints
Add to `routes/api.js`:
```javascript
// Get ship gossip
router.get('/ships/:shipId/gossip', async (req, res) => {
  const gossip = await gossipRepo.getActiveGossipForShip(req.params.shipId);
  res.json(gossip);
});

// Get crew gossip knowledge
router.get('/crew/:crewId/gossip', async (req, res) => {
  const beliefs = await gossipRepo.getCrewBeliefs(req.params.crewId);
  res.json(beliefs);
});

// Manual gossip creation (for events/missions)
router.post('/ships/:shipId/gossip', async (req, res) => {
  const gossip = await gossipRepo.createGossip({
    ship_id: req.params.shipId,
    ...req.body
  });
  res.json(gossip);
});
```

## Performance Considerations

### Query Optimization
- Use provided indexes for common queries
- Leverage views for complex aggregations
- Batch gossip processing in tick engine

### Data Retention
- Run `archive_old_gossip()` function periodically
- Consider partitioning for large-scale deployments
- Implement gossip "fade" based on spread count and age

### Caching Strategy
- Cache active gossip per ship
- Cache crew belief summaries
- Invalidate on spread events

## Testing Strategy

### Unit Tests
```javascript
describe('GossipRepository', () => {
  it('should calculate spread probability correctly', async () => {
    const probability = await gossipRepo.calculateSpreadProbability(
      gossipId, spreaderId, receiverId
    );
    expect(probability).toBeBetween(0, 1);
  });
  
  it('should mutate gossip content', async () => {
    const mutation = await gossipRepo.mutateGossip(gossipId, 'exaggeration');
    expect(mutation.new_content).not.toBe(mutation.previous_content);
  });
});
```

### Integration Tests
- Test full gossip lifecycle (creation → spread → mutation → impact)
- Verify performance impact application
- Test network effects on spread rates

### Load Testing
- Simulate 100+ crew members with active gossip
- Measure query performance under load
- Test concurrent spread events

## Debugging Tools

### Useful Queries
```sql
-- Track gossip spread path
WITH RECURSIVE spread_path AS (
  SELECT gossip_id, spreader_crew_id, receiver_crew_id, spread_at, 1 as depth
  FROM gossip_spread_events
  WHERE gossip_id = $1 AND spreader_crew_id IS NULL
  
  UNION ALL
  
  SELECT e.gossip_id, e.spreader_crew_id, e.receiver_crew_id, e.spread_at, sp.depth + 1
  FROM gossip_spread_events e
  JOIN spread_path sp ON e.spreader_crew_id = sp.receiver_crew_id
  WHERE e.gossip_id = $1
)
SELECT * FROM spread_path ORDER BY depth, spread_at;

-- Analyze mutation patterns
SELECT 
  gossip_type,
  mutation_type,
  COUNT(*) as mutation_count,
  AVG(mutation_severity) as avg_severity
FROM gossip_mutations gm
JOIN gossip_items gi ON gm.gossip_id = gi.id
GROUP BY gossip_type, mutation_type
ORDER BY mutation_count DESC;
```

### Monitoring
- Track average gossip lifetime
- Monitor mutation rates by type
- Alert on excessive gossip generation
- Dashboard for gossip network health

## Future Enhancements

1. **Cross-ship gossip** via crew transfers
2. **Gossip verification** mechanics
3. **Counter-gossip** generation
4. **Reputation system** integration
5. **Player-initiated gossip** with consequences
6. **Gossip market** - selling information
7. **Encrypted gossip** requiring hacking skills
8. **Historical gossip** affecting new crew

## Migration Checklist

- [ ] Backup existing database
- [ ] Run schema creation/migration script
- [ ] Update crew_members table
- [ ] Create GossipRepository
- [ ] Integrate with tick engine
- [ ] Add API endpoints
- [ ] Update ship's log generation
- [ ] Test with sample data
- [ ] Monitor performance
- [ ] Document crew-facing features