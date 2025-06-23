# Sprite Configuration Guide

## Overview
Your campfire scene now supports dynamic sprite configuration! You can easily switch between 2 or 3 character sprites for different podcast episodes without any visible UI elements during recording.

## Available Characters
- **Pete**: Left position, facing right
- **Andy**: Right position, facing left  
- **Joel**: Back position (only appears in 3-sprite mode), facing right

## Configuration Methods

### 1. URL Parameter (Recommended for Recording)
**Best for recording setups** - clean and doesn't require code changes.

- **2 sprites**: `index.html?sprites=2`
- **3 sprites**: `index.html?sprites=3`

**Example URLs:**
```
http://localhost:8000/index.html?sprites=2
http://localhost:8000/index.html?sprites=3
```

### 2. Config Variable (Quick Testing)
Edit the `SPRITE_COUNT` variable at the top of `scene/Characters.js`:

```javascript
let SPRITE_COUNT = 2; // Change to 3 for three sprites
```

### 3. Keyboard Shortcuts (Interactive Setup)
Press keys while the scene is loading:
- Press **'2'** for 2 sprites
- Press **'3'** for 3 sprites

*Note: This saves the setting to localStorage, so it persists between sessions. Reload the page to see changes.*

### 4. Local Storage (Persistent Setting)
The keyboard shortcut method automatically saves your preference. You can also set it programmatically:

```javascript
localStorage.setItem('campfire-sprite-count', '3');
```

## Sprite Positioning

### 2 Sprite Mode (Original Layout)
- **Pete**: Left side of campfire (-2.2 units from center)
- **Andy**: Right side of campfire (+2.2 units from center)
- Characters face each other across the fire

### 3 Sprite Mode (Triangle Layout)
- **Pete**: Front-left position (avoiding palm tree)
- **Andy**: Front-right position  
- **Joel**: Back-center position (further from camera)
- Arranged in triangle formation around campfire

## Priority Order
The system checks configuration sources in this order:
1. **URL Parameter** (highest priority)
2. **Local Storage** 
3. **Config Variable** (default fallback)

## Recording Workflow

### For 2-Character Episodes:
1. Open: `index.html?sprites=2`
2. Start recording
3. No visible UI elements will appear

### For 3-Character Episodes:  
1. Open: `index.html?sprites=3`
2. Start recording
3. Joel will appear in the back position

### Quick Testing:
1. Load the page normally
2. Press '2' or '3' to switch modes
3. Reload to see changes
4. Setting is saved for next time

## Technical Details

- Sprites are positioned to avoid conflicts with the palm tree (located at left side)
- All sprites maintain proper scale and orientation toward the campfire
- Sitting logs are automatically positioned for all three possible character positions
- Third sprite uses different animation start frame for visual variety
- Camera angle and scene setup remain unchanged

## Console Output
The system provides helpful console messages showing:
- Which configuration method was used
- Number of sprites being created
- Character positions
- Available control methods

Check your browser's developer console for confirmation that the sprite count is set correctly. 