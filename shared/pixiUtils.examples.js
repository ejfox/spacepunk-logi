/**
 * Spacepunk PixiJS Utilities - Usage Examples
 * 
 * This file contains practical examples of how to use the PixiJS utilities
 * in Spacepunk components. Copy and adapt these examples for your own use.
 */

import * as PIXI from 'pixi.js'
import {
  TERMINAL_COLORS,
  ASCII_CHARS,
  FONT_CONFIGS,
  createASCIIText,
  createASCIIBanner,
  createASCIIProgressBar,
  createASCIIBox,
  createASCIITable,
  createPixelRect,
  createPixelCircle,
  createPixelLine,
  createPixelGrid,
  createRadarSweep,
  createCargoBay,
  createSystemStatus,
  createFlickerEffect,
  createTypingEffect,
  createScanLine,
  createGlitchEffect,
  applyBrutalistStyling
} from './pixiUtils.js'

// =============================================================================
// EXAMPLE: LOCKPICKING INTERFACE
// =============================================================================

export function createLockpickingInterface(app) {
  const container = new PIXI.Container()
  
  // Title banner
  const title = createASCIIBanner([
    '╔═══════════════════════════════╗',
    '║      LOCKPICKING SUBSYSTEM     ║',
    '╚═══════════════════════════════╝'
  ], {
    style: { fill: TERMINAL_COLORS.AMBER },
    lineHeight: 20
  })
  title.x = 50
  title.y = 20
  container.addChild(title)
  
  // Lock visualization with ASCII art
  const lockDisplay = createASCIIText(`
    ╭─────────────────╮
    │  ◯ ◯ ◯ ◯ ◯     │
    │     LOCK        │
    │   CYLINDERS     │
    │  ◯ ◯ ◯ ◯ ◯     │
    ╰─────────────────╯
  `, {
    style: { fill: TERMINAL_COLORS.GRID_GREEN, fontSize: 14 },
    position: { x: 100, y: 100 }
  })
  container.addChild(lockDisplay)
  
  // Progress indicators
  const difficulties = ['ROUTINE', 'STANDARD', 'CHALLENGING', 'DANGEROUS']
  difficulties.forEach((diff, index) => {
    const progress = Math.random() // Simulate progress
    const bar = createASCIIProgressBar(progress, 15, {
      style: { 
        fill: progress > 0.7 ? TERMINAL_COLORS.SUCCESS : TERMINAL_COLORS.WARNING 
      },
      position: { x: 100, y: 250 + index * 25 }
    })
    
    const label = createASCIIText(`${diff}:`, {
      style: { fill: TERMINAL_COLORS.WHITE, fontSize: 12 },
      position: { x: 20, y: 250 + index * 25 }
    })
    
    container.addChild(label)
    container.addChild(bar)
  })
  
  // Status display
  const statusData = [
    { name: 'PICKS', status: 'OK', value: 0.8 },
    { name: 'TENSION', status: 'WARNING', value: 0.6 },
    { name: 'STABILITY', status: 'DANGER', value: 0.2 }
  ]
  
  const statusDisplay = createSystemStatus(statusData, {
    lineHeight: 20
  })
  statusDisplay.x = 50
  statusDisplay.y = 400
  container.addChild(statusDisplay)
  
  return container
}

// =============================================================================
// EXAMPLE: SPYING/SURVEILLANCE INTERFACE
// =============================================================================

