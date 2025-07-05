<template>
  <div ref="eventLogRef" class="event-log">
    <div class="log-header">
      <span class="log-title">{{ title }}</span>
      <span v-if="showCount" class="log-count">[{{ events.length }}]</span>
    </div>
    <div class="log-content" ref="logContent">
      <div v-if="events.length === 0" class="log-empty">
        {{ emptyMessage }}
      </div>
      <div
        v-for="event in displayEvents"
        :key="event.id"
        class="log-entry"
        :class="[event.type || 'default', { recent: event.recent }]"
      >
        <span v-if="showTimestamp" class="log-timestamp">{{ formatTime(event.timestamp) }}</span>
        <span class="log-message">{{ event.message }}</span>
      </div>
    </div>
    <div v-if="canClear" class="log-footer">
      <button @click="$emit('clear')" class="clear-button">[CLEAR LOG]</button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, watch, ref } from 'vue'
import { useElementVisibility, useIntervalFn } from '@vueuse/core'

const emit = defineEmits(['clear'])

const props = defineProps({
  title: {
    type: String,
    default: 'EVENT LOG'
  },
  events: {
    type: Array,
    required: true
  },
  maxEvents: {
    type: Number,
    default: 50
  },
  showTimestamp: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  canClear: {
    type: Boolean,
    default: true
  },
  emptyMessage: {
    type: String,
    default: 'NO EVENTS RECORDED'
  },
  autoScroll: {
    type: Boolean,
    default: true
  }
})

const logContent = ref(null)
const eventLogRef = ref(null)

// Visibility optimization
const isVisible = useElementVisibility(eventLogRef)

// Auto-scroll animation only when visible
const { pause: pauseScrollAnimation, resume: resumeScrollAnimation } = useIntervalFn(() => {
  // Smooth scroll behavior when new events come in
  if (logContent.value && isVisible.value) {
    const shouldScroll = logContent.value.scrollTop >= logContent.value.scrollHeight - logContent.value.clientHeight - 100
    if (shouldScroll) {
      logContent.value.scrollTop = logContent.value.scrollHeight
    }
  }
}, 100)

// Pause animations when not visible
watch(isVisible, (visible) => {
  if (visible) {
    resumeScrollAnimation()
  } else {
    pauseScrollAnimation()
  }
})

const displayEvents = computed(() => {
  return props.events.slice(-props.maxEvents)
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

// Auto-scroll to bottom when new events are added
watch(() => props.events.length, async () => {
  if (props.autoScroll) {
    await nextTick()
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight
    }
  }
})
</script>

<style scoped>
.event-log {
  border: 2px solid #00ff00;
  background: #001100;
  font-family: 'MonaspiceAr Nerd Font', 'MonaspiceAr', 'Courier New', monospace;
  color: #00ff00;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.log-header {
  border-bottom: 2px solid #00ff00;
  padding: 12px 16px;
  background: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-title {
  font-weight: bold;
  font-size: 18px;
  letter-spacing: 1px;
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', 'Courier New', monospace; /* Neon for headers */
}

.log-count {
  font-size: 14px;
  opacity: 0.8;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', 'Courier New', monospace; /* Xenon for metadata */
}

.log-content {
  padding: 16px;
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #001100;
  line-height: 1.6;
}

.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #001100;
}

.log-content::-webkit-scrollbar-thumb {
  background: #00ff00;
  border-radius: 0;
}

.log-empty {
  color: #666666;
  font-style: italic;
  text-align: center;
  padding: 24px;
  font-size: 16px;
}

.log-entry {
  margin: 6px 0;
  font-size: 16px;
  line-height: 1.5;
  opacity: 0.9;
  padding: 4px 0;
  border-left: 3px solid transparent;
  padding-left: 8px;
  font-family: 'MonaspiceAr Nerd Font', 'MonaspiceAr', 'Courier New', monospace; /* Argon for regular text */
}

.log-entry.recent {
  opacity: 1;
  color: #ffffff;
  border-left-color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', 'Courier New', monospace; /* Neon for emphasis */
}

.log-entry.warning {
  color: #ffff00;
  border-left-color: #ffff00;
  font-family: 'MonaspiceRn Nerd Font', 'MonaspiceRn', 'Courier New', monospace; /* Radon for warnings */
}

.log-entry.danger {
  color: #ff0000;
  border-left-color: #ff0000;
  font-family: 'MonaspiceRn Nerd Font', 'MonaspiceRn', 'Courier New', monospace; /* Radon for alerts */
  font-weight: bold;
}

.log-entry.success {
  color: #00ff00;
  border-left-color: #00ff00;
  font-family: 'MonaspiceKr Nerd Font', 'MonaspiceKr', 'Courier New', monospace; /* Krypton for success */
}

.log-entry.info {
  color: #00ffff;
  border-left-color: #00ffff;
  font-family: 'MonaspiceKr Nerd Font', 'MonaspiceKr', 'Courier New', monospace; /* Krypton for narrative */
  font-style: italic;
}

.log-entry.cascade {
  color: #ff6600;
  border-left-color: #ff6600;
  font-weight: bold;
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', 'Courier New', monospace; /* Neon for system events */
  text-transform: uppercase;
  letter-spacing: 1px;
}

.log-timestamp {
  color: #888888;
  margin-right: 12px;
  font-size: 12px;
  font-weight: normal;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', 'Courier New', monospace; /* Xenon for timestamps */
  opacity: 0.7;
}

.log-message {
  /* Message styling handled by entry class */
}

.log-footer {
  border-top: 1px dotted #003300;
  padding: 4px 8px;
  text-align: center;
}

.clear-button {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
}

.clear-button:hover {
  background: #003300;
}
</style>