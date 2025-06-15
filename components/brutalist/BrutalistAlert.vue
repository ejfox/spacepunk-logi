<template>
  <transition name="alert-fade">
    <div
      v-if="visible"
      class="brutalist-alert"
      :class="`alert-${type}`"
    >
      <div class="alert-header">
        <span class="alert-type">[{{ type.toUpperCase() }}]</span>
        <span class="alert-timestamp">{{ timestamp }}</span>
        <button
          v-if="dismissible"
          class="alert-close"
          @click="$emit('dismiss')"
        >
          [X]
        </button>
      </div>
      <div class="alert-content">
        <slot>{{ message }}</slot>
      </div>
      <div v-if="actions && actions.length" class="alert-actions">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="alert-action"
          @click="handleAction(action)"
        >
          [{{ action.label.toUpperCase() }}]
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error', 'system'].includes(value)
  },
  message: String,
  dismissible: {
    type: Boolean,
    default: true
  },
  autoDismiss: {
    type: Number,
    default: 0 // milliseconds, 0 = no auto-dismiss
  },
  actions: {
    type: Array,
    default: () => []
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dismiss', 'action'])

const timestamp = computed(() => {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
})

let dismissTimer = null

const handleAction = (action) => {
  emit('action', action)
  if (action.dismiss !== false) {
    emit('dismiss')
  }
}

onMounted(() => {
  if (props.autoDismiss > 0) {
    dismissTimer = setTimeout(() => {
      emit('dismiss')
    }, props.autoDismiss)
  }
})

onUnmounted(() => {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
  }
})
</script>

<style scoped>
.brutalist-alert {
  border: 2px solid;
  background: #000000;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin: 4px 0;
  position: relative;
}

.alert-info {
  border-color: #00ffff;
  color: #00ffff;
}

.alert-success {
  border-color: #00ff00;
  color: #00ff00;
}

.alert-warning {
  border-color: #ffff00;
  color: #ffff00;
}

.alert-error {
  border-color: #ff0000;
  color: #ff0000;
  animation: error-blink 0.5s ease 2;
}

.alert-system {
  border-color: #ff00ff;
  color: #ff00ff;
  border-style: dashed;
}

.alert-header {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid currentColor;
  gap: 8px;
}

.alert-type {
  font-weight: bold;
}

.alert-timestamp {
  flex: 1;
  opacity: 0.7;
  font-size: 11px;
}

.alert-close {
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  font-family: inherit;
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
  background: currentColor;
  color: #000000;
}

.alert-content {
  padding: 8px;
  line-height: 1.4;
}

.alert-actions {
  padding: 4px 8px 8px;
  display: flex;
  gap: 8px;
}

.alert-action {
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  font-family: inherit;
  font-size: 11px;
  padding: 2px 8px;
  cursor: pointer;
  text-transform: uppercase;
}

.alert-action:hover {
  background: currentColor;
  color: #000000;
}

@keyframes error-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>