<template>
  <div class="performance-monitor" :class="{ 'monitor-minimal': fps < 30 }">
    <div class="monitor-header">
      <span class="monitor-title">PERF</span>
      <span class="monitor-status" :class="statusClass">{{ statusText }}</span>
    </div>
    <div class="monitor-metrics">
      <div class="metric">
        <span class="metric-label">FPS:</span>
        <span class="metric-value">{{ Math.round(fps) }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">MODE:</span>
        <span class="metric-value">{{ qualityMode.toUpperCase() }}</span>
      </div>
      <div v-if="wsStatus" class="metric">
        <span class="metric-label">LINK:</span>
        <span class="metric-value" :class="connectionClass">{{ wsStatusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fps: {
    type: Number,
    required: true
  },
  qualityMode: {
    type: String,
    default: 'optimal'
  },
  wsStatus: {
    type: String,
    default: null
  }
})

const statusClass = computed(() => {
  if (props.fps > 50) return 'status-optimal'
  if (props.fps > 30) return 'status-standard'
  return 'status-degraded'
})

const statusText = computed(() => {
  if (props.fps > 50) return 'OPTIMAL'
  if (props.fps > 30) return 'STANDARD'
  return 'DEGRADED'
})

const connectionClass = computed(() => {
  if (props.wsStatus === 'OPEN') return 'conn-active'
  if (props.wsStatus === 'CONNECTING') return 'conn-pending'
  return 'conn-error'
})

const wsStatusText = computed(() => {
  switch (props.wsStatus) {
    case 'OPEN': return 'SYNC'
    case 'CONNECTING': return 'LINK'
    case 'CLOSED': return 'OFF'
    default: return 'ERR'
  }
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #333;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
  font-size: 10px;
  color: #888;
  padding: 6px 8px;
  min-width: 120px;
  z-index: 1000;
  transition: all 0.2s ease;
}

.performance-monitor:hover {
  background: rgba(0, 0, 0, 0.95);
  border-color: #666;
}

.monitor-minimal {
  opacity: 0.6;
  font-size: 9px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
  margin-bottom: 4px;
}

.monitor-title {
  color: #fff;
  font-weight: bold;
}

.monitor-status {
  font-size: 8px;
  letter-spacing: 0.5px;
}

.status-optimal { color: #00ff00; }
.status-standard { color: #ffff00; }
.status-degraded { color: #ff0000; }

.monitor-metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: #666;
  font-size: 8px;
}

.metric-value {
  color: #ccc;
  font-weight: bold;
}

.conn-active { color: #00ff00; }
.conn-pending { color: #ffff00; }
.conn-error { color: #ff0000; }

/* Hide on mobile to save space */
@media (max-width: 768px) {
  .performance-monitor {
    display: none;
  }
}
</style>