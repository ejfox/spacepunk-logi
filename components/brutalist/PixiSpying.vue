<template>
  <div class="spying-interface">
    <div class="interface-header">
      <span class="header-marker">></span>
      <span class="interface-title">SURVEILLANCE_GRID</span>
      <span class="interface-id">{{ sessionId }}</span>
    </div>
    
    <div class="canvas-container">
      <canvas 
        ref="spyCanvas" 
        :width="canvasWidth" 
        :height="canvasHeight"
        class="spy-canvas"
        @click="handleClick"
        @mousemove="handleMouseMove"
      />
      
      <div class="overlay-hud">
        <div class="hud-top">
          <div class="hud-item">
            <span class="hud-label">TARGETS:</span>
            <span class="hud-value">{{ scannedTargets }}/{{ totalTargets }}</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">INTEL:</span>
            <span class="hud-value">{{ Math.floor(intelGathered) }}</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">DETECTION:</span>
            <span class="hud-value" :class="detectionClass">{{ Math.floor(detectionLevel) }}%</span>
          </div>
        </div>
        
        <div class="hud-bottom">
          <div class="scan-status">
            <span class="scan-label">SCAN:</span>
            <div class="scan-bar">
              <div class="scan-progress" :style="{ width: scanProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="interface-footer">
      <div class="footer-status">
        <span v-if="gameState === 'scanning'">SCANNING GRID... CLICK TARGETS WHEN HIGHLIGHTED</span>
        <span v-else-if="gameState === 'success'" class="status-success">SURVEILLANCE COMPLETE - INTEL ACQUIRED</span>
        <span v-else-if="gameState === 'detected'" class="status-critical">DETECTION THRESHOLD EXCEEDED - MISSION BLOWN</span>
        <span v-else-if="gameState === 'timeout'" class="status-critical">OPERATION TIMEOUT - SECURITY ALERTED</span>
        <span v-else>INITIALIZING SURVEILLANCE GRID...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as PIXI from 'pixi.js'

const emit = defineEmits(['complete'])

const props = defineProps({
  difficulty: { type: String, default: 'standard' },
  crewSkill: { type: Number, default: 50 },
  timeLimit: { type: Number, default: 45 }
})

// Canvas refs
const spyCanvas = ref(null)
const pixiApp = ref(null)

// Game state
const gameState = ref('initializing') // initializing, scanning, success, detected, timeout
const sessionId = ref('')
const totalTargets = ref(0)
const scannedTargets = ref(0)
const intelGathered = ref(0)
const detectionLevel = ref(0)
const scanProgress = ref(0)
const gameTimer = ref(null)
const animationFrame = ref(0)

// Canvas settings
const canvasWidth = 480
const canvasHeight = 320

// Game objects
const targets = ref([])
const scanLines = ref([])
const gridLines = ref([])
const cursor = ref({ x: 0, y: 0 })

// Difficulty settings
const DIFFICULTY_CONFIGS = {
  routine: { targets: 4, detectionRate: 0.3, scanSpeed: 1.0, targetSize: 12 },
  standard: { targets: 6, detectionRate: 0.5, scanSpeed: 1.2, targetSize: 10 },
  challenging: { targets: 8, detectionRate: 0.7, scanSpeed: 1.5, targetSize: 8 },
  dangerous: { targets: 10, detectionRate: 1.0, scanSpeed: 2.0, targetSize: 6 }
}

const config = computed(() => DIFFICULTY_CONFIGS[props.difficulty] || DIFFICULTY_CONFIGS.standard)

const detectionClass = computed(() => {
  if (detectionLevel.value > 80) return 'status-critical'
  if (detectionLevel.value > 60) return 'status-warning'
  return 'status-good'
})

