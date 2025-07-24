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
          <div class="crew-tabs">
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'roster' }"
              @click="activeTab = 'roster'"
            >
              [ROSTER]
            </button>
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'dynamics' }"
              @click="activeTab = 'dynamics'"
              :disabled="currentCrew.length < 2"
            >
              [DYNAMICS]
            </button>
          </div>
        </div>
        
        <div v-if="currentCrew.length === 0" class="empty-state">
          NO CREW ASSIGNED - HIRE PERSONNEL TO BEGIN OPERATIONS
        </div>
        
        <div v-else-if="activeTab === 'roster'" class="crew-roster-section">
          <div class="crew-grid">
            <div v-for="crew in currentCrew" :key="crew.id" class="crew-item">
              <PixiCrewAvatar
                :crew-id="crew.id"
                :crew-data="crew"
                :avatar-size="64"
                :show-details="true"
                @click="handleCrewSelected(crew)"
              />
            </div>
          </div>
        </div>
        
        <div v-else-if="activeTab === 'dynamics'" class="dynamics-view">
          <CrewRelationshipMatrix 
            :crew-members="currentCrew"
            :relationships="crewRelationships"
          />
          
          <!-- Team Performance Analytics -->
          <div class="team-analytics">
            <div class="analytics-header">
              <span class="header-marker">></span>
              TEAM PERFORMANCE ANALYTICS
            </div>
            <div class="analytics-grid">
              <div class="analytics-card">
                <div class="card-title">OPERATIONAL EFFICIENCY</div>
                <div class="card-value">{{ getTeamEfficiency() }}%</div>
                <div class="card-trend">{{ getEfficiencyTrend() }}</div>
              </div>
              <div class="analytics-card">
                <div class="card-title">SKILL COVERAGE</div>
                <div class="card-value">{{ getSkillCoverage() }}%</div>
                <div class="card-trend">{{ getCoverageTrend() }}</div>
              </div>
              <div class="analytics-card">
                <div class="card-title">RETENTION RISK</div>
                <div class="card-value">{{ getRetentionRisk() }}%</div>
                <div class="card-trend">{{ getRetentionTrend() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Available Crew Section -->
      <div class="crew-section">
        <div class="section-header">
          <span class="header-marker">></span>
          AVAILABLE FOR HIRE:
          <div class="crew-controls">
            <input 
              v-model="searchTerm" 
              class="search-input" 
              placeholder="SEARCH NAME..."
              maxlength="20"
            />
            <select v-model="sortBy" class="sort-select">
              <option value="cost">SORT: COST</option>
              <option value="experience">SORT: EXP</option>
              <option value="name">SORT: NAME</option>
              <option value="skills">SORT: SKILLS</option>
            </select>
            <select v-model="filterRole" class="filter-select">
              <option value="all">ALL ROLES</option>
              <option value="Engineering">ENGINEERING</option>
              <option value="Navigation">NAVIGATION</option>
              <option value="Communications">COMMS</option>
              <option value="Security">SECURITY</option>
              <option value="Systems">SYSTEMS</option>
            </select>
            <button 
              class="refresh-btn"
              @click="refreshAvailableCrew"
              :disabled="isLoading"
            >
              [REFRESH]
            </button>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading-state">
          SCANNING STATION PERSONNEL DATABASE...
        </div>
        
        <div v-else-if="availableCrew.length === 0" class="empty-state">
          NO QUALIFIED CANDIDATES AVAILABLE AT THIS STATION
        </div>
        
        <div v-else class="candidate-grid">
          <div v-for="candidate in filteredAndSortedCrew" :key="candidate.id" class="candidate-card">
            <div class="candidate-avatar">
              <PixiCrewAvatar
                :crew-id="candidate.id"
                :crew-data="candidate"
                :avatar-size="64"
                :show-details="true"
                @avatar-ready="onCandidateAvatarReady"
                @status-change="onCandidateStatusChange"
              />
            </div>
            <div class="candidate-info">
              <div class="candidate-name">{{ candidate.name }}</div>
              <div class="candidate-role">{{ candidate.role }}</div>
              <div class="candidate-cost">{{ candidate.cost || 1000 }} CR</div>
              <div class="candidate-skills">
                <span v-for="(value, skill) in candidate.skills" :key="skill" class="skill-indicator">
                  {{ skill.slice(0,3).toUpperCase() }}:{{ value }}
                </span>
              </div>
              <button 
                class="hire-button"
                @click="handleHireCrew(candidate)"
                :disabled="currentCrew.length >= maxCrew"
              >
                [HIRE]
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="filteredAndSortedCrew.length === 0 && availableCrew.length > 0" class="empty-state">
          NO CANDIDATES MATCH CURRENT FILTERS
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div class="crew-footer">
        <div class="footer-info">
          <div v-if="selectedCrewId" class="selected-info">
            CREW MEMBER SELECTED: {{ getSelectedCrewName() }}
          </div>
          <div class="stats-info">
            SHOWING: {{ filteredAndSortedCrew.length }}/{{ availableCrew.length }} CANDIDATES
            <span v-if="filteredAndSortedCrew.length > 0">
              | TOTAL COST: {{ totalHiringCost }} CR
            </span>
          </div>
        </div>
        <div class="footer-actions">
          <button 
            class="confirm-button"
            @click="closeCrewManagement"
          >
            [CLOSE - ESC]
          </button>
          <div class="hotkey-info">
            HOTKEYS: R=REFRESH | F=SEARCH | 1-4=SORT
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CrewCard from './CrewCard.vue'
import CrewRelationshipMatrix from './CrewRelationshipMatrix.vue'
import PixiCrewAvatar from './PixiCrewAvatar.vue'
import Chance from 'chance'

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
const sortBy = ref('cost')
const sortDirection = ref('asc')
const searchTerm = ref('')
const filterRole = ref('all')
const filterHomeworld = ref('all')
const activeTab = ref('roster')
const crewRelationships = ref({})

// Generate procedural crew data with fallback
async function loadCrewData() {
  isLoading.value = true
  try {
    // Try to fetch from backend first
    try {
      const currentResponse = await fetch(`http://localhost:3666/api/crew/current/${props.playerId}`)
      if (currentResponse.ok) {
        currentCrew.value = await currentResponse.json()
      }
      
      const availableResponse = await fetch('http://localhost:3666/api/crew/available')
      if (availableResponse.ok) {
        availableCrew.value = await availableResponse.json()
      }
    } catch (apiError) {
      console.log('API not available, using procedural generation')
      // Fallback to procedural generation
      generateFallbackCrew()
    }
  } catch (error) {
    console.error('Failed to load crew data:', error)
    // Always have fallback crew available
    generateFallbackCrew()
  } finally {
    isLoading.value = false
  }
}

// Fallback procedural crew generation
function generateFallbackCrew() {
  // Set empty current crew (new ship)
  currentCrew.value = []
  
  // Generate available crew with corporate flavor
  availableCrew.value = [
    {
      id: 'crew-001',
      name: 'Chen Martinez',
      role: 'Engineering Technician',
      level: 2,
      experience: 850,
      morale: 75,
      stress: 25,
      health: 90,
      skills: { engineering: 65, social: 45, piloting: 30, combat: 20 },
      traits: ['Handy With Tools', 'Detail Oriented'],
      cost: 1200,
      homeworld: 'Mars Industrial Complex',
      employment_notes: 'Former maintenance supervisor. Laid off due to "efficiency restructuring."',
      backstory: 'Spent 8 years keeping life support running on asteroid mining platforms. Has seen enough broken equipment to fix anything with spare parts and spite.'
    },
    {
      id: 'crew-002', 
      name: 'Alex Singh',
      role: 'Navigation Specialist',
      level: 3,
      experience: 1450,
      morale: 60,
      stress: 40,
      health: 85,
      skills: { piloting: 70, engineering: 40, social: 55, combat: 35 },
      traits: ['Steady Hands', 'Void Touched'],
      cost: 1800,
      homeworld: 'Europa Research Station',
      employment_notes: 'Previous employer cited "concerning behavioral modifications" in termination paperwork.',
      backstory: 'Deep space navigation expert who spent too long in the void between stars. Still the best pilot you can afford, just... talks to empty space sometimes.'
    },
    {
      id: 'crew-003',
      name: 'Riley Thompson',
      role: 'Communications Officer', 
      level: 1,
      experience: 320,
      morale: 85,
      stress: 15,
      health: 95,
      skills: { social: 60, engineering: 25, piloting: 40, combat: 25 },
      traits: ['Good With People', 'Team Player'],
      cost: 800,
      homeworld: 'Earth Corporate District 7',
      employment_notes: 'Fresh graduate from Corporate Communications Academy. Eager to prove value.',
      backstory: 'Young, enthusiastic, and still believes corporate slogans about "synergistic growth opportunities." Give it six months.'
    },
    {
      id: 'crew-004',
      name: 'Dr. Sam Okafor',
      role: 'Systems Analyst',
      level: 4,
      experience: 2100,
      morale: 45,
      stress: 60,
      health: 70,
      skills: { engineering: 85, social: 30, piloting: 20, combat: 15 },
      traits: ['Caffeinated Beyond Reason', 'Systems Intuition', 'Detail Oriented'],
      cost: 2500,
      homeworld: 'Titan Research Collective',
      employment_notes: 'Terminated for "unauthorized system modifications" and "excessive caffeine requisitions."',
      backstory: 'Brilliant systems engineer who hasn\'t slept properly in three years. Can fix anything, but might accidentally improve it beyond recognition.'
    },
    {
      id: 'crew-005',
      name: 'Morgan Vale',
      role: 'Security Specialist',
      level: 3,
      experience: 1600,
      morale: 70,
      stress: 35,
      health: 100,
      skills: { combat: 75, engineering: 45, social: 50, piloting: 55 },
      traits: ['Works Well Under Pressure', 'Lucky Streak'],
      cost: 1900,
      homeworld: 'Asteroid Belt Security Zone',
      employment_notes: 'Contract completed successfully. Available for immediate deployment.',
      backstory: 'Former corporate security with an inexplicable ability to be in the right place at the right time. Somehow always has exactly the right tool for the job.'
    }
  ]
}

// Computed properties for filtering and sorting
const filteredAndSortedCrew = computed(() => {
  let filtered = availableCrew.value
  
  // Search filter
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(crew => 
      crew.name.toLowerCase().includes(search) ||
      crew.homeworld.toLowerCase().includes(search)
    )
  }
  
  // Role filter
  if (filterRole.value !== 'all') {
    filtered = filtered.filter(crew => 
      crew.role.toLowerCase().includes(filterRole.value.toLowerCase())
    )
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy.value) {
      case 'cost':
        aVal = a.cost || 0
        bVal = b.cost || 0
        break
      case 'experience':
        aVal = a.experience || 0
        bVal = b.experience || 0
        break
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'skills':
        aVal = Object.values(a.skills || {}).reduce((sum, val) => sum + val, 0)
        bVal = Object.values(b.skills || {}).reduce((sum, val) => sum + val, 0)
        break
      default:
        return 0
    }
    
    if (sortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  return filtered
})

const getSelectedCrewName = () => {
  if (!selectedCrewId.value) return ''
  const crew = currentCrew.value.find(c => c.id === selectedCrewId.value)
  return crew ? crew.name : ''
}

const totalHiringCost = computed(() => {
  return filteredAndSortedCrew.value.reduce((sum, crew) => sum + (crew.cost || 0), 0)
})

const availableRoles = computed(() => {
  const roles = new Set(availableCrew.value.map(crew => crew.role.split(' ')[0]))
  return Array.from(roles).sort()
})

// Team analytics computed properties
const getTeamEfficiency = () => {
  if (currentCrew.value.length === 0) return 0
  const avgHealth = currentCrew.value.reduce((sum, crew) => sum + (crew.health || 100), 0) / currentCrew.value.length
  const avgMorale = currentCrew.value.reduce((sum, crew) => sum + (crew.morale || 75), 0) / currentCrew.value.length
  const avgStress = currentCrew.value.reduce((sum, crew) => sum + (crew.stress || 25), 0) / currentCrew.value.length
  return Math.round((avgHealth + avgMorale + (100 - avgStress)) / 3)
}

const getSkillCoverage = () => {
  if (currentCrew.value.length === 0) return 0
  const skillTypes = ['engineering', 'social', 'piloting', 'combat']
  let coverage = 0
  skillTypes.forEach(skill => {
    const maxSkill = Math.max(...currentCrew.value.map(crew => crew.skills?.[skill] || 0))
    coverage += Math.min(100, maxSkill)
  })
  return Math.round(coverage / 4)
}

const getRetentionRisk = () => {
  if (currentCrew.value.length === 0) return 0
  const highRiskCrew = currentCrew.value.filter(crew => 
    (crew.morale || 75) < 40 || (crew.stress || 25) > 70
  ).length
  return Math.round((highRiskCrew / currentCrew.value.length) * 100)
}

const getEfficiencyTrend = () => {
  return Math.random() > 0.5 ? '↗ IMPROVING' : '↘ DECLINING'
}

const getCoverageTrend = () => {
  return Math.random() > 0.5 ? '→ STABLE' : '↗ EXPANDING'
}

const getRetentionTrend = () => {
  return Math.random() > 0.5 ? '↘ DECREASING' : '↗ INCREASING'
}

// LLM-powered candidate generation
async function generateLLMCandidate(id) {
  try {
    const response = await fetch('http://localhost:3666/api/crew/generate-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'spacepunk_corporate_dystopia',
        seed: id
      })
    })
    
    if (response.ok) {
      const candidate = await response.json()
      return {
        id,
        name: candidate.name || await generateRandomName(),
        role: candidate.role || getRandomRole(),
        level: candidate.level || Math.floor(Math.random() * 3) + 1,
        experience: candidate.experience || Math.floor(Math.random() * 2000),
        morale: candidate.morale || Math.floor(Math.random() * 40) + 60,
        stress: candidate.stress || Math.floor(Math.random() * 30) + 10,
        health: candidate.health || Math.floor(Math.random() * 20) + 80,
        skills: candidate.skills || generateRandomSkills(),
        traits: candidate.traits || generateRandomTraits(),
        cost: candidate.cost || Math.floor(Math.random() * 1500) + 800,
        homeworld: candidate.homeworld || getRandomHomeworld(),
        employment_notes: candidate.employment_notes || await getRandomEmploymentNote(),
        backstory: candidate.backstory || 'LLM generation failed - basic crew member.'
      }
    }
  } catch (error) {
    console.log('LLM candidate generation failed, using fallback')
  }
  
  // Fallback to basic generation
  return {
    id,
    name: await generateRandomName(),
    role: getRandomRole(),
    level: Math.floor(Math.random() * 3) + 1,
    experience: Math.floor(Math.random() * 2000),
    morale: Math.floor(Math.random() * 40) + 60,
    stress: Math.floor(Math.random() * 30) + 10,
    health: Math.floor(Math.random() * 20) + 80,
    skills: generateRandomSkills(),
    traits: generateRandomTraits(),
    cost: Math.floor(Math.random() * 1500) + 800,
    homeworld: getRandomHomeworld(),
    employment_notes: await getRandomEmploymentNote(),
    backstory: 'A spacer seeking new opportunities.'
  }
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
  const totalSkills = Object.values(candidate.skills || {}).reduce((sum, val) => sum + val, 0)
  const skillRating = totalSkills > 240 ? 'EXPERT' : totalSkills > 180 ? 'SKILLED' : totalSkills > 120 ? 'COMPETENT' : 'BASIC'
  
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
    currentTask: `${skillRating} | ${candidate.cost || 1000} CR | ${candidate.homeworld || 'Unknown Origin'}`,
    available: true,
    skills: candidate.skills || { engineering: 0, social: 0, piloting: 0, combat: 0 }
  }
}

