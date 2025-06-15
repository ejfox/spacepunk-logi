<template>
  <form class="brutalist-form" :class="{ 'form-processing': processing }" @submit.prevent="handleSubmit">
    <div v-if="title" class="form-header">
      <span class="header-marker">&gt;&gt;</span>
      {{ title.toUpperCase() }}
      <span v-if="formId" class="form-id">[FORM:{{ formId }}]</span>
    </div>

    <div class="form-content">
      <slot></slot>
    </div>

    <div v-if="showActions" class="form-actions">
      <BrutalistButton v-if="!hideCancel" label="CANCEL" @click="$emit('cancel')" />
      <BrutalistButton v-if="!hideReset" label="RESET" @click="handleReset" />
      <BrutalistButton :label="submitLabel" :processing="processing" :disabled="disabled" variant="primary"
        type="submit" />
    </div>

    <div v-if="errors.length" class="form-errors">
      <div class="error-header">FORM ERRORS:</div>
      <ul class="error-list">
        <li v-for="(error, index) in errors" :key="index">
          {{ error }}
        </li>
      </ul>
    </div>
  </form>
</template>

<script setup>
import BrutalistButton from './BrutalistButton.vue'

defineProps({
  title: String,
  formId: String,
  submitLabel: {
    type: String,
    default: 'SUBMIT'
  },
  processing: Boolean,
  disabled: Boolean,
  errors: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: true
  },
  hideCancel: Boolean,
  hideReset: Boolean
})

const emit = defineEmits(['submit', 'cancel', 'reset'])

const handleSubmit = () => {
  if (!props.processing && !props.disabled) {
    emit('submit')
  }
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
.brutalist-form {
  border: 2px solid #ffffff;
  background: #000000;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  margin: 4px 0;
}

.form-processing {
  opacity: 0.7;
  pointer-events: none;
}

.form-header {
  border-bottom: 1px solid #ffffff;
  padding: 8px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-marker {
  opacity: 0.7;
}

.form-id {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.5;
  font-weight: normal;
}

.form-content {
  padding: 16px;
}

.form-actions {
  border-top: 1px solid #ffffff;
  padding: 8px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  background: #111111;
}

.form-errors {
  border-top: 1px solid #ff0000;
  background: #110000;
  padding: 8px;
}

.error-header {
  color: #ff0000;
  font-weight: bold;
  margin-bottom: 4px;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-list li {
  color: #ff0000;
  padding: 2px 0;
  padding-left: 16px;
  position: relative;
}

.error-list li::before {
  content: "!";
  position: absolute;
  left: 4px;
}

/* Nested form field spacing */
.form-content>* {
  margin-bottom: 12px;
}

.form-content>*:last-child {
  margin-bottom: 0;
}
</style>