import { query, transaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class MarketRepository {
  async initializeMarketData(stationId, resourceId) {
    const id = uuidv4();
    
    const resourceResult = await query(
      'SELECT base_price, category FROM resources WHERE id = $1',
      [resourceId]
    );
    
    if (resourceResult.rows.length === 0) {
      throw new Error(`Resource ${resourceId} not found`);
    }
    
    const { base_price, category } = resourceResult.rows[0];
    
    const initialSupply = Math.floor(Math.random() * 400) + 100;
    const initialDemand = Math.floor(Math.random() * 400) + 100;
    const currentPrice = base_price;
    
    const result = await query(
      `INSERT INTO market_data (
        id, station_id, resource_id, current_price, 
        supply, demand, price_trend
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (station_id, resource_id) 
      DO UPDATE SET 
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, stationId, resourceId, currentPrice, initialSupply, initialDemand, 0]
    );
    
    return result.rows[0];
  }

  async findByStationAndResource(stationId, resourceId) {
    const result = await query(
      `SELECT 
        md.*,
        r.name as resource_name,
        r.category as resource_category,
        r.base_price
      FROM market_data md
      JOIN resources r ON md.resource_id = r.id
      WHERE md.station_id = $1 AND md.resource_id = $2`,
      [stationId, resourceId]
    );
    
    return result.rows[0] || null;
  }

  async findAllMarkets() {
    const result = await query(
      `SELECT 
        md.*,
        r.name as resource_name,
        r.category as resource_category,
        r.base_price,
        md.station_id as station_name
      FROM market_data md
      JOIN resources r ON md.resource_id = r.id
      ORDER BY md.station_id, r.category, r.name`
    );
    
    return result.rows;
  }

  async findByStation(stationId) {
    const result = await query(
      `SELECT 
        md.*,
        r.name as resource_name,
        r.category as resource_category,
        r.base_price,
        r.weight,
        r.volume
      FROM market_data md
      JOIN resources r ON md.resource_id = r.id
      WHERE md.station_id = $1
      ORDER BY r.category, r.name`,
      [stationId]
    );
    
    return result.rows;
  }

  async updateMarketData(updates) {
    return await transaction(async (client) => {
      const results = [];
      
      for (const update of updates) {
        const result = await client.query(
          `UPDATE market_data
          SET 
            current_price = $3,
            supply = $4,
            demand = $5,
            price_trend = $6,
            last_updated = $7
          WHERE station_id = $1 AND resource_id = $2
          RETURNING *`,
          [
            update.stationId,
            update.resourceId,
            update.currentPrice,
            update.supply,
            update.demand,
            update.priceTrend,
            update.updatedAt || new Date()
          ]
        );
        
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }
      
      return results;
    });
  }

  async recordPriceHistory(marketDataId, price, supply, demand) {
    const result = await query(
      `INSERT INTO market_price_history (
        id, market_data_id, price, supply, demand
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [uuidv4(), marketDataId, price, supply, demand]
    );
    
    return result.rows[0];
  }

  async getMarketTrends(stationId, resourceId, hours = 24) {
    const result = await query(
      `SELECT 
        mph.price,
        mph.supply,
        mph.demand,
        mph.created_at
      FROM market_price_history mph
      JOIN market_data md ON mph.market_data_id = md.id
      WHERE md.station_id = $1 
        AND md.resource_id = $2
        AND mph.created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY mph.created_at DESC`,
      [stationId, resourceId]
    );
    
    return result.rows;
  }

  async initializeAllMarkets(stationIds, resourceIds) {
    return await transaction(async (client) => {
      const results = [];
      
      for (const stationId of stationIds) {
        for (const resourceId of resourceIds) {
          const existing = await client.query(
            'SELECT id FROM market_data WHERE station_id = $1 AND resource_id = $2',
            [stationId, resourceId]
          );
          
          if (existing.rows.length === 0) {
            const resourceResult = await client.query(
              'SELECT base_price, category FROM resources WHERE id = $1',
              [resourceId]
            );
            
            if (resourceResult.rows.length > 0) {
              const { base_price } = resourceResult.rows[0];
              const id = uuidv4();
              const initialSupply = Math.floor(Math.random() * 400) + 100;
              const initialDemand = Math.floor(Math.random() * 400) + 100;
              
              const result = await client.query(
                `INSERT INTO market_data (
                  id, station_id, resource_id, current_price, 
                  supply, demand, price_trend
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [id, stationId, resourceId, base_price, initialSupply, initialDemand, 0]
              );
              
              results.push(result.rows[0]);
            }
          }
        }
      }
      
      return results;
    });
  }

  async executeTrade(stationId, resourceId, side, volume, playerId) {
    return await transaction(async (client) => {
      // 1. Get current market data, or create it if it doesn't exist
      let marketResult = await client.query(
        'SELECT * FROM market_data WHERE station_id = $1 AND resource_id = $2 FOR UPDATE',
        [stationId, resourceId]
      );

      if (marketResult.rows.length === 0) {
        await this.initializeMarketData(stationId, resourceId);
        marketResult = await client.query(
          'SELECT * FROM market_data WHERE station_id = $1 AND resource_id = $2 FOR UPDATE',
          [stationId, resourceId]
        );
      }

      const market = marketResult.rows[0];
      const price = market.current_price;
      const totalCost = price * volume;

      // 2. Get player data
      const playerResult = await client.query(
        'SELECT * FROM players WHERE id = $1 FOR UPDATE',
        [playerId]
      );

      if (playerResult.rows.length === 0) {
        throw new Error(`Player ${playerId} not found`);
      }

      const player = playerResult.rows[0];

      // 3. Perform transaction logic
      if (side === 'buy') {
        if (player.credits < totalCost) {
          throw new Error('Insufficient credits');
        }
        if (market.supply < volume) {
          throw new Error('Insufficient supply');
        }

        // Update player and market
        await client.query(
          'UPDATE players SET credits = credits - $1 WHERE id = $2',
          [totalCost, playerId]
        );
        await client.query(
          'UPDATE market_data SET supply = supply - $1, demand = demand + $2 WHERE id = $3',
          [volume, volume, market.id]
        );
      } else if (side === 'sell') {
        // For selling, we'd need to check player inventory, which is not modeled yet.
        // For now, we'll just assume the player has the resources.
        await client.query(
          'UPDATE players SET credits = credits + $1 WHERE id = $2',
          [totalCost, playerId]
        );
        await client.query(
          'UPDATE market_data SET supply = supply + $1, demand = demand - $2 WHERE id = $3',
          [volume, volume, market.id]
        );
      } else {
        throw new Error(`Invalid trade side: ${side}`);
      }

      // 4. Record transaction history (disabled until table is created)
      // TODO: Create player_transactions table and uncomment this
      // await client.query(
      //   'INSERT INTO player_transactions (id, player_id, transaction_type, resource_id, quantity, unit_price, location) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      //   [uuidv4(), playerId, side, resourceId, volume, price, { station: stationId }]
      // );

      return { success: true, totalCost, newCredits: side === 'buy' ? player.credits - totalCost : player.credits + totalCost };
    });
  }
}

export default MarketRepository;