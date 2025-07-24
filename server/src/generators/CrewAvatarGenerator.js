import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CrewAvatarGenerator - Generates abstract, data-driven SVG avatars for crew members
 * 
 * DESIGN PHILOSOPHY:
 * - Avatars are data visualizations, not portraits
 * - Brutalist aesthetic: simple shapes, monochrome with accent colors
 * - Every visual element maps to crew data
 * - Progressive revelation based on player meta-knowledge
 */
export class CrewAvatarGenerator {
  constructor() {
    // SVG module paths
    this.svgModulesPath = path.join(__dirname, '../../../shared/svg_modules');
    
    // Color palettes for different cultures (corporate brutalist colors)
    this.culturePalettes = {
      Corporate: { primary: '#0066cc', secondary: '#333333', accent: '#00ff00' },
      Belter: { primary: '#ff6600', secondary: '#442200', accent: '#ffaa00' },
      Spacer: { primary: '#9966ff', secondary: '#330066', accent: '#cc99ff' },
      Agricultural: { primary: '#00cc66', secondary: '#003322', accent: '#66ff99' },
      Military: { primary: '#cc0000', secondary: '#440000', accent: '#ff6666' },
      default: { primary: '#666666', secondary: '#222222', accent: '#999999' }
    };
    
    // Load SVG modules into memory
    this.svgCache = this.loadSVGModules();
  }

  /**
   * Load SVG modules from filesystem into memory cache
   */
  loadSVGModules() {
    const cache = {
      baseShapes: {},
      traitGlyphs: {},
      statusOverlays: {},
      timeDebtEffects: {}
    };
    
    try {
      // Load base shapes
      const baseShapesDir = path.join(this.svgModulesPath, 'base_shapes');
      if (fs.existsSync(baseShapesDir)) {
        const files = fs.readdirSync(baseShapesDir);
        files.forEach(file => {
          if (file.endsWith('.svg')) {
            const name = file.replace('.svg', '');
            cache.baseShapes[name] = fs.readFileSync(path.join(baseShapesDir, file), 'utf8');
          }
        });
      }
      
      // Load trait glyphs
      const traitGlyphsDir = path.join(this.svgModulesPath, 'trait_glyphs');
      if (fs.existsSync(traitGlyphsDir)) {
        const files = fs.readdirSync(traitGlyphsDir);
        files.forEach(file => {
          if (file.endsWith('.svg')) {
            const name = file.replace('.svg', '');
            cache.traitGlyphs[name] = fs.readFileSync(path.join(traitGlyphsDir, file), 'utf8');
          }
        });
      }
      
      // Load status overlays
      const statusOverlaysDir = path.join(this.svgModulesPath, 'status_overlays');
      if (fs.existsSync(statusOverlaysDir)) {
        const files = fs.readdirSync(statusOverlaysDir);
        files.forEach(file => {
          if (file.endsWith('.svg')) {
            const name = file.replace('.svg', '');
            cache.statusOverlays[name] = fs.readFileSync(path.join(statusOverlaysDir, file), 'utf8');
          }
        });
      }
      
      // Load time debt effects
      const timeDebtDir = path.join(this.svgModulesPath, 'time_debt_effects');
      if (fs.existsSync(timeDebtDir)) {
        const files = fs.readdirSync(timeDebtDir);
        files.forEach(file => {
          if (file.endsWith('.svg')) {
            const name = file.replace('.svg', '');
            cache.timeDebtEffects[name] = fs.readFileSync(path.join(timeDebtDir, file), 'utf8');
          }
        });
      }
    } catch (error) {
      console.error('Error loading SVG modules:', error);
    }
    
    return cache;
  }

