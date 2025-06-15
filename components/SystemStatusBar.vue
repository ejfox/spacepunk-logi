<template>
  <div class="system-status-bar">
    <!-- Core System Info -->
    <div class="status-section">
      <span class="system-label">[SPACEPUNK LOGISTICS v0.1]</span>
      <div class="system-stats">
        <span class="stat">SYS_OK</span>
        <span class="divider">|</span>
        <span class="stat">{{ formatUptime }}</span>
      </div>
    </div>

    <!-- Server Status -->
    <div class="status-section" v-if="serverStatus">
      <div class="server-info">
        <span class="label">SERVER:</span>
        <span class="value" :class="serverHealthClass">{{ serverHealthText }}</span>
        <span class="divider">|</span>
        <span class="label">TICK:</span>
        <span class="value">#{{ serverStatus.currentTick || 0 }}</span>
        <span class="divider">|</span>
        <span class="label">NEXT:</span>
        <span class="value countdown" :class="tickUrgencyClass">
          {{ formatTickCountdown }}
        </span>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="status-section">
      <div class="connection-info">
        <span class="label">CONN:</span>
        <span class="value" :class="connectionClass">
          {{ connectionText }}
        </span>
        <div class="signal-indicator" :class="connectionStatus">
          <div class="signal-bar"></div>
          <div class="signal-bar"></div>
          <div class="signal-bar"></div>
        </div>
      </div>
    </div>

    <!-- Game State Info -->
    <div class="status-section" v-if="gameState">
      <div class="game-info">
        <span class="label">CAPTAINS:</span>
        <span class="value">{{ gameState.activePlayers || 0 }}</span>
        <span class="divider">|</span>
        <span class="label">MARKET:</span>
        <span class="value" :class="marketStatusClass">{{ marketStatusText }}</span>
      </div>
    </div>

    <!-- System Alerts -->
    <div class="alerts-section" v-if="alerts.length > 0">
      <div class="alert" v-for="alert in alerts" :key="alert.id" :class="alert.type">
        <span class="alert-icon">{{ alert.icon }}</span>
        <span class="alert-text">{{ alert.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  serverStatus: {
    type: Object,
    default: null
  },
  connectionStatus: {
    type: String,
    default: 'disconnected'
  },
  gameState: {
    type: Object,
    default: null
  }
})

const startTime = ref(Date.now())
const currentTime = ref(Date.now())
const alerts = ref([])
let uptimeInterval = null

onMounted(() => {
  uptimeInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (uptimeInterval) {
    clearInterval(uptimeInterval)
  }
})

