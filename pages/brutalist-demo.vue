<template>
  <div class="brutalist-demo">
    <h1 class="demo-title">> SPACEPUNK UI COMPONENT LIBRARY</h1>
    
    <!-- Panel Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST PANEL</h2>
      <BrutalistPanel
        title="SYSTEM STATUS"
        subtitle="ONLINE"
        footer="Last updated: 15:42:33"
      >
        <p>This is a basic panel component with title, subtitle, and footer.</p>
      </BrutalistPanel>
      
      <BrutalistPanel
        title="ERROR PANEL"
        :error="true"
      >
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
      <BrutalistInput
        v-model="inputValue"
        label="CREW NAME"
        placeholder="Enter crew member name"
      />
      <BrutalistInput
        v-model="errorInput"
        label="VALIDATION ERROR"
        :error="true"
        error-message="Invalid input format"
      />
      <BrutalistInput
        v-model="validInput"
        label="VALID INPUT"
        :valid="true"
        hint="Name must be 3-20 characters"
      />
    </section>

    <!-- Select Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST SELECT</h2>
      <BrutalistSelect
        v-model="selectedOption"
        label="SELECT DESTINATION"
        :options="selectOptions"
        placeholder="-- Choose destination --"
      />
    </section>

    <!-- Table Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST TABLE</h2>
      <BrutalistTable
        title="CREW ROSTER"
        :headers="tableHeaders"
        :data="tableData"
        :selectable="true"
        @select="handleRowSelect"
      />
    </section>

    <!-- Progress Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST PROGRESS</h2>
      <BrutalistProgress
        :value="25"
        label="REACTOR CHARGE"
        status="CHARGING..."
      />
      <BrutalistProgress
        :value="75"
        label="HULL INTEGRITY"
        variant="warning"
      />
      <BrutalistProgress
        :value="100"
        label="TRAINING COMPLETE"
        variant="success"
      />
    </section>

    <!-- Alert Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST ALERT</h2>
      <BrutalistAlert
        type="info"
        message="System update available. Version 2.4.1 ready for installation."
      />
      <BrutalistAlert
        type="warning"
        message="Low fuel warning. Current reserves at 23%."
      />
      <BrutalistAlert
        type="error"
        message="CRITICAL: Reactor temperature exceeding safe parameters!"
        :dismissible="false"
      />
    </section>

    <!-- Form Demo -->
    <section class="demo-section">
      <h2 class="section-title">BRUTALIST FORM</h2>
      <BrutalistForm
        title="NEW CREW REGISTRATION"
        form-id="NCR-001"
        @submit="handleFormSubmit"
      >
        <BrutalistInput
          v-model="formData.name"
          label="FULL NAME"
          placeholder="Enter crew member name"
        />
        <BrutalistSelect
          v-model="formData.role"
          label="ASSIGNED ROLE"
          :options="roleOptions"
        />
        <BrutalistInput
          v-model="formData.experience"
          label="YEARS EXPERIENCE"
          type="number"
        />
      </BrutalistForm>
    </section>

    <!-- Game Components Demo -->
    <section class="demo-section">
      <h2 class="section-title">GAME-SPECIFIC COMPONENTS</h2>
      
      <div class="component-demo">
        <h3>CREW CARD</h3>
        <div class="crew-grid">
          <CrewCard
            v-for="crew in demoCrewMembers"
            :key="crew.id"
            :crew-member="crew"
            @select="handleCrewSelect"
            @assign="handleCrewAssign"
            @details="handleCrewDetails"
          />
        </div>
      </div>

      <div class="component-demo">
        <h3>TRAINING PANEL</h3>
        <TrainingPanel
          :crew="demoCrewMembers"
          :active-trainings="demoTrainings"
          @start="handleStartTraining"
          @pause="handlePauseTraining"
          @cancel="handleCancelTraining"
        />
      </div>

      <div class="component-demo">
        <h3>MISSION BOARD</h3>
        <MissionBoard
          :missions="demoMissions"
          @view="handleViewMission"
          @accept="handleAcceptMission"
          @refresh="handleRefreshMissions"
        />
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
  CrewCard,
  TrainingPanel,
  MissionBoard
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
.demo-section > * {
  margin-bottom: 12px;
}
</style>