  /**
   * Generate a complete avatar SVG for a crew member
   * @param {Object} crewMember - Crew member data from database
   * @param {Array} playerMetaTraits - Player's meta-knowledge traits for progressive revelation
   * @returns {string} Complete SVG string
   */
  generateAvatar(crewMember, playerMetaTraits = []) {
    const {
      id,
      name,
      culture = 'default',
      cultural_background,
      skill_engineering = 0,
      skill_piloting = 0,
      skill_social = 0,
      skill_combat = 0,
      trait_bravery = 50,
      trait_loyalty = 50,
      trait_ambition = 50,
      trait_work_ethic = 50,
      health = 100,
      morale = 50,
      fatigue = 0,
      stress = 0,
      crew_type = 'general',
      traits = [],
      time_debt = 0
    } = crewMember;
    
    const cultureName = cultural_background || culture;
    const palette = this.culturePalettes[cultureName] || this.culturePalettes.default;
    
    // Build SVG components
    const svgParts = [];
    
    // 1. Base shape based on culture
    svgParts.push(this.getBaseShape(cultureName, palette));
    
    // 2. Skill indicators (visual complexity)
    svgParts.push(this.generateSkillElements(
      { engineering: skill_engineering, piloting: skill_piloting, social: skill_social, combat: skill_combat },
      palette
    ));
    
    // 3. Personality modifiers (shape variations)
    svgParts.push(this.generatePersonalityModifiers(
      { bravery: trait_bravery, loyalty: trait_loyalty, ambition: trait_ambition, work_ethic: trait_work_ethic }
    ));
    
    // 4. Status overlays (health, morale, fatigue)
    if (health < 50) svgParts.push(this.getStatusOverlay('health_low'));
    if (morale < 30) svgParts.push(this.getStatusOverlay('morale_low'));
    if (fatigue > 70) svgParts.push(this.getStatusOverlay('fatigue_high'));
    
    // 5. Trait glyphs (with progressive revelation)
    const visibleTraits = this.getVisibleTraits(traits, playerMetaTraits);
    svgParts.push(this.generateTraitGlyphs(visibleTraits));
    
    // 6. Time debt effects
    if (time_debt > 0) {
      svgParts.push(this.getTimeDebtEffect(time_debt));
    }
    
    // 7. Meta-narrative glitches (rare)
    if (Math.random() < 0.02) { // 2% chance
      svgParts.push(this.generateGlitch());
    }
    
    // Combine all parts into final SVG
    return this.assembleSVG(svgParts, palette, id);
  }

  /**
   * Get base shape SVG based on culture
   */
  getBaseShape(culture, palette) {
    const shapeMap = {
      'Corporate': 'corporate_unit',
      'Belter': 'belter_organic',
      'Spacer': 'spacer_fluid',
      'Agricultural': 'agricultural_organic',
      'Military': 'military_structured'
    };
    
    const shapeName = shapeMap[culture] || 'corporate_unit';
    let shapeSVG = this.svgCache.baseShapes[shapeName] || this.generateFallbackShape();
    
    // Replace currentColor with palette primary
    shapeSVG = shapeSVG.replace(/currentColor/g, palette.primary);
    
    return shapeSVG;
  }

