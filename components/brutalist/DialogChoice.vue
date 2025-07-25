<template>
  <div class="dialog-overlay" v-if="visible" @click.self="handleBackdropClick">
    <div class="dialog-container">
      <div class="dialog-header">
        <span class="header-marker">></span>
        <span class="dialog-title">{{ dialog.title || 'INCOMING TRANSMISSION' }}</span>
        <span class="dialog-id">{{ dialog.id || generateId() }}</span>
      </div>
      
      <div class="dialog-situation">
        <div class="situation-display">
          <div class="situation-text-area">
            <div class="situation-text" :class="{ 'streaming': dialog.isStreaming }">
              {{ dialog.situation }}
              <span v-if="dialog.isStreaming" class="streaming-cursor">█</span>
            </div>
            <div v-if="dialog.context" class="situation-context">
              <span v-for="(value, key) in dialog.context" :key="key" class="context-item">
                {{ key.toUpperCase() }}: {{ value }}
              </span>
            </div>
          </div>
          <div class="situation-visual">
            <canvas 
              ref="situationCanvas"
              width="128"
              height="64"
              class="situation-canvas"
            />
          </div>
        </div>
      </div>
      
      <div class="dialog-choices">
        <!-- Loading State -->
        <StreamingLoader
          v-if="dialog.isLoading || dialog.isStreaming"
          :title="dialog.isStreaming ? 'STREAMING DIALOG GENERATION' : 'GENERATING RESPONSE OPTIONS'"
          :max-tokens="dialog.maxTokens || 1000"
          :queue-position="dialog.queueStatus?.position"
          :queue-length="dialog.queueStatus?.queueLength"
          :priority="dialog.queueStatus?.priority || 'normal'"
          :tokens-received="dialog.tokensReceived || 0"
          :streaming-content="dialog.streamingContent"
          :is-streaming="dialog.isStreaming"
          :start-time="dialog.startTime"
        />
        
        <!-- Normal Choices -->
        <div v-else>
          <div class="choices-header">
            <span class="header-marker">></span>
            SELECT RESPONSE:
          </div>
          
          <div
            v-for="(choice, index) in dialog.choices"
            :key="choice.id"
            class="choice-container"
            :class="{ 'choice-selected': selectedChoice === choice.id }"
            @click="selectChoice(choice.id)"
          >
          <!-- Choice Header with Risk Level -->
          <div class="choice-header">
            <span class="choice-number">[{{ index + 1 }}]</span>
            <span class="choice-text">{{ choice.text }}</span>
            <span class="choice-risk" :class="getRiskClass(choice.risk)">
              {{ (choice.risk || 'unknown').toUpperCase() }}
            </span>
          </div>
          
          <!-- Impact Analysis Section -->
          <div v-if="choice.consequences" class="impact-section">
            <div class="impact-header">PROJECTED IMPACT:</div>
            <div class="impact-grid">
              <div v-if="choice.consequences.fuel" class="impact-item">
                <span class="impact-label">FUEL</span>
                <span class="impact-value" :class="getImpactClass(choice.consequences.fuel)">
                  {{ formatImpact(choice.consequences.fuel) }}
                </span>
              </div>
              <div v-if="choice.consequences.credits" class="impact-item">
                <span class="impact-label">CREDITS</span>
                <span class="impact-value" :class="getImpactClass(choice.consequences.credits)">
                  {{ formatImpact(choice.consequences.credits) }}
                </span>
              </div>
              <div v-if="choice.consequences.heat" class="impact-item">
                <span class="impact-label">HEAT</span>
                <span class="impact-value" :class="getHeatImpactClass(choice.consequences.heat)">
                  {{ formatImpact(choice.consequences.heat) }}
                </span>
              </div>
            </div>
          </div>
          
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <div v-if="selectedChoice" class="selection-indicator">
          CHOICE SELECTED: {{ getSelectedChoiceNumber() }}
        </div>
        <div class="footer-actions">
          <button 
            v-if="selectedChoice"
            class="confirm-button"
            @click="confirmChoice"
          >
            [CONFIRM CHOICE - ENTER]
          </button>
          <button 
            v-if="allowCancel"
            class="cancel-button"
            @click="cancelDialog"
          >
            [ABORT - ESC]
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import StreamingLoader from './StreamingLoader.vue'
import * as PIXI from 'pixi.js'

