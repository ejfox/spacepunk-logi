<template>
  <div class="simple-ship-interface">
    <!-- Ship Status Display -->
    <StatusDisplay
      title="SHIP STATUS"
      :subtitle="`TICK: ${currentTick}`"
      :items="shipStatusItems"
    >
      <span v-if="heatLevel >= 75" class="heat-warning">⚠ CORPORATE ATTENTION HIGH</span>
    </StatusDisplay>

    <!-- Action Grid -->
    <ActionGrid
      title="SHIP ACTIONS"
      subtitle="SELECT OPERATION"
      :actions="availableActions"
      :columns="3"
      @action="handleAction"
    >
      Use number keys 1-7 or click to execute commands
    </ActionGrid>

    <!-- Event Log -->
    <EventLog
      title="SHIP'S LOG"
      :events="events"
      :max-events="25"
      @clear="clearLog"
    />

    <!-- Location Info -->
    <StatusDisplay
      title="LOCATION STATUS"
      :subtitle="currentLocation"
      :items="locationStatusItems"
    />

    <!-- Reputation & Cascading Effects -->
    <StatusDisplay
      title="REPUTATION MATRIX"
      subtitle="CASCADING EFFECT TRACKING"
      :items="reputationStatusItems"
    >
      <span v-if="playerChoiceHistory.length > 0" class="choice-history">
        RECENT: {{ playerChoiceHistory.slice(-3).map(c => c.choice.toUpperCase()).join(' → ') }}
      </span>
    </StatusDisplay>

    <!-- Dialog System -->
    <DialogChoice
      :visible="showDialog"
      :dialog="currentDialog || {}"
      @choice-made="handleDialogChoice"
      @dialog-cancelled="cancelDialog"
    />

    <!-- Crew Management System -->
    <CrewManagement
      :visible="showCrewManagement"
      :player-id="playerId"
      @close="handleCloseCrewManagement"
      @crew-hired="handleCrewHired"
      @crew-assigned="handleCrewAssigned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StatusDisplay from './brutalist/StatusDisplay.vue'
import ActionGrid from './brutalist/ActionGrid.vue'
import EventLog from './brutalist/EventLog.vue'
import DialogChoice from './brutalist/DialogChoice.vue'
import CrewManagement from './brutalist/CrewManagement.vue'

// Props
const props = defineProps({
  playerId: String,
  shipId: String
})

// Reactive state
const fuel = ref(100)
const maxFuel = ref(100)
const credits = ref(1000)

// Safeguard: Reset credits if they become NaN
function ensureValidCredits() {
  if (isNaN(credits.value) || credits.value === null || credits.value === undefined) {
    console.warn('Credits were NaN, resetting to 1000')
    credits.value = 1000
  }
}
const currentLocation = ref('Earth Station Alpha')
const heatLevel = ref(0)
const currentTick = ref(1)
const events = ref([])
const isProcessing = ref(false)

// CASCADING CHOICE TRACKING for consequence system
const playerChoiceHistory = ref([])
const playerReputation = ref({
  corporate_standing: 50,
  underground_connections: 50,
  equipment_reliability: 100
})

// Dialog system
const showDialog = ref(false)
const currentDialog = ref(null)
const pendingAction = ref(null)

// Crew management system
const showCrewManagement = ref(false)

// Computed properties
const shipStatusItems = computed(() => [
  {
    key: 'FUEL',
    value: `${fuel.value}/${maxFuel.value}`,
    class: fuel.value < 25 ? 'warning' : fuel.value < 10 ? 'danger' : 'default'
  },
  {
    key: 'CREDITS',
    value: `${credits.value} CR`,
    class: credits.value < 100 ? 'warning' : 'default'
  },
  {
    key: 'HEAT',
    value: getHeatDisplay(heatLevel.value),
    class: heatLevel.value > 75 ? 'danger' : heatLevel.value > 50 ? 'warning' : 'default'
  }
])

const locationStatusItems = computed(() => [
  {
    key: 'STATION',
    value: currentLocation.value
  },
  {
    key: 'FUEL PRICE',
    value: `${getFuelPrice()} CR/unit`
  },
  {
    key: 'SECURITY',
    value: getSecurityLevel()
  }
])

