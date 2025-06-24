<template>
  <div class="dialog-overlay" v-if="visible" @click.self="handleBackdropClick">
    <div class="dialog-container">
      <div class="dialog-header">
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
        <div class="choices-header">SELECT RESPONSE:</div>
        <button
          v-for="(choice, index) in dialog.choices"
          :key="choice.id"
          class="choice-button"
          :class="[
            getRiskClass(choice.risk),
            { selected: selectedChoice === choice.id }
          ]"
          @click="selectChoice(choice.id)"
          @keydown.enter="confirmChoice"
        >
          <div class="choice-header">
            <span class="choice-number">[{{ index + 1 }}]</span>
            <span class="choice-risk">{{ (choice.risk || 'unknown').toUpperCase() }}</span>
          </div>
          <div class="choice-text">{{ choice.text }}</div>
          <div v-if="choice.consequences" class="choice-consequences">
            <span v-if="choice.consequences.fuel" class="consequence fuel">
              FUEL: {{ choice.consequences.fuel }}
            </span>
            <span v-if="choice.consequences.credits" class="consequence credits">
              CREDITS: {{ choice.consequences.credits }}
            </span>
            <span v-if="choice.consequences.heat" class="consequence heat">
              HEAT: {{ choice.consequences.heat }}
            </span>
          </div>
          <div v-if="choice.consequences?.narrative" class="choice-hint">
            {{ choice.consequences.narrative }}
          </div>
        </button>
      </div>
      
      <div class="dialog-footer">
        <button 
          v-if="selectedChoice"
          class="confirm-button"
          @click="confirmChoice"
        >
          CONFIRM CHOICE [ENTER]
        </button>
        <button 
          v-if="allowCancel"
          class="cancel-button"
          @click="cancelDialog"
        >
          ABORT [ESC]
        </button>
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
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Courier New', monospace;
}

.dialog-container {
  background: #000000;
  border: 2px solid #00ff00;
  max-width: 600px;
  width: 90%;
  max-height: 80%;
  overflow-y: auto;
  color: #00ff00;
}

.dialog-header {
  background: #001100;
  border-bottom: 1px solid #00ff00;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-weight: bold;
  font-size: 14px;
}

.dialog-id {
  font-size: 10px;
  opacity: 0.7;
}

.dialog-situation {
  padding: 16px;
  border-bottom: 1px solid #003300;
}

.situation-text {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: #ffffff;
}

.situation-context {
  display: flex;
  gap: 16px;
  font-size: 10px;
  opacity: 0.8;
}

.context-item {
  padding: 2px 6px;
  border: 1px dotted #003300;
  background: #000;
}

.dialog-choices {
  padding: 16px;
}

.choices-header {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 12px;
  border-bottom: 1px dotted #003300;
  padding-bottom: 4px;
}

.choice-button {
  width: 100%;
  background: #000000;
  border: 1px solid #003300;
  color: #00ff00;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;
}

.choice-button:hover,
.choice-button.selected {
  border-color: #00ff00;
  background: #001100;
}

.choice-button.selected {
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

.choice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.choice-number {
  font-weight: bold;
  font-size: 10px;
}

.choice-risk {
  font-size: 9px;
  padding: 1px 4px;
  border: 1px solid;
}

.risk-none { 
  color: #888888; 
  border-color: #888888; 
}

.risk-low { 
  color: #00ff00; 
  border-color: #00ff00; 
}

.risk-medium { 
  color: #ffff00; 
  border-color: #ffff00; 
}

.risk-high { 
  color: #ff8800; 
  border-color: #ff8800; 
}

.risk-extreme { 
  color: #ff0000; 
  border-color: #ff0000; 
}

.risk-unknown { 
  color: #666666; 
  border-color: #666666; 
}

.choice-text {
  font-size: 12px;
  margin-bottom: 6px;
  color: #ffffff;
}

.choice-consequences {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 9px;
}

.consequence {
  padding: 1px 4px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.5);
}

.consequence.fuel { 
  color: #ffff00; 
  border-color: #ffff00; 
}

.consequence.credits { 
  color: #00ff00; 
  border-color: #00ff00; 
}

.consequence.heat { 
  color: #ff0000; 
  border-color: #ff0000; 
}

.choice-hint {
  font-size: 10px;
  opacity: 0.7;
  font-style: italic;
  color: #cccccc;
}

.dialog-footer {
  border-top: 1px solid #003300;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-button,
.cancel-button {
  background: #001100;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.confirm-button:hover {
  background: #003300;
}

.cancel-button {
  border-color: #666666;
  color: #666666;
}

.cancel-button:hover {
  background: #333333;
}
</style>