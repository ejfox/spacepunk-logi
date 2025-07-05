<template>
  <div ref="mainInterfaceRef" class="h-screen bg-black text-white font-mono p-4 grid grid-rows-[60px_1fr_120px] gap-4">
    <!-- TOP HUD BAR -->
    <div class="grid grid-cols-4 gap-4 text-sm">
      <div class="border border-white p-2 bg-gray-900">
        <div class="text-green-400">FUEL: {{ fuel }}/{{ maxFuel }}</div>
        <div class="text-yellow-400">CREDITS: {{ credits }}</div>
      </div>
      <div class="border border-white p-2 bg-gray-900">
        <div class="text-blue-400">LOCATION: {{ currentLocation }}</div>
        <div class="text-gray-400">TICK: {{ currentTick }}</div>
      </div>
      <div class="border border-white p-2 bg-gray-900">
        <div :class="heatLevel > 50 ? 'text-red-400' : 'text-green-400'">
          HEAT: {{ getHeatDisplay(heatLevel) }}
        </div>
        <div class="text-gray-400">SEC: {{ getSecurityLevel() }}</div>
      </div>
      <div class="border border-white p-2 bg-gray-900">
        <div :class="wsStatus === 'OPEN' ? 'text-green-400' : 'text-red-400'">
          CONN: {{ connectionStatus }}
        </div>
        <div class="text-gray-400">FPS: {{ Math.round(fps) }}</div>
      </div>
    </div>

    <!-- MAIN GAME AREA -->
    <div class="grid grid-cols-[1fr_300px] gap-4">
      <!-- Game Log -->
      <EventLog
        title="OPERATIONAL LOG"
        :events="events"
        :max-events="20"
        @clear="clearLog"
      />
      
      <!-- Actions -->
      <ActionGrid
        title="ACTIONS"
        :actions="availableActions"
        :columns="2"
        @action="handleActionWithSync"
        @hover-action="handleActionHover"
        @clear-hover="clearHelpText"
      />
    </div>

    <!-- BOTTOM STATUS BAR -->
    <div class="border border-white p-3 bg-gray-950">
      <div class="text-green-400 text-xs mb-1">> SYSTEM STATUS</div>
      <div class="text-sm">
        <div v-if="currentHelpText" class="text-white">{{ currentHelpText }}</div>
        <div v-else class="text-gray-400">Ready for operations. Use hotkeys [1-7] or click actions.</div>
      </div>
    </div>

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

    <!-- Performance Monitor -->
    <PerformanceMonitor 
      :fps="fps"
      :quality-mode="gameQuality"
      :ws-status="wsStatus"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import { useWebSocket, useMagicKeys, useElementVisibility, useFps, useIntervalFn } from '@vueuse/core'
import StatusDisplay from './brutalist/StatusDisplay.vue'
import ActionGrid from './brutalist/ActionGrid.vue'
import EventLog from './brutalist/EventLog.vue'
import DialogChoice from './brutalist/DialogChoice.vue'
import CrewManagement from './brutalist/CrewManagement.vue'
import PerformanceMonitor from './brutalist/PerformanceMonitor.vue'

// Props
const props = defineProps({
  playerId: String,
  shipId: String
})

// Reactive state
const fuel = ref(100)
const maxFuel = ref(100)
const credits = ref(1000)

// Player reputation system
const playerReputation = ref({
  corporate_standing: 50,
  underground_connections: 30,
  equipment_reliability: 75
})

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


// Dialog system
const showDialog = ref(false)
const currentDialog = ref(null)
const pendingAction = ref(null)
const isGeneratingDialog = ref(false)
const generationProgress = ref('')

// Crew management system
const showCrewManagement = ref(false)

// Help text system
const currentHelpText = ref('')

// Computed properties
const shipStatusItems = computed(() => [
  { key: 'CONNECTION', value: connectionStatus.value, class: wsStatus.value === 'OPEN' ? 'success' : 'danger' },
  { key: 'FUEL', value: `${fuel.value}/${maxFuel.value}`, class: fuel.value < 25 ? 'warning' : 'default' },
  { key: 'CREDITS', value: `${credits.value} CR`, class: credits.value < 100 ? 'warning' : 'default' },
  { key: 'HEAT', value: getHeatDisplay(heatLevel.value), class: heatLevel.value > 50 ? 'warning' : 'default' }
])

const locationStatusItems = computed(() => [
  { key: 'STATION', value: currentLocation.value },
  { key: 'FUEL PRICE', value: `${getFuelPrice()} CR/unit` },
  { key: 'SECURITY', value: getSecurityLevel() }
])

