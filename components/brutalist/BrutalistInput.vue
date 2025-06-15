<template>
  <div class="brutalist-input-wrapper">
    <label v-if="label" class="input-label">
      {{ label.toUpperCase() }}:
    </label>
    <div class="input-container">
      <span class="input-marker">></span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        class="brutalist-input"
        :class="{
          'input-error': error,
          'input-valid': valid && !error,
          'input-disabled': disabled
        }"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
      />
    </div>
    <div v-if="error && errorMessage" class="input-error-message">
      ERROR: {{ errorMessage }}
    </div>
    <div v-if="hint && !error" class="input-hint">
      HINT: {{ hint }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  disabled: Boolean,
  readonly: Boolean,
  maxlength: Number,
  error: Boolean,
  errorMessage: String,
  valid: Boolean,
  hint: String
})

defineEmits(['update:modelValue', 'focus', 'blur'])
</script>

<style scoped>
.brutalist-input-wrapper {
  margin: 4px 0;
}

.input-label {
  display: block;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-bottom: 2px;
}

.input-container {
  display: flex;
  align-items: center;
}

.input-marker {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin-right: 4px;
}

.brutalist-input {
  flex: 1;
  background: #000000;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 4px;
  outline: none;
}

.brutalist-input:focus {
  border-color: #00ff00;
  box-shadow: 0 0 0 1px #00ff00;
}

.input-error {
  border-color: #ff0000;
  color: #ff0000;
}

.input-error:focus {
  border-color: #ff0000;
  box-shadow: 0 0 0 1px #ff0000;
}

.input-valid {
  border-color: #00ff00;
}

.input-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.input-error-message {
  color: #ff0000;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-top: 2px;
}

.input-hint {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-top: 2px;
  opacity: 0.7;
}

.input-error ~ .input-marker {
  color: #ff0000;
}
</style>