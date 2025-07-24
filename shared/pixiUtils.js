/**
 * Spacepunk PixiJS Utilities
 * 
 * Comprehensive utility library for PixiJS rendering in Spacepunk
 * Focuses on ASCII art aesthetics, brutalist styling, and terminal-inspired graphics
 */

import * as PIXI from 'pixi.js'

// =============================================================================
// CONSTANTS & CONFIGURATIONS
// =============================================================================

// Terminal color schemes
export const TERMINAL_COLORS = {
  // Base colors
  BLACK: 0x000000,
  WHITE: 0xffffff,
  
  // Classic terminal colors
  RED: 0xff0000,
  GREEN: 0x00ff00,
  BLUE: 0x0000ff,
  YELLOW: 0xffff00,
  MAGENTA: 0xff00ff,
  CYAN: 0x00ffff,
  
  // Spacepunk theme colors
  AMBER: 0xffa500,
  AMBER_DIM: 0x996600,
  GRID_GREEN: 0x00ff41,
  GRID_GREEN_DIM: 0x008020,
  DANGER_RED: 0xff4444,
  WARNING_YELLOW: 0xffaa00,
  INFO_BLUE: 0x4444ff,
  
  // Status colors
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  WARNING: 0xffaa00,
  INFO: 0x00aaff,
  NEUTRAL: 0x666666,
  
  // Corporate colors
  CORPORATE_BLUE: 0x003366,
  CORPORATE_GRAY: 0x333333,
  CORPORATE_SILVER: 0x999999
}

// ASCII character sets
export const ASCII_CHARS = {
  // Box drawing characters
  BOX: {
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
    HORIZONTAL: '─',
    VERTICAL: '│',
    CROSS: '┼',
    T_DOWN: '┬',
    T_UP: '┴',
    T_RIGHT: '├',
    T_LEFT: '┤'
  },
  
  // Progress indicators
  PROGRESS: {
    EMPTY: '░',
    QUARTER: '▒',
    HALF: '▓',
    FULL: '█'
  },
  
  // Arrows and indicators
  ARROWS: {
    UP: '↑',
    DOWN: '↓',
    LEFT: '←',
    RIGHT: '→',
    UP_DOWN: '↕',
    LEFT_RIGHT: '↔'
  },
  
  // Spacepunk specific
  SPACEPUNK: {
    SHIP: '◦',
    STATION: '⬢',
    PLANET: '●',
    ASTEROID: '◊',
    CARGO: '■',
    FUEL: '▲',
    CREW: '○',
    DANGER: '⚠',
    LOCKED: '🔒',
    UNLOCKED: '🔓'
  }
}

// Font configurations
export const FONT_CONFIGS = {
  TERMINAL: {
    fontFamily: 'Courier New, monospace',
    fontSize: 12,
    fill: TERMINAL_COLORS.GREEN,
    align: 'left'
  },
  
  HEADER: {
    fontFamily: 'Courier New, monospace',
    fontSize: 14,
    fill: TERMINAL_COLORS.WHITE,
    fontWeight: 'bold',
    align: 'center'
  },
  
  SMALL: {
    fontFamily: 'Courier New, monospace',
    fontSize: 10,
    fill: TERMINAL_COLORS.NEUTRAL,
    align: 'left'
  },
  
  DANGER: {
    fontFamily: 'Courier New, monospace',
    fontSize: 12,
    fill: TERMINAL_COLORS.DANGER_RED,
    fontWeight: 'bold',
    align: 'center'
  }
}

// =============================================================================
// ASCII ART UTILITIES
// =============================================================================

/**
 * Creates ASCII art text using PixiJS Text objects
 * @param {string} text - The text to render
 * @param {Object} options - Rendering options
 * @returns {PIXI.Text} - The rendered text object
 */
export function createASCIIText(text, options = {}) {
  const style = { ...FONT_CONFIGS.TERMINAL, ...options.style }
  const textObj = new PIXI.Text(text, style)
  
  // Apply pixelated rendering
  textObj.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
  
  if (options.position) {
    textObj.x = options.position.x
    textObj.y = options.position.y
  }
  
  return textObj
}

/**
 * Creates a multi-line ASCII art banner
 * @param {string[]} lines - Array of text lines
 * @param {Object} options - Rendering options
 * @returns {PIXI.Container} - Container with all text lines
 */
