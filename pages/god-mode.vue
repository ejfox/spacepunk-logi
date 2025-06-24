<template>
  <div class="god-mode-dashboard">
    <div class="header">
      <h1>SPACEPUNK LOGISTICS - GOD MODE DASHBOARD</h1>
      <p class="subtitle">Complete Encyclopedia View of the Universe</p>
      <div class="last-updated">Last Updated: {{ formatTime(lastUpdate) }}</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <h3>Players</h3>
        <div class="big-number">{{ worldOverview?.summary?.totalPlayers || 0 }}</div>
      </div>
      <div class="summary-card">
        <h3>Ships</h3>
        <div class="big-number">{{ worldOverview?.summary?.totalShips || 0 }}</div>
      </div>
      <div class="summary-card">
        <h3>Living Crew</h3>
        <div class="big-number">{{ worldOverview?.summary?.livingCrewMembers || 0 }}</div>
      </div>
      <div class="summary-card">
        <h3>Stations</h3>
        <div class="big-number">{{ worldOverview?.summary?.totalStations || 0 }}</div>
      </div>
      <div class="summary-card">
        <h3>Market Items</h3>
        <div class="big-number">{{ worldOverview?.summary?.marketItems || 0 }}</div>
      </div>
      <div class="summary-card">
        <h3>Active Training</h3>
        <div class="big-number">{{ worldOverview?.summary?.activeTraining || 0 }}</div>
      </div>
    </div>

    <div class="mission-status" v-if="worldOverview?.missionsByStatus">
      <h3>Mission Status Overview</h3>
      <div class="status-grid">
        <div v-for="(count, status) in worldOverview.missionsByStatus" :key="status" class="status-item">
          <span class="status-label">{{ status.toUpperCase() }}</span>
          <span class="status-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <!-- Players Tab -->
      <div v-if="activeTab === 'players'" class="data-section">
        <h2>Players Overview</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Credits</th>
                <th>Reputation</th>
                <th>Ship</th>
                <th>Crew Count</th>
                <th>Active Missions</th>
                <th>Last Login</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in players" :key="player.id">
                <td class="username">{{ player.username }}</td>
                <td class="email">{{ player.email }}</td>
                <td class="credits">{{ formatNumber(player.credits) }}</td>
                <td class="reputation">{{ player.reputation }}</td>
                <td class="ship-name">{{ player.ship_name || 'No Ship' }}</td>
                <td class="crew-count">{{ player.crew_count || 0 }}</td>
                <td class="missions">{{ player.active_missions || 0 }}</td>
                <td class="last-login">{{ formatTime(player.last_login_at) }}</td>
                <td class="created">{{ formatTime(player.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ships Tab -->
      <div v-if="activeTab === 'ships'" class="data-section">
        <h2>Ships Fleet Overview</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Ship Name</th>
                <th>Hull Type</th>
                <th>Status</th>
                <th>Player</th>
                <th>Crew Count</th>
                <th>Active Missions</th>
                <th>Training Sessions</th>
                <th>Location</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ship in ships" :key="ship.id">
                <td class="ship-name">{{ ship.name }}</td>
                <td class="hull-type">{{ ship.hull_type }}</td>
                <td class="status" :class="ship.status">{{ ship.status }}</td>
                <td class="player-name">{{ ship.player_name || 'No Owner' }}</td>
                <td class="crew-count">{{ ship.crew_count || 0 }}</td>
                <td class="missions">{{ ship.active_missions || 0 }}</td>
                <td class="training">{{ ship.active_training || 0 }}</td>
                <td class="location">{{ ship.location_station || 'Space' }}</td>
                <td class="created">{{ formatTime(ship.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Crew Tab -->
      <div v-if="activeTab === 'crew'" class="data-section">
        <h2>Crew Members Registry</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Homeworld</th>
                <th>Culture</th>
                <th>Ship</th>
                <th>Player</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Training</th>
                <th>Memories</th>
                <th>Hired</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="crew in crewMembers" :key="crew.id">
                <td class="crew-name">{{ crew.name }}</td>
                <td class="age">{{ crew.age }}</td>
                <td class="homeworld">{{ crew.homeworld }}</td>
                <td class="culture">{{ crew.culture }}</td>
                <td class="ship-name">{{ crew.ship_name || 'Unemployed' }}</td>
                <td class="player-name">{{ crew.player_name || 'No Owner' }}</td>
                <td class="skills">
                  E:{{ crew.skill_engineering }} 
                  P:{{ crew.skill_piloting }} 
                  S:{{ crew.skill_social }} 
                  C:{{ crew.skill_combat }}
                </td>
                <td class="status">
                  H:{{ crew.health }} M:{{ crew.morale }} F:{{ crew.fatigue }}
                </td>
                <td class="training">{{ crew.active_training || 0 }}</td>
                <td class="memories">{{ crew.memory_count || 0 }}</td>
                <td class="hired">{{ formatTime(crew.hired_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stations Tab -->
      <div v-if="activeTab === 'stations'" class="data-section">
        <h2>Space Stations Network</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Station Name</th>
                <th>Galaxy</th>
                <th>Sector</th>
                <th>Type</th>
                <th>Population</th>
                <th>Security Level</th>
                <th>Market Items</th>
                <th>Total Missions</th>
                <th>Available Missions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="station in stations" :key="station.id">
                <td class="station-name">{{ station.name }}</td>
                <td class="galaxy">{{ station.galaxy }}</td>
                <td class="sector">{{ station.sector }}</td>
                <td class="type">{{ station.station_type }}</td>
                <td class="population">{{ formatNumber(station.population) }}</td>
                <td class="security">{{ station.security_level }}%</td>
                <td class="market">{{ station.market_items || 0 }}</td>
                <td class="missions">{{ station.total_missions || 0 }}</td>
                <td class="available">{{ station.available_missions || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Missions Tab -->
      <div v-if="activeTab === 'missions'" class="data-section">
        <h2>Missions Database</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Station</th>
                <th>Accepted By</th>
                <th>Ship</th>
                <th>Rewards</th>
                <th>Deadline</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mission in missions" :key="mission.id">
                <td class="mission-title">{{ mission.title }}</td>
                <td class="type">{{ mission.type }}</td>
                <td class="difficulty">{{ mission.difficulty }}</td>
                <td class="status" :class="mission.status">{{ mission.status }}</td>
                <td class="station">{{ mission.station_name || 'N/A' }}</td>
                <td class="player">{{ mission.accepted_by_player || 'None' }}</td>
                <td class="ship">{{ mission.ship_name || 'N/A' }}</td>
                <td class="rewards">{{ formatRewards(mission.rewards) }}</td>
                <td class="deadline">{{ mission.deadline_hours }}h</td>
                <td class="created">{{ formatTime(mission.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Market Tab -->
      <div v-if="activeTab === 'market'" class="data-section">
        <h2>Galactic Market Overview</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Category</th>
                <th>Station</th>
                <th>Galaxy</th>
                <th>Current Price</th>
                <th>Base Price</th>
                <th>Price Change</th>
                <th>Supply</th>
                <th>Demand</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in marketData" :key="item.id">
                <td class="resource-name">{{ item.resource_name }}</td>
                <td class="category">{{ item.resource_category }}</td>
                <td class="station">{{ item.station_name }}</td>
                <td class="galaxy">{{ item.galaxy }}</td>
                <td class="current-price">{{ item.current_price }}</td>
                <td class="base-price">{{ item.base_price }}</td>
                <td class="price-trend" :class="getPriceTrendClass(item.price_trend)">
                  {{ item.price_trend }}
                </td>
                <td class="supply">{{ item.supply }}</td>
                <td class="demand">{{ item.demand }}</td>
                <td class="updated">{{ formatTime(item.last_updated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Training Tab -->
      <div v-if="activeTab === 'training'" class="data-section">
        <h2>Training Queue Monitor</h2>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Crew Member</th>
                <th>Ship</th>
                <th>Player</th>
                <th>Skill Type</th>
                <th>Training Type</th>
                <th>Progress</th>
                <th>Efficiency</th>
                <th>Burnout</th>
                <th>Started</th>
                <th>Estimated End</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="training in trainingData" :key="training.id">
                <td class="crew-name">{{ training.crew_name }}</td>
                <td class="ship-name">{{ training.ship_name || 'No Ship' }}</td>
                <td class="player-name">{{ training.player_name || 'No Owner' }}</td>
                <td class="skill-type">{{ training.skill_type }}</td>
                <td class="training-type">{{ training.training_type }}</td>
                <td class="progress">{{ training.progress_made }}%</td>
                <td class="efficiency">{{ training.efficiency }}%</td>
                <td class="burnout">{{ training.burnout }}%</td>
                <td class="started">{{ formatTime(training.created_at) }}</td>
                <td class="estimated-end">{{ formatTime(training.end_time) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- System Status Tab -->
      <div v-if="activeTab === 'system'" class="data-section">
        <h2>System Performance Monitor</h2>
        <div class="system-stats">
          <div class="stat-card">
            <h4>Server Uptime</h4>
            <div class="stat-value">{{ formatUptime(systemStatus?.serverUptime) }}</div>
          </div>
          <div class="stat-card">
            <h4>Memory Usage</h4>
            <div class="stat-value">{{ formatMemory(systemStatus?.memoryUsage?.used) }}</div>
          </div>
          <div class="stat-card">
            <h4>Heap Used</h4>
            <div class="stat-value">{{ formatMemory(systemStatus?.memoryUsage?.heapUsed) }}</div>
          </div>
        </div>
        
        <h3>Database Table Statistics</h3>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Live Rows</th>
                <th>Inserts</th>
                <th>Updates</th>
                <th>Deletes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="table in systemStatus?.databaseStats" :key="table.tablename">
                <td class="table-name">{{ table.tablename }}</td>
                <td class="live-rows">{{ formatNumber(table.live_rows) }}</td>
                <td class="inserts">{{ formatNumber(table.inserts) }}</td>
                <td class="updates">{{ formatNumber(table.updates) }}</td>
                <td class="deletes">{{ formatNumber(table.deletes) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="auto-refresh">
      <label>
        <input type="checkbox" v-model="autoRefresh" @change="toggleAutoRefresh">
        Auto-refresh every 30 seconds
      </label>
      <button @click="refreshAllData" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Loading...' : 'Refresh Now' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Reactive data
const activeTab = ref('players')
const loading = ref(false)
const autoRefresh = ref(false)
const lastUpdate = ref(null)
let refreshInterval = null

// Data stores
const worldOverview = ref(null)
const players = ref([])
const ships = ref([])
const crewMembers = ref([])
const stations = ref([])
const missions = ref([])
const marketData = ref([])
const trainingData = ref([])
const systemStatus = ref(null)

const tabs = [
  { id: 'players', label: 'Players' },
  { id: 'ships', label: 'Ships' },
  { id: 'crew', label: 'Crew' },
  { id: 'stations', label: 'Stations' },
  { id: 'missions', label: 'Missions' },
  { id: 'market', label: 'Market' },
  { id: 'training', label: 'Training' },
  { id: 'system', label: 'System' }
]

// API calls
async function fetchWorldOverview() {
  const response = await $fetch('/api/god-mode/world-overview')
  worldOverview.value = response
}

async function fetchPlayers() {
  const response = await $fetch('/api/god-mode/players')
  players.value = response
}

async function fetchShips() {
  const response = await $fetch('/api/god-mode/ships')
  ships.value = response
}

async function fetchCrew() {
  const response = await $fetch('/api/god-mode/crew')
  crewMembers.value = response
}

async function fetchStations() {
  const response = await $fetch('/api/god-mode/stations')
  stations.value = response
}

async function fetchMissions() {
  const response = await $fetch('/api/god-mode/missions')
  missions.value = response
}

async function fetchMarketData() {
  const response = await $fetch('/api/god-mode/market')
  marketData.value = response
}

async function fetchTrainingData() {
  const response = await $fetch('/api/god-mode/training')
  trainingData.value = response
}

async function fetchSystemStatus() {
  const response = await $fetch('/api/god-mode/system-status')
  systemStatus.value = response
}

async function refreshAllData() {
  loading.value = true
  try {
    await Promise.all([
      fetchWorldOverview(),
      fetchPlayers(),
      fetchShips(),
      fetchCrew(),
      fetchStations(),
      fetchMissions(),
      fetchMarketData(),
      fetchTrainingData(),
      fetchSystemStatus()
    ])
    lastUpdate.value = new Date()
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  if (autoRefresh.value) {
    refreshInterval = setInterval(refreshAllData, 30000)
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
}

// Utility functions
function formatTime(timestamp) {
  if (!timestamp) return 'Never'
  return new Date(timestamp).toLocaleString()
}

function formatNumber(num) {
  if (!num) return '0'
  return parseInt(num).toLocaleString()
}

function formatMemory(bytes) {
  if (!bytes) return '0 MB'
  return Math.round(bytes / 1024 / 1024) + ' MB'
}

function formatUptime(seconds) {
  if (!seconds) return '0s'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function formatRewards(rewards) {
  if (!rewards || typeof rewards !== 'object') return 'N/A'
  const parts = []
  if (rewards.credits) parts.push(`${rewards.credits}c`)
  if (rewards.reputation) parts.push(`${rewards.reputation}r`)
  return parts.join(', ') || 'N/A'
}

function getPriceTrendClass(trend) {
  if (!trend) return 'neutral'
  const num = parseFloat(trend)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return 'neutral'
}

// Lifecycle
onMounted(() => {
  refreshAllData()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.god-mode-dashboard {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Courier New', monospace;
  background: #000;
  color: #00ff00;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: #00ff00;
}

.subtitle {
  margin: 10px 0;
  color: #888;
  font-size: 1.1rem;
}

.last-updated {
  color: #666;
  font-size: 0.9rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  border: 1px solid #00ff00;
  padding: 20px;
  text-align: center;
  background: #001100;
}

.summary-card h3 {
  margin: 0 0 10px 0;
  color: #00ff00;
  font-size: 1rem;
}

.big-number {
  font-size: 2rem;
  font-weight: bold;
  color: #00ff00;
}

.mission-status {
  margin-bottom: 30px;
  border: 1px solid #00ff00;
  padding: 20px;
  background: #001100;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #333;
  background: #000;
}

.status-label {
  color: #888;
}

.status-count {
  color: #00ff00;
  font-weight: bold;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  border: 1px solid #00ff00;
  background: #000;
  color: #00ff00;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
}

.tab-button:hover {
  background: #002200;
}

.tab-button.active {
  background: #00ff00;
  color: #000;
}

.data-section h2 {
  margin: 0 0 20px 0;
  color: #00ff00;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 10px;
}

.data-table {
  overflow-x: auto;
  border: 1px solid #00ff00;
  background: #001100;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  background: #00ff00;
  color: #000;
  padding: 12px 8px;
  text-align: left;
  font-weight: bold;
  border-bottom: 1px solid #00ff00;
}

.data-table td {
  padding: 8px;
  border-bottom: 1px solid #333;
  color: #00ff00;
}

.data-table tr:hover {
  background: #002200;
}

.username, .ship-name, .crew-name, .station-name, .mission-title {
  font-weight: bold;
  color: #00ff00;
}

.email {
  color: #888;
  font-size: 0.8rem;
}

.credits {
  text-align: right;
  color: #ffff00;
}

.status.active {
  color: #00ff00;
}

.status.inactive {
  color: #ff0000;
}

.status.available {
  color: #00ff00;
}

.status.accepted {
  color: #ffff00;
}

.status.completed {
  color: #888;
}

.price-trend.positive {
  color: #00ff00;
}

.price-trend.negative {
  color: #ff0000;
}

.price-trend.neutral {
  color: #888;
}

.system-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border: 1px solid #00ff00;
  padding: 15px;
  text-align: center;
  background: #001100;
}

.stat-card h4 {
  margin: 0 0 10px 0;
  color: #888;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00ff00;
}

.auto-refresh {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  border-top: 1px solid #00ff00;
}

.auto-refresh label {
  margin-right: 20px;
  color: #888;
}

.refresh-btn {
  padding: 10px 20px;
  border: 1px solid #00ff00;
  background: #000;
  color: #00ff00;
  cursor: pointer;
  font-family: inherit;
}

.refresh-btn:hover:not(:disabled) {
  background: #002200;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="checkbox"] {
  margin-right: 5px;
}
</style>