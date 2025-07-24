# Spacepunk PixiJS Utilities

A comprehensive utility library for creating brutalist, terminal-inspired graphics in PixiJS for the Spacepunk Logistics Simulator.

## Table of Contents

- [Installation](#installation)
- [Core Philosophy](#core-philosophy)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Installation

```javascript
// Import the utilities you need
import { 
  createASCIIText, 
  createPixelRect, 
  TERMINAL_COLORS 
} from '@/shared/pixiUtils.js'

// Or import everything
import * as PixiUtils from '@/shared/pixiUtils.js'
```

## Core Philosophy

The Spacepunk PixiJS utilities are designed around these principles:

1. **Brutalist Aesthetics**: Raw, unpolished, functional graphics that look like enterprise software
2. **Terminal Inspiration**: Everything should feel like a retro computer terminal
3. **Pixelated Rendering**: No anti-aliasing, crisp pixel-perfect graphics
4. **ASCII Art Focus**: Heavy use of ASCII characters and monospace fonts
5. **Functional Design**: Graphics serve the gameplay mechanics, not just decoration

## Quick Start

### Basic ASCII Text

```javascript
import { createASCIIText, TERMINAL_COLORS } from '@/shared/pixiUtils.js'

// Create simple terminal text
const text = createASCIIText('SYSTEM STATUS: ONLINE', {
  style: { fill: TERMINAL_COLORS.GREEN },
  position: { x: 100, y: 50 }
})
app.stage.addChild(text)
```

### Simple Geometric Shapes

```javascript
import { createPixelRect, createPixelCircle, TERMINAL_COLORS } from '@/shared/pixiUtils.js'

// Create a pixelated rectangle
const rect = createPixelRect(200, 100, {
  fill: TERMINAL_COLORS.CORPORATE_BLUE,
  stroke: TERMINAL_COLORS.WHITE,
  strokeWidth: 2
})
app.stage.addChild(rect)

// Create a pixelated circle
const circle = createPixelCircle(50, {
  fill: TERMINAL_COLORS.AMBER,
  stroke: TERMINAL_COLORS.BLACK,
  strokeWidth: 1
})
app.stage.addChild(circle)
```

### ASCII Art Interface Elements

```javascript
import { createASCIIBox, createASCIIProgressBar } from '@/shared/pixiUtils.js'

// Create a bordered box
const box = createASCIIBox(30, 10, {
  style: { fill: TERMINAL_COLORS.GREEN }
})
app.stage.addChild(box)

// Create a progress bar
const progress = createASCIIProgressBar(0.75, 20, {
  style: { fill: TERMINAL_COLORS.SUCCESS }
})
app.stage.addChild(progress)
```

## API Reference

### Constants

#### TERMINAL_COLORS
Pre-defined color constants for terminal-style graphics.

```javascript
TERMINAL_COLORS.GREEN        // Classic terminal green
TERMINAL_COLORS.AMBER        // Warning/attention color
TERMINAL_COLORS.DANGER_RED   // Error/danger color
TERMINAL_COLORS.CORPORATE_BLUE // Corporate theme color
// ... and many more
```

#### ASCII_CHARS
Collections of ASCII characters for drawing interfaces.

```javascript
ASCII_CHARS.BOX.TOP_LEFT     // ┌
ASCII_CHARS.BOX.HORIZONTAL   // ─
ASCII_CHARS.PROGRESS.FULL    // █
ASCII_CHARS.SPACEPUNK.SHIP   // ◦
// ... and many more
```

#### FONT_CONFIGS
Pre-configured font styles for different use cases.

```javascript
FONT_CONFIGS.TERMINAL        // Standard terminal text
FONT_CONFIGS.HEADER          // Bold header text
FONT_CONFIGS.SMALL           // Small detail text
FONT_CONFIGS.DANGER          // Warning/error text
```

### ASCII Art Functions

#### createASCIIText(text, options)
Creates a PixiJS Text object with terminal styling.

```javascript
const text = createASCIIText('HELLO WORLD', {
  style: { fill: TERMINAL_COLORS.GREEN, fontSize: 14 },
  position: { x: 100, y: 50 }
})
```

#### createASCIIBanner(lines, options)
Creates a multi-line ASCII banner.

```javascript
const banner = createASCIIBanner([
  '╔═══════════════════╗',
  '║ SYSTEM TERMINAL   ║',
  '╚═══════════════════╝'
], {
  style: { fill: TERMINAL_COLORS.AMBER },
  lineHeight: 18
})
```

#### createASCIIProgressBar(progress, width, options)
Creates an ASCII progress bar.

```javascript
const progressBar = createASCIIProgressBar(0.65, 25, {
  style: { fill: TERMINAL_COLORS.SUCCESS },
  position: { x: 50, y: 100 }
})
```

#### createASCIIBox(width, height, options)
Creates a bordered ASCII box.

```javascript
const box = createASCIIBox(40, 15, {
  style: { fill: TERMINAL_COLORS.WHITE },
  lineHeight: 16
})
```

#### createASCIITable(headers, data, options)
Creates a formatted ASCII table.

```javascript
const table = createASCIITable(
  ['NAME', 'STATUS', 'VALUE'],
  [
    ['ENGINE', 'OK', '98%'],
    ['SHIELDS', 'WARNING', '67%'],
    ['WEAPONS', 'ERROR', '12%']
  ],
  {
    colWidth: 12,
    lineHeight: 16
  }
)
```

### Geometric Shape Functions

#### createPixelRect(width, height, options)
Creates a pixelated rectangle with no anti-aliasing.

```javascript
const rect = createPixelRect(200, 100, {
  fill: TERMINAL_COLORS.CORPORATE_BLUE,
  stroke: TERMINAL_COLORS.WHITE,
  strokeWidth: 2
})
```

#### createPixelCircle(radius, options)
Creates a pixelated circle.

```javascript
const circle = createPixelCircle(75, {
  fill: TERMINAL_COLORS.AMBER,
  stroke: TERMINAL_COLORS.BLACK,
  strokeWidth: 1
})
```

#### createPixelLine(x1, y1, x2, y2, options)
Creates a pixelated line.

```javascript
const line = createPixelLine(0, 0, 100, 100, {
  color: TERMINAL_COLORS.GREEN,
  thickness: 2
})
```

#### createPixelGrid(width, height, cellSize, options)
Creates a grid pattern.

```javascript
const grid = createPixelGrid(400, 300, 25, {
  color: TERMINAL_COLORS.GRID_GREEN_DIM,
  alpha: 0.3
})
```

### Specialized Graphics Functions

#### createRadarSweep(radius, angle, options)
Creates an animated radar sweep effect.

```javascript
const radar = createRadarSweep(100, sweepAngle, {
  color: TERMINAL_COLORS.GRID_GREEN,
  sweepWidth: 0.3
})
```

#### createCargoBay(width, height, cargo, options)
Creates a cargo bay visualization with grid and items.

```javascript
const cargoBay = createCargoBay(8, 6, [
  { x: 1, y: 1, w: 2, h: 2, label: 'FUEL', color: TERMINAL_COLORS.AMBER },
  { x: 3, y: 1, w: 1, h: 3, label: 'PARTS', color: TERMINAL_COLORS.CORPORATE_BLUE }
], {
  cellSize: 30
})
```

#### createSystemStatus(systems, options)
Creates a system status display with progress bars.

```javascript
const statusDisplay = createSystemStatus([
  { name: 'OXYGEN', status: 'OK', value: 0.95 },
  { name: 'PRESSURE', status: 'WARNING', value: 0.65 },
  { name: 'TEMPERATURE', status: 'DANGER', value: 0.23 }
], {
  lineHeight: 20
})
```

### Animation Functions

#### createFlickerEffect(target, options)
Creates a flickering effect for any display object.

```javascript
const flicker = createFlickerEffect(textObject, {
  minAlpha: 0.3,
  maxAlpha: 1.0,
  speed: 0.1,
  randomness: 0.3
})

// Control the effect
flicker.stop()
flicker.start()
```

#### createTypingEffect(fullText, textObject, options)
Creates a typing animation effect.

```javascript
await createTypingEffect('SYSTEM ONLINE', textObject, {
  speed: 50,
  onType: () => console.log('beep')
})
```

#### createGlitchEffect(target, options)
Creates a glitch effect for cyberpunk aesthetics.

```javascript
const glitch = createGlitchEffect(graphics, {
  intensity: 0.1,
  speed: 200
})
```

#### createScanLine(width, height, options)
Creates an animated scanning line effect.

```javascript
const scanLine = createScanLine(400, 300, {
  color: TERMINAL_COLORS.GRID_GREEN,
  thickness: 2,
  speed: 3
})
```

### Utility Functions

#### applyBrutalistStyling(object, options)
Applies brutalist styling effects to any PixiJS object.

```javascript
applyBrutalistStyling(sprite, {
  terminalEffect: true,
  scanlines: true
})
```

## Examples

### Complete Lockpicking Interface

```javascript
import { 
  createASCIIBanner, 
  createASCIIProgressBar, 
  createSystemStatus,
  TERMINAL_COLORS 
} from '@/shared/pixiUtils.js'

function createLockpickingUI(app) {
  const container = new PIXI.Container()
  
  // Title
  const title = createASCIIBanner([
    '╔═══════════════════════════╗',
    '║   LOCKPICKING SUBSYSTEM   ║',
    '╚═══════════════════════════╝'
  ])
  container.addChild(title)
  
  // Difficulty indicators
  const difficulties = ['ROUTINE', 'STANDARD', 'CHALLENGING']
  difficulties.forEach((diff, index) => {
    const progress = Math.random()
    const bar = createASCIIProgressBar(progress, 15, {
      position: { x: 50, y: 100 + index * 25 }
    })
    container.addChild(bar)
  })
  
  return container
}
```

### Animated Radar Display

```javascript
import { createRadarSweep, createPixelCircle, TERMINAL_COLORS } from '@/shared/pixiUtils.js'

function createRadarDisplay(app) {
  const container = new PIXI.Container()
  let sweepAngle = 0
  
  const updateRadar = () => {
    container.removeChildren()
    
    // Radar sweep
    const radar = createRadarSweep(100, sweepAngle, {
      color: TERMINAL_COLORS.GRID_GREEN
    })
    container.addChild(radar)
    
    sweepAngle += 0.05
  }
  
  app.ticker.add(updateRadar)
  return container
}
```

## Best Practices

### 1. Consistent Color Scheme
Always use the predefined `TERMINAL_COLORS` constants to maintain visual consistency.

```javascript
// Good
text.style.fill = TERMINAL_COLORS.SUCCESS

// Avoid
text.style.fill = 0x00ff00
```

### 2. Pixelated Rendering
Ensure all graphics maintain the pixelated, brutalist aesthetic.

```javascript
// Apply to textures
sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST

// Use the utility function
applyBrutalistStyling(sprite)
```

### 3. Monospace Fonts
Always use monospace fonts for consistent character alignment.

```javascript
// Good - uses predefined font config
const text = createASCIIText('SYSTEM STATUS', {
  style: FONT_CONFIGS.TERMINAL
})
```

### 4. Animation Cleanup
Always clean up animations when components unmount.

```javascript
// In Vue component
onUnmounted(() => {
  flickerEffect.stop()
  app.ticker.remove(updateFunction)
})
```

### 5. Performance Considerations
- Use object pooling for frequently created/destroyed objects
- Batch similar draw calls together
- Avoid creating new graphics objects every frame

```javascript
// Good - reuse graphics objects
const updateRadar = () => {
  radarGraphics.clear()
  radarGraphics.lineStyle(2, TERMINAL_COLORS.GREEN)
  radarGraphics.arc(0, 0, radius, angle, angle + sweepWidth)
}

// Avoid - creates new objects every frame
const updateRadar = () => {
  container.removeChildren()
  const newRadar = createRadarSweep(radius, angle)
  container.addChild(newRadar)
}
```

### 6. Responsive Design
Design interfaces that work at different screen sizes.

```javascript
// Use relative positioning
const centerX = app.screen.width / 2
const centerY = app.screen.height / 2

// Scale UI elements based on screen size
const scaleFactor = Math.min(app.screen.width / 800, app.screen.height / 600)
```

## Integration with Vue Components

### Basic Setup

```vue
<template>
  <PixiCanvas 
    ref="pixiCanvas"
    @app-ready="onAppReady"
    :width="800"
    :height="600"
  />
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import PixiCanvas from './PixiCanvas.vue'
import { createLockpickingInterface } from '@/shared/pixiUtils.examples.js'

const pixiCanvas = ref(null)
let lockpickingUI = null

function onAppReady(app) {
  lockpickingUI = createLockpickingInterface(app)
  app.stage.addChild(lockpickingUI)
}

onUnmounted(() => {
  // Clean up any animations or event listeners
  if (lockpickingUI) {
    lockpickingUI.destroy()
  }
})
</script>
```

### Reactive Data Updates

```javascript
// In your component
const updateProgressBars = () => {
  if (lockpickingUI) {
    // Update progress bars based on reactive data
    const progressBars = lockpickingUI.getChildByName('progressBars')
    progressBars.forEach((bar, index) => {
      bar.progress = crewSkills.value[index] / 100
    })
  }
}

// Watch for changes
watch(crewSkills, updateProgressBars)
```

This utility library provides everything needed to create consistent, brutalist-style graphics for the Spacepunk Logistics Simulator. The ASCII art aesthetic and pixelated rendering maintain the game's unique visual identity while providing powerful tools for creating functional interfaces.