<template>
  <div class="brutalist-demo">
    <h1 class="demo-title">> SPACEPUNK UI COMPONENT LIBRARY</h1>

    <!-- Panel Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST PANEL</h2>
      <BrutalistPanel title="SYSTEM STATUS" subtitle="ONLINE" footer="Last updated: 15:42:33">
        <p>This is a basic panel component with title, subtitle, and footer.</p>
      </BrutalistPanel>

      <BrutalistPanel title="ERROR PANEL" :error="true">
        <p>This panel indicates an error state.</p>
      </BrutalistPanel>
    </section>

    <!-- Button Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST BUTTON</h2>
      <div class="button-grid">
        <BrutalistButton label="DEFAULT" @click="handleClick" />
        <BrutalistButton label="PRIMARY" variant="primary" @click="handleClick" />
        <BrutalistButton label="DANGER" variant="danger" @click="handleClick" />
        <BrutalistButton label="DISABLED" :disabled="true" />
        <BrutalistButton label="PROCESSING" :processing="true" />
      </div>
    </section>

    <!-- Input Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST INPUT</h2>
      <BrutalistInput v-model="inputValue" label="CREW NAME" placeholder="Enter crew member name" />
      <BrutalistInput v-model="errorInput" label="VALIDATION ERROR" :error="true"
        error-message="Invalid input format" />
      <BrutalistInput v-model="validInput" label="VALID INPUT" :valid="true" hint="Name must be 3-20 characters" />
    </section>

    <!-- Select Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST SELECT</h2>
      <BrutalistSelect v-model="selectedOption" label="SELECT DESTINATION" :options="selectOptions"
        placeholder="-- Choose destination --" />
    </section>

    <!-- Table Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST TABLE</h2>
      <BrutalistTable title="CREW ROSTER" :headers="tableHeaders" :data="tableData" :selectable="true"
        @select="handleRowSelect" />
    </section>

    <!-- Progress Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST PROGRESS</h2>
      <BrutalistProgress :value="25" label="REACTOR CHARGE" status="CHARGING..." />
      <BrutalistProgress :value="75" label="HULL INTEGRITY" variant="warning" />
      <BrutalistProgress :value="100" label="TRAINING COMPLETE" variant="success" />
    </section>

    <!-- Alert Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST ALERT</h2>
      <BrutalistAlert type="info" message="System update available. Version 2.4.1 ready for installation." />
      <BrutalistAlert type="warning" message="Low fuel warning. Current reserves at 23%." />
      <BrutalistAlert type="error" message="CRITICAL: Reactor temperature exceeding safe parameters!"
        :dismissible="false" />
    </section>

    <!-- Form Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST FORM</h2>
      <BrutalistForm title="NEW CREW REGISTRATION" form-id="NCR-001" @submit="handleFormSubmit">
        <BrutalistInput v-model="formData.name" label="FULL NAME" placeholder="Enter crew member name" />
        <BrutalistSelect v-model="formData.role" label="ASSIGNED ROLE" :options="roleOptions" />
        <BrutalistInput v-model="formData.experience" label="YEARS EXPERIENCE" type="number" />
      </BrutalistForm>
    </section>

    <!-- Game Components Demo -->
    <section class="demo-section">
      <h2 class="section-title">GAME-SPECIFIC COMPONENTS</h2>

      <div class="component-demo">
        <h3>CREW CARD</h3>
        <div class="crew-grid">
          <CrewCard v-for="crew in demoCrewMembers" :key="crew.id" :crew-member="crew" @select="handleCrewSelect"
            @assign="handleCrewAssign" @details="handleCrewDetails" />
        </div>
      </div>

      <div class="component-demo">
        <h3>TRAINING PANEL</h3>
        <TrainingPanel :crew="demoCrewMembers" :active-trainings="demoTrainings" @start="handleStartTraining"
          @pause="handlePauseTraining" @cancel="handleCancelTraining" />
      </div>

      <div class="component-demo">
        <h3>MISSION BOARD</h3>
        <MissionBoard :missions="demoMissions" @view="handleViewMission" @accept="handleAcceptMission"
          @refresh="handleRefreshMissions" />
      </div>

      <div class="component-demo">
        <h3>HOLD-TO-CONFIRM</h3>
        <div style="display: flex; gap: 16px; align-items: center;">
          <HoldToConfirm label="DANGEROUS ACTION" confirm-label="ACTION CONFIRMED" :duration="3000"
            @confirm="handleDangerousAction" />
          <HoldToConfirm label="ACCEPT MISSION" confirm-label="MISSION ACCEPTED" :duration="5000"
            @confirm="handleMissionAccept" />
        </div>
      </div>

      <div class="component-demo">
        <h3>STORY LOG</h3>
        <div class="story-controls" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
          <BrutalistButton label="BASIC STORY" @click="loadBasicStory" />
          <BrutalistButton label="ACTION SEQUENCE" @click="loadActionStory" />
          <BrutalistButton label="MYSTERY ENCOUNTER" @click="loadMysteryStory" />
        </div>
        <StoryLog :title="currentStoryTitle" :timestamp="currentStoryTimestamp" :location="currentStoryLocation"
          :entries="currentStoryEntries" :show-continue="showStoryContinue" @choice="handleStoryChoice"
          @continue="handleStoryContinue" />
      </div>

      <div class="component-demo">
        <h3>PIXIJS VISUALIZATION</h3>
        <PixiCrewExample />
      </div>

      <div class="component-demo">
        <h3>CARGO GRID VISUALIZATION</h3>
        <div class="cargo-controls" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
          <BrutalistButton label="LOAD DEMO CARGO" @click="loadDemoCargo" />
          <BrutalistButton label="CLEAR CARGO" @click="clearCargo" />
          <BrutalistButton label="RANDOM CARGO" @click="randomizeCargo" />
        </div>
        <CargoGrid 
          :cargo-used="demoCargo.length" 
          :cargo-max="100" 
          :cargo-items="demoCargo" 
        />
      </div>

      <div class="component-demo">
        <h3>LOCKPICKING MINIGAME</h3>
        <div class="lockpick-controls" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
          <BrutalistButton label="ROUTINE LOCK" @click="() => setLockDifficulty('routine')" />
          <BrutalistButton label="STANDARD LOCK" @click="() => setLockDifficulty('standard')" />
          <BrutalistButton label="CHALLENGING LOCK" @click="() => setLockDifficulty('challenging')" />
          <BrutalistButton label="DANGEROUS LOCK" @click="() => setLockDifficulty('dangerous')" />
        </div>
        <div v-if="showLockpicking" style="max-width: 700px;">
          <PixiLockpicking 
            :difficulty="lockDifficulty" 
            :crew-skill="lockSkill" 
            :time-limit="30"
            @complete="handleLockpickComplete"
          />
        </div>
        <div v-else style="padding: 20px; border: 2px solid #333; text-align: center;">
          <p>Select a difficulty level to start the lockpicking minigame.</p>
          <p>Use SPACEBAR to attempt to pick the lock when pins are in the green zones.</p>
          <p>Current crew skill: {{ lockSkill }}/100</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  BrutalistPanel,
  BrutalistButton,
  BrutalistInput,
  BrutalistSelect,
  BrutalistTable,
  BrutalistProgress,
  BrutalistAlert,
  BrutalistForm,
  HoldToConfirm,
  StoryLog,
  CrewCard,
  TrainingPanel,
  MissionBoard,
  PixiCrewExample,
  CargoGrid,
  PixiLockpicking
} from '~/components/brutalist'