export function createASCIIBanner(lines, options = {}) {
  const container = new PIXI.Container()
  const lineHeight = options.lineHeight || 16
  const style = { ...FONT_CONFIGS.HEADER, ...options.style }
  
  lines.forEach((line, index) => {
    const textObj = createASCIIText(line, { style })
    textObj.y = index * lineHeight
    container.addChild(textObj)
  })
  
  return container
}

/**
 * Creates ASCII art progress bar
 * @param {number} progress - Progress value (0-1)
 * @param {number} width - Width in characters
 * @param {Object} options - Rendering options
 * @returns {PIXI.Text} - The progress bar text object
 */
export function createASCIIProgressBar(progress, width = 20, options = {}) {
  const filledWidth = Math.floor(progress * width)
  const emptyWidth = width - filledWidth
  
  const filled = ASCII_CHARS.PROGRESS.FULL.repeat(filledWidth)
  const empty = ASCII_CHARS.PROGRESS.EMPTY.repeat(emptyWidth)
  const progressText = `[${filled}${empty}]`
  
  const style = {
    ...FONT_CONFIGS.TERMINAL,
    fill: progress > 0.7 ? TERMINAL_COLORS.SUCCESS : 
          progress > 0.3 ? TERMINAL_COLORS.WARNING : 
          TERMINAL_COLORS.DANGER_RED,
    ...options.style
  }
  
  return createASCIIText(progressText, { style, ...options })
}

/**
 * Creates ASCII art box with border
 * @param {number} width - Width in characters
 * @param {number} height - Height in characters
 * @param {Object} options - Rendering options
 * @returns {PIXI.Container} - Container with box graphics
 */
export function createASCIIBox(width, height, options = {}) {
  const container = new PIXI.Container()
  const lineHeight = options.lineHeight || 16
  const charWidth = options.charWidth || 8
  const style = { ...FONT_CONFIGS.TERMINAL, ...options.style }
  
  // Top border
  const topBorder = ASCII_CHARS.BOX.TOP_LEFT + 
                   ASCII_CHARS.BOX.HORIZONTAL.repeat(width - 2) + 
                   ASCII_CHARS.BOX.TOP_RIGHT
  container.addChild(createASCIIText(topBorder, { style }))
  
  // Side borders
  for (let i = 1; i < height - 1; i++) {
    const sideBorder = ASCII_CHARS.BOX.VERTICAL + 
                      ' '.repeat(width - 2) + 
                      ASCII_CHARS.BOX.VERTICAL
    const sideText = createASCIIText(sideBorder, { style })
    sideText.y = i * lineHeight
    container.addChild(sideText)
  }
  
  // Bottom border
  const bottomBorder = ASCII_CHARS.BOX.BOTTOM_LEFT + 
                      ASCII_CHARS.BOX.HORIZONTAL.repeat(width - 2) + 
                      ASCII_CHARS.BOX.BOTTOM_RIGHT
  const bottomText = createASCIIText(bottomBorder, { style })
  bottomText.y = (height - 1) * lineHeight
  container.addChild(bottomText)
  
  return container
}

/**
 * Creates ASCII art table with headers and data
 * @param {string[]} headers - Column headers
 * @param {string[][]} data - Table data rows
 * @param {Object} options - Rendering options
 * @returns {PIXI.Container} - Container with table
 */
export function createASCIITable(headers, data, options = {}) {
  const container = new PIXI.Container()
  const colWidth = options.colWidth || 12
  const lineHeight = options.lineHeight || 16
  const style = { ...FONT_CONFIGS.TERMINAL, ...options.style }
  
  let currentY = 0
  
  // Headers
  const headerRow = headers.map(h => h.padEnd(colWidth).substring(0, colWidth)).join('│')
  container.addChild(createASCIIText(headerRow, { style: { ...style, fill: TERMINAL_COLORS.WHITE } }))
  currentY += lineHeight
  
  // Separator
  const separator = headers.map(() => '─'.repeat(colWidth)).join('┼')
  container.addChild(createASCIIText(separator, { style, position: { x: 0, y: currentY } }))
  currentY += lineHeight
  
  // Data rows
  data.forEach(row => {
    const rowText = row.map(cell => 
      String(cell).padEnd(colWidth).substring(0, colWidth)
    ).join('│')
    container.addChild(createASCIIText(rowText, { style, position: { x: 0, y: currentY } }))
    currentY += lineHeight
  })
  
  return container
}

