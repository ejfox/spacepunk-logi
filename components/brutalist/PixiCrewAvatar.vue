<template>
  <div class="crew-avatar">
    <div class="crew-display-header">
      <span class="header-marker">></span>
      <span class="crew-title">{{ crewData.name || 'UNKNOWN' }}</span>
      <span class="crew-id">{{ crewId }}</span>
    </div>
    
    <div class="crew-canvas-wrapper">
      <canvas 
        ref="crewCanvas" 
        :width="avatarSize" 
        :height="avatarSize"
        class="crew-canvas"
      />
    </div>
    
    <div class="crew-status-footer" v-if="showDetails">
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">HP:</span>
          <span class="status-value" :class="healthClass">{{ crewData.health || 0 }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">MOR:</span>
          <span class="status-value" :class="moraleClass">{{ crewData.morale || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as PIXI from 'pixi.js'

const emit = defineEmits(['avatar-ready', 'status-change'])

const props = defineProps({
  crewId: { type: String, required: true },
  crewData: { type: Object, required: true },
  avatarSize: { type: Number, default: 64 },
  showDetails: { type: Boolean, default: false },
  animationSpeed: { type: Number, default: 1 }
})

const crewCanvas = ref(null)
const pixiApp = ref(null)
const graphics = ref(null)
const animationFrame = ref(0)
const lastHealthCheck = ref(0)

// Avatar generation bitmaps (8x8 pixel patterns)
const AVATAR_PATTERNS = {
  // Cultural base shapes
  Corporate: [
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0]
  ],
  Belter: [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,1,1],
    [1,1,0,1,1,0,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0]
  ],
  Spacer: [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0]
  ]
}

// Skill indicator patterns (small 3x3 glyphs)
const SKILL_GLYPHS = {
  engineering: [
    [1,0,1],
    [0,1,0],
    [1,0,1]
  ],
  piloting: [
    [0,1,0],
    [1,1,1],
    [0,1,0]
  ],
  social: [
    [1,0,1],
    [0,0,0],
    [1,1,1]
  ],
  combat: [
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ]
}

// Status effect patterns
const STATUS_EFFECTS = {
  low_health: [
    [1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1]
  ],
  low_morale: [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
  ]
}

const culturalColors = computed(() => {
  const colors = {
    Corporate: 0xFFFFFF,
    Belter: 0xFFFFFF,
    Spacer: 0xFFFFFF,
    Agricultural: 0xFFFFFF,
    Military: 0xFFFFFF
  }
  return colors[props.crewData.culture] || 0xFFFFFF
})

const healthClass = computed(() => {
  const health = props.crewData.health || 0
  if (health > 70) return 'status-good'
  if (health > 30) return 'status-warning'
  return 'status-critical'
})

const moraleClass = computed(() => {
  const morale = props.crewData.morale || 0
  if (morale > 70) return 'status-good'
  if (morale > 30) return 'status-warning'
  return 'status-critical'
})

function initPixi() {
  if (!crewCanvas.value) return
  
  try {
    pixiApp.value = new PIXI.Application({
      view: crewCanvas.value,
      width: props.avatarSize,
      height: props.avatarSize,
      backgroundColor: 0x000000,
      antialias: false, // Pixel art style
      resolution: 1
    })
    
    graphics.value = new PIXI.Graphics()
    pixiApp.value.stage.addChild(graphics.value)
    
    // Add ticker for animations
    pixiApp.value.ticker.add(() => {
      animationFrame.value++
      
      // Check for health changes
      if (animationFrame.value % 60 === 0) {
        checkStatusChanges()
      }
      
      // Add glitch effect for low health
      if (props.crewData.health < 30 && animationFrame.value % 120 === 0) {
        addGlitchEffect()
      }
    })
    
    generateAvatar()
    emit('avatar-ready', pixiApp.value)
    
  } catch (error) {
    console.error('PixiJS crew avatar initialization failed:', error)
  }
}

function onTick(app) {
  animationFrame.value++
  
  // Check for health/morale changes
  if (animationFrame.value % 60 === 0) {
    checkStatusChanges()
  }
  
  // Add subtle glitch effect for low health
  if (props.crewData.health < 30) {
    glitchFrame.value++
    if (glitchFrame.value % 120 === 0) {
      addGlitchEffect()
    }
  }
  
  // Animate breathing effect
  if (animationFrame.value % 180 === 0) {
    addBreathingEffect()
  }
}

function onScanComplete(scanCount) {
  // Refresh avatar every few scans
  if (scanCount % 5 === 0) {
    generateAvatar()
  }
}

function generateAvatar() {
  if (!graphics.value) return
  
  // Clear previous avatar
  graphics.value.clear()
  
  // Get cultural base pattern
  const culture = props.crewData.culture || 'Corporate'
  const basePattern = AVATAR_PATTERNS[culture] || AVATAR_PATTERNS.Corporate
  
  // Draw base avatar - this represents the crew member's core identity
  drawBitmap(basePattern, 16, 16)
  
  // Add skill indicators - shows their competency levels
  drawSkillIndicators()
  
  // Add status effects - critical for gameplay decisions
  drawStatusEffects()
  
  // Add trait indicators - affects crew behavior and performance
  drawTraitIndicators()
}

