<template>
  <div class="lockpicking-interface">
    <div class="interface-header">
      <span class="header-marker">></span>
      <span class="interface-title">LOCKPICKING_SUBSYSTEM</span>
      <span class="interface-id">{{ sessionId }}</span>
    </div>
    
    <div class="canvas-container">
      <canvas 
        ref="lockCanvas" 
        :width="canvasWidth" 
        :height="canvasHeight"
        class="lock-canvas"
      />
      
      <div class="overlay-hud">
        <div class="hud-item">
          <span class="hud-label">PIN:</span>
          <span class="hud-value">{{ currentPin + 1 }}/{{ totalPins }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">TIME:</span>
          <span class="hud-value">{{ timeRemaining }}s</span>
        </div>
      </div>
    </div>
    
    <div class="interface-footer">
      <div class="footer-status">
        <span v-if="gameState === 'playing'">PRESS SPACE WHEN PIN IS ALIGNED</span>
        <span v-else-if="gameState === 'success'" class="status-success">LOCK BYPASSED - ACCESS GRANTED</span>
        <span v-else-if="gameState === 'failure'" class="status-critical">LOCK RESET - SECURITY ALERTED</span>
        <span v-else>INITIALIZING LOCKPICKING SUBSYSTEM...</span>
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
  crewSkill: { type: Number, default: 50 }
})

const SETTINGS = {
  routine: { pins: 3, speed: 0.01, timeout: 45 },
  standard: { pins: 4, speed: 0.015, timeout: 30 },
  challenging: { pins: 5, speed: 0.02, timeout: 25 },
  dangerous: { pins: 6, speed: 0.025, timeout: 20 }
}

const base = ref(null)
const pins = ref([])
const current = ref(0)
const phase = ref(0)

const config = computed(() => SETTINGS[props.difficulty] || SETTINGS.standard)
const timeout = computed(() => config.value.timeout)
const speed = computed(() => {
  const skill = Math.max(0, Math.min(100, props.crewSkill))
  return config.value.speed * (1 - skill * 0.003) // Max 30% reduction
})

function init(app) {
  pins.value = []
  current.value = 0
  phase.value = 0
  
  const cx = app.screen.width / 2
  const cy = app.screen.height / 2
  
  // Simple lock display
  const lock = createPixelRect(200, 80, {
    fill: TERMINAL_COLORS.BLACK,
    stroke: TERMINAL_COLORS.WHITE,
    strokeWidth: 2
  })
  lock.x = cx - 100
  lock.y = cy - 40
  app.stage.addChild(lock)
  
  // Create pins
  for (let i = 0; i < config.value.pins; i++) {
    const x = cx - 60 + i * 30
    const pin = {
      x,
      y: cy,
      target: 0.3 + Math.random() * 0.4, // Random target between 0.3-0.7
      position: 0,
      locked: true,
      graphics: createPixelRect(8, 20, {
        fill: TERMINAL_COLORS.NEUTRAL,
        stroke: TERMINAL_COLORS.WHITE,
        strokeWidth: 1
      })
    }
    
    pin.graphics.x = x - 4
    pin.graphics.y = cy - 10
    app.stage.addChild(pin.graphics)
    pins.value.push(pin)
  }
  
  // Status text
  const status = createASCIIText(`PIN ${current.value + 1}/${config.value.pins}`, {
    style: { fontSize: 16, fill: TERMINAL_COLORS.WHITE }
  })
  status.x = cx - 50
  status.y = cy + 50
  app.stage.addChild(status)
  pins.value.statusText = status
  
  // Instructions
  const help = createASCIIText('PRESS SPACE WHEN GREEN', {
    style: { fontSize: 12, fill: TERMINAL_COLORS.WHITE }
  })
  help.x = cx - 80
  help.y = cy + 70
  app.stage.addChild(help)
  
  // Start listening
  window.addEventListener('keydown', onKey)
  base.value.startGame()
}

function tick() {
  if (current.value >= pins.value.length) return
  
  const pin = pins.value[current.value]
  if (!pin || !pin.locked) return
  
  // Move pin
  pin.position += speed.value
  const offset = Math.sin(pin.position) * 15
  pin.graphics.y = pin.y - 10 + offset
  
  // Check if in target zone
  const normalized = (Math.sin(pin.position) + 1) / 2 // 0-1
  const inTarget = Math.abs(normalized - pin.target) < 0.1
  
  pin.graphics.tint = inTarget ? TERMINAL_COLORS.SUCCESS : TERMINAL_COLORS.NEUTRAL
}

function onKey(e) {
  if (e.code !== 'Space' || !base.value?.gameActive) return
  e.preventDefault()
  
  const pin = pins.value[current.value]
  if (!pin || !pin.locked) return
  
  const normalized = (Math.sin(pin.position) + 1) / 2
  const hit = Math.abs(normalized - pin.target) < 0.1
  
  if (hit) {
    // Success - lock pin
    pin.locked = false
    pin.graphics.tint = TERMINAL_COLORS.SUCCESS
    current.value++
    
    // Update status
    if (pins.value.statusText) {
      pins.value.statusText.text = `PIN ${current.value + 1}/${config.value.pins}`
    }
    
    if (current.value >= config.value.pins) {
      base.value.endGame(true)
    }
  } else {
    // Failure - reset all
    pins.value.forEach(p => {
      p.locked = true
      p.position = 0
      p.graphics.tint = TERMINAL_COLORS.NEUTRAL
    })
    current.value = 0
    if (pins.value.statusText) {
      pins.value.statusText.text = `PIN 1/${config.value.pins}`
    }
  }
}

function cleanup() {
  window.removeEventListener('keydown', onKey)
  pins.value = []
}

defineExpose({ cleanup })
</script>