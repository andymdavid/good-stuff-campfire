# The Good Stuff Campfire - Technical Specification

## Core Architecture

This document outlines the technical implementation details for integrating a campfire scene into the existing Three.js ocean simulation.

### File Structure

```
The-Good-Stuff-Campfire/
├── images/
│   ├── [existing textures]
│   ├── fire.png            # Fire texture
│   ├── characters/         # Character textures
│   └── beach/              # Beach-related textures
├── materials/
│   ├── [existing materials]
│   ├── CampfireMaterial.js # Fire and ember materials
│   └── CharacterMaterial.js # Character materials
├── scene/
│   ├── [existing scene modules]
│   ├── Beach.js            # Beach terrain implementation
│   ├── Campfire.js         # Campfire implementation
│   ├── Characters.js       # Character models and animations
│   └── Props.js            # Additional props (trees, rocks, etc.)
├── scripts/
│   ├── [existing scripts]
│   └── Animation.js        # Enhanced animation utilities
├── shaders/
│   ├── [existing shaders]
│   └── FireShader.js       # Optional fire shader for better effects
├── index.html              # Main HTML file
├── script.js               # Main entry point (modify to include new modules)
└── style.css               # CSS styling
```

## Implementation Details

### Beach Implementation (scene/Beach.js)

```javascript
// Key functions:
// - createBeach() - Creates beach terrain with appropriate geometry and material
// - positionBeach() - Positions beach relative to ocean
// - addBeachDetails() - Adds small details like height variations
```

The beach will use a modified version of the existing SeaFloor.js implementation with:
- Higher elevation
- Sandy texture
- Subtle height variations
- Proper transition to ocean

### Campfire Implementation (scene/Campfire.js)

```javascript
// Key functions:
// - createCampfire() - Builds the campfire with logs, stones, and flames
// - animateFire() - Handles fire animation with vertex displacement and color changes
// - updateFireLight() - Adjusts fire light intensity and color based on time of day
```

The campfire will consist of:
- Arranged cylinder geometries for logs
- Stone ring using simple geometries
- Flame using either:
  - Simple cone geometry with animated vertex displacement
  - Particle system for more realistic effect
- PointLight for illumination with dynamic intensity

### Character Implementation (scene/Characters.js)

```javascript
// Key functions:
// - createCharacters() - Builds both characters with distinct appearances
// - createCharacter(options) - Creates individual character with specified properties
// - animateCharacters() - Handles all character animations
// - roastMarshmallow() - Special animation for marshmallow roasting
// - pokeFire() - Special animation for fire poking
```

Characters will be constructed using:
- Simple geometries (spheres, cylinders, boxes)
- Grouped in a hierarchical structure for animation
- Rigged for simple animations (no complex skeletons needed)
- Positioned in a seated pose around the campfire

### Props Implementation (scene/Props.js)

```javascript
// Key functions:
// - createPalmTrees() - Creates and positions palm trees
// - createBeachProps() - Adds small beach details (rocks, shells, driftwood)
// - createMarshmallowStick() - Creates stick with marshmallow
// - createPokeStick() - Creates stick for poking fire
```

Props will enhance the scene with:
- Palm trees using simple trunk and leaf geometries
- Scattered rocks using low-poly geometries
- Seashells and driftwood as small details
- Sticks for character interactions

## Integration Points

### 1. Main Script Integration

In script.js, add initialization for new components:

```javascript
import * as BEACH from "./scene/Beach.js";
import * as CAMPFIRE from "./scene/Campfire.js";
import * as CHARACTERS from "./scene/Characters.js";
import * as PROPS from "./scene/Props.js";

// After existing initializations:
BEACH.Start();
CAMPFIRE.Start();
CHARACTERS.Start();
PROPS.Start();

// In UpdateFrame function, add:
BEACH.Update();
CAMPFIRE.Update();
CHARACTERS.Update();
PROPS.Update();
```

### 2. Camera Positioning

Configure the camera to properly frame the scene:

```javascript
// In Scene.js or a new CameraSetup.js:
function positionCamera() {
  camera.position.set(10, 5, 15);
  camera.lookAt(0, 1, 0); // Look at the campfire
}
```

### 3. Day/Night Cycle Integration

Ensure campfire elements respond to the day/night cycle:

```javascript
// In Campfire.js:
export function Update() {
  // Get lighting values from sky system
  const daylight = SKYBOX.sunVisibility.value;
  
  // Adjust fire intensity inversely with daylight
  fireLight.intensity = 1.5 - (daylight * 0.7);
  
  // Update flame animation
  // ...
}
```

## Performance Considerations

1. **Geometry Optimization**:
   - Use instanced geometries for repeated elements (stones, trees)
   - Limit polygon count for all added elements
   - Share materials where possible

2. **Lighting Optimization**:
   - Limit shadow-casting to essential elements
   - Use baked ambient occlusion where appropriate
   - Optimize fire light calculations

3. **Animation Efficiency**:
   - Use simple mathematical functions for most animations
   - Limit animation complexity based on camera distance
   - Pre-compute animation cycles where possible

## Testing Strategy

1. **Visual Fidelity Tests**:
   - Check scene appearance at different times of day
   - Verify proper integration between ocean and beach
   - Ensure character and fire animations look natural

2. **Performance Tests**:
   - Monitor frame rate during extended running
   - Check for memory leaks in long sessions
   - Verify CPU/GPU usage remains acceptable

3. **Composition Tests**:
   - Ensure scene works well as a background for different content
   - Check that visual focus remains on important elements
   - Verify that animations don't distract from main content