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
import * as SceneConfig from '../scripts/SceneConfig.js';

// Animation configuration
const FRAME_TIME = 0.8;
const SPRITE_WIDTH = 2.0;
const SPRITE_HEIGHT = 4.0; // Set to maintain 1:2 aspect ratio
const UV_INSET = 0.01; // Increased inset (1.5%) to prevent frame bleeding artifacts

// Character configurations - including all available characters
const ALL_CHARACTERS = {
    pete: {
        textureFile: 'images/PeteSprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.63,
        facingRight: false,
        startFrame: 0
    },
    andy: {
        textureFile: 'images/AndySprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.63,
        facingRight: true,
        startFrame: 4
    },
    joel: {
        textureFile: 'images/JoelSprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.52,
        facingRight: false,
        startFrame: 2
    },
    gabe: {
        textureFile: 'images/Gabe-Sprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.52,
        facingRight: false,
        startFrame: 2
    },
    bill: {
        textureFile: 'images/Bill-Sprite.png',
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.52,
        facingRight: true,
        startFrame: 2
    }
};

// Load custom sprites from localStorage
function loadCustomCharacters() {
    try {
        const stored = localStorage.getItem('campfire-custom-sprites');
        if (stored) {
            const customSprites = JSON.parse(stored);
            Object.entries(customSprites).forEach(([id, sprite]) => {
                // Always update/overwrite to pick up regenerated sprites
                ALL_CHARACTERS[id] = {
                    textureFile: sprite.dataUrl,
                    framesHorizontal: 4,
                    framesVertical: 2,
                    totalFrames: 8,
                    scale: 0.52,
                    facingRight: false,
                    startFrame: 0
                };
                console.log(`Characters: Loaded custom character "${sprite.name}" (${id})`);
            });
        }
    } catch (e) {
        console.warn('Failed to load custom characters:', e);
    }
}

// Initialize custom characters on module load
loadCustomCharacters();

// Dynamic positioning function - handles 2, 3, or 4 characters
function calculateSpritePositions(count) {
    const DISTANCE_FROM_CAMPFIRE = 1.6;
    const SITTING_HEIGHT = 1.5;
    const Z_OFFSET = 1;

    if (count === 2) {
        return [
            new Vector3(-DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET)
        ];
    } else if (count === 3) {
        return [
            new Vector3(-DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(0, SITTING_HEIGHT, Z_OFFSET - DISTANCE_FROM_CAMPFIRE * 0.4)
        ];
    } else if (count === 4) {
        const backRowZ = Z_OFFSET - DISTANCE_FROM_CAMPFIRE * 0.4;
        const backRowXOffset = DISTANCE_FROM_CAMPFIRE * 0.35;
        return [
            new Vector3(-DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(DISTANCE_FROM_CAMPFIRE, SITTING_HEIGHT, Z_OFFSET),
            new Vector3(-backRowXOffset, SITTING_HEIGHT, backRowZ),
            new Vector3(backRowXOffset, SITTING_HEIGHT, backRowZ)
        ];
    }

    return [];
}

// Get character names from SceneConfig
function getActiveCharacters() {
    const chars = SceneConfig.getSelectedCharacters();
    console.log("Characters: getActiveCharacters() returning:", chars);
    return chars;
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
        const u0 = frameX * frameWidth;
        const u1 = (frameX + 1) * frameWidth;
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
        uvs.setXY(0, u0Inset, v0Inset);
        uvs.setXY(1, u1Inset, v0Inset);
        uvs.setXY(2, u0Inset, v1Inset);
        uvs.setXY(3, u1Inset, v1Inset);

        uvs.needsUpdate = true;
    }

    update(deltaTime) {
        this.frameTime += deltaTime;

        if (this.frameTime >= FRAME_TIME) {
            this.frameTime = 0;
            this.currentFrame = (this.currentFrame + 1) % this.config.totalFrames;
            this.updateUVs();
        }

        // Make sprite always face camera while maintaining vertical orientation
        if (this.mesh && camera) {
            const dirToCamera = new Vector3().subVectors(camera.position, this.mesh.position);
            dirToCamera.y = 0;
            this.mesh.lookAt(this.mesh.position.clone().add(dirToCamera));
        }
    }
}

let activeCharacters = [];

export function Start() {
    console.log("Characters: Starting initialization");

    // Reload custom characters from localStorage (in case new ones were added)
    loadCustomCharacters();

    // Clear any existing characters from previous runs
    while (charactersGroup.children.length > 0) {
        const child = charactersGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
        }
        charactersGroup.remove(child);
    }

    // Get character names from selection
    const characterNames = getActiveCharacters();
    const positions = calculateSpritePositions(characterNames.length);

    console.log(`Creating ${characterNames.length} characters:`, characterNames);
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
        } else {
            console.warn(`Characters: Could not find config for "${characterName}". Available:`, Object.keys(ALL_CHARACTERS));
        }
    }

    // Position group relative to campfire
    charactersGroup.position.copy(campfire.position);

    console.log(`Characters: Initialization complete with ${activeCharacters.length} characters`);
}

export function Update() {
    const deltaTime = clock.getDelta();

    // Update all active character animations
    activeCharacters.forEach(character => {
        if (character) character.update(deltaTime);
    });
}
