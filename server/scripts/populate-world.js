#!/usr/bin/env node

/**
 * World Population Script
 * Uses LLM to generate tons of content for the Spacepunk universe
 */

import { ContentGenerator } from '../src/generators/ContentGenerator.js';
import { query, initDatabase } from '../src/db/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const contentGenerator = new ContentGenerator();

async function populateWorld() {
  console.log('🌌 SPACEPUNK WORLD POPULATION SCRIPT');
  console.log('=====================================');
  
  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await initDatabase();
    console.log('✅ Database connected!');
    // Generate and insert resources (small test first)
    console.log('📦 Generating resources...');
    const resources = await contentGenerator.generateResources(5);
    console.log(`Generated ${resources.length} resources`);
    
    for (const resource of resources) {
      try {
        await query(
          `INSERT INTO resources (code, name, category, base_price, weight, volume, description) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [resource.code, resource.name, resource.category, resource.base_price, 
           resource.weight, resource.volume, resource.description]
        );
      } catch (err) {
        console.log(`Skipped duplicate resource: ${resource.code}`);
      }
    }
    
    // Generate and insert stations
    console.log('🚀 Generating stations...');
    const stations = await contentGenerator.generateStations(25);
    console.log(`Generated ${stations.length} stations`);
    
    for (const station of stations) {
      try {
        await query(
          `INSERT INTO stations (name, galaxy, sector, station_type, faction, population, 
                               security_level, description, notorious_for, bureaucratic_nightmare, 
                               local_regulations, docking_fee, fuel_price, repair_quality, 
                               black_market_activity, corruption_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [station.name, station.galaxy, station.sector, station.station_type, station.faction,
           station.population || 10000, station.security_level || 50, station.description,
           station.notorious_for, station.bureaucratic_nightmare, station.local_regulations,
           Math.floor(Math.random() * 200) + 25, // docking_fee 25-225
           Math.floor(Math.random() * 30) + 40,  // fuel_price 40-70
           Math.floor(Math.random() * 100),      // repair_quality 0-100
           Math.floor(Math.random() * 60),       // black_market_activity 0-60
           Math.floor(Math.random() * 80)]       // corruption_level 0-80
        );
      } catch (err) {
        console.log(`Skipped duplicate station: ${station.name}`);
      }
    }
    
    // Generate and insert missions
    console.log('📋 Generating missions...');
    const missions = await contentGenerator.generateMissions(40);
    console.log(`Generated ${missions.length} missions`);
    
    for (const mission of missions) {
      try {
        await query(
          `INSERT INTO missions (title, description, mission_type, issuing_faction, 
                               reward_credits, difficulty_level, risk_level, 
                               hidden_complications, bureaucratic_catch, estimated_duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [mission.title, mission.description, mission.mission_type, mission.issuing_faction,
           mission.reward_credits, Math.floor(Math.random() * 5) + 1, // difficulty 1-5
           ['low', 'medium', 'high', 'extreme'][Math.floor(Math.random() * 4)], // risk level
           mission.hidden_complications, mission.bureaucratic_catch,
           ['2-4 hours', '1-2 days', '3-5 days', '1-2 weeks'][Math.floor(Math.random() * 4)]]
        );
      } catch (err) {
        console.log(`Skipped duplicate mission: ${mission.title}`);
      }
    }
    
    // Generate crew members (store in variables for later use)
    console.log('👥 Generating crew members...');
    const crewMembers = await contentGenerator.generateCrewMembers(30);
    console.log(`Generated ${crewMembers.length} crew members available for hire`);
    
    // You can add them to database here if needed, or keep them for hire pool
    
    console.log('✅ World population complete!');
    console.log('Database now contains:');
    
    // Show counts
    const resourceCount = await query('SELECT COUNT(*) FROM resources');
    const stationCount = await query('SELECT COUNT(*) FROM stations');
    const missionCount = await query('SELECT COUNT(*) FROM missions');
    
    console.log(`📦 ${resourceCount.rows[0].count} resources`);
    console.log(`🚀 ${stationCount.rows[0].count} stations`);
    console.log(`📋 ${missionCount.rows[0].count} missions`);
    console.log(`👥 ${crewMembers.length} crew members generated (not stored)`);
    
  } catch (error) {
    console.error('❌ Population failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateWorld();
}

export { populateWorld };