// =============================================================================
// GEOMETRIC SHAPE UTILITIES
// =============================================================================

/**
 * Creates a pixelated rectangle with no anti-aliasing
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The rectangle graphics object
 */
export function createPixelRect(width, height, options = {}) {
  const graphics = new PIXI.Graphics()
  
  // Configure for pixelated rendering
  graphics.texture?.baseTexture && (graphics.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST)
  
  if (options.fill) {
    graphics.beginFill(options.fill)
  }
  
  if (options.stroke) {
    graphics.lineStyle(options.strokeWidth || 1, options.stroke)
  }
  
  graphics.drawRect(0, 0, width, height)
  
  if (options.fill) {
    graphics.endFill()
  }
  
  return graphics
}

/**
 * Creates a pixelated circle with no anti-aliasing
 * @param {number} radius - Circle radius
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The circle graphics object
 */
export function createPixelCircle(radius, options = {}) {
  const graphics = new PIXI.Graphics()
  
  if (options.fill) {
    graphics.beginFill(options.fill)
  }
  
  if (options.stroke) {
    graphics.lineStyle(options.strokeWidth || 1, options.stroke)
  }
  
  graphics.drawCircle(0, 0, radius)
  
  if (options.fill) {
    graphics.endFill()
  }
  
  return graphics
}

/**
 * Creates a pixelated line
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The line graphics object
 */
export function createPixelLine(x1, y1, x2, y2, options = {}) {
  const graphics = new PIXI.Graphics()
  
  graphics.lineStyle(options.thickness || 1, options.color || TERMINAL_COLORS.WHITE)
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  
  return graphics
}

/**
 * Creates a grid pattern
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {number} cellSize - Size of each grid cell
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The grid graphics object
 */
export function createPixelGrid(width, height, cellSize, options = {}) {
  const graphics = new PIXI.Graphics()
  const color = options.color || TERMINAL_COLORS.GRID_GREEN_DIM
  const thickness = options.thickness || 1
  
  graphics.lineStyle(thickness, color, options.alpha || 0.5)
  
  // Vertical lines
  for (let x = 0; x <= width; x += cellSize) {
    graphics.moveTo(x, 0)
    graphics.lineTo(x, height)
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += cellSize) {
    graphics.moveTo(0, y)
    graphics.lineTo(width, y)
  }
  
  return graphics
}

/**
 * Creates a pixelated polygon
 * @param {Array} points - Array of {x, y} points
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The polygon graphics object
 */
export function createPixelPolygon(points, options = {}) {
  const graphics = new PIXI.Graphics()
  
  if (options.fill) {
    graphics.beginFill(options.fill)
  }
  
  if (options.stroke) {
    graphics.lineStyle(options.strokeWidth || 1, options.stroke)
  }
  
  graphics.drawPolygon(points)
  
  if (options.fill) {
    graphics.endFill()
  }
  
  return graphics
}

// =============================================================================
// SPECIALIZED SPACEPUNK GRAPHICS
// =============================================================================

/**
 * Creates a radar/sonar sweep effect
 * @param {number} radius - Radar radius
 * @param {number} angle - Current sweep angle
 * @param {Object} options - Drawing options
 * @returns {PIXI.Graphics} - The radar sweep graphics
 */
export function createRadarSweep(radius, angle, options = {}) {
  const graphics = new PIXI.Graphics()
  const sweepWidth = options.sweepWidth || 0.2
  const color = options.color || TERMINAL_COLORS.GRID_GREEN
  
  graphics.lineStyle(2, color, 0.3)
  graphics.drawCircle(0, 0, radius)
  
  // Sweep line
  graphics.lineStyle(3, color, 0.8)
  graphics.moveTo(0, 0)
  graphics.lineTo(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius
  )
  
  // Sweep trail
  for (let i = 0; i < 5; i++) {
    const trailAngle = angle - (i * 0.1)
    const alpha = 0.6 - (i * 0.1)
    graphics.lineStyle(2, color, alpha)
    graphics.moveTo(0, 0)
    graphics.lineTo(
      Math.cos(trailAngle) * radius,
      Math.sin(trailAngle) * radius
    )
  }
  
  return graphics
}

/**
 * Creates a cargo bay visualization
 * @param {number} width - Bay width in grid units
 * @param {number} height - Bay height in grid units
 * @param {Array} cargo - Array of cargo objects with x, y, w, h properties
 * @param {Object} options - Drawing options
 * @returns {PIXI.Container} - Container with cargo bay
 */