// Demo data
const inputValue = ref('')
const errorInput = ref('Invalid!')
const validInput = ref('Valid input')
const selectedOption = ref('')

const selectOptions = [
  { value: 'sol', label: 'Sol System' },
  { value: 'alpha', label: 'Alpha Centauri' },
  { value: 'vega', label: 'Vega Station' },
  { value: 'tau', label: 'Tau Ceti' }
]

const tableHeaders = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
  { key: 'level', label: 'Level', align: 'center' },
  { key: 'status', label: 'Status', highlight: true }
]

const tableData = [
  { name: 'Sarah Chen', role: 'Engineer', level: 5, status: 'ACTIVE' },
  { name: 'Marcus Torres', role: 'Pilot', level: 8, status: 'ACTIVE' },
  { name: 'Dr. Yuki Tanaka', role: 'Medic', level: 6, status: 'RESTING' }
]

const formData = ref({
  name: '',
  role: '',
  experience: ''
})

const roleOptions = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'medic', label: 'Medic' },
  { value: 'security', label: 'Security' }
]

const demoCrewMembers = [
  {
    id: 'abc12345',
    name: 'Sarah Chen',
    role: 'Engineer',
    level: 5,
    experience: 2450,
    morale: 85,
    stress: 20,
    health: 95,
    available: true,
    traits: ['EFFICIENT', 'TECH_SAVVY', 'NIGHT_OWL'],
    currentTask: 'Reactor Maintenance'
  },
  {
    id: 'def67890',
    name: 'Marcus Torres',
    role: 'Pilot',
    level: 8,
    experience: 5200,
    morale: 65,
    stress: 80,
    health: 70,
    available: true,
    traits: ['ACE_PILOT', 'RISK_TAKER', 'CHARISMATIC', 'LUCKY'],
    currentTask: null
  }
]

