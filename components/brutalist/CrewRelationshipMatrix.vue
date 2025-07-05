<template>
  <div class="relationship-matrix-container">
    <div class="matrix-header">
      <span class="matrix-title">INTERPERSONAL DYNAMICS MATRIX</span>
      <span class="matrix-id">{{ matrixId }}</span>
    </div>
    
    <div class="matrix-grid">
      <!-- Header row with crew names -->
      <div class="matrix-cell header-cell empty"></div>
      <div 
        v-for="crew in crewMembers" 
        :key="'header-' + crew.id"
        class="matrix-cell header-cell"
        :title="crew.name"
      >
        {{ getCrewInitials(crew.name) }}
      </div>
      
      <!-- Data rows -->
      <template v-for="(rowCrew, rowIndex) in crewMembers" :key="'row-' + rowCrew.id">
        <!-- Row header with crew name -->
        <div 
          class="matrix-cell header-cell row-header"
          :title="rowCrew.name"
        >
          {{ getCrewInitials(rowCrew.name) }}
        </div>
        
        <!-- Relationship cells -->
        <div 
          v-for="(colCrew, colIndex) in crewMembers" 
          :key="'cell-' + rowCrew.id + '-' + colCrew.id"
          class="matrix-cell data-cell"
          :class="getRelationshipClass(rowCrew, colCrew, rowIndex, colIndex)"
          :title="getRelationshipTooltip(rowCrew, colCrew, rowIndex, colIndex)"
        >
          {{ getRelationshipSymbol(rowCrew, colCrew, rowIndex, colIndex) }}
        </div>
      </template>
    </div>
    
    <!-- Legend -->
    <div class="matrix-legend">
      <div class="legend-section">
        <div class="legend-title">RELATIONSHIP INDICATORS:</div>
        <div class="legend-items">
          <span class="legend-item">
            <span class="legend-symbol excellent">♥</span> EXCELLENT (+80)
          </span>
          <span class="legend-item">
            <span class="legend-symbol good">◊</span> POSITIVE (+40)
          </span>
          <span class="legend-item">
            <span class="legend-symbol neutral">◦</span> NEUTRAL (±20)
          </span>
          <span class="legend-item">
            <span class="legend-symbol poor">▼</span> TENSION (-40)
          </span>
          <span class="legend-item">
            <span class="legend-symbol hostile">✗</span> HOSTILE (-80)
          </span>
          <span class="legend-item">
            <span class="legend-symbol self">■</span> SELF-EVAL
          </span>
        </div>
      </div>
    </div>
    
    <!-- Corporate Analysis -->
    <div class="corporate-analysis">
      <div class="analysis-header">AUTOMATED SOCIAL DYNAMICS ASSESSMENT:</div>
      <div class="analysis-metrics">
        <div class="metric">
          <span class="metric-label">TEAM COHESION INDEX:</span>
          <span class="metric-value" :class="getCohesionClass()">{{ getTeamCohesion() }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">CONFLICT PROBABILITY:</span>
          <span class="metric-value" :class="getConflictClass()">{{ getConflictProb() }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">PRODUCTIVITY MULTIPLIER:</span>
          <span class="metric-value">{{ getProductivityMultiplier() }}x</span>
        </div>
      </div>
      <div class="analysis-warning" v-if="hasSignificantTension()">
        ⚠ ALERT: Interpersonal tensions detected. Recommend mediation protocols.
      </div>
    </div>
    
    <!-- System Footer -->
    <div class="system-footer">
      <span class="last-update">LAST SCAN: {{ getLastUpdate() }}</span>
      <span class="algorithm">ALG: SOCIAL-DYNAMICS-v4.2.1</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  crewMembers: {
    type: Array,
    default: () => []
  },
  relationships: {
    type: Object,
    default: () => ({})
  }
})

const matrixId = computed(() => {
  return `SDM-${Date.now().toString(36).slice(-6).toUpperCase()}`
})

const getCrewInitials = (name) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
}

const getRelationshipValue = (crew1, crew2) => {
  if (crew1.id === crew2.id) return 100 // Self-relationship
  
  // Check relationships object first
  const key = `${crew1.id}-${crew2.id}`
  if (props.relationships[key] !== undefined) {
    return props.relationships[key]
  }
  
  // Generate procedural relationship based on personality compatibility
  const seed = parseInt(crew1.id.slice(-4), 16) ^ parseInt(crew2.id.slice(-4), 16)
  const random = ((seed * 9301 + 49297) % 233280) / 233280
  
  // Base relationship around neutral with some variation
  let relationship = Math.floor((random - 0.5) * 120) + 50
  
  // Clamp to reasonable range
  return Math.max(-100, Math.min(100, relationship))
}

const getRelationshipSymbol = (crew1, crew2, rowIndex, colIndex) => {
  if (rowIndex === colIndex) return '■' // Self
  
  const value = getRelationshipValue(crew1, crew2)
  
  if (value >= 80) return '♥'
  if (value >= 40) return '◊'
  if (value >= -20) return '◦'
  if (value >= -60) return '▼'
  return '✗'
}

const getRelationshipClass = (crew1, crew2, rowIndex, colIndex) => {
  if (rowIndex === colIndex) return 'self'
  
  const value = getRelationshipValue(crew1, crew2)
  
  if (value >= 80) return 'excellent'
  if (value >= 40) return 'good'
  if (value >= -20) return 'neutral'
  if (value >= -60) return 'poor'
  return 'hostile'
}

