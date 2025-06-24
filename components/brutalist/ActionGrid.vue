<template>
  <div class="action-grid">
    <div class="action-header">
      <span class="action-title">{{ title }}</span>
      <span v-if="subtitle" class="action-subtitle">{{ subtitle }}</span>
    </div>
    <div class="action-buttons" :class="`grid-${columns}`">
      <button
        v-for="action in actions"
        :key="action.id"
        class="action-button"
        :class="[action.variant || 'default', { disabled: action.disabled }]"
        :disabled="action.disabled"
        @click="$emit('action', action.id)"
      >
        <span class="action-key" v-if="action.key">[{{ action.key }}]</span>
        <span class="action-label">{{ action.label }}</span>
        <span class="action-cost" v-if="action.cost">{{ action.cost }}</span>
      </button>
    </div>
    <div v-if="$slots.default" class="action-footer">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineEmits(['action'])

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  actions: {
    type: Array,
    required: true,
    validator: (actions) => {
      return actions.every(action => 
        typeof action === 'object' && 
        'id' in action && 
        'label' in action
      )
    }
  },
  columns: {
    type: Number,
    default: 3,
    validator: (value) => [1, 2, 3, 4, 6].includes(value)
  }
})
</script>

<style scoped>
.action-grid {
  border: 1px solid #ffffff;
  background: #111111;
  font-family: 'Courier New', monospace;
  color: #ffffff;
}

.action-header {
  border-bottom: 1px solid #ffffff;
  padding: 4px 8px;
  background: #000000;
}

.action-title {
  font-weight: bold;
  font-size: 12px;
}

.action-subtitle {
  float: right;
  font-size: 10px;
  opacity: 0.7;
}

.action-buttons {
  padding: 8px;
  display: grid;
  gap: 4px;
}

.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
.grid-6 { grid-template-columns: repeat(6, 1fr); }

.action-button {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 8px 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px;
  text-align: center;
  position: relative;
}

.action-button:hover:not(.disabled) {
  background: #222222;
}

.action-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #666666;
  border-color: #666666;
}

.action-button.primary {
  background: #004400;
  border-color: #00ff00;
}

.action-button.primary:hover:not(.disabled) {
  background: #006600;
}

.action-button.warning {
  background: #444400;
  border-color: #ffff00;
}

.action-button.warning:hover:not(.disabled) {
  background: #666600;
}

.action-button.danger {
  background: #440000;
  border-color: #ff0000;
}

.action-button.danger:hover:not(.disabled) {
  background: #660000;
}

.action-key {
  font-size: 8px;
  opacity: 0.7;
  display: block;
}

.action-label {
  font-weight: bold;
  display: block;
  margin: 2px 0;
}

.action-cost {
  font-size: 8px;
  opacity: 0.7;
  display: block;
}

.action-footer {
  border-top: 1px dotted #333333;
  padding: 4px 8px;
  font-size: 9px;
  opacity: 0.7;
  text-align: center;
}
</style>