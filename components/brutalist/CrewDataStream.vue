<template>
  <div class="data-stream-container">
    <div class="stream-header">
      <span class="stream-title">{{ title }}</span>
      <span class="stream-id">{{ streamId }}</span>
      <span class="stream-rate">{{ updateRate }}Hz</span>
    </div>
    
    <div class="stream-content" ref="streamContent">
      <div 
        v-for="(entry, index) in visibleEntries" 
        :key="entry.id"
        class="stream-entry"
        :class="entry.type"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <span class="entry-timestamp">{{ entry.timestamp }}</span>
        <span class="entry-source">{{ entry.source }}</span>
        <span class="entry-message">{{ entry.message }}</span>
        <span class="entry-value" :class="entry.valueClass">{{ entry.value }}</span>
      </div>
    </div>
    
    <div class="stream-footer">
      <span class="stream-status" :class="getStreamStatusClass()">{{ getStreamStatus() }}</span>
      <span class="data-rate">{{ getDataRate() }} KB/s</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'DATA STREAM'
  },
  crewMembers: {
    type: Array,
    default: () => []
  },
  maxEntries: {
    type: Number,
    default: 20
  },
  updateInterval: {
    type: Number,
    default: 2000
  }
})

const streamContent = ref(null)
const dataEntries = ref([])
const streamId = ref(generateStreamId())
const updateRate = ref(0.5)
let intervalId = null

const visibleEntries = computed(() => {
  return dataEntries.value.slice(-props.maxEntries)
})

function generateStreamId() {
  return `DS-${Date.now().toString(36).slice(-6).toUpperCase()}`
}

