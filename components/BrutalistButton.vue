<template>
  <button 
    class="brutalist-button" 
    :class="[
      variant,
      size,
      {
        'active': active,
        'disabled': disabled,
        'loading': loading
      }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="loading-indicator">[PROCESSING...]</span>
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'danger', 'warning'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  active: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.brutalist-button {
  font-family: var(--font-interactive);
  background: #000;
  border: 1px solid #00ff00;
  color: #00ff00;
  cursor: pointer;
  text-transform: uppercase;
  transition: none;
  position: relative;
  display: inline-block;
  letter-spacing: 0.5px;
}

/* Size variations */
.brutalist-button.small {
  padding: 2px 6px;
  font-size: 10px;
}

.brutalist-button.medium {
  padding: 4px 12px;
  font-size: 11px;
}

.brutalist-button.large {
  padding: 8px 16px;
  font-size: 13px;
}

/* Variant styles */
.brutalist-button.default:hover:not(.disabled) {
  background: #002200;
}

.brutalist-button.primary {
  border-color: #00ffff;
  color: #00ffff;
  background: #001122;
}

.brutalist-button.primary:hover:not(.disabled) {
  background: #002244;
}

.brutalist-button.danger {
  border-color: #ff0000;
  color: #ff0000;
  background: #220000;
}

.brutalist-button.danger:hover:not(.disabled) {
  background: #440000;
}

.brutalist-button.warning {
  border-color: #ffaa00;
  color: #ffaa00;
  background: #221100;
}

.brutalist-button.warning:hover:not(.disabled) {
  background: #442200;
}

/* States */
.brutalist-button.active {
  background: #003300;
  box-shadow: inset 0 0 0 1px #00ff00;
}

.brutalist-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.brutalist-button.loading {
  cursor: wait;
}

.loading-indicator {
  animation: flicker 0.5s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Click effect */
.brutalist-button:active:not(.disabled) {
  transform: translate(1px, 1px);
}
</style>