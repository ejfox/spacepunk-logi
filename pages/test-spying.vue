<template>
  <div class="test-page">
    <div class="header">
      <h1>SPACEPUNK SPYING INTERFACE TEST</h1>
      <p>SURVEILLANCE SIMULATION MODULE</p>
      <p>STATUS: OPERATIONAL</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label>DIFFICULTY:</label>
        <select v-model="difficulty">
          <option value="easy">EASY</option>
          <option value="standard">STANDARD</option>
          <option value="hard">HARD</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>CREW SKILL:</label>
        <input type="number" v-model="crewSkill" min="0" max="100">
      </div>
      
      <div class="control-group">
        <label>TIME LIMIT:</label>
        <input type="number" v-model="timeLimit" min="10" max="120">
      </div>
    </div>
    
    <button class="test-button" @click="startSpying" :disabled="spyingActive">
      {{ spyingActive ? 'SURVEILLANCE ACTIVE' : 'INITIALIZE SURVEILLANCE' }}
    </button>
    
    <div v-if="spyingActive" class="component-container">
      <PixiSpying
        :difficulty="difficulty"
        :crew-skill="crewSkill"
        :time-limit="timeLimit"
        @complete="onSpyingComplete"
      />
    </div>
    
    <div v-if="results" class="results">
      <h3>MISSION RESULTS:</h3>
      <div class="result-content">
        <p><strong>STATUS:</strong> {{ results.success ? 'SUCCESS' : 'FAILURE' }}</p>
        <p><strong>DATA GATHERED:</strong> {{ Math.floor(results.dataGathered) }} units</p>
        <p><strong>DETECTION LEVEL:</strong> {{ Math.floor(results.detectionLevel) }}%</p>
        <p v-if="results.stealthRating"><strong>STEALTH RATING:</strong> {{ Math.floor(results.stealthRating) }}%</p>
      </div>
    </div>
    
    <div class="instructions">
      <h3>SURVEILLANCE INTERFACE GUIDE:</h3>
      <ul>
        <li><strong>SCAN LINES:</strong> Multiple scanning beams move across the detection grid</li>
        <li><strong>MOVING DOTS:</strong> Pulsing scanner dots travel along each scan line</li>
        <li><strong>TARGETS:</strong> Different geometric shapes contain valuable intelligence</li>
        <li><strong>DETECTION RISK:</strong> Each target has a different risk level - higher skill reduces detection</li>
        <li><strong>SHAPES:</strong> Circles pulse, squares rotate, triangles fade, diamonds oscillate</li>
        <li><strong>SCAN PATTERNS:</strong> Solid, dashed, and dotted lines provide different scan types</li>
        <li><strong>OBJECTIVE:</strong> Gather required intelligence before detection reaches 100%</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PixiSpying from '~/components/brutalist/PixiSpying.vue'

const difficulty = ref('standard')
const crewSkill = ref(50)
const timeLimit = ref(45)
const spyingActive = ref(false)
const results = ref(null)

function startSpying() {
  spyingActive.value = true
  results.value = null
}

function onSpyingComplete(result) {
  results.value = result
  spyingActive.value = false
}
</script>

<style scoped>
.test-page {
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
  border: 2px solid #00ff00;
  padding: 20px;
  background: #111111;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.header p {
  margin: 5px 0;
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.control-group label {
  font-size: 12px;
  color: #00ff00;
  font-weight: bold;
}

.control-group select,
.control-group input {
  background: #000000;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 5px;
  font-family: monospace;
  text-align: center;
}

.test-button {
  display: block;
  margin: 0 auto 20px auto;
  background: #000000;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 10px 20px;
  font-family: monospace;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.test-button:hover:not(:disabled) {
  background: #00ff00;
  color: #000000;
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.component-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.results {
  margin: 20px auto;
  padding: 15px;
  border: 2px solid #00ff00;
  background: #111111;
  font-size: 12px;
  max-width: 600px;
}

.results h3 {
  color: #00ff00;
  margin-top: 0;
  text-align: center;
}

.result-content {
  text-align: center;
}

.result-content p {
  margin: 8px 0;
}

.instructions {
  margin: 20px auto;
  padding: 15px;
  border: 1px solid #00ff00;
  background: #111111;
  font-size: 12px;
  max-width: 800px;
}

.instructions h3 {
  color: #00ff00;
  margin-top: 0;
  text-align: center;
}

.instructions ul {
  margin-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .instructions {
    font-size: 11px;
  }
}
</style>