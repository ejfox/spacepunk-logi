<template>
  <div class="dialog-overlay" v-if="visible" @click.self="handleBackdropClick">
    <div class="dialog-container">
      <div class="dialog-header">
        <span class="header-marker">></span>
        <span class="dialog-title">{{ dialog.title || 'INCOMING TRANSMISSION' }}</span>
        <span class="dialog-id">{{ dialog.id || generateId() }}</span>
      </div>
      
      <div class="dialog-situation">
        <div class="situation-text">{{ dialog.situation }}</div>
        <div v-if="dialog.context" class="situation-context">
          <span v-for="(value, key) in dialog.context" :key="key" class="context-item">
            {{ key.toUpperCase() }}: {{ value }}
          </span>
        </div>
      </div>
      
      <div class="dialog-choices">
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
          
          <!-- Narrative Outcome -->
          <div v-if="choice.consequences?.narrative" class="outcome-section">
            <div class="outcome-text">{{ choice.consequences.narrative }}</div>
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

function generateId() {
  return `TX-${Date.now().toString(36).toUpperCase()}`
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
  return value > 0 ? `+${value}` : `${value}`
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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
</style>