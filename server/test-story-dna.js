import { StoryDNA } from './src/narrative/StoryDNA.js'

console.log('🧬 TESTING STORY DNA GENERATION...\n')

const storyDNA = new StoryDNA('test-seed-1')

// Wait for atoms to load
setTimeout(async () => {
  console.log('📊 LOADED STORY ATOMS:')
  console.log('Total atoms:', storyDNA.getTotalAtoms())
  console.log('Categories:', Object.keys(storyDNA.atoms))
  console.log()

  // Test different player states
  const testStates = [
    { fuel: 20, credits: 200, heat: 80, location: 'Corporate Sector Alpha' },
    { fuel: 90, credits: 5000, heat: 10, location: 'Frontier Station Beta' },
    { fuel: 50, credits: 1000, heat: 45, location: 'Neutral Trade Hub' }
  ]

  testStates.forEach((state, i) => {
    console.log(`🎲 DNA SEQUENCE ${i + 1} (Player State: ${JSON.stringify(state)})`)
    const dna = storyDNA.generateStoryDNA(state)
    console.log(storyDNA.exportDNAForLLM(dna))
    console.log('\n' + '='.repeat(60) + '\n')
  })
}, 1000)