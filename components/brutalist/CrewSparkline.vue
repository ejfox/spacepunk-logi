<template>
  <div class="sparkline-container">
    <div class="sparkline-header">
      <span class="metric-name">{{ metric.toUpperCase() }}</span>
      <span class="current-value">{{ currentValue }}</span>
    </div>
    <div class="sparkline-graph">
      <span 
        v-for="(point, index) in sparklineData" 
        :key="index"
        class="spark-point"
        :class="getPointClass(point, index)"
        :title="`Tick ${index}: ${point}`"
      >{{ getSparkChar(point) }}</span>
    </div>
    <div class="sparkline-trend">
      <span class="trend-indicator" :class="getTrendClass()">
        {{ getTrendText() }}
      </span>
      <span class="data-source">{{ getDataSource() }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  metric: {
    type: String,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    default: 100
  }
})

// Generate sparkline data with some realistic variation
const sparklineData = computed(() => {
  if (props.data.length > 0) return props.data
  
  // Generate procedural data based on current value
  const points = []
  let value = Math.max(10, props.currentValue - Math.random() * 20)
  
  for (let i = 0; i < 20; i++) {
    // Add some realistic drift
    value += (Math.random() - 0.5) * 8
    value = Math.max(0, Math.min(props.maxValue, value))
    points.push(Math.round(value))
  }
  
  // Ensure last point matches current value
  points[points.length - 1] = props.currentValue
  return points
})

const getSparkChar = (value) => {
  const normalized = value / props.maxValue
  if (normalized >= 0.9) return '█'
  if (normalized >= 0.7) return '▇'
  if (normalized >= 0.5) return '▆'
  if (normalized >= 0.3) return '▄'
  if (normalized >= 0.1) return '▂'
  return '▁'
}

const getPointClass = (value, index) => {
  const isLast = index === sparklineData.value.length - 1
  const normalized = value / props.maxValue
  
  let classes = []
  
  if (isLast) classes.push('current-point')
  
  if (normalized >= 0.8) classes.push('high-value')
  else if (normalized >= 0.5) classes.push('medium-value')
  else if (normalized >= 0.2) classes.push('low-value')
  else classes.push('critical-value')
  
  return classes
}

const getTrendClass = () => {
  const recent = sparklineData.value.slice(-5)
  const trend = recent[recent.length - 1] - recent[0]
  
  if (trend > 5) return 'trend-up'
  if (trend < -5) return 'trend-down'
  return 'trend-stable'
}

const getTrendText = () => {
  const recent = sparklineData.value.slice(-5)
  const trend = recent[recent.length - 1] - recent[0]
  const variance = Math.max(...recent) - Math.min(...recent)
  
  if (Math.abs(trend) <= 2 && variance <= 5) return 'STABLE'
  if (trend > 5) return `↗ +${trend}`
  if (trend < -5) return `↘ ${trend}`
  if (variance > 15) return 'VOLATILE'
  return 'MINOR FLUX'
}

const getDataSource = () => {
  const sources = [
    'BIOMETRIC', 'NEURAL-LINK', 'BEHAVIORAL', 'PERFORMANCE', 
    'PRODUCTIVITY', 'COMPLIANCE', 'EFFICIENCY', 'PSYCHOLOGICAL'
  ]
  // Deterministic source based on metric name
  const index = props.metric.charCodeAt(0) % sources.length
  return sources[index]
}
</script>

<style scoped>
.sparkline-container {
  background: #000000;
  border: 1px solid #333333;
  padding: 6px 8px;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
  margin-bottom: 4px;
}

.sparkline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.metric-name {
  font-size: 9px;
  color: #888888;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.current-value {
  font-size: 11px;
  color: #ffffff;
  font-weight: bold;
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', monospace;
}

.sparkline-graph {
  font-family: monospace;
  font-size: 8px;
  line-height: 1;
  letter-spacing: 0;
  margin: 2px 0;
  height: 10px;
  overflow: hidden;
}

.spark-point {
  transition: color 0.2s ease;
}

.current-point {
  animation: pulse 1.5s ease-in-out infinite;
}

.high-value { color: #00ff00; }
.medium-value { color: #88ff88; }
.low-value { color: #ffaa00; }
.critical-value { color: #ff0000; }

.sparkline-trend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
}

.trend-indicator {
  font-size: 8px;
  font-weight: bold;
  padding: 1px 3px;
  border: 1px solid;
}

.trend-up {
  color: #00ff00;
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.trend-down {
  color: #ff4444;
  border-color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.trend-stable {
  color: #aaaaaa;
  border-color: #aaaaaa;
  background: rgba(170, 170, 170, 0.1);
}

.data-source {
  font-size: 7px;
  color: #555555;
  font-style: italic;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>