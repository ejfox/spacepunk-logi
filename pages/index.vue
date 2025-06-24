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
        <label>CAPTAIN USERNAME (optional):</label>
        <input v-model="username" type="text" placeholder="Leave blank for random callsign">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'INITIALIZING...' : 'BEGIN COMMAND' }}
        </button>
        <button type="button" @click="quickStart" :disabled="isLoading" class="quick-start-btn">
          {{ isLoading ? 'INITIALIZING...' : 'QUICK START (RANDOM CAPTAIN)' }}
        </button>
        <p class="quick-start-note">
          No registration required - jump straight into testing!
        </p>
      </form>
    </div>

    <!-- Simple Ship Interface -->
    <div v-else class="simple-interface">
      <SimpleShipInterface :playerId="player.id" :shipId="ship?.id" />
    </div>

    <!-- Original Ship Command Interface (Hidden) -->
    <div v-if="false" class="command-interface">
      <!-- Captain Info -->
      <div class="section">
        <h2>COMMAND STATUS</h2>
        <p>CAPTAIN: {{ player.username }}</p>
        <p>DEATHS: {{ player.deaths }}</p>
        <p>ACTIVE SINCE: {{ formatDate(player.created_at) }}</p>
        <p>SOFTWARE LICENSE: {{ softwareLicense }}</p>
        <p>CREDITS: {{ playerData?.credits || 0 }} CR</p>
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
          <button v-for="tab in availableTabs" :key="tab.id" @click="activeTab = tab.id"
            :class="{ active: activeTab === tab.id }" :disabled="!tab.unlocked">
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
              <CrewCard v-for="member in crew" :key="member.id" :crewMember="transformCrewMember(member)"
                :selected="selectedCrewId === member.id" :showActions="true" @select="selectedCrewId = member.id"
                @assign="assignCrewMember" @details="viewCrewDetails" />
            </div>

            <div class="crew-actions">
              <BrutalistButton label="HIRE NEW CREW" @click="showHiring = !showHiring"
                :variant="showHiring ? 'warning' : 'default'" />
            </div>

            <div v-if="showHiring" class="hiring-interface">
              <h3>AVAILABLE PERSONNEL</h3>
              <div v-if="availableCrew.length === 0" class="empty-state">
                NO CANDIDATES AVAILABLE AT THIS STATION
              </div>
              <div v-else class="crew-grid">
                <CrewCard v-for="candidate in availableCrew" :key="candidate.id"
                  :crewMember="transformCandidate(candidate)" :showActions="false" @select="hireCrew(candidate.id)" />
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
          <ShipLogTerminal v-if="player && ship" :playerId="player.id" :shipId="ship.id" />
        </div>

        <!-- Training Tab (Locked by default) -->
        <div v-if="activeTab === 'training' && isTabUnlocked('training')" class="tab-panel">
          <TrainingPanel :crew="crew" :activeTrainings="activeTrainings" :stats="trainingStats" @start="startTraining"
            @pause="pauseTraining" @cancel="cancelTraining" />
        </div>

        <!-- Missions Tab (Locked by default) -->
        <div v-if="activeTab === 'missions' && isTabUnlocked('missions')" class="tab-panel">
          <MissionBoard :missions="availableMissions" :currentCapabilities="shipCapabilities" @refresh="loadMissions"
            @view="viewMissionDetails" @accept="acceptMission" />
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

            <div class="license-upgrades">
              <h4>SPACECORP™ SOFTWARE LICENSING TERMINAL v2.1</h4>

              <div v-if="availableUpgrades.length > 0">
                <p class="terminal-text">
                  NOTICE: Your current license limits productivity.
                  Consider upgrading for optimal workflow synergy.
                </p>

                <div v-for="upgrade in availableUpgrades" :key="upgrade.id" class="upgrade-item">
                  <div class="upgrade-info">
                    <span class="upgrade-name">{{ upgrade.name }}</span>
                    <span class="upgrade-unlocks">UNLOCKS: {{ upgrade.unlocks }}</span>
                  </div>
                  <div class="upgrade-purchase">
                    <span class="price">{{ upgrade.price }} CR</span>
                    <BrutalistButton
                      :label="playerData?.credits >= upgrade.price ? 'PURCHASE LICENSE' : 'INSUFFICIENT FUNDS'"
                      @click="purchaseUpgrade(upgrade.id)" :disabled="!playerData || playerData.credits < upgrade.price"
                      :variant="playerData?.credits >= upgrade.price ? 'primary' : 'disabled'" />
                  </div>
                </div>

                <p class="fine-print">
                  * By purchasing, you agree to all SpaceCorp™ terms and conditions including
                  mandatory telemetry reporting and waiver of all software-related grievances.
                </p>
              </div>

              <div v-else>
                <p class="terminal-success">
                  PROFESSIONAL LICENSE ACTIVE - All modules unlocked.
                  Thank you for your continued patronage of SpaceCorp™ products.
                </p>
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

    <!-- Crew Details Modal -->
    <div v-if="showCrewDetails && selectedCrewMember" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
      <div style="background: #000; border: 2px solid #ffffff; padding: 20px; max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto; font-family: 'Courier New', monospace;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0;">CREW DOSSIER</h2>
          <button @click="closeCrewDetails" style="background: #660000; color: #ffffff; border: 1px solid #990000; padding: 5px 10px; font-family: 'Courier New', monospace;">
            [CLOSE]
          </button>
        </div>
        
        <div style="color: #ffffff; line-height: 1.6;">
          <div style="margin-bottom: 15px;">
            <strong>NAME:</strong> {{ selectedCrewMember.name }}<br>
            <strong>ROLE:</strong> {{ selectedCrewMember.role || 'CREW' }}<br>
            <strong>LEVEL:</strong> {{ selectedCrewMember.level || 'N/A' }}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>SKILLS:</strong><br>
            <div style="margin-left: 20px;">
              Engineering: {{ selectedCrewMember.skills?.engineering || selectedCrewMember.skill_engineering || 0 }}<br>
              Piloting: {{ selectedCrewMember.skills?.piloting || selectedCrewMember.skill_piloting || 0 }}<br>
              Social: {{ selectedCrewMember.skills?.social || selectedCrewMember.skill_social || 0 }}<br>
              Combat: {{ selectedCrewMember.skills?.combat || selectedCrewMember.skill_combat || 0 }}
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>STATUS:</strong><br>
            <div style="margin-left: 20px;">
              Health: {{ selectedCrewMember.health || 100 }}%<br>
              Morale: {{ selectedCrewMember.morale || 50 }}%<br>
              Stress: {{ selectedCrewMember.stress || 0 }}%
            </div>
          </div>
          
          <div v-if="selectedCrewMember.traits && selectedCrewMember.traits.length > 0" style="margin-bottom: 15px;">
            <strong>TRAITS:</strong><br>
            <div style="margin-left: 20px;">
              <span v-for="trait in selectedCrewMember.traits" :key="trait" style="display: inline-block; margin-right: 10px; background: #333; padding: 2px 6px; border: 1px solid #666;">
                {{ trait }}
              </span>
            </div>
          </div>
          
          <div v-if="selectedCrewMember.currentTask" style="margin-bottom: 15px;">
            <strong>CURRENT TASK:</strong> {{ selectedCrewMember.currentTask }}
          </div>
          
          <!-- LLM-Generated Content -->
          <div v-if="selectedCrewMember.backstory" style="margin-bottom: 15px;">
            <strong>BACKSTORY:</strong><br>
            <div style="margin-left: 20px; color: #ccc; font-style: italic;">{{ selectedCrewMember.backstory }}</div>
          </div>
          
          <div v-if="selectedCrewMember.previous_job" style="margin-bottom: 15px;">
            <strong>PREVIOUS EMPLOYMENT:</strong> {{ selectedCrewMember.previous_job }}<br>
            <strong>AVAILABILITY REASON:</strong> {{ selectedCrewMember.availability_reason }}
          </div>
          
          <div v-if="selectedCrewMember.notable_incident" style="margin-bottom: 15px;">
            <strong>NOTABLE INCIDENT:</strong><br>
            <div style="margin-left: 20px; color: #ffcccc;">{{ selectedCrewMember.notable_incident }}</div>
          </div>
          
          <div v-if="selectedCrewMember.employment_red_flags" style="margin-bottom: 15px;">
            <strong>HR RED FLAGS:</strong><br>
            <div style="margin-left: 20px; color: #ffaaaa;">{{ selectedCrewMember.employment_red_flags }}</div>
          </div>
          
          <div v-if="selectedCrewMember.personality_quirks" style="margin-bottom: 15px;">
            <strong>PERSONALITY QUIRKS:</strong><br>
            <div style="margin-left: 20px; color: #aaffaa;">{{ selectedCrewMember.personality_quirks }}</div>
          </div>
          
          <div v-if="selectedCrewMember.skills_summary" style="margin-bottom: 15px;">
            <strong>SKILLS ASSESSMENT:</strong><br>
            <div style="margin-left: 20px; color: #ccccff;">{{ selectedCrewMember.skills_summary }}</div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>HIRING COST:</strong> {{ selectedCrewMember.hiring_cost || 500 }} credits<br>
            <strong>CORPORATE RATING:</strong> {{ selectedCrewMember.corporate_rating || 'C' }}<br>
            <strong>CLEARANCE LEVEL:</strong> {{ selectedCrewMember.clearance_level || 1 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Emergency Cache Nuke -->
    <div style="text-align: center; margin: 20px 0; border-top: 1px solid #333; padding-top: 10px;">
      <button @click="nukeCache" style="background: #660000; color: #ffffff; border: 1px solid #990000; padding: 5px 10px; font-family: 'Courier New', monospace; font-size: 10px;">
        NUKE CACHE
      </button>
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
import SimpleShipInterface from '~/components/SimpleShipInterface.vue'

// State
const websocket = ref(null)
const connectionStatus = ref('disconnected')
const serverStatus = ref(null)
const player = ref(null)
const playerData = ref(null)
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
const selectedCrewMember = ref(null)
const showCrewDetails = ref(false)
const messages = ref([])
const activeTab = ref('crew')
const showHiring = ref(false)
const isLoading = ref(false)
const selectedCrewId = ref(null)

// Login form data
const username = ref('')

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
      unlocks: 'TRAINING QUEUE™'
    })
  }
  if (!unlockedTabs.value.includes('missions')) {
    upgrades.push({
      id: 'professional-license',
      name: 'PROFESSIONAL LICENSE',
      price: 25000,
      unlocks: 'MISSION BOARD™'
    })
  }
  return upgrades
})

