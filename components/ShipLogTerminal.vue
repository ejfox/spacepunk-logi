<template>
  <div class="ship-log-terminal">
    <div class="terminal-header">
      <div class="terminal-title">[ SHIP'S LOG ARCHIVE v1.7.3 ]</div>
      <div class="terminal-status">
        <span>CAPTAIN: {{ playerName || 'UNKNOWN' }}</span>
        <span class="separator">│</span>
        <span>VESSEL: {{ shipName || 'UNKNOWN' }}</span>
        <span class="separator">│</span>
        <span>ENTRIES: {{ logs.length }}</span>
      </div>
    </div>

    <div class="log-controls">
      <button @click="refreshLogs" :disabled="isLoading" class="control-btn">
        [{{ isLoading ? 'LOADING...' : 'REFRESH' }}]
      </button>
      <button @click="generateNewLog" :disabled="isGenerating" class="control-btn">
        [{{ isGenerating ? 'GENERATING...' : 'SCAN ABSENCE' }}]
      </button>
      <select v-model="complexityFilter" @change="filterLogs" class="complexity-filter">
        <option value="">ALL COMPLEXITY</option>
        <option value="brief">BRIEF</option>
        <option value="short">SHORT</option>
        <option value="medium">MEDIUM</option>
        <option value="long">LONG</option>
        <option value="epic">EPIC</option>
      </select>
    </div>

    <div class="log-entries" ref="logContainer">
      <div v-if="logs.length === 0" class="empty-state">
        <div class="empty-message">
          NO LOG ENTRIES FOUND
        </div>
        <div class="empty-hint">
          [HINT: Use 'SCAN ABSENCE' to generate your first log entry]
        </div>
      </div>

      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-entry"
        :class="{
          'complexity-brief': log.complexity === 'brief',
          'complexity-short': log.complexity === 'short',
          'complexity-medium': log.complexity === 'medium',
          'complexity-long': log.complexity === 'long',
          'complexity-epic': log.complexity === 'epic',
          'generated-by-llm': log.generated_by === 'llm',
          'generated-by-fallback': log.generated_by?.includes('fallback')
        }"
        @click="selectLog(log)"
      >
        <div class="log-header">
          <div class="log-timestamp">
            {{ formatLogDate(log.created_at) }}
          </div>
          <div class="log-metadata">
            <span class="complexity-badge">{{ log.complexity?.toUpperCase() }}</span>
            <span class="separator">│</span>
            <span class="duration">{{ formatAbsenceDuration(log.absence_duration_hours) }}</span>
            <span class="separator">│</span>
            <span class="source-badge" :class="getSourceClass(log.generated_by)">
              {{ getSourceLabel(log.generated_by) }}
            </span>
          </div>
        </div>
        
        <div class="log-content">
          <div class="story-preview" v-html="formatStoryPreview(log.story_content)"></div>
          
          <div v-if="selectedLog?.id === log.id" class="story-full">
            <div class="story-text" v-html="formatStoryText(log.story_content)"></div>
            
            <div v-if="log.story_context && Object.keys(log.story_context).length > 0" class="context-data">
              <div class="context-header">[ CONTEXTUAL DATA ]</div>
              
              <div v-if="log.story_context.crewDevelopments?.length > 0" class="context-section">
                <div class="context-title">CREW TRAINING COMPLETED:</div>
                <div v-for="dev in log.story_context.crewDevelopments" :key="dev.crewMember.id" class="context-item">
                  › {{ dev.crewMember.name }}: {{ dev.skill }} +{{ dev.improvement }}
                </div>
              </div>
              
              <div v-if="log.story_context.marketEvents?.length > 0" class="context-section">
                <div class="context-title">MARKET FLUCTUATIONS:</div>
                <div v-for="event in log.story_context.marketEvents" :key="event.resource" class="context-item">
                  › {{ event.resource }}: {{ event.priceChange > 0 ? '+' : '' }}{{ event.priceChange }}%
                </div>
              </div>
              
              <div v-if="log.story_context.missionOutcomes?.length > 0" class="context-section">
                <div class="context-title">MISSION STATUS:</div>
                <div v-for="mission in log.story_context.missionOutcomes" :key="mission.title" class="context-item">
                  › {{ mission.title }}: {{ mission.outcome?.toUpperCase() }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="log-footer">
          <span class="log-id">LOG-{{ log.id.split('_')[1]?.substr(0, 8) || 'UNKNOWN' }}</span>
          <span class="expand-hint" v-if="selectedLog?.id !== log.id">
            [CLICK TO EXPAND]
          </span>
          <span class="collapse-hint" v-else>
            [CLICK TO COLLAPSE]
          </span>
        </div>
      </div>
    </div>

    <div class="terminal-footer">
      <div class="status-line">
        <span>{{ filteredLogs.length }}/{{ logs.length }} ENTRIES DISPLAYED</span>
        <span class="separator">│</span>
        <span>LAST REFRESH: {{ lastRefresh }}</span>
        <span class="separator">│</span>
        <span class="generation-status" :class="{ blink: isGenerating }">
          {{ isGenerating ? 'AI GENERATING...' : 'SYSTEMS NOMINAL' }}
        </span>
      </div>
    </div>

    <div class="keyboard-hints">
      [R] REFRESH | [G] GENERATE | [ESC] CLEAR FILTER | [↑/↓] NAVIGATE
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShipLogTerminal',
  
  props: {
    playerId: {
      type: String,
      required: true
    },
    shipId: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      logs: [],
      filteredLogs: [],
      selectedLog: null,
      complexityFilter: '',
      isLoading: false,
      isGenerating: false,
      lastRefresh: '',
      playerName: '',
      shipName: '',
      updateInterval: null
    }
  },
  
  async mounted() {
    await this.loadPlayerInfo();
    await this.refreshLogs();
    this.updateClock();
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard);
    
    // Auto-refresh every 2 minutes
    this.updateInterval = setInterval(() => {
      this.refreshLogs();
    }, 120000);
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyboard);
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },
  
  methods: {
    async loadPlayerInfo() {
      try {
        // Get player info (this would need to be implemented in the API)
        this.playerName = 'CAPTAIN-' + this.playerId.substr(0, 8).toUpperCase();
        this.shipName = 'VESSEL-' + (this.shipId?.substr(0, 8)?.toUpperCase() || 'UNKNOWN');
      } catch (error) {
        console.error('Failed to load player info:', error);
      }
    },
    
    async refreshLogs() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      try {
        const response = await fetch(`/api/player/${this.playerId}/logs?limit=20`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        this.logs = await response.json();
        this.filterLogs();
        this.updateClock();
        
      } catch (error) {
        console.error('Error fetching logs:', error);
        // Show error in terminal style
        this.logs = [{
          id: 'error',
          story_content: `ERROR: Failed to retrieve log entries\nSYSTEM MESSAGE: ${error.message}\nPlease contact technical support (they're probably in the cantina).`,
          created_at: new Date().toISOString(),
          complexity: 'brief',
          generated_by: 'error_handler'
        }];
      } finally {
        this.isLoading = false;
      }
    },
    
    async generateNewLog() {
      if (this.isGenerating) return;
      
      this.isGenerating = true;
      try {
        const response = await fetch(`/api/player/${this.playerId}/generate-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to generate log');
        
        const result = await response.json();
        
        if (result.logEntry) {
          // Add the new log to the beginning of the list
          this.logs.unshift(result.logEntry);
          this.filterLogs();
        } else {
          // Show message about no story generated
          console.log(result.message);
        }
        
      } catch (error) {
        console.error('Error generating log:', error);
      } finally {
        this.isGenerating = false;
      }
    },
    
    filterLogs() {
      if (!this.complexityFilter) {
        this.filteredLogs = [...this.logs];
      } else {
        this.filteredLogs = this.logs.filter(log => log.complexity === this.complexityFilter);
      }
    },
    
    selectLog(log) {
      if (this.selectedLog?.id === log.id) {
        this.selectedLog = null;
      } else {
        this.selectedLog = log;
      }
    },
    
    formatLogDate(dateString) {
      const date = new Date(dateString);
      return date.toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
    },
    
    formatAbsenceDuration(hours) {
      if (!hours) return 'REALTIME';
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
      return `${Math.round(hours / 24 * 10) / 10}d`;
    },
    
    formatStoryPreview(story) {
      if (!story) return '[NO STORY DATA]';
      
      // Extract first sentence or first 150 characters
      const firstSentence = story.split(/[.!?]/)[0];
      const preview = firstSentence.length > 150 ? 
        story.substr(0, 150) + '...' : 
        firstSentence + (story.includes('.') || story.includes('!') || story.includes('?') ? '.' : '...');
      
      return this.formatStoryText(preview);
    },
    
    formatStoryText(story) {
      if (!story) return '[NO STORY DATA]';
      
      return story
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]/g, '<span class="system-note">[$1]</span>')
        .replace(/CAPTAIN'S LOG/g, '<span class="log-title">CAPTAIN\'S LOG</span>')
        .replace(/ERROR:/g, '<span class="error-text">ERROR:</span>')
        .replace(/SYSTEM MESSAGE:/g, '<span class="system-message">SYSTEM MESSAGE:</span>');
    },
    
    getSourceClass(generatedBy) {
      if (generatedBy === 'llm') return 'source-ai';
      if (generatedBy?.includes('fallback')) return 'source-template';
      if (generatedBy === 'error_handler') return 'source-error';
      return 'source-system';
    },
    
    getSourceLabel(generatedBy) {
      if (generatedBy === 'llm') return 'AI';
      if (generatedBy?.includes('fallback')) return 'TPL';
      if (generatedBy === 'error_handler') return 'ERR';
      return 'SYS';
    },
    
    updateClock() {
      this.lastRefresh = new Date().toISOString().split('T')[1].split('.')[0];
    },
    
    handleKeyboard(event) {
      switch (event.key.toLowerCase()) {
        case 'r':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            this.refreshLogs();
          }
          break;
        case 'g':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            this.generateNewLog();
          }
          break;
        case 'escape':
          this.complexityFilter = '';
          this.filterLogs();
          this.selectedLog = null;
          break;
      }
    }
  }
}
</script>

<style scoped>
.ship-log-terminal {
  font-family: 'Courier New', Courier, monospace;
  background: #000;
  color: #0f0;
  border: 2px solid #0f0;
  min-height: 700px;
  font-size: 12px;
  line-height: 1.3;
  position: relative;
}

.terminal-header {
  border-bottom: 1px solid #0f0;
  padding: 10px;
  background: #001100;
}

.terminal-title {
  text-align: center;
  font-weight: bold;
  margin-bottom: 5px;
  color: #0f0;
}

.terminal-status {
  text-align: center;
  font-size: 11px;
  color: #080;
}

.separator {
  margin: 0 8px;
  color: #060;
}

.log-controls {
  padding: 8px 10px;
  border-bottom: 1px solid #040;
  display: flex;
  gap: 10px;
  align-items: center;
  background: #000800;
}

.control-btn {
  background: transparent;
  border: 1px solid #0f0;
  color: #0f0;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #002200;
  color: #fff;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complexity-filter {
  background: #000;
  border: 1px solid #0f0;
  color: #0f0;
  padding: 4px;
  font-family: inherit;
  font-size: 11px;
}

.log-entries {
  padding: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-message {
  font-size: 14px;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 11px;
  color: #444;
}

.log-entry {
  border: 1px solid #040;
  margin-bottom: 10px;
  background: #000400;
  transition: all 0.3s ease;
  cursor: pointer;
}

.log-entry:hover {
  border-color: #080;
  background: #001100;
}

.log-entry.complexity-epic {
  border-left: 4px solid #ff0;
}

.log-entry.complexity-long {
  border-left: 4px solid #f80;
}

.log-entry.complexity-medium {
  border-left: 4px solid #0f0;
}

.log-entry.generated-by-llm {
  border-right: 2px solid #00f;
}

.log-header {
  padding: 8px 10px;
  border-bottom: 1px solid #040;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #000200;
}

.log-timestamp {
  font-size: 11px;
  color: #080;
}

.log-metadata {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.complexity-badge {
  padding: 2px 6px;
  border: 1px solid #060;
  color: #0f0;
  background: #001000;
}

.source-badge {
  padding: 2px 4px;
  border: 1px solid;
  font-weight: bold;
}

.source-ai {
  border-color: #00f;
  color: #44f;
  background: #000044;
}

.source-template {
  border-color: #f80;
  color: #fa0;
  background: #220800;
}

.source-error {
  border-color: #f00;
  color: #f44;
  background: #200000;
}

.log-content {
  padding: 10px;
}

.story-preview {
  color: #0f0;
  line-height: 1.4;
}

.story-full {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #040;
}

.story-text {
  color: #0f0;
  line-height: 1.5;
  margin-bottom: 15px;
}

.log-title {
  color: #ff0;
  font-weight: bold;
}

.system-note {
  color: #080;
  font-style: italic;
}

.error-text {
  color: #f00;
  font-weight: bold;
}

.system-message {
  color: #f80;
}

.context-data {
  background: #000200;
  border: 1px solid #040;
  padding: 10px;
  margin-top: 10px;
}

.context-header {
  color: #ff0;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
}

.context-section {
  margin-bottom: 8px;
}

.context-title {
  color: #080;
  font-size: 11px;
  margin-bottom: 4px;
}

.context-item {
  color: #0f0;
  font-size: 11px;
  margin-left: 10px;
  margin-bottom: 2px;
}

.log-footer {
  padding: 6px 10px;
  border-top: 1px solid #040;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #000100;
  font-size: 10px;
}

.log-id {
  color: #666;
}

.expand-hint, .collapse-hint {
  color: #080;
  font-style: italic;
}

.terminal-footer {
  border-top: 1px solid #0f0;
  padding: 8px 10px;
  background: #001100;
}

.status-line {
  text-align: center;
  font-size: 11px;
  color: #080;
}

.generation-status.blink {
  animation: blink 1s infinite;
  color: #ff0;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
}

.keyboard-hints {
  position: absolute;
  bottom: 5px;
  left: 10px;
  right: 10px;
  text-align: center;
  font-size: 10px;
  color: #040;
  background: #000;
  padding: 2px;
}

/* Scrollbar styling */
.log-entries::-webkit-scrollbar {
  width: 8px;
}

.log-entries::-webkit-scrollbar-track {
  background: #000;
  border: 1px solid #040;
}

.log-entries::-webkit-scrollbar-thumb {
  background: #0f0;
  border: 1px solid #000;
}

.log-entries::-webkit-scrollbar-thumb:hover {
  background: #0f0;
}
</style>