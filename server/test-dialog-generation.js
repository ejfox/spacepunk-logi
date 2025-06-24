import { DialogGenerator } from './src/generators/DialogGenerator.js'

console.log('🎭 TESTING DIALOG GENERATION WITH STORY DNA...\n')

const dialogGen = new DialogGenerator('test-seed-dialog')

// Wait for story DNA to load
setTimeout(async () => {
  const testCases = [
    {
      action: 'explore',
      state: { fuel: 25, credits: 300, heat: 75, location: 'Abandoned Mining Station' }
    },
    {
      action: 'trade', 
      state: { fuel: 80, credits: 50, heat: 20, location: 'Corporate Trade Hub' }
    },
    {
      action: 'spy',
      state: { fuel: 60, credits: 2000, heat: 85, location: 'Neutral Territory' }
    }
  ]

  for (const testCase of testCases) {
    console.log(`🎯 TESTING ${testCase.action.toUpperCase()} ACTION`)
    console.log(`Player State: ${JSON.stringify(testCase.state)}`)
    console.log()

    try {
      const dialog = await dialogGen.generateDialog(testCase.action, testCase.state)
      
      console.log('📜 GENERATED DIALOG:')
      console.log(`Situation: "${dialog.situation}"`)
      console.log()
      console.log('Choices:')
      dialog.choices.forEach((choice, i) => {
        console.log(`  ${i+1}. [${choice.risk?.toUpperCase() || 'UNKNOWN'}] ${choice.text}`)
        
        if (choice.consequences) {
          const consequences = Object.entries(choice.consequences)
            .filter(([key]) => key !== 'narrative')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          
          if (consequences) {
            console.log(`     → ${consequences}`)
          }
          
          if (choice.consequences.narrative) {
            console.log(`     💭 ${choice.consequences.narrative}`)
          }
        }
      })
      
    } catch (error) {
      console.log('❌ GENERATION FAILED:', error.message)
      
      // Test fallback dialog
      console.log('🔄 TESTING FALLBACK DIALOG...')
      const fallback = dialogGen.generateFallbackDialog(testCase.action, testCase.state)
      console.log(`Fallback Situation: "${fallback.situation}"`)
    }
    
    console.log('\n' + '='.repeat(70) + '\n')
  }
}, 1000)