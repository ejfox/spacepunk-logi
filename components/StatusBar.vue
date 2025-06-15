<template>
  <div class="status-bar-container">
    <div class="status-item">
      <span class="label">CREDITS:</span>
      <span class="value">{{ formatCredits(player?.credits || 0) }}</span>
    </div>
    <div class="status-item">
      <span class="label">LOCATION:</span>
      <span class="value">{{ ship?.location_station || 'UNKNOWN' }}</span>
    </div>
    <div class="status-item">
      <span class="label">FUEL:</span>
      <span class="value" :class="{ critical: fuelPercentage < 20 }">
        {{ ship?.fuel_current || 0 }}/{{ ship?.fuel_max || 0 }}
      </span>
    </div>
    <div class="status-item">
      <span class="label">CARGO:</span>
      <span class="value" :class="{ warning: cargoPercentage > 80 }">
        {{ ship?.cargo_used || 0 }}/{{ ship?.cargo_max || 0 }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  player: {
    type: Object,
    default: null
  },
  ship: {
    type: Object,
    default: null
  }
})

const fuelPercentage = computed(() => {
  if (!props.ship?.fuel_max) return 0
  return (props.ship.fuel_current / props.ship.fuel_max) * 100
})

const cargoPercentage = computed(() => {
  if (!props.ship?.cargo_max) return 0
  return (props.ship.cargo_used / props.ship.cargo_max) * 100
})

function formatCredits(credits) {
  return credits.toLocaleString() + ' CR'
}
</script>

<style scoped>
.status-bar-container {
  display: flex;
  gap: 16px;
  padding: 8px;
  border: 1px solid #00ff00;
  background: #001100;
  font-family: var(--font-code);
  font-size: 12px;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label {
  color: #00ff00;
  opacity: 0.7;
}

.value {
  color: #00ff00;
  font-weight: bold;
}

.value.critical {
  color: #ff0000;
  animation: blink 1s infinite;
}

.value.warning {
  color: #ffaa00;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
}
</style>