const demoTrainings = [
  {
    id: 't001',
    crewId: 'abc12345',
    crewName: 'Sarah Chen',
    skill: 'ADVANCED_PILOTING',
    progress: 65,
    eta: '2h 15m',
    paused: false
  }
]

const demoMissions = [
  {
    id: 'm001',
    type: 'CARGO',
    priority: 'high',
    title: 'URGENT MEDICAL SUPPLIES',
    client: 'Titan Colony Medical',
    reward: 15000,
    deadline: '48 HOURS',
    difficulty: 2,
    description: 'Transport critical medical supplies to Titan Colony. Time sensitive.',
    requirements: [
      { text: 'Cargo capacity: 50 tons', met: true },
      { text: 'Medical certification', met: false }
    ]
  },
  {
    id: 'm002',
    type: 'EXPLORATION',
    priority: 'medium',
    title: 'SURVEY ASTEROID FIELD',
    client: 'Mining Consortium',
    reward: 25000,
    deadline: '7 DAYS',
    difficulty: 3,
    description: 'Survey and map uncharted asteroid field in sector 7-G.',
    requirements: [
      { text: 'Long-range sensors', met: true },
      { text: 'Experienced navigator', met: true }
    ]
  }
]

const demoStoryEntries = [
  {
    type: 'system',
    text: '**SHIP AI ONLINE** - Docking sequence initiated. Welcome to Kepler Station, Captain. Hull integrity: 97%. Crew status: All hands accounted for.'
  },
  {
    type: 'dialogue',
    speaker: 'Station Controller',
    text: 'Unknown vessel... this is Kepler Station Control. Please state your business and prepare for **customs inspection**. We\'ve had... *incidents* lately. Pirates. Smugglers. Worse things.'
  },
  {
    type: 'action',
    text: 'The massive space station looms ahead, its rotating sections casting long shadows across your ship\'s viewport. Dozens of other vessels drift in designated holding patterns, waiting their turn. You notice several ships bear fresh scorch marks—remnants of recent conflicts in this sector. A destroyed cargo hauler drifts nearby, its hull split open like a broken egg.'
  },
  {
    type: 'dialogue',
    speaker: 'Navigator Chen',
    text: 'Captain... I\'m reading some unusual energy signatures from that wreckage. Those aren\'t normal weapon burns. This looks like... **plasma lance** damage. Military grade.'
  },
  {
    type: 'action',
    text: 'A chill runs down your spine. Plasma lances are restricted weapons, used only by Colonial Navy ships and... other things. Things that shouldn\'t exist in civilized space.'
  },
  {
    type: 'dialogue',
    speaker: 'Captain',
    text: 'This is the *Stellar Phoenix*, registry **SP-7741**. We\'re here for resupply and to pick up contracted crew members. Our paperwork should be in order... but I\'m curious about that wreckage.',
    choices: [
      { text: 'Ask about the destroyed ship and what happened', value: 'wreckage' },
      { text: 'Mention the urgent medical supplies you\'re carrying', value: 'medical' },
      { text: 'Inquire about expedited docking for a premium fee', value: 'premium' },
      { text: 'Keep quiet about your black market contacts', value: 'discrete' }
    ]
  }
]

