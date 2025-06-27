<template>
  <Transition name="impact-toast" appear>
    <div v-if="visible" class="impact-toast" :class="[`toast-${variant}`, positionClass]">
      <div class="toast-header">
        <span class="header-marker">></span>
        <span class="toast-title">{{ title || 'IMPACT DETECTED' }}</span>
      </div>
      
      <div class="toast-impacts">
        <div 
          v-for="impact in impacts" 
          :key="impact.type"
          class="impact-item"
          :class="getImpactClass(impact)"
        >
          <span class="impact-label">{{ impact.type.toUpperCase() }}</span>
          <span class="impact-value">
            <span v-if="impact.predicted" class="predicted-value">{{ formatValue(impact.predicted) }}</span>
            <span class="arrow">→</span>
            <span class="actual-value">{{ formatValue(impact.actual) }}</span>
          </span>
          <span v-if="impact.variance" class="variance" :class="getVarianceClass(impact.variance)">
            {{ formatVariance(impact.variance) }}
          </span>
        </div>
      </div>
      
      <div v-if="description" class="toast-description">
        {{ description }}
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  title: String,
  description: String,
  impacts: {
    type: Array,
    default: () => []
    // Expected format: [{ type: 'credits', predicted: 200, actual: 245, variance: 45 }]
  },
  variant: {
    type: String,
    default: 'default', // 'success', 'warning', 'danger', 'default'
    validator: value => ['success', 'warning', 'danger', 'default'].includes(value)
  },
  position: {
    type: String,
    default: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'
    validator: value => ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'].includes(value)
  },
  autoHide: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['close'])

const positionClass = computed(() => `toast-${props.position}`)

function formatValue(value) {
  if (typeof value === 'string') return value
  return value > 0 ? `+${value}` : `${value}`
}

function formatVariance(variance) {
  if (Math.abs(variance) <= 5) return 'ON TARGET'
  return variance > 0 ? `+${variance} OVER` : `${Math.abs(variance)} UNDER`
}

function getImpactClass(impact) {
  const classes = []
  
  // Type-specific styling
  if (impact.type === 'heat') {
    classes.push(impact.actual > 0 ? 'impact-heat-bad' : 'impact-heat-good')
  } else {
    classes.push(impact.actual > 0 ? 'impact-positive' : 'impact-negative')
  }
  
  // Variance styling
  if (impact.variance) {
    if (Math.abs(impact.variance) <= 5) classes.push('variance-accurate')
    else if (Math.abs(impact.variance) > 20) classes.push('variance-wild')
  }
  
  return classes.join(' ')
}

function getVarianceClass(variance) {
  if (Math.abs(variance) <= 5) return 'variance-accurate'
  if (Math.abs(variance) <= 15) return 'variance-moderate'
  return 'variance-wild'
}

onMounted(() => {
  if (props.autoHide && props.duration > 0) {
    setTimeout(() => {
      emit('close')
    }, props.duration)
  }
})
</script>

<style scoped>
.impact-toast {
  position: fixed;
  z-index: 1000;
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  min-width: 300px;
  max-width: 400px;
  padding: 8px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

/* Position variants */
.toast-top-right {
  top: 20px;
  right: 20px;
}

.toast-top-left {
  top: 20px;
  left: 20px;
}

.toast-bottom-right {
  bottom: 20px;
  right: 20px;
}

.toast-bottom-left {
  bottom: 20px;
  left: 20px;
}

.toast-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Toast variants */
.toast-success {
  border-color: #00ff00;
}

.toast-warning {
  border-color: #ffff00;
}

.toast-danger {
  border-color: #ff0000;
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: bold;
}

.header-marker {
  color: #00ff00;
}

.toast-impacts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.impact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.impact-label {
  min-width: 60px;
  font-weight: bold;
}

.impact-value {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-grow: 1;
}

.predicted-value {
  color: #888888;
  text-decoration: line-through;
}

.arrow {
  color: #00ff00;
  font-weight: bold;
}

.actual-value {
  font-weight: bold;
}

.variance {
  font-size: 10px;
  padding: 1px 4px;
  border: 1px solid;
  min-width: 80px;
  text-align: center;
}

.variance-accurate {
  color: #00ff00;
  border-color: #00ff00;
}

.variance-moderate {
  color: #ffff00;
  border-color: #ffff00;
}

.variance-wild {
  color: #ff0000;
  border-color: #ff0000;
}

/* Impact type styling */
.impact-positive .actual-value {
  color: #00ff00;
}

.impact-negative .actual-value {
  color: #ff0000;
}

.impact-heat-bad .actual-value {
  color: #ff0000;
}

.impact-heat-good .actual-value {
  color: #00ff00;
}

.toast-description {
  font-size: 11px;
  color: #cccccc;
  font-style: italic;
  border-top: 1px solid #444444;
  padding-top: 4px;
}

/* Animation */
.impact-toast-enter-active {
  transition: all 0.3s ease-out;
}

.impact-toast-leave-active {
  transition: all 0.2s ease-in;
}

.impact-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.impact-toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .impact-toast {
    min-width: 280px;
    max-width: calc(100vw - 40px);
    left: 20px !important;
    right: 20px !important;
    transform: none !important;
  }
  
  .toast-center {
    top: 50%;
    left: 20px;
    right: 20px;
    transform: translateY(-50%);
  }
}
</style>