function drawBitmap(bitmap, x, y) {
  if (!graphics.value) return
  
  graphics.value.beginFill(culturalColors.value)
  
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      if (bitmap[row][col]) {
        graphics.value.drawRect(
          x + col * 2,
          y + row * 2,
          2,
          2
        )
      }
    }
  }
  
  graphics.value.endFill()
}

function drawSkillIndicators() {
  if (!graphics.value) return
  
  const skills = ['engineering', 'piloting', 'social', 'combat']
  const positions = [
    { x: 4, y: 4 },   // top-left
    { x: 52, y: 4 },  // top-right
    { x: 4, y: 52 },  // bottom-left
    { x: 52, y: 52 }  // bottom-right
  ]
  
  skills.forEach((skill, index) => {
    const skillValue = props.crewData[`skill_${skill}`] || 0
    const pos = positions[index]
    
    // Only show indicators for skills above 50 - represents competency threshold
    if (skillValue > 50) {
      const glyph = SKILL_GLYPHS[skill]
      drawSmallBitmap(glyph, pos.x, pos.y)
    }
  })
}

function drawSmallBitmap(bitmap, x, y) {
  if (!graphics.value) return
  
  graphics.value.beginFill(0xFFFFFF)
  
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      if (bitmap[row][col]) {
        graphics.value.drawRect(
          x + col,
          y + row,
          1,
          1
        )
      }
    }
  }
  
  graphics.value.endFill()
}

function drawStatusEffects() {
  if (!graphics.value) return
  
  // Critical health overlay - player needs to see this immediately
  if (props.crewData.health < 30) {
    graphics.value.beginFill(0xFFFFFF, 0.3)
    const pattern = STATUS_EFFECTS.low_health
    drawBitmap(pattern, 16, 16)
    graphics.value.endFill()
  }
  
  // Low morale indicator - affects crew performance and retention
  if (props.crewData.morale < 30) {
    graphics.value.beginFill(0xFFFFFF)
    const pattern = STATUS_EFFECTS.low_morale
    drawBitmap(pattern, 16, 16)
    graphics.value.endFill()
  }
}

function drawTraitIndicators() {
  if (!graphics.value || !props.crewData.traits) return
  
  // Draw small dots for traits - these affect crew behavior and mission success
  const traits = props.crewData.traits || []
  traits.forEach((trait, index) => {
    if (index < 4) { // Only show first 4 traits to avoid clutter
      const x = 32 + (index * 3)
      const y = 8
      
      graphics.value.beginFill(0xFFFFFF)
      graphics.value.drawRect(x, y, 1, 1)
      graphics.value.endFill()
    }
  })
}

function addGlitchEffect() {
  if (!graphics.value) return
  
  // Add random pixels for glitch effect - indicates critical health status
  graphics.value.beginFill(0xFFFFFF)
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 64
    const y = Math.random() * 64
    graphics.value.drawRect(x, y, 1, 1)
  }
  graphics.value.endFill()
  
  // Remove glitch after short time
  setTimeout(() => {
    generateAvatar()
  }, 100)
}

function addBreathingEffect() {
  if (!graphics.value) return
  
  // Subtle scale animation - indicates crew member is alive and functional
  graphics.value.scale.x = 1 + Math.sin(Date.now() * 0.005) * 0.05
  graphics.value.scale.y = 1 + Math.cos(Date.now() * 0.005) * 0.05
}

function checkStatusChanges() {
  const currentHealth = props.crewData.health || 0
  
  if (currentHealth !== lastHealthCheck.value) {
    lastHealthCheck.value = currentHealth
    emit('status-change', { type: 'health', value: currentHealth })
    
    // Regenerate avatar on major status changes
    if (Math.abs(currentHealth - lastHealthCheck.value) > 20) {
      generateAvatar()
    }
  }
}

// Watch for crew data changes
watch(() => props.crewData, () => {
  generateAvatar()
}, { deep: true })

onMounted(() => {
  initPixi()
})

onUnmounted(() => {
  if (pixiApp.value) {
    pixiApp.value.destroy(true)
    pixiApp.value = null
  }
})

defineExpose({
  generateAvatar,
  pixiApp
})
</script>

<style scoped>
.crew-avatar {
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

.crew-display-header {
  background: #111111;
  border-bottom: 2px solid #ffffff;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
}

.header-marker {
  color: #ff6600;
  font-weight: bold;
}

.crew-title {
  font-weight: bold;
  flex: 1;
}

.crew-id {
  font-size: 8px;
  color: #888888;
  font-family: monospace;
}

.crew-canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background: #000000;
}

.crew-canvas {
  display: block;
  background: #000000;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: 1px solid #333333;
}

.crew-status-footer {
  background: #111111;
  border-top: 2px solid #ffffff;
  padding: 4px 8px;
}

.status-grid {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.status-item {
  display: flex;
  gap: 4px;
  font-size: 8px;
  align-items: center;
}

.status-label {
  color: #666666;
  font-weight: bold;
}

.status-value {
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.status-good { color: #00ff00; }
.status-warning { color: #ffaa00; }
.status-critical { color: #ff0000; }
</style>