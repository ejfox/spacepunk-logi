import { StoryDNA } from './src/narrative/StoryDNA.js'

console.log('🎲 TESTING DNA VARIETY - INFINITE COMBINATIONS\n')

const storyDNA = new StoryDNA('variety-test')

setTimeout(() => {
  console.log('🧬 GENERATING 5 DIFFERENT DNA SEQUENCES FOR SAME PLAYER STATE...\n')
  
  const playerState = { fuel: 50, credits: 1000, heat: 60, location: 'Station Alpha' }
  
  for (let i = 1; i <= 5; i++) {
    // Each call should generate different DNA due to chance.js
    const dna = storyDNA.generateStoryDNA(playerState)
    
    console.log(`🎭 DNA VARIANT ${i}:`)
    console.log(`Drive: ${dna.motivation.corporate_spin}`)
    console.log(`Obstacle: ${dna.obstacle.corporate_spin}`) 
    console.log(`Stakes: ${dna.stakes.corporate_spin}`)
    console.log(`Tone: ${dna.tone}`)
    console.log(`Relationship: ${dna.primary_relationship.corporate_spin} with ${dna.relationship_tension}`)
    console.log(`Conflict: ${dna.conflict_pattern}`)
    console.log(`Emotion: ${dna.emotional_arc}`)
    console.log(`Corporate Filter: ${dna.corporate_filter.euphemism_level}/5 euphemism, ${Math.round(dna.corporate_filter.bureaucracy_density * 100)}% bureaucracy`)
    console.log()
  }
  
  console.log('🔍 TESTING CONTEXT-RESPONSIVE DNA...\n')
  
  const contexts = [
    { fuel: 5, credits: 50, heat: 95, location: 'Corporate Enforcement Zone', name: 'CRISIS' },
    { fuel: 100, credits: 10000, heat: 5, location: 'Safe Haven Station', name: 'PROSPERITY' },
    { fuel: 30, credits: 500, heat: 30, location: 'Frontier Outpost', name: 'STRUGGLE' }
  ]
  
  contexts.forEach(context => {
    const dna = storyDNA.generateStoryDNA(context)
    console.log(`📊 ${context.name} CONTEXT DNA:`)
    console.log(`Setting Pressure: ${dna.setting_pressure}`)
    console.log(`Stakes: ${dna.stakes.corporate_spin}`)
    console.log(`Tone: ${dna.tone}`)
    console.log()
  })
  
}, 1000)