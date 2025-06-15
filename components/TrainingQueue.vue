<template>
  <div class="training-queue">
    <div class="training-header">
      <h2>TRAINING OPERATIONS</h2>
      <div class="training-controls">
        <button 
          class="training-btn" 
          @click="refreshQueue"
          :disabled="isLoading"
        >
          {{ isLoading ? 'UPDATING...' : 'REFRESH' }}
        </button>
        <button 
          class="training-btn" 
          @click="showProgramCatalog = !showProgramCatalog"
        >
          {{ showProgramCatalog ? 'CLOSE CATALOG' : 'TRAINING CATALOG' }}
        </button>
      </div>
    </div>

    <div class="training-status">
      <span class="status-item">
        <span class="label">ACTIVE TRAINING:</span>
        <span class="value">{{ activeTraining.length }}</span>
      </span>
      <span class="status-item">
        <span class="label">CREW AVAILABLE:</span>
        <span class="value">{{ availableCrew.length }}</span>
      </span>
      <span class="status-item">
        <span class="label">TRAINING BUDGET:</span>
        <span class="value">{{ formatCredits(credits) }} CR</span>
      </span>
    </div>

    <!-- Active Training Queue -->
    <div class="active-training" v-if="activeTraining.length > 0">
      <h3>ACTIVE TRAINING PROGRAMS</h3>
      <div class="training-list">
        <div 
          v-for="training in activeTraining" 
          :key="training.id"
          class="training-item"
          :class="{ 
            queued: training.status === 'queued',
            'in-progress': training.status === 'in_progress'
          }"
        >
          <div class="training-info">
            <div class="crew-program">
              <span class="crew-name">{{ training.crew_name }}</span>
              <span class="program-name">{{ training.program_name }}</span>
            </div>
            <div class="training-meta">
              <span class="skill-type">{{ formatSkillType(training.skill_type) }}</span>
              <span class="improvement">+{{ training.skill_improvement }} points</span>
            </div>
          </div>
          
          <div class="progress-section">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${training.progress_percentage || 0}%` }"
              ></div>
            </div>
            <div class="progress-text">
              <span class="percentage">{{ Math.round(training.progress_percentage || 0) }}%</span>
              <span class="time-remaining">{{ formatTimeRemaining(training) }}</span>
            </div>
          </div>

          <div class="training-actions">
            <button 
              class="action-btn cancel-btn"
              @click="cancelTraining(training.id)"
              :disabled="isProcessing"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="training-empty" v-else>
      <p>No active training programs.</p>
      <p class="help-text">Enroll crew members in training programs to improve their skills over time.</p>
    </div>

    <!-- Training Program Catalog -->
    <div v-if="showProgramCatalog" class="program-catalog">
      <h3>TRAINING PROGRAM CATALOG</h3>
      
      <!-- Crew Selection -->
      <div class="crew-selection">
        <label>SELECT CREW MEMBER:</label>
        <select v-model="selectedCrewMember" class="crew-select">
          <option value="">-- Select Crew Member --</option>
          <option 
            v-for="crew in availableCrew" 
            :key="crew.id" 
            :value="crew.id"
          >
            {{ crew.name }} (Eng: {{ crew.skill_engineering }}, Pilot: {{ crew.skill_piloting }}, Social: {{ crew.skill_social }}, Combat: {{ crew.skill_combat }})
          </option>
        </select>
      </div>

      <!-- Available Programs -->
      <div v-if="selectedCrewMember" class="programs-list">
        <div 
          v-for="program in availablePrograms" 
          :key="program.id"
          class="program-item"
          :class="{ 
            affordable: credits >= program.cost_credits,
            'too-expensive': credits < program.cost_credits
          }"
        >
          <div class="program-header">
            <span class="program-title">{{ program.name }}</span>
            <span class="program-category">{{ program.category.toUpperCase() }}</span>
            <span class="program-cost">{{ formatCredits(program.cost_credits) }} CR</span>
          </div>
          
          <div class="program-details">
            <p class="program-description">{{ program.description }}</p>
            <div class="program-stats">
              <span class="stat">
                <span class="label">SKILL:</span>
                <span class="value">{{ formatSkillType(program.skill_type) }}</span>
              </span>
              <span class="stat">
                <span class="label">IMPROVEMENT:</span>
                <span class="value">+{{ program.skill_improvement }} points</span>
              </span>
              <span class="stat">
                <span class="label">DURATION:</span>
                <span class="value">{{ program.duration_ticks }} ticks</span>
              </span>
              <span class="stat">
                <span class="label">DIFFICULTY:</span>
                <span class="value">{{ '★'.repeat(program.difficulty_rating) }}</span>
              </span>
            </div>
          </div>

          <div class="program-actions">
            <button 
              class="action-btn enroll-btn"
              @click="enrollInProgram(selectedCrewMember, program.id)"
              :disabled="isProcessing || credits < program.cost_credits"
            >
              {{ credits < program.cost_credits ? 'INSUFFICIENT FUNDS' : 'ENROLL' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="select-crew-prompt">
        <p>Select a crew member to view available training programs.</p>
      </div>
    </div>

    <!-- Training Event Notifications -->
    <div 
      v-if="trainingAlert"
      class="training-alert"
      @click="dismissAlert"
    >
      <span class="alert-icon">🎓</span>
      <span class="alert-text">{{ trainingAlert.message }}</span>
      <span class="alert-close">×</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  shipId: {
    type: String,
    required: true
  },
  crew: {
    type: Array,
    default: () => []
  },
  credits: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['trainingEvent', 'creditsChanged'])

const activeTraining = ref([])
const availablePrograms = ref([])
const selectedCrewMember = ref('')
const showProgramCatalog = ref(false)
const isLoading = ref(false)
const isProcessing = ref(false)
const trainingAlert = ref(null)
const alertTimeout = ref(null)

const availableCrew = computed(() => {
  // Filter out crew members who are already in training
  const trainingCrewIds = activeTraining.value.map(t => t.crew_member_id)
  return props.crew.filter(crew => !trainingCrewIds.includes(crew.id))
})

onMounted(() => {
  refreshQueue()
})

// Watch for crew member selection changes
watch(selectedCrewMember, async (newCrewId) => {
  if (newCrewId) {
    await loadAvailablePrograms(newCrewId)
  } else {
    availablePrograms.value = []
  }
})

async function refreshQueue() {
  if (!props.shipId) return
  
  isLoading.value = true
  try {
    const response = await fetch(`http://localhost:3001/api/ship/${props.shipId}/training-queue`)
    if (response.ok) {
      const data = await response.json()
      activeTraining.value = data
      emit('trainingEvent', { type: 'queue_refreshed', count: data.length })
    } else {
      console.error('Failed to fetch training queue')
    }
  } catch (error) {
    console.error('Error fetching training queue:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadAvailablePrograms(crewId) {
  try {
    const response = await fetch(`http://localhost:3001/api/crew/${crewId}/available-programs`)
    if (response.ok) {
      const data = await response.json()
      availablePrograms.value = data
    } else {
      console.error('Failed to fetch available programs')
    }
  } catch (error) {
    console.error('Error fetching available programs:', error)
  }
}

async function enrollInProgram(crewId, programId) {
  if (!crewId || !programId) return
  
  isProcessing.value = true
  try {
    const response = await fetch(`http://localhost:3001/api/training/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crewMemberId: crewId,
        trainingProgramId: programId,
        shipId: props.shipId
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      showTrainingAlert(`${getCrewName(crewId)} enrolled in training program`)
      
      // Refresh queue and available programs
      await refreshQueue()
      if (selectedCrewMember.value) {
        await loadAvailablePrograms(selectedCrewMember.value)
      }
      
      // Notify parent about credits change
      emit('creditsChanged', data.creditsSpent)
      emit('trainingEvent', { type: 'crew_enrolled', crewId, programId })
      
    } else {
      const error = await response.json()
      showTrainingAlert(`Enrollment failed: ${error.error}`, 'error')
    }
  } catch (error) {
    console.error('Error enrolling in training:', error)
    showTrainingAlert('Network error during enrollment', 'error')
  } finally {
    isProcessing.value = false
  }
}

async function cancelTraining(trainingId) {
  if (!confirm('Cancel this training program? Progress will be lost.')) return
  
  isProcessing.value = true
  try {
    const response = await fetch(`http://localhost:3001/api/training/${trainingId}/cancel`, {
      method: 'POST'
    })
    
    if (response.ok) {
      showTrainingAlert('Training program cancelled')
      await refreshQueue()
      emit('trainingEvent', { type: 'training_cancelled', trainingId })
    } else {
      showTrainingAlert('Failed to cancel training', 'error')
    }
  } catch (error) {
    console.error('Error cancelling training:', error)
    showTrainingAlert('Network error during cancellation', 'error')
  } finally {
    isProcessing.value = false
  }
}

