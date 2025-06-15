<template>
  <div class="spacepunk-interface">
    <!-- Server Status Bar -->
    <div class="status-bar">
      <span>[SPACEPUNK LOGISTICS v0.1]</span>
      <span v-if="serverStatus">TICK: {{ serverStatus.currentTick }}</span>
      <span v-if="serverStatus" class="connection-indicator" :class="connectionStatus">
        {{ connectionStatus.toUpperCase() }}
      </span>
    </div>

    <!-- Main Game Interface -->
    <div v-if="!player" class="login-screen">
      <h1>SPACEPUNK LOGISTICS SIMULATION</h1>
      <p>Ship Management Software v1.3.7 (Enterprise Edition)</p>
      <form @submit.prevent="createPlayer" class="login-form">
        <label>CAPTAIN USERNAME:</label>
        <input v-model="username" type="text" required>
        <label>EMAIL:</label>
        <input v-model="email" type="email" required>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'INITIALIZING...' : 'BEGIN COMMAND' }}
        </button>
      </form>
    </div>

    <!-- Ship Command Interface -->
    <div v-else class="command-interface">
      <!-- Captain Info -->
      <div class="section">
        <h2>COMMAND STATUS</h2>
        <p>CAPTAIN: {{ player.username }}</p>
        <p>DEATHS: {{ player.deaths }}</p>
        <p>ACTIVE SINCE: {{ formatDate(player.created_at) }}</p>
        <p>SOFTWARE LICENSE: {{ softwareLicense }}</p>
      </div>

      <!-- Ship Status -->
      <div v-if="ship" class="section">
        <h2>SHIP STATUS</h2>
        <p>VESSEL: {{ ship.name }}</p>
        <p>HULL: {{ ship.hull_type }}</p>
        <p>LOCATION: {{ ship.location_station }}, {{ ship.location_galaxy }}</p>
        <p>FUEL: {{ ship.fuel_current }}/{{ ship.fuel_max }}</p>
        <p>CARGO: {{ ship.cargo_used }}/{{ ship.cargo_max }}</p>
        <p>STATUS: {{ ship.status.toUpperCase() }}</p>
      </div>

      <!-- Dynamic Tab System -->
      <div class="section">
        <h2>SHIP OPERATIONS</h2>
        <div class="command-buttons">
          <button 
            v-for="tab in availableTabs" 
            :key="tab.id"
            @click="activeTab = tab.id" 
            :class="{ active: activeTab === tab.id }"
            :disabled="!tab.unlocked"
          >
            {{ tab.label }}
            <span v-if="!tab.unlocked" class="locked-indicator">[LOCKED]</span>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Crew Management Tab -->
        <div v-if="activeTab === 'crew'" class="tab-panel">
          <BrutalistPanel title="CREW MANIFEST" :subtitle="`${crew.length} ACTIVE`">
            <div v-if="crew.length === 0" class="empty-state">
              NO CREW ASSIGNED - HIRE PERSONNEL TO BEGIN OPERATIONS
            </div>
            
            <div v-else class="crew-grid">
              <CrewCard
                v-for="member in crew"
                :key="member.id"
                :crewMember="transformCrewMember(member)"
                :selected="selectedCrewId === member.id"
                :showActions="true"
                @select="selectedCrewId = member.id"
                @assign="assignCrewMember"
                @details="viewCrewDetails"
              />
            </div>

            <div class="crew-actions">
              <BrutalistButton
                label="HIRE NEW CREW"
                @click="showHiring = !showHiring"
                :variant="showHiring ? 'warning' : 'default'"
              />
            </div>
            
            <div v-if="showHiring" class="hiring-interface">
              <h3>AVAILABLE PERSONNEL</h3>
              <div v-if="availableCrew.length === 0" class="empty-state">
                NO CANDIDATES AVAILABLE AT THIS STATION
              </div>
              <div v-else class="crew-grid">
                <CrewCard
                  v-for="candidate in availableCrew"
                  :key="candidate.id"
                  :crewMember="transformCandidate(candidate)"
                  :showActions="false"
                  @select="hireCrew(candidate.id)"
                />
              </div>
            </div>
          </BrutalistPanel>
        </div>

        <!-- Market Trading Tab -->
        <div v-if="activeTab === 'market'" class="tab-panel">
          <MarketTerminal />
        </div>

        <!-- Ship's Log Tab -->
        <div v-if="activeTab === 'logs'" class="tab-panel">
          <ShipLogTerminal 
            v-if="player && ship" 
            :playerId="player.id" 
            :shipId="ship.id" 
          />
        </div>

        <!-- Training Tab (Locked by default) -->
        <div v-if="activeTab === 'training' && isTabUnlocked('training')" class="tab-panel">
          <TrainingPanel
            :crew="crew"
            :activeTrainings="activeTrainings"
            :stats="trainingStats"
            @start="startTraining"
            @pause="pauseTraining"
            @cancel="cancelTraining"
          />
        </div>

        <!-- Missions Tab (Locked by default) -->
        <div v-if="activeTab === 'missions' && isTabUnlocked('missions')" class="tab-panel">
          <MissionBoard
            :missions="availableMissions"
            :currentCapabilities="shipCapabilities"
            @refresh="loadMissions"
            @view="viewMissionDetails"
            @accept="acceptMission"
          />
        </div>

        <!-- Ship Systems Tab -->
        <div v-if="activeTab === 'status'" class="tab-panel">
          <BrutalistPanel title="SYSTEM DIAGNOSTICS" subtitle="MAINTENANCE OVERDUE">
            <div class="diagnostics-grid">
              <div class="diagnostic-item">
                <span class="label">REACTOR STATUS:</span>
                <span class="value warning">NEEDS CALIBRATION</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">HULL INTEGRITY:</span>
                <span class="value">{{ ship?.hull_integrity || 100 }}%</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">LIFE SUPPORT:</span>
                <span class="value success">OPERATIONAL</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">NAVIGATION:</span>
                <span class="value">ONLINE</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">COMMUNICATIONS:</span>
                <span class="value warning">INTERMITTENT</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">SOFTWARE VERSION:</span>
                <span class="value">v{{ softwareVersion }}</span>
              </div>
            </div>
            
            <div class="maintenance-log">
              <h4>MAINTENANCE LOG:</h4>
              <p>Last maintenance: NEVER</p>
              <p>Next scheduled: OVERDUE BY 847 DAYS</p>
              <p>Warranty status: VOID</p>
            </div>

            <div class="license-upgrades" v-if="availableUpgrades.length > 0">
              <h4>AVAILABLE SOFTWARE UPGRADES:</h4>
              <div v-for="upgrade in availableUpgrades" :key="upgrade.id" class="upgrade-item">
                <span>{{ upgrade.name }}</span>
                <span class="price">¢{{ upgrade.price }}</span>
                <BrutalistButton
                  :label="`PURCHASE [${upgrade.unlocks}]`"
                  @click="purchaseUpgrade(upgrade.id)"
                  :disabled="player.credits < upgrade.price"
                  variant="primary"
                />
              </div>
            </div>
          </BrutalistPanel>
        </div>
      </div>
    </div>

    <!-- Message Log -->
    <div class="message-log">
      <h3>SYSTEM LOG</h3>
      <div v-for="message in messages" :key="message.id" class="log-entry">
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BrutalistPanel from '~/components/brutalist/BrutalistPanel.vue'
import BrutalistButton from '~/components/brutalist/BrutalistButton.vue'
import CrewCard from '~/components/brutalist/CrewCard.vue'
import TrainingPanel from '~/components/brutalist/TrainingPanel.vue'
import MissionBoard from '~/components/brutalist/MissionBoard.vue'
import MarketTerminal from '~/components/MarketTerminal.vue'
import ShipLogTerminal from '~/components/ShipLogTerminal.vue'

