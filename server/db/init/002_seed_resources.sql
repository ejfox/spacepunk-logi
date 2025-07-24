-- Seed basic resources

-- Tech resources
INSERT INTO resources (code, name, category, base_price, weight, volume, description) VALUES
('COMP_BASIC', 'Basic Computer Components', 'tech', 150.00, 0.5, 0.3, 'Standard computing components for ship systems'),
('SENSOR_ARRAY', 'Sensor Array Module', 'tech', 850.00, 2.0, 1.5, 'Advanced detection and scanning equipment'),
('ENGINE_PARTS', 'Engine Components', 'tech', 500.00, 5.0, 3.0, 'Replacement parts for standard ship engines'),
('WEAPON_SYS', 'Weapon System Components', 'tech', 1200.00, 3.0, 2.0, 'Military-grade weapon system parts'),
('SHIELD_GEN', 'Shield Generator Parts', 'tech', 950.00, 4.0, 2.5, 'Components for shield generation systems'),
('NAV_COMP', 'Navigation Computer', 'tech', 600.00, 1.0, 0.8, 'Advanced navigation computation system');

-- Consumable resources
INSERT INTO resources (code, name, category, base_price, weight, volume, description) VALUES
('FUEL_STD', 'Standard Fuel', 'consumable', 50.00, 1.0, 1.0, 'Standard starship fuel for sublight engines'),
('FUEL_JUMP', 'Jump Fuel', 'consumable', 200.00, 1.0, 1.0, 'High-energy fuel for FTL jumps'),
('FOOD_BASIC', 'Basic Food Supplies', 'consumable', 20.00, 1.0, 1.2, 'Standard crew rations and food supplies'),
('FOOD_LUXURY', 'Luxury Food Items', 'consumable', 150.00, 0.8, 1.0, 'High-quality food for morale boost'),
('MEDICINE', 'Medical Supplies', 'consumable', 100.00, 0.3, 0.5, 'Basic medical supplies and first aid'),
('AMMO_STD', 'Standard Ammunition', 'consumable', 80.00, 2.0, 1.0, 'Standard projectile ammunition'),
('OXYGEN', 'Oxygen Canisters', 'consumable', 60.00, 1.5, 2.0, 'Compressed oxygen for life support'),
('WATER', 'Water Supplies', 'consumable', 30.00, 1.0, 1.0, 'Purified water for crew consumption');

-- Green resources
INSERT INTO resources (code, name, category, base_price, weight, volume, description) VALUES
('BIO_SAMPLES', 'Biological Samples', 'green', 300.00, 0.2, 0.3, 'Various biological specimens for research'),
('PLANTS_MED', 'Medicinal Plants', 'green', 250.00, 0.5, 0.8, 'Plants with medicinal properties'),
('SEEDS_FOOD', 'Food Crop Seeds', 'green', 180.00, 0.1, 0.2, 'Seeds for growing food crops'),
('ALGAE_FUEL', 'Fuel Algae Cultures', 'green', 220.00, 0.8, 1.0, 'Algae cultures for biofuel production'),
('WOOD_RARE', 'Rare Wood Materials', 'green', 400.00, 2.0, 3.0, 'Exotic wood from various planets'),
('ANIMALS_EXOTIC', 'Exotic Animals', 'green', 800.00, 5.0, 8.0, 'Live exotic animals for trade');

-- Luxury resources
INSERT INTO resources (code, name, category, base_price, weight, volume, description) VALUES
('ART_HOLO', 'Holographic Art', 'luxury', 500.00, 0.1, 0.2, 'Digital holographic art pieces'),
('ART_PHYSICAL', 'Physical Artworks', 'luxury', 1000.00, 1.0, 2.0, 'Traditional physical art pieces'),
('GEMS_RARE', 'Rare Gemstones', 'luxury', 2000.00, 0.1, 0.1, 'Precious and rare gemstones'),
('ENTERTAINMENT', 'Entertainment Media', 'luxury', 150.00, 0.1, 0.1, 'Digital entertainment content'),
('SPIRITS', 'Rare Spirits', 'luxury', 350.00, 1.0, 0.8, 'High-quality alcoholic beverages'),
('TEXTILES', 'Luxury Textiles', 'luxury', 450.00, 0.5, 1.0, 'Fine fabrics and clothing materials'),
('SPICES', 'Exotic Spices', 'luxury', 280.00, 0.2, 0.3, 'Rare spices from across the galaxy'),
('ARTIFACTS', 'Ancient Artifacts', 'luxury', 3000.00, 0.5, 0.5, 'Historical artifacts of unknown origin');

-- Seed anchor stations (major hubs that are always the same)
INSERT INTO stations (name, galaxy, sector, station_type, faction, population, security_level, description, docking_fee, fuel_price, repair_quality) VALUES
('Earth Station Alpha', 'Sol System', 'Inner', 'civilian', 'Federation', 50000, 85, 
 'Primary civilian hub for Sol System with gleaming corporate architecture and mandatory productivity monitoring',
 75, 55.00, 85),

('Mars Orbital Platform', 'Sol System', 'Inner', 'mining', 'Federation', 25000, 70,
 'Industrial mining platform extracting essential minerals for corporate use',
 50, 48.00, 60),

('Proxima Trade Hub', 'Proxima Centauri', 'Core', 'trade', 'Commercial Guild', 75000, 60,
 'Massive commercial trading post where every transaction requires extensive documentation',
 100, 52.00, 70);