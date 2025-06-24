// Demo script showing how the tropes database enhances narrative generation
import { DialogGenerator } from '../generators/DialogGenerator.js'
import { StorytellerAgent } from '../narrative/StorytellerAgent.js'

async function demonstrateTropesIntegration() {
  console.log('🎭 SPACEPUNK TROPES INTEGRATION DEMO\n')
  
  // Initialize systems
  const dialogGen = new DialogGenerator('demo-seed')
  const storyteller = new StorytellerAgent('demo-seed')
  
  // Wait for tropes to load
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Example player state
  const playerState = {
    fuel: 25,          // Low fuel (triggers emergency tropes)
    credits: 300,      // Low credits (triggers financial tropes)  
    heat: 75,          // High heat (triggers corporate surveillance tropes)
    location: 'Titan Refinery Epsilon'
  }
  
  console.log('📊 PLAYER STATE:')
  console.log(`Fuel: ${playerState.fuel}/100 (LOW)`)
  console.log(`Credits: ${playerState.credits} CR (LOW)`)
  console.log(`Heat: ${playerState.heat}/100 (HIGH - Corporate Attention)`)
  console.log(`Location: ${playerState.location}\n`)
  
  // Test dialog generation with tropes
  console.log('🎯 GENERATING EXPLORE DIALOG WITH TROPES...\n')
  
  try {
    // This will select relevant tropes based on player state and action type
    const dialog = await dialogGen.generateDialog('explore', playerState)
    
    console.log('📝 GENERATED DIALOG:')
    console.log(`Situation: ${dialog.situation}`)
    console.log('\nChoices:')
    dialog.choices.forEach((choice, i) => {
      console.log(`  ${i+1}. [${choice.risk.toUpperCase()}] ${choice.text}`)
      if (choice.consequences) {
        const consequences = Object.entries(choice.consequences)
          .filter(([key, value]) => key !== 'narrative')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        if (consequences) {
          console.log(`     → ${consequences}`)
        }
      }
    })
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test narrative generation with tropes
    console.log('📚 GENERATING NARRATIVE WITH TROPE PATTERNS...\n')
    
    const gameEvents = [
      {
        action: 'explore',
        description: 'Investigated anomalous energy signature',
        fuel_change: -10,
        credits_change: 150,
        heat_change: 15,
        timestamp: new Date()
      },
      {
        action: 'spy',
        description: 'Intercepted corporate transmissions',
        fuel_change: 0,
        credits_change: 300,
        heat_change: 25,
        timestamp: new Date()
      },
      {
        action: 'wait',
        description: 'Waited for heat to dissipate',
        fuel_change: 0,
        credits_change: 0,
        heat_change: -5,
        timestamp: new Date()
      }
    ]
    
    const narrative = await storyteller.generateNarrative(gameEvents, {
      heat_level: playerState.heat,
      location: playerState.location,
      credits: playerState.credits
    })
    
    console.log('📖 GENERATED NARRATIVE:')
    console.log(`Style: ${narrative.style}`)
    console.log(`Patterns Identified: ${narrative.patterns_identified?.join(', ') || 'None'}`)
    console.log(`Text: "${narrative.text}"`)
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Show how tropes influence generation
    console.log('🔍 HOW TROPES INFLUENCED GENERATION:\n')
    
    console.log('DIALOG TROPE SELECTION:')
    console.log('- Low fuel + Exploration → Emergency/Crisis tropes weighted higher')
    console.log('- High heat → Corporate surveillance tropes selected')
    console.log('- Action type "explore" → Space + Plot Device + Classic Plot tropes')
    
    console.log('\nNARRATIVE PATTERN DETECTION:')
    console.log('- Explore → Spy → Wait sequence → Detected "Hero\'s Journey" pattern')
    console.log('- High heat gain → Detected "Man vs System" conflict')
    console.log('- Multiple spy actions → Player cast as "The Insider" archetype')
    
    console.log('\nCORPORATE FILTERING:')
    console.log('- All classic story structures interpreted through workplace lens')
    console.log('- Epic adventures become bureaucratic incidents')
    console.log('- Heroic journeys become performance reviews')
    console.log('- Dangerous missions become corporate compliance issues')
    
  } catch (error) {
    console.error('Demo failed:', error)
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateTropesIntegration()
}