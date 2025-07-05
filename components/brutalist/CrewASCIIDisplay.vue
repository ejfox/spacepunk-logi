<template>
  <div class="ascii-display-container">
    <!-- Biometric Scanner Header -->
    <div class="scanner-header">
      <span class="scanner-id">{{ scannerId }}</span>
      <span class="scanner-status" :class="getScannerStatusClass()">{{ getScannerStatus() }}</span>
    </div>
    
    <!-- ASCII Art Status Visualization -->
    <div class="ascii-visualization">
      <div class="ascii-art">
        <pre class="health-display">{{ getHealthASCII() }}</pre>
        <pre class="morale-display">{{ getMoraleASCII() }}</pre>
        <pre class="stress-display">{{ getStressASCII() }}</pre>
      </div>
      
      <!-- Vital Signs Readout -->
      <div class="vitals-readout">
        <div class="vital-line">
          <span class="vital-label">HEALTH:</span>
          <span class="vital-bar">{{ getVitalBar(health) }}</span>
          <span class="vital-value" :class="getHealthClass()">{{ health }}%</span>
        </div>
        <div class="vital-line">
          <span class="vital-label">MORALE:</span>
          <span class="vital-bar">{{ getVitalBar(morale) }}</span>
          <span class="vital-value" :class="getMoraleClass()">{{ morale }}%</span>
        </div>
        <div class="vital-line">
          <span class="vital-label">STRESS:</span>
          <span class="vital-bar">{{ getStressBar(stress) }}</span>
          <span class="vital-value" :class="getStressClass()">{{ stress }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Corporate Assessment -->
    <div class="corporate-assessment">
      <div class="assessment-line">
        <span class="assessment-label">PRODUCTIVITY INDEX:</span>
        <span class="assessment-value">{{ getProductivityIndex() }}</span>
      </div>
      <div class="assessment-line">
        <span class="assessment-label">COMPLIANCE RATING:</span>
        <span class="assessment-value">{{ getComplianceRating() }}</span>
      </div>
      <div class="assessment-line">
        <span class="assessment-label">RETENTION PROBABILITY:</span>
        <span class="assessment-value">{{ getRetentionProb() }}</span>
      </div>
    </div>
    
    <!-- System Footer -->
    <div class="system-footer">
      <span class="timestamp">{{ getCurrentTimestamp() }}</span>
      <span class="system-id">SYS-{{ getSystemId() }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  health: {
    type: Number,
    default: 100
  },
  morale: {
    type: Number,
    default: 75
  },
  stress: {
    type: Number,
    default: 25
  },
  crewId: {
    type: String,
    default: 'UNKNOWN'
  }
})

const scannerId = computed(() => {
  return `BIO-SCAN-${props.crewId.slice(0, 8).toUpperCase()}`
})

const getHealthASCII = () => {
  const h = props.health
  if (h >= 90) return `   ♥ ♥ ♥   \n  ♥ ♥ ♥ ♥  \n   ♥ ♥ ♥   `
  if (h >= 70) return `   ♥ ♥ ░   \n  ♥ ♥ ♥ ░  \n   ♥ ♥ ░   `
  if (h >= 50) return `   ♥ ░ ░   \n  ♥ ♥ ░ ░  \n   ♥ ░ ░   `
  if (h >= 30) return `   ░ ░ ░   \n  ♥ ░ ░ ░  \n   ░ ░ ░   `
  return `   ✗ ✗ ✗   \n  ✗ ✗ ✗ ✗  \n   ✗ ✗ ✗   `
}

const getMoraleASCII = () => {
  const m = props.morale
  if (m >= 80) return `  ◡   ◡  \n     ◡    \n ◡ ◡ ◡ ◡ `
  if (m >= 60) return `  ◔   ◔  \n     ═    \n ◔ ◔ ◔ ◔ `
  if (m >= 40) return `  ◔   ◔  \n     ═    \n ░ ░ ░ ░ `
  if (m >= 20) return `  ◔   ◔  \n     ∩    \n ░ ░ ░ ░ `
  return `  ✗   ✗  \n     ∩    \n ░ ░ ░ ░ `
}

const getStressASCII = () => {
  const s = props.stress
  if (s >= 80) return `╔═══════╗\n║ ▓▓▓▓▓ ║\n║ ▓▓▓▓▓ ║\n╚═══════╝`
  if (s >= 60) return `╔═══════╗\n║ ▓▓▓░░ ║\n║ ▓▓▓░░ ║\n╚═══════╝`
  if (s >= 40) return `╔═══════╗\n║ ▓▓░░░ ║\n║ ▓▓░░░ ║\n╚═══════╝`
  if (s >= 20) return `╔═══════╗\n║ ▓░░░░ ║\n║ ▓░░░░ ║\n╚═══════╝`
  return `╔═══════╗\n║ ░░░░░ ║\n║ ░░░░░ ║\n╚═══════╝`
}