// Action handlers
async function refreshAvailableCrew() {
  isLoading.value = true
  
  try {
    // Try API first
    try {
      const response = await fetch(`http://localhost:3666/api/crew/available`)
      if (response.ok) {
        const data = await response.json()
        availableCrew.value = data.crew || data || []
        return
      }
    } catch (apiError) {
      console.log('API refresh failed, generating new candidates')
    }
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Generate new candidates with LLM integration
    const newCandidates = await Promise.all([
      generateLLMCandidate(`crew-${Date.now()}-1`),
      generateLLMCandidate(`crew-${Date.now()}-2`)
    ])
    
    // Replace some existing crew with new ones
    availableCrew.value = [...availableCrew.value.slice(0, 3), ...newCandidates]
    
  } catch (error) {
    console.error('Failed to refresh available crew:', error)
  } finally {
    isLoading.value = false
  }
}

// Helper functions for procedural generation
async function generateRandomName() {
  // Try LLM first, fallback to chance.js if needed
  try {
    const response = await fetch('http://localhost:3666/api/crew/generate-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'spacepunk_corporate_employee',
        seed: Date.now()
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.name || generateFallbackName()
    }
  } catch (error) {
    console.log('LLM name generation failed, using fallback')
  }
  
  return generateFallbackName()
}

