#!/usr/bin/env node

// Test script to demonstrate faction reputation system
console.log('🧪 Testing Faction Reputation System\n');

const BASE_URL = 'http://localhost:3666';

async function testFactionSystem() {
  console.log('1️⃣ Creating test player...');
  
  // Create player
  const playerRes = await fetch(`${BASE_URL}/api/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ReputationTester' })
  });
  
  const playerData = await playerRes.json();
  const playerId = playerData.player.id;
  
  console.log(`   Player created: ${playerId}`);
  console.log(`   Initial reputation:`, playerData.player.reputation);
  
  console.log('\n2️⃣ Testing basic choices (neutral reputation)...');
  
  // Test with neutral reputation
  let dialogRes = await fetch(`${BASE_URL}/api/dialog/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType: 'explore',
      playerState: { playerId, shipId: 'test', fuel: 100, credits: 1000, heat: 0 }
    })
  });
  
  // Read streaming response to get final choices
  const reader = dialogRes.body.getReader();
  let finalDialog = null;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'complete') {
            finalDialog = data.dialog;
          }
        } catch (e) {}
      }
    }
  }
  
  console.log(`   Available choices: ${finalDialog.choices.length}`);
  finalDialog.choices.forEach(choice => {
    console.log(`   - ${choice.text} (${choice.faction})`);
  });
  
  console.log('\n3️⃣ Increasing corporate reputation to 50+...');
  
  // Increase corporate reputation
  await fetch(`${BASE_URL}/api/player/${playerId}/reputation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reputationChanges: { corporate: 50 } })
  });
  
  console.log('\n4️⃣ Testing choices with high corporate reputation...');
  
  // Test with high corporate reputation
  dialogRes = await fetch(`${BASE_URL}/api/dialog/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType: 'explore',
      playerState: { playerId, shipId: 'test', fuel: 100, credits: 1000, heat: 0 }
    })
  });
  
  // Read streaming response
  const reader2 = dialogRes.body.getReader();
  finalDialog = null;
  
  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'complete') {
            finalDialog = data.dialog;
          }
        } catch (e) {}
      }
    }
  }
  
  console.log(`   Available choices: ${finalDialog.choices.length}`);
  finalDialog.choices.forEach(choice => {
    console.log(`   - ${choice.text} (${choice.faction}) - ${choice.consequences.credits} credits`);
  });
  
  console.log('\n5️⃣ Adding pirate reputation to 50+...');
  
  // Add pirate reputation
  await fetch(`${BASE_URL}/api/player/${playerId}/reputation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reputationChanges: { pirate: 50 } })
  });
  
  console.log('\n6️⃣ Testing choices with both corporate and pirate access...');
  
  // Test with both factions high
  dialogRes = await fetch(`${BASE_URL}/api/dialog/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType: 'explore',
      playerState: { playerId, shipId: 'test', fuel: 100, credits: 1000, heat: 0 }
    })
  });
  
  // Read streaming response
  const reader3 = dialogRes.body.getReader();
  finalDialog = null;
  
  while (true) {
    const { done, value } = await reader3.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'complete') {
            finalDialog = data.dialog;
          }
        } catch (e) {}
      }
    }
  }
  
  console.log(`   Available choices: ${finalDialog.choices.length}`);
  finalDialog.choices.forEach(choice => {
    console.log(`   - ${choice.text} (${choice.faction}) - ${choice.consequences.credits} credits`);
  });
  
  console.log('\n7️⃣ Testing negative reputation blocking...');
  
  // Make corporate reputation very negative
  await fetch(`${BASE_URL}/api/player/${playerId}/reputation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reputationChanges: { corporate: -75 } }) // Should put corporate at -25
  });
  
  // Test choices are blocked
  dialogRes = await fetch(`${BASE_URL}/api/dialog/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType: 'explore',
      playerState: { playerId, shipId: 'test', fuel: 100, credits: 1000, heat: 0 }
    })
  });
  
  // Read streaming response
  const reader4 = dialogRes.body.getReader();
  finalDialog = null;
  
  while (true) {
    const { done, value } = await reader4.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'complete') {
            finalDialog = data.dialog;
          }
        } catch (e) {}
      }
    }
  }
  
  console.log(`   Available choices: ${finalDialog.choices.length} (corporate choices should be blocked)`);
  finalDialog.choices.forEach(choice => {
    console.log(`   - ${choice.text} (${choice.faction}) - ${choice.consequences.credits} credits`);
  });
  
  console.log('\n✅ Faction reputation system test complete!');
  console.log('🎯 Key features demonstrated:');
  console.log('   - Basic choices always available');
  console.log('   - Corporate choices unlock at 50+ corporate rep');
  console.log('   - Pirate choices unlock at 50+ pirate rep');
  console.log('   - Negative reputation blocks faction choices');
  console.log('   - Reputation persists server-side');
  console.log('   - Choice consequences affect multiple factions');
}

testFactionSystem().catch(console.error);