const formatUptime = computed(() => {
  const uptimeMs = currentTime.value - startTime.value
  const uptimeSeconds = Math.floor(uptimeMs / 1000)
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = uptimeSeconds % 60
  
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}m`
  } else if (minutes > 0) {
    return `${minutes}m${seconds.toString().padStart(2, '0')}s`
  } else {
    return `${seconds}s`
  }
})

const serverHealthClass = computed(() => {
  if (!props.serverStatus) return 'error'
  return props.connectionStatus === 'connected' ? 'ok' : 'error'
})

const serverHealthText = computed(() => {
  if (!props.serverStatus) return 'OFFLINE'
  return props.connectionStatus === 'connected' ? 'ONLINE' : 'ERROR'
})

const connectionClass = computed(() => {
  return props.connectionStatus === 'connected' ? 'connected' : 'disconnected'
})

const connectionText = computed(() => {
  return props.connectionStatus.toUpperCase()
})

const tickUrgencyClass = computed(() => {
  if (!props.serverStatus?.nextTickEta) return ''
  const eta = props.serverStatus.nextTickEta
  if (eta <= 1) return 'imminent'
  if (eta <= 3) return 'urgent'
  if (eta <= 10) return 'warning'
  return ''
})

const formatTickCountdown = computed(() => {
  if (!props.serverStatus?.nextTickEta) return '--'
  const eta = props.serverStatus.nextTickEta
  if (eta <= 1) return 'NOW'
  return `${eta}s`
})

const marketStatusClass = computed(() => {
  // Simulate market volatility for now
  const now = Math.floor(Date.now() / 10000)
  const volatility = now % 3
  if (volatility === 0) return 'stable'
  if (volatility === 1) return 'volatile'
  return 'unstable'
})

const marketStatusText = computed(() => {
  const classes = marketStatusClass.value
  if (classes === 'stable') return 'STABLE'
  if (classes === 'volatile') return 'VOLATILE'
  return 'UNSTABLE'
})

// Add system alerts based on conditions
function addAlert(type, message, icon = '!', duration = 5000) {
  const alert = {
    id: Date.now() + Math.random(),
    type,
    message,
    icon
  }
  alerts.value.push(alert)
  
  if (duration > 0) {
    setTimeout(() => {
      const index = alerts.value.findIndex(a => a.id === alert.id)
      if (index !== -1) {
        alerts.value.splice(index, 1)
      }
    }, duration)
  }
}

// Watch for connection changes to add alerts
watch(() => props.connectionStatus, (newStatus, oldStatus) => {
  if (oldStatus && newStatus !== oldStatus) {
    if (newStatus === 'connected') {
      addAlert('info', 'SHIP SYSTEMS RESTORED', '✓')
    } else {
      addAlert('error', 'SHIP SYSTEMS COMPROMISED', '⚠', 0)
    }
  }
}, { immediate: false })

defineExpose({
  addAlert
})
</script>

<style scoped>
.system-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: linear-gradient(90deg, #000000 0%, #001100 50%, #000000 100%);
  border: 1px solid #00ff00;
  border-bottom: 2px solid #00ff00;
  font-family: var(--font-code);
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
}

.system-status-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00ff00, transparent);
  animation: scan 4s linear infinite;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.system-label {
  color: #00ff00;
  font-weight: bold;
  font-size: 12px;
}

.system-stats,
.server-info,
.connection-info,
.game-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label {
  color: #00ff00;
  opacity: 0.7;
  font-size: 10px;
}

.value {
  color: #00ff00;
  font-weight: bold;
}

.value.ok {
  color: #00ff00;
}

.value.error {
  color: #ff0000;
  animation: pulse 1s infinite;
}

.value.connected {
  color: #00ff00;
}

.value.disconnected {
  color: #ff6600;
}

.value.stable {
  color: #00ff00;
}

.value.volatile {
  color: #ffaa00;
}

.value.unstable {
  color: #ff6600;
}

.countdown.warning {
  color: #ffaa00;
}

.countdown.urgent {
  color: #ff6600;
}

.countdown.imminent {
  color: #ff0000;
  animation: blink 0.3s infinite;
}

.divider {
  color: #00ff00;
  opacity: 0.3;
}

.stat {
  color: #00ff00;
  font-size: 9px;
  opacity: 0.8;
}

.signal-indicator {
  display: flex;
  gap: 1px;
  margin-left: 4px;
}

.signal-bar {
  width: 2px;
  height: 8px;
  background: #333;
  transition: background 0.3s ease;
}

.signal-indicator.connected .signal-bar {
  background: #00ff00;
}

.signal-indicator.connected .signal-bar:nth-child(2) {
  animation-delay: 0.1s;
}

.signal-indicator.connected .signal-bar:nth-child(3) {
  animation-delay: 0.2s;
}

.alerts-section {
  position: absolute;
  right: 12px;
  top: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
}

.alert {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid;
  font-size: 9px;
  animation: slideIn 0.3s ease-out;
}

.alert.info {
  border-color: #00ff00;
  color: #00ff00;
}

.alert.error {
  border-color: #ff0000;
  color: #ff0000;
  animation: slideIn 0.3s ease-out, pulse 1s infinite;
}

.alert-icon {
  font-weight: bold;
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>