function generateFallbackName() {
  const chance = new Chance(Date.now() + Math.random())
  const corporateFirstNames = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor']
  const spacerLastNames = ['Chen', 'Singh', 'Martinez', 'Thompson', 'Okafor', 'Vale']
  return `${chance.pickone(corporateFirstNames)} ${chance.pickone(spacerLastNames)}`
}

function getRandomRole() {
  const roles = ['Engineering Tech', 'Navigation Spec', 'Communications', 'Systems Analyst', 'Security', 'Maintenance']
  return roles[Math.floor(Math.random() * roles.length)]
}

function generateRandomSkills() {
  const chance = new Chance(Date.now() + Math.random())
  
  // Generate realistic skill distributions
  const totalPoints = chance.integer({ min: 120, max: 280 })
  const skills = {
    engineering: chance.integer({ min: 10, max: 90 }),
    social: chance.integer({ min: 10, max: 90 }),
    piloting: chance.integer({ min: 10, max: 90 }),
    combat: chance.integer({ min: 10, max: 90 })
  }
  
  // Normalize to target total while keeping individual constraints
  const currentTotal = Object.values(skills).reduce((sum, val) => sum + val, 0)
  const scaleFactor = totalPoints / currentTotal
  
  Object.keys(skills).forEach(skill => {
    skills[skill] = Math.max(5, Math.min(95, Math.round(skills[skill] * scaleFactor)))
  })
  
  return skills
}

