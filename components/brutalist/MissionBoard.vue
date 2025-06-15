<template>
  <BrutalistPanel
    title="AVAILABLE CONTRACTS"
    :subtitle="`${missions.length} ACTIVE`"
  >
    <div class="mission-filters">
      <BrutalistSelect
        v-model="filterType"
        :options="missionTypes"
        placeholder="ALL TYPES"
      />
      <BrutalistSelect
        v-model="filterDifficulty"
        :options="difficultyLevels"
        placeholder="ALL DIFFICULTIES"
      />
      <BrutalistButton
        label="REFRESH"
        @click="$emit('refresh')"
      />
    </div>

    <div class="missions-list">
      <div
        v-for="mission in filteredMissions"
        :key="mission.id"
        class="mission-card"
        :class="`mission-${mission.priority}`"
      >
        <div class="mission-header">
          <span class="mission-type">[{{ mission.type }}]</span>
          <span class="mission-id">ID:{{ mission.id }}</span>
        </div>
        
        <div class="mission-title">
          {{ mission.title }}
        </div>
        
        <div class="mission-details">
          <div class="detail-row">
            <span class="detail-label">CLIENT:</span>
            <span class="detail-value">{{ mission.client }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">REWARD:</span>
            <span class="detail-value reward">{{ formatCredits(mission.reward) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DEADLINE:</span>
            <span class="detail-value deadline">{{ mission.deadline }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DIFFICULTY:</span>
            <span class="detail-value" :class="`difficulty-${mission.difficulty}`">
              {{ getDifficultyDisplay(mission.difficulty) }}
            </span>
          </div>
        </div>
        
        <div class="mission-description">
          {{ mission.description }}
        </div>
        
        <div class="mission-requirements" v-if="mission.requirements.length">
          <div class="requirements-header">REQUIREMENTS:</div>
          <ul class="requirements-list">
            <li
              v-for="(req, index) in mission.requirements"
              :key="index"
              :class="{ 'requirement-met': req.met }"
            >
              {{ req.text }}
            </li>
          </ul>
        </div>
        
        <div class="mission-actions">
          <BrutalistButton
            label="VIEW DETAILS"
            @click="$emit('view', mission.id)"
          />
          <BrutalistButton
            label="ACCEPT CONTRACT"
            :disabled="!canAcceptMission(mission)"
            variant="primary"
            @click="$emit('accept', mission.id)"
          />
        </div>
      </div>
      
      <div v-if="filteredMissions.length === 0" class="no-missions">
        NO MISSIONS MATCH CURRENT FILTERS
      </div>
    </div>
  </BrutalistPanel>
</template>

<script setup>
import { computed, ref } from 'vue'
import BrutalistPanel from './BrutalistPanel.vue'
import BrutalistSelect from './BrutalistSelect.vue'
import BrutalistButton from './BrutalistButton.vue'

const props = defineProps({
  missions: {
    type: Array,
    default: () => []
  },
  currentCapabilities: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['refresh', 'view', 'accept'])

const filterType = ref('')
const filterDifficulty = ref('')

const missionTypes = [
  { value: '', label: 'ALL TYPES' },
  { value: 'CARGO', label: 'CARGO TRANSPORT' },
  { value: 'PASSENGER', label: 'PASSENGER TRANSPORT' },
  { value: 'COMBAT', label: 'COMBAT OPERATION' },
  { value: 'EXPLORATION', label: 'EXPLORATION' },
  { value: 'SALVAGE', label: 'SALVAGE RECOVERY' },
  { value: 'DIPLOMATIC', label: 'DIPLOMATIC MISSION' }
]

const difficultyLevels = [
  { value: '', label: 'ALL DIFFICULTIES' },
  { value: 1, label: 'TRIVIAL' },
  { value: 2, label: 'EASY' },
  { value: 3, label: 'MODERATE' },
  { value: 4, label: 'HARD' },
  { value: 5, label: 'EXTREME' }
]

const filteredMissions = computed(() => {
  return props.missions.filter(mission => {
    if (filterType.value && mission.type !== filterType.value) return false
    if (filterDifficulty.value && mission.difficulty !== filterDifficulty.value) return false
    return true
  })
})

const formatCredits = (amount) => {
  return `¢${amount.toLocaleString()}`
}

const getDifficultyDisplay = (difficulty) => {
  const displays = {
    1: '◆◇◇◇◇',
    2: '◆◆◇◇◇',
    3: '◆◆◆◇◇',
    4: '◆◆◆◆◇',
    5: '◆◆◆◆◆'
  }
  return displays[difficulty] || '◇◇◇◇◇'
}

const canAcceptMission = (mission) => {
  return mission.requirements.every(req => req.met)
}
</script>

<style scoped>
.mission-filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #00ff00;
}

.missions-list {
  max-height: 600px;
  overflow-y: auto;
}

.mission-card {
  border: 1px solid #00ff00;
  margin-bottom: 8px;
  padding: 12px;
  background: #000000;
}

.mission-high {
  border-color: #ff0000;
  animation: priority-pulse 2s ease-in-out infinite;
}

.mission-medium {
  border-color: #ffff00;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.mission-type {
  color: #00ffff;
}

.mission-id {
  font-family: 'Courier New', monospace;
}

.mission-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.mission-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  padding: 8px;
  background: #001100;
  border: 1px dotted #003300;
}

.detail-row {
  display: flex;
  font-size: 11px;
}

.detail-label {
  opacity: 0.6;
  margin-right: 4px;
}

.detail-value {
  flex: 1;
  text-align: right;
}

.reward {
  color: #00ff00;
  font-weight: bold;
}

.deadline {
  color: #ffff00;
}

.difficulty-1 { color: #00ff00; }
.difficulty-2 { color: #88ff00; }
.difficulty-3 { color: #ffff00; }
.difficulty-4 { color: #ff8800; }
.difficulty-5 { color: #ff0000; }

.mission-description {
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
  opacity: 0.9;
}

.mission-requirements {
  margin-bottom: 8px;
}

.requirements-header {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #ffff00;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirements-list li {
  font-size: 11px;
  padding: 2px 0;
  padding-left: 16px;
  position: relative;
  color: #ff0000;
}

.requirements-list li::before {
  content: "✗";
  position: absolute;
  left: 0;
}

.requirement-met {
  color: #00ff00;
}

.requirement-met::before {
  content: "✓";
}

.mission-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px dotted #003300;
}

.no-missions {
  text-align: center;
  padding: 48px;
  opacity: 0.5;
  border: 1px dashed #003300;
}

@keyframes priority-pulse {
  0%, 100% { border-color: #ff0000; }
  50% { border-color: #660000; }
}
</style>