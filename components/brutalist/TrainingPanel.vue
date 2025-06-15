<template>
  <BrutalistPanel
    title="CREW TRAINING QUEUE"
    :subtitle="`${activeTrainings.length} ACTIVE`"
  >
    <div class="training-controls">
      <BrutalistSelect
        v-model="selectedCrewId"
        label="SELECT CREW MEMBER"
        :options="crewOptions"
        placeholder="-- NO SELECTION --"
      />
      
      <BrutalistSelect
        v-model="selectedSkill"
        label="TRAINING PROGRAM"
        :options="skillOptions"
        :disabled="!selectedCrewId"
        placeholder="-- SELECT SKILL --"
      />
      
      <BrutalistButton
        label="INITIATE TRAINING"
        :disabled="!canStartTraining"
        @click="startTraining"
      />
    </div>

    <div class="training-queue">
      <div class="queue-header">ACTIVE TRAINING SESSIONS:</div>
      
      <div v-if="activeTrainings.length === 0" class="empty-queue">
        NO ACTIVE TRAINING PROGRAMS
      </div>
      
      <div
        v-for="training in activeTrainings"
        :key="training.id"
        class="training-item"
      >
        <div class="training-info">
          <span class="crew-name">{{ training.crewName }}</span>
          <span class="skill-name">{{ training.skill }}</span>
          <span class="training-status">{{ getStatus(training) }}</span>
        </div>
        
        <BrutalistProgress
          :value="training.progress"
          :label="training.skill"
          :status="training.eta"
          :variant="getProgressVariant(training)"
        />
        
        <div class="training-actions">
          <BrutalistButton
            label="PAUSE"
            :disabled="training.paused"
            @click="$emit('pause', training.id)"
          />
          <BrutalistButton
            label="CANCEL"
            variant="danger"
            @click="$emit('cancel', training.id)"
          />
        </div>
      </div>
    </div>

    <div class="training-stats">
      <div class="stat-item">
        TOTAL SESSIONS: {{ totalSessions }}
      </div>
      <div class="stat-item">
        COMPLETION RATE: {{ completionRate }}%
      </div>
      <div class="stat-item">
        AVG TIME: {{ avgTrainingTime }}
      </div>
    </div>
  </BrutalistPanel>
</template>

<script setup>
import { computed } from 'vue'
import BrutalistPanel from './BrutalistPanel.vue'
import BrutalistSelect from './BrutalistSelect.vue'
import BrutalistButton from './BrutalistButton.vue'
import BrutalistProgress from './BrutalistProgress.vue'

const props = defineProps({
  crew: {
    type: Array,
    default: () => []
  },
  activeTrainings: {
    type: Array,
    default: () => []
  },
  availableSkills: {
    type: Array,
    default: () => [
      'BASIC_NAVIGATION',
      'ADVANCED_PILOTING',
      'REACTOR_MAINTENANCE',
      'WEAPONS_SYSTEMS',
      'DIPLOMATIC_PROTOCOL',
      'EMERGENCY_MEDICINE',
      'QUANTUM_MECHANICS',
      'XENOBIOLOGY'
    ]
  },
  stats: {
    type: Object,
    default: () => ({
      totalSessions: 0,
      completionRate: 0,
      avgTrainingTime: '0h'
    })
  }
})

const emit = defineEmits(['start', 'pause', 'cancel'])

const selectedCrewId = ref(null)
const selectedSkill = ref(null)

const crewOptions = computed(() => {
  return props.crew.map(member => ({
    value: member.id,
    label: `${member.name} [LVL ${member.level}]`,
    disabled: props.activeTrainings.some(t => t.crewId === member.id)
  }))
})

const skillOptions = computed(() => {
  return props.availableSkills.map(skill => ({
    value: skill,
    label: skill.replace(/_/g, ' ')
  }))
})

const canStartTraining = computed(() => {
  return selectedCrewId.value && selectedSkill.value
})

const totalSessions = computed(() => props.stats.totalSessions || 0)
const completionRate = computed(() => props.stats.completionRate || 0)
const avgTrainingTime = computed(() => props.stats.avgTrainingTime || '0h')

const startTraining = () => {
  emit('start', {
    crewId: selectedCrewId.value,
    skill: selectedSkill.value
  })
  selectedCrewId.value = null
  selectedSkill.value = null
}

const getStatus = (training) => {
  if (training.paused) return '[PAUSED]'
  if (training.progress >= 100) return '[COMPLETE]'
  if (training.progress < 25) return '[INITIALIZING]'
  return '[IN PROGRESS]'
}

const getProgressVariant = (training) => {
  if (training.paused) return 'warning'
  if (training.progress >= 100) return 'success'
  if (training.progress < 25) return 'default'
  return 'default'
}
</script>

<style scoped>
.training-controls {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #00ff00;
}

.training-queue {
  margin-bottom: 16px;
}

.queue-header {
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #00ff00;
}

.empty-queue {
  text-align: center;
  padding: 24px;
  opacity: 0.5;
  border: 1px dashed #003300;
}

.training-item {
  border: 1px solid #00ff00;
  padding: 8px;
  margin-bottom: 8px;
  background: #001100;
}

.training-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.crew-name {
  font-weight: bold;
}

.skill-name {
  color: #00ff00;
  opacity: 0.8;
}

.training-status {
  font-size: 11px;
  opacity: 0.6;
}

.training-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.training-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #00ff00;
}

.stat-item {
  text-align: center;
  font-size: 11px;
  color: #00ff00;
  opacity: 0.8;
}
</style>