const availableActions = computed(() => [
  {
    id: 'refuel',
    key: '1',
    label: 'REFUEL',
    cost: `${getFuelPrice()} CR`,
    disabled: isProcessing.value || credits.value < getFuelPrice() || fuel.value >= maxFuel.value,
    variant: fuel.value < 25 ? 'warning' : 'default'
  },
  {
    id: 'trade',
    key: '2',
    label: 'TRADE',
    disabled: isProcessing.value,
    variant: 'primary'
  },
  {
    id: 'travel',
    key: '3',
    label: 'TRAVEL',
    cost: '20 FUEL',
    disabled: isProcessing.value || fuel.value < 20,
    variant: 'default'
  },
  {
    id: 'explore',
    key: '4',
    label: 'EXPLORE',
    cost: '10 FUEL',
    disabled: isProcessing.value || fuel.value < 10,
    variant: 'primary'
  },
  {
    id: 'spy',
    key: '5',
    label: 'SPY',
    cost: '+HEAT',
    disabled: isProcessing.value,
    variant: 'danger'
  },
  {
    id: 'wait',
    key: '6',
    label: 'WAIT',
    disabled: isProcessing.value,
    variant: 'default'
  },
  {
    id: 'crew',
    key: '7',
    label: 'CREW',
    disabled: isProcessing.value,
    variant: 'primary'
  }
])

// Helper functions
function getHeatDisplay(heat) {
  if (heat < 25) return 'LOW'
  if (heat < 50) return 'MEDIUM'
  if (heat < 75) return 'HIGH'
  return 'CRITICAL'
}

function getFuelPrice() {
  // Simple price variation based on location and heat
  const basePrice = 5
  const locationMultiplier = currentLocation.value.includes('Alpha') ? 1.2 : 1.0
  const heatMultiplier = heatLevel.value > 50 ? 1.5 : 1.0
  return Math.floor(basePrice * locationMultiplier * heatMultiplier)
}

function getSecurityLevel() {
  if (heatLevel.value > 75) return 'ALERT'
  if (heatLevel.value > 50) return 'HEIGHTENED'
  return 'NORMAL'
}

function addEvent(message, type = 'default') {
  events.value.unshift({
    id: Date.now() + Math.random(),
    message,
    type,
    timestamp: new Date(),
    recent: true
  })
  
  // Remove recent flag after a short delay
  setTimeout(() => {
    const event = events.value.find(e => e.message === message)
    if (event) event.recent = false
  }, 2000)
  
  // Keep only last 50 events
  if (events.value.length > 50) {
    events.value = events.value.slice(0, 50)
  }
}

// Action handlers
async function handleAction(actionId) {
  if (isProcessing.value) return
  
  // Check if this action should trigger a dialog
  const dialogActions = ['explore', 'spy', 'trade']
  
  if (dialogActions.includes(actionId)) {
    // Generate dialog for complex actions
    await generateDialog(actionId)
  } else {
    // Execute simple actions directly
    isProcessing.value = true
    try {
      switch (actionId) {
        case 'refuel':
          await handleRefuel()
          break
        case 'travel':
          await handleTravel()
          break
        case 'wait':
          await handleWait()
          break
        case 'crew':
          await handleCrew()
          break
      }
    } finally {
      isProcessing.value = false
    }
  }
}

async function generateDialog(actionId) {
  isProcessing.value = true
  pendingAction.value = actionId
  
  try {
    // Call backend to generate dialog using Story DNA
    const response = await fetch('http://localhost:3666/api/dialog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionType: actionId,
        playerState: {
          fuel: fuel.value,
          credits: credits.value,
          heat: heatLevel.value,
          location: currentLocation.value,
          previous_choices: playerChoiceHistory.value.slice(-5), // Last 5 choices for cascading effects
          reputation: playerReputation.value
        }
      })
    })
    
    if (response.ok) {
      const dialog = await response.json()
      currentDialog.value = dialog
      showDialog.value = true
    } else {
      // Fallback to direct action
      addEvent(`> ${actionId.toUpperCase()} failed: Dialog system offline`, 'warning')
      await executeDirectAction(actionId)
    }
  } catch (error) {
    console.error('Dialog generation failed:', error)
    // Silently fall back to direct action without showing error
    await executeDirectAction(actionId)
  } finally {
    isProcessing.value = false
  }
}

async function executeDirectAction(actionId) {
  // Fallback to original simple actions
  switch (actionId) {
    case 'explore':
      await handleExplore()
      break
    case 'spy':
      await handleSpy()
      break
    case 'trade':
      await handleTrade()
      break
  }
}