const availableActions = computed(() => [
  { id: 'refuel', key: '1', label: 'REFUEL', cost: `${getFuelPrice()} CR`, disabled: isProcessing.value || credits.value < getFuelPrice() || fuel.value >= maxFuel.value, variant: fuel.value < 25 ? 'warning' : 'default' },
  { id: 'trade', key: '2', label: 'TRADE', disabled: isProcessing.value, variant: 'primary' },
  { id: 'travel', key: '3', label: 'TRAVEL', cost: '20 FUEL', disabled: isProcessing.value || fuel.value < 20, variant: 'default' },
  { id: 'explore', key: '4', label: 'EXPLORE', cost: '10 FUEL', disabled: isProcessing.value || fuel.value < 10, variant: 'primary' },
  { id: 'spy', key: '5', label: 'SPY', cost: '+HEAT', disabled: isProcessing.value, variant: 'danger' },
  { id: 'wait', key: '6', label: 'WAIT', disabled: isProcessing.value, variant: 'default' },
  { id: 'crew', key: '7', label: '★ CREW ★', disabled: isProcessing.value, variant: 'primary' }
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

// Help text handlers
function updateHelpText(text) {
  currentHelpText.value = text
}

function clearHelpText() {
  currentHelpText.value = ''
}

function handleActionHover(action) {
  if (action.tooltip?.description) {
    updateHelpText(`${action.tooltip.title || action.label}: ${action.tooltip.description}`)
  } else {
    updateHelpText(`${action.label}: ${action.id === 'explore' ? 'Initiate deep space reconnaissance mission' : 
                   action.id === 'trade' ? 'Access interstellar commerce protocols' : 
                   action.id === 'refuel' ? 'Replenish deuterium fuel reserves' : 
                   action.id === 'wait' ? 'Enter standby mode and wait for next opportunity' : 
                   'Execute authorized operation'}`)
  }
}

// Action handlers
async function handleAction(actionId) {
  if (isProcessing.value) return
  
  // Check if this action should trigger a dialog
  const streamingActions = ['explore', 'travel']
  const dialogActions = ['spy', 'trade']
  
  if (streamingActions.includes(actionId)) {
    // Use streaming dialog for enhanced actions
    if (actionId === 'explore') {
      await handleExploreDialog()
    } else if (actionId === 'travel') {
      await handleTravelDialog()
    }
  } else if (dialogActions.includes(actionId)) {
    // Generate dialog for complex actions (non-streaming)
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
          await handleTravelDialog()
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
          location: currentLocation.value
        }
      })
    })
    
    if (response.ok) {
      const dialog = await response.json()
      currentDialog.value = dialog
      showDialog.value = true
    } else {
      const error = await response.json()
      throw new Error(error.message || error.error || 'LLM service unavailable')
    }
  } catch (error) {
    console.error('Dialog generation failed:', error)
    // Show big error overlay
    currentDialog.value = {
      situation: "🚨 LLM SERVICE UNAVAILABLE 🚨",
      choices: [{
        id: "llm_error",
        text: `ERROR: ${error.message}`,
        risk: "critical",
        consequences: { narrative: "Start LM Studio on port 1234 for dynamic content generation" }
      }],
      id: "llm-error"
    }
    showDialog.value = true
  } finally {
    isProcessing.value = false
  }
}

