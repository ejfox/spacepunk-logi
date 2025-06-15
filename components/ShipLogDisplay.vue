<template>
  <div class="ship-log-display">
    <div class="log-header">
      <h2>SHIP'S LOG</h2>
      <div class="log-controls">
        <button 
          class="log-btn" 
          @click="refreshLogs"
          :disabled="isLoading"
        >
          {{ isLoading ? 'REFRESHING...' : 'REFRESH' }}
        </button>
        <button 
          class="log-btn" 
          @click="markAllRead"
          v-if="unreadCount > 0"
        >
          MARK ALL READ ({{ unreadCount }})
        </button>
      </div>
    </div>

    <div class="log-status">
      <span class="status-item">
        <span class="label">ENTRIES:</span>
        <span class="value">{{ logEntries.length }}</span>
      </span>
      <span class="status-item">
        <span class="label">UNREAD:</span>
        <span class="value" :class="{ urgent: unreadCount > 0 }">{{ unreadCount }}</span>
      </span>
      <span class="status-item">
        <span class="label">LAST GENERATED:</span>
        <span class="value">{{ formatLastGenerated }}</span>
      </span>
    </div>

    <div class="log-entries" v-if="logEntries.length > 0">
      <div 
        v-for="entry in logEntries" 
        :key="entry.id"
        class="log-entry"
        :class="{ 
          unread: !entry.is_read,
          expanded: expandedEntries.has(entry.id)
        }"
        @click="toggleEntry(entry)"
      >
        <div class="entry-header">
          <div class="entry-info">
            <span class="entry-number">#{{ entry.entry_number.toString().padStart(3, '0') }}</span>
            <span class="entry-title">{{ entry.title }}</span>
            <span class="entry-badge" v-if="!entry.is_read">NEW</span>
          </div>
          <div class="entry-meta">
            <span class="tick-range">T{{ entry.tick_range_start }}-{{ entry.tick_range_end }}</span>
            <span class="event-count">{{ entry.events_processed }} events</span>
            <span class="timestamp">{{ formatTimestamp(entry.generated_at) }}</span>
          </div>
        </div>
        
        <div class="entry-content" v-if="expandedEntries.has(entry.id)">
          <div class="content-text">{{ entry.content }}</div>
          <div class="entry-footer">
            <button 
              class="action-btn"
              @click.stop="markAsRead(entry.id)"
              v-if="!entry.is_read"
            >
              MARK READ
            </button>
            <button 
              class="action-btn"
              @click.stop="archiveEntry(entry.id)"
            >
              ARCHIVE
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="log-empty" v-else>
      <p>No log entries available.</p>
      <p class="help-text">Log entries are generated automatically every 10 system ticks based on ship activities.</p>
    </div>

    <!-- Real-time log notification -->
    <div 
      v-if="newLogAlert"
      class="log-alert"
      @click="dismissAlert"
    >
      <span class="alert-icon">📝</span>
      <span class="alert-text">New log entry: {{ newLogAlert.title }}</span>
      <span class="alert-close">×</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  shipId: {
    type: String,
    required: true
  }
})

const logEntries = ref([])
const expandedEntries = ref(new Set())
const isLoading = ref(false)
const newLogAlert = ref(null)
const alertTimeout = ref(null)

const emit = defineEmits(['logEvent'])

const unreadCount = computed(() => {
  return logEntries.value.filter(entry => !entry.is_read).length
})

const formatLastGenerated = computed(() => {
  if (logEntries.value.length === 0) return '--'
  const latest = logEntries.value[0]
  const date = new Date(latest.generated_at)
  return date.toLocaleTimeString()
})

onMounted(() => {
  refreshLogs()
})

async function refreshLogs() {
  if (!props.shipId) return
  
  isLoading.value = true
  try {
    const response = await fetch(`http://localhost:3001/api/ship/${props.shipId}/logs`)
    if (response.ok) {
      const data = await response.json()
      logEntries.value = data
      emit('logEvent', { type: 'logs_refreshed', count: data.length })
    } else {
      console.error('Failed to fetch log entries')
    }
  } catch (error) {
    console.error('Error fetching logs:', error)
  } finally {
    isLoading.value = false
  }
}

function toggleEntry(entry) {
  if (expandedEntries.value.has(entry.id)) {
    expandedEntries.value.delete(entry.id)
  } else {
    expandedEntries.value.add(entry.id)
    // Auto-mark as read when expanded
    if (!entry.is_read) {
      markAsRead(entry.id)
    }
  }
}

