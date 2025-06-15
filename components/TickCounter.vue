<template>
  <div class="tick-counter" :class="{ processing: isProcessing }">
    <div class="tick-display">
      <span class="label">SYSTEM TICK</span>
      <span class="tick-number">#{{ currentTick }}</span>
    </div>
    <div class="divider">|</div>
    <div class="countdown-display">
      <span class="label">NEXT CYCLE</span>
      <span class="countdown" :class="{ urgent: nextTickEta <= 3, imminent: nextTickEta <= 1 }">
        {{ formatCountdown }}
      </span>
    </div>
    <div class="status-indicator" :class="statusClass" :title="statusTooltip">
      {{ statusSymbol }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  currentTick: {
    type: Number,
    default: 0
  },
  nextTickEta: {
    type: Number,
    default: 0
  },
  tickInterval: {
    type: Number,
    default: 30000
  }
})

const isProcessing = ref(false)

// Watch for tick changes to show processing animation
watch(() => props.currentTick, (newTick, oldTick) => {
  if (newTick !== oldTick) {
    isProcessing.value = true
    setTimeout(() => {
      isProcessing.value = false
    }, 500)
  }
})

const formatCountdown = computed(() => {
  if (props.nextTickEta === 0) return '--'
  if (props.nextTickEta === 1) return 'IMMINENT'
  return `T-${props.nextTickEta.toString().padStart(2, '0')}`
})

const statusClass = computed(() => {
  if (isProcessing.value) return 'processing'
  if (props.nextTickEta <= 1) return 'imminent'
  if (props.nextTickEta <= 3) return 'urgent'
  if (props.nextTickEta <= 10) return 'warning'
  return 'nominal'
})

const statusSymbol = computed(() => {
  if (isProcessing.value) return '◊'
  if (props.nextTickEta <= 1) return '▼'
  if (props.nextTickEta <= 3) return '▲'
  return '■'
})

const statusTooltip = computed(() => {
  if (isProcessing.value) return 'Processing tick...'
  if (props.nextTickEta <= 1) return 'Tick imminent'
  if (props.nextTickEta <= 3) return 'Tick approaching'
  return 'System nominal'
})
</script>

<style scoped>
.tick-counter {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-code);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ff00;
  padding: 4px 8px;
  position: relative;
  overflow: hidden;
}

.tick-counter.processing {
  animation: glitch 0.3s ease-in-out;
}

.tick-display,
.countdown-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.divider {
  color: #00ff00;
  opacity: 0.4;
  font-size: 16px;
  line-height: 1;
}

.label {
  color: #00ff00;
  opacity: 0.6;
  font-size: 9px;
  letter-spacing: 1.5px;
}

.tick-number {
  color: #00ff00;
  font-weight: bold;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.countdown {
  color: #00ff00;
  font-weight: bold;
  font-size: 14px;
  min-width: 60px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.countdown.urgent {
  color: #ffff00;
}

.countdown.imminent {
  color: #ff0000;
  animation: blink 0.3s infinite;
}

.status-indicator {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  transition: all 0.2s ease;
}

.status-indicator.nominal {
  color: #00ff00;
  opacity: 0.5;
}

.status-indicator.warning {
  color: #ffff00;
  opacity: 0.7;
}

.status-indicator.urgent {
  color: #ff9900;
  opacity: 0.9;
  animation: pulse 0.5s infinite;
}

.status-indicator.imminent {
  color: #ff0000;
  animation: spin 0.5s linear infinite;
}

.status-indicator.processing {
  color: #00ffff;
  animation: spin 0.3s linear;
}

@keyframes pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.4; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

@keyframes spin {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
}

@keyframes glitch {
  0%, 100% { 
    transform: translateX(0);
    filter: none;
  }
  20% { 
    transform: translateX(-2px);
    filter: hue-rotate(90deg);
  }
  40% { 
    transform: translateX(2px);
    filter: hue-rotate(-90deg);
  }
  60% { 
    transform: translateX(-1px);
    filter: brightness(2);
  }
  80% { 
    transform: translateX(1px);
    filter: brightness(0.5);
  }
}

/* Scan line effect */
.tick-counter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #00ff00;
  opacity: 0.1;
  animation: scanline 8s linear infinite;
}

@keyframes scanline {
  0% { transform: translateY(0); }
  100% { transform: translateY(32px); }
}
</style>