<template>
  <div class="crew-overlay" v-if="visible" @click.self="handleBackdropClick">
    <div class="crew-container">
      <div class="crew-header">
        <span class="header-marker">></span>
        <span class="crew-title">CREW MANAGEMENT TERMINAL</span>
        <span class="crew-status">{{ currentCrew.length }}/{{ maxCrew }} PERSONNEL</span>
      </div>
      
      <!-- Current Crew Section -->
      <div class="crew-section">
        <div class="section-header">
          <span class="header-marker">></span>
          ACTIVE CREW ROSTER:
        </div>
        
        <div v-if="currentCrew.length === 0" class="empty-state">
          NO CREW ASSIGNED - HIRE PERSONNEL TO BEGIN OPERATIONS
        </div>
        
        <div v-else class="crew-grid">
          <CrewCard 
            v-for="member in currentCrew" 
            :key="member.id" 
            :crew-member="transformCrewMember(member)"
            :selected="selectedCrewId === member.id" 
            :show-actions="true" 
            @select="selectedCrewId = member.id"
            @assign="handleAssignCrew" 
            @details="handleCrewDetails" 
          />
        </div>
      </div>
      
      <!-- Available Crew Section -->
      <div class="crew-section">
        <div class="section-header">
          <span class="header-marker">></span>
          AVAILABLE FOR HIRE:
          <button 
            class="refresh-btn"
            @click="refreshAvailableCrew"
            :disabled="isLoading"
          >
            [REFRESH]
          </button>
        </div>
        
        <div v-if="isLoading" class="loading-state">
          SCANNING STATION PERSONNEL DATABASE...
        </div>
        
        <div v-else-if="availableCrew.length === 0" class="empty-state">
          NO QUALIFIED CANDIDATES AVAILABLE AT THIS STATION
        </div>
        
        <div v-else class="crew-grid">
          <CrewCard 
            v-for="candidate in availableCrew" 
            :key="candidate.id" 
            :crew-member="transformCandidate(candidate)"
            :show-actions="false" 
            @select="handleHireCrew(candidate)" 
          />
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div class="crew-footer">
        <div class="footer-info">
          <span v-if="selectedCrewId">CREW MEMBER SELECTED: {{ getSelectedCrewName() }}</span>
        </div>
        <div class="footer-actions">
          <button 
            class="confirm-button"
            @click="closeCrewManagement"
          >
            [CLOSE - ESC]
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CrewCard from './CrewCard.vue'

const emit = defineEmits(['close', 'crew-hired', 'crew-assigned'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  playerId: String
})

// Reactive state
const currentCrew = ref([])
const availableCrew = ref([])
const selectedCrewId = ref(null)
const isLoading = ref(false)
const maxCrew = ref(6)

// Sample crew data for testing
const sampleCurrentCrew = [
  {
    id: 'crew-001',
    name: 'Chen Rodriguez',
    role: 'Engineer',
    level: 3,
    experience: 2450,
    morale: 75,
    stress: 35,
    health: 90,
    traits: ['Handy', 'Coffee Addict', 'Detail Oriented'],
    currentTask: 'Engine Maintenance',
    available: true
  },
  {
    id: 'crew-002', 
    name: 'Alex Morrison',
    role: 'Pilot',
    level: 5,
    experience: 4200,
    morale: 85,
    stress: 20,
    health: 95,
    traits: ['Steady Hands', 'Navigator', 'Risk Taker'],
    currentTask: 'Navigation Planning',
    available: true
  }
]

const sampleAvailableCrew = [
  {
    id: 'hire-001',
    name: 'Jordan Kim',
    role: 'Security',
    level: 2,
    experience: 1200,
    morale: 70,
    stress: 40,
    health: 85,
    traits: ['Alert', 'Combat Training'],
    cost: 1500,
    available: true
  },
  {
    id: 'hire-002',
    name: 'Sam Torres',
    role: 'Medic',
    level: 4,
    experience: 3100,
    morale: 80,
    stress: 25,
    health: 100,
    traits: ['First Aid', 'Calm Under Pressure', 'Organized'],
    cost: 2500,
    available: true
  }
]

// Initialize with sample data
currentCrew.value = sampleCurrentCrew
availableCrew.value = sampleAvailableCrew

// Computed properties
const getSelectedCrewName = () => {
  if (!selectedCrewId.value) return ''
  const crew = currentCrew.value.find(c => c.id === selectedCrewId.value)
  return crew ? crew.name : ''
}

