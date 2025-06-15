<template>
  <div class="brutalist-panel" :class="{ 'panel-error': error }">
    <div v-if="title" class="panel-header">
      <span class="header-marker">></span>
      {{ title.toUpperCase() }}
      <span v-if="subtitle" class="panel-subtitle">[{{ subtitle }}]</span>
    </div>
    <div class="panel-content">
      <slot></slot>
    </div>
    <div v-if="footer" class="panel-footer">
      {{ footer }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  footer: String,
  error: Boolean
})
</script>

<style scoped>
.brutalist-panel {
  border: 2px solid #00ff00;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin: 4px;
  display: inline-block;
  min-width: 200px;
}

.panel-error {
  border-color: #ff0000;
  color: #ff0000;
}

.panel-header {
  border-bottom: 1px solid #00ff00;
  padding: 4px 8px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-marker {
  margin-right: 4px;
}

.panel-subtitle {
  font-weight: normal;
  opacity: 0.7;
  margin-left: 8px;
}

.panel-content {
  padding: 8px;
}

.panel-footer {
  border-top: 1px solid #00ff00;
  padding: 4px 8px;
  font-size: 0.85em;
  opacity: 0.7;
}

.panel-error .panel-header,
.panel-error .panel-footer {
  border-color: #ff0000;
}
</style>