function handleDialogChoice(choiceData) {
  const choice = choiceData.choice
  const actionId = pendingAction.value
  
  // TRACK CHOICE for cascading effects
  playerChoiceHistory.value.push({
    action: actionId,
    choice: choice.id,
    timestamp: Date.now(),
    risk: choice.risk
  })
  
  // Keep only last 10 choices for performance
  if (playerChoiceHistory.value.length > 10) {
    playerChoiceHistory.value = playerChoiceHistory.value.slice(-10)
  }
  
  // Apply consequences from dialog choice
  if (choice.consequences) {
    if (choice.consequences.fuel) {
      const fuelChange = parseInt(choice.consequences.fuel)
      fuel.value = Math.max(0, Math.min(maxFuel.value, fuel.value + fuelChange))
    }
    
    if (choice.consequences.credits) {
      const creditsStr = choice.consequences.credits.toString()
      let creditsChange = 0
      
      console.log('Processing credits:', creditsStr) // Debug
      
      // Handle range like "+50-200" or specific like "+150"
      if (creditsStr.includes('-') && !creditsStr.startsWith('-')) {
        // This is a range like "+50-200", not a negative number
        const parts = creditsStr.split('-')
        if (parts.length === 2) {
          const minStr = parts[0].replace(/[+]/g, '') // Remove +
          const maxStr = parts[1]
          const min = parseInt(minStr)
          const max = parseInt(maxStr)
          
          if (!isNaN(min) && !isNaN(max)) {
            creditsChange = Math.floor(Math.random() * (max - min + 1)) + min
            if (creditsStr.startsWith('-')) creditsChange = -creditsChange
          } else {
            console.error('Failed to parse credits range:', creditsStr, 'min:', min, 'max:', max)
            creditsChange = 0
          }
        }
      } else {
        // Single value like "+150" or "-50"
        creditsChange = parseInt(creditsStr)
        if (isNaN(creditsChange)) {
          console.error('Failed to parse credits value:', creditsStr)
          creditsChange = 0
        }
      }
      
      console.log('Credits change:', creditsChange) // Debug
      ensureValidCredits() // Safety check
      const newCredits = Math.max(0, credits.value + creditsChange)
      console.log('Credits:', credits.value, '->', newCredits) // Debug
      credits.value = newCredits
      ensureValidCredits() // Safety check after update
    }
    
    if (choice.consequences.heat) {
      const heatChange = parseInt(choice.consequences.heat)
      heatLevel.value = Math.max(0, Math.min(100, heatLevel.value + heatChange))
    }
  }
  
  // Add narrative event
  addEvent(`> ${actionId.toUpperCase()}: ${choice.text}`, choice.risk === 'high' ? 'danger' : choice.risk === 'medium' ? 'warning' : 'success')
  
  if (choice.consequences?.narrative) {
    addEvent(`> ${choice.consequences.narrative}`, 'info')
  }
  
  // APPLY CASCADING EFFECTS to reputation and future choices
  if (choice.consequences?.cascade) {
    addEvent(`> CONSEQUENCE: ${choice.consequences.cascade}`, 'cascade')
    applyCascadingEffect(choice.consequences.cascade)
  }
  
  // Update reputation based on choice type (affects future dialog generation)
  updateReputation(choice.id, choice.risk)
  
  // Close dialog
  showDialog.value = false
  currentDialog.value = null
  pendingAction.value = null
}

function cancelDialog() {
  addEvent(`> ${pendingAction.value?.toUpperCase() || 'ACTION'} cancelled`, 'default')
  showDialog.value = false
  currentDialog.value = null
  pendingAction.value = null
}

async function handleRefuel() {
  const cost = getFuelPrice()
  const refuelAmount = Math.min(20, maxFuel.value - fuel.value)
  const totalCost = cost * refuelAmount
  
  if (credits.value >= totalCost && refuelAmount > 0) {
    credits.value -= totalCost
    fuel.value += refuelAmount
    addEvent(`> Refueled ${refuelAmount} units for ${totalCost} CR`, 'success')
  } else {
    addEvent(`> Refuel failed: insufficient credits or fuel full`, 'warning')
  }
}

async function handleTrade() {
  // Simple random trade event
  const profit = Math.floor(Math.random() * 200) - 50
  if (profit > 0) {
    credits.value += profit
    addEvent(`> Trade successful: +${profit} CR`, 'success')
  } else {
    credits.value += profit // negative
    addEvent(`> Trade loss: ${profit} CR`, 'warning')
  }
}

