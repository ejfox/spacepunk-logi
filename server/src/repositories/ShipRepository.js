import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ShipRepository {
  async create(shipData) {
    const {
      playerId,
      name,
      hullType = 'basic',
      locationGalaxy = 'Sol',
      locationStation = 'Earth Station',
      fuelMax = 100,
      cargoMax = 100
    } = shipData;
    
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO ships (id, player_id, name, hull_type, location_galaxy, 
                         location_station, fuel_current, fuel_max, cargo_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, player_id, name, hull_type, status, location_galaxy, 
                 location_station, fuel_current, fuel_max, cargo_used, 
                 cargo_max, created_at`,
      [id, playerId, name, hullType, locationGalaxy, locationStation, 
       fuelMax, fuelMax, cargoMax]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT id, player_id, name, hull_type, status, location_galaxy,
              location_station, fuel_current, fuel_max, cargo_used, cargo_max,
              created_at, updated_at, destroyed_at
       FROM ships 
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async findByPlayerId(playerId) {
    const result = await query(
      `SELECT id, player_id, name, hull_type, status, location_galaxy,
              location_station, fuel_current, fuel_max, cargo_used, cargo_max,
              created_at, updated_at, destroyed_at
       FROM ships 
       WHERE player_id = $1 AND destroyed_at IS NULL
       ORDER BY created_at DESC`,
      [playerId]
    );
    
    return result.rows;
  }

  async findAtStation(stationName) {
    const result = await query(
      `SELECT s.*, p.username as owner_name
       FROM ships s
       JOIN players p ON p.id = s.player_id
       WHERE s.location_station = $1 AND s.destroyed_at IS NULL
       ORDER BY s.created_at DESC`,
      [stationName]
    );
    
    return result.rows;
  }

  async updateLocation(id, galaxy, station) {
    const result = await query(
      `UPDATE ships 
       SET location_galaxy = $2, location_station = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND destroyed_at IS NULL
       RETURNING id, name, location_galaxy, location_station`,
      [id, galaxy, station]
    );
    
    return result.rows[0] || null;
  }

  async updateFuel(id, fuelCurrent) {
    const result = await query(
      `UPDATE ships 
       SET fuel_current = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND destroyed_at IS NULL
       RETURNING id, name, fuel_current, fuel_max`,
      [id, fuelCurrent]
    );
    
    return result.rows[0] || null;
  }

  async updateCargo(id, cargoUsed) {
    const result = await query(
      `UPDATE ships 
       SET cargo_used = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND destroyed_at IS NULL
       RETURNING id, name, cargo_used, cargo_max`,
      [id, cargoUsed]
    );
    
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE ships 
       SET status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND destroyed_at IS NULL
       RETURNING id, name, status`,
      [id, status]
    );
    
    return result.rows[0] || null;
  }

  async destroy(id) {
    const result = await query(
      `UPDATE ships 
       SET status = 'destroyed', destroyed_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, destroyed_at`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getShipWithComponents(id) {
    const result = await query(
      `SELECT 
         s.*,
         json_agg(
           json_build_object(
             'id', sc.id,
             'type', sc.component_type,
             'name', sc.component_name,
             'material', sc.material,
             'condition', sc.condition,
             'efficiency', sc.efficiency,
             'installed_at', sc.installed_at
           )
         ) FILTER (WHERE sc.id IS NOT NULL) as components
       FROM ships s
       LEFT JOIN ship_components sc ON sc.ship_id = s.id
       WHERE s.id = $1 AND s.destroyed_at IS NULL
       GROUP BY s.id`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getShipWithCrew(id) {
    const result = await query(
      `SELECT 
         s.*,
         json_agg(
           json_build_object(
             'id', cm.id,
             'name', cm.name,
             'age', cm.age,
             'homeworld', cm.homeworld,
             'culture', cm.culture,
             'skills', json_build_object(
               'engineering', cm.skill_engineering,
               'piloting', cm.skill_piloting,
               'social', cm.skill_social,
               'combat', cm.skill_combat
             ),
             'status', json_build_object(
               'health', cm.health,
               'morale', cm.morale,
               'fatigue', cm.fatigue
             )
           )
         ) FILTER (WHERE cm.id IS NOT NULL) as crew
       FROM ships s
       LEFT JOIN crew_members cm ON cm.ship_id = s.id AND cm.died_at IS NULL
       WHERE s.id = $1 AND s.destroyed_at IS NULL
       GROUP BY s.id`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async list(limit = 50, offset = 0) {
    const result = await query(
      `SELECT s.*, p.username as owner_name
       FROM ships s
       JOIN players p ON p.id = s.player_id
       WHERE s.destroyed_at IS NULL
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }
}