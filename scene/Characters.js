import {
    Group,
    TextureLoader,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh,
    Vector3,
    NearestFilter,
    DoubleSide,
    Clock,
    sRGBEncoding
} from 'three';
import { campfire } from './Campfire.js';
import { camera } from '../scripts/SimplifiedScene.js';

// Animation configuration
const FRAME_TIME = 0.8;
const SPRITE_WIDTH = 2.0;
const SPRITE_HEIGHT = 4.0; // Set to maintain 1:2 aspect ratio
const UV_INSET = 0.015; // Increased inset (1.5%) to prevent frame bleeding artifacts

// SPRITE CONFIGURATION - Easy to change for different episodes
let SPRITE_COUNT = 2; // Default to 2 sprites - change this for different episodes

// Configuration methods for sprite count
function initializeSpriteCount() {
    // Method 1: URL Parameter (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlSpriteCount = urlParams.get('sprites');
    if (urlSpriteCount && (urlSpriteCount === '2' || urlSpriteCount === '3')) {
        SPRITE_COUNT = parseInt(urlSpriteCount);
        console.log(`Sprite count set from URL parameter: ${SPRITE_COUNT}`);
        return;
    }
    
    // Method 2: Local Storage (second priority)
    const storedSpriteCount = localStorage.getItem('campfire-sprite-count');
    if (storedSpriteCount && (storedSpriteCount === '2' || storedSpriteCount === '3')) {
        SPRITE_COUNT = parseInt(storedSpriteCount);
        console.log(`Sprite count set from localStorage: ${SPRITE_COUNT}`);
        return;
    }
    
    // Method 3: Default from config variable (already set above)
    console.log(`Using default sprite count: ${SPRITE_COUNT}`);
}

// Keyboard shortcut handler
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Press '2' or '3' to change sprite count (only works before recording)
        if (event.key === '2' || event.key === '3') {
            const newCount = parseInt(event.key);
            if (newCount !== SPRITE_COUNT) {
                SPRITE_COUNT = newCount;
                localStorage.setItem('campfire-sprite-count', newCount.toString());
                console.log(`Sprite count changed to: ${SPRITE_COUNT} (saved to localStorage)`);
                console.log('Reload the page to see the change');
            }
        }
    });
}

// Character configurations - now including Joel
const ALL_CHARACTERS = {
    pete: {
        textureFile: 'images/PeteSprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.60,
        facingRight: false,
        startFrame: 0
    },
    andy: {
        textureFile: 'images/AndySprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.60,
        facingRight: true,
        startFrame: 4
    },
    joel: {
        textureFile: 'images/JoelSprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.55,
        facingRight: false,
        startFrame: 2 // Different start frame for variety
    }
};

// Dynamic positioning function
function calculateSpritePositions(count) {
    const DISTANCE_FROM_CAMPFIRE = 1.6; // Match sitting log distance
    const SITTING_HEIGHT = 1.5; // Lowered further to sit properly on logs
    const Z_OFFSET = 1; // Z position relative to campfire (logs are at Z = -1, so this puts sprites at Z = 2)
    
    if (count === 2) {
        // Original positioning: across from each other
        return [
            new Vector3(-DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET)
        ];
    } else if (count === 3) {
        // Triangle arrangement, avoiding palm tree on left (-4, 0, 2)
        // Palm tree is at angle ~225° from campfire, so avoid that area
        const positions = [];
        
        // Character 1: Front-left position (full distance to match right side spacing)
        positions.push(new Vector3(-DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET));
        
        // Character 2: Front-right position
        positions.push(new Vector3(DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET));
        
        // Character 3: Back-center position (further from camera)
        positions.push(new Vector3(0, SITTING_HEIGHT, Z_OFFSET - DISTANCE_FROM_CAMPFIRE * 0.8));
        
        return positions;
    }
    
    return [];
}

// Get character configurations based on sprite count
function getActiveCharacters(count) {
    if (count === 2) {
        return ['pete', 'andy'];
    } else if (count === 3) {
        return ['pete', 'andy', 'joel'];
    }
    return [];
}

export const charactersGroup = new Group();
const textureLoader = new TextureLoader();
const clock = new Clock();