async function handleTravel() {
  const fuelCost = 20
  if (fuel.value >= fuelCost) {
    fuel.value -= fuelCost
    
    // Random destination
    const destinations = [
      'Earth Station Alpha',
      'Mars Orbital Beta',
      'Europa Mining Gamma',
      'Asteroid Belt Delta',
      'Titan Refinery Epsilon'
    ]
    
    const newLocation = destinations[Math.floor(Math.random() * destinations.length)]
    currentLocation.value = newLocation
    
    // Cool down heat when traveling
    heatLevel.value = Math.max(0, heatLevel.value - 10)
    
    addEvent(`> Traveled to ${newLocation}`, 'info')
    
    // Random travel event
    if (Math.random() < 0.3) {
      const events = [
        { msg: '> Uneventful journey', type: 'default' },
        { msg: '> Found floating cargo container', type: 'success', credits: 50 },
        { msg: '> Engine trouble detected', type: 'warning' },
        { msg: '> Asteroid field navigation', type: 'info' }
      ]
      
      const event = events[Math.floor(Math.random() * events.length)]
      addEvent(event.msg, event.type)
      
      if (event.credits) {
        credits.value += event.credits
      }
    }
  }
}

async function handleExplore() {
  const fuelCost = 10
  if (fuel.value >= fuelCost) {
    fuel.value -= fuelCost
    
    // Random exploration outcomes
    const outcomes = [
      { msg: '> Found nothing of interest', type: 'default' },
      { msg: '> Discovered abandoned cargo: +100 CR', type: 'success', credits: 100 },
      { msg: '> Found encrypted data chip: +150 CR', type: 'success', credits: 150 },
      { msg: '> Encountered security patrol', type: 'warning', heat: 15 },
      { msg: '> Stumbled into corporate facility', type: 'danger', heat: 25 },
      { msg: '> Located fuel cache: +15 fuel', type: 'success', fuel: 15 }
    ]
    
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]
    addEvent(outcome.msg, outcome.type)
    
    if (outcome.credits) credits.value += outcome.credits
    if (outcome.heat) heatLevel.value = Math.min(100, heatLevel.value + outcome.heat)
    if (outcome.fuel) fuel.value = Math.min(maxFuel.value, fuel.value + outcome.fuel)
  }
}

async function handleSpy() {
  // Spy actions always increase heat but can yield valuable intel
  const heatIncrease = Math.floor(Math.random() * 20) + 10
  heatLevel.value = Math.min(100, heatLevel.value + heatIncrease)
  
  const outcomes = [
    { msg: '> Intercepted corporate communications: +300 CR', type: 'success', credits: 300 },
    { msg: '> Gathered market intelligence: +200 CR', type: 'success', credits: 200 },
    { msg: '> Copied security protocols: +250 CR', type: 'success', credits: 250 },
    { msg: '> Surveillance detected - security alert!', type: 'danger', heat: 20 },
    { msg: '> Counter-intelligence sweep active', type: 'warning', heat: 15 }
  ]
  
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]
  addEvent(outcome.msg, outcome.type)
  
  if (outcome.credits) credits.value += outcome.credits
  if (outcome.heat) heatLevel.value = Math.min(100, heatLevel.value + outcome.heat)
  
  addEvent(`> Heat level increased: +${heatIncrease}`, 'warning')
}

async function handleWait() {
  // Waiting lets events happen and slowly reduces heat
  heatLevel.value = Math.max(0, heatLevel.value - 5)
  
  // Random events can occur while waiting
  if (Math.random() < 0.4) {
    const events = [
      { msg: '> Market prices fluctuate', type: 'info' },
      { msg: '> Corporate patrol passes by', type: 'default' },
      { msg: '> Station announcement: fuel prices rising', type: 'warning' },
      { msg: '> Mysterious ship docks nearby', type: 'info' },
      { msg: '> Time passes quietly', type: 'default' }
    ]
    
    const event = events[Math.floor(Math.random() * events.length)]
    addEvent(event.msg, event.type)
  } else {
    addEvent('> Time passes...', 'default')
  }
}

async function handleCrew() {
  // Open crew management interface
  addEvent('> Accessing crew management terminal...', 'info')
  showCrewManagement.value = true
}

function clearLog() {
  events.value = []
  addEvent('> Log cleared', 'info')
}

// Crew Management Event Handlers
function handleCloseCrewManagement() {
  showCrewManagement.value = false
  addEvent('> Crew management terminal closed', 'info')
}

function handleCrewHired(data) {
  const { candidate, cost } = data
  credits.value = Math.max(0, credits.value - cost)
  addEvent(`> Hired ${candidate.name} (${candidate.role}) for ${cost} CR`, 'success')
  addEvent(`> Welcome aboard, ${candidate.name}!`, 'info')
}

function handleCrewAssigned(crew) {
  addEvent(`> ${crew.name} assignment updated`, 'info')
  // In the future, this could open an assignment dialog or update crew tasks
}

