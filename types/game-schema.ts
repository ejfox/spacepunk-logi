/**
 * SPACEPUNK LOGISTICS - SINGLE SOURCE OF TRUTH
 * Game Schema Definitions & Types
 * 
 * This file defines the canonical structure for all game entities.
 * Use this as the reference for database schemas, API responses, and frontend types.
 */

// ===========================================
// CORE GAME ENTITIES
// ===========================================

export interface Player {
  id: string
  username: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
  last_login_at: string | null
  is_active: boolean
  deaths: number
  software_license: 'BASIC' | 'STANDARD' | 'PROFESSIONAL'
  credits: number
  reputation: number
}

export interface Ship {
  id: string
  player_id: string | null
  name: string
  hull_type: string
  status: 'operational' | 'damaged' | 'destroyed' | 'docked'
  location_galaxy: string | null
  location_station: string | null
  fuel_current: number
  fuel_max: number
  cargo_used: number
  cargo_max: number
  created_at: string
  updated_at: string
  destroyed_at: string | null
}

export interface CrewMember {
  id: string
  ship_id: string | null
  name: string
  age: number
  homeworld: string
  culture: string
  // Skills (0-100)
  skill_engineering: number
  skill_piloting: number
  skill_social: number
  skill_combat: number
  // Personality Traits (0-100)
  trait_bravery: number
  trait_loyalty: number
  trait_ambition: number
  trait_work_ethic: number
  trait_extroversion: number
  trait_thinking: number
  trait_sensing: number
  trait_judging: number
  // Jungian Archetypes (0-100)
  archetype_innocent: number
  archetype_sage: number
  archetype_explorer: number
  archetype_outlaw: number
  archetype_magician: number
  archetype_hero: number
  archetype_lover: number
  archetype_jester: number
  archetype_caregiver: number
  archetype_creator: number
  archetype_ruler: number
  archetype_orphan: number
  // Status (0-100)
  health: number
  morale: number
  fatigue: number
  stress: number
  // Narrative Fields
  backstory: string | null
  employment_notes: string | null
  previous_job: string | null
  availability_reason: string | null
  notable_incident: string | null
  employment_red_flags: string | null
  skills_summary: string | null
  personality_quirks: string | null
  // Meta Fields
  hiring_cost: number
  corporate_rating: string
  clearance_level: number
  union_member: boolean
  hired_at: string | null
  created_at: string
  updated_at: string
  died_at: string | null
  parent_ids: string[]
}

export interface Station {
  id: string
  name: string
  galaxy: string
  sector: string | null
  station_type: string
  faction: string | null
  population: number
  security_level: number
  trade_volume: number
  description: string | null
  notorious_for: string | null
  bureaucratic_nightmare: string | null
  local_regulations: string | null
  docking_fee: number
  fuel_price: number
  repair_quality: number
  black_market_activity: number
  corruption_level: number
  health_rating: string
  amenities: string[] | null
  restricted_goods: string[] | null
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  title: string
  description: string
  mission_type: string | null
  issuing_faction: string | null
  target_location: string | null
  reward_credits: number
  reward_reputation: object
  requirements: object
  expires_at: string | null
  difficulty_level: number
  estimated_duration: number | null
  risk_level: string
  cargo_space_required: number
  crew_skills_required: object | null
  legal_status: string
  corporate_sponsor: string | null
  failure_consequences: string | null
  hidden_complications: string | null
  bureaucratic_catch: string | null
  created_at: string
  is_active: boolean
  // Additional mission fields
  type: string
  difficulty: string
  objectives: object[]
  rewards: object
  deadline_hours: number
  risks: object[]
  flavor_text: string
  station_id: string | null
  generated_by: string
  status: 'available' | 'accepted' | 'completed' | 'failed' | 'expired'
  accepted_by: string | null
  accepted_at: string | null
  ship_id: string | null
  completed_at: string | null
  completion_notes: string | null
  actual_rewards: object
}