export function createCargoBay(width, height, cargo = [], options = {}) {
  const container = new PIXI.Container()
  const cellSize = options.cellSize || 20
  
  // Background grid
  const grid = createPixelGrid(width * cellSize, height * cellSize, cellSize, {
    color: TERMINAL_COLORS.GRID_GREEN_DIM,
    alpha: 0.3
  })
  container.addChild(grid)
  
  // Cargo items
  cargo.forEach(item => {
    const cargoRect = createPixelRect(
      item.w * cellSize - 2,
      item.h * cellSize - 2,
      {
        fill: item.color || TERMINAL_COLORS.CORPORATE_BLUE,
        stroke: TERMINAL_COLORS.WHITE,
        strokeWidth: 1
      }
    )
    cargoRect.x = item.x * cellSize + 1
    cargoRect.y = item.y * cellSize + 1
    container.addChild(cargoRect)
    
    // Cargo label
    if (item.label) {
      const label = createASCIIText(item.label, {
        style: { ...FONT_CONFIGS.SMALL, fill: TERMINAL_COLORS.WHITE },
        position: { x: item.x * cellSize + 4, y: item.y * cellSize + 4 }
      })
      container.addChild(label)
    }
  })
  
  return container
}

/**
 * Creates a system status display
 * @param {Array} systems - Array of system objects with name, status, value
 * @param {Object} options - Drawing options
 * @returns {PIXI.Container} - Container with status display
 */
export function createSystemStatus(systems, options = {}) {
  const container = new PIXI.Container()
  const lineHeight = options.lineHeight || 18
  
  systems.forEach((system, index) => {
    const y = index * lineHeight
    
    // System name
    const nameText = createASCIIText(system.name.padEnd(15), {
      style: FONT_CONFIGS.TERMINAL,
      position: { x: 0, y }
    })
    container.addChild(nameText)
    
    // Status indicator
    const statusColor = system.status === 'OK' ? TERMINAL_COLORS.SUCCESS :
                       system.status === 'WARNING' ? TERMINAL_COLORS.WARNING :
                       TERMINAL_COLORS.DANGER_RED
    
    const statusText = createASCIIText(system.status.padEnd(8), {
      style: { ...FONT_CONFIGS.TERMINAL, fill: statusColor },
      position: { x: 120, y }
    })
    container.addChild(statusText)
    
    // Value/progress bar
    if (system.value !== undefined) {
      const progressBar = createASCIIProgressBar(system.value, 10, {
        style: { fill: statusColor },
        position: { x: 200, y }
      })
      container.addChild(progressBar)
    }
  })
  
  return container
}

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

/**
 * Creates a flickering effect for text or graphics
 * @param {PIXI.DisplayObject} target - Object to animate
 * @param {Object} options - Animation options
 * @returns {Object} - Animation control object
 */
export function createFlickerEffect(target, options = {}) {
  const minAlpha = options.minAlpha || 0.3
  const maxAlpha = options.maxAlpha || 1.0
  const speed = options.speed || 0.1
  const randomness = options.randomness || 0.5
  
  let time = 0
  let active = true
  
  const animate = () => {
    if (!active) return
    
    time += speed
    const noise = (Math.random() - 0.5) * randomness
    target.alpha = minAlpha + (maxAlpha - minAlpha) * 
                   (0.5 + 0.5 * Math.sin(time + noise))
    
    requestAnimationFrame(animate)
  }
  
  animate()
  
  return {
    stop: () => { active = false; target.alpha = maxAlpha },
    start: () => { active = true; animate() }
  }
}

/**
 * Creates a typing effect for text
 * @param {string} fullText - Complete text to type
 * @param {PIXI.Text} textObject - Text object to animate
 * @param {Object} options - Animation options
 * @returns {Promise} - Resolves when typing is complete
 */
export function createTypingEffect(fullText, textObject, options = {}) {
  return new Promise((resolve) => {
    const speed = options.speed || 50
    const sound = options.sound || false
    let currentIndex = 0
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        textObject.text = fullText.substring(0, currentIndex + 1)
        currentIndex++
        
        if (sound && options.onType) {
          options.onType()
        }
        
        setTimeout(typeNextChar, speed)
      } else {
        resolve()
      }
    }
    
    typeNextChar()
  })
}

