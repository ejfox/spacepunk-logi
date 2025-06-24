import { beforeAll, afterAll, beforeEach } from 'vitest'
import { query } from '../src/db/index.js'
import Chance from 'chance'

// Initialize seeded chance for consistent test results
export const chance = new Chance('spacepunk-test-seed')

// Test database setup
beforeAll(async () => {
  // Ensure we're using the test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must run against a test database. Set DATABASE_URL to include "test"')
  }
  
  // Clean up any existing test data
  await cleanTestDatabase()
})

afterAll(async () => {
  // Clean up after all tests
  await cleanTestDatabase()
})

beforeEach(async () => {
  // Reset chance seed for each test to ensure consistency
  // Note: chance.seed() doesn't exist, we use new Chance() constructor with seed
})

async function cleanTestDatabase() {
  try {
    // Clean up test data in reverse dependency order
    await query('DELETE FROM gossip_performance_impacts WHERE id LIKE \'test-%\'')
    await query('DELETE FROM gossip_spread_events WHERE id LIKE \'test-%\'')
    await query('DELETE FROM gossip_beliefs WHERE gossip_id LIKE \'test-%\'')
    await query('DELETE FROM gossip WHERE id LIKE \'test-%\'')
    await query('DELETE FROM crew_memories WHERE crew_member_id LIKE \'test-%\'')
    await query('DELETE FROM crew_relationships WHERE source_crew_id LIKE \'test-%\' OR target_crew_id LIKE \'test-%\'')
    await query('DELETE FROM crew_members WHERE id LIKE \'test-%\'')
    await query('DELETE FROM ships WHERE id LIKE \'test-%\'')
    await query('DELETE FROM players WHERE id LIKE \'test-%\'')
  } catch (error) {
    console.warn('Test cleanup warning:', error.message)
  }
}

// Helper functions for creating test data
export const createTestPlayer = async (overrides = {}) => {
  const testData = {
    id: `test-player-${chance.guid()}`,
    username: chance.word(),
    email: chance.email(),
    password_hash: chance.hash(),
    software_license: 'BASIC',
    credits: 10000,
    ...overrides
  }
  
  await query(
    `INSERT INTO players (id, username, email, password_hash, software_license, credits)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [testData.id, testData.username, testData.email, testData.password_hash, testData.software_license, testData.credits]
  )
  
  return testData
}

export const createTestShip = async (playerId, overrides = {}) => {
  const testData = {
    id: `test-ship-${chance.guid()}`,
    player_id: playerId,
    name: chance.word() + ' Vessel',
    hull_type: 'basic_hauler',
    location_galaxy: 'Sol System',
    location_station: 'Test Station',
    status: 'docked',
    fuel_current: 100,
    fuel_max: 100,
    cargo_used: 0,
    cargo_max: 50,
    ...overrides
  }
  
  await query(
    `INSERT INTO ships (id, player_id, name, hull_type, location_galaxy, location_station, status, fuel_current, fuel_max, cargo_used, cargo_max)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [testData.id, testData.player_id, testData.name, testData.hull_type, testData.location_galaxy, testData.location_station, testData.status, testData.fuel_current, testData.fuel_max, testData.cargo_used, testData.cargo_max]
  )
  
  return testData
}

export const createTestCrewMember = async (shipId, overrides = {}) => {
  const testData = {
    id: `test-crew-${chance.guid()}`,
    ship_id: shipId,
    name: chance.name(),
    age: chance.integer({ min: 22, max: 65 }),
    homeworld: chance.pickone(['Mars', 'Earth', 'Europa', 'Titan']),
    culture: chance.pickone(['Corporate', 'Belter', 'Spacer', 'Agricultural']),
    skill_engineering: chance.integer({ min: 20, max: 80 }),
    skill_piloting: chance.integer({ min: 20, max: 80 }),
    skill_social: chance.integer({ min: 20, max: 80 }),
    skill_combat: chance.integer({ min: 20, max: 80 }),
    trait_bravery: chance.integer({ min: 0, max: 100 }),
    trait_loyalty: chance.integer({ min: 0, max: 100 }),
    trait_ambition: chance.integer({ min: 0, max: 100 }),
    trait_work_ethic: chance.integer({ min: 0, max: 100 }),
    morale: chance.integer({ min: 40, max: 90 }),
    health: chance.integer({ min: 80, max: 100 }),
    stress: chance.integer({ min: 0, max: 30 }),
    ...overrides
  }
  
  await query(
    `INSERT INTO crew_members (id, ship_id, name, age, homeworld, culture, skill_engineering, skill_piloting, skill_social, skill_combat, trait_bravery, trait_loyalty, trait_ambition, trait_work_ethic, morale, health, stress)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [testData.id, testData.ship_id, testData.name, testData.age, testData.homeworld, testData.culture, testData.skill_engineering, testData.skill_piloting, testData.skill_social, testData.skill_combat, testData.trait_bravery, testData.trait_loyalty, testData.trait_ambition, testData.trait_work_ethic, testData.morale, testData.health, testData.stress]
  )
  
  return testData
}

export { cleanTestDatabase }