function generateRandomTraits() {
  const chance = new Chance(Date.now() + Math.random())
  
  const corporateTraits = [
    'Handy With Tools', 'Good With People', 'Steady Hands', 'Quick Learner', 
    'Team Player', 'Detail Oriented', 'Works Well Under Pressure', 'Follows Protocol',
    'Efficiency Focused', 'Safety Conscious', 'Documentation Compliant', 'Deadline Oriented'
  ]
  
  const rareCorporateTraits = [
    'Caffeinated Beyond Reason', 'Bureaucracy Whisperer', 'Systems Intuition',
    'Corporate Stockholm Syndrome', 'Void Touched', 'Numbers Person'
  ]
  
  const traits = []
  const numTraits = chance.weighted([1, 2, 3], [20, 60, 20]) // Weighted distribution
  
  for (let i = 0; i < numTraits; i++) {
    // 5% chance for rare traits
    if (chance.bool({ likelihood: 5 }) && rareCorporateTraits.length > 0) {
      const rareTrait = chance.pickone(rareCorporateTraits)
      if (!traits.includes(rareTrait)) {
        traits.push(rareTrait)
      }
    } else {
      const commonTrait = chance.pickone(corporateTraits)
      if (!traits.includes(commonTrait)) {
        traits.push(commonTrait)
      }
    }
  }
  
  return traits
}