// Enhanced story sequences for different moods
const createActionStorySequence = () => [
  {
    type: 'system',
    text: '**PROXIMITY ALERT** - Unidentified contacts detected. Battle stations! This is not a drill.'
  },
  {
    type: 'dialogue',
    speaker: 'Marcus Torres',
    text: 'Captain! Three ships just dropped out of hyperspace behind us. They\'re not responding to hails and their weapons are hot. **Hostile configuration confirmed.**'
  },
  {
    type: 'action',
    text: 'The bridge lights dim to combat red as klaxons wail throughout the ship. Your crew moves with practiced efficiency, hands flying over controls as they prepare for what might be your last fight. The enemy ships are sleek, predatory—definitely not merchants.'
  },
  {
    type: 'dialogue',
    speaker: 'Ship AI - ARIA',
    text: 'Scanning... **Match found.** These vessels are registered to the Crimson Syndicate. Wanted for piracy, murder, and trafficking in seventeen systems. Recommendation: **Immediate evasive action.**'
  },
  {
    type: 'action',
    text: 'Through the viewports, you can see the pirates\' ships closing in, their hull-mounted railguns already tracking your position. Your ship shudders as they lock targeting sensors onto your hull. Time slows to a crawl as you realize the next few seconds will determine whether you live or die.'
  },
  {
    type: 'dialogue',
    speaker: 'Captain',
    text: 'All hands, prepare for combat maneuvers. Sarah, I need maximum power to engines. Marcus, plot us a course through that asteroid field. We\'re going to make them work for this kill.',
    choices: [
      { text: 'Fight back with everything you\'ve got', value: 'fight' },
      { text: 'Attempt to outrun them through the asteroids', value: 'flee' },
      { text: 'Try to negotiate with the pirates', value: 'negotiate' },
      { text: 'Send a distress signal to Kepler Station', value: 'distress' }
    ]
  }
]

const createMysteryStorySequence = () => [
  {
    type: 'system',
    text: '**DEEP SPACE ANOMALY DETECTED** - Long-range sensors picking up something... unusual. Classification: Unknown.'
  },
  {
    type: 'action',
    text: 'The vast emptiness of space stretches before you, broken only by the distant gleam of stars. But there\'s something else out there—something that shouldn\'t exist. Your sensors are going haywire, displaying readings that make no scientific sense.'
  },
  {
    type: 'dialogue',
    speaker: 'Dr. Yuki Tanaka',
    text: 'Captain, these readings are... **impossible**. I\'m detecting massive gravitational distortions, but there\'s no visible mass. It\'s as if space itself is... *twisted* out there.'
  },
  {
    type: 'action',
    text: 'A low, thrumming vibration runs through the ship\'s hull—felt more than heard. The lights flicker momentarily, and several crew members report feeling dizzy. Whatever\'s out there, it\'s affecting your ship from over a million kilometers away.'
  },
  {
    type: 'dialogue',
    speaker: 'Ship AI - ARIA',
    text: 'Warning: I am detecting patterns in the anomaly that suggest... **artificial origin**. This is not a natural phenomenon. Recommendation: Maintain safe distance and observe.'
  },
  {
    type: 'action',
    text: 'But even as ARIA speaks, you feel an inexplicable pull—not physical, but mental. Something about the anomaly calls to you, whispers at the edges of your consciousness. Some of your crew are staring at the viewports with glassy eyes, as if hypnotized.'
  },
  {
    type: 'system',
    text: 'MULTIPLE CHOICE DECISION POINT: Your actions here will significantly impact your standing with both civilian and military authorities.'
  }
]