const emit = defineEmits(['choice-made', 'dialog-cancelled'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  dialog: {
    type: Object,
    required: true,
    validator: (dialog) => {
      return dialog.situation && 
             Array.isArray(dialog.choices) && 
             dialog.choices.length > 0
    }
  },
  allowCancel: {
    type: Boolean,
    default: true
  },
  autoFocus: {
    type: Boolean,
    default: true
  }
})

const selectedChoice = ref(null)
const situationCanvas = ref(null)
const pixiApp = ref(null)

function generateId() {
  return `TX-${Date.now().toString(36).toUpperCase()}`
}

function initSituationDisplay() {
  if (!situationCanvas.value) return
  
  try {
    pixiApp.value = new PIXI.Application({
      view: situationCanvas.value,
      width: 128,
      height: 64,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: 1
    })
    
    drawSituationDisplay()
  } catch (error) {
    console.error('Situation display initialization failed:', error)
  }
}

function drawSituationDisplay() {
  if (!pixiApp.value) return
  
  const graphics = new PIXI.Graphics()
  pixiApp.value.stage.addChild(graphics)
  graphics.clear()
  
  // Draw situation type indicator based on dialog context - helps player understand scenario
  const dialogType = props.dialog.id || 'unknown'
  
  // Visual representations tied to actual game mechanics
  if (dialogType.includes('explore')) {
    // Exploration radar sweep - shows scan radius and detected objects
    graphics.lineStyle(1, 0xFFFFFF)
    graphics.drawCircle(64, 32, 20)
    graphics.drawCircle(64, 32, 15)
    graphics.drawCircle(64, 32, 10)
    
    // Detected objects - represents potential discoveries
    graphics.beginFill(0xFFFFFF)
    graphics.drawRect(50, 25, 2, 2)
    graphics.drawRect(75, 40, 2, 2)
    graphics.endFill()
    
  } else if (dialogType.includes('spy')) {
    // Spy network visualization - shows information flow and contacts
    graphics.lineStyle(1, 0xFFFFFF)
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 20
      const y = 32 + Math.sin(i) * 10
      graphics.drawCircle(x, y, 3)
      
      if (i > 0) {
        graphics.moveTo(x - 20, 32 + Math.sin(i-1) * 10)
        graphics.lineTo(x, y)
      }
    }
    
  } else if (dialogType.includes('travel')) {
    // Travel route visualization - shows jump points and navigation hazards
    graphics.lineStyle(1, 0xFFFFFF)
    graphics.moveTo(10, 32)
    graphics.lineTo(40, 20)
    graphics.lineTo(70, 44)
    graphics.lineTo(110, 32)
    
    // Jump points
    graphics.beginFill(0xFFFFFF)
    graphics.drawRect(9, 31, 2, 2)
    graphics.drawRect(39, 19, 2, 2)
    graphics.drawRect(69, 43, 2, 2)
    graphics.drawRect(109, 31, 2, 2)
    graphics.endFill()
    
  } else {
    // Generic situation display - shows basic tactical overview
    graphics.beginFill(0xFFFFFF)
    for (let i = 0; i < 10; i++) {
      const x = 20 + (i % 4) * 20
      const y = 20 + Math.floor(i / 4) * 8
      graphics.drawRect(x, y, 8, 4)
    }
    graphics.endFill()
  }
}

function getRiskClass(risk) {
  const riskMap = {
    'none': 'risk-none',
    'low': 'risk-low', 
    'medium': 'risk-medium',
    'high': 'risk-high',
    'extreme': 'risk-extreme'
  }
  return riskMap[risk] || 'risk-unknown'
}

function selectChoice(choiceId) {
  selectedChoice.value = choiceId
}

function confirmChoice() {
  if (selectedChoice.value) {
    const choice = props.dialog.choices.find(c => c.id === selectedChoice.value)
    emit('choice-made', {
      choiceId: selectedChoice.value,
      choice: choice,
      dialog: props.dialog
    })
    selectedChoice.value = null
  }
}

function cancelDialog() {
  if (props.allowCancel) {
    emit('dialog-cancelled')
    selectedChoice.value = null
  }
}

