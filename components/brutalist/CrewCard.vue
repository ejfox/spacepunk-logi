<template>
  <div class="crew-card" :class="{
    'card-selected': selected,
    'card-unavailable': !crewMember.available,
    'card-stressed': crewMember.stress > 75
  }" @click="$emit('select', crewMember.id)">
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
          <span class="stat-label">TOTAL:</span>
          <span class="stat-value">{{ getTotalSkills(crewMember.skills) }}</span>
        </div>
      </div>
      
      <!-- Skill breakdown -->
      <div v-if="crewMember.skills" class="skill-breakdown">
        <div class="skill-row">
          <span class="skill-name">ENG:</span>
          <span class="skill-bar">{{ getSkillBar(crewMember.skills.engineering) }}</span>
          <span class="skill-value">{{ crewMember.skills.engineering || 0 }}</span>
        </div>
        <div class="skill-row">
          <span class="skill-name">SOC:</span>
          <span class="skill-bar">{{ getSkillBar(crewMember.skills.social) }}</span>
          <span class="skill-value">{{ crewMember.skills.social || 0 }}</span>
        </div>
        <div class="skill-row">
          <span class="skill-name">PIL:</span>
          <span class="skill-bar">{{ getSkillBar(crewMember.skills.piloting) }}</span>
          <span class="skill-value">{{ crewMember.skills.piloting || 0 }}</span>
        </div>
        <div class="skill-row">
          <span class="skill-name">COM:</span>
          <span class="skill-bar">{{ getSkillBar(crewMember.skills.combat) }}</span>
          <span class="skill-value">{{ crewMember.skills.combat || 0 }}</span>
        </div>
      </div>
      
      <!-- Advanced Biometric Display -->
      <CrewASCIIDisplay 
        :health="crewMember.health || 100"
        :morale="crewMember.morale || 75"
        :stress="crewMember.stress || 25"
        :crew-id="crewMember.id"
      />
      
      <!-- Skill Performance Sparklines -->
      <div class="sparklines-section">
        <CrewSparkline 
          :data="[]"
          metric="performance"
          :current-value="getTotalSkills(crewMember.skills)"
          :max-value="400"
        />
        <CrewSparkline 
          :data="[]"
          metric="efficiency"
          :current-value="crewMember.experience || 0"
          :max-value="3000"
        />
      </div>


      <div v-if="crewMember.traits.length" class="crew-traits">
        <span v-for="trait in crewMember.traits.slice(0, 3)" :key="trait" class="trait-badge">
          {{ trait }}
        </span>
        <span v-if="crewMember.traits.length > 3" class="trait-more">
          +{{ crewMember.traits.length - 3 }}
        </span>
      </div>

      <!-- Corporate Data Terminal -->
      <div class="corporate-terminal">
        <div class="terminal-header">
          <span class="terminal-id">WORKSTATION-{{ crewMember.id.slice(0, 4).toUpperCase() }}</span>
          <span class="terminal-status">{{ getTerminalStatus(crewMember) }}</span>
        </div>
        <div class="terminal-readout">
          <div class="readout-line">
            <span class="readout-label">TASK:</span>
            <span class="readout-value">{{ crewMember.currentTask || 'IDLE' }}</span>
          </div>
          <div class="readout-line">
            <span class="readout-label">SHIFT:</span>
            <span class="readout-value">{{ getShiftStatus() }}</span>
          </div>
          <div class="readout-line">
            <span class="readout-label">EVAL:</span>
            <span class="readout-value" :class="getEvalClass(crewMember)">{{ getPerformanceEval(crewMember) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showActions" class="card-actions">
      <button class="action-btn" @click.stop="$emit('assign', crewMember.id)">
        [ASSIGN]
      </button>
      <button class="action-btn" @click.stop="$emit('details', crewMember.id)">
        [INFO]
      </button>
    </div>
  </div>
</template>

<script setup>
import CrewSparkline from './CrewSparkline.vue'
import CrewASCIIDisplay from './CrewASCIIDisplay.vue'

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

const getTotalSkills = (skills) => {
  if (!skills) return 0
  return Object.values(skills).reduce((sum, val) => sum + (val || 0), 0)
}

const getSkillBar = (skill) => {
  const value = skill || 0
  const filled = Math.floor(value / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

const getOverallStatus = (crew) => {
  if (crew.health < 50) return 'MEDICAL ATTENTION REQUIRED'
  if (crew.stress > 75) return 'HIGH STRESS LEVELS'
  if (crew.morale < 30) return 'LOW MORALE'
  if (crew.health > 80 && crew.morale > 70) return 'EXCELLENT CONDITION'
  if (crew.health > 60 && crew.morale > 50) return 'GOOD CONDITION'
  return 'ADEQUATE CONDITION'
}

const getOverallStatusClass = (crew) => {
  if (crew.health < 50 || crew.stress > 75) return 'status-poor'
  if (crew.morale < 30) return 'status-warning'
  if (crew.health > 80 && crew.morale > 70) return 'status-excellent'
  return 'status-good'
}

const getTerminalStatus = (crew) => {
  if (crew.health < 30) return 'MEDICAL'
  if (crew.stress > 80) return 'OVERLOAD'
  if (crew.morale < 20) return 'UNSTABLE'
  return 'ACTIVE'
}

const getShiftStatus = () => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 14) return 'ALPHA'
  if (hour >= 14 && hour < 22) return 'BETA'
  return 'GAMMA'
}

const getPerformanceEval = (crew) => {
  const score = (crew.health + crew.morale + (100 - crew.stress)) / 3
  if (score >= 85) return 'EXCEEDS'
  if (score >= 70) return 'MEETS'
  if (score >= 50) return 'BELOW'
  return 'FAILS'
}

const getEvalClass = (crew) => {
  const eval_result = getPerformanceEval(crew)
  if (eval_result === 'EXCEEDS') return 'eval-excellent'
  if (eval_result === 'MEETS') return 'eval-good'
  if (eval_result === 'BELOW') return 'eval-warning'
  return 'eval-poor'
}
</script>

<style scoped>
.crew-card {
  border: 1px solid #ffffff;
  background: #000000;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  padding: 8px;
  cursor: pointer;
  transition: none;
  position: relative;
}

.crew-card:hover {
  background: #111111;
  border-color: #ffffff;
  box-shadow: 0 0 0 1px #ffffff;
}

.card-selected {
  background: #222222;
  border-color: #ffffff;
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
  border-bottom: 1px dotted #333333;
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
  color: #ffffff;
  margin-bottom: 4px;
  font-size: 12px;
}

.crew-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: #111111;
  border: 1px dotted #333333;
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

.morale-high {
  color: #00ff00;
}

.morale-medium {
  color: #ffaa00;
}

.morale-low {
  color: #ff0000;
}

/* Skill breakdown styling */
.skill-breakdown {
  margin-bottom: 6px;
  padding: 4px;
  background: #0a0a0a;
  border: 1px dotted #333333;
}

.skill-row {
  display: grid;
  grid-template-columns: 30px 1fr 25px;
  gap: 4px;
  align-items: center;
  font-size: 9px;
  margin-bottom: 1px;
}

.skill-name {
  color: #888888;
  font-weight: bold;
}

.skill-bar {
  font-family: monospace;
  color: #00ff00;
  font-size: 8px;
  letter-spacing: 0;
}

.skill-value {
  color: #ffffff;
  font-weight: bold;
  text-align: right;
}

.crew-status-simple {
  margin-bottom: 6px;
  font-size: 9px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-indicator {
  font-weight: bold;
  padding: 1px 3px;
  border: 1px solid;
}

.status-excellent {
  color: #00ff00;
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.status-good {
  color: #88ff88;
  border-color: #88ff88;
  background: rgba(136, 255, 136, 0.1);
}

.status-warning {
  color: #ffaa00;
  border-color: #ffaa00;
  background: rgba(255, 170, 0, 0.1);
}

.status-poor {
  color: #ff0000;
  border-color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.morale-indicator {
  font-size: 8px;
  opacity: 0.8;
}

/* Sparklines section */
.sparklines-section {
  margin-bottom: 6px;
}

/* Corporate terminal styling */
.corporate-terminal {
  background: #0a0a0a;
  border: 1px solid #333333;
  padding: 6px;
  margin-bottom: 6px;
  font-size: 9px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #222222;
  padding-bottom: 2px;
  margin-bottom: 4px;
}

.terminal-id {
  color: #666666;
  font-size: 8px;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
}

.terminal-status {
  color: #ffffff;
  font-size: 8px;
  font-weight: bold;
  padding: 1px 3px;
  border: 1px solid #666666;
}

.terminal-readout {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.readout-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.readout-label {
  color: #888888;
  font-size: 8px;
}

.readout-value {
  color: #ffffff;
  font-size: 8px;
  font-weight: bold;
}

.eval-excellent { color: #00ff00; }
.eval-good { color: #4ecdc4; }
.eval-warning { color: #f39c12; }
.eval-poor { color: #e74c3c; }

.stress-low {
  color: #00ff00;
}

.stress-medium {
  color: #ffaa00;
}

.stress-high {
  color: #ff0000;
}

.health-good {
  color: #00ff00;
}

.health-fair {
  color: #ffaa00;
}

.health-poor {
  color: #ff0000;
}

.crew-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 6px;
}

.trait-badge {
  background: #222222;
  border: 1px solid #ffffff;
  padding: 1px 4px;
  font-size: 9px;
  text-transform: uppercase;
}

.trait-more {
  color: #ffffff;
  opacity: 0.6;
  font-size: 9px;
  padding: 1px 4px;
}

.current-task {
  font-size: 10px;
  padding: 4px;
  background: #111111;
  border: 1px dotted #ffffff;
  margin-bottom: 6px;
}

.task-label {
  opacity: 0.6;
  margin-right: 4px;
}

.task-name {
  color: #ffffff;
}

.card-actions {
  display: flex;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px dotted #333333;
}

.action-btn {
  flex: 1;
  background: none;
  border: 1px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  text-transform: uppercase;
}

.action-btn:hover {
  background: #ffffff;
  color: #000000;
}

@keyframes stress-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}
</style>