// State
const websocket = ref(null)
const connectionStatus = ref('disconnected')
const serverStatus = ref(null)
const player = ref(null)
const ship = ref(null)
const crew = ref([])
const availableCrew = ref([])
const availableMissions = ref([])
const activeTrainings = ref([])
const trainingStats = ref({
  totalSessions: 0,
  completionRate: 0,
  avgTrainingTime: '0h'
})
const messages = ref([])
const activeTab = ref('crew')
const showHiring = ref(false)
const isLoading = ref(false)
const selectedCrewId = ref(null)

// Login form data
const username = ref('')
const email = ref('')

// Software license levels
const softwareLicense = ref('BASIC')
const softwareVersion = ref('1.3.7')
const unlockedTabs = ref(['crew', 'market', 'logs', 'status'])

// Available tabs configuration
const availableTabs = computed(() => [
  { id: 'crew', label: 'CREW MANAGEMENT', unlocked: true, minLicense: 'BASIC' },
  { id: 'market', label: 'MARKET ACCESS', unlocked: true, minLicense: 'BASIC' },
  { id: 'logs', label: 'SHIP\'S LOG', unlocked: true, minLicense: 'BASIC' },
  { id: 'training', label: 'TRAINING QUEUE', unlocked: unlockedTabs.value.includes('training'), minLicense: 'STANDARD' },
  { id: 'missions', label: 'MISSION BOARD', unlocked: unlockedTabs.value.includes('missions'), minLicense: 'PROFESSIONAL' },
  { id: 'status', label: 'SHIP SYSTEMS', unlocked: true, minLicense: 'BASIC' }
])