  /**
   * Generate skill-based visual elements
   */
  generateSkillElements(skills, palette) {
    const elements = [];
    const totalSkills = Object.values(skills).reduce((sum, val) => sum + val, 0);
    const complexity = Math.floor(totalSkills / 50); // 0-8 complexity levels
    
    // Engineering skill: add technical elements
    if (skills.engineering > 60) {
      elements.push(`
        <g class="skill-engineering" opacity="${skills.engineering / 100}">
          <rect x="25" y="70" width="8" height="15" fill="${palette.accent}" opacity="0.6"/>
          <rect x="35" y="75" width="8" height="10" fill="${palette.accent}" opacity="0.6"/>
          <line x1="29" y1="72" x2="29" y2="83" stroke="${palette.accent}" stroke-width="0.5"/>
        </g>
      `);
    }
    
    // Piloting skill: add navigation elements
    if (skills.piloting > 60) {
      elements.push(`
        <g class="skill-piloting" opacity="${skills.piloting / 100}">
          <circle cx="70" cy="25" r="8" fill="none" stroke="${palette.accent}" stroke-width="1" opacity="0.5"/>
          <line x1="70" y1="17" x2="70" y2="33" stroke="${palette.accent}" stroke-width="0.5"/>
          <line x1="62" y1="25" x2="78" y2="25" stroke="${palette.accent}" stroke-width="0.5"/>
        </g>
      `);
    }
    
    // Social skill: add connection elements
    if (skills.social > 60) {
      elements.push(`
        <g class="skill-social" opacity="${skills.social / 100}">
          <circle cx="30" cy="30" r="3" fill="${palette.secondary}" opacity="0.4"/>
          <circle cx="40" cy="35" r="3" fill="${palette.secondary}" opacity="0.4"/>
          <line x1="33" y1="30" x2="37" y2="35" stroke="${palette.secondary}" stroke-width="0.5" opacity="0.6"/>
        </g>
      `);
    }
    
    // Combat skill: add defensive elements
    if (skills.combat > 60) {
      elements.push(`
        <g class="skill-combat" opacity="${skills.combat / 100}">
          <polygon points="60,70 65,65 70,70 70,80 65,85 60,80" fill="none" stroke="${palette.accent}" stroke-width="1" opacity="0.5"/>
        </g>
      `);
    }
    
    return elements.join('\n');
  }

  /**
   * Generate personality-based shape modifiers
   */
  generatePersonalityModifiers(personality) {
    const modifiers = [];
    
    // High bravery: sharper angles
    if (personality.bravery > 70) {
      modifiers.push(`
        <g class="personality-brave" transform="skewY(${(personality.bravery - 50) / 10})">
          <polyline points="15,15 20,10 25,15" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
        </g>
      `);
    }
    
    // High loyalty: stable foundation
    if (personality.loyalty > 70) {
      modifiers.push(`
        <g class="personality-loyal">
          <rect x="20" y="85" width="60" height="3" fill="currentColor" opacity="${personality.loyalty / 200}"/>
        </g>
      `);
    }
    
    // High ambition: upward elements
    if (personality.ambition > 70) {
      modifiers.push(`
        <g class="personality-ambitious">
          <path d="M 50,20 L 48,10 L 50,5 L 52,10 Z" fill="currentColor" opacity="${personality.ambition / 200}"/>
        </g>
      `);
    }
    
    return modifiers.join('\n');
  }

  /**
   * Get status overlay SVG
   */
  getStatusOverlay(type) {
    return this.svgCache.statusOverlays[type] || '';
  }

  /**
   * Generate trait glyphs with progressive revelation
   */
  generateTraitGlyphs(visibleTraits) {
    const glyphs = [];
    const positions = [
      { x: 10, y: 10 },
      { x: 80, y: 10 },
      { x: 10, y: 80 },
      { x: 80, y: 80 }
    ];
    
    visibleTraits.slice(0, 4).forEach((trait, index) => {
      if (trait.hidden) {
        // Show placeholder for hidden traits
        glyphs.push(`
          <g class="trait-hidden" transform="translate(${positions[index].x}, ${positions[index].y})">
            <rect x="-5" y="-5" width="10" height="10" fill="none" stroke="#666666" stroke-dasharray="2,2" opacity="0.5"/>
            <text x="0" y="0" text-anchor="middle" font-size="8" fill="#666666" opacity="0.5">?</text>
          </g>
        `);
      } else {
        const glyphSVG = this.svgCache.traitGlyphs[trait.key] || this.generateGenericTraitGlyph(trait);
        glyphs.push(`
          <g class="trait-${trait.key}" transform="translate(${positions[index].x}, ${positions[index].y}) scale(0.8)">
            ${glyphSVG}
          </g>
        `);
      }
    });
    
    return glyphs.join('\n');
  }