function generateDataEntry() {
  const now = new Date()
  const timestamp = now.toISOString().slice(11, 19)
  
  if (props.crewMembers.length === 0) {
    return {
      id: `entry-${Date.now()}-${Math.random()}`,
      timestamp,
      source: 'SYS',
      message: 'NO ACTIVE CREW MONITORING',
      value: 'IDLE',
      type: 'system',
      valueClass: 'value-neutral'
    }
  }
  
  const crew = props.crewMembers[Math.floor(Math.random() * props.crewMembers.length)]
  const entryTypes = [
    () => generateBiometricEntry(crew, timestamp),
    () => generatePerformanceEntry(crew, timestamp),
    () => generateSystemEntry(crew, timestamp),
    () => generateStatusEntry(crew, timestamp),
    () => generateComplianceEntry(crew, timestamp)\n  ]\n  \n  const generator = entryTypes[Math.floor(Math.random() * entryTypes.length)]\n  return generator()\n}\n\nfunction generateBiometricEntry(crew, timestamp) {\n  const metrics = ['HEART_RATE', 'CORTISOL', 'DOPAMINE', 'ADRENALINE', 'BLOOD_O2']\n  const metric = metrics[Math.floor(Math.random() * metrics.length)]\n  const baseValue = {\n    HEART_RATE: 72,\n    CORTISOL: 15,\n    DOPAMINE: 45,\n    ADRENALINE: 12,\n    BLOOD_O2: 98\n  }[metric]\n  \n  const variation = (Math.random() - 0.5) * 20\n  const value = Math.round(baseValue + variation)\n  \n  return {\n    id: `bio-${Date.now()}-${Math.random()}`,\n    timestamp,\n    source: 'BIO',\n    message: `${crew.name.split(' ')[0]} ${metric}`,\n    value: metric === 'BLOOD_O2' ? `${value}%` : `${value}`,\n    type: 'biometric',\n    valueClass: getValueClass(value, baseValue)\n  }\n}\n\nfunction generatePerformanceEntry(crew, timestamp) {\n  const tasks = [\n    'MAINTENANCE_EFFICIENCY',\n    'TASK_COMPLETION_RATE', \n    'PROBLEM_RESOLUTION',\n    'COMMUNICATION_CLARITY',\n    'SKILL_APPLICATION'\n  ]\n  const task = tasks[Math.floor(Math.random() * tasks.length)]\n  const baseScore = 75 + (crew.experience || 0) / 100\n  const score = Math.max(0, Math.min(100, Math.round(baseScore + (Math.random() - 0.5) * 30)))\n  \n  return {\n    id: `perf-${Date.now()}-${Math.random()}`,\n    timestamp,\n    source: 'PERF',\n    message: `${crew.name.split(' ')[0]} ${task}`,\n    value: `${score}%`,\n    type: 'performance',\n    valueClass: score >= 80 ? 'value-good' : score >= 60 ? 'value-fair' : 'value-poor'\n  }\n}\n\nfunction generateSystemEntry(crew, timestamp) {\n  const systems = [\n    'WORKSTATION_LOGIN',\n    'SECURITY_CLEARANCE',\n    'TOOL_CHECKOUT',\n    'SAFETY_PROTOCOL',\n    'SHIFT_HANDOVER'\n  ]\n  const system = systems[Math.floor(Math.random() * systems.length)]\n  const statuses = ['APPROVED', 'VERIFIED', 'COMPLETED', 'AUTHORIZED', 'CONFIRMED']\n  const status = statuses[Math.floor(Math.random() * statuses.length)]\n  \n  return {\n    id: `sys-${Date.now()}-${Math.random()}`,\n    timestamp,\n    source: 'SYS',\n    message: `${crew.name.split(' ')[0]} ${system}`,\n    value: status,\n    type: 'system',\n    valueClass: 'value-neutral'\n  }\n}\n\nfunction generateStatusEntry(crew, timestamp) {\n  const currentHealth = crew.health || 100\n  const currentMorale = crew.morale || 75\n  const currentStress = crew.stress || 25\n  \n  const statusTypes = [\n    { metric: 'HEALTH', value: currentHealth, unit: '%' },\n    { metric: 'MORALE', value: currentMorale, unit: '%' },\n    { metric: 'STRESS', value: currentStress, unit: '%' }\n  ]\n  \n  const status = statusTypes[Math.floor(Math.random() * statusTypes.length)]\n  const jitter = Math.round((Math.random() - 0.5) * 5)\n  const displayValue = Math.max(0, Math.min(100, status.value + jitter))\n  \n  return {\n    id: `stat-${Date.now()}-${Math.random()}`,\n    timestamp,\n    source: 'STAT',\n    message: `${crew.name.split(' ')[0]} ${status.metric}`,\n    value: `${displayValue}${status.unit}`,\n    type: 'status',\n    valueClass: getStatusValueClass(status.metric, displayValue)\n  }\n}\n\nfunction generateComplianceEntry(crew, timestamp) {\n  const compliance = [\n    'SAFETY_ADHERENCE',\n    'PROTOCOL_COMPLIANCE',\n    'PRODUCTIVITY_METRICS',\n    'BEHAVIORAL_ASSESSMENT',\n    'LOYALTY_INDEX'\n  ]\n  const metric = compliance[Math.floor(Math.random() * compliance.length)]\n  const baseScore = Math.max(50, (crew.morale || 75))\n  const score = Math.round(baseScore + (Math.random() - 0.5) * 20)\n  \n  return {\n    id: `comp-${Date.now()}-${Math.random()}`,\n    timestamp,\n    source: 'COMP',\n    message: `${crew.name.split(' ')[0]} ${metric}`,\n    value: `${score}%`,\n    type: 'compliance',\n    valueClass: score >= 85 ? 'value-excellent' : score >= 70 ? 'value-good' : score >= 50 ? 'value-fair' : 'value-poor'\n  }\n}\n\nfunction getValueClass(value, baseline) {\n  const diff = Math.abs(value - baseline)\n  if (diff <= baseline * 0.1) return 'value-good'\n  if (diff <= baseline * 0.2) return 'value-fair'\n  return 'value-poor'\n}\n\nfunction getStatusValueClass(metric, value) {\n  if (metric === 'STRESS') {\n    // Inverted for stress - lower is better\n    if (value <= 30) return 'value-good'\n    if (value <= 60) return 'value-fair'\n    return 'value-poor'\n  } else {\n    // Normal for health/morale - higher is better\n    if (value >= 80) return 'value-good'\n    if (value >= 60) return 'value-fair'\n    return 'value-poor'\n  }\n}\n\nfunction getStreamStatus() {\n  if (props.crewMembers.length === 0) return 'STANDBY'\n  if (dataEntries.value.length === 0) return 'INITIALIZING'\n  return 'ACTIVE'\n}\n\nfunction getStreamStatusClass() {\n  const status = getStreamStatus()\n  if (status === 'ACTIVE') return 'status-active'\n  if (status === 'STANDBY') return 'status-standby'\n  return 'status-init'\n}\n\nfunction getDataRate() {\n  return (0.8 + Math.random() * 0.4).toFixed(1)\n}\n\nfunction addDataEntry() {\n  const entry = generateDataEntry()\n  dataEntries.value.push(entry)\n  \n  // Limit entries to prevent memory issues\n  if (dataEntries.value.length > props.maxEntries * 2) {\n    dataEntries.value = dataEntries.value.slice(-props.maxEntries)\n  }\n  \n  // Auto-scroll to bottom\n  setTimeout(() => {\n    if (streamContent.value) {\n      streamContent.value.scrollTop = streamContent.value.scrollHeight\n    }\n  }, 100)\n}\n\nonMounted(() => {\n  // Add initial entries\n  for (let i = 0; i < 5; i++) {\n    setTimeout(() => addDataEntry(), i * 200)\n  }\n  \n  // Start regular updates\n  intervalId = setInterval(addDataEntry, props.updateInterval)\n})\n\nonUnmounted(() => {\n  if (intervalId) {\n    clearInterval(intervalId)\n  }\n})\n</script>\n\n<style scoped>\n.data-stream-container {\n  background: #000000;\n  border: 2px solid #00ff00;\n  color: #00ff00;\n  font-family: 'MonaspiceAr Nerd Font', 'MonaspiceAr', monospace;\n  padding: 8px;\n  margin: 6px 0;\n  font-size: 9px;\n  max-height: 300px;\n  display: flex;\n  flex-direction: column;\n}\n\n.stream-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  border-bottom: 1px solid #004400;\n  padding-bottom: 4px;\n  margin-bottom: 6px;\n  flex-shrink: 0;\n}\n\n.stream-title {\n  font-size: 10px;\n  font-weight: bold;\n  color: #00ff00;\n}\n\n.stream-id {\n  font-size: 8px;\n  color: #666666;\n  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;\n}\n\n.stream-rate {\n  font-size: 8px;\n  color: #888888;\n}\n\n.stream-content {\n  flex-grow: 1;\n  overflow-y: auto;\n  scrollbar-width: thin;\n  scrollbar-color: #00ff00 #000000;\n}\n\n.stream-content::-webkit-scrollbar {\n  width: 4px;\n}\n\n.stream-content::-webkit-scrollbar-track {\n  background: #000000;\n}\n\n.stream-content::-webkit-scrollbar-thumb {\n  background: #00ff00;\n}\n\n.stream-entry {\n  display: grid;\n  grid-template-columns: 60px 40px 1fr 60px;\n  gap: 6px;\n  align-items: center;\n  padding: 1px 0;\n  animation: entry-appear 0.5s ease-out;\n  border-bottom: 1px dotted #002200;\n  font-size: 8px;\n}\n\n@keyframes entry-appear {\n  from {\n    opacity: 0;\n    transform: translateX(-10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateX(0);\n  }\n}\n\n.entry-timestamp {\n  color: #444444;\n  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;\n}\n\n.entry-source {\n  color: #888888;\n  font-weight: bold;\n  font-size: 7px;\n}\n\n.entry-message {\n  color: #cccccc;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.entry-value {\n  font-weight: bold;\n  text-align: right;\n  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', monospace;\n}\n\n/* Entry type styling */\n.biometric {\n  border-left: 2px solid #ff6b6b;\n  padding-left: 4px;\n}\n\n.performance {\n  border-left: 2px solid #4ecdc4;\n  padding-left: 4px;\n}\n\n.system {\n  border-left: 2px solid #95a5a6;\n  padding-left: 4px;\n}\n\n.status {\n  border-left: 2px solid #f39c12;\n  padding-left: 4px;\n}\n\n.compliance {\n  border-left: 2px solid #9b59b6;\n  padding-left: 4px;\n}\n\n/* Value classes */\n.value-excellent { color: #00ffff; }\n.value-good { color: #00ff00; }\n.value-fair { color: #ffff00; }\n.value-poor { color: #ff4444; }\n.value-neutral { color: #aaaaaa; }\n\n.stream-footer {\n  border-top: 1px solid #004400;\n  padding-top: 4px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 7px;\n  flex-shrink: 0;\n}\n\n.stream-status {\n  font-weight: bold;\n}\n\n.status-active {\n  color: #00ff00;\n  animation: pulse 1.5s ease-in-out infinite;\n}\n\n.status-standby {\n  color: #ffaa00;\n}\n\n.status-init {\n  color: #666666;\n}\n\n.data-rate {\n  color: #444444;\n}\n\n@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.6; }\n}\n</style>