// Story state management
const currentStoryTitle = ref('Arrival at Kepler Station')
const currentStoryTimestamp = ref(new Date())
const currentStoryLocation = ref('Kepler Station - Approach Vector')
const currentStoryEntries = ref(demoStoryEntries)
const showStoryContinue = ref(true)

// Demo cargo data
const demoCargo = ref([])

// Lockpicking demo state
const showLockpicking = ref(false)
const lockDifficulty = ref('standard')
const lockSkill = ref(65) // Demo crew skill level

const availableCargoItems = [
  { id: 'c1', code: 'COMP_BASIC', name: 'Basic Computer Components', category: 'tech', weight: 0.5, volume: 0.3, quantity: 1 },
  { id: 'c2', code: 'FUEL_STD', name: 'Standard Fuel', category: 'consumable', weight: 1.0, volume: 1.0, quantity: 1 },
  { id: 'c3', code: 'FOOD_BASIC', name: 'Basic Food Supplies', category: 'consumable', weight: 1.0, volume: 1.2, quantity: 1 },
  { id: 'c4', code: 'GEMS_RARE', name: 'Rare Gemstones', category: 'luxury', weight: 0.1, volume: 0.1, quantity: 1 },
  { id: 'c5', code: 'BIO_SAMPLES', name: 'Biological Samples', category: 'green', weight: 0.2, volume: 0.3, quantity: 1 },
  { id: 'c6', code: 'WEAPON_SYS', name: 'Weapon System Components', category: 'tech', weight: 3.0, volume: 2.0, quantity: 1 },
  { id: 'c7', code: 'MEDICINE', name: 'Medical Supplies', category: 'consumable', weight: 0.3, volume: 0.5, quantity: 1 },
  { id: 'c8', code: 'ARTIFACTS', name: 'Ancient Artifacts', category: 'luxury', weight: 0.5, volume: 0.5, quantity: 1 },
  { id: 'c9', code: 'PLANTS_MED', name: 'Medicinal Plants', category: 'green', weight: 0.5, volume: 0.8, quantity: 1 },
  { id: 'c10', code: 'ENGINE_PARTS', name: 'Engine Components', category: 'tech', weight: 5.0, volume: 3.0, quantity: 1 }
]

// Story control functions
const loadBasicStory = () => {
  currentStoryTitle.value = 'Arrival at Kepler Station'
  currentStoryTimestamp.value = new Date()
  currentStoryLocation.value = 'Kepler Station - Docking Approach'
  currentStoryEntries.value = [...demoStoryEntries]
  showStoryContinue.value = true
}

const loadActionStory = () => {
  currentStoryTitle.value = 'Pirate Ambush'
  currentStoryTimestamp.value = new Date(Date.now() - 1800000) // 30 minutes ago
  currentStoryLocation.value = 'Kepler System - Asteroid Field'
  currentStoryEntries.value = createActionStorySequence()
  showStoryContinue.value = false
}

const loadMysteryStory = () => {
  currentStoryTitle.value = 'Deep Space Anomaly'
  currentStoryTimestamp.value = new Date(Date.now() - 7200000) // 2 hours ago
  currentStoryLocation.value = 'Unknown Coordinates - Deep Space'
  currentStoryEntries.value = createMysteryStorySequence()
  showStoryContinue.value = false
}

