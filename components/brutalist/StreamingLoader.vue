<template>
  <div class="streaming-loader">
    <!-- Header -->
    <div class="loader-header">
      <span class="header-marker">></span>
      <span class="header-text">{{ title || 'PROCESSING LLM REQUEST...' }}</span>
      <span class="header-status" :class="statusClass">{{ status }}</span>
    </div>
    
    <!-- Queue Status Panel -->
    <div v-if="showQueueStatus" class="queue-panel">
      <div class="queue-row">
        <div class="queue-item">
          <span class="label">QUEUE POS:</span>
          <span class="value">{{ queuePosition || 'PROCESSING' }}</span>
        </div>
        <div class="queue-item">
          <span class="label">QUEUE SIZE:</span>
          <span class="value">{{ queueLength || 0 }}</span>
        </div>
        <div class="queue-item">
          <span class="label">PRIORITY:</span>
          <span class="value" :class="priorityClass">{{ priority || 'NORMAL' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        <div class="progress-text">{{ progressPercentage }}%</div>
      </div>
      
      <!-- Stats Row -->
      <div class="stats-row">
        <span class="stat">{{ tokensReceived || 0 }}/{{ maxTokens || '∞' }} tokens</span>
        <span class="stat">{{ tokensPerSecond || 0 }} tok/s</span>
        <span class="stat">{{ elapsedTime }}s elapsed</span>
      </div>
    </div>
    
    <!-- Streaming Content Preview -->
    <div v-if="streamingContent" class="content-preview">
      <div class="preview-header">
        <span class="preview-label">LIVE STREAM:</span>
        <span class="preview-indicator"></span>
      </div>
      <div class="preview-content" ref="contentRef">
        {{ streamingContent }}
        <span class="cursor" v-if="isStreaming">█</span>
      </div>
    </div>
    
    <!-- Status Messages -->
    <div class="status-messages">
      <div v-for="(message, index) in statusMessages" :key="index" class="status-message">
        <span class="message-time">{{ message.time }}</span>
        <span class="message-text">{{ message.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: String,
  maxTokens: {
    type: Number,
    default: 1000
  },
  queuePosition: Number,
  queueLength: Number,
  priority: {
    type: String,
    default: 'normal'
  },
  tokensReceived: {
    type: Number,
    default: 0
  },
  streamingContent: String,
  isStreaming: {
    type: Boolean,
    default: false
  },
  startTime: Number
})

// Local state
const elapsedTime = ref(0)
const tokensPerSecond = ref(0)
const statusMessages = ref([])
const contentRef = ref(null)

// Computed
const progressPercentage = computed(() => {
  // If we have actual token progress, use it
  if (props.tokensReceived > 0 && props.maxTokens > 0) {
    return Math.min(100, Math.round((props.tokensReceived / props.maxTokens) * 100))
  }
  
  // If we're streaming but no tokens yet, show a minimum progress
  if (props.isStreaming) {
    return Math.min(15, 5 + Math.floor(elapsedTime.value / 2)) // Slowly increment while waiting
  }
  
  // If we're queued, show queue-based progress
  if (props.queuePosition && props.queueLength) {
    const queueProgress = Math.max(5, 100 - ((props.queuePosition / Math.max(props.queueLength, 1)) * 80))
    return Math.round(queueProgress)
  }
  
  // Show at least 3% so user knows something is happening
  return Math.min(10, 3 + Math.floor(elapsedTime.value / 3))
})

const status = computed(() => {
  if (props.queuePosition && props.queuePosition > 0) {
    return `QUEUED #${props.queuePosition}`
  }
  if (props.isStreaming && props.tokensReceived > 0) {
    return 'STREAMING'
  }
  if (props.isStreaming && props.tokensReceived === 0) {
    return 'STARTING...'
  }
  if (elapsedTime.value > 15 && !props.isStreaming) {
    return 'DEEP THOUGHT...'
  }
  if (elapsedTime.value > 5 && !props.isStreaming) {
    return 'ANALYZING...'
  }
  return 'PROCESSING'
})

const statusClass = computed(() => {
  if (status.value === 'STREAMING') return 'status-streaming'
  if (status.value.includes('QUEUED')) return 'status-queued'
  return 'status-processing'
})

const priorityClass = computed(() => {
  if (props.priority === 'high') return 'priority-high'
  if (props.priority === 'low') return 'priority-low'
  return 'priority-normal'
})

const showQueueStatus = computed(() => {
  return props.queuePosition !== undefined || props.queueLength !== undefined
})

// Update elapsed time
let timeInterval
onMounted(() => {
  // Always start timing even if startTime isn't provided
  const startTime = props.startTime || Date.now()
  
  timeInterval = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime) / 1000)
  }, 100)
  
  // Add initial status message
  addStatusMessage('LLM request initiated')
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

