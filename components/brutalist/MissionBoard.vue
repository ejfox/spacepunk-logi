<template>
  <BrutalistPanel title=" MISSION CONTROL // CONTRACT DATABASE" :subtitle="`${missions.length} ACTIVE CONTRACTS`">
    <div class="mission-filters">
      <BrutalistSelect v-model="filterType" :options="missionTypes" placeholder=" ALL TYPES" />
      <BrutalistSelect v-model="filterDifficulty" :options="difficultyLevels" placeholder=" ALL DIFFICULTIES" />
      <BrutalistButton label=" REFRESH" @click="$emit('refresh')" />
    </div>

    <div class="missions-list">
      <div v-for="mission in filteredMissions" :key="mission.id" class="mission-card"
        :class="`mission-${mission.priority}`">
        <div class="mission-header">
          <span class="mission-type">{{ getMissionTypeIcon(mission.type) }} {{ mission.type }}</span>
          <span class="mission-id">ID:{{ mission.id.slice(0, 8) }}</span>
        </div>

        <div class="mission-title">
          {{ mission.title }}
        </div>

        <div class="mission-details">
          <div class="detail-row">
            <span class="detail-label"> CLIENT:</span>
            <span class="detail-value">{{ mission.client }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"> REWARD:</span>
            <span class="detail-value reward">{{ formatCredits(mission.reward) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"> DEADLINE:</span>
            <span class="detail-value deadline">{{ formatDeadline(mission.deadline) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"> RISK:</span>
            <span class="detail-value" :class="`difficulty-${mission.difficulty}`">
              {{ getDifficultyDisplay(mission.difficulty) }}
            </span>
          </div>
        </div>

        <div class="mission-description narrative">
          {{ mission.description }}
        </div>

        <div class="mission-requirements" v-if="mission.requirements.length">
          <div class="requirements-header"> PREREQUISITES:</div>
          <ul class="requirements-list">
            <li v-for="(req, index) in mission.requirements" :key="index" :class="{ 'requirement-met': req.met }">
              <span class="req-icon">{{ req.met ? ' ' : ' ' }}</span>
              {{ req.text }}
            </li>
          </ul>
        </div>

        <div class="mission-actions">
          <BrutalistButton label=" VIEW DETAILS" @click="$emit('view', mission.id)" />
          <HoldToConfirm label=" ACCEPT CONTRACT" confirm-label=" CONTRACT CONFIRMED"
            :disabled="!canAcceptMission(mission)" :duration="5000" @confirm="$emit('accept', mission.id)" />
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
import HoldToConfirm from './HoldToConfirm.vue'

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
  return ` ¢${amount.toLocaleString()}`
}

const formatDeadline = (deadline) => {
  return ` ${deadline}`
}

const getMissionTypeIcon = (type) => {
  const icons = {
    'CARGO': '',
    'PASSENGER': '',
    'COMBAT': '',
    'EXPLORATION': '',
    'SALVAGE': '',
    'DIPLOMATIC': ''
  }
  return icons[type] || ''
}

const getDifficultyDisplay = (difficulty) => {
  const displays = {
    1: ' ◆◇◇◇◇',
    2: ' ◆◆◇◇◇',
    3: ' ◆◆◆◇◇',
    4: ' ◆◆◆◆◇',
    5: ' ◆◆◆◆◆'
  }
  return displays[difficulty] || ' ◇◇◇◇◇'
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
  border-bottom: 1px dashed #ffffff;
}

.missions-list {
  max-height: 600px;
  overflow-y: auto;
}

.mission-card {
  border: 1px solid #ffffff;
  margin-bottom: 8px;
  padding: 12px;
  background: #000000;
}

.mission-high {
  border-color: #ff0000;
  animation: priority-pulse 2s ease-in-out infinite;
}

.mission-medium {
  border-color: #ffaa00;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px dotted #333333;
}

.mission-type {
  color: #ffffff;
  font-family: var(--font-special);
  font-weight: 500;
  text-transform: uppercase;
}

.mission-id {
  font-family: var(--font-mono);
  opacity: 0.6;
  font-size: 10px;
}

.mission-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-family: var(--font-headers);
  color: #ffffff;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
}

.mission-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: #0a0a0a;
  border: 1px solid #333333;
  border-radius: 2px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  padding: 2px 0;
}

.detail-label {
  font-family: var(--font-special);
  opacity: 0.8;
  color: #cccccc;
  font-weight: 500;
}

.detail-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: #ffffff;
}

.reward {
  color: #00ff00;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 255, 0, 0.3);
}

.deadline {
  color: #ffaa00;
  font-weight: bold;
}

.difficulty-1 {
  color: #00ff00;
  font-family: var(--font-special);
}

.difficulty-2 {
  color: #88ff00;
}

.difficulty-3 {
  color: #ffaa00;
}

.difficulty-4 {
  color: #ff8800;
}

.difficulty-5 {
  color: #ff0000;
}

.mission-description {
  font-size: 9px;
  line-height: 1.4;
  margin-bottom: 12px;
  opacity: 0.85;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 2px solid #333333;
  font-style: italic;
}

.mission-requirements {
  margin-bottom: 8px;
}

.requirements-header {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #ffffff;
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
  border-top: 1px dotted #333333;
}

.no-missions {
  text-align: center;
  padding: 48px;
  opacity: 0.5;
  border: 1px dashed #333333;
}

@keyframes priority-pulse {

  0%,
  100% {
    border-color: #ff0000;
  }

  50% {
    border-color: #660000;
  }
}
</style>