<template>
  <div class="galaxy-map-page">
    <div class="page-header">
      <h1>SPACEPUNK LOGISTICS - GALAXY MAP</h1>
      <p>Navigation and Station Information System v1.0</p>
    </div>
    
    <div class="page-content">
      <GalaxyMap />
    </div>
    
    <div class="page-footer">
      <p>Enterprise Space Navigation Software - Licensed to: SPACEPUNK LOGISTICS</p>
      <p>WARNING: For authorized personnel only. Unauthorized access is prohibited.</p>
    </div>
  </div>
</template>

<script setup>
import GalaxyMap from '~/components/brutalist/GalaxyMap.vue'
</script>

<style scoped>
.galaxy-map-page {
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px;
  border: 2px solid #ffffff;
  background: #111111;
}

.page-header h1 {
  color: #00ff00;
  font-size: 24px;
  margin-bottom: 8px;
}

.page-header p {
  color: #ffffff;
  font-size: 14px;
}

.page-content {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.page-footer {
  text-align: center;
  font-size: 10px;
  color: #666666;
  padding: 16px;
  border-top: 1px solid #333333;
}

.page-footer p {
  margin: 4px 0;
}
</style>