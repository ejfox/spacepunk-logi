# Galaxy Map Component

## Overview

The `GalaxyMap.vue` component provides a brutalist-style galaxy map visualization for the Spacepunk Logistics simulation. It displays connected stations as simple geometric shapes with ASCII-style labels, fitting the game's terminal aesthetic.

## Features

- **Station Visualization**: Shows stations as colored circles based on their type
- **Galaxy Organization**: Groups stations by galaxy and sector
- **Interactive Elements**: Click stations to view detailed information
- **Filtering**: Filter stations by galaxy
- **Zoom Controls**: Zoom in/out and reset view
- **Brutalist Design**: Terminal-style interface with ASCII labels

## Usage

### Basic Usage
```vue
<template>
  <GalaxyMap />
</template>

<script setup>
import GalaxyMap from '~/components/brutalist/GalaxyMap.vue'
</script>
```

### Accessing the Component
Visit `/galaxy-map` in your browser to see the galaxy map in action.

## Data Structure

The component expects station data in the following format:
```javascript
{
  name: "Station Name",
  galaxy: "Galaxy Name",
  sector: "Sector Name",
  station_type: "civilian|trade|military|industrial|research|mining",
  faction: "Faction Name",
  population: 50000,
  security_level: 75
}
```

## Station Types and Colors

- **civilian**: Green (0x00ff00)
- **military**: Red (0xff0000)
- **commercial**: Cyan (0x00ffff)
- **industrial**: Yellow (0xffff00)
- **research**: Magenta (0xff00ff)
- **mining**: Orange (0xffa500)
- **trade**: Green (0x00ff00)
- **default**: White (0xffffff)

## Controls

- **Galaxy Filter**: Select a specific galaxy to view or "ALL_GALAXIES" to show all
- **Zoom In/Out**: Use + and - buttons to zoom
- **Reset**: Return to default zoom and center position
- **Station Selection**: Click on any station to view detailed information

## Technical Details

- Built with PixiJS for hardware-accelerated rendering
- Uses the `PixiCanvas.vue` base component
- Stations are positioned in circular patterns within sectors
- Connection lines show relationships between stations in the same sector
- Real-time updates when station data changes

## API Integration

The component fetches station data from `/api/stations` endpoint. If the API is unavailable, it falls back to test data for development purposes.

## Styling

The component uses brutalist CSS styling with:
- Monospace fonts (Courier New)
- Black background with white borders
- Terminal-style green text for labels
- No anti-aliasing for pixelated appearance

## Development Notes

- The component automatically handles different screen sizes
- Station positions are calculated dynamically based on galaxy/sector groupings
- Debug information is available through the PixiCanvas component
- All text rendering uses bitmap fonts for consistency