export function createSpyingInterface(app) {
  const container = new PIXI.Container()
  
  // Radar sweep
  const radarContainer = new PIXI.Container()
  radarContainer.x = 200
  radarContainer.y = 150
  
  let sweepAngle = 0
  const updateRadar = () => {
    radarContainer.removeChildren()
    const radar = createRadarSweep(80, sweepAngle, {
      color: TERMINAL_COLORS.GRID_GREEN,
      sweepWidth: 0.3
    })
    radarContainer.addChild(radar)
    sweepAngle += 0.05
  }
  
  // Update radar every frame
  app.ticker.add(updateRadar)
  container.addChild(radarContainer)
  
  // Scanning status
  const scanStatus = createASCIIText('SCANNING...', {
    style: { ...FONT_CONFIGS.TERMINAL, fill: TERMINAL_COLORS.AMBER },
    position: { x: 50, y: 50 }
  })
  container.addChild(scanStatus)
  
  // Target data table
  const targetHeaders = ['ID', 'DIST', 'TYPE', 'THREAT']
  const targetData = [
    ['TGT-001', '150m', 'GUARD', 'HIGH'],
    ['TGT-002', '230m', 'CAMERA', 'MED'],
    ['TGT-003', '089m', 'SENSOR', 'LOW']
  ]
  
  const targetTable = createASCIITable(targetHeaders, targetData, {
    colWidth: 8,
    lineHeight: 16,
    style: { fill: TERMINAL_COLORS.GREEN }
  })
  targetTable.x = 50
  targetTable.y = 250
  container.addChild(targetTable)
  
  // Glitch effect for surveillance theme
  const glitch = createGlitchEffect(scanStatus, {
    intensity: 0.05,
    speed: 2000
  })
  
  // Scanning line overlay
  const scanLine = createScanLine(300, 200, {
    color: TERMINAL_COLORS.GRID_GREEN,
    thickness: 1,
    speed: 1
  })
  scanLine.x = 50
  scanLine.y = 100
  container.addChild(scanLine)
  
  return container
}

// =============================================================================
// EXAMPLE: CARGO MANAGEMENT INTERFACE
// =============================================================================

export function createCargoInterface(app) {
  const container = new PIXI.Container()
  
  // Cargo bay visualization
  const cargoItems = [
    { x: 1, y: 1, w: 2, h: 2, label: 'FUEL', color: TERMINAL_COLORS.AMBER },
    { x: 3, y: 1, w: 1, h: 3, label: 'PARTS', color: TERMINAL_COLORS.CORPORATE_BLUE },
    { x: 0, y: 3, w: 3, h: 1, label: 'SUPPLIES', color: TERMINAL_COLORS.NEUTRAL },
    { x: 4, y: 2, w: 1, h: 2, label: 'CREW', color: TERMINAL_COLORS.SUCCESS }
  ]
  
  const cargoBay = createCargoBay(6, 5, cargoItems, {
    cellSize: 30
  })
  cargoBay.x = 50
  cargoBay.y = 100
  container.addChild(cargoBay)
  
  // Cargo stats
  const cargoStats = createASCIIBox(25, 8, {
    style: { fill: TERMINAL_COLORS.GREEN }
  })
  cargoStats.x = 250
  cargoStats.y = 100
  container.addChild(cargoStats)
  
  // Add cargo info inside the box
  const cargoInfo = createASCIIText(`
CARGO BAY STATUS:
CAPACITY: 75/100
WEIGHT: 2.3/5.0T
ITEMS: 4

MANIFEST:
• FUEL (HIGH PRIORITY)
• PARTS (STANDARD)
• SUPPLIES (STANDARD)
• CREW (PRIORITY)
  `, {
    style: { fill: TERMINAL_COLORS.GREEN, fontSize: 10 },
    position: { x: 260, y: 115 }
  })
  container.addChild(cargoInfo)
  
  // Weight distribution bars
  const weightBars = ['FORWARD', 'CENTER', 'AFT'].map((section, index) => {
    const weight = Math.random()
    const bar = createASCIIProgressBar(weight, 12, {
      style: { 
        fill: weight > 0.8 ? TERMINAL_COLORS.DANGER_RED : TERMINAL_COLORS.SUCCESS 
      },
      position: { x: 350, y: 250 + index * 20 }
    })
    
    const label = createASCIIText(`${section}:`, {
      style: { fill: TERMINAL_COLORS.WHITE, fontSize: 10 },
      position: { x: 280, y: 250 + index * 20 }
    })
    
    container.addChild(label)
    container.addChild(bar)
    return { bar, label }
  })
  
  return container
}

// =============================================================================
// EXAMPLE: GALAXY MAP INTERFACE
// =============================================================================