function getRandomHomeworld() {
  const chance = new Chance(Date.now() + Math.random())
  
  const coreWorlds = [
    'Earth Corporate District 7', 'Mars Industrial Complex', 'Europa Research Station',
    'Titan Mining Collective', 'Luna Corporate Headquarters', 'Ceres Trading Hub'
  ]
  
  const outerWorlds = [
    'Asteroid Belt Mining Platform', 'Deep Space Refinery', 'Outer System Patrol Base',
    'Independent Trading Post', 'Frontier Settlement', 'Nomad Fleet Born'
  ]
  
  const exoticOrigins = [
    'Generation Ship Descendant', 'Void Station Survivor', 'Corporate Lab Escapee',
    'Time Dilation Facility', 'Quantum Research Outpost', 'Reality Anchor Station'
  ]
  
  // Weighted selection: 60% core, 35% outer, 5% exotic
  const category = chance.weighted(['core', 'outer', 'exotic'], [60, 35, 5])
  
  switch (category) {
    case 'core': return chance.pickone(coreWorlds)
    case 'outer': return chance.pickone(outerWorlds)
    case 'exotic': return chance.pickone(exoticOrigins)
    default: return chance.pickone(coreWorlds)
  }
}

async function getRandomEmploymentNote() {
  // Use LLM for authentic corporate HR speak
  try {
    const response = await fetch('http://localhost:3666/api/crew/generate-employment-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'corporate_hr_termination_euphemism',
        tone: Math.random() > 0.8 ? 'suspicious' : Math.random() > 0.5 ? 'neutral' : 'positive'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.note || 'Employment status: Available for immediate assignment.'
    }
  } catch (error) {
    console.log('LLM employment note generation failed, using fallback')
  }
  
  // Fallback to basic corporate speak
  const chance = new Chance(Date.now() + Math.random())
  const fallbacks = [
    'Contract completed successfully.',
    'Seeking new opportunities.',
    'Former employer downsized.',
    'Previous employer citing "philosophical differences."'
  ]
  return chance.pickone(fallbacks)
}

