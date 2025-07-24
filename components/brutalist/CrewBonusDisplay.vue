<template>
  <div class="crew-bonus-display">
    <div v-if="!crewMember.crew_bonuses || Object.keys(crewMember.crew_bonuses).length === 0" class="no-bonuses">
      <p>STANDARD CREW - NO SPECIALIZATION BONUSES</p>
    </div>
    
    <div v-else class="bonuses">
      <h4>CREW SPECIALIZATION: {{ crewMember.crew_type_name?.toUpperCase() || 'UNKNOWN' }}</h4>
      <p class="description">{{ crewMember.crew_type_description || 'No description available.' }}</p>
      
      <div class="bonus-list">
        <div v-for="(value, bonus) in parsedBonuses" :key="bonus" class="bonus-item">
          <span class="bonus-name">{{ formatBonusName(bonus) }}:</span>
          <span class="bonus-value">{{ formatBonusValue(bonus, value) }}</span>
        </div>
      </div>
      
      <div class="cost-info">
        <p>HIRING COST: {{ crewMember.hiring_cost || 0 }} CREDITS</p>
        <p>SALARY: {{ crewMember.salary || 50 }} CREDITS/TICK</p>
        <p class="cost-multiplier">({{ getSalaryMultiplierText() }})</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  crewMember: {
    type: Object,
    required: true
  }
})

const parsedBonuses = computed(() => {
  if (!props.crewMember.crew_bonuses) return {}
  
  if (typeof props.crewMember.crew_bonuses === 'string') {
    try {
      return JSON.parse(props.crewMember.crew_bonuses)
    } catch (e) {
      return {}
    }
  }
  
  return props.crewMember.crew_bonuses
})

const formatBonusName = (bonusKey) => {
  const nameMap = {
    fuel_efficiency: 'FUEL EFFICIENCY',
    fuel_decay_reduction: 'FUEL CONSERVATION',
    illegal_cargo_profit: 'SMUGGLING PROFITS',
    heat_reduction_smuggling: 'SMUGGLING HEAT REDUCTION',
    heat_reduction_politics: 'POLITICAL HEAT REDUCTION',
    reputation_bonus: 'REPUTATION GAINS',
    engineering_bonus: 'ENGINEERING SKILL',
    social_bonus: 'SOCIAL SKILL'
  }
  
  return nameMap[bonusKey] || bonusKey.toUpperCase()
}

const formatBonusValue = (bonusKey, value) => {
  if (bonusKey.includes('bonus') && (bonusKey.includes('engineering') || bonusKey.includes('social'))) {
    return `+${value} SKILL POINTS`
  }
  
  return `+${Math.round(value * 100)}%`
}

const getSalaryMultiplierText = () => {
  const type = props.crewMember.crew_type
  const multiplierMap = {
    engineer: 'SPECIALIST RATE: 1.5X',
    smuggler: 'RISK PREMIUM: 1.3X',
    diplomat: 'PROFESSIONAL RATE: 1.4X',
    general: 'STANDARD RATE: 1.0X'
  }
  
  return multiplierMap[type] || 'STANDARD RATE'
}
</script>

<style scoped>
.crew-bonus-display {
  border: 2px solid #333;
  padding: 16px;
  margin: 8px 0;
  background: #f8f8f8;
  font-family: 'Courier New', monospace;
}

.no-bonuses {
  text-align: center;
  color: #666;
  font-weight: bold;
}

.bonuses h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.description {
  margin: 8px 0;
  font-style: italic;
  color: #555;
}

.bonus-list {
  margin: 12px 0;
}

.bonus-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dotted #ccc;
}

.bonus-name {
  font-weight: bold;
}

.bonus-value {
  color: #006600;
  font-weight: bold;
}

.cost-info {
  margin-top: 12px;
  border-top: 1px solid #333;
  padding-top: 8px;
}

.cost-info p {
  margin: 4px 0;
  font-size: 12px;
}

.cost-multiplier {
  color: #666;
  font-style: italic;
}
</style>