function getSelectedChoiceNumber() {
  if (!selectedChoice.value) return ''
  const index = props.dialog.choices.findIndex(c => c.id === selectedChoice.value)
  return index >= 0 ? `[${index + 1}]` : ''
}

function formatImpact(value) {
  if (typeof value === 'string') {
    return value
  }
  
  // Make predictions fuzzy/uncertain
  const numValue = parseInt(value)
  const variance = Math.max(5, Math.abs(numValue * 0.2)) // 20% variance, minimum 5
  const min = Math.floor(numValue - variance)
  const max = Math.ceil(numValue + variance)
  
  if (numValue === 0) return '~0'
  if (numValue > 0) return `+${min}-${max}`
  return `${max}-${min}`
}

function getImpactClass(value) {
  if (typeof value === 'string') {
    // Handle string values like "+200-800"
    if (value.includes('+')) return 'impact-positive'
    if (value.includes('-')) return 'impact-negative'
    return 'impact-neutral'
  }
  
  const numValue = parseInt(value)
  if (numValue > 0) return 'impact-positive'
  if (numValue < 0) return 'impact-negative'
  return 'impact-neutral'
}

function getHeatImpactClass(value) {
  if (typeof value === 'string') {
    // For heat, positive is bad (red), negative is good (green)
    if (value.includes('+')) return 'impact-negative' // Red for +heat
    if (value.includes('-')) return 'impact-positive' // Green for -heat
    return 'impact-neutral'
  }
  
  const numValue = parseInt(value)
  if (numValue > 0) return 'impact-negative' // Red for +heat
  if (numValue < 0) return 'impact-positive' // Green for -heat
  return 'impact-neutral'
}

function getProgressWidth() {
  if (props.dialog.streamProgress?.percentage) {
    return `${props.dialog.streamProgress.percentage}%`
  }
  // Default animation if no progress data
  return '30%'
}

function handleBackdropClick() {
  if (props.allowCancel) {
    cancelDialog()
  }
}

function handleKeyDown(event) {
  if (!props.visible) return
  
  switch (event.key) {
    case '1':
      if (props.dialog.choices[0]) selectChoice(props.dialog.choices[0].id)
      break
    case '2':
      if (props.dialog.choices[1]) selectChoice(props.dialog.choices[1].id)
      break
    case '3':
      if (props.dialog.choices[2]) selectChoice(props.dialog.choices[2].id)
      break
    case 'Enter':
      event.preventDefault()
      confirmChoice()
      break
    case 'Escape':
      event.preventDefault()
      cancelDialog()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  initSituationDisplay()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (pixiApp.value) {
    pixiApp.value.destroy(true)
    pixiApp.value = null
  }
})
</script>

