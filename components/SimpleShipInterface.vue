<template>
  <div ref="mainInterfaceRef" class="h-screen bg-black text-white font-mono p-4 grid grid-rows-[60px_1fr_120px] gap-4">
    <!-- TOP HUD BAR -->
    <div class="grid grid-cols-4 gap-4 text-sm">
      <div class="hud-display">
        <div class="hud-title">FUEL_SYS</div>
        <canvas ref="fuelCanvas" width="120" height="60" class="hud-canvas"></canvas>
      </div>
      <div class="hud-display">
        <div class="hud-title">NAV_SYS</div>
        <canvas ref="navCanvas" width="120" height="60" class="hud-canvas"></canvas>
      </div>
      <div class="hud-display">
        <div class="hud-title">HEAT_MON</div>
        <canvas ref="heatCanvas" width="120" height="60" class="hud-canvas"></canvas>
      </div>
      <div class="hud-display">
        <div class="hud-title">REP_SYS</div>
        <canvas ref="reputationCanvas" width="120" height="60" class="hud-canvas"></canvas>
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
      <div class="text-sm grid grid-cols-[1fr_auto] gap-4">
        <div>
          <div v-if="currentHelpText" class="text-white">{{ currentHelpText }}</div>
          <div v-else class="text-gray-400">Ready for operations. Use hotkeys [1-7] or click actions.</div>
        </div>
        <div class="text-xs">
          <div :class="wsStatus === 'OPEN' ? 'text-green-400' : 'text-red-400'">
            CONN: {{ connectionStatus }}
          </div>
          <div class="text-gray-400">FPS: {{ Math.round(fps) }}</div>
        </div>
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
import * as PIXI from 'pixi.js'
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