  /**
   * Get visible traits based on player meta-knowledge
   */
  getVisibleTraits(traits, playerMetaTraits) {
    if (!playerMetaTraits.includes('pays_attention_to_people')) {
      // All traits hidden
      return traits.map(t => ({ ...t, hidden: true }));
    }
    
    if (!playerMetaTraits.includes('good_judge_of_character')) {
      // Show trait exists but not details
      return traits.map(t => ({ ...t, key: t.key || 'unknown', name: '???', level: '?' }));
    }
    
    if (!playerMetaTraits.includes('knows_the_business')) {
      // Show trait details but not mechanical effects
      return traits.map(t => ({ ...t, effects_hidden: true }));
    }
    
    // Show everything
    return traits;
  }

  /**
   * Generate time debt visual effects
   */
  getTimeDebtEffect(timeDebt) {
    const intensity = Math.min(timeDebt / 100, 1);
    return this.svgCache.timeDebtEffects['temporal_ripple'] || `
      <g class="time-debt-effect">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#9966ff" stroke-width="0.5" opacity="${intensity * 0.3}">
          <animate attributeName="r" values="45;50;45" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${intensity * 0.3};${intensity * 0.1};${intensity * 0.3}" dur="3s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  }

  /**
   * Generate random glitch effect
   */
  generateGlitch() {
    const glitchType = Math.random();
    if (glitchType < 0.5) {
      return `
        <g class="glitch-effect">
          <text x="50" y="50" text-anchor="middle" font-family="monospace" font-size="10" fill="#ff0000" opacity="0.8">[MEMORY ERROR]</text>
        </g>
      `;
    } else {
      return `
        <g class="glitch-effect">
          <rect x="0" y="${Math.random() * 80}" width="100" height="2" fill="#00ff00" opacity="0.6">
            <animate attributeName="y" values="${Math.random() * 80};${Math.random() * 80};${Math.random() * 80}" dur="0.1s" repeatCount="3"/>
          </rect>
        </g>
      `;
    }
  }

  /**
   * Generate fallback shape if file not found
   */
  generateFallbackShape() {
    return `
      <g class="fallback-shape">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.2"/>
      </g>
    `;
  }

  /**
   * Generate generic trait glyph
   */
  generateGenericTraitGlyph(trait) {
    const level = trait.level || 1;
    const size = 5 + (level * 2);
    return `
      <g class="generic-trait">
        <rect x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" 
              fill="currentColor" opacity="${0.2 + (level * 0.2)}"
              transform="rotate(45)"/>
      </g>
    `;
  }

  /**
   * Assemble all SVG parts into final avatar
   */
  assembleSVG(parts, palette, id) {
    // Filter out empty parts
    const validParts = parts.filter(part => part && part.trim());
    
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" data-crew-id="${id}">
  <defs>
    <style>
      .crew-avatar-${id.slice(0, 8)} {
        --primary: ${palette.primary};
        --secondary: ${palette.secondary};
        --accent: ${palette.accent};
      }
    </style>
  </defs>
  <g class="crew-avatar-${id.slice(0, 8)}">
    <!-- Background -->
    <rect width="100" height="100" fill="#000000"/>
    <rect x="1" y="1" width="98" height="98" fill="none" stroke="${palette.secondary}" stroke-width="1" opacity="0.5"/>
    
    <!-- Avatar Elements -->
    ${validParts.join('\n    ')}
  </g>
</svg>`;
  }

  /**
   * Generate a batch of avatars for performance
   * @param {Array} crewMembers - Array of crew member data
   * @param {Array} playerMetaTraits - Player's meta-knowledge traits
   * @returns {Object} Map of crew IDs to SVG strings
   */
  generateBatch(crewMembers, playerMetaTraits = []) {
    const avatars = {};
    
    crewMembers.forEach(crew => {
      avatars[crew.id] = this.generateAvatar(crew, playerMetaTraits);
    });
    
    return avatars;
  }
}

export default CrewAvatarGenerator;