async function executeDirectAction(actionId) {
  // Fallback to original simple actions
  switch (actionId) {
    case 'explore':
      await handleExploreDialog()
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

async function handleTravelDialog() {
  pendingAction.value = 'travel'
  isGeneratingDialog.value = true
  showDialog.value = true
  
  // Show loading dialog
  currentDialog.value = {
    situation: "🚀 ACCESSING NAVIGATION DATABASE...",
    choices: [],
    id: "loading",
    isLoading: true,
    progressText: ''
  }
  
  addEvent(`> Querying navigation systems...`, 'info')
  
  try {
    generationProgress.value = 'Analyzing current location and fuel reserves...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 500))
    
    generationProgress.value = 'Querying galactic station database...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 300))
    
    generationProgress.value = 'Calculating optimal travel routes...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 400))
    
    generationProgress.value = 'Generating ship AI recommendations...'
    currentDialog.value.progressText = generationProgress.value
    
    // Prepare for streaming
    const playerState = {
      playerId: props.playerId,
      shipId: props.shipId, 
      fuel: fuel.value,
      credits: credits.value,
      heat: heatLevel.value,
      location: currentLocation.value,
      maxFuel: maxFuel.value
    }

    // Start streaming dialog generation
    await startStreamingDialog('travel', playerState)

  } catch (error) {
    console.error('Travel dialog error:', error)
    currentDialog.value = {
      situation: "🚨 NAVIGATION SYSTEM UNAVAILABLE 🚨",
      choices: [{
        id: "nav_error",
        text: `ERROR: ${error.message}`,
        risk: "critical",
        consequences: { narrative: "Start LM Studio on port 1234 for dynamic travel generation" }
      }],
      id: "nav-error"
    }
    isGeneratingDialog.value = false
    generationProgress.value = ''
    addEvent(`> Navigation system offline`, 'danger')
  }
}

async function startStreamingDialog(actionType, playerState) {
  try {
    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(`http://localhost:3666/api/dialog/generate-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, playerState })
    });

    // Unfortunately EventSource doesn't support POST with body
    // Let's use fetch with streaming instead
    const response = await fetch('http://localhost:3666/api/dialog/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, playerState })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Show streaming dialog immediately
    currentDialog.value = {
      situation: '',
      choices: [],
      id: `${actionType}-streaming`,
      isStreaming: true,
      progressText: 'Initializing AI systems...'
    };

    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'chunk') {
              // Update the streaming dialog with new content
              if (parsed.dialog) {
                currentDialog.value = {
                  ...currentDialog.value,
                  ...parsed.dialog,
                  isStreaming: true,
                  progressText: `Generating... ${parsed.fullContent.length} characters`
                };
              }
            } else if (parsed.type === 'complete') {
              // Final dialog is complete
              currentDialog.value = parsed.dialog;
              isGeneratingDialog.value = false;
              generationProgress.value = '';
              addEvent(`> ${actionType} options generated via streaming`, 'success');
              break;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (error) {
            console.warn('Failed to parse streaming data:', error);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Streaming dialog error:', error);
    throw error;
  }
}

async function handleExploreDialog() {
  pendingAction.value = 'explore'
  isGeneratingDialog.value = true
  showDialog.value = true
  
  // Show loading dialog
  currentDialog.value = {
    situation: "🔍 SCANNING LOCAL AREA...",
    choices: [],
    id: "loading",
    isLoading: true,
    progressText: ''
  }
  
  addEvent(`> Initiating exploration protocols...`, 'info')
  
  try {
    generationProgress.value = 'Analyzing sensor readings...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 400))
    
    generationProgress.value = 'Checking for anomalies and opportunities...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 300))
    
    generationProgress.value = 'Generating exploration options...'
    currentDialog.value.progressText = generationProgress.value
    
    // Prepare for streaming
    const playerState = {
      playerId: props.playerId,
      shipId: props.shipId, 
      fuel: fuel.value,
      credits: credits.value,
      heat: heatLevel.value,
      location: currentLocation.value,
      maxFuel: maxFuel.value
    }

    // Start streaming dialog generation
    await startStreamingDialog('explore', playerState)

  } catch (error) {
    console.error('Explore dialog error:', error)
    currentDialog.value = {
      situation: "🚨 SENSOR ARRAY MALFUNCTION 🚨",
      choices: [{
        id: "explore_error",
        text: `ERROR: ${error.message}`,
        risk: "critical",
        consequences: { narrative: "Start LM Studio on port 1234 for dynamic exploration content" }
      }],
      id: "explore-error"
    }
    isGeneratingDialog.value = false
    generationProgress.value = ''
    addEvent(`> Exploration systems offline`, 'danger')
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

// Enhanced action handling with WebSocket integration
async function handleActionWithSync(actionId) {
  if (isProcessing.value) return
  
  // Send action to server if connected
  if (wsStatus.value === 'OPEN') {
    wsSend(JSON.stringify({
      type: 'player_action',
      action: actionId,
      playerId: props.playerId,
      timestamp: Date.now()
    }))
  }
  
  // Continue with local action handling
  await handleAction(actionId)
}

// WebSocket connection for real-time updates
const { status: wsStatus, data: wsData, send: wsSend } = useWebSocket('ws://localhost:3666', {
  autoReconnect: {
    retries: 10,
    delay: 2000,
    onFailed() {
      addEvent('> CONNECTION LOST: Switching to emergency protocols', 'danger')
    }
  },
  heartbeat: {
    message: JSON.stringify({ type: 'ping', playerId: props.playerId }),
    interval: 30000
  },
  onConnected() {
    addEvent('> QUANTUM LINK ESTABLISHED: Real-time sync active', 'success')
  },
  onDisconnected() {
    addEvent('> QUANTUM LINK SEVERED: Operating on local cache', 'warning')
  }
})

// Magic Keys for enhanced keyboard shortcuts
const keys = useMagicKeys()
const { Escape, Shift } = keys

// Enhanced keyboard handling
watchEffect(() => {
  if (keys['1'].value && !isProcessing.value) handleAction('refuel')
  if (keys['2'].value && !isProcessing.value) handleAction('trade')
  if (keys['3'].value && !isProcessing.value) handleAction('travel')
  if (keys['4'].value && !isProcessing.value) handleAction('explore')
  if (keys['5'].value && !isProcessing.value) handleAction('spy')
  if (keys['6'].value && !isProcessing.value) handleAction('wait')
  if (keys['7'].value && !isProcessing.value) handleAction('crew')
})

// Emergency shortcuts
watchEffect(() => {
  if (Shift.value && Escape.value) {
    addEvent('> EMERGENCY OVERRIDE ACTIVATED', 'danger')
    // Emergency stop all operations
    isProcessing.value = false
    showDialog.value = false
    showCrewManagement.value = false
  }
})

// Performance monitoring
const fps = useFps()
const gameQuality = computed(() => {
  if (fps.value > 50) return 'optimal'
  if (fps.value > 30) return 'standard'
  return 'conservation'
})

// Element visibility for performance optimization
const mainInterfaceRef = ref()
const isMainVisible = useElementVisibility(mainInterfaceRef)

// UI animations and local timers
const { pause: pauseAnimations, resume: resumeAnimations, isActive: animationsActive } = useIntervalFn(() => {
  // Blink status indicators
  if (heatLevel.value > 75) {
    // High heat blinking handled by CSS animate-pulse already
  }
  
  // Update local progress indicators
  // This runs between server ticks for smooth UI
}, 500) // 2fps for subtle animations

const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(() => {
  // Local heartbeat for UI responsiveness indicators
  if (wsStatus.value === 'OPEN') {
    // Connection good, maybe pulse a green indicator
  } else {
    // Connection issues, flash warning
  }
}, 2000)

// WebSocket data handling
watch(wsData, (newData) => {
  if (!newData) return
  
  try {
    const gameUpdate = JSON.parse(newData)
    
    switch (gameUpdate.type) {
      case 'tick_update':
        currentTick.value = gameUpdate.tick
        if (gameUpdate.fuel !== undefined) fuel.value = gameUpdate.fuel
        if (gameUpdate.credits !== undefined) {
          ensureValidCredits()
          credits.value = gameUpdate.credits
        }
        if (gameUpdate.heat !== undefined) heatLevel.value = gameUpdate.heat
        if (gameUpdate.location) currentLocation.value = gameUpdate.location
        addEvent(`> TICK ${gameUpdate.tick}: Systems synchronized`, 'info')
        break
        
      case 'event':
        addEvent(`> ${gameUpdate.message}`, gameUpdate.eventType || 'info')
        break
        
      case 'crew_update':
        // Handle crew status updates
        addEvent(`> CREW STATUS: ${gameUpdate.summary}`, 'info')
        break
        
      case 'market_update':
        addEvent(`> MARKET FLUX: ${gameUpdate.summary}`, 'info')
        break
        
      case 'system_alert':
        addEvent(`> SYSTEM ALERT: ${gameUpdate.message}`, 'warning')
        break
    }
  } catch (error) {
    console.error('Failed to parse WebSocket data:', error)
  }
})

// Performance-based quality adjustments
watch(gameQuality, (quality) => {
  if (quality === 'conservation') {
    addEvent('> PERFORMANCE MODE: Conservation protocols active', 'warning')
    pauseAnimations()
  } else if (quality === 'optimal' && !animationsActive.value) {
    addEvent('> PERFORMANCE MODE: Full visual fidelity restored', 'success')
    resumeAnimations()
  }
})

// Pause animations when interface not visible
watch(isMainVisible, (visible) => {
  if (visible && gameQuality.value !== 'conservation') {
    resumeAnimations()
    resumeHeartbeat()
  } else {
    pauseAnimations()
    pauseHeartbeat()
  }
})

// Connection status in ship status
const connectionStatus = computed(() => {
  switch (wsStatus.value) {
    case 'CONNECTING': return 'ESTABLISHING LINK...'
    case 'OPEN': return 'QUANTUM SYNC ACTIVE'
    case 'CLOSED': return 'OFFLINE MODE'
    default: return 'CONNECTION ERROR'
  }
})

// Lifecycle
onMounted(() => {
  addEvent('> Ship systems online', 'success')
  addEvent('> Welcome aboard, Captain', 'info')
  addEvent(`> Performance monitor: ${gameQuality.value.toUpperCase()} mode`, 'info')
})
</script>