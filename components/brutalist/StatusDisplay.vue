<template>
  <div class="status-display">
    <div class="status-header">
      <span class="status-title">{{ title }}</span>
      <span v-if="subtitle" class="status-subtitle">{{ subtitle }}</span>
    </div>
    <div class="status-content">
      <div v-for="item in items" :key="item.key" class="status-item" :class="item.class">
        <span class="status-key">{{ item.key }}:</span>
        <span class="status-value">{{ item.value }}</span>
      </div>
    </div>
    <div v-if="$slots.default" class="status-footer">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(item => 
        typeof item === 'object' && 
        'key' in item && 
        'value' in item
      )
    }
  }
})
</script>

<style scoped>
.status-display {
  border: 1px solid #ffffff;
  background: #111111;
  font-family: 'Courier New', monospace;
  color: #ffffff;
}

.status-header {
  border-bottom: 1px solid #ffffff;
  padding: 4px 8px;
  background: #000000;
}

.status-title {
  font-weight: bold;
  font-size: 12px;
}

.status-subtitle {
  float: right;
  font-size: 10px;
  opacity: 0.7;
}

.status-content {
  padding: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  font-size: 11px;
}

.status-key {
  opacity: 0.8;
}

.status-value {
  font-weight: bold;
}

.status-item.warning .status-value {
  color: #ffff00;
}

.status-item.danger .status-value {
  color: #ff0000;
}

.status-item.success .status-value {
  color: #00ff00;
}

.status-footer {
  border-top: 1px dotted #333333;
  padding: 4px 8px;
  font-size: 10px;
  opacity: 0.7;
}
</style>