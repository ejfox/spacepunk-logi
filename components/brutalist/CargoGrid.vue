<template>
  <div class="cargo-container">
    <div class="cargo-header">
      <span class="header-marker">></span>
      <span class="cargo-title">CARGO_BAY</span>
      <span class="cargo-stats">{{ used }}/{{ max }} UNITS</span>
    </div>
    
    <PixiCanvas
      ref="canvas"
      :width="400"
      :height="300"
      @app-ready="init"
    />
    
    <div class="cargo-status">
      <div class="status-item">
        <span class="label">WEIGHT:</span>
        <span class="value">{{ weight.toFixed(1) }} KG</span>
      </div>
      <div class="status-item">
        <span class="label">VOLUME:</span>
        <span class="value">{{ volume.toFixed(1) }} M³</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PixiCanvas from './PixiCanvas.vue'
import { createPixelRect, createASCIIText, TERMINAL_COLORS } from '@/shared/pixiUtils.js'

const props = defineProps({
  cargo: { type: Array, default: () => [] },
  used: { type: Number, default: 0 },
  max: { type: Number, default: 100 }
})

const COLORS = {
  tech: TERMINAL_COLORS.GREEN,
  consumable: TERMINAL_COLORS.BLUE,
  luxury: TERMINAL_COLORS.AMBER,
  default: TERMINAL_COLORS.NEUTRAL
}

const canvas = ref(null)
const grid = ref(null)

const weight = computed(() => 
  props.cargo.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0)
)

const volume = computed(() => 
  props.cargo.reduce((sum, item) => sum + (item.volume || 0) * (item.quantity || 1), 0)
)

function init(app) {
  // Simple grid background
  const bg = createPixelRect(360, 240, {
    fill: TERMINAL_COLORS.BLACK,
    stroke: TERMINAL_COLORS.WHITE,
    strokeWidth: 2
  })
  bg.x = 20
  bg.y = 30
  app.stage.addChild(bg)
  
  // Grid lines (12x8 = 96 slots)
  for (let x = 0; x < 12; x++) {
    for (let y = 0; y < 8; y++) {
      const cell = createPixelRect(28, 28, {
        fill: 0,
        stroke: TERMINAL_COLORS.CORPORATE_GRAY,
        strokeWidth: 1
      })
      cell.x = 22 + x * 30
      cell.y = 32 + y * 30
      app.stage.addChild(cell)
    }
  }
  
  // Title
  const title = createASCIIText('CARGO MANIFEST', {
    style: { fontSize: 14, fill: TERMINAL_COLORS.WHITE }
  })
  title.x = 20
  title.y = 10
  app.stage.addChild(title)
  
  drawCargo(app)
}

function drawCargo(app) {
  // Remove old cargo (keep first 98 children: bg + grid + title)
  while (app.stage.children.length > 98) {
    const child = app.stage.children.pop()
    child.destroy()
  }
  
  let slot = 0
  
  props.cargo.forEach(item => {
    const quantity = Math.min(item.quantity || 1, 96 - slot) // Don't overflow
    
    for (let i = 0; i < quantity; i++) {
      if (slot >= 96) break // 12x8 grid limit
      
      const x = slot % 12
      const y = Math.floor(slot / 12)
      
      const cargo = createPixelRect(26, 26, {
        fill: COLORS[item.category] || COLORS.default,
        stroke: TERMINAL_COLORS.WHITE,
        strokeWidth: 1
      })
      
      cargo.x = 23 + x * 30
      cargo.y = 33 + y * 30
      app.stage.addChild(cargo)
      
      // Item code
      if (item.code) {
        const code = createASCIIText(item.code.slice(0, 3), {
          style: { fontSize: 8, fill: TERMINAL_COLORS.BLACK }
        })
        code.x = cargo.x + 2
        code.y = cargo.y + 2
        app.stage.addChild(code)
      }
      
      slot++
    }
  })
}

watch(() => props.cargo, () => {
  if (canvas.value?.pixiApp) {
    drawCargo(canvas.value.pixiApp)
  }
}, { deep: true })

function cleanup() {
  // PixiCanvas handles cleanup
}

defineExpose({ cleanup })
</script>

<style scoped>
.cargo-container {
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.cargo-header {
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

.cargo-title {
  font-weight: bold;
  font-size: 14px;
  flex: 1;
}

.cargo-stats {
  font-size: 12px;
  color: #00ff00;
  font-weight: bold;
}

.cargo-status {
  background: #111111;
  border-top: 2px solid #ffffff;
  padding: 8px 12px;
  display: flex;
  gap: 16px;
}

.status-item {
  display: flex;
  gap: 4px;
  font-size: 11px;
}

.label {
  color: #666666;
  font-weight: bold;
}

.value {
  color: #00ff00;
  font-weight: bold;
}
</style>