// Computed properties
const playerId = computed(() => player.value?.id)
const shipId = computed(() => ship.value?.id)

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
    websocket.value = new WebSocket('ws://localhost:3666')

    websocket.value.onopen = () => {
      connectionStatus.value = 'connected'
      addMessage('✅ Connected to ship systems')
    }

    websocket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    websocket.value.onclose = () => {
      connectionStatus.value = 'disconnected'
      addMessage('❌ Connection lost - Backend server may be down')
      addMessage('💡 Start server: cd server && npm run dev')
      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000)
    }

    websocket.value.onerror = (error) => {
      connectionStatus.value = 'error'
      addMessage('🚫 Connection failed - Is backend running on port 3666?')
      addMessage('💡 Try: cd server && npm install && npm run dev')
    }
  } catch (error) {
    connectionStatus.value = 'error'
    addMessage('🚫 Fatal: Cannot establish ship connection')
    addMessage('💡 Backend server required - check README for setup')
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

async function generateShipLog() {
  try {
    if (!player.value?.id) return
    
    const response = await fetch(`http://localhost:3666/api/player/${player.value.id}/generate-log`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.logEntry) {
        // Display the beautiful LLM-generated narrative summary
        addMessage(`📔 SHIP'S LOG SUMMARY:`)
        addMessage(data.logEntry.narrative || data.logEntry.content)
        addMessage(`📊 Entry logged at stardate ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
      }
    }
  } catch (error) {
    console.error('Failed to generate ship log:', error)
    // Don't show error to user - this is optional narrative content
  }
}

async function loadGameData() {
  if (!player.value || !ship.value) return

  await Promise.all([
    loadPlayerData(),
    loadCrew(),
    loadAvailableCrew(),
    loadTrainingData(),
    loadMissions(),
    generateShipLog() // Generate LLM narrative summary
  ])
}

async function loadPlayerData() {
  try {
    const response = await fetch(`http://localhost:3666/api/player/${player.value.id}`)
    if (response.ok) {
      const data = await response.json()
      playerData.value = data
      softwareLicense.value = data.software_license || 'BASIC'

      // Update software version based on license
      if (data.software_license === 'PROFESSIONAL') {
        softwareVersion.value = '3.0.0'
      } else if (data.software_license === 'STANDARD') {
        softwareVersion.value = '2.0.0'
      } else {
        softwareVersion.value = '1.0.0'
      }

      // Update unlocked tabs based on license
      if (data.software_license === 'STANDARD' || data.software_license === 'PROFESSIONAL') {
        if (!unlockedTabs.value.includes('training')) {
          unlockedTabs.value.push('training')
        }
      }
      if (data.software_license === 'PROFESSIONAL') {
        if (!unlockedTabs.value.includes('missions')) {
          unlockedTabs.value.push('missions')
        }
      }
    }
  } catch (error) {
    console.error('Failed to load player data:', error)
    addMessage('Warning: Unable to verify software license')
  }
}

// Player creation
async function createPlayer() {
  isLoading.value = true

  // Generate random username if none provided
  if (!username.value || username.value.trim() === '') {
    const prefixes = ['Ghost', 'Void', 'Cyber', 'Neon', 'Chrome', 'Steel', 'Plasma', 'Quantum', 'Nova', 'Flux']
    const suffixes = ['Runner', 'Pilot', 'Hawk', 'Wolf', 'Fox', 'Viper', 'Storm', 'Blade', 'Ace', 'Prime']
    const numbers = Math.floor(Math.random() * 99) + 1
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    username.value = `${prefix}${suffix}${numbers}`
  } try {
    const response = await fetch('http://localhost:3666/api/player/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: 'test@spacepunk.dev', // Default test email
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

      addMessage(`✅ Welcome aboard, Captain ${username.value}`)
      await loadGameData()
    } else {
      const error = await response.json()
      addMessage(`❌ Player creation failed: ${error.error || 'Unknown error'}`)
      if (response.status === 500) {
        addMessage('💡 Database may be down - try: docker compose up -d')
      }
    }
  } catch (error) {
    console.error('Player creation error:', error)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      addMessage('🚫 Cannot reach backend server')
      addMessage('💡 Start server: cd server && npm run dev')
    } else {
      addMessage('🚫 Database connection failed')
      addMessage('💡 Start database: docker compose up -d')
    }
  } finally {
    isLoading.value = false
  }
}

// Quick start function for instant testing
function quickStart() {
  username.value = '' // Clear any existing username to trigger random generation
  createPlayer()
}

// Crew management
async function loadCrew() {
  try {
    const response = await fetch(`http://localhost:3666/api/ship/${ship.value.id}/crew`)
    if (response.ok) {
      crew.value = await response.json()
    }
  } catch (error) {
    addMessage('Warning: Crew manifest offline')
  }
}

async function loadAvailableCrew() {
  try {
    const response = await fetch('http://localhost:3666/api/crew/available')
    if (response.ok) {
      availableCrew.value = await response.json()
    }
  } catch (error) {
    addMessage('Warning: Personnel database offline')
  }
}

async function hireCrew(crewId) {
  try {
    const response = await fetch(`http://localhost:3666/api/crew/${crewId}/hire`, {
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
    const response = await fetch(`http://localhost:3666/api/ship/${ship.value.id}/training`)
    if (response.ok) {
      const data = await response.json()
      activeTrainings.value = data.activeTraining || []
    }

    // Load training stats
    const statsResponse = await fetch(`http://localhost:3666/api/training/stats?shipId=${ship.value.id}`)
    if (statsResponse.ok) {
      trainingStats.value = await statsResponse.json()
    }
  } catch (error) {
    console.error('Failed to load training data:', error)
  }
}

async function startTraining({ crewId, skill }) {
  try {
    const response = await fetch(`http://localhost:3666/api/crew/${crewId}/training/start`, {
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

    const response = await fetch(`http://localhost:3666/api/crew/${session.crew_member_id}/training/cancel`, {
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
    // Convert station name to lowercase hyphenated format
    const stationId = ship.value.location_station.toLowerCase().replace(/\s+/g, '-')
    const response = await fetch(`http://localhost:3666/api/missions/available?stationId=${stationId}&limit=20`)
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
    const response = await fetch(`http://localhost:3666/api/missions/${missionId}/accept`, {
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
  try {
    addMessage(`Processing license upgrade request...`)

    const licenseMap = {
      'standard-license': 'STANDARD',
      'professional-license': 'PROFESSIONAL'
    }

    const newLicense = licenseMap[upgradeId]
    if (!newLicense) {
      addMessage('ERROR: Invalid upgrade ID')
      return
    }

    // Make API call to purchase license
    const response = await fetch(`http://localhost:3666/api/player/${playerId.value}/license/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newLicense })
    })

    if (!response.ok) {
      const error = await response.json()
      addMessage(`LICENSE PURCHASE FAILED: ${error.error}`)
      return
    }

    const result = await response.json()

    // Update local state
    softwareLicense.value = result.player.software_license
    playerData.value.credits = result.player.credits

    // Update unlocked tabs based on new license
    if (newLicense === 'STANDARD' && !unlockedTabs.value.includes('training')) {
      unlockedTabs.value.push('training')
      softwareVersion.value = '2.0.0'
      addMessage('STANDARD LICENSE ACTIVATED - Training Queue™ module now available')
    } else if (newLicense === 'PROFESSIONAL' && !unlockedTabs.value.includes('missions')) {
      unlockedTabs.value.push('missions')
      softwareVersion.value = '3.0.0'
      addMessage('PROFESSIONAL LICENSE ACTIVATED - Mission Board™ module now available')
    }

    // Show license agreement snippet
    addMessage(`${result.licenseInfo.agreementText.substring(0, 100)}...`)
    addMessage(`Credits remaining: ${result.player.credits}`)

    // Save to localStorage
    saveGameState()
  } catch (error) {
    console.error('License purchase error:', error)
    addMessage(`ERROR: Failed to contact SpaceCorp™ licensing server`)
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
  const engineering = candidate.skill_engineering || 0;
  const piloting = candidate.skill_piloting || 0;
  const social = candidate.skill_social || 0;
  const combat = candidate.skill_combat || 0;
  
  return {
    id: candidate.id,
    name: candidate.name,
    role: 'CANDIDATE',
    level: Math.floor((engineering + piloting + social + combat) / 40),
    experience: 0,
    morale: candidate.morale || 70,
    stress: candidate.stress || 20,
    health: candidate.health || 100,
    traits: [candidate.culture || 'Unknown', candidate.homeworld || 'Unknown'],
    currentTask: null,
    available: true,
    skills: {
      engineering,
      piloting,
      social,
      combat
    }
  }
}

function assignCrewMember(crewId) {
  addMessage(`Assigning crew member: ${crewId}`)
  // Implementation for crew assignment
}

async function viewCrewDetails(crewId) {
  try {
    addMessage(`Loading crew details: ${crewId}`)
    
    // Find the crew member in our current data
    const crewMember = crew.value.find(c => c.id === crewId) || 
                      availableCrew.value.find(c => c.id === crewId)
    
    if (crewMember) {
      selectedCrewMember.value = crewMember
      showCrewDetails.value = true
      addMessage(`Crew details loaded for ${crewMember.name}`)
    } else {
      // Fetch from server if not found locally
      const response = await fetch(`http://localhost:3666/api/crew/${crewId}`)
      if (response.ok) {
        const crewData = await response.json()
        selectedCrewMember.value = crewData
        showCrewDetails.value = true
        addMessage(`Crew details loaded for ${crewData.name}`)
      } else {
        addMessage(`Error: Could not load crew details`)
      }
    }
  } catch (error) {
    addMessage(`Error: Failed to load crew details`)
  }
}

function closeCrewDetails() {
  showCrewDetails.value = false
  selectedCrewMember.value = null
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

function saveGameState() {
  if (player.value && ship.value) {
    localStorage.setItem('spacepunk_player', JSON.stringify({
      player: player.value,
      ship: ship.value,
      softwareLicense: softwareLicense.value,
      unlockedTabs: unlockedTabs.value
    }))
  }
}

function nukeCache() {
  if (confirm('WARNING: This will clear ALL game data and reload the page. Are you sure?')) {
    if (confirm('FINAL WARNING: This action cannot be undone. Continue?')) {
      localStorage.clear()
      sessionStorage.clear()
      addMessage('💥 CACHE NUKED - Reloading...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }
}
</script>

<style>
/* Brutalist HTML styling - intentionally minimal and functional */
.spacepunk-interface {
  font-family: 'Courier New', monospace;
  background: #000;
  color: #ffffff;
  padding: 8px;
  min-height: 100vh;
}

.status-bar {
  border: 1px solid #ffffff;
  padding: 4px 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  background: #111111;
}

.connection-indicator.connected {
  color: #ffffff;
}

.connection-indicator.disconnected {
  color: #ff6600;
}

.connection-indicator.error {
  color: #ff0000;
}

.login-screen {
  border: 2px solid #ffffff;
  padding: 16px;
  max-width: 400px;
  margin: 40px auto;
  background: #111111;
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
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 4px;
  font-family: inherit;
}

.login-form button {
  width: 100%;
  background: #111111;
  border: 2px solid #ffffff;
  color: #ffffff;
  padding: 8px;
  margin-top: 16px;
  cursor: pointer;
  font-family: inherit;
}

.login-form button:hover {
  background: #222222;
}

.login-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-start-btn {
  background: #004400 !important;
  margin-top: 8px !important;
}

.quick-start-btn:hover {
  background: #006600 !important;
}

.quick-start-note {
  margin-top: 12px;
  font-size: 11px;
  color: #888;
  text-align: center;
  font-style: italic;
}

.simple-interface {
  /* Full screen for simple interface */
}

.command-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.section {
  border: 1px solid #ffffff;
  padding: 8px;
  background: #111111;
}

.section h2 {
  margin: 0 0 8px;
  font-size: 14px;
  border-bottom: 1px solid #ffffff;
  padding-bottom: 4px;
}

.section h3 {
  margin: 8px 0 4px;
  font-size: 12px;
}

.section h4 {
  margin: 12px 0 4px;
  font-size: 11px;
  color: #ffffff;
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
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 4px 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  position: relative;
}

.command-buttons button:hover:not(:disabled),
.command-buttons button.active {
  background: #222222;
}

.command-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #666;
  border-color: #666;
}

.locked-indicator {
  font-size: 9px;
  opacity: 0.7;
  margin-left: 4px;
}

/* Software License Terminal Styles */
.license-upgrades {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #00ff00;
  background: #001100;
}

.license-upgrades h4 {
  color: #00ff00;
  font-size: 12px;
  margin-bottom: 12px;
  text-decoration: underline;
}

.terminal-text {
  font-size: 11px;
  color: #ffff00;
  margin-bottom: 16px;
  line-height: 1.4;
}

.terminal-success {
  font-size: 12px;
  color: #00ff00;
  text-align: center;
  padding: 8px;
}

.upgrade-item {
  margin-bottom: 12px;
  padding: 8px;
  border: 1px dashed #00ff00;
  background: #000;
}

.upgrade-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.upgrade-name {
  font-weight: bold;
  color: #00ff00;
}

.upgrade-unlocks {
  font-size: 10px;
  color: #00cc00;
  opacity: 0.8;
}

.upgrade-purchase {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade-purchase .price {
  font-size: 14px;
  color: #ffff00;
  font-weight: bold;
}

.fine-print {
  font-size: 8px;
  color: #666;
  margin-top: 12px;
  line-height: 1.3;
  font-style: italic;
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
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>