async function handleHireCrew(candidate) {
  if (currentCrew.value.length >= maxCrew.value) {
    alert('CREW MANIFEST FULL - Cannot exceed maximum crew capacity')
    return
  }
  
  const cost = candidate.cost || 1000
  
  // Simple confirmation with cost breakdown
  const totalSkills = Object.values(candidate.skills || {}).reduce((sum, val) => sum + val, 0)
  const confirmMsg = `HIRE CREW MEMBER?\n\n` +
    `NAME: ${candidate.name}\n` +
    `ROLE: ${candidate.role}\n` +
    `TOTAL SKILLS: ${totalSkills}\n` +
    `EMPLOYMENT COST: ${cost} CR\n\n` +
    `${candidate.employment_notes || 'Standard employment contract.'}\n\n` +
    `CONFIRM HIRING?`
    
  if (!confirm(confirmMsg)) {
    return
  }
  
  try {
    // Try API call first
    try {
      const response = await fetch(`http://localhost:3666/api/crew/${candidate.id}/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: props.playerId, cost })
      })
      
      if (response.ok) {
        const result = await response.json()
        // API handled the hiring, just update local state
        currentCrew.value = result.currentCrew || [...currentCrew.value, { ...candidate, currentTask: 'Onboarding' }]
        availableCrew.value = availableCrew.value.filter(c => c.id !== candidate.id)
        emit('crew-hired', { candidate, cost })
        return
      }
    } catch (apiError) {
      console.log('API hire failed, using local simulation')
    }
    
    // Fallback to local simulation
    const newCrewMember = {
      ...candidate,
      id: `crew-${Date.now()}`,
      currentTask: 'Onboarding - Reviewing safety protocols',
      cost: undefined, // Remove cost from hired crew
      hire_date: new Date().toISOString(),
      status: 'active'
    }
    
    currentCrew.value.push(newCrewMember)
    
    // Remove from available crew
    availableCrew.value = availableCrew.value.filter(c => c.id !== candidate.id)
    
    emit('crew-hired', { candidate, cost })
    
  } catch (error) {
    console.error('Failed to hire crew:', error)
    alert('HIRING FAILED - Please contact station administration')
  }
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

function handleCrewSelected(crewId) {
  selectedCrewId.value = crewId
  // Could trigger additional crew selection logic
}

function handleStatusAlert(alert) {
  // Handle status alerts from the Flipper display
  console.log('Crew status alert:', alert)
  // Could show notifications or update UI based on alert
}

function onCandidateAvatarReady(app) {
  // Handle candidate avatar ready
  console.log('Candidate avatar ready')
}

function onCandidateStatusChange(change) {
  // Handle candidate status changes
  console.log('Candidate status change:', change)
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
    case 'r':
    case 'R':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        refreshAvailableCrew()
      }
      break
    case 'f':
    case 'F':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        // Focus search input
        const searchInput = document.querySelector('.search-input')
        if (searchInput) searchInput.focus()
      }
      break
    case '1':
      event.preventDefault()
      sortBy.value = 'cost'
      break
    case '2':
      event.preventDefault()
      sortBy.value = 'experience'
      break
    case '3':
      event.preventDefault()
      sortBy.value = 'skills'
      break
    case '4':
      event.preventDefault()
      sortBy.value = 'name'
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  // Load crew data when component mounts
  if (props.visible) {
    loadCrewData()
  }
})

// Watch for visibility changes to load data
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadCrewData()
  }
}, { immediate: true })

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

/* Controls styling */
.crew-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.search-input {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 10px;
  width: 120px;
}

.search-input::placeholder {
  color: #666666;
}

.sort-select,
.filter-select {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 2px 4px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.sort-select option,
.filter-select option {
  background: #000000;
  color: #ffffff;
}

.refresh-btn {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
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

.crew-flipper-section {
  background: #0a0a0a;
  border: 1px solid #333333;
  padding: 12px;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.candidate-card {
  background: #0a0a0a;
  border: 1px solid #333333;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.candidate-avatar {
  display: flex;
  justify-content: center;
}

.candidate-info {
  text-align: center;
  width: 100%;
}

.candidate-name {
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
}

.candidate-role {
  font-size: 9px;
  color: #888888;
  margin-bottom: 4px;
}

.candidate-cost {
  font-size: 10px;
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 8px;
}

.candidate-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}

.skill-indicator {
  font-size: 8px;
  color: #ffffff;
  background: #333333;
  padding: 2px 4px;
  border: 1px solid #555555;
}

.hire-button {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hire-button:hover:not(:disabled) {
  background: #ffffff;
  color: #000000;
}

.hire-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.selected-info {
  margin-bottom: 4px;
  font-weight: bold;
}

.stats-info {
  font-size: 10px;
  opacity: 0.8;
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

.hotkey-info {
  font-size: 9px;
  color: #666666;
  text-align: center;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

/* Crew tabs styling */
.crew-tabs {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.tab-button {
  background: #000000;
  border: 1px solid #333333;
  color: #888888;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover:not(:disabled) {
  border-color: #ffffff;
  color: #ffffff;
}

.tab-button.active {
  background: #ffffff;
  color: #000000;
  border-color: #ffffff;
}

.tab-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Dynamics view styling */
.dynamics-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Team analytics styling */
.team-analytics {
  background: #0a0a0a;
  border: 1px solid #333333;
  padding: 12px;
}

.analytics-header {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid #333333;
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.analytics-card {
  background: #000000;
  border: 1px solid #444444;
  padding: 8px;
  text-align: center;
}

.card-title {
  font-size: 8px;
  color: #888888;
  margin-bottom: 4px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 18px;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 2px;
  font-family: 'MonaspiceNe Nerd Font', 'MonaspiceNe', monospace;
}

.card-trend {
  font-size: 7px;
  color: #666666;
  font-style: italic;
}
</style>