// Available software upgrades
const availableUpgrades = computed(() => {
  const upgrades = []
  if (!unlockedTabs.value.includes('training')) {
    upgrades.push({
      id: 'standard-license',
      name: 'STANDARD LICENSE',
      price: 5000,
      unlocks: 'TRAINING MODULE'
    })
  }
  if (!unlockedTabs.value.includes('missions')) {
    upgrades.push({
      id: 'professional-license',
      name: 'PROFESSIONAL LICENSE',
      price: 15000,
      unlocks: 'MISSION CONTRACTS'
    })
  }
  return upgrades
})

// Ship capabilities for mission requirements
const shipCapabilities = computed(() => ({
  cargoCapacity: ship.value?.cargo_max || 0,
  fuelCapacity: ship.value?.fuel_max || 0,
  crewCount: crew.value.length,
  hasWeapons: ship.value?.has_weapons || false,
  hasMedBay: ship.value?.has_medbay || false,
  hasScanner: ship.value?.has_scanner || false
}))

// Lifecycle
onMounted(() => {
  connectWebSocket()
  loadInitialData()
})

onUnmounted(() => {
  if (websocket.value) {
    websocket.value.close()
  }
})

// WebSocket connection
function connectWebSocket() {
  try {
    websocket.value = new WebSocket('ws://localhost:3001')
    
    websocket.value.onopen = () => {
      connectionStatus.value = 'connected'
      addMessage('Connected to ship systems')
    }
    
    websocket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }
    
    websocket.value.onclose = () => {
      connectionStatus.value = 'disconnected'
      addMessage('Connection to ship systems lost')
      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000)
    }
    
    websocket.value.onerror = (error) => {
      connectionStatus.value = 'error'
      addMessage('System error: Connection failed')
    }
  } catch (error) {
    connectionStatus.value = 'error'
    addMessage('Fatal error: Cannot establish ship connection')
  }
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'connection:established':
      addMessage(`Ship systems online. Client ID: ${data.data.clientId}`)
      serverStatus.value = {
        currentTick: data.data.currentTick,
        tickInterval: data.data.tickInterval
      }
      break
      
    case 'tick:update':
      serverStatus.value.currentTick = data.data.tick
      // Refresh training data on tick
      if (player.value && ship.value) {
        loadTrainingData()
      }
      break
      
    case 'ship:status':
      ship.value = data.data
      break
      
    case 'crew:update':
      crew.value = data.data
      break
      
    case 'training:update':
      activeTrainings.value = data.data.activeTrainings || []
      break
  }
}

// Initial data loading
async function loadInitialData() {
  // Check if we have a stored player session
  const storedPlayer = localStorage.getItem('spacepunk_player')
  if (storedPlayer) {
    try {
      const playerData = JSON.parse(storedPlayer)
      player.value = playerData.player
      ship.value = playerData.ship
      await loadGameData()
    } catch (error) {
      console.error('Failed to restore session:', error)
      localStorage.removeItem('spacepunk_player')
    }
  }
}

async function loadGameData() {
  if (!player.value || !ship.value) return
  
  await Promise.all([
    loadCrew(),
    loadAvailableCrew(),
    loadTrainingData(),
    loadMissions()
  ])
}

// Player creation
async function createPlayer() {
  if (!username.value || !email.value) return
  
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:3001/api/player/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: 'temp_password' // In real game, this would be properly handled
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      player.value = data.player
      ship.value = data.ship
      crew.value = data.crew || []
      
      // Store session
      localStorage.setItem('spacepunk_player', JSON.stringify({
        player: player.value,
        ship: ship.value
      }))
      
      addMessage(`Welcome aboard, Captain ${username.value}`)
      await loadGameData()
    } else {
      const error = await response.json()
      addMessage(`Error: ${error.error || 'Failed to initialize captain profile'}`)
    }
  } catch (error) {
    addMessage('Fatal error: Cannot access personnel database')
  } finally {
    isLoading.value = false
  }
}

// Crew management
async function loadCrew() {
  try {
    const response = await fetch(`http://localhost:3001/api/ship/${ship.value.id}/crew`)
    if (response.ok) {
      crew.value = await response.json()
    }
  } catch (error) {
    addMessage('Warning: Crew manifest offline')
  }
}

