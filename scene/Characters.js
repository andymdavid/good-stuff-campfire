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

// Character configurations
const CHARACTERS = {
    pete: {
        textureFile: 'images/PeteSprite.png',
        position: new Vector3(-1, SPRITE_HEIGHT/2, 5), // Moved further from campfire
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.35, // Reduced scale to match campfire proportions
        facingRight: false,
        startFrame: 0 // Start at first frame
    },
    andy: {
        textureFile: 'images/AndySprite.png',
        position: new Vector3(1, SPRITE_HEIGHT/2, 5), // Moved further from campfire
        framesHorizontal: 4,
        framesVertical: 2,
        totalFrames: 8,
        scale: 0.35, // Reduced scale to match campfire proportions
        facingRight: true,
        startFrame: 4 // Start halfway through the animation
    }
};

export const charactersGroup = new Group();
const textureLoader = new TextureLoader();
const clock = new Clock();

class Character {
    constructor(config) {
        this.config = config;
        this.currentFrame = config.startFrame || 0; // Initialize with startFrame if provided, otherwise 0
        this.frameTime = 0;
        
        // Create plane geometry for the sprite with 1:2 aspect ratio
        const geometry = new PlaneGeometry(SPRITE_WIDTH, SPRITE_HEIGHT);
        
        // Load and configure texture
        this.texture = textureLoader.load(config.textureFile);
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = NearestFilter;
        this.texture.flipY = false;
        this.texture.encoding = sRGBEncoding; // Ensure correct color space
        
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
        
        // Set initial position and scale
        this.mesh.position.copy(config.position);
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

let pete, andy;

export function Start() {
    console.log("Characters: Starting initialization");
    
    // Create characters
    pete = new Character(CHARACTERS.pete);
    andy = new Character(CHARACTERS.andy);
    
    // Add to group
    charactersGroup.add(pete.mesh);
    charactersGroup.add(andy.mesh);
    
    // Position group relative to campfire
    charactersGroup.position.copy(campfire.position);
    
    console.log("Characters: Initialization complete");
}

export function Update() {
    const deltaTime = clock.getDelta();
    
    // Update character animations
    if (pete) pete.update(deltaTime);
    if (andy) andy.update(deltaTime);
} 