async function markAsRead(entryId) {
  try {
    const response = await fetch(`http://localhost:3001/api/ship/logs/${entryId}/read`, {
      method: 'POST'
    })
    if (response.ok) {
      const entry = logEntries.value.find(e => e.id === entryId)
      if (entry) {
        entry.is_read = true
      }
    }
  } catch (error) {
    console.error('Error marking log as read:', error)
  }
}

async function markAllRead() {
  const unreadIds = logEntries.value
    .filter(entry => !entry.is_read)
    .map(entry => entry.id)
  
  if (unreadIds.length === 0) return
  
  try {
    const response = await fetch(`http://localhost:3001/api/ship/logs/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logEntryIds: unreadIds })
    })
    if (response.ok) {
      logEntries.value.forEach(entry => {
        if (unreadIds.includes(entry.id)) {
          entry.is_read = true
        }
      })
    }
  } catch (error) {
    console.error('Error marking logs as read:', error)
  }
}

async function archiveEntry(entryId) {
  try {
    const response = await fetch(`http://localhost:3001/api/ship/logs/${entryId}/archive`, {
      method: 'POST'
    })
    if (response.ok) {
      // Remove from display
      const index = logEntries.value.findIndex(e => e.id === entryId)
      if (index !== -1) {
        logEntries.value.splice(index, 1)
      }
      expandedEntries.value.delete(entryId)
    }
  } catch (error) {
    console.error('Error archiving log entry:', error)
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function showNewLogAlert(logData) {
  newLogAlert.value = logData
  
  // Auto-dismiss after 5 seconds
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
  alertTimeout.value = setTimeout(() => {
    newLogAlert.value = null
  }, 5000)
}

function dismissAlert() {
  newLogAlert.value = null
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
}

onUnmounted(() => {
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
})

// Expose methods for parent component
defineExpose({
  refreshLogs,
  showNewLogAlert
})
</script>

<style scoped>
.ship-log-display {
  background: #000;
  border: 1px solid #00ff00;
  padding: 12px;
  font-family: var(--font-code);
  position: relative;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #00ff00;
}

.log-header h2 {
  color: #00ff00;
  font-size: 14px;
  margin: 0;
}

.log-controls {
  display: flex;
  gap: 8px;
}

.log-btn {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  font-family: var(--font-code);
}

.log-btn:hover {
  background: #00ff00;
  color: #000;
}

.log-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.log-status {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 6px 8px;
  background: #001100;
  border: 1px solid #00ff00;
  font-size: 10px;
}

.status-item {
  display: flex;
  gap: 4px;
}

.label {
  color: #00ff00;
  opacity: 0.7;
}

.value {
  color: #00ff00;
  font-weight: bold;
}

.value.urgent {
  color: #ff6600;
  animation: pulse 1s infinite;
}

.log-entries {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #00ff00;
}

.log-entry {
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background 0.2s ease;
}

.log-entry:hover {
  background: rgba(0, 255, 0, 0.05);
}

.log-entry.unread {
  border-left: 4px solid #ff6600;
}

.log-entry.expanded {
  background: rgba(0, 255, 0, 0.1);
}

.entry-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-number {
  color: #00ff00;
  font-weight: bold;
  font-size: 12px;
}

.entry-title {
  color: #00ff00;
  font-size: 12px;
}

.entry-badge {
  background: #ff6600;
  color: #000;
  padding: 2px 6px;
  font-size: 8px;
  font-weight: bold;
}

.entry-meta {
  display: flex;
  gap: 8px;
  font-size: 9px;
  color: #00ff00;
  opacity: 0.7;
}

.entry-content {
  padding: 0 12px 12px;
  border-top: 1px solid #333;
}

.content-text {
  color: #00ff00;
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
  margin: 8px 0;
}

.entry-footer {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 2px 6px;
  font-size: 9px;
  cursor: pointer;
  font-family: var(--font-code);
}

.action-btn:hover {
  background: #00ff00;
  color: #000;
}

.log-empty {
  text-align: center;
  padding: 40px 20px;
  color: #00ff00;
  opacity: 0.7;
}

.help-text {
  font-size: 10px;
  margin-top: 8px;
  opacity: 0.6;
}

.log-alert {
  position: fixed;
  top: 60px;
  right: 20px;
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

.alert-icon {
  font-size: 16px;
}

.alert-text {
  font-size: 11px;
}

.alert-close {
  font-size: 16px;
  font-weight: bold;
  margin-left: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>