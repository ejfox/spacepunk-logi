<template>
  <div class="crew-traits">
    <div class="traits-header">
      <h4>PERSONALITY PROFILE</h4>
      <button 
        class="refresh-btn"
        @click="refreshTraits"
        :disabled="isLoading"
        title="Refresh trait data"
      >
        {{ isLoading ? '...' : '↻' }}
      </button>
    </div>

    <div v-if="traits.length > 0" class="traits-list">
      <div 
        v-for="trait in traits" 
        :key="trait.id"
        class="trait-item"
        :class="[`trait-${trait.category}`, { 'trait-weak': trait.trait_strength < 50 }]"
        :title="trait.description"
      >
        <div class="trait-header">
          <span class="trait-name">{{ trait.name }}</span>
          <span class="trait-category">{{ formatCategory(trait.category) }}</span>
        </div>
        
        <div class="trait-details">
          <div class="trait-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :style="{ width: `${trait.trait_strength}%` }"
              ></div>
            </div>
            <span class="strength-text">{{ Math.round(trait.trait_strength) }}%</span>
          </div>
          
          <p class="trait-flavor" v-if="trait.flavor_text">
            "{{ trait.flavor_text }}"
          </p>
        </div>

        <div class="trait-effects" v-if="showEffects && hasEffects(trait)">
          <div v-if="trait.stat_modifiers" class="stat-modifiers">
            <span 
              v-for="(value, stat) in parseStatModifiers(trait.stat_modifiers)" 
              :key="stat"
              class="stat-mod"
              :class="{ positive: value > 0, negative: value < 0 }"
            >
              {{ formatStatName(stat) }}: {{ value > 0 ? '+' : '' }}{{ value }}
            </span>
          </div>
          
          <div v-if="trait.special_abilities && trait.special_abilities.length > 0" class="special-abilities">
            <span class="abilities-label">ABILITIES:</span>
            <span 
              v-for="ability in trait.special_abilities" 
              :key="ability"
              class="ability-tag"
            >
              {{ formatAbility(ability) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="no-traits">
      <p>No personality traits recorded.</p>
      <p class="help-text">Traits develop over time through crew interactions and experiences.</p>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading personality profile...</p>
    </div>

    <div class="traits-footer">
      <button 
        class="toggle-btn"
        @click="showEffects = !showEffects"
      >
        {{ showEffects ? 'HIDE EFFECTS' : 'SHOW EFFECTS' }}
      </button>
      
      <div class="trait-summary" v-if="modifiers && Object.keys(modifiers).length > 0">
        <span class="summary-label">TOTAL MODIFIERS:</span>
        <span 
          v-for="(value, stat) in modifiers" 
          :key="stat"
          class="summary-mod"
          :class="{ positive: value > 0, negative: value < 0 }"
        >
          {{ formatStatName(stat) }}: {{ value > 0 ? '+' : '' }}{{ value }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  crewMemberId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['traitsUpdated'])

const traits = ref([])
const modifiers = ref({})
const isLoading = ref(false)
const showEffects = ref(false)

onMounted(() => {
  refreshTraits()
})

watch(() => props.crewMemberId, () => {
  refreshTraits()
})

async function refreshTraits() {
  if (!props.crewMemberId) return
  
  isLoading.value = true
  try {
    // Fetch crew traits
    const traitsResponse = await fetch(`http://localhost:3001/api/crew/${props.crewMemberId}/traits`)
    if (traitsResponse.ok) {
      traits.value = await traitsResponse.json()
    }
    
    // Fetch trait modifiers
    const modifiersResponse = await fetch(`http://localhost:3001/api/crew/${props.crewMemberId}/trait-modifiers`)
    if (modifiersResponse.ok) {
      modifiers.value = await modifiersResponse.json()
    }
    
    emit('traitsUpdated', { traits: traits.value, modifiers: modifiers.value })
    
  } catch (error) {
    console.error('Error fetching crew traits:', error)
  } finally {
    isLoading.value = false
  }
}

function formatCategory(category) {
  return category.replace('_', ' ').toUpperCase()
}

function formatStatName(stat) {
  return stat.replace('skill_', '').replace('trait_', '').toUpperCase()
}

function formatAbility(ability) {
  return ability.replace(/_/g, ' ').toUpperCase()
}

function parseStatModifiers(modifiers) {
  if (typeof modifiers === 'string') {
    return JSON.parse(modifiers)
  }
  return modifiers || {}
}

function hasEffects(trait) {
  const mods = parseStatModifiers(trait.stat_modifiers)
  return Object.keys(mods).length > 0 || 
         (trait.special_abilities && trait.special_abilities.length > 0)
}

// Expose refresh method for parent components
defineExpose({
  refreshTraits
})
</script>

<style scoped>
.crew-traits {
  background: #001100;
  border: 1px solid #00ff00;
  padding: 8px;
  margin-top: 8px;
  font-family: var(--font-code);
}

.traits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #333;
}

.traits-header h4 {
  color: #00ff00;
  font-size: 11px;
  margin: 0;
  letter-spacing: 1px;
}

.refresh-btn {
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  width: 20px;
  height: 20px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #00ff00;
  color: #000;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.traits-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trait-item {
  border: 1px solid #333;
  padding: 6px;
  background: #000;
  position: relative;
}

.trait-item.trait-personality {
  border-left: 3px solid #00ff00;
}

.trait-item.trait-work_ethic {
  border-left: 3px solid #ffaa00;
}

.trait-item.trait-skill {
  border-left: 3px solid #0088ff;
}

.trait-item.trait-quirk {
  border-left: 3px solid #ff6600;
}

.trait-item.trait-background {
  border-left: 3px solid #aa00ff;
}

.trait-item.trait-weak {
  opacity: 0.7;
}

.trait-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.trait-name {
  color: #00ff00;
  font-weight: bold;
  font-size: 11px;
}

.trait-category {
  color: #00ff00;
  font-size: 8px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trait-details {
  margin-bottom: 4px;
}

.trait-strength {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.strength-bar {
  flex: 1;
  height: 8px;
  background: #333;
  border: 1px solid #00ff00;
  position: relative;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6600, #ffaa00, #00ff00);
  transition: width 0.3s ease;
}

.strength-text {
  color: #00ff00;
  font-size: 9px;
  min-width: 30px;
  text-align: right;
}

.trait-flavor {
  color: #00ff00;
  font-size: 9px;
  font-style: italic;
  opacity: 0.8;
  margin: 0;
  line-height: 1.3;
}

.trait-effects {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid #333;
}

.stat-modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.stat-mod {
  font-size: 8px;
  padding: 1px 3px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.5);
}

.stat-mod.positive {
  color: #00ff00;
  border-color: #00ff00;
}

.stat-mod.negative {
  color: #ff6600;
  border-color: #ff6600;
}

.special-abilities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.abilities-label {
  color: #00ff00;
  font-size: 8px;
  opacity: 0.7;
}

.ability-tag {
  font-size: 8px;
  padding: 1px 3px;
  border: 1px solid #0088ff;
  color: #0088ff;
  background: rgba(0, 136, 255, 0.1);
}

.no-traits {
  text-align: center;
  padding: 16px;
  color: #00ff00;
  opacity: 0.6;
}

.help-text {
  font-size: 9px;
  margin-top: 4px;
  opacity: 0.8;
}

.loading {
  text-align: center;
  padding: 16px;
  color: #00ff00;
  opacity: 0.7;
}

.traits-footer {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.toggle-btn {
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 2px 6px;
  font-size: 8px;
  cursor: pointer;
  font-family: var(--font-code);
}

.toggle-btn:hover {
  background: #00ff00;
  color: #000;
}

.trait-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 8px;
}

.summary-label {
  color: #00ff00;
  opacity: 0.7;
}

.summary-mod {
  padding: 1px 3px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.5);
}

.summary-mod.positive {
  color: #00ff00;
  border-color: #00ff00;
}

.summary-mod.negative {
  color: #ff6600;
  border-color: #ff6600;
}
</style>