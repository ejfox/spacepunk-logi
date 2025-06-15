import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class PlayerRepository {
  async create(playerData) {
    const { username, email, passwordHash } = playerData;
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO players (id, username, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, created_at, deaths, is_active`,
      [id, username, email, passwordHash]
    );
    
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT id, username, email, created_at, updated_at, last_login, 
              is_active, deaths
       FROM players 
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async findByUsername(username) {
    const result = await query(
      `SELECT id, username, email, password_hash, created_at, updated_at, 
              last_login, is_active, deaths
       FROM players 
       WHERE username = $1`,
      [username]
    );
    
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      `SELECT id, username, email, password_hash, created_at, updated_at,
              last_login, is_active, deaths
       FROM players 
       WHERE email = $1`,
      [email]
    );
    
    return result.rows[0] || null;
  }

  async updateLastLogin(id) {
    const result = await query(
      `UPDATE players 
       SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, email, last_login`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async incrementDeaths(id) {
    const result = await query(
      `UPDATE players 
       SET deaths = deaths + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, deaths`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async setActive(id, isActive) {
    const result = await query(
      `UPDATE players 
       SET is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, is_active`,
      [id, isActive]
    );
    
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await query(
      `DELETE FROM players 
       WHERE id = $1
       RETURNING id, username`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  async list(limit = 50, offset = 0) {
    const result = await query(
      `SELECT id, username, email, created_at, last_login, is_active, deaths
       FROM players 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }

  async getPlayerStats(id) {
    const result = await query(
      `SELECT 
         p.id, p.username, p.deaths, p.created_at,
         COUNT(s.id) as ship_count,
         COUNT(cm.id) as crew_count
       FROM players p
       LEFT JOIN ships s ON s.player_id = p.id AND s.destroyed_at IS NULL
       LEFT JOIN crew_members cm ON cm.ship_id = s.id AND cm.died_at IS NULL
       WHERE p.id = $1
       GROUP BY p.id, p.username, p.deaths, p.created_at`,
      [id]
    );
    
    return result.rows[0] || null;
  }
}