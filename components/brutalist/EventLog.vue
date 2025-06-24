<template>
  <div class="event-log">
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
  border: 1px solid #00ff00;
  background: #001100;
  font-family: 'Courier New', monospace;
  color: #00ff00;
}

.log-header {
  border-bottom: 1px solid #00ff00;
  padding: 4px 8px;
  background: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-title {
  font-weight: bold;
  font-size: 12px;
}

.log-count {
  font-size: 10px;
  opacity: 0.7;
}

.log-content {
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #001100;
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
  padding: 16px;
}

.log-entry {
  margin: 1px 0;
  font-size: 10px;
  line-height: 1.3;
  opacity: 0.9;
}

.log-entry.recent {
  opacity: 1;
  color: #ffffff;
}

.log-entry.warning {
  color: #ffff00;
}

.log-entry.danger {
  color: #ff0000;
}

.log-entry.success {
  color: #00ff00;
}

.log-entry.info {
  color: #00ffff;
}

.log-timestamp {
  color: #666666;
  margin-right: 8px;
  font-size: 9px;
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