const getRelationshipTooltip = (crew1, crew2, rowIndex, colIndex) => {
  if (rowIndex === colIndex) {
    return `${crew1.name} - Self Assessment: ${crew1.morale || 75}% morale`
  }
  
  const value = getRelationshipValue(crew1, crew2)
  const description = value >= 80 ? 'Strong Alliance' :
                     value >= 40 ? 'Positive Working Relationship' :
                     value >= -20 ? 'Professional Neutrality' :
                     value >= -60 ? 'Interpersonal Tension' :
                     'Significant Conflict'
  
  return `${crew1.name} → ${crew2.name}: ${value >= 0 ? '+' : ''}${value} (${description})`
}

const getTeamCohesion = () => {
  if (props.crewMembers.length < 2) return 100
  
  let totalRelationships = 0
  let relationshipCount = 0
  
  props.crewMembers.forEach((crew1, i) => {
    props.crewMembers.forEach((crew2, j) => {
      if (i !== j) {
        totalRelationships += getRelationshipValue(crew1, crew2)
        relationshipCount++
      }
    })
  })
  
  const averageRelationship = totalRelationships / relationshipCount
  return Math.max(0, Math.min(100, Math.round(50 + averageRelationship / 2)))
}

const getConflictProb = () => {
  if (props.crewMembers.length < 2) return 0
  
  let negativeRelationships = 0
  let totalRelationships = 0
  
  props.crewMembers.forEach((crew1, i) => {
    props.crewMembers.forEach((crew2, j) => {
      if (i !== j) {
        const value = getRelationshipValue(crew1, crew2)
        if (value < -40) negativeRelationships++
        totalRelationships++
      }
    })
  })
  
  return Math.round((negativeRelationships / totalRelationships) * 100)
}

const getProductivityMultiplier = () => {
  const cohesion = getTeamCohesion()
  const multiplier = 0.8 + (cohesion / 100) * 0.4 // Range from 0.8x to 1.2x
  return multiplier.toFixed(2)
}

const getCohesionClass = () => {
  const cohesion = getTeamCohesion()
  if (cohesion >= 80) return 'metric-excellent'
  if (cohesion >= 60) return 'metric-good'
  if (cohesion >= 40) return 'metric-fair'
  return 'metric-poor'
}

const getConflictClass = () => {
  const conflict = getConflictProb()
  if (conflict <= 10) return 'metric-excellent'
  if (conflict <= 25) return 'metric-good'
  if (conflict <= 50) return 'metric-fair'
  return 'metric-poor'
}

const hasSignificantTension = () => {
  return getConflictProb() > 30 || getTeamCohesion() < 40
}

const getLastUpdate = () => {
  const now = new Date()
  return now.toISOString().slice(11, 16) // HH:MM format
}
</script>

<style scoped>
.relationship-matrix-container {
  background: #000000;
  border: 2px solid #4ecdc4;
  color: #4ecdc4;
  font-family: 'MonaspiceAr Nerd Font', 'MonaspiceAr', monospace;
  padding: 10px;
  margin: 8px 0;
  font-size: 10px;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a7d7a;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.matrix-title {
  font-size: 11px;
  font-weight: bold;
  color: #4ecdc4;
}

.matrix-id {
  font-size: 9px;
  color: #666666;
  font-family: 'MonaspiceXe Nerd Font', 'MonaspiceXe', monospace;
}

.matrix-grid {
  display: grid;
  grid-template-columns: 30px repeat(var(--crew-count, 4), 30px);
  gap: 1px;
  margin-bottom: 10px;
  background: #111111;
  padding: 2px;
}

.matrix-cell {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: #000000;
  border: 1px solid #333333;
}

.header-cell {
  background: #1a1a1a;
  color: #888888;
  font-size: 8px;
}

.empty {
  background: #000000;
  border: none;
}

.row-header {
  border-right: 2px solid #4ecdc4;
}

.data-cell {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-cell:hover {
  border-color: #4ecdc4;
  background: #0a2020;
}

/* Relationship color coding */
.excellent {
  color: #ff6b9d;
  background: rgba(255, 107, 157, 0.1);
  border-color: #ff6b9d;
}

.good {
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  border-color: #4ecdc4;
}

.neutral {
  color: #95a5a6;
  background: rgba(149, 165, 166, 0.1);
  border-color: #95a5a6;
}

.poor {
  color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  border-color: #f39c12;
}

.hostile {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  border-color: #e74c3c;
  animation: tension-pulse 2s ease-in-out infinite;
}

.self {
  color: #9b59b6;
  background: rgba(155, 89, 182, 0.1);
  border-color: #9b59b6;
}

@keyframes tension-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.matrix-legend {
  margin-bottom: 8px;
  padding: 6px;
  background: #0a0a0a;
  border: 1px solid #333333;
}

.legend-title {
  font-size: 8px;
  color: #888888;
  margin-bottom: 4px;
  font-weight: bold;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-item {
  font-size: 7px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.legend-symbol {
  font-weight: bold;
  font-size: 8px;
}

.corporate-analysis {
  margin-bottom: 8px;
  padding: 6px;
  background: #0a0a0a;
  border: 1px solid #333333;
}

.analysis-header {
  font-size: 8px;
  color: #888888;
  margin-bottom: 4px;
  font-weight: bold;
}

.analysis-metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8px;
}

.metric-label {
  color: #666666;
}

.metric-value {
  font-weight: bold;
}

.metric-excellent { color: #00ff00; }
.metric-good { color: #4ecdc4; }
.metric-fair { color: #f39c12; }
.metric-poor { color: #e74c3c; }

.analysis-warning {
  margin-top: 4px;
  padding: 3px 6px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  color: #e74c3c;
  font-size: 7px;
  font-weight: bold;
  animation: warning-blink 1.5s ease-in-out infinite;
}

@keyframes warning-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.system-footer {
  border-top: 1px solid #2a7d7a;
  padding-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7px;
  color: #444444;
}
</style>