<template>
  <div class="cargo-test-page">
    <h1>> CARGO GRID TEST</h1>
    
    <div class="test-controls">
      <button @click="loadTestCargo">Load Test Cargo</button>
      <button @click="clearCargo">Clear Cargo</button>
      <button @click="addRandomItem">Add Random Item</button>
    </div>

    <div class="cargo-display">
      <CargoGrid 
        :cargo-used="testCargo.length" 
        :cargo-max="100" 
        :cargo-items="testCargo" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CargoGrid } from '~/components/brutalist'

const testCargo = ref([])

const sampleItems = [
  { id: 'c1', code: 'COMP_BASIC', name: 'Basic Computer Components', category: 'tech', weight: 0.5, volume: 0.3, quantity: 1 },
  { id: 'c2', code: 'FUEL_STD', name: 'Standard Fuel', category: 'consumable', weight: 1.0, volume: 1.0, quantity: 1 },
  { id: 'c3', code: 'FOOD_BASIC', name: 'Basic Food Supplies', category: 'consumable', weight: 1.0, volume: 1.2, quantity: 1 },
  { id: 'c4', code: 'GEMS_RARE', name: 'Rare Gemstones', category: 'luxury', weight: 0.1, volume: 0.1, quantity: 1 },
  { id: 'c5', code: 'BIO_SAMPLES', name: 'Biological Samples', category: 'green', weight: 0.2, volume: 0.3, quantity: 1 },
  { id: 'c6', code: 'WEAPON_SYS', name: 'Weapon System Components', category: 'tech', weight: 3.0, volume: 2.0, quantity: 1 },
  { id: 'c7', code: 'MEDICINE', name: 'Medical Supplies', category: 'consumable', weight: 0.3, volume: 0.5, quantity: 1 },
  { id: 'c8', code: 'ARTIFACTS', name: 'Ancient Artifacts', category: 'luxury', weight: 0.5, volume: 0.5, quantity: 1 }
]

const loadTestCargo = () => {
  testCargo.value = [
    { ...sampleItems[0], quantity: 3 },
    { ...sampleItems[1], quantity: 5 },
    { ...sampleItems[2], quantity: 2 },
    { ...sampleItems[3], quantity: 1 },
    { ...sampleItems[4], quantity: 4 }
  ]
}

const clearCargo = () => {
  testCargo.value = []
}

const addRandomItem = () => {
  const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)]
  const existingItem = testCargo.value.find(item => item.id === randomItem.id)
  
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    testCargo.value.push({ ...randomItem, quantity: 1 })
  }
}
</script>

<style scoped>
.cargo-test-page {
  background: #000000;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
}

.cargo-test-page h1 {
  color: #00ff00;
  border-bottom: 2px solid #00ff00;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.test-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.test-controls button {
  background: #111111;
  color: #ffffff;
  border: 2px solid #ffffff;
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s;
}

.test-controls button:hover {
  background: #ffffff;
  color: #000000;
}

.cargo-display {
  max-width: 800px;
}
</style>