// Calculate tokens per second
watch(() => props.tokensReceived, (newVal, oldVal) => {
  if (elapsedTime.value > 0) {
    tokensPerSecond.value = Math.round((newVal / elapsedTime.value) * 10) / 10
  }
})

// Auto-scroll content preview
watch(() => props.streamingContent, () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight
  }
})

// Add status messages
watch(() => props.queuePosition, (newPos, oldPos) => {
  if (oldPos !== undefined && newPos !== oldPos) {
    addStatusMessage(`Queue position updated: #${oldPos} → #${newPos}`)
  }
})

watch(() => props.isStreaming, (isStreaming) => {
  if (isStreaming) {
    addStatusMessage('Streaming started')
  }
})

// Add helpful messages at time intervals
watch(elapsedTime, (time) => {
  if (time === 5 && !props.isStreaming) {
    addStatusMessage('LLM thinking deeply...')
  } else if (time === 15 && !props.isStreaming) {
    addStatusMessage('Complex narrative generation in progress...')
  } else if (time === 30 && !props.isStreaming) {
    addStatusMessage('AI considering all possibilities...')
  } else if (time === 45 && !props.isStreaming) {
    addStatusMessage('Almost there! Finalizing response...')
  }
})

// Watch for first tokens
watch(() => props.tokensReceived, (tokens, oldTokens) => {
  if (tokens > 0 && oldTokens === 0) {
    addStatusMessage('First tokens received! Content incoming...')
  }
})

function addStatusMessage(text) {
  const time = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
  
  statusMessages.value.push({ time, text })
  
  // Keep only last 5 messages
  if (statusMessages.value.length > 5) {
    statusMessages.value.shift()
  }
}
</script>

<style scoped>
.streaming-loader {
  background: #000000;
  border: 2px solid #ffffff;
  padding: 16px;
  font-family: 'Courier New', monospace;
  color: #ffffff;
}

/* Header */
.loader-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333333;
}

.header-marker {
  color: #00ff00;
  font-weight: bold;
}

.header-text {
  flex: 1;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.header-status {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid;
  font-weight: bold;
}

.status-streaming {
  color: #00ff00;
  border-color: #00ff00;
  animation: pulse 1s infinite;
}

.status-queued {
  color: #ffaa00;
  border-color: #ffaa00;
}

.status-processing {
  color: #00aaff;
  border-color: #00aaff;
}

/* Queue Panel */
.queue-panel {
  background: #050505;
  border: 1px solid #333333;
  padding: 8px;
  margin-bottom: 16px;
}

.queue-row {
  display: flex;
  gap: 24px;
}

.queue-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.label {
  font-size: 9px;
  color: #666666;
  font-weight: bold;
}

.value {
  font-size: 11px;
  color: #ffffff;
  font-weight: bold;
  font-family: monospace;
}

.priority-high {
  color: #ff0000 !important;
}

.priority-normal {
  color: #00ff00 !important;
}

.priority-low {
  color: #666666 !important;
}

/* Progress Section */
.progress-section {
  margin-bottom: 16px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #111111;
  border: 1px solid #ffffff;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #00ff00;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #000000;
  mix-blend-mode: difference;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: #666666;
}

.stat {
  font-family: monospace;
}

/* Content Preview */
.content-preview {
  background: #020202;
  border: 1px solid #333333;
  padding: 12px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-label {
  font-size: 10px;
  color: #666666;
  font-weight: bold;
}

.preview-indicator {
  width: 6px;
  height: 6px;
  background: #00ff00;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.preview-content {
  font-size: 11px;
  line-height: 1.4;
  color: #aaaaaa;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.cursor {
  color: #00ff00;
  animation: blink 1s infinite;
}

/* Status Messages */
.status-messages {
  font-size: 9px;
  color: #666666;
  max-height: 80px;
  overflow-y: auto;
}

.status-message {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}

.message-time {
  color: #444444;
  font-family: monospace;
}

.message-text {
  color: #888888;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Custom scrollbar */
.content-preview::-webkit-scrollbar,
.status-messages::-webkit-scrollbar {
  width: 6px;
}

.content-preview::-webkit-scrollbar-track,
.status-messages::-webkit-scrollbar-track {
  background: #111111;
}

.content-preview::-webkit-scrollbar-thumb,
.status-messages::-webkit-scrollbar-thumb {
  background: #333333;
}

.content-preview::-webkit-scrollbar-thumb:hover,
.status-messages::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
</style>