// Initialize the spying interface
function initSpyInterface() {
  if (!spyCanvas.value) return
  
  try {
    pixiApp.value = new PIXI.Application({
      view: spyCanvas.value,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    
    // Generate session ID
    sessionId.value = generateSessionId()
    
    // Initialize game objects
    createGrid()
    createScanLines()
    createTargets()
    
    // Start game loop
    pixiApp.value.ticker.add(gameLoop)
    
    // Start mission timer
    startMissionTimer()
    
    gameState.value = 'scanning'
    
  } catch (error) {
    console.error('Spying interface initialization failed:', error)
  }
}

function generateSessionId() {
  return 'SPY_' + Date.now().toString(36).toUpperCase().slice(-6)
}

function createGrid() {
  const graphics = new PIXI.Graphics()
  pixiApp.value.stage.addChild(graphics)
  
  // Draw grid lines - creates the "digital surveillance" feel
  graphics.lineStyle(1, 0x333333, 0.8)
  
  // Vertical lines
  for (let x = 0; x <= canvasWidth; x += 40) {
    graphics.moveTo(x, 0)
    graphics.lineTo(x, canvasHeight)
  }
  
  // Horizontal lines
  for (let y = 0; y <= canvasHeight; y += 40) {
    graphics.moveTo(0, y)
    graphics.lineTo(canvasWidth, y)
  }
  
  // Border
  graphics.lineStyle(2, 0xFFFFFF, 1)
  graphics.drawRect(0, 0, canvasWidth, canvasHeight)
  
  gridLines.value = graphics
}

function createScanLines() {
  // Horizontal scan line
  const hScanLine = new PIXI.Graphics()
  hScanLine.lineStyle(2, 0xFFFFFF, 0.9)
  hScanLine.moveTo(0, 0)
  hScanLine.lineTo(canvasWidth, 0)
  pixiApp.value.stage.addChild(hScanLine)
  
  // Vertical scan line
  const vScanLine = new PIXI.Graphics()
  vScanLine.lineStyle(2, 0xFFFFFF, 0.9)
  vScanLine.moveTo(0, 0)
  vScanLine.lineTo(0, canvasHeight)
  pixiApp.value.stage.addChild(vScanLine)
  
  scanLines.value = { horizontal: hScanLine, vertical: vScanLine }
}

function createTargets() {
  targets.value = []
  totalTargets.value = config.value.targets
  
  for (let i = 0; i < config.value.targets; i++) {
    const target = {
      x: 40 + Math.random() * (canvasWidth - 80),
      y: 40 + Math.random() * (canvasHeight - 80),
      scanned: false,
      highlighted: false,
      intelValue: 15 + Math.random() * 10,
      graphics: new PIXI.Graphics(),
      pulsePhase: Math.random() * Math.PI * 2
    }
    
    // Create visual representation
    drawTarget(target)
    pixiApp.value.stage.addChild(target.graphics)
    targets.value.push(target)
  }
}

function drawTarget(target) {
  const g = target.graphics
  g.clear()
  
  const size = config.value.targetSize
  const color = target.scanned ? 0xFFFFFF : 
                target.highlighted ? 0xFFFFFF : 0x666666
  
  // Draw target as geometric shape
  g.beginFill(color, target.scanned ? 0.8 : target.highlighted ? 0.6 : 0.3)
  g.lineStyle(1, color, 1)
  
  // Diamond shape for unscanned, square for scanned
  if (target.scanned) {
    g.drawRect(-size/2, -size/2, size, size)
  } else {
    g.moveTo(0, -size/2)
    g.lineTo(size/2, 0)
    g.lineTo(0, size/2)
    g.lineTo(-size/2, 0)
    g.closePath()
  }
  
  g.endFill()
  g.position.set(target.x, target.y)
  
  // Add pulse effect for highlighted targets
  if (target.highlighted && !target.scanned) {
    const pulse = Math.sin(target.pulsePhase) * 0.2 + 1
    g.scale.set(pulse)
  } else {
    g.scale.set(1)
  }
}

function gameLoop() {
  animationFrame.value++
  
  if (gameState.value !== 'scanning') return
  
  // Update scan lines
  updateScanLines()
  
  // Update target highlighting
  updateTargetHighlighting()
  
  // Update detection level
  updateDetection()
  
  // Update scan progress
  updateScanProgress()
  
  // Check win/lose conditions
  checkGameEnd()
}

function updateScanLines() {
  const time = animationFrame.value * 0.02 * config.value.scanSpeed
  
  // Horizontal scan line
  const hY = (Math.sin(time) + 1) / 2 * canvasHeight
  scanLines.value.horizontal.position.y = hY
  
  // Vertical scan line
  const vX = (Math.cos(time * 0.7) + 1) / 2 * canvasWidth
  scanLines.value.vertical.position.x = vX
}

function updateTargetHighlighting() {
  const hY = scanLines.value.horizontal.position.y
  const vX = scanLines.value.vertical.position.x
  
  targets.value.forEach(target => {
    if (target.scanned) return
    
    // Check if target is in scan zone
    const inHorizontalScan = Math.abs(target.y - hY) < 15
    const inVerticalScan = Math.abs(target.x - vX) < 15
    
    const wasHighlighted = target.highlighted
    target.highlighted = inHorizontalScan || inVerticalScan
    
    if (target.highlighted !== wasHighlighted) {
      target.pulsePhase = 0
    }
    
    if (target.highlighted) {
      target.pulsePhase += 0.3
    }
    
    drawTarget(target)
  })
}

function updateDetection() {
  // Skill affects detection rate
  const skillMultiplier = Math.max(0.2, 1 - (props.crewSkill / 200))
  detectionLevel.value += config.value.detectionRate * skillMultiplier
  
  // Add random spikes for realism
  if (Math.random() < 0.01) {
    detectionLevel.value += Math.random() * 2
  }
}

function updateScanProgress() {
  const elapsed = (Date.now() - startTime) / 1000
  scanProgress.value = Math.min(100, (elapsed / props.timeLimit) * 100)
}

function handleClick(event) {
  if (gameState.value !== 'scanning') return
  
  const rect = spyCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Check if click hits a highlighted target
  const target = targets.value.find(t => 
    !t.scanned && 
    t.highlighted &&
    Math.abs(t.x - x) < config.value.targetSize &&
    Math.abs(t.y - y) < config.value.targetSize
  )
  
  if (target) {
    // Successful scan
    target.scanned = true
    target.highlighted = false
    scannedTargets.value++
    intelGathered.value += target.intelValue
    
    drawTarget(target)
    
    // Visual feedback
    createScanPulse(target.x, target.y)
    
  } else {
    // Missed click increases detection
    detectionLevel.value += 5
    createMissEffect(x, y)
  }
}

function handleMouseMove(event) {
  const rect = spyCanvas.value.getBoundingClientRect()
  cursor.value.x = event.clientX - rect.left
  cursor.value.y = event.clientY - rect.top
}

function createScanPulse(x, y) {
  const pulse = new PIXI.Graphics()
  pulse.lineStyle(2, 0xFFFFFF, 1)
  pulse.drawCircle(0, 0, 5)
  pulse.position.set(x, y)
  pixiApp.value.stage.addChild(pulse)
  
  // Animate pulse
  let scale = 1
  const animate = () => {
    scale += 0.1
    pulse.scale.set(scale)
    pulse.alpha = Math.max(0, 1 - scale * 0.5)
    
    if (pulse.alpha > 0) {
      requestAnimationFrame(animate)
    } else {
      pixiApp.value.stage.removeChild(pulse)
    }
  }
  animate()
}

function createMissEffect(x, y) {
  const miss = new PIXI.Graphics()
  miss.lineStyle(2, 0xFFFFFF, 1)
  miss.moveTo(-5, -5)
  miss.lineTo(5, 5)
  miss.moveTo(5, -5)
  miss.lineTo(-5, 5)
  miss.position.set(x, y)
  pixiApp.value.stage.addChild(miss)
  
  setTimeout(() => {
    pixiApp.value.stage.removeChild(miss)
  }, 300)
}

let startTime = Date.now()

function startMissionTimer() {
  startTime = Date.now()
  gameTimer.value = setTimeout(() => {
    if (gameState.value === 'scanning') {
      gameState.value = 'timeout'
      emit('complete', { success: false, reason: 'timeout' })
    }
  }, props.timeLimit * 1000)
}

function checkGameEnd() {
  // Win condition
  if (scannedTargets.value >= totalTargets.value) {
    gameState.value = 'success'
    clearTimeout(gameTimer.value)
    emit('complete', { 
      success: true, 
      intel: Math.floor(intelGathered.value),
      efficiency: Math.floor((1 - detectionLevel.value / 100) * 100)
    })
    return
  }
  
  // Lose condition
  if (detectionLevel.value >= 100) {
    gameState.value = 'detected'
    clearTimeout(gameTimer.value)
    emit('complete', { success: false, reason: 'detected' })
    return
  }
}

onMounted(() => {
  initSpyInterface()
})

onUnmounted(() => {
  if (gameTimer.value) {
    clearTimeout(gameTimer.value)
  }
  if (pixiApp.value) {
    pixiApp.value.destroy(true)
    pixiApp.value = null
  }
})
</script>

<style scoped>
.spying-interface {
  background: #000000;
  border: 2px solid #FFFFFF;
  color: #FFFFFF;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.interface-header {
  background: #111111;
  border-bottom: 2px solid #FFFFFF;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.header-marker {
  color: #FFFFFF;
  font-weight: bold;
}

.interface-title {
  font-weight: bold;
  flex: 1;
  letter-spacing: 1px;
}

.interface-id {
  font-size: 9px;
  color: #666666;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
}

.canvas-container {
  position: relative;
  background: #000000;
  border-bottom: 2px solid #FFFFFF;
}

.spy-canvas {
  display: block;
  background: #000000;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  cursor: crosshair;
}

.overlay-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
}

.hud-top {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 8px;
  border: 1px solid #FFFFFF;
}

.hud-item {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 10px;
}

.hud-label {
  color: #666666;
  font-weight: bold;
}

.hud-value {
  color: #FFFFFF;
  font-weight: bold;
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', monospace;
}

.hud-bottom {
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 8px;
  border: 1px solid #FFFFFF;
}

.scan-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.scan-label {
  color: #666666;
  font-weight: bold;
}

.scan-bar {
  flex: 1;
  height: 4px;
  background: #333333;
  border: 1px solid #FFFFFF;
  overflow: hidden;
}

.scan-progress {
  height: 100%;
  background: #FFFFFF;
  transition: width 0.1s ease;
}

.interface-footer {
  background: #111111;
  border-top: 2px solid #FFFFFF;
  padding: 8px 12px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.footer-status {
  font-size: 10px;
  color: #FFFFFF;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.status-good { color: #FFFFFF; }
.status-warning { color: #FFFFFF; }
.status-critical { color: #FFFFFF; }
.status-success { color: #FFFFFF; }

/* Subtle animation for active interface */
@keyframes scan-pulse {
  0%, 100% { border-color: #FFFFFF; }
  50% { border-color: #CCCCCC; }
}

.spying-interface {
  animation: scan-pulse 3s ease-in-out infinite;
}
</style>