async function loadAvailableCrew() {
  try {
    const response = await fetch('http://localhost:3001/api/crew/available')
    if (response.ok) {
      availableCrew.value = await response.json()
    }
  } catch (error) {
    addMessage('Warning: Personnel database offline')
  }
}

async function hireCrew(crewId) {
  try {
    const response = await fetch(`http://localhost:3001/api/crew/${crewId}/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipId: ship.value.id })
    })
    
    if (response.ok) {
      addMessage('Crew member hired successfully')
      await loadCrew()
      await loadAvailableCrew()
      showHiring.value = false
    } else {
      const error = await response.json()
      addMessage(`Error: ${error.error || 'Hiring process failed'}`)
    }
  } catch (error) {
    addMessage('Error: Hiring process failed')
  }
}

// Training management
async function loadTrainingData() {
  try {
    const response = await fetch(`http://localhost:3001/api/ship/${ship.value.id}/training`)
    if (response.ok) {
      const data = await response.json()
      activeTrainings.value = data.activeTraining || []
    }
    
    // Load training stats
    const statsResponse = await fetch(`http://localhost:3001/api/training/stats?shipId=${ship.value.id}`)
    if (statsResponse.ok) {
      trainingStats.value = await statsResponse.json()
    }
  } catch (error) {
    console.error('Failed to load training data:', error)
  }
}

async function startTraining({ crewId, skill }) {
  try {
    const response = await fetch(`http://localhost:3001/api/crew/${crewId}/training/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainingType: skill })
    })
    
    if (response.ok) {
      addMessage('Training program initiated')
      await loadTrainingData()
    } else {
      const error = await response.json()
      addMessage(`Error: ${error.error || 'Failed to start training'}`)
    }
  } catch (error) {
    addMessage('Error: Training system offline')
  }
}

async function pauseTraining(sessionId) {
  // Not implemented in backend yet
  addMessage('Training pause not yet implemented')
}

async function cancelTraining(sessionId) {
  try {
    // Find the crew member for this training session
    const session = activeTrainings.value.find(t => t.id === sessionId)
    if (!session) return
    
    const response = await fetch(`http://localhost:3001/api/crew/${session.crew_member_id}/training/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Cancelled by captain' })
    })
    
    if (response.ok) {
      addMessage('Training cancelled')
      await loadTrainingData()
    }
  } catch (error) {
    addMessage('Error: Failed to cancel training')
  }
}

// Mission management
async function loadMissions() {
  try {
    const response = await fetch(`http://localhost:3001/api/missions/available?stationId=${ship.value.location_station}&limit=20`)
    if (response.ok) {
      availableMissions.value = await response.json()
    }
  } catch (error) {
    addMessage('Warning: Mission board offline')
  }
}

async function viewMissionDetails(missionId) {
  addMessage(`Viewing mission details: ${missionId}`)
  // Could open a modal or expand the mission card
}