export function createGalaxyMapInterface(app) {
  const container = new PIXI.Container()
  
  // Background grid
  const backgroundGrid = createPixelGrid(500, 400, 25, {
    color: TERMINAL_COLORS.GRID_GREEN_DIM,
    alpha: 0.3
  })
  container.addChild(backgroundGrid)
  
  // Stars and systems
  const systems = [
    { x: 100, y: 100, name: 'ALPHA-7', type: 'station', connected: true },
    { x: 200, y: 150, name: 'BETA-3', type: 'planet', connected: true },
    { x: 350, y: 200, name: 'GAMMA-1', type: 'station', connected: false },
    { x: 150, y: 300, name: 'DELTA-9', type: 'asteroid', connected: true },
    { x: 400, y: 120, name: 'EPSILON', type: 'planet', connected: false }
  ]
  
  // Draw connections
  systems.forEach(system => {
    if (system.connected) {
      const nearbySystem = systems.find(s => 
        s !== system && 
        Math.abs(s.x - system.x) < 150 && 
        Math.abs(s.y - system.y) < 150
      )
      
      if (nearbySystem) {
        const connection = createPixelLine(
          system.x, system.y,
          nearbySystem.x, nearbySystem.y,
          {
            color: TERMINAL_COLORS.GRID_GREEN,
            thickness: 1
          }
        )
        container.addChild(connection)
      }
    }
  })
  
  // Draw systems
  systems.forEach(system => {
    const systemColor = system.type === 'station' ? TERMINAL_COLORS.CORPORATE_BLUE :
                       system.type === 'planet' ? TERMINAL_COLORS.SUCCESS :
                       TERMINAL_COLORS.AMBER
    
    const systemNode = createPixelCircle(8, {
      fill: systemColor,
      stroke: TERMINAL_COLORS.WHITE,
      strokeWidth: 2
    })
    systemNode.x = system.x
    systemNode.y = system.y
    container.addChild(systemNode)
    
    // System label
    const label = createASCIIText(system.name, {
      style: { ...FONT_CONFIGS.SMALL, fill: TERMINAL_COLORS.WHITE },
      position: { x: system.x + 12, y: system.y - 5 }
    })
    container.addChild(label)
    
    // System type indicator
    const typeSymbol = system.type === 'station' ? ASCII_CHARS.SPACEPUNK.STATION :
                      system.type === 'planet' ? ASCII_CHARS.SPACEPUNK.PLANET :
                      ASCII_CHARS.SPACEPUNK.ASTEROID
    
    const symbolText = createASCIIText(typeSymbol, {
      style: { fill: systemColor, fontSize: 8 },
      position: { x: system.x - 4, y: system.y - 4 }
    })
    container.addChild(symbolText)
  })
  
  // Current location indicator
  const currentLocation = systems[0]
  const locationIndicator = createPixelRect(20, 20, {
    stroke: TERMINAL_COLORS.AMBER,
    strokeWidth: 2
  })
  locationIndicator.x = currentLocation.x - 10
  locationIndicator.y = currentLocation.y - 10
  container.addChild(locationIndicator)
  
  // Flicker effect on current location
  const flicker = createFlickerEffect(locationIndicator, {
    minAlpha: 0.3,
    maxAlpha: 1.0,
    speed: 0.05
  })
  
  // Navigation info
  const navInfo = createASCIIText(`
NAVIGATION SYSTEM
═══════════════════
CURRENT: ${currentLocation.name}
FUEL: ████████░░ 80%
RANGE: 250 LY

AVAILABLE ROUTES:
→ BETA-3 (50 LY)
→ DELTA-9 (220 LY)
→ GAMMA-1 (OUT OF RANGE)
  `, {
    style: { fill: TERMINAL_COLORS.GREEN, fontSize: 10 },
    position: { x: 20, y: 20 }
  })
  container.addChild(navInfo)
  
  return container
}

// =============================================================================
// EXAMPLE: SYSTEM DIAGNOSTICS
// =============================================================================