// CASCADING EFFECTS SYSTEM
function applyCascadingEffect(cascadeEffect) {
  const [type, value] = cascadeEffect.split(': ')
  
  switch (type) {
    case 'future_heat_modifier':
      // Future heat generation increased
      addEvent(`> EQUIPMENT DAMAGE: Heat generation +${value}`, 'warning')
      break
    case 'reputation_change':
      addEvent(`> REPUTATION IMPACT: ${value}`, 'info')
      break
    case 'equipment_status':
      addEvent(`> EQUIPMENT STATUS: ${value}`, 'warning')
      if (value.includes('failures')) {
        playerReputation.value.equipment_reliability -= 20
      }
      break
    case 'intel_discovered':
      addEvent(`> INTELLIGENCE GAINED: ${value}`, 'success')
      break
  }
}

function updateReputation(choiceId, risk) {
  // Corporate-friendly choices improve corporate standing
  if (['report', 'withdraw', 'hail'].includes(choiceId)) {
    playerReputation.value.corporate_standing += 5
    playerReputation.value.underground_connections -= 2
  }
  
  // Aggressive/illegal choices improve underground connections
  if (['decrypt', 'aggressive', 'accelerate'].includes(choiceId)) {
    playerReputation.value.underground_connections += 8
    playerReputation.value.corporate_standing -= 3
  }
  
  // High-risk choices can damage equipment reliability
  if (risk === 'high' || risk === 'extreme') {
    playerReputation.value.equipment_reliability -= Math.floor(Math.random() * 10) + 5
  }
  
  // Clamp values
  Object.keys(playerReputation.value).forEach(key => {
    playerReputation.value[key] = Math.max(0, Math.min(100, playerReputation.value[key]))
  })
}

// REPUTATION DISPLAY in status
const reputationStatusItems = computed(() => [
  {
    key: 'CORP STANDING',
    value: `${playerReputation.value.corporate_standing}%`,
    class: playerReputation.value.corporate_standing > 70 ? 'success' : playerReputation.value.corporate_standing < 30 ? 'danger' : 'default'
  },
  {
    key: 'UNDERGROUND',
    value: `${playerReputation.value.underground_connections}%`,
    class: playerReputation.value.underground_connections > 70 ? 'success' : 'default'
  },
  {
    key: 'EQUIPMENT',
    value: `${playerReputation.value.equipment_reliability}%`,
    class: playerReputation.value.equipment_reliability > 80 ? 'success' : playerReputation.value.equipment_reliability < 50 ? 'danger' : 'warning'
  }
])

// Keyboard shortcuts
function handleKeyPress(event) {
  if (isProcessing.value) return
  
  // Don't interfere with copy/paste or other modifier key combinations
  if (event.metaKey || event.ctrlKey || event.altKey) return
  
  const key = event.key
  const actionMap = {
    '1': 'refuel',
    '2': 'trade', 
    '3': 'travel',
    '4': 'explore',
    '5': 'spy',
    '6': 'wait',
    '7': 'crew'
  }
  
  if (actionMap[key]) {
    event.preventDefault()
    handleAction(actionMap[key])
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keypress', handleKeyPress)
  addEvent('> Ship systems online', 'success')
  addEvent('> Welcome aboard, Captain', 'info')
  
  // Simulate tick updates
  setInterval(() => {
    currentTick.value++
  }, 10000)
})

onUnmounted(() => {
  window.removeEventListener('keypress', handleKeyPress)
})
</script>

<style scoped>
.simple-ship-interface {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  grid-template-rows: auto auto 1fr auto;
  gap: 12px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
}

/* Ship Status Display */
.simple-ship-interface > :first-child {
  grid-column: 1;
  grid-row: 1;
}

/* Action Grid */
.simple-ship-interface > :nth-child(2) {
  grid-column: 3;
  grid-row: 1 / 3;
}

/* EventLog - THE STAR OF THE SHOW */
.simple-ship-interface > :nth-child(3) {
  grid-column: 1 / 3;
  grid-row: 3;
  min-height: 400px;
}

/* Location Status */
.simple-ship-interface > :nth-child(4) {
  grid-column: 1;
  grid-row: 2;
}

/* Reputation Matrix */
.simple-ship-interface > :nth-child(5) {
  grid-column: 2;
  grid-row: 1 / 3;
  max-width: 100%;
}

.heat-warning {
  color: #ff0000;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.choice-history {
  color: #00ff00;
  font-size: 0.8em;
  font-weight: bold;
  margin-top: 4px;
  display: block;
}
</style>