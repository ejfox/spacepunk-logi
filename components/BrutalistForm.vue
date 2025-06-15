<template>
  <form class="brutalist-form" @submit.prevent="$emit('submit', $event)">
    <div v-if="title" class="form-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="form-content">
      <slot />
    </div>
    <div v-if="$slots.actions" class="form-actions">
      <slot name="actions" />
    </div>
  </form>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  }
})

defineEmits(['submit'])
</script>

<style scoped>
.brutalist-form {
  border: 2px solid #00ff00;
  background: #001100;
  padding: 0;
  font-family: var(--font-body);
}

.form-header {
  border-bottom: 1px solid #00ff00;
  padding: 8px;
  background: #002200;
}

.form-header h3 {
  margin: 0;
  font-size: 14px;
  color: #00ff00;
  text-transform: uppercase;
}

.form-content {
  padding: 16px;
}

.form-actions {
  border-top: 1px solid #00ff00;
  padding: 8px;
  background: #000;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Global form field styles within BrutalistForm */
:deep(.form-field) {
  margin-bottom: 12px;
}

:deep(.form-field label) {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: #00ff00;
  text-transform: uppercase;
}

:deep(.form-field input),
:deep(.form-field select),
:deep(.form-field textarea) {
  width: 100%;
  background: #000;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 4px;
  font-family: var(--font-input);
  font-size: 12px;
  letter-spacing: 0.3px;
}

:deep(.form-field input:focus),
:deep(.form-field select:focus),
:deep(.form-field textarea:focus) {
  outline: none;
  box-shadow: 0 0 0 1px #00ff00;
}

:deep(.form-field input::placeholder),
:deep(.form-field textarea::placeholder) {
  color: #006600;
  opacity: 0.7;
}

:deep(.form-field input:disabled),
:deep(.form-field select:disabled),
:deep(.form-field textarea:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.form-field-error) {
  color: #ff0000;
  font-size: 10px;
  margin-top: 2px;
}

:deep(.form-field-help) {
  color: #00aa00;
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.8;
}

/* Checkbox and radio styles */
:deep(.form-field input[type="checkbox"]),
:deep(.form-field input[type="radio"]) {
  width: auto;
  margin-right: 4px;
}
</style>