<style scoped>
/* Monochromatic Base - No decorative colors */
.dialog-overlay {
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

.dialog-container {
  background: #000000;
  border: 2px solid #ffffff;
  max-width: 700px;
  width: 95%;
  max-height: 90%;
  overflow-y: auto;
  color: #ffffff;
}

/* Header Section */
.dialog-header {
  background: #111111;
  border-bottom: 2px solid #ffffff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-marker {
  color: #ffffff;
  font-weight: bold;
}

.dialog-title {
  font-weight: bold;
  font-size: 14px;
  flex: 1;
}

.dialog-id {
  font-size: 10px;
  opacity: 0.6;
  font-family: monospace;
}

/* Situation Section */
.dialog-situation {
  padding: 16px;
  border-bottom: 1px solid #333333;
  background: #050505;
}

.situation-display {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.situation-text-area {
  flex: 1;
}

.situation-visual {
  flex-shrink: 0;
}

.situation-canvas {
  display: block;
  background: #000000;
  border: 2px solid #ffffff;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.situation-text {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: #ffffff;
}

.situation-context {
  display: flex;
  gap: 12px;
  font-size: 10px;
  opacity: 0.8;
  flex-wrap: wrap;
}

.context-item {
  padding: 2px 6px;
  border: 1px solid #333333;
  background: #000000;
}

/* Choices Section */
.dialog-choices {
  padding: 16px;
}

.choices-header {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 16px;
  border-bottom: 1px solid #333333;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Choice Container - The Main Improvement */
.choice-container {
  border: 2px solid #333333;
  margin-bottom: 12px;
  background: #000000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.choice-container:hover {
  border-color: #666666;
}

.choice-selected {
  border-color: #ffffff !important;
  background: #111111 !important;
  box-shadow: inset 0 0 0 1px #ffffff;
}

/* Choice Header */
.choice-header {
  padding: 12px 16px;
  border-bottom: 1px solid #222222;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.choice-number {
  font-weight: bold;
  font-size: 11px;
  color: #ffffff;
  min-width: 24px;
}

.choice-text {
  flex: 1;
  font-size: 13px;
  color: #ffffff;
  line-height: 1.4;
}

.choice-risk {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

/* Risk Colors - Color Used Only For Data */
.risk-none { 
  color: #888888; 
  border-color: #888888; 
}

.risk-low { 
  color: #00aa00; 
  border-color: #00aa00; 
}

.risk-medium { 
  color: #ffaa00; 
  border-color: #ffaa00; 
}

.risk-high { 
  color: #ff6600; 
  border-color: #ff6600; 
}

.risk-extreme { 
  color: #ff0000; 
  border-color: #ff0000; 
}

.risk-unknown { 
  color: #555555; 
  border-color: #555555; 
}

/* Impact Analysis Section - Key Improvement */
.impact-section {
  padding: 12px 16px;
  border-bottom: 1px solid #222222;
  background: #050505;
}

.impact-header {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #aaaaaa;
  letter-spacing: 0.5px;
}

.impact-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.impact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.impact-label {
  font-size: 9px;
  font-weight: bold;
  color: #888888;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.impact-value {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border: 1px solid;
  min-width: 50px;
  text-align: center;
  font-family: monospace;
}

/* Impact Colors - Color Used Only For Data */
.impact-positive {
  color: #00aa00;
  border-color: #00aa00;
  background: rgba(0, 170, 0, 0.1);
}

.impact-negative {
  color: #ff0000;
  border-color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.impact-neutral {
  color: #888888;
  border-color: #888888;
  background: rgba(136, 136, 136, 0.1);
}

/* Outcome Section */
.outcome-section {
  padding: 12px 16px;
  background: #020202;
}

.outcome-text {
  font-size: 11px;
  color: #cccccc;
  font-style: italic;
  line-height: 1.4;
}

/* Footer Section */
.dialog-footer {
  border-top: 2px solid #ffffff;
  padding: 16px;
  background: #111111;
}

.selection-indicator {
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

.confirm-button,
.cancel-button {
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

.cancel-button {
  border-color: #666666;
  color: #666666;
}

.cancel-button:hover {
  background: #666666;
  color: #000000;
}

/* Loading Animation Styles */
.loading-section {
  padding: 16px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Queue Status */
.queue-status {
  display: flex;
  gap: 24px;
  padding: 12px;
  border: 1px solid #333333;
  background: #050505;
  font-size: 11px;
}

.queue-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.queue-label {
  color: #666666;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 9px;
}

.queue-value {
  color: #00ff00;
  font-weight: bold;
  font-family: monospace;
}

.loading-header {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 24px;
  border-bottom: 1px solid #333333;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-bar {
  width: 100%;
  height: 4px;
  background: #222222;
  border: 1px solid #ffffff;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: #ffffff;
  width: 30%;
  animation: loading-slide 2s ease-in-out infinite;
}

@keyframes loading-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(233%); }
  100% { transform: translateX(-100%); }
}

.loading-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: #666666;
  font-family: monospace;
}

/* Streaming Preview */
.streaming-preview {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #333333;
  background: #020202;
}

.streaming-label {
  font-size: 10px;
  color: #666666;
  margin-bottom: 8px;
  font-weight: bold;
}

.streaming-content {
  font-size: 12px;
  color: #aaaaaa;
  line-height: 1.4;
  font-family: monospace;
}

.loading-text {
  font-size: 11px;
  color: #aaaaaa;
  text-align: center;
  min-height: 20px;
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #aaaaaa;
}

.dot {
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
.dot:nth-child(4) { animation-delay: 0.6s; }

@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

/* Streaming text styles */
.situation-text.streaming {
  background: #050505;
  border: 1px solid #333333;
  padding: 8px;
}

.streaming-cursor {
  animation: cursor-blink 1s infinite;
  color: #00ff00;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>