/**
 * Creates a scanning line effect
 * @param {number} width - Scan area width
 * @param {number} height - Scan area height
 * @param {Object} options - Animation options
 * @returns {PIXI.Graphics} - The scanning line graphics
 */
export function createScanLine(width, height, options = {}) {
  const graphics = new PIXI.Graphics()
  const color = options.color || TERMINAL_COLORS.GRID_GREEN
  const thickness = options.thickness || 2
  const speed = options.speed || 2
  
  let y = 0
  let direction = 1
  
  const animate = () => {
    graphics.clear()
    graphics.lineStyle(thickness, color, 0.8)
    graphics.moveTo(0, y)
    graphics.lineTo(width, y)
    
    y += speed * direction
    
    if (y >= height || y <= 0) {
      direction *= -1
    }
    
    requestAnimationFrame(animate)
  }
  
  animate()
  
  return graphics
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Applies brutalist styling to a PixiJS object
 * @param {PIXI.DisplayObject} object - Object to style
 * @param {Object} options - Styling options
 */
export function applyBrutalistStyling(object, options = {}) {
  // Disable anti-aliasing for pixelated look
  if (object.texture && object.texture.baseTexture) {
    object.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
  }
  
  // Apply terminal-like filtering
  if (options.terminalEffect) {
    const filter = new PIXI.filters.ColorMatrixFilter()
    filter.greyscale(0.2)
    filter.contrast(1.2)
    object.filters = [filter]
  }
  
  // Apply scanline effect
  if (options.scanlines) {
    // This would require a custom shader for true scanlines
    // For now, we'll use a simple overlay
    const overlay = new PIXI.Graphics()
    overlay.beginFill(0x000000, 0.1)
    for (let y = 0; y < object.height; y += 2) {
      overlay.drawRect(0, y, object.width, 1)
    }
    overlay.endFill()
    object.addChild(overlay)
  }
}

/**
 * Creates a loading spinner with ASCII characters
 * @param {Object} options - Spinner options
 * @returns {PIXI.Container} - Container with spinner
 */
export function createASCIISpinner(options = {}) {
  const container = new PIXI.Container()
  const frames = options.frames || ['|', '/', '-', '\\']
  const speed = options.speed || 200
  const style = { ...FONT_CONFIGS.TERMINAL, ...options.style }
  
  const text = createASCIIText(frames[0], { style })
  container.addChild(text)
  
  let currentFrame = 0
  const animate = () => {
    text.text = frames[currentFrame]
    currentFrame = (currentFrame + 1) % frames.length
    setTimeout(animate, speed)
  }
  
  animate()
  
  return container
}

/**
 * Creates a glitch effect for text or graphics
 * @param {PIXI.DisplayObject} target - Object to glitch
 * @param {Object} options - Glitch options
 * @returns {Object} - Animation control object
 */
export function createGlitchEffect(target, options = {}) {
  const intensity = options.intensity || 0.1
  const speed = options.speed || 100
  const originalX = target.x
  const originalY = target.y
  let active = true
  
  const glitch = () => {
    if (!active) return
    
    const offsetX = (Math.random() - 0.5) * intensity * 20
    const offsetY = (Math.random() - 0.5) * intensity * 20
    
    target.x = originalX + offsetX
    target.y = originalY + offsetY
    
    setTimeout(() => {
      target.x = originalX
      target.y = originalY
      setTimeout(glitch, speed + Math.random() * speed)
    }, 50)
  }
  
  glitch()
  
  return {
    stop: () => { active = false; target.x = originalX; target.y = originalY },
    start: () => { active = true; glitch() }
  }
}

export default {
  // Constants
  TERMINAL_COLORS,
  ASCII_CHARS,
  FONT_CONFIGS,
  
  // ASCII Art
  createASCIIText,
  createASCIIBanner,
  createASCIIProgressBar,
  createASCIIBox,
  createASCIITable,
  createASCIISpinner,
  
  // Geometric Shapes
  createPixelRect,
  createPixelCircle,
  createPixelLine,
  createPixelGrid,
  createPixelPolygon,
  
  // Specialized Graphics
  createRadarSweep,
  createCargoBay,
  createSystemStatus,
  
  // Animation
  createFlickerEffect,
  createTypingEffect,
  createScanLine,
  createGlitchEffect,
  
  // Utilities
  applyBrutalistStyling
}