const getScannerStatus = () => {
  if (props.health < 30 || props.stress > 80) return 'ALERT'
  if (props.health < 60 || props.stress > 60 || props.morale < 30) return 'CAUTION'
  return 'NOMINAL'
}

const getScannerStatusClass = () => {
  const status = getScannerStatus()
  if (status === 'ALERT') return 'status-alert'
  if (status === 'CAUTION') return 'status-caution'
  return 'status-nominal'
}

const getVitalBar = (value) => {
  const filled = Math.floor(value / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

const getStressBar = (value) => {
  const filled = Math.floor(value / 10)
  const empty = 10 - filled
  // Stress bar is inverted - more stress = more red
  return '▓'.repeat(filled) + '░'.repeat(empty)
}

const getHealthClass = () => {
  if (props.health >= 80) return 'vital-good'
  if (props.health >= 50) return 'vital-fair'
  return 'vital-poor'
}

const getMoraleClass = () => {
  if (props.morale >= 70) return 'vital-good'
  if (props.morale >= 40) return 'vital-fair'
  return 'vital-poor'
}

const getStressClass = () => {
  if (props.stress <= 30) return 'vital-good'
  if (props.stress <= 60) return 'vital-fair'
  return 'vital-poor'
}

const getProductivityIndex = () => {
  const base = (props.health * 0.4 + props.morale * 0.4 + (100 - props.stress) * 0.2)
  const jitter = (Math.sin(Date.now() / 10000) * 2) // Subtle variation
  return Math.round(base + jitter) + '%'
}

const getComplianceRating = () => {
  const ratings = ['EXEMPLARY', 'SATISFACTORY', 'ADEQUATE', 'MARGINAL', 'UNSATISFACTORY']
  const index = Math.floor((100 - props.morale) / 20)
  return ratings[Math.min(index, ratings.length - 1)]
}

const getRetentionProb = () => {
  const retention = Math.max(0, Math.min(100, 
    props.morale * 0.6 + props.health * 0.2 + (100 - props.stress) * 0.2
  ))
  return Math.round(retention) + '%'
}

const getCurrentTimestamp = () => {
  const now = new Date()
  return now.toISOString().slice(11, 19) // HH:MM:SS format
}

const getSystemId = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}
</script>

<style scoped>
.ascii-display-container {
  background: #000000;
  border: 2px solid #00ff00;
  color: #00ff00;
  font-family: 'MonaspiceAr Nerd Font', 'MonaspiceAr', monospace;
  padding: 8px;
  margin: 6px 0;
  font-size: 10px;
  line-height: 1.2;
  position: relative;
  overflow: hidden;
}

.ascii-display-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ff00, transparent);
  animation: scan-line 3s linear infinite;
}

@keyframes scan-line {
  0% { left: -100%; }
  100% { left: 100%; }
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #004400;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.scanner-id {
  font-size: 11px;
  font-weight: bold;
  color: #00ff00;
}

.scanner-status {
  font-size: 9px;
  font-weight: bold;
  padding: 1px 4px;
  border: 1px solid;
}

.status-alert {
  color: #ff0000;
  border-color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
  animation: blink 1s infinite;
}

.status-caution {
  color: #ffaa00;
  border-color: #ffaa00;
  background: rgba(255, 170, 0, 0.1);
}

.status-nominal {
  color: #00ff00;
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.ascii-visualization {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

.ascii-art {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.health-display {
  color: #ff6b6b;
  font-size: 8px;
  line-height: 1;
  margin: 0;
}

.morale-display {
  color: #4ecdc4;
  font-size: 8px;
  line-height: 1;
  margin: 0;
}

.stress-display {
  color: #ffe66d;
  font-size: 7px;
  line-height: 1;
  margin: 0;
}

.vitals-readout {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vital-line {
  display: grid;
  grid-template-columns: 60px 1fr 35px;
  gap: 4px;
  align-items: center;
  font-size: 8px;
}

.vital-label {
  color: #888888;
  font-weight: bold;
}

.vital-bar {
  font-family: monospace;
  font-size: 8px;
  letter-spacing: 0;
}

.vital-value {
  font-weight: bold;
  text-align: right;
}

.vital-good { color: #00ff00; }
.vital-fair { color: #ffaa00; }
.vital-poor { color: #ff0000; }

.corporate-assessment {
  border-top: 1px solid #004400;
  padding-top: 6px;
  margin-bottom: 6px;
}

.assessment-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  font-size: 8px;
}

.assessment-label {
  color: #666666;
  font-style: italic;
}

.assessment-value {
  color: #00ff00;
  font-weight: bold;
}

.system-footer {
  border-top: 1px solid #004400;
  padding-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7px;
}

.timestamp {
  color: #444444;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
}

.system-id {
  color: #444444;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
}

@keyframes blink {
  50% { opacity: 0.5; }
}
</style>