class Character {
    constructor(config, position) {
        this.config = config;
        this.currentFrame = config.startFrame || 0;
        this.frameTime = 0;
        
        // Create plane geometry for the sprite with 1:2 aspect ratio
        const geometry = new PlaneGeometry(SPRITE_WIDTH, SPRITE_HEIGHT);
        
        // Load and configure texture
        this.texture = textureLoader.load(config.textureFile);
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = NearestFilter;
        this.texture.flipY = false;
        this.texture.encoding = sRGBEncoding;
        
        // Create material with proper transparency and color settings
        this.material = new MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            alphaTest: 0.1,
            side: DoubleSide,
            premultipliedAlpha: false,
            toneMapped: false
        });
        
        // Create mesh
        this.mesh = new Mesh(geometry, this.material);
        
        // Set position (passed in from positioning system)
        this.mesh.position.copy(position);
        this.mesh.scale.set(
            config.facingRight ? -config.scale : config.scale,
            config.scale,
            1
        );
        
        // Initialize UV coordinates for first frame
        this.updateUVs();
    }
    
    updateUVs() {
        if (!this.mesh) return;
        
        // Calculate frame position in the grid (left-to-right, top-to-bottom)
        const frameX = this.currentFrame % this.config.framesHorizontal;
        const frameY = Math.floor(this.currentFrame / this.config.framesHorizontal);
        
        // Calculate UV coordinates for a complete frame
        const frameWidth = 1.0 / this.config.framesHorizontal;
        const frameHeight = 1.0 / this.config.framesVertical;
        
        // Calculate base UV coordinates for current frame
        // In UV space: (0,0) is bottom-left, (1,1) is top-right
        const u0 = frameX * frameWidth;
        const u1 = (frameX + 1) * frameWidth;
        // Invert Y coordinates since we're starting from top row
        const v1 = 1.0 - (frameY * frameHeight);
        const v0 = v1 - frameHeight;
        
        // Apply stronger insets to prevent frame bleeding
        const u0Inset = u0 + UV_INSET;
        const u1Inset = u1 - UV_INSET;
        const v0Inset = v0 + UV_INSET;
        const v1Inset = v1 - UV_INSET;
        
        // Get UV attribute
        const uvs = this.mesh.geometry.attributes.uv;
        
        // Set UV coordinates for each vertex with stronger insets
        // PlaneGeometry vertex order: (0,0), (1,0), (0,1), (1,1)
        uvs.setXY(0, u0Inset, v0Inset); // Bottom-left
        uvs.setXY(1, u1Inset, v0Inset); // Bottom-right
        uvs.setXY(2, u0Inset, v1Inset); // Top-left
        uvs.setXY(3, u1Inset, v1Inset); // Top-right
        
        uvs.needsUpdate = true;
    }
    
    update(deltaTime) {
        this.frameTime += deltaTime;
        
        if (this.frameTime >= FRAME_TIME) {
            this.frameTime = 0;
            
            // Update frame counter (left-to-right, top-to-bottom)
            this.currentFrame = (this.currentFrame + 1) % this.config.totalFrames;
            this.updateUVs();
        }
        
        // Make sprite always face camera while maintaining vertical orientation
        if (this.mesh && camera) {
            const dirToCamera = new Vector3().subVectors(camera.position, this.mesh.position);
            dirToCamera.y = 0; // Keep vertical
            this.mesh.lookAt(this.mesh.position.clone().add(dirToCamera));
        }
    }
}

let activeCharacters = [];

export function Start() {
    console.log("Characters: Starting initialization");
    
    // Initialize sprite count from various sources
    initializeSpriteCount();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Get character names and positions based on sprite count
    const characterNames = getActiveCharacters(SPRITE_COUNT);
    const positions = calculateSpritePositions(SPRITE_COUNT);
    
    console.log(`Creating ${SPRITE_COUNT} characters:`, characterNames);
    console.log('Positions:', positions);
    
    // Create characters dynamically
    activeCharacters = [];
    for (let i = 0; i < characterNames.length; i++) {
        const characterName = characterNames[i];
        const config = ALL_CHARACTERS[characterName];
        const position = positions[i];
        
        if (config && position) {
            const character = new Character(config, position);
            activeCharacters.push(character);
            charactersGroup.add(character.mesh);
            console.log(`Created character: ${characterName} at position:`, position);
        }
    }
    
    // Position group relative to campfire
    charactersGroup.position.copy(campfire.position);
    
    console.log(`Characters: Initialization complete with ${activeCharacters.length} characters`);
    console.log('Controls:');
    console.log('- URL parameter: ?sprites=2 or ?sprites=3');
    console.log('- Keyboard: Press 2 or 3 to change count (saves to localStorage)');
    console.log('- Config: Change SPRITE_COUNT variable at top of Characters.js');
}

export function Update() {
    const deltaTime = clock.getDelta();
    
    // Update all active character animations
    activeCharacters.forEach(character => {
        if (character) character.update(deltaTime);
    });
} 