// Event handlers
const handleClick = () => console.log('Button clicked')
const handleRowSelect = (row) => console.log('Row selected:', row)
const handleFormSubmit = () => console.log('Form submitted:', formData.value)
const handleCrewSelect = (id) => console.log('Crew selected:', id)
const handleCrewAssign = (id) => console.log('Crew assign:', id)
const handleCrewDetails = (id) => console.log('Crew details:', id)
const handleStartTraining = (data) => console.log('Start training:', data)
const handlePauseTraining = (id) => console.log('Pause training:', id)
const handleCancelTraining = (id) => console.log('Cancel training:', id)
const handleViewMission = (id) => console.log('View mission:', id)
const handleAcceptMission = (id) => console.log('Accept mission:', id)
const handleRefreshMissions = () => console.log('Refresh missions')
const handleDangerousAction = () => console.log('Dangerous action confirmed!')
const handleMissionAccept = () => console.log('Mission accepted via hold-to-confirm!')
const handleStoryChoice = (choice) => {
  console.log('Story choice:', choice)

  // Add a response based on the choice made
  const responseEntry = {
    type: 'system',
    text: `**CHOICE SELECTED:** ${choice.text} - Processing consequences...`
  }

  // Create a new array with the response added
  currentStoryEntries.value = [...currentStoryEntries.value, responseEntry]

  // Example of branching narrative based on choice
  setTimeout(() => {
    let narrativeResponse

    switch (choice.value) {
      case 'urgent':
        narrativeResponse = {
          type: 'dialogue',
          speaker: 'Station Controller',
          text: 'Medical cargo? **Priority docking granted.** Proceed to Medical Bay 3. We\'ll have a med-team standing by.'
        }
        break
      case 'incidents':
        narrativeResponse = {
          type: 'dialogue',
          speaker: 'Station Controller',
          text: '*Static crackles over the comm.* That\'s... classified information, Captain. Please state your business and maintain current position.'
        }
        break
      case 'premium':
        narrativeResponse = {
          type: 'dialogue',
          speaker: 'Station Controller',
          text: 'Expedited docking is available for an additional **5,000 credits**. Dock 15 is available immediately if you\'re willing to pay.'
        }
        break
      default:
        narrativeResponse = {
          type: 'action',
          text: 'Your silence seems to make the station controller nervous. After a long pause, you hear them shuffling through paperwork.'
        }
    }

    currentStoryEntries.value = [...currentStoryEntries.value, narrativeResponse]
  }, 2000)
}

const handleStoryContinue = () => {
  console.log('Story continue clicked')

  // Add a continuation to the story
  const continueEntry = {
    type: 'action',
    text: 'Your ship moves forward through the void, ready for whatever challenges await at Kepler Station. The story continues...'
  }

  currentStoryEntries.value = [...currentStoryEntries.value, continueEntry]
  showStoryContinue.value = false
}

// Lockpicking event handlers
const setLockDifficulty = (difficulty) => {
  lockDifficulty.value = difficulty
  showLockpicking.value = true
}

const handleLockpickComplete = (result) => {
  console.log('Lockpick complete:', result)
  showLockpicking.value = false
  
  // Simple feedback
  if (result.success) {
    alert('SUCCESS: Lock picked successfully!')
  } else {
    alert('FAILURE: Lock picking failed. Try again.')
  }
}

// Cargo control functions
const loadDemoCargo = () => {
  demoCargo.value = [
    { ...availableCargoItems[0], quantity: 5 },
    { ...availableCargoItems[1], quantity: 10 },
    { ...availableCargoItems[2], quantity: 8 },
    { ...availableCargoItems[3], quantity: 2 },
    { ...availableCargoItems[4], quantity: 3 },
    { ...availableCargoItems[6], quantity: 4 }
  ]
}

const clearCargo = () => {
  demoCargo.value = []
}

const randomizeCargo = () => {
  const randomCount = Math.floor(Math.random() * 8) + 3
  const shuffled = [...availableCargoItems].sort(() => 0.5 - Math.random())
  demoCargo.value = shuffled.slice(0, randomCount).map(item => ({
    ...item,
    quantity: Math.floor(Math.random() * 15) + 1
  }))
}
</script>

<style scoped>
.brutalist-demo {
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
}

.demo-title {
  font-size: 24px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #00ff00;
}

.demo-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 16px;
  color: #00ffff;
}

.button-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.component-demo {
  margin-bottom: 32px;
}

.component-demo h3 {
  color: #ffff00;
  margin-bottom: 16px;
}

.crew-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

/* Global demo styles */
.demo-section>* {
  margin-bottom: 12px;
}
</style>