function formatSkillType(skillType) {
  return skillType.replace('skill_', '').toUpperCase()
}

function formatCredits(amount) {
  return amount.toLocaleString()
}

function formatTimeRemaining(training) {
  if (training.status === 'queued') return 'QUEUED'
  
  const remaining = training.duration_ticks - training.progress_ticks
  if (remaining <= 0) return 'COMPLETING...'
  
  const hours = Math.floor(remaining * 30 / 3600) // 30 seconds per tick
  const minutes = Math.floor((remaining * 30 % 3600) / 60)
  
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getCrewName(crewId) {
  const crew = props.crew.find(c => c.id === crewId)
  return crew ? crew.name : 'Unknown'
}

function showTrainingAlert(message, type = 'info') {
  trainingAlert.value = { message, type }
  
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
  alertTimeout.value = setTimeout(() => {
    trainingAlert.value = null
  }, 5000)
}

function dismissAlert() {
  trainingAlert.value = null
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
}

function handleTrainingProgress(data) {
  // Find the training entry and update its progress
  const training = activeTraining.value.find(t => t.id === data.trainingId)
  if (training) {
    training.progress_percentage = data.progressPercentage
    training.progress_ticks = data.progressTicks
    training.status = data.status
    
    if (data.event === 'completed' || data.event === 'failed') {
      showTrainingAlert(`${training.crew_name} ${data.event} ${training.program_name}`)
      refreshQueue()
    }
  }
}

onUnmounted(() => {
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value)
  }
})

