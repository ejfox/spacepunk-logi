<template>
  <div class="brutalist-progress-wrapper">
    <div v-if="label" class="progress-label">
      <span class="label-text">{{ label.toUpperCase() }}</span>
      <span class="progress-value">{{ displayValue }}</span>
    </div>
    <div class="progress-container">
      <div class="progress-track">
        <div class="progress-fill" :class="{
          'fill-danger': variant === 'danger',
          'fill-warning': variant === 'warning',
          'fill-success': variant === 'success'
        }" :style="{ width: fillWidth }">
          <span v-if="showBar" class="progress-bar">{{ progressBar }}</span>
        </div>
      </div>
    </div>
    <div v-if="status" class="progress-status">
      STATUS: {{ status }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  label: String,
  status: String,
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'success', 'warning', 'danger'].includes(value)
  },
  showPercentage: {
    type: Boolean,
    default: true
  },
  showBar: {
    type: Boolean,
    default: true
  }
})

const fillWidth = computed(() => `${Math.min(100, Math.max(0, props.value))}%`)

const displayValue = computed(() => {
  if (!props.showPercentage) return ''
  return `[${Math.round(props.value)}%]`
})

const progressBar = computed(() => {
  const filled = Math.floor(props.value / 5)
  const empty = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
})
</script>

<style scoped>
.brutalist-progress-wrapper {
  margin: 4px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-bottom: 2px;
}

.label-text {
  flex: 1;
}

.progress-value {
  margin-left: 8px;
  opacity: 0.7;
}

.progress-container {
  border: 1px solid #ffffff;
  background: #000000;
  height: 16px;
  position: relative;
  overflow: hidden;
}

.progress-track {
  height: 100%;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #ffffff;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.fill-danger {
  background: #ff0000;
}

.fill-warning {
  background: #ffaa00;
}

.fill-success {
  background: #00ff00;
}

.progress-bar {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  color: #000000;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: -1px;
  white-space: nowrap;
}

.progress-status {
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.7;
}

/* Animation for active progress */
@keyframes progress-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.progress-fill {
  animation: progress-pulse 2s ease-in-out infinite;
}
</style>