export function createSystemDiagnostics(app) {
  const container = new PIXI.Container()
  
  // System status displays
  const systemGroups = [
    {
      title: 'LIFE SUPPORT',
      systems: [
        { name: 'OXYGEN', status: 'OK', value: 0.95 },
        { name: 'TEMPERATURE', status: 'OK', value: 0.87 },
        { name: 'PRESSURE', status: 'WARNING', value: 0.65 },
        { name: 'FILTRATION', status: 'OK', value: 0.92 }
      ]
    },
    {
      title: 'PROPULSION',
      systems: [
        { name: 'MAIN_ENGINE', status: 'OK', value: 0.88 },
        { name: 'THRUSTERS', status: 'OK', value: 0.91 },
        { name: 'FUEL_FLOW', status: 'WARNING', value: 0.73 },
        { name: 'REACTOR', status: 'OK', value: 0.96 }
      ]
    },
    {
      title: 'SHIP SYSTEMS',
      systems: [
        { name: 'SENSORS', status: 'OK', value: 0.84 },
        { name: 'COMMS', status: 'DANGER', value: 0.23 },
        { name: 'SHIELDS', status: 'WARNING', value: 0.67 },
        { name: 'WEAPONS', status: 'OK', value: 0.79 }
      ]
    }
  ]
  
  systemGroups.forEach((group, groupIndex) => {
    const groupY = groupIndex * 150
    
    // Group title
    const titleBox = createASCIIBox(30, 3, {
      style: { fill: TERMINAL_COLORS.AMBER }
    })
    titleBox.x = 20
    titleBox.y = groupY + 20
    container.addChild(titleBox)
    
    const title = createASCIIText(group.title, {
      style: { ...FONT_CONFIGS.HEADER, fill: TERMINAL_COLORS.WHITE },
      position: { x: 30, y: groupY + 35 }
    })
    container.addChild(title)
    
    // System status
    const statusDisplay = createSystemStatus(group.systems, {
      lineHeight: 18
    })
    statusDisplay.x = 20
    statusDisplay.y = groupY + 65
    container.addChild(statusDisplay)
    
    // Add flicker effect to critical systems
    group.systems.forEach((system, index) => {
      if (system.status === 'DANGER') {
        const systemY = groupY + 65 + (index * 18)
        const warningIndicator = createASCIIText('⚠', {
          style: { fill: TERMINAL_COLORS.DANGER_RED, fontSize: 16 },
          position: { x: 350, y: systemY }
        })
        container.addChild(warningIndicator)
        
        createFlickerEffect(warningIndicator, {
          minAlpha: 0.3,
          maxAlpha: 1.0,
          speed: 0.1
        })
      }
    })
  })
  
  return container
}

// =============================================================================
// EXAMPLE: ANIMATED TERMINAL BOOT SEQUENCE
// =============================================================================

export async function createBootSequence(app) {
  const container = new PIXI.Container()
  
  const bootMessages = [
    'SPACEPUNK LOGISTICS SYSTEM v2.7.3',
    'INITIALIZING CORE SYSTEMS...',
    'LOADING CREW MANIFEST...',
    'CONNECTING TO GALACTIC NETWORK...',
    'CHECKING CARGO MANIFEST...',
    'SYSTEMS READY',
    '> WELCOME, CAPTAIN'
  ]
  
  let currentY = 50
  const lineHeight = 20
  
  for (const message of bootMessages) {
    const textObj = createASCIIText('', {
      style: { 
        fill: TERMINAL_COLORS.GREEN,
        fontSize: 14
      },
      position: { x: 50, y: currentY }
    })
    container.addChild(textObj)
    
    // Typing effect
    await createTypingEffect(message, textObj, {
      speed: 30,
      onType: () => {
        // Simulate typing sound effect
        console.log('beep')
      }
    })
    
    currentY += lineHeight
    
    // Brief pause between messages
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return container
}

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

/*
To use these examples in your Vue components:

1. Import the utilities:
   import { createLockpickingInterface } from '@/shared/pixiUtils.examples.js'

2. Use in your PixiJS app ready handler:
   function onAppReady(app) {
     const lockpickingUI = createLockpickingInterface(app)
     app.stage.addChild(lockpickingUI)
   }

3. For animations, make sure to clean up when component unmounts:
   onUnmounted(() => {
     // Stop any ongoing animations
     app.ticker.remove(updateFunction)
   })

4. Customize colors and styles by modifying the TERMINAL_COLORS constants
   or passing custom style objects to the utility functions.
*/

export default {
  createLockpickingInterface,
  createSpyingInterface,
  createCargoInterface,
  createGalaxyMapInterface,
  createSystemDiagnostics,
  createBootSequence
}