// Expose methods for parent component
defineExpose({
  refreshQueue,
  handleTrainingProgress
})
</script>

<style scoped>
.training-queue {
  background: #000;
  border: 1px solid #00ff00;
  padding: 12px;
  font-family: var(--font-code);
  position: relative;
}

.training-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #00ff00;
}

.training-header h2 {
  color: #00ff00;
  font-size: 14px;
  margin: 0;
}

.training-controls {
  display: flex;
  gap: 8px;
}

.training-btn {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  font-family: var(--font-code);
}

.training-btn:hover {
  background: #00ff00;
  color: #000;
}

.training-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.training-status {
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

.active-training h3 {
  color: #00ff00;
  font-size: 12px;
  margin: 0 0 8px;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.training-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.training-item {
  border: 1px solid #333;
  padding: 8px;
  background: #001100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.training-item.queued {
  border-left: 4px solid #ffaa00;
}

.training-item.in-progress {
  border-left: 4px solid #00ff00;
}

.training-info {
  flex: 1;
}

.crew-program {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.crew-name {
  color: #00ff00;
  font-weight: bold;
  font-size: 12px;
}

.program-name {
  color: #00ff00;
  font-size: 11px;
  opacity: 0.8;
}

.training-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 9px;
  color: #00ff00;
  opacity: 0.7;
}

.progress-section {
  flex: 1;
  max-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #333;
  border: 1px solid #00ff00;
  margin-bottom: 4px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #00aa00);
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #00ff00;
}

.training-actions {
  display: flex;
  gap: 4px;
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

.cancel-btn {
  border-color: #ff6600;
  color: #ff6600;
}

.cancel-btn:hover {
  background: #ff6600;
  color: #000;
}

.training-empty {
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

.program-catalog {
  margin-top: 16px;
  border-top: 1px solid #00ff00;
  padding-top: 12px;
}

.program-catalog h3 {
  color: #00ff00;
  font-size: 12px;
  margin: 0 0 12px;
}

.crew-selection {
  margin-bottom: 12px;
}

.crew-selection label {
  display: block;
  color: #00ff00;
  font-size: 10px;
  margin-bottom: 4px;
}

.crew-select {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px 8px;
  font-family: var(--font-code);
  font-size: 10px;
  width: 100%;
}

.programs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.program-item {
  border: 1px solid #333;
  padding: 8px;
  background: #001100;
}

.program-item.affordable {
  border-color: #00ff00;
}

.program-item.too-expensive {
  border-color: #ff6600;
  opacity: 0.6;
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.program-title {
  color: #00ff00;
  font-weight: bold;
  font-size: 12px;
}

.program-category {
  color: #00ff00;
  font-size: 9px;
  opacity: 0.7;
  background: #333;
  padding: 2px 4px;
}

.program-cost {
  color: #ffaa00;
  font-weight: bold;
  font-size: 10px;
}

.program-description {
  color: #00ff00;
  font-size: 10px;
  margin: 0 0 8px;
  opacity: 0.8;
  line-height: 1.3;
}

.program-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.stat {
  display: flex;
  gap: 4px;
  font-size: 9px;
}

.stat .label {
  opacity: 0.7;
}

.stat .value {
  font-weight: bold;
}

.enroll-btn {
  background: #001100;
  border-color: #00ff00;
}

.enroll-btn:disabled {
  border-color: #ff6600;
  color: #ff6600;
  cursor: not-allowed;
}

.select-crew-prompt {
  text-align: center;
  padding: 20px;
  color: #00ff00;
  opacity: 0.7;
  font-size: 10px;
}

.training-alert {
  position: fixed;
  top: 120px;
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

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>