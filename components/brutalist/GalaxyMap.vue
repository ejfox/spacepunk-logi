<template>
  <div class="galaxy-map-container">
    <PixiCanvas
      ref="pixiCanvas"
      :width="800"
      :height="600"
      title="GALAXY_MAP_DISPLAY"
      backgroundColor="#000000"
      :showDebug="true"
      @app-ready="onAppReady"
      @tick="onTick"
    />
    
    <!-- Galaxy Map Controls -->
    <div class="galaxy-controls">
      <div class="control-row">
        <span class="control-label">GALAXY:</span>
        <select v-model="selectedGalaxy" @change="filterStations" class="galaxy-select">
          <option value="">ALL_GALAXIES</option>
          <option v-for="galaxy in galaxies" :key="galaxy" :value="galaxy">
            {{ galaxy }}
          </option>
        </select>
      </div>
      
      <div class="control-row">
        <span class="control-label">STATIONS:</span>
        <span class="station-count">{{ filteredStations.length }}</span>
      </div>
      
      <div class="control-row">
        <span class="control-label">ZOOM:</span>
        <button @click="zoomIn" class="zoom-btn">+</button>
        <button @click="zoomOut" class="zoom-btn">-</button>
        <button @click="resetZoom" class="zoom-btn">RESET</button>
      </div>
    </div>
    
    <!-- Station Info Panel -->
    <div v-if="selectedStation" class="station-info">
      <div class="info-header">
        <span class="header-marker">></span>
        <span class="station-name">{{ selectedStation.name }}</span>
        <button @click="selectedStation = null" class="close-btn">X</button>
      </div>
      
      <div class="info-content">
        <div class="info-row">
          <span class="info-label">GALAXY:</span>
          <span class="info-value">{{ selectedStation.galaxy }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">SECTOR:</span>
          <span class="info-value">{{ selectedStation.sector || 'UNKNOWN' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">TYPE:</span>
          <span class="info-value">{{ selectedStation.station_type }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">FACTION:</span>
          <span class="info-value">{{ selectedStation.faction || 'UNALIGNED' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">POPULATION:</span>
          <span class="info-value">{{ selectedStation.population?.toLocaleString() || 0 }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">SECURITY:</span>
          <span class="info-value">{{ selectedStation.security_level }}/100</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import * as PIXI from 'pixi.js'
import PixiCanvas from './PixiCanvas.vue'

const pixiCanvas = ref(null)
const app = ref(null)
const stations = ref([])
const selectedGalaxy = ref('')
const selectedStation = ref(null)
const zoomLevel = ref(1)

// Galaxy layout constants
const GALAXY_SPACING = 300
const SECTOR_SPACING = 150
const STATION_SIZE = 6
const CONNECTION_ALPHA = 0.3

// Container for all map elements
let mapContainer = null
let stationSprites = []
let connectionLines = []
let labels = []

// Computed properties
const galaxies = computed(() => {
  const uniqueGalaxies = [...new Set(stations.value.map(s => s.galaxy))]
  return uniqueGalaxies.sort()
})

const filteredStations = computed(() => {
  if (!selectedGalaxy.value) return stations.value
  return stations.value.filter(s => s.galaxy === selectedGalaxy.value)
})

// Fetch stations from API
async function fetchStations() {
  try {
    console.log('Fetching stations from API...')
    const response = await fetch('http://localhost:3666/api/stations')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    stations.value = data.stations || []
    console.log('Loaded stations:', stations.value.length)
    
    // Auto-draw map once stations are loaded
    if (app.value) {
      drawMap()
    }
  } catch (error) {
    console.error('Error fetching stations:', error)
    // Set some fallback stations for testing
    stations.value = [
      { name: 'Test Station Alpha', galaxy: 'Test System', sector: 'Inner', station_type: 'civilian', faction: 'Federation', population: 10000, security_level: 50 },
      { name: 'Test Station Beta', galaxy: 'Test System', sector: 'Outer', station_type: 'trade', faction: 'Guild', population: 5000, security_level: 60 }
    ]
    console.log('Using fallback stations for testing')
    if (app.value) {
      drawMap()
    }
  }
}

// PixiJS app ready handler
function onAppReady(pixiApp) {
  app.value = pixiApp
  initializeMap()
}

// Initialize the map
function initializeMap() {
  if (!app.value) return
  
  // Create main container
  mapContainer = new PIXI.Container()
  app.value.stage.addChild(mapContainer)
  
  // Enable interactive mode
  app.value.stage.interactive = true
  app.value.stage.on('pointerdown', onMapClick)
  
  drawMap()
}

// Draw the complete galaxy map
function drawMap() {
  if (!mapContainer || !filteredStations.value.length) return
  
  // Clear existing elements
  clearMap()
  
  // Group stations by galaxy and sector
  const galaxyGroups = groupStationsByGalaxy(filteredStations.value)
  
  // Draw each galaxy
  let galaxyIndex = 0
  for (const [galaxyName, sectors] of Object.entries(galaxyGroups)) {
    drawGalaxy(galaxyName, sectors, galaxyIndex)
    galaxyIndex++
  }
  
  // Center the map
  centerMap()
}

// Group stations by galaxy and sector
function groupStationsByGalaxy(stationList) {
  const groups = {}
  
  for (const station of stationList) {
    const galaxy = station.galaxy
    const sector = station.sector || 'UNKNOWN'
    
    if (!groups[galaxy]) groups[galaxy] = {}
    if (!groups[galaxy][sector]) groups[galaxy][sector] = []
    
    groups[galaxy][sector].push(station)
  }
  
  return groups
}

// Draw a single galaxy
function drawGalaxy(galaxyName, sectors, galaxyIndex) {
  const galaxyX = galaxyIndex * GALAXY_SPACING
  const galaxyY = 0
  
  // Draw galaxy label
  const galaxyLabel = createLabel(galaxyName, galaxyX, galaxyY - 40, 16, '#00ff00')
  mapContainer.addChild(galaxyLabel)
  labels.push(galaxyLabel)
  
  // Draw sectors within galaxy
  let sectorIndex = 0
  for (const [sectorName, stationList] of Object.entries(sectors)) {
    drawSector(sectorName, stationList, galaxyX, galaxyY, sectorIndex)
    sectorIndex++
  }
}

// Draw a single sector
function drawSector(sectorName, stationList, galaxyX, galaxyY, sectorIndex) {
  const sectorX = galaxyX + (sectorIndex % 2) * SECTOR_SPACING
  const sectorY = galaxyY + Math.floor(sectorIndex / 2) * SECTOR_SPACING
  
  // Draw sector label
  const sectorLabel = createLabel(sectorName, sectorX, sectorY - 20, 12, '#ffff00')
  mapContainer.addChild(sectorLabel)
  labels.push(sectorLabel)
  
  // Draw stations in sector
  stationList.forEach((station, index) => {
    const angle = (index / stationList.length) * Math.PI * 2
    const radius = 50
    const stationX = sectorX + Math.cos(angle) * radius
    const stationY = sectorY + Math.sin(angle) * radius
    
    drawStation(station, stationX, stationY)
  })
  
  // Draw connections between stations in sector
  drawSectorConnections(stationList, sectorX, sectorY)
}

// Draw a single station
function drawStation(station, x, y) {
  // Create station sprite (simple circle)
  const stationSprite = new PIXI.Graphics()
  
  // Color based on station type
  const color = getStationColor(station.station_type)
  stationSprite.beginFill(color)
  stationSprite.drawCircle(0, 0, STATION_SIZE)
  stationSprite.endFill()
  
  // Position station
  stationSprite.x = x
  stationSprite.y = y
  
  // Make interactive
  stationSprite.interactive = true
  stationSprite.buttonMode = true
  stationSprite.on('pointerdown', () => onStationClick(station))
  
  // Add to container
  mapContainer.addChild(stationSprite)
  stationSprites.push(stationSprite)
  
  // Add station label
  const stationLabel = createLabel(station.name, x, y + 15, 8, '#ffffff')
  mapContainer.addChild(stationLabel)
  labels.push(stationLabel)
}

// Draw connections between stations in a sector
function drawSectorConnections(stationList, sectorX, sectorY) {
  if (stationList.length < 2) return
  
  for (let i = 0; i < stationList.length; i++) {
    const station1 = stationList[i]
    const station2 = stationList[(i + 1) % stationList.length]
    
    const angle1 = (i / stationList.length) * Math.PI * 2
    const angle2 = ((i + 1) / stationList.length) * Math.PI * 2
    const radius = 50
    
    const x1 = sectorX + Math.cos(angle1) * radius
    const y1 = sectorY + Math.sin(angle1) * radius
    const x2 = sectorX + Math.cos(angle2) * radius
    const y2 = sectorY + Math.sin(angle2) * radius
    
    const line = new PIXI.Graphics()
    line.lineStyle(1, 0x666666, CONNECTION_ALPHA)
    line.moveTo(x1, y1)
    line.lineTo(x2, y2)
    
    mapContainer.addChild(line)
    connectionLines.push(line)
  }
}

// Create ASCII-style text label
function createLabel(text, x, y, fontSize = 10, color = '#ffffff') {
  const label = new PIXI.Text(text, {
    fontFamily: 'Courier New',
    fontSize: fontSize,
    fill: color,
    align: 'center'
  })
  
  label.x = x - label.width / 2
  label.y = y
  label.resolution = 1 // Pixelated text
  
  return label
}

// Get color based on station type
function getStationColor(stationType) {
  const colors = {
    'civilian': 0x00ff00,
    'military': 0xff0000,
    'commercial': 0x00ffff,
    'industrial': 0xffff00,
    'research': 0xff00ff,
    'mining': 0xffa500,
    'trade': 0x00ff00,
    'default': 0xffffff
  }
  
  return colors[stationType] || colors.default
}

// Clear all map elements
function clearMap() {
  stationSprites.forEach(sprite => mapContainer.removeChild(sprite))
  connectionLines.forEach(line => mapContainer.removeChild(line))
  labels.forEach(label => mapContainer.removeChild(label))
  
  stationSprites = []
  connectionLines = []
  labels = []
}

// Center the map in the canvas
function centerMap() {
  if (!mapContainer || !app.value) return
  
  const bounds = mapContainer.getBounds()
  const centerX = app.value.screen.width / 2 - bounds.width / 2
  const centerY = app.value.screen.height / 2 - bounds.height / 2
  
  mapContainer.x = centerX
  mapContainer.y = centerY
}

// Event handlers
function onMapClick(event) {
  // Deselect station if clicking on empty space
  selectedStation.value = null
}

function onStationClick(station) {
  selectedStation.value = station
  console.log('Selected station:', station.name)
}

function onTick(pixiApp) {
  // Animation updates can go here
}

// Filter stations when galaxy selection changes
function filterStations() {
  drawMap()
}

// Zoom controls
function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
  updateZoom()
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5)
  updateZoom()
}

function resetZoom() {
  zoomLevel.value = 1
  updateZoom()
  centerMap()
}

function updateZoom() {
  if (!mapContainer) return
  mapContainer.scale.set(zoomLevel.value, zoomLevel.value)
}

// Watch for station changes
watch(stations, () => {
  if (app.value) {
    drawMap()
  }
}, { deep: true })

// Initialize component
onMounted(() => {
  fetchStations()
})
</script>

<style scoped>
.galaxy-map-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #000000;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.galaxy-controls {
  background: #111111;
  border: 2px solid #ffffff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-weight: bold;
  min-width: 80px;
  color: #00ff00;
}

.galaxy-select {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 4px 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.galaxy-select:focus {
  outline: 2px solid #00ff00;
}

.station-count {
  color: #ffff00;
  font-weight: bold;
}

.zoom-btn {
  background: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 4px 8px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  min-width: 40px;
}

.zoom-btn:hover {
  background: #ffffff;
  color: #000000;
}

.zoom-btn:active {
  background: #00ff00;
  color: #000000;
}

.station-info {
  background: #111111;
  border: 2px solid #ffffff;
  position: absolute;
  top: 20px;
  right: 20px;
  min-width: 280px;
  z-index: 10;
}

.info-header {
  background: #000000;
  border-bottom: 2px solid #ffffff;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-marker {
  color: #00ff00;
  font-weight: bold;
}

.station-name {
  flex: 1;
  font-weight: bold;
  color: #ffffff;
}

.close-btn {
  background: #ff0000;
  border: none;
  color: #ffffff;
  padding: 2px 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.close-btn:hover {
  background: #ffffff;
  color: #ff0000;
}

.info-content {
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #333333;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: bold;
  color: #00ff00;
  font-size: 12px;
}

.info-value {
  color: #ffffff;
  font-size: 12px;
  text-align: right;
}
</style>