// Faction reputation system
const factionReputation = ref({
  corporate: 0,
  pirate: 0,
  independent: 0
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

// HUD canvas references
const fuelCanvas = ref(null)
const navCanvas = ref(null)
const heatCanvas = ref(null)
const reputationCanvas = ref(null)
const fuelApp = ref(null)
const navApp = ref(null)
const heatApp = ref(null)
const reputationApp = ref(null)

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

function getReputationDisplay(faction) {
  const rep = factionReputation.value[faction] || 0
  if (rep >= 50) return `+${rep}` // High reputation shows as positive 
  if (rep <= -25) return `${rep}` // Negative reputation shows as red
  return `${rep}` // Neutral reputation
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

// INSTANT GRATIFICATION: Visual and audio feedback functions
function showResourceAnimation(type, amount) {
  // Create floating +/- text animation
  const container = document.querySelector('.resource-animations')
  if (!container) {
    // Create container if it doesn't exist
    const animContainer = document.createElement('div')
    animContainer.className = 'resource-animations'
    animContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;'
    document.body.appendChild(animContainer)
  }
  
  // Create floating text element
  const floatingText = document.createElement('div')
  floatingText.className = 'floating-resource'
  floatingText.style.cssText = `
    position: absolute;
    font-family: monospace;
    font-size: 24px;
    font-weight: bold;
    pointer-events: none;
    animation: floatUp 2s ease-out forwards;
  `
  
  // Position based on resource type
  let targetElement
  if (type === 'credits') {
    targetElement = document.querySelector('.text-yellow-400')
    floatingText.style.color = amount > 0 ? '#4ade80' : '#f87171'
  } else if (type === 'fuel') {
    targetElement = document.querySelector('.text-green-400')
    floatingText.style.color = amount > 0 ? '#4ade80' : '#f87171'
  } else if (type === 'heat') {
    targetElement = document.querySelector('[class*="HEAT"]')?.parentElement
    floatingText.style.color = amount > 0 ? '#f87171' : '#4ade80' // Heat is bad when it goes up
  }
  
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect()
    floatingText.style.left = `${rect.left + rect.width / 2}px`
    floatingText.style.top = `${rect.top}px`
  } else {
    // Fallback position
    floatingText.style.left = '50%'
    floatingText.style.top = '100px'
  }
  
  floatingText.textContent = `${amount > 0 ? '+' : ''}${amount} ${type.toUpperCase()}`
  
  const animationsContainer = document.querySelector('.resource-animations')
  if (animationsContainer) {
    animationsContainer.appendChild(floatingText)
    
    // Remove after animation
    setTimeout(() => {
      floatingText.remove()
    }, 2000)
  }
  
  // Also trigger flash animation on the actual stat display
  if (targetElement) {
    targetElement.classList.add('stat-flash')
    setTimeout(() => {
      targetElement.classList.remove('stat-flash')
    }, 500)
  }
}

function playSound(type) {
  // Placeholder for sound effects - logs for now, easy to replace with actual audio later
  const sounds = {
    success: '♪ DING! (success sound)',
    loss: '♪ BUZZ! (loss sound)',
    neutral: '♪ BLIP! (neutral sound)',
    warning: '♪ ALARM! (warning sound)',
    danger: '♪ SIREN! (danger sound)'
  }
  
  console.log(`🔊 Sound Effect: ${sounds[type] || sounds.neutral}`)
  
  // TODO: In the future, replace with actual audio playback:
  // const audio = new Audio(`/sounds/${type}.mp3`)
  // audio.volume = 0.3
  // audio.play().catch(e => console.log('Audio play failed:', e))
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
  const streamingActions = ['explore', 'travel', 'spy']
  const dialogActions = ['trade']
  
  if (streamingActions.includes(actionId)) {
    // Use streaming dialog for enhanced actions
    if (actionId === 'explore') {
      await handleExploreDialog()
    } else if (actionId === 'travel') {
      await handleTravelDialog()
    } else if (actionId === 'spy') {
      await handleSpyDialog()
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
      // INSTANT GRATIFICATION: Animate fuel changes
      if (fuelChange !== 0) {
        showResourceAnimation('fuel', fuelChange)
        playSound(fuelChange > 0 ? 'success' : 'loss')
      }
      fuel.value = Math.max(0, Math.min(maxFuel.value, fuel.value + fuelChange))
    }
    
    if (choice.consequences.credits) {
      const creditsStr = choice.consequences.credits.toString()
      let creditsChange = 0
      
      // Handle range like "+50-200" or specific like "+150"
      if (creditsStr.includes('-') && !creditsStr.startsWith('-')) {
        const parts = creditsStr.split('-')
        if (parts.length === 2) {
          const minStr = parts[0].replace(/[+]/g, '')
          const maxStr = parts[1]
          const min = parseInt(minStr)
          const max = parseInt(maxStr)
          
          if (!isNaN(min) && !isNaN(max)) {
            creditsChange = Math.floor(Math.random() * (max - min + 1)) + min
            if (creditsStr.startsWith('-')) creditsChange = -creditsChange
          }
        }
      } else {
        creditsChange = parseInt(creditsStr)
        if (isNaN(creditsChange)) creditsChange = 0
      }
      
      // INSTANT GRATIFICATION: Animate credit changes
      if (creditsChange !== 0) {
        showResourceAnimation('credits', creditsChange)
        playSound(creditsChange > 0 ? 'success' : 'loss')
      }
      
      ensureValidCredits()
      const newCredits = Math.max(0, credits.value + creditsChange)
      credits.value = newCredits
      ensureValidCredits()
    }
    
    if (choice.consequences.heat) {
      const heatChange = parseInt(choice.consequences.heat)
      // INSTANT GRATIFICATION: Animate heat changes
      if (heatChange !== 0) {
        showResourceAnimation('heat', heatChange)
        playSound(heatChange > 0 ? 'warning' : 'success')
      }
      heatLevel.value = Math.max(0, Math.min(100, heatLevel.value + heatChange))
    }
    
    // Handle faction reputation changes
    if (choice.consequences.reputation && typeof choice.consequences.reputation === 'object') {
      Object.keys(choice.consequences.reputation).forEach(faction => {
        const change = choice.consequences.reputation[faction]
        if (typeof change === 'number' && change !== 0) {
          const oldRep = factionReputation.value[faction] || 0
          const newRep = Math.max(-100, Math.min(100, oldRep + change))
          factionReputation.value[faction] = newRep
          
          // Show reputation change notification
          addEvent(`> FACTION REP: ${faction.toUpperCase()} ${change > 0 ? '+' : ''}${change} (${newRep})`, 
                   change > 0 ? 'success' : 'warning')
        }
      })
      
      // Send reputation changes to server
      updateServerReputation(choice.consequences.reputation)
    }
    
    if (choice.consequences.location) {
      currentLocation.value = choice.consequences.location
      addEvent(`> LOCATION UPDATED: Now at ${choice.consequences.location}`, 'success')
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
    // INSTANT GRATIFICATION: Animate credit loss
    showResourceAnimation('credits', -totalCost)
    playSound('loss')
    credits.value -= totalCost
    
    // INSTANT GRATIFICATION: Animate fuel gain
    showResourceAnimation('fuel', refuelAmount)
    playSound('success')
    fuel.value += refuelAmount
    
    addEvent(`> Refueled ${refuelAmount} units for ${totalCost} CR`, 'success')
  } else {
    playSound('warning')
    addEvent(`> Refuel failed: insufficient credits or fuel full`, 'warning')
  }
}

async function handleTrade() {
  // Simple random trade event
  const profit = Math.floor(Math.random() * 200) - 50
  if (profit > 0) {
    // INSTANT GRATIFICATION: Animate credit gain
    showResourceAnimation('credits', profit)
    playSound('success')
    credits.value += profit
    addEvent(`> Trade successful: +${profit} CR`, 'success')
  } else {
    // INSTANT GRATIFICATION: Animate credit loss
    showResourceAnimation('credits', profit)
    playSound('loss')
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
    // Use fetch with streaming for POST requests with body
    const response = await fetch('http://localhost:3666/api/dialog/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, playerState })
    });

    if (!response.ok) {
      // Show BIG OBVIOUS ERROR in the UI
      currentDialog.value = {
        situation: `🚨 STREAMING ERROR ${response.status} 🚨`,
        choices: [{
          id: "streaming_error",
          text: `BACKEND ERROR: ${response.status} ${response.statusText}`,
          risk: "critical",
          consequences: { 
            narrative: `Streaming endpoint failed. Check backend logs. URL: /api/dialog/generate-stream` 
          }
        }],
        id: "streaming-error",
        isLoading: false,
        isStreaming: false
      }
      addEvent(`> 🚨 STREAMING FAILED: ${response.status} ${response.statusText}`, 'danger')
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Show streaming dialog immediately with proper initial state
    currentDialog.value = {
      situation: '',
      choices: [],
      id: `${actionType}-streaming`,
      isStreaming: true,
      isLoading: true,
      progressText: 'Initializing AI systems...',
      startTime: Date.now(),
      maxTokens: 1000,
      tokensReceived: 0,
      streamingContent: '',
      queueStatus: {
        position: null,
        queueLength: null,
        priority: 'high'
      }
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
            
            if (parsed.type === 'queue_status') {
              // Update queue status
              currentDialog.value = {
                ...currentDialog.value,
                queueStatus: parsed.queueStatus,
                progressText: `Queue position: ${parsed.queueStatus.position}`
              };
            } else if (parsed.type === 'chunk') {
              // Update the streaming dialog with new content
              if (parsed.dialog) {
                currentDialog.value = {
                  ...currentDialog.value,
                  ...parsed.dialog,
                  isStreaming: true,
                  isLoading: false,
                  tokensReceived: parsed.tokensReceived,
                  maxTokens: parsed.maxTokens,
                  streamingContent: parsed.fullContent,
                  progressText: `Streaming... ${parsed.tokensReceived}/${parsed.maxTokens} tokens`
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
    
    // Show BIG OBVIOUS ERROR in the UI
    currentDialog.value = {
      situation: `🚨 STREAMING SYSTEM FAILURE 🚨`,
      choices: [{
        id: "streaming_system_error",
        text: `SYSTEM ERROR: ${error.message}`,
        risk: "critical",
        consequences: { 
          narrative: `Streaming failed completely. Error: ${error.message}. Check browser console and backend logs.` 
        }
      }],
      id: "streaming-system-error",
      isLoading: false,
      isStreaming: false
    }
    addEvent(`> 🚨 STREAMING SYSTEM ERROR: ${error.message}`, 'danger')
    isGeneratingDialog.value = false
    generationProgress.value = ''
    
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

    // Start streaming dialog generation (fallback to regular for now)
    try {
      await startStreamingDialog('explore', playerState)
    } catch (streamError) {
      console.warn('Streaming failed, falling back to regular dialog:', streamError)
      // Fallback to regular dialog generation
      const response = await fetch('http://localhost:3666/api/dialog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'explore',
          playerState
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const dialog = await response.json()
      currentDialog.value = dialog
      isGeneratingDialog.value = false
      generationProgress.value = ''
      addEvent(`> Exploration options generated`, 'success')
    }

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

async function handleSpyDialog() {
  pendingAction.value = 'spy'
  isGeneratingDialog.value = true
  showDialog.value = true
  
  // Show loading dialog
  currentDialog.value = {
    situation: "🕵️ INITIATING COVERT OPERATIONS...",
    choices: [],
    id: "loading",
    isLoading: true,
    progressText: ''
  }
  
  addEvent(`> Activating surveillance protocols...`, 'info')
  
  try {
    generationProgress.value = 'Analyzing local security networks...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 400))
    
    generationProgress.value = 'Scanning for intelligence opportunities...'
    currentDialog.value.progressText = generationProgress.value
    await new Promise(resolve => setTimeout(resolve, 300))
    
    generationProgress.value = 'Generating espionage options...'
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

    // Start streaming dialog generation (fallback to regular for now)
    try {
      await startStreamingDialog('spy', playerState)
    } catch (streamError) {
      console.warn('Streaming failed, falling back to regular dialog:', streamError)
      // Fallback to regular dialog generation
      const response = await fetch('http://localhost:3666/api/dialog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'spy',
          playerState
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const dialog = await response.json()
      currentDialog.value = dialog
      isGeneratingDialog.value = false
      generationProgress.value = ''
      addEvent(`> Espionage options generated`, 'success')
    }

  } catch (error) {
    console.error('Spy dialog error:', error)
    currentDialog.value = {
      situation: "🚨 SURVEILLANCE SYSTEMS COMPROMISED 🚨",
      choices: [{
        id: "spy_error",
        text: `ERROR: ${error.message}`,
        risk: "critical",
        consequences: { narrative: "Start LM Studio on port 1234 for dynamic espionage content" }
      }],
      id: "spy-error"
    }
    isGeneratingDialog.value = false
    generationProgress.value = ''
    addEvent(`> Espionage systems offline`, 'danger')
  }
}

async function handleSpy() {
  // Legacy fallback - should not be called anymore since spy uses dialog
  console.warn('handleSpy() called - spy should use handleSpyDialog() instead')
  await handleSpyDialog()
}

async function handleWait() {
  // Waiting lets events happen and slowly reduces heat
  const heatReduction = Math.min(5, heatLevel.value)
  if (heatReduction > 0) {
    // INSTANT GRATIFICATION: Animate heat reduction
    showResourceAnimation('heat', -heatReduction)
    playSound('success')
  }
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


// HUD display initialization
function initHUDDisplays() {
  // Initialize fuel display
  if (fuelCanvas.value) {
    fuelApp.value = new PIXI.Application({
      view: fuelCanvas.value,
      width: 120,
      height: 60,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    drawFuelDisplay()
  }
  
  // Initialize nav display
  if (navCanvas.value) {
    navApp.value = new PIXI.Application({
      view: navCanvas.value,
      width: 120,
      height: 60,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    drawNavDisplay()
  }
  
  // Initialize heat display
  if (heatCanvas.value) {
    heatApp.value = new PIXI.Application({
      view: heatCanvas.value,
      width: 120,
      height: 60,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    drawHeatDisplay()
  }
  
  // Initialize reputation display
  if (reputationCanvas.value) {
    reputationApp.value = new PIXI.Application({
      view: reputationCanvas.value,
      width: 120,
      height: 60,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    drawReputationDisplay()
  }
}

// Drawing functions for each display
function drawFuelDisplay() {
  if (!fuelApp.value) return
  
  // Clear existing graphics
  fuelApp.value.stage.removeChildren()
  
  const graphics = new PIXI.Graphics()
  fuelApp.value.stage.addChild(graphics)
  
  // Draw fuel bar
  const fuelPercent = fuel.value / maxFuel.value
  const barWidth = 100
  const barHeight = 10
  
  // Background
  graphics.beginFill(0x333333)
  graphics.drawRect(10, 20, barWidth, barHeight)
  graphics.endFill()
  
  // Fuel level
  graphics.beginFill(fuelPercent > 0.5 ? 0xFFFFFF : 0x666666)
  graphics.drawRect(10, 20, barWidth * fuelPercent, barHeight)
  graphics.endFill()
  
  // Fuel numbers in pixel style
  const fuelText = `${fuel.value}/${maxFuel.value}`
  drawPixelText(graphics, fuelText, 10, 40, 0xFFFFFF)
  
  // Credits
  const creditsText = `CR:${credits.value}`
  drawPixelText(graphics, creditsText, 10, 50, 0xFFFFFF)
}

function drawNavDisplay() {
  if (!navApp.value) return
  
  // Clear existing graphics
  navApp.value.stage.removeChildren()
  
  const graphics = new PIXI.Graphics()
  navApp.value.stage.addChild(graphics)
  
  // Draw location as simple text blocks
  const locationText = currentLocation.value.substring(0, 12)
  drawPixelText(graphics, locationText, 5, 20, 0xFFFFFF)
  
  // Draw tick counter
  const tickText = `T:${currentTick.value}`
  drawPixelText(graphics, tickText, 5, 35, 0xFFFFFF)
  
  // Draw simple nav indicator
  graphics.beginFill(0xFFFFFF)
  graphics.drawRect(5, 45, 2, 2)
  graphics.drawRect(9, 45, 2, 2)
  graphics.drawRect(13, 45, 2, 2)
  graphics.endFill()
}

function drawHeatDisplay() {
  if (!heatApp.value) return
  
  // Clear existing graphics
  heatApp.value.stage.removeChildren()
  
  const graphics = new PIXI.Graphics()
  heatApp.value.stage.addChild(graphics)
  
  // Heat level visualization
  const heatBars = Math.floor(heatLevel.value / 10)
  for (let i = 0; i < 10; i++) {
    const intensity = i < heatBars ? 0xFFFFFF : 0x333333
    graphics.beginFill(intensity)
    graphics.drawRect(5 + i * 10, 20, 8, 15)
    graphics.endFill()
  }
  
  // Heat text
  const heatText = getHeatDisplay(heatLevel.value)
  drawPixelText(graphics, heatText, 5, 40, 0xFFFFFF)
  
  // Security level
  const secText = `SEC:${getSecurityLevel()}`
  drawPixelText(graphics, secText, 5, 50, 0xFFFFFF)
}

function drawReputationDisplay() {
  if (!reputationApp.value) return
  
  // Clear existing graphics
  reputationApp.value.stage.removeChildren()
  
  const graphics = new PIXI.Graphics()
  reputationApp.value.stage.addChild(graphics)
  
  // Draw reputation bars
  const reps = [
    { name: 'CORP', value: factionReputation.value.corporate || 0, y: 15 },
    { name: 'PIRATE', value: factionReputation.value.pirate || 0, y: 28 },
    { name: 'INDEP', value: factionReputation.value.independent || 0, y: 41 }
  ]
  
  reps.forEach(rep => {
    const repText = `${rep.name}:${rep.value >= 0 ? '+' : ''}${rep.value}`
    drawPixelText(graphics, repText, 5, rep.y, 0xFFFFFF)
  })
}

function drawPixelText(graphics, text, x, y, color) {
  // Simple pixel text - just draw rectangles for now
  // In a real implementation, you'd have a proper bitmap font
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== ' ') {
      graphics.beginFill(color)
      graphics.drawRect(x + i * 6, y, 4, 6)
      graphics.endFill()
    }
  }
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

async function updateServerReputation(reputationChanges) {
  try {
    const response = await fetch(`http://localhost:3666/api/player/${props.playerId}/reputation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reputationChanges })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('📊 Server reputation updated:', result.reputation)
    } else {
      console.warn('Failed to update server reputation:', response.status)
    }
  } catch (error) {
    console.error('Error updating server reputation:', error)
  }
}

async function loadPlayerReputation() {
  try {
    const response = await fetch(`http://localhost:3666/api/player/${props.playerId}`)
    if (response.ok) {
      const player = await response.json()
      if (player.reputation) {
        factionReputation.value = { ...player.reputation }
        console.log('📊 Loaded player reputation:', factionReputation.value)
      }
    }
  } catch (error) {
    console.warn('Failed to load player reputation:', error)
  }
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
        if (gameUpdate.fuel !== undefined) {
          fuel.value = gameUpdate.fuel
          drawFuelDisplay()
        }
        if (gameUpdate.credits !== undefined) {
          ensureValidCredits()
          credits.value = gameUpdate.credits
          drawFuelDisplay()
        }
        if (gameUpdate.heat !== undefined) {
          heatLevel.value = gameUpdate.heat
          drawHeatDisplay()
        }
        if (gameUpdate.location) {
          currentLocation.value = gameUpdate.location
          drawNavDisplay()
        }
        drawNavDisplay() // Update tick counter
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

// Watch for value changes to update displays
watch(fuel, () => drawFuelDisplay())
watch(credits, () => drawFuelDisplay())
watch(heatLevel, () => drawHeatDisplay())
watch(currentLocation, () => drawNavDisplay())
watch(currentTick, () => drawNavDisplay())
watch(factionReputation, () => drawReputationDisplay(), { deep: true })

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
onMounted(async () => {
  addEvent('> Ship systems online', 'success')
  addEvent('> Welcome aboard, Captain', 'info')
  addEvent(`> Performance monitor: ${gameQuality.value.toUpperCase()} mode`, 'info')
  
  // Initialize HUD displays
  initHUDDisplays()
  
  // Load player reputation from server
  if (props.playerId) {
    await loadPlayerReputation()
    addEvent('> Faction standings loaded', 'info')
  }
})
</script>

<style>
/* INSTANT GRATIFICATION: CSS Animations for stat changes */
@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-30px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}

@keyframes statFlash {
  0% {
    filter: brightness(1);
    transform: scale(1);
  }
  50% {
    filter: brightness(1.5) saturate(2);
    transform: scale(1.1);
  }
  100% {
    filter: brightness(1);
    transform: scale(1);
  }
}

.stat-flash {
  animation: statFlash 0.5s ease-out;
}

/* Brutalist style for floating text */
.floating-resource {
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
  border: 1px solid currentColor;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.9);
}

/* HUD Display Styles */
.hud-display {
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

.hud-title {
  background: #111111;
  border-bottom: 2px solid #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-weight: bold;
  color: #ff6600;
}

.hud-canvas {
  display: block;
  background: #000000;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex: 1;
}
</style>