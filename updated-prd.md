# The Good Stuff Campfire - Project Requirements Document

## Project Overview

### Purpose
Create an immersive, low-poly 3D scene in Three.js featuring two characters sitting around a campfire on a beach with an ocean view. The scene will include a realistic ocean, day/night cycle, and subtle animations to serve as a visually engaging background for podcast content and social media reels.

### Target Usage
- Background video for podcast episodes
- Looping content for social media reels/clips
- Immersive visual asset with day/night cycle

## Technical Foundation

This project builds upon an existing Three.js ocean simulation, leveraging its sophisticated water effects and sky system while adding new elements to create our campfire scene.

### Core Components from Ocean Repo
- Realistic ocean with surface reflections and volume
- Dynamic sky system with day/night cycle, sun, moon, and stars
- Shader-based lighting system
- Time management system

### New Components to Add
- Low-poly beach area near the ocean
- Campfire with animated flames and lighting
- Two characters sitting around the campfire
- Character animations (marshmallow roasting, fire poking)
- Ambient details (rocks, palm trees, etc.)

## Scene Requirements

### Environment
1. **Ocean**:
   - Use existing ocean implementation with realistic water simulation
   - Position relative to beach area for proper composition

2. **Beach**:
   - Create a sandy area adjacent to the ocean where characters and campfire will be placed
   - Apply appropriate textures and subtle height variations
   - Add scattered rocks, shells, and driftwood for detail

3. **Sky**:
   - Utilize existing day/night cycle with sun, moon, and stars
   - Ensure proper lighting changes throughout the cycle
   - Maintain sky colors that complement the ocean and scene

4. **Props**:
   - Campfire with logs and stones
   - Stick with marshmallow for one character
   - Poking stick for the other character
   - Palm trees in the background
   - Scattered beach elements (rocks, shells, driftwood)

### Characters
1. **Two Low-Poly Human Figures**:
   - Seated around the campfire facing each other
   - Backs to the ocean view
   - Simple but recognizable human forms
   - Distinctive appearance between the two characters

2. **Character Animations**:
   - Subtle idle animations (breathing, slight movements)
   - Character 1: Marshmallow roasting animation
   - Character 2: Fire-poking animation
   - Occasional head turning or gestures to simulate conversation

### Campfire
1. **Visual Elements**:
   - Arranged logs in a circle
   - Stones surrounding the firepit
   - Animated low-poly flames
   - Optional ember/spark particles

2. **Lighting Effects**:
   - Point light for fire illumination
   - Dynamic intensity to simulate flickering
   - Glow effect on nearby objects and characters
   - More prominent at night, subtle during day

### Day/Night Cycle
1. **Utilize Existing Cycle**:
   - Maintain the realistic sun/moon movement
   - Preserve star visibility during night
   - Keep sky color transitions during sunrise/sunset

2. **Enhanced Scene Integration**:
   - Adjust campfire glow intensity based on time of day
   - Modify character lighting based on fire vs. sunlight
   - Ensure beach and props have appropriate shadowing

## Visual Style
- Low-poly aesthetic consistent throughout
- Clean, defined shapes with minimal noise
- Warm, inviting color palette around campfire
- Cool, calming colors for ocean and sky
- Cohesive look between existing assets and new elements

## Camera and Composition
- Position camera to frame the campfire scene with ocean in background
- Sky visible above to capture day/night effects
- Characters prominently featured without obscuring view
- Subtle camera movement possible but not required

## Implementation Strategy

### Phase 1: Initial Setup
- Clone ocean repository
- Understand existing systems (ocean, sky, time)
- Plan integration points for new elements

### Phase 2: Beach Environment
- Create beach terrain
- Implement proper transitions between ocean and beach
- Add basic environmental details

### Phase 3: Campfire Implementation
- Create campfire geometry
- Implement fire animation and lighting
- Ensure proper integration with day/night cycle

### Phase 4: Character Creation
- Design and implement low-poly characters
- Position around campfire
- Create sitting pose and basic structure

### Phase 5: Animations & Interactions
- Add breathing and idle animations
- Implement marshmallow roasting
- Implement fire-poking animation
- Add subtle head movements

### Phase 6: Details & Polish
- Add palm trees and additional vegetation
- Scatter rocks, shells, and driftwood
- Fine-tune lighting and reflections
- Optimize for performance

### Phase 7: Camera & Export
- Set ideal camera angle for video background use
- Implement recording mechanism if needed
- Test looping and timing for social media clips

## Technical Considerations
- Maintain compatibility with existing shader system
- Ensure proper lighting integration between new and existing elements
- Keep performance optimized for long-running background video
- Preserve the visual quality of the ocean while adding new elements