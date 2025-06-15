<template>
  <div
    class="crew-card"
    :class="{
      'card-selected': selected,
      'card-unavailable': !crewMember.available,
      'card-stressed': crewMember.stress > 75
    }"
    @click="$emit('select', crewMember.id)"
  >
    <div class="card-header">
      <span class="crew-name">{{ crewMember.name }}</span>
      <span class="crew-id">#{{ crewMember.id.slice(0, 8) }}</span>
    </div>
    
    <div class="card-body">
      <div class="crew-role">
        {{ crewMember.role.toUpperCase() }}
      </div>
      
      <div class="crew-stats">
        <div class="stat">
          <span class="stat-label">LVL:</span>
          <span class="stat-value">{{ crewMember.level }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">EXP:</span>
          <span class="stat-value">{{ crewMember.experience }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">MORALE:</span>
          <span class="stat-value" :class="getMoraleClass(crewMember.morale)">
            {{ crewMember.morale }}%
          </span>
        </div>
      </div>
      
      <div class="crew-status">
        <div class="status-item">
          STRESS: 
          <span :class="getStressClass(crewMember.stress)">
            {{ getStressBar(crewMember.stress) }}
          </span>
        </div>
        <div class="status-item">
          HEALTH: 
          <span :class="getHealthClass(crewMember.health)">
            {{ getHealthStatus(crewMember.health) }}
          </span>
        </div>
      </div>
      
      <div v-if="crewMember.traits.length" class="crew-traits">
        <span
          v-for="trait in crewMember.traits.slice(0, 3)"
          :key="trait"
          class="trait-badge"
        >
          {{ trait }}
        </span>
        <span v-if="crewMember.traits.length > 3" class="trait-more">
          +{{ crewMember.traits.length - 3 }}
        </span>
      </div>
      
      <div v-if="crewMember.currentTask" class="current-task">
        <span class="task-label">CURRENT:</span>
        <span class="task-name">{{ crewMember.currentTask }}</span>
      </div>
    </div>
    
    <div v-if="showActions" class="card-actions">
      <button
        class="action-btn"
        @click.stop="$emit('assign', crewMember.id)"
      >
        [ASSIGN]
      </button>
      <button
        class="action-btn"
        @click.stop="$emit('details', crewMember.id)"
      >
        [INFO]
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  crewMember: {
    type: Object,
    required: true
  },
  selected: Boolean,
  showActions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['select', 'assign', 'details'])

const getMoraleClass = (morale) => {
  if (morale >= 80) return 'morale-high'
  if (morale >= 50) return 'morale-medium'
  return 'morale-low'
}

const getStressClass = (stress) => {
  if (stress >= 75) return 'stress-high'
  if (stress >= 50) return 'stress-medium'
  return 'stress-low'
}

const getHealthClass = (health) => {
  if (health >= 80) return 'health-good'
  if (health >= 50) return 'health-fair'
  return 'health-poor'
}

const getStressBar = (stress) => {
  const filled = Math.floor(stress / 10)
  const empty = 10 - filled
  return '▮'.repeat(filled) + '▯'.repeat(empty)
}

const getHealthStatus = (health) => {
  if (health >= 90) return '[EXCELLENT]'
  if (health >= 70) return '[GOOD]'
  if (health >= 50) return '[FAIR]'
  if (health >= 30) return '[POOR]'
  return '[CRITICAL]'
}
</script>

<style scoped>
.crew-card {
  border: 1px solid #00ff00;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  padding: 8px;
  cursor: pointer;
  transition: none;
  position: relative;
}

.crew-card:hover {
  background: #001100;
  border-color: #00ff00;
  box-shadow: 0 0 0 1px #00ff00;
}

.card-selected {
  background: #002200;
  border-color: #00ff00;
  border-width: 2px;
}

.card-unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-stressed {
  border-color: #ff0000;
  animation: stress-pulse 2s ease-in-out infinite;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px dotted #003300;
}

.crew-name {
  font-weight: bold;
  font-size: 13px;
}

.crew-id {
  font-size: 10px;
  opacity: 0.5;
}

.card-body {
  font-size: 11px;
}

.crew-role {
  color: #00ffff;
  margin-bottom: 4px;
  font-size: 12px;
}

.crew-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: #001100;
  border: 1px dotted #003300;
}

.stat {
  text-align: center;
}

.stat-label {
  opacity: 0.6;
  font-size: 10px;
}

.stat-value {
  font-weight: bold;
}

.morale-high { color: #00ff00; }
.morale-medium { color: #ffff00; }
.morale-low { color: #ff0000; }

.crew-status {
  margin-bottom: 6px;
}

.status-item {
  font-size: 10px;
  margin-bottom: 2px;
}

.stress-low { color: #00ff00; }
.stress-medium { color: #ffff00; }
.stress-high { color: #ff0000; }

.health-good { color: #00ff00; }
.health-fair { color: #ffff00; }
.health-poor { color: #ff0000; }

.crew-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 6px;
}

.trait-badge {
  background: #002200;
  border: 1px solid #00ff00;
  padding: 1px 4px;
  font-size: 9px;
  text-transform: uppercase;
}

.trait-more {
  color: #00ff00;
  opacity: 0.6;
  font-size: 9px;
  padding: 1px 4px;
}

.current-task {
  font-size: 10px;
  padding: 4px;
  background: #110011;
  border: 1px dotted #ff00ff;
  margin-bottom: 6px;
}

.task-label {
  opacity: 0.6;
  margin-right: 4px;
}

.task-name {
  color: #ff00ff;
}

.card-actions {
  display: flex;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px dotted #003300;
}

.action-btn {
  flex: 1;
  background: none;
  border: 1px solid #00ff00;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  text-transform: uppercase;
}

.action-btn:hover {
  background: #00ff00;
  color: #000000;
}

@keyframes stress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>