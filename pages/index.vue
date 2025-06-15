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

      <!-- Basic Commands -->
      <div class="section">
        <h2>SHIP OPERATIONS</h2>
        <div class="command-buttons">
          <button @click="activeTab = 'crew'" :class="{ active: activeTab === 'crew' }">
            CREW MANAGEMENT
          </button>
          <button @click="activeTab = 'market'" :class="{ active: activeTab === 'market' }">
            MARKET ACCESS
          </button>
          <button @click="activeTab = 'status'" :class="{ active: activeTab === 'status' }">
            SHIP SYSTEMS
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'crew'" class="section">
        <h2>CREW ROSTER</h2>
        <div v-if="crew.length === 0" class="empty-state">
          NO CREW ASSIGNED
        </div>
        <div v-else class="crew-list">
          <div v-for="member in crew" :key="member.id" class="crew-member">
            <div class="crew-basic-info">
              <p><strong>{{ member.name }}</strong></p>
              <p>AGE: {{ member.age }} | HOMEWORLD: {{ member.homeworld }}</p>
              <p>ENGINEERING: {{ member.skill_engineering }} | PILOTING: {{ member.skill_piloting }}</p>
              <p>SOCIAL: {{ member.skill_social }} | COMBAT: {{ member.skill_combat }}</p>
              <p>HEALTH: {{ member.health }}% | MORALE: {{ member.morale }}%</p>
            </div>
            <CrewTraits 
              :crew-member-id="member.id"
              @traits-updated="handleTraitsUpdated"
            />
          </div>
        </div>
        <button @click="showHiring = !showHiring" class="action-button">
          {{ showHiring ? 'CLOSE HIRING' : 'HIRE CREW' }}
        </button>
        
        <div v-if="showHiring" class="hiring-interface">
          <h3>AVAILABLE PERSONNEL</h3>
          <div v-if="availableCrew.length === 0" class="empty-state">
            NO CANDIDATES AVAILABLE
          </div>
          <div v-for="candidate in availableCrew" :key="candidate.id" class="crew-candidate">
            <p><strong>{{ candidate.name }}</strong></p>
            <p>{{ candidate.age }}yr {{ candidate.culture }} from {{ candidate.homeworld }}</p>
            <p>ENG:{{ candidate.skill_engineering }} PIL:{{ candidate.skill_piloting }} SOC:{{ candidate.skill_social }} CMB:{{ candidate.skill_combat }}</p>
            <button @click="hireCrew(candidate.id)" class="hire-button">HIRE</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'market'" class="section">
        <h2>MARKET TERMINAL</h2>
        <p>Connecting to {{ ship?.location_station }} Trade Network...</p>
        <div class="market-data">
          <div v-for="resource in marketData" :key="resource.code" class="market-item">
            <span class="resource-name">{{ resource.name }}</span>
            <span class="resource-price">{{ resource.current_price }} CR</span>
            <span class="resource-category">{{ resource.category.toUpperCase() }}</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'status'" class="section">
        <h2>SYSTEM DIAGNOSTICS</h2>
        <p>All systems operational.</p>
        <p>Last maintenance: Never</p>
        <p>Next scheduled maintenance: Overdue</p>
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
const websocket = ref(null)
const connectionStatus = ref('disconnected')
const serverStatus = ref(null)
const player = ref(null)
const ship = ref(null)
const crew = ref([])
const availableCrew = ref([])
const marketData = ref([])
const messages = ref([])
const activeTab = ref('crew')
const showHiring = ref(false)
const isLoading = ref(false)

// Login form data
const username = ref('')
const email = ref('')

onMounted(() => {
  connectWebSocket()
  loadMarketData()
})

onUnmounted(() => {
  if (websocket.value) {
    websocket.value.close()
  }
})

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
      addMessage(`System tick ${data.data.tick} processed (${data.data.duration}ms)`)
      break
      
    case 'ship:status':
      ship.value = data.data
      break
      
    case 'crew:update':
      crew.value = data.data
      break
  }
}

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
      addMessage(`Welcome aboard, Captain ${username.value}`)
      loadAvailableCrew()
    } else {
      addMessage('Error: Failed to initialize captain profile')
    }
  } catch (error) {
    addMessage('Fatal error: Cannot access personnel database')
  } finally {
    isLoading.value = false
  }
}

async function loadAvailableCrew() {
  try {
    const response = await fetch('http://localhost:3001/api/crew/available')
    if (response.ok) {
      const data = await response.json()
      availableCrew.value = data
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
      loadAvailableCrew()
      // Reload crew data
      const crewResponse = await fetch(`http://localhost:3001/api/ship/${ship.value.id}/crew`)
      if (crewResponse.ok) {
        crew.value = await crewResponse.json()
      }
    }
  } catch (error) {
    addMessage('Error: Hiring process failed')
  }
}

async function loadMarketData() {
  try {
    const response = await fetch('http://localhost:3001/api/market/data')
    if (response.ok) {
      const data = await response.json()
      marketData.value = data.slice(0, 10) // Show first 10 resources
    }
  } catch (error) {
    addMessage('Warning: Market data unavailable')
  }
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

function handleTraitsUpdated(data) {
  // Handle trait updates for crew members
  console.log('Crew traits updated:', data)
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
}

.command-buttons button:hover,
.command-buttons button.active {
  background: #002200;
}

.action-button,
.hire-button {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  margin-top: 8px;
}

.action-button:hover,
.hire-button:hover {
  background: #002200;
}

.crew-list,
.hiring-interface {
  margin-top: 8px;
}

.crew-member,
.crew-candidate {
  border: 1px solid #004400;
  padding: 4px;
  margin: 4px 0;
  background: #000;
}

.crew-candidate {
  position: relative;
}

.hire-button {
  margin: 4px 0 0;
}

.market-data {
  margin-top: 8px;
}

.market-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid #004400;
}

.resource-name {
  flex: 1;
}

.resource-price {
  width: 80px;
  text-align: right;
}

.resource-category {
  width: 60px;
  text-align: right;
  font-size: 10px;
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

.empty-state {
  color: #666;
  font-style: italic;
  padding: 8px 0;
}
</style>