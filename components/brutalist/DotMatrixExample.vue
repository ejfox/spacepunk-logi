<template>
  <div class="dot-matrix-demo">
    <div class="demo-header">
      <span class="header-marker">></span>
      <span class="demo-title">DOT_MATRIX_DISPLAY</span>
    </div>
    
    <PixiCanvas
      ref="canvas"
      :width="640"
      :height="320"
      @app-ready="init"
      @tick="tick"
    />
    
    <div class="demo-controls">
      <button @click="showLockpicking">LOCKPICKING</button>
      <button @click="showCargo">CARGO</button>
      <button @click="showMap">GALAXY MAP</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import PixiCanvas from './PixiCanvas.vue'
import DotMatrix from '@/shared/dotMatrix.js'
import { TERMINAL_COLORS } from '@/shared/pixiUtils.js'

const canvas = ref(null)
const display = ref(null)
const mode = ref('lockpicking')
const frame = ref(0)

function init(app) {
  // Create 128x64 dot matrix display (like pinball DMD)
  display.value = new DotMatrix(128, 64, 4)
  display.value.container.x = 20
  display.value.container.y = 20
  app.stage.addChild(display.value.container)
  
  showLockpicking()
}

function tick() {
  frame.value++
  
  if (mode.value === 'lockpicking') {
    drawLockpicking()
  } else if (mode.value === 'cargo') {
    drawCargo()
  } else if (mode.value === 'map') {
    drawMap()
  }
}

function showLockpicking() {
  mode.value = 'lockpicking'
  display.value?.clear()
}

function showCargo() {
  mode.value = 'cargo'
  display.value?.clear()
}

function showMap() {
  mode.value = 'map'
  display.value?.clear()
}

function drawLockpicking() {
  if (!display.value) return
  
  display.value.clear()
  
  // Title
  display.value.drawText('LOCKPICKING', 30, 2, TERMINAL_COLORS.GREEN)
  
  // Lock body
  display.value.drawRect(40, 20, 48, 20, TERMINAL_COLORS.WHITE)
  
  // Pins
  for (let i = 0; i < 4; i++) {
    const x = 45 + i * 10
    const y = 25 + Math.floor(Math.sin(frame.value * 0.05 + i) * 3)
    
    // Pin housing
    display.value.drawRect(x, 22, 4, 16, TERMINAL_COLORS.NEUTRAL)
    
    // Pin
    display.value.drawRect(x + 1, y, 2, 8, TERMINAL_COLORS.AMBER)
  }
  
  // Instructions
  display.value.drawText('PRESS SPACE', 30, 50, TERMINAL_COLORS.WHITE)
}

function drawCargo() {
  if (!display.value) return
  
  display.value.clear()
  
  // Title
  display.value.drawText('CARGO BAY', 35, 2, TERMINAL_COLORS.GREEN)
  
  // Grid
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 12; x++) {
      const px = 20 + x * 8
      const py = 15 + y * 8
      
      if (Math.random() > 0.6) {
        // Cargo item
        display.value.drawRect(px, py, 6, 6, TERMINAL_COLORS.AMBER, true)
      } else {
        // Empty slot
        display.value.drawRect(px, py, 6, 6, TERMINAL_COLORS.NEUTRAL)
      }
    }
  }
}

function drawMap() {
  if (!display.value) return
  
  display.value.clear()
  
  // Title
  display.value.drawText('GALAXY MAP', 30, 2, TERMINAL_COLORS.GREEN)
  
  // Stations
  const stations = [
    { x: 30, y: 20, name: 'ALPHA' },
    { x: 70, y: 25, name: 'BETA' },
    { x: 50, y: 40, name: 'GAMMA' }
  ]
  
  stations.forEach(station => {
    // Station dot
    display.value.drawRect(station.x, station.y, 4, 4, TERMINAL_COLORS.GREEN, true)
    
    // Connection lines
    if (station.name !== 'ALPHA') {
      const prev = stations[0]
      drawLine(prev.x + 2, prev.y + 2, station.x + 2, station.y + 2)
    }
  })
}

function drawLine(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  let err = dx - dy
  
  while (true) {
    display.value.setPixel(x1, y1, TERMINAL_COLORS.WHITE)
    
    if (x1 === x2 && y1 === y2) break
    
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x1 += sx
    }
    if (e2 < dx) {
      err += dx
      y1 += sy
    }
  }
}

onUnmounted(() => {
  display.value?.destroy()
})
</script>

<style scoped>
.dot-matrix-demo {
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.demo-header {
  background: #111111;
  border-bottom: 2px solid #ffffff;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-marker {
  color: #ffffff;
  font-weight: bold;
}

.demo-title {
  font-weight: bold;
  font-size: 14px;
  flex: 1;
}

.demo-controls {
  background: #111111;
  border-top: 2px solid #ffffff;
  padding: 8px 12px;
  display: flex;
  gap: 8px;
}

.demo-controls button {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.demo-controls button:hover {
  background: #ffffff;
  color: #000000;
}
</style>