export interface Resource {
  id: string
  name: string
  category: string
  base_price: number
  weight: number
  volume: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface MarketData {
  id: string
  station_id: string
  resource_id: string
  current_price: number
  supply: number
  demand: number
  price_trend: number
  last_updated: string
}

export interface TrainingQueue {
  id: string
  crew_member_id: string
  training_type: string
  skill_type: string | null
  skill_increase: number
  start_time: string
  end_time: string
  duration_hours: number
  intensity: number
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  progress_made: number
  efficiency: number
  burnout: boolean
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

// ===========================================
// GOD MODE API RESPONSE TYPES
// ===========================================

export interface GodModeWorldOverview {
  summary: {
    totalPlayers: number
    totalShips: number
    livingCrewMembers: number
    totalStations: number
    marketItems: number
    activeTraining: number
  }
  missionsByStatus: Record<string, number>
  timestamp: string
}

export interface GodModePlayer extends Player {
  ship_name: string | null
  hull_type: string | null
  ship_status: string | null
  crew_count: number
  active_missions: number
}

export interface GodModeShip extends Ship {
  player_name: string | null
  player_email: string | null
  crew_count: number
  active_missions: number
  active_training: number
}

export interface GodModeCrewMember extends CrewMember {
  ship_name: string | null
  player_name: string | null
  active_training: number
  memory_count: number
}

export interface GodModeStation extends Station {
  market_items: number
  total_missions: number
  available_missions: number
}

export interface GodModeMission extends Mission {
  station_name: string | null
  accepted_by_player: string | null
  ship_name: string | null
}

export interface GodModeMarketData extends MarketData {
  resource_name: string
  resource_category: string
  base_price: number
  station_name: string
  galaxy: string
  sector: string
}

export interface GodModeTrainingData extends TrainingQueue {
  crew_name: string
  ship_name: string | null
  player_name: string | null
}

export interface GodModeSystemStatus {
  databaseStats: Array<{
    schemaname: string
    tablename: string
    inserts: number
    updates: number
    deletes: number
    live_rows: number
  }>
  serverUptime: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers: number
  }
  timestamp: string
}

// ===========================================
// DATABASE SCHEMA VALIDATION
// ===========================================

export const DATABASE_SCHEMA = {
  players: {
    required: ['id', 'username', 'email', 'password_hash'],
    optional: ['created_at', 'updated_at', 'last_login_at', 'is_active', 'deaths', 'software_license', 'credits', 'reputation']
  },
  ships: {
    required: ['id', 'name', 'hull_type'],
    optional: ['player_id', 'status', 'location_galaxy', 'location_station', 'fuel_current', 'fuel_max', 'cargo_used', 'cargo_max', 'created_at', 'updated_at', 'destroyed_at']
  },
  crew_members: {
    required: ['id', 'name', 'age', 'homeworld', 'culture'],
    optional: ['ship_id', 'skill_engineering', 'skill_piloting', 'skill_social', 'skill_combat', 'trait_bravery', 'trait_loyalty', 'trait_ambition', 'trait_work_ethic', 'health', 'morale', 'fatigue', 'hired_at', 'created_at', 'updated_at', 'died_at']
  },
  missions: {
    required: ['id', 'title', 'description'],
    optional: ['type', 'difficulty', 'status', 'rewards', 'objectives', 'risks', 'deadline_hours', 'station_id', 'accepted_by', 'ship_id', 'created_at', 'expires_at']
  },
  training_queue: {
    required: ['id', 'crew_member_id', 'training_type', 'end_time', 'duration_hours'],
    optional: ['skill_type', 'skill_increase', 'start_time', 'intensity', 'status', 'progress_made', 'efficiency', 'burnout', 'completed_at', 'cancelled_at', 'created_at', 'updated_at']
  }
} as const

// ===========================================
// API ENDPOINT PATHS
// ===========================================

export const GOD_MODE_ENDPOINTS = {
  WORLD_OVERVIEW: '/api/god-mode/world-overview',
  PLAYERS: '/api/god-mode/players',
  SHIPS: '/api/god-mode/ships',
  CREW: '/api/god-mode/crew',
  STATIONS: '/api/god-mode/stations',
  MISSIONS: '/api/god-mode/missions',
  MARKET: '/api/god-mode/market',
  TRAINING: '/api/god-mode/training',
  SYSTEM_STATUS: '/api/god-mode/system-status'
} as const