// Data transformation functions
function transformCrewMember(member) {
  return {
    ...member,
    id: member.id,
    name: member.name,
    role: member.role || 'Unassigned',
    level: member.level || 1,
    experience: member.experience || 0,
    morale: member.morale || 50,
    stress: member.stress || 0,
    health: member.health || 100,
    traits: member.traits || [],
    currentTask: member.currentTask || 'Idle',
    available: member.available !== false
  }
}

function transformCandidate(candidate) {
  return {
    ...candidate,
    id: candidate.id,
    name: candidate.name,
    role: candidate.role || 'Recruit',
    level: candidate.level || 1,
    experience: candidate.experience || 0,
    morale: candidate.morale || 50,
    stress: candidate.stress || 0,
    health: candidate.health || 100,
    traits: candidate.traits || [],
    currentTask: `Hiring Cost: ${candidate.cost || 1000} CR`,
    available: true
  }
}

// Action handlers
async function refreshAvailableCrew() {
  isLoading.value = true
  
  try {
    // In the future, this would call the backend API
    // const response = await fetch(`http://localhost:3666/api/crew/available`)
    // const data = await response.json()
    // availableCrew.value = data.crew || []
    
    // For now, simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Refresh with new sample data
    availableCrew.value = [
      ...sampleAvailableCrew,
      {
        id: 'hire-003',
        name: 'Taylor Swift',
        role: 'Communications',
        level: 3,
        experience: 1800,
        morale: 90,
        stress: 15,
        health: 95,
        traits: ['Diplomatic', 'Multilingual', 'Charismatic'],
        cost: 2000,
        available: true
      }
    ]
  } catch (error) {
    console.error('Failed to refresh available crew:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleHireCrew(candidate) {
  const cost = candidate.cost || 1000
  
  // In the future, this would call the backend API
  // const response = await fetch(`http://localhost:3666/api/crew/${candidate.id}/hire`, { method: 'POST' })
  
  // For now, simulate hiring
  currentCrew.value.push({
    ...candidate,
    id: `crew-${Date.now()}`,
    currentTask: 'Onboarding',
    cost: undefined // Remove cost from hired crew
  })
  
  // Remove from available crew
  availableCrew.value = availableCrew.value.filter(c => c.id !== candidate.id)
  
  emit('crew-hired', { candidate, cost })
}

function handleAssignCrew(crewId) {
  const crew = currentCrew.value.find(c => c.id === crewId)
  if (crew) {
    // In the future, this would open an assignment dialog
    emit('crew-assigned', crew)
  }
}

function handleCrewDetails(crewId) {
  const crew = currentCrew.value.find(c => c.id === crewId)
  if (crew) {
    selectedCrewId.value = crewId
    // In the future, this could open a detailed crew info modal
  }
}

function closeCrewManagement() {
  emit('close')
  selectedCrewId.value = null
}

function handleBackdropClick() {
  closeCrewManagement()
}

function handleKeyDown(event) {
  if (!props.visible) return
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeCrewManagement()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Monochromatic Base - No decorative colors */
.crew-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Courier New', monospace;
}

.crew-container {
  background: #000000;
  border: 2px solid #ffffff;
  max-width: 90%;
  width: 1200px;
  max-height: 90%;
  overflow-y: auto;
  color: #ffffff;
  display: flex;
  flex-direction: column;
}

/* Header Section */
.crew-header {
  background: #111111;
  border-bottom: 2px solid #ffffff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-marker {
  color: #ffffff;
  font-weight: bold;
}

.crew-title {
  font-weight: bold;
  font-size: 14px;
  flex: 1;
}

.crew-status {
  font-size: 12px;
  color: #aaaaaa;
}

/* Section Headers */
.crew-section {
  padding: 16px;
  border-bottom: 1px solid #333333;
}

.section-header {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 16px;
  border-bottom: 1px solid #333333;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  margin-left: auto;
}

.refresh-btn:hover:not(:disabled) {
  background: #ffffff;
  color: #000000;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Grid Layout */
.crew-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* State Messages */
.empty-state {
  padding: 32px;
  text-align: center;
  color: #666666;
  font-size: 12px;
  border: 1px dashed #333333;
  background: #050505;
}

.loading-state {
  padding: 32px;
  text-align: center;
  color: #ffffff;
  font-size: 12px;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

/* Footer Section */
.crew-footer {
  border-top: 2px solid #ffffff;
  padding: 16px;
  background: #111111;
  margin-top: auto;
}

.footer-info {
  font-size: 11px;
  color: #aaaaaa;
  margin-bottom: 8px;
  text-align: center;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-button {
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}

.confirm-button:hover {
  background: #ffffff;
  color: #000000;
}
</style>