# Spacepunk Lockpicking Component Implementation

## Overview
Successfully implemented a simple geometric lockpicking visualization component for Spacepunk that follows the game's brutalist aesthetic and "Putt Putt hacker" philosophy.

## Key Features

### Visual Design
- **Simple geometric shapes**: Rectangles for lock body, pins, and target zones
- **ASCII-style decorations**: Corner brackets for brutalist aesthetic
- **Pixelated rendering**: No anti-aliasing for blocky, corporate look
- **Monospace typography**: Status display uses system monospace fonts
- **Minimal color palette**: Gray lock, green targets, white pick pointer

### Game Mechanics
- **Progressive difficulty**: 3-6 pins with varying target sizes and speeds
- **Crew skill integration**: Higher engineering skill = slower pin movement
- **Failure punishment**: Missing target resets all progress
- **Sequential picking**: Must pick pins in order, one at a time
- **Visual feedback**: Pins turn green when approaching target zone

### Technical Implementation
- **Extends PixiMinigameBase**: Reuses existing minigame infrastructure
- **PixiJS Graphics**: Simple geometric shapes, no sprites or textures
- **Sine wave animation**: Smooth pin oscillation using Math.sin()
- **Event-driven**: Spacebar input handling with proper cleanup
- **Reactive state**: Vue 3 composition API with refs and computed properties

## Files Modified

### `/components/brutalist/PixiLockpicking.vue`
- **Complete rewrite** of existing lockpicking component
- Replaced circular rotating rings with rectangular pin-tumbler lock
- Added geometric ASCII-style lock body with corner decorations
- Implemented sequential pin picking with visual feedback
- Added difficulty scaling and crew skill integration

### `/components/brutalist/index.js`
- **Added exports** for PixiMinigameBase and PixiLockpicking components
- Ensures proper component registration for application use

### `/pages/brutalist-demo.vue`
- **Added demo section** for lockpicking minigame
- Implemented difficulty selection buttons
- Added state management for lockpicking demo
- Created event handlers for component interaction

## Difficulty Levels

| Level | Pins | Zone Size | Speed | Timeout |
|-------|------|-----------|-------|---------|
| Routine | 3 | 40px | 0.015 | 45s |
| Standard | 4 | 30px | 0.020 | 30s |
| Challenging | 5 | 20px | 0.025 | 25s |
| Dangerous | 6 | 15px | 0.030 | 20s |

## Crew Skill Integration

The lockpicking component integrates with the existing crew skill system:

- **Base skill**: Engineering (required 40+ for lockpicking training)
- **Skill effect**: `speed * (1 - (crewSkill/100 * 0.4))`
- **Example**: 65 skill = 26% speed reduction = easier timing
- **Training path**: "Physical Security Assessment" → Advanced hacker abilities

## Game Integration

The component fits seamlessly into Spacepunk's existing systems:

- **Training system**: Unlocked via "lockpicking_fundamentals" training
- **Corporate flavor**: "HR requires signed waiver acknowledging assessment skills may violate station regulations"
- **Brutalist UI**: Matches game's "terrible enterprise software" aesthetic
- **Progressive complexity**: Difficulty scales with game progression

## Usage

### Basic Implementation
```vue
<template>
  <PixiLockpicking 
    difficulty="standard" 
    :crew-skill="65" 
    :time-limit="30"
    @complete="handleResult"
  />
</template>
```

### Event Handling
```javascript
const handleResult = (result) => {
  if (result.success) {
    // Award XP, unlock content, etc.
  } else {
    // Handle failure, apply penalties
  }
}
```

## Testing

The component can be tested at:
- **Demo page**: `http://localhost:3667/brutalist-demo`
- **Section**: "LOCKPICKING MINIGAME"
- **Controls**: Spacebar to pick, difficulty buttons to change settings

## Future Enhancements

Potential improvements for future iterations:
- **Sound effects**: Subtle audio feedback for picks and failures
- **Animation polish**: Pin "spring" effects when locked in place
- **Advanced mechanics**: Pin stacking, security pins, tension wrench simulation
- **Visual glitches**: Occasional "computer personality decay" effects
- **Statistics tracking**: Success rates, time records, crew performance metrics

## Technical Notes

- **Performance**: Lightweight rendering with minimal objects
- **Accessibility**: Clear visual feedback and simple controls
- **Compatibility**: Works with existing PixiJS 8.11.0 installation
- **Maintainability**: Clean separation of concerns, well-documented code
- **Extensibility**: Easy to add new difficulty levels and mechanics

The implementation successfully captures the essence of "Putt Putt hacker" gameplay while maintaining Spacepunk's distinctive brutalist aesthetic and corporate cynicism.