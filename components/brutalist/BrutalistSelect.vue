<template>
  <div class="brutalist-select-wrapper">
    <label v-if="label" class="select-label">
      {{ label.toUpperCase() }}:
    </label>
    <div class="select-container">
      <span class="select-marker">></span>
      <select
        :value="modelValue"
        :disabled="disabled"
        class="brutalist-select"
        :class="{
          'select-error': error,
          'select-disabled': disabled
        }"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label || option.value }}
        </option>
      </select>
      <span class="select-arrow">▼</span>
    </div>
    <div v-if="error && errorMessage" class="select-error-message">
      ERROR: {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(opt => 
        typeof opt === 'object' && 'value' in opt
      )
    }
  },
  placeholder: String,
  disabled: Boolean,
  error: Boolean,
  errorMessage: String
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.brutalist-select-wrapper {
  margin: 4px 0;
}

.select-label {
  display: block;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-bottom: 2px;
}

.select-container {
  display: flex;
  align-items: center;
  position: relative;
}

.select-marker {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin-right: 4px;
}

.brutalist-select {
  flex: 1;
  background: #000000;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 4px 24px 4px 4px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.brutalist-select:focus {
  border-color: #00ff00;
  box-shadow: 0 0 0 1px #00ff00;
}

.select-arrow {
  position: absolute;
  right: 8px;
  color: #00ff00;
  font-size: 10px;
  pointer-events: none;
}

.select-error {
  border-color: #ff0000;
  color: #ff0000;
}

.select-error:focus {
  border-color: #ff0000;
  box-shadow: 0 0 0 1px #ff0000;
}

.select-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.select-error-message {
  color: #ff0000;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-top: 2px;
}

.select-error ~ .select-arrow {
  color: #ff0000;
}

option {
  background: #000000;
  color: #00ff00;
}

option:disabled {
  color: #006600;
}
</style>