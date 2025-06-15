<template>
  <button class="hold-to-confirm" :class="{
    'hold-active': isHolding,
    'hold-complete': isComplete,
    'hold-disabled': disabled
  }" :disabled="disabled" @mousedown="startHold" @mouseup="endHold" @mouseleave="endHold" @touchstart="startHold"
    @touchend="endHold">
    <div class="hold-content">
      <span v-if="!isHolding && !isComplete" class="hold-label">
        {{ label }}
      </span>
      <span v-else-if="isHolding && !isComplete" class="hold-progress-label">
        {{ Math.ceil(remainingTime) }}s
      </span>
      <span v-else-if="isComplete" class="hold-complete-label">
        {{ confirmLabel }}
      </span>
    </div>

    <div v-if="isHolding" class="hold-progress-bar">
      <div class="hold-progress-fill" :style="{ width: `${progress}%` }"></div>
    </div>

    <div v-if="isHolding" class="hold-timer-display">
      {{ progressBar }}
    </div>
  </button>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  confirmLabel: {
    type: String,
    default: 'CONFIRMED'
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds in milliseconds
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'start', 'cancel'])

const isHolding = ref(false)
const isComplete = ref(false)
const progress = ref(0)
const remainingTime = ref(props.duration / 1000)

let holdInterval = null
let holdTimeout = null

const progressBar = computed(() => {
  const filled = Math.floor((progress.value / 100) * 20)
  const empty = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
})

const startHold = () => {
  if (props.disabled || isComplete.value) return

  isHolding.value = true
  progress.value = 0
  remainingTime.value = props.duration / 1000

  emit('start')

  const startTime = Date.now()

  holdInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min((elapsed / props.duration) * 100, 100)
    remainingTime.value = Math.max((props.duration - elapsed) / 1000, 0)

    if (progress.value >= 100) {
      completeHold()
    }
  }, 50) // Update every 50ms for smooth animation

  holdTimeout = setTimeout(() => {
    completeHold()
  }, props.duration)
}

const endHold = () => {
  if (!isHolding.value || isComplete.value) return

  clearInterval(holdInterval)
  clearTimeout(holdTimeout)

  isHolding.value = false
  progress.value = 0
  remainingTime.value = props.duration / 1000

  emit('cancel')
}

const completeHold = () => {
  clearInterval(holdInterval)
  clearTimeout(holdTimeout)

  isHolding.value = false
  isComplete.value = true
  progress.value = 100

  emit('confirm')

  // Reset after a brief moment
  setTimeout(() => {
    isComplete.value = false
    progress.value = 0
    remainingTime.value = props.duration / 1000
  }, 1500)
}

onUnmounted(() => {
  clearInterval(holdInterval)
  clearTimeout(holdTimeout)
})
</script>

<style scoped>
.hold-to-confirm {
  position: relative;
  background: #000000;
  color: #ffffff;
  border: 2px solid #ffffff;
  font-family: var(--font-ui);
  font-size: 14px;
  padding: 8px 16px;
  cursor: pointer;
  text-transform: uppercase;
  user-select: none;
  overflow: hidden;
  transition: all 0.2s ease;
  min-width: 180px;
  min-height: 40px;
}

.hold-to-confirm:hover:not(.hold-disabled) {
  border-color: #cccccc;
  background: #111111;
}

.hold-active {
  border-color: #ffaa00 !important;
  background: #1a1000 !important;
  animation: pulse-hold 0.5s ease-in-out infinite alternate;
}

.hold-complete {
  border-color: #00ff00 !important;
  background: #001100 !important;
  color: #00ff00;
}

.hold-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: #666666;
}

.hold-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.hold-progress-label {
  font-family: var(--font-mono);
  color: #ffaa00;
  font-weight: bold;
}

.hold-complete-label {
  color: #00ff00;
  font-weight: bold;
  font-family: var(--font-special);
}

.hold-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #333333;
  z-index: 1;
}

.hold-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffaa00, #ff6600);
  transition: width 0.05s linear;
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.5);
}

.hold-timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.7;
  color: #ffaa00;
  z-index: 3;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
  letter-spacing: -0.5px;
}

@keyframes pulse-hold {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 170, 0, 0.4);
  }

  100% {
    box-shadow: 0 0 0 4px rgba(255, 170, 0, 0.1);
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .hold-to-confirm {
    touch-action: none;
  }
}
</style>
