# Spacepunk Spying Visualization Component

## Overview
Enhanced the existing `PixiSpying.vue` component with advanced terminal-style visualization features for the Spacepunk logistics simulation game.

## Features Implemented

### 🎯 Moving Dots Across Scan Lines
- **Multi-dot scanning system**: Each scan line has 3 moving dots that travel sinusoidally across the screen
- **Pulsing alpha animation**: Dots fade in and out for a dynamic scanning effect
- **Variable speeds**: Each dot moves at different speeds for realistic scanning behavior

### 🖥️ Terminal-Style Interface
- **ASCII art header**: Custom terminal-style header with surveillance classification
- **Brutalist design**: Zero-CSS brutalism with raw HTML aesthetics
- **Terminal status display**: Real-time detection levels and information gathering progress
- **Monospace typography**: Consistent terminal font throughout

### 📐 Simple Geometric Shapes
- **Four target types**: Circle, square, triangle, diamond
- **Shape-specific animations**: 
  - Circles: Pulsing scale animation
  - Squares: Rotation animation
  - Triangles: Alpha fading animation
  - Diamonds: Oscillation animation
- **Clean geometric rendering**: No textures, just pure geometric shapes

### 🎨 ASCII Art Visual Elements
- **Terminal border**: Clean ASCII-style border around the game area
- **Grid pattern**: Subtle grid overlay for terminal aesthetic
- **Scan line patterns**: Three different line patterns (solid, dashed, dotted)
- **Terminal glow effects**: CSS animations for authentic terminal feel

### 🎮 Basic Detection Mechanics
- **Crew skill integration**: Higher skills reduce detection risk
- **Target-specific risk**: Each target has unique detection risk values
- **Difficulty scaling**: Easy/standard/hard modes affect detection rates
- **Real-time feedback**: Visual indicators for detection levels and progress

## Technical Implementation

### Component Structure
```
PixiSpying.vue
├── ASCII Header with terminal styling
├── PixiMinigameBase (core minigame framework)
├── Terminal Status Display
│   ├── Detection bar with gradient fill
│   ├── Information gathering progress
│   └── Crew skill display
└── Responsive design with mobile support
```

### Key Functions
- `initSpying()`: Sets up the terminal grid, scan lines, moving dots, and targets
- `updateSpying()`: Handles animations, collision detection, and game logic
- `onSuccess()`/`onFailure()`: Emit completion events with detailed results

### Visual Elements
- **Scan Lines**: 4 horizontal lines with different patterns and directions
- **Moving Dots**: 12 total dots (3 per scan line) with sinusoidal movement
- **Target Shapes**: 6-10 randomly placed geometric targets
- **Detection Bars**: Gradient progress bars with stripe patterns
- **Grid Overlay**: Terminal-style grid pattern for authenticity

## Usage

### Basic Implementation
```vue
<PixiSpying
  :difficulty="'standard'"
  :crew-skill="50"
  :time-limit="45"
  @complete="onSpyingComplete"
/>
```

### Props
- `difficulty`: 'easy' | 'standard' | 'hard'
- `crewSkill`: Number (0-100) - affects detection rates
- `timeLimit`: Number (seconds) - mission time limit

### Events
- `complete`: Emitted when mission ends with result object:
  ```javascript
  {
    success: boolean,
    skill: 'spying',
    dataGathered: number,
    detectionLevel: number,
    stealthRating: number
  }
  ```

## Testing

### Test Page Available
- **File**: `pages/test-spying.vue`
- **URL**: `/test-spying` (when running Nuxt dev server)
- **Features**: Interactive controls for difficulty, crew skill, and time limit

### Test Controls
- Difficulty selector (easy/standard/hard)
- Crew skill slider (0-100)
- Time limit input (10-120 seconds)
- Real-time results display

## Files Modified/Created

### Modified
- `/components/brutalist/PixiSpying.vue` - Enhanced with new visualization features

### Created
- `/pages/test-spying.vue` - Interactive test page
- `/test-spying.html` - Standalone demo page
- `/SPYING_COMPONENT_README.md` - This documentation

## Integration with Game Systems

### Crew Skills
- Higher `crewSkill` values reduce detection risk
- Skills affect both detection rate and target scanning efficiency
- Skilled crew members can gather more information with less risk

### Mission Difficulty
- **Easy**: 0.7x detection multiplier
- **Standard**: 1.0x detection multiplier  
- **Hard**: 1.5x detection multiplier

### Brutalist Aesthetic
- Consistent with game's "terrible enterprise software" theme
- No fancy graphics - pure geometric shapes and terminal styling
- Progressive information revelation through UI complexity

## Next Steps

1. **Crew Integration**: Connect with actual crew member data
2. **Sound Effects**: Add terminal beeps and scanning sounds
3. **Faction Bonuses**: Implement faction-specific scanning bonuses
4. **Mission Variety**: Add different surveillance scenarios
5. **Performance Optimization**: Optimize for mobile devices