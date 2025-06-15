<template>
  <button class="brutalist-button" :class="{
    'button-disabled': disabled,
    'button-processing': processing,
    'button-danger': variant === 'danger',
    'button-primary': variant === 'primary'
  }" :disabled="disabled || processing" @click="handleClick">
    <span v-if="processing" class="processing-indicator">[PROCESSING]</span>
    <span v-else>
      <span class="button-brackets">[</span>
      <slot>{{ label }}</slot>
      <span class="button-brackets">]</span>
    </span>
  </button>
</template>

<script setup>
defineProps({
  label: String,
  disabled: Boolean,
  processing: Boolean,
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'danger'].includes(value)
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled && !props.processing) {
    emit('click', event)
  }
}
</script>

<style scoped>
.brutalist-button {
  background: #000000;
  color: #ffffff;
  border: 1px solid #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 4px 8px;
  cursor: pointer;
  text-transform: uppercase;
  white-space: nowrap;
  transition: none;
}

.brutalist-button:hover:not(.button-disabled):not(.button-processing) {
  background: #ffffff;
  color: #000000;
  /* Ensure visibility on both light and dark backgrounds */
  border-color: #ffffff;
}

.brutalist-button:active:not(.button-disabled):not(.button-processing) {
  transform: translateY(1px);
}

.button-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.button-processing {
  cursor: wait;
  opacity: 0.7;
}

.button-danger {
  border-color: #ff0000;
  color: #ff0000;
}

.button-danger:hover:not(.button-disabled):not(.button-processing) {
  background: #ff0000;
  color: #000000;
}

.button-primary {
  border-width: 2px;
  font-weight: bold;
}

.processing-indicator {
  animation: blink 1s infinite;
}

.button-brackets {
  opacity: 0.7;
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0.3;
  }
}
</style>