async function acceptMission(missionId) {
  try {
    const response = await fetch(`http://localhost:3001/api/missions/${missionId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: player.value.id,
        shipId: ship.value.id
      })
    })
    
    if (response.ok) {
      addMessage('Mission accepted')
      await loadMissions()
    } else {
      const error = await response.json()
      addMessage(`Error: ${error.error || 'Failed to accept mission'}`)
    }
  } catch (error) {
    addMessage('Error: Mission system offline')
  }
}

// Software upgrades
async function purchaseUpgrade(upgradeId) {
  addMessage(`Purchasing upgrade: ${upgradeId}`)
  
  // Simulate purchase (would be server-side in real implementation)
  if (upgradeId === 'standard-license') {
    unlockedTabs.value.push('training')
    softwareLicense.value = 'STANDARD'
    softwareVersion.value = '2.0.0'
    addMessage('STANDARD LICENSE ACTIVATED - Training module now available')
  } else if (upgradeId === 'professional-license') {
    unlockedTabs.value.push('missions')
    softwareLicense.value = 'PROFESSIONAL'
    softwareVersion.value = '3.0.0'
    addMessage('PROFESSIONAL LICENSE ACTIVATED - Mission contracts now available')
  }
}

// Helper functions
function transformCrewMember(member) {
  return {
    id: member.id,
    name: member.name,
    role: member.role || 'CREW',
    level: Math.floor((member.skill_engineering + member.skill_piloting + member.skill_social + member.skill_combat) / 40),
    experience: 0,
    morale: member.morale,
    stress: member.stress,
    health: member.health,
    traits: member.traits || [],
    currentTask: member.current_task || null,
    available: true
  }
}

function transformCandidate(candidate) {
  return {
    id: candidate.id,
    name: candidate.name,
    role: 'CANDIDATE',
    level: Math.floor((candidate.skill_engineering + candidate.skill_piloting + candidate.skill_social + candidate.skill_combat) / 40),
    experience: 0,
    morale: 70,
    stress: 20,
    health: 100,
    traits: [`${candidate.culture}`, `${candidate.homeworld}`],
    currentTask: null,
    available: true
  }
}

function assignCrewMember(crewId) {
  addMessage(`Assigning crew member: ${crewId}`)
  // Implementation for crew assignment
}

function viewCrewDetails(crewId) {
  addMessage(`Viewing crew details: ${crewId}`)
  // Implementation for viewing crew details
}

function isTabUnlocked(tabId) {
  return unlockedTabs.value.includes(tabId)
}

function addMessage(text) {
  messages.value.unshift({
    id: Date.now(),
    text: `[${new Date().toLocaleTimeString()}] ${text}`
  })
  // Keep only last 50 messages
  if (messages.value.length > 50) {
    messages.value = messages.value.slice(0, 50)
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style>
/* Brutalist HTML styling - intentionally minimal and functional */
.spacepunk-interface {
  font-family: 'Courier New', monospace;
  background: #000;
  color: #00ff00;
  padding: 8px;
  min-height: 100vh;
}

.status-bar {
  border: 1px solid #00ff00;
  padding: 4px 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  background: #001100;
}

.connection-indicator.connected {
  color: #00ff00;
}

.connection-indicator.disconnected {
  color: #ff6600;
}

.connection-indicator.error {
  color: #ff0000;
}

.login-screen {
  border: 2px solid #00ff00;
  padding: 16px;
  max-width: 400px;
  margin: 40px auto;
  background: #001100;
}

.login-form {
  margin-top: 16px;
}

.login-form label {
  display: block;
  margin: 8px 0 4px;
}

.login-form input {
  width: 100%;
  background: #000;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px;
  font-family: inherit;
}

.login-form button {
  width: 100%;
  background: #001100;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 8px;
  margin-top: 16px;
  cursor: pointer;
  font-family: inherit;
}

.login-form button:hover {
  background: #002200;
}

.login-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.command-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.section {
  border: 1px solid #00ff00;
  padding: 8px;
  background: #001100;
}

.section h2 {
  margin: 0 0 8px;
  font-size: 14px;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 4px;
}

.section h3 {
  margin: 8px 0 4px;
  font-size: 12px;
}

.section h4 {
  margin: 12px 0 4px;
  font-size: 11px;
  color: #00ff00;
  opacity: 0.8;
}

.section p {
  margin: 2px 0;
  font-size: 12px;
}

.command-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.command-buttons button {
  background: #000;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  position: relative;
}

.command-buttons button:hover:not(:disabled),
.command-buttons button.active {
  background: #002200;
}

.command-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #666;
  border-color: #666;
}

.locked-indicator {
  font-size: 9px;
  opacity: 0.6;
  margin-left: 4px;
}

.tab-content {
  grid-column: 1 / -1;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in;
}

.crew-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
  margin: 8px 0;
}

.crew-actions {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px dashed #00ff00;
}

.hiring-interface {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #00ff00;
  background: #000;
}

.empty-state {
  color: #666;
  font-style: italic;
  padding: 24px;
  text-align: center;
  border: 1px dashed #333;
}

.diagnostics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.diagnostic-item {
  display: flex;
  justify-content: space-between;
  padding: 4px;
  border-bottom: 1px dotted #003300;
  font-size: 11px;
}

.diagnostic-item .label {
  opacity: 0.7;
}

.diagnostic-item .value {
  font-weight: bold;
}

.diagnostic-item .value.success {
  color: #00ff00;
}

.diagnostic-item .value.warning {
  color: #ffff00;
}

.diagnostic-item .value.error {
  color: #ff0000;
}

.maintenance-log {
  padding: 8px;
  background: #000;
  border: 1px dotted #003300;
  margin-bottom: 16px;
  font-size: 11px;
}

.maintenance-log p {
  margin: 2px 0;
}

.license-upgrades {
  padding-top: 16px;
  border-top: 1px solid #00ff00;
}

.upgrade-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid #003300;
  background: #000;
}

.upgrade-item .price {
  color: #00ff00;
  font-weight: bold;
}

.message-log {
  grid-column: 1 / -1;
  border: 1px solid #00ff00;
  padding: 8px;
  background: #001100;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
}

.message-log h3 {
  margin: 0 0 8px;
  font-size: 12px;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 4px;
}

.log-entry {
  font-size: 10px;
  margin: 1px 0;
  opacity: 0.8;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>