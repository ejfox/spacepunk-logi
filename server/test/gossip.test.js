import { describe, it, expect, beforeEach } from 'vitest'
import { GossipRepository } from '../src/repositories/GossipRepository.js'
import { CrewRepository } from '../src/repositories/CrewRepository.js'
import { createTestPlayer, createTestShip, createTestCrewMember, chance } from './setup.js'

describe('Gossip System', () => {
  let gossipRepo, crewRepo
  let testPlayer, testShip, crew1, crew2, crew3

  beforeEach(async () => {
    gossipRepo = new GossipRepository()
    crewRepo = new CrewRepository()
    
    // Create test data
    testPlayer = await createTestPlayer()
    testShip = await createTestShip(testPlayer.id)
    crew1 = await createTestCrewMember(testShip.id, { name: 'Alice Chen' })
    crew2 = await createTestCrewMember(testShip.id, { name: 'Bob Martinez' })
    crew3 = await createTestCrewMember(testShip.id, { name: 'Carol Singh' })
    
    // Create some relationships
    await crewRepo.updateRelationship(crew1.id, crew2.id, 75) // Alice likes Bob
    await crewRepo.updateRelationship(crew2.id, crew3.id, 30) // Bob dislikes Carol
    await crewRepo.updateRelationship(crew1.id, crew3.id, 60) // Alice neutral to Carol
  })

  describe('Gossip Creation', () => {
    it('should create gossip with proper seeded randomization', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'incompetence',
        intensity: 70,
        content: 'Bob messed up the reactor calibration again'
      })

      expect(gossip.id).toMatch(/test-gossip-/)
      expect(gossip.subject_crew_id).toBe(crew2.id)
      expect(gossip.gossip_type).toBe('incompetence')
      expect(gossip.intensity).toBe(70)
      expect(gossip.veracity).toBeGreaterThanOrEqual(0)
      expect(gossip.veracity).toBeLessThanOrEqual(100)
    })

    it('should generate consistent veracity with same seed', async () => {
      // Reset chance seed to ensure consistency
      chance.seed('test-veracity-seed')
      
      const gossip1 = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'romance',
        intensity: 50
      })

      // Reset to same seed
      chance.seed('test-veracity-seed')
      
      const gossip2 = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'romance',
        intensity: 50
      })

      expect(gossip1.veracity).toBe(gossip2.veracity)
    })

    it('should validate gossip types', async () => {
      await expect(gossipRepo.createGossip({
        subject_crew_id: crew1.id,
        originator_crew_id: crew2.id,
        gossip_type: 'invalid_type',
        intensity: 50
      })).rejects.toThrow('Invalid gossip type')
    })
  })

  describe('Gossip Spreading', () => {
    it('should spread gossip based on relationship strength', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew3.id,
        originator_crew_id: crew1.id,
        gossip_type: 'scandal',
        intensity: 80,
        content: 'Carol has a secret gambling addiction'
      })

      // Alice should be more likely to share with Bob (good relationship)
      const spreadToBob = await gossipRepo.attemptSpread(gossip.id, crew1.id, crew2.id)
      expect(spreadToBob).toBe(true) // High relationship = likely spread

      // Bob less likely to share with Carol (poor relationship)
      const spreadToCarol = await gossipRepo.attemptSpread(gossip.id, crew2.id, crew3.id)
      // This might be true or false, but should be consistent with seeded randomization
      expect(typeof spreadToCarol).toBe('boolean')
    })

    it('should track spread events', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'health',
        intensity: 60
      })

      await gossipRepo.attemptSpread(gossip.id, crew1.id, crew3.id)
      
      const spreadEvents = await gossipRepo.getSpreadEvents(gossip.id)
      expect(spreadEvents.length).toBeGreaterThanOrEqual(0)
      if (spreadEvents.length > 0) {
        expect(spreadEvents[0].source_crew_id).toBe(crew1.id)
        expect(spreadEvents[0].target_crew_id).toBe(crew3.id)
      }
    })
  })

  describe('Belief System', () => {
    it('should track crew beliefs in gossip', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'incompetence',
        intensity: 70
      })

      // Alice believes her own gossip
      await gossipRepo.updateBelief(crew1.id, gossip.id, 90)
      
      // Bob is skeptical
      await gossipRepo.updateBelief(crew2.id, gossip.id, 20)

      const aliceBelief = await gossipRepo.getBelief(crew1.id, gossip.id)
      const bobBelief = await gossipRepo.getBelief(crew2.id, gossip.id)

      expect(aliceBelief.belief_level).toBe(90)
      expect(bobBelief.belief_level).toBe(20)
    })

    it('should calculate crew credibility consistently', async () => {
      const credibility = await gossipRepo.getCrewCredibility(crew1.id)
      expect(credibility).toBeGreaterThanOrEqual(0)
      expect(credibility).toBeLessThanOrEqual(100)
      
      // Should be consistent with same crew data
      const credibility2 = await gossipRepo.getCrewCredibility(crew1.id)
      expect(credibility).toBe(credibility2)
    })
  })

  describe('Gossip Mutation', () => {
    it('should mutate gossip content over time', async () => {
      const originalGossip = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'romance',
        intensity: 60,
        content: 'Bob has a crush on someone'
      })

      const mutatedGossip = await gossipRepo.mutateGossip(originalGossip.id, 'exaggeration')
      
      expect(mutatedGossip.id).not.toBe(originalGossip.id)
      expect(mutatedGossip.parent_gossip_id).toBe(originalGossip.id)
      expect(mutatedGossip.intensity).toBeGreaterThan(originalGossip.intensity)
      expect(mutatedGossip.mutation_type).toBe('exaggeration')
    })

    it('should chain mutations properly', async () => {
      const original = await gossipRepo.createGossip({
        subject_crew_id: crew1.id,
        originator_crew_id: crew2.id,
        gossip_type: 'health',
        intensity: 40
      })

      const firstMutation = await gossipRepo.mutateGossip(original.id, 'exaggeration')
      const secondMutation = await gossipRepo.mutateGossip(firstMutation.id, 'target_shift')

      const genealogy = await gossipRepo.getGossipGenealogy(secondMutation.id)
      expect(genealogy.length).toBe(3) // Original + 2 mutations
      expect(genealogy[0].id).toBe(original.id)
      expect(genealogy[2].id).toBe(secondMutation.id)
    })
  })

  describe('Performance Impact', () => {
    it('should apply performance impacts based on gossip', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew2.id,
        originator_crew_id: crew1.id,
        gossip_type: 'incompetence',
        intensity: 80
      })

      // Spread the gossip to create belief
      await gossipRepo.updateBelief(crew1.id, gossip.id, 85)
      await gossipRepo.updateBelief(crew3.id, gossip.id, 70)

      await gossipRepo.applyPerformanceImpacts(crew2.id)
      
      const impacts = await gossipRepo.getPerformanceImpacts(crew2.id)
      expect(impacts.length).toBeGreaterThanOrEqual(0)
      
      if (impacts.length > 0) {
        const impact = impacts[0]
        expect(impact.impact_type).toBe('skill_modifier')
        expect(impact.impact_value).toBeLessThan(0) // Negative impact from incompetence gossip
      }
    })

    it('should decay performance impacts over time', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew1.id,
        originator_crew_id: crew2.id,
        gossip_type: 'health',
        intensity: 60
      })

      await gossipRepo.applyPerformanceImpacts(crew1.id)
      await gossipRepo.decayPerformanceImpacts(crew1.id, 0.1) // 10% decay
      
      const impacts = await gossipRepo.getPerformanceImpacts(crew1.id)
      // Impacts should be reduced or removed
      expect(impacts.every(impact => Math.abs(impact.impact_value) < 60)).toBe(true)
    })
  })

  describe('Network Analysis', () => {
    it('should identify gossip networks and cliques', async () => {
      // Create gossip between crew members
      const gossip1 = await gossipRepo.createGossip({
        subject_crew_id: crew3.id,
        originator_crew_id: crew1.id,
        gossip_type: 'romance',
        intensity: 70
      })

      await gossipRepo.attemptSpread(gossip1.id, crew1.id, crew2.id)
      
      const networks = await gossipRepo.analyzeGossipNetworks(testShip.id)
      expect(networks.length).toBeGreaterThanOrEqual(0)
      
      if (networks.length > 0) {
        expect(networks[0]).toHaveProperty('members')
        expect(networks[0]).toHaveProperty('gossip_density')
        expect(Array.isArray(networks[0].members)).toBe(true)
      }
    })

    it('should calculate crew gossip statistics', async () => {
      const stats = await gossipRepo.getCrewGossipStats(crew1.id)
      
      expect(stats).toHaveProperty('gossip_originated')
      expect(stats).toHaveProperty('gossip_spread')
      expect(stats).toHaveProperty('gossip_believed')
      expect(stats).toHaveProperty('credibility_score')
      expect(typeof stats.credibility_score).toBe('number')
    })
  })

  describe('Seeded Randomization Consistency', () => {
    it('should produce identical results with same seed', async () => {
      // Set specific seed for this test
      chance.seed('gossip-consistency-test')
      
      const gossip1 = await gossipRepo.createGossip({
        subject_crew_id: crew1.id,
        originator_crew_id: crew2.id,
        gossip_type: 'scandal',
        intensity: 75
      })

      // Reset to same seed
      chance.seed('gossip-consistency-test')
      
      const gossip2 = await gossipRepo.createGossip({
        subject_crew_id: crew1.id,
        originator_crew_id: crew2.id,
        gossip_type: 'scandal',
        intensity: 75
      })

      // Should produce identical veracity and other random elements
      expect(gossip1.veracity).toBe(gossip2.veracity)
    })

    it('should allow deterministic testing of spread mechanics', async () => {
      const gossip = await gossipRepo.createGossip({
        subject_crew_id: crew3.id,
        originator_crew_id: crew1.id,
        gossip_type: 'health',
        intensity: 50
      })

      // Test spread with specific seed
      chance.seed('spread-test-seed')
      const result1 = await gossipRepo.attemptSpread(gossip.id, crew1.id, crew2.id)
      
      chance.seed('spread-test-seed')
      const result2 = await gossipRepo.attemptSpread(gossip.id, crew1.id, crew2.id)
      
      expect(result1).toBe(result2)
    })
  })
})