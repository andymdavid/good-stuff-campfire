import { 
    Group,
    CylinderGeometry,
    Mesh,
    MeshStandardMaterial,
    PointLight,
    Vector3,
    Clock,
    BoxGeometry,
    MeshBasicMaterial,
    Points,
    BufferGeometry,
    Float32BufferAttribute,
    PointsMaterial,
    TextureLoader,
    AdditiveBlending,
    Color
} from 'three';
import { camera } from '../scripts/SimplifiedScene.js';

export const campfire = new Group();
let fireLight;
let logs;
let fireParticles;
let smokeParticles;
let emberParticles;
let debugBox;
let elapsedTime = 0;

// Animation constants
const FLICKER_SPEED = 15;
const INTENSITY_VARIATION = 0.3;

// Constants for campfire
const FIRE_HEIGHT = 1.2;
const FIRE_RADIUS = 0.3;
const LOG_LENGTH = 0.8;
const LOG_RADIUS = 0.08;
const LIGHT_HEIGHT = 0.5;
const LIGHT_INTENSITY = 5.0;
const LIGHT_DISTANCE = 15;

// Constants for sitting logs
const SITTING_LOG_LENGTH = 1.8;
const SITTING_LOG_RADIUS = 0.35;
const SITTING_LOG_DISTANCE = 2.2; // Distance from campfire center

// Particle system constants
const NUM_FIRE_PARTICLES = 100;
const NUM_SMOKE_PARTICLES = 50;
const NUM_EMBER_PARTICLES = 20;
const PARTICLE_SYSTEMS = {
    fire: {
        count: NUM_FIRE_PARTICLES,
        size: 0.2,
        height: FIRE_HEIGHT,
        radius: FIRE_RADIUS,
        color: new Color(0xff4400),
        speed: 2.0,
        lifetime: 1.0
    },
    smoke: {
        count: NUM_SMOKE_PARTICLES,
        size: 0.3,
        height: FIRE_HEIGHT * 2,
        radius: FIRE_RADIUS * 1.5,
        color: new Color(0x666666),
        speed: 0.5,
        lifetime: 2.0
    },
    embers: {
        count: NUM_EMBER_PARTICLES,
        size: 0.05,
        height: FIRE_HEIGHT * 1.5,
        radius: FIRE_RADIUS * 2,
        color: new Color(0xff2200),
        speed: 1.0,
        lifetime: 1.5
    }
};

function createLogs() {
    const logsGroup = new Group();
    
    // Create log material with emissive glow
    const logMaterial = new MeshStandardMaterial({
        color: 0x4a3520,
        roughness: 0.8,
        metalness: 0.0,
        emissive: 0x4a3520,
        emissiveIntensity: 0.2
    });

    // Create log geometry
    const logGeometry = new CylinderGeometry(LOG_RADIUS, LOG_RADIUS, LOG_LENGTH, 8);

    // Create logs in a more realistic tepee formation
    const logPositions = [
        // Bottom logs lying flat
        { pos: new Vector3(-0.2, 0.05, 0), rot: [0, 0, 0] },
        { pos: new Vector3(0.2, 0.05, 0), rot: [0, 0, 0] },
        // Angled logs in tepee formation
        { pos: new Vector3(-0.15, 0.1, -0.15), rot: [Math.PI * 0.15, Math.PI * 0.25, 0] },
        { pos: new Vector3(0.15, 0.1, -0.15), rot: [Math.PI * 0.15, -Math.PI * 0.25, 0] },
        { pos: new Vector3(0, 0.1, 0.2), rot: [Math.PI * 0.15, Math.PI, 0] }
    ];

    logPositions.forEach(({ pos, rot }) => {
        const log = new Mesh(logGeometry, logMaterial);
        log.position.copy(pos);
        log.rotation.set(...rot);
        log.castShadow = true;
        log.receiveShadow = true;
        logsGroup.add(log);
    });

    return logsGroup;
}

function createSittingLogs() {
    const sittingLogsGroup = new Group();
    
    // Create log material with same properties as campfire logs
    const logMaterial = new MeshStandardMaterial({
        color: 0x4a3520,
        roughness: 0.8,
        metalness: 0.0,
        emissive: 0x4a3520,
        emissiveIntensity: 0.2
    });

    // Create log geometry - slightly larger than campfire logs
    const logGeometry = new CylinderGeometry(SITTING_LOG_RADIUS, SITTING_LOG_RADIUS, SITTING_LOG_LENGTH, 8);

    // Create two logs on either side of the campfire
    const logPositions = [
        // Left log for Pete
        { pos: new Vector3(-SITTING_LOG_DISTANCE, SITTING_LOG_RADIUS, -1), rot: [0, 0, Math.PI/2] },
        // Right log for Andy
        { pos: new Vector3(SITTING_LOG_DISTANCE, SITTING_LOG_RADIUS, -1), rot: [0, 0, Math.PI/2] }
    ];

    logPositions.forEach(({ pos, rot }) => {
        const log = new Mesh(logGeometry, logMaterial);
        log.position.copy(pos);
        log.rotation.set(...rot);
        log.castShadow = true;
        log.receiveShadow = true;
        sittingLogsGroup.add(log);
    });

    return sittingLogsGroup;
}

function createParticleSystem(type) {
    const system = PARTICLE_SYSTEMS[type];
    const geometry = new BufferGeometry();
    const positions = new Float32Array(system.count * 3);
    const velocities = new Float32Array(system.count * 3);
    const lifetimes = new Float32Array(system.count);

    // Initialize particles
    for (let i = 0; i < system.count; i++) {
        const i3 = i * 3;
        // Random position within radius
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * system.radius;
        positions[i3] = Math.cos(theta) * r;
        positions[i3 + 1] = Math.random() * system.height * 0.2; // Start near bottom
        positions[i3 + 2] = Math.sin(theta) * r;

        // Initial velocity
        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = Math.random() * system.speed;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

        // Random lifetime
        lifetimes[i] = Math.random() * system.lifetime;
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new Float32BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new Float32BufferAttribute(lifetimes, 1));

    const material = new PointsMaterial({
        size: system.size,
        color: system.color,
        transparent: true,
        opacity: 0.8,
        blending: AdditiveBlending,
        depthWrite: false
    });

    return new Points(geometry, material);
}

function createFireLight() {
    const light = new PointLight(0xff6600, LIGHT_INTENSITY, LIGHT_DISTANCE);
    light.position.set(0, LIGHT_HEIGHT, 0);
    light.intensity = LIGHT_INTENSITY;
    light.distance = LIGHT_DISTANCE;
    light.decay = 2;
    return light;
}

export function Start() {
    console.log("Campfire: Starting initialization");
    
    logs = createLogs();
    campfire.add(logs);
    
    // Add sitting logs
    const sittingLogs = createSittingLogs();
    campfire.add(sittingLogs);
    
    fireLight = createFireLight();
    campfire.add(fireLight);
    
    // Create particle systems
    fireParticles = createParticleSystem('fire');
    smokeParticles = createParticleSystem('smoke');
    emberParticles = createParticleSystem('embers');
    
    campfire.add(fireParticles);
    campfire.add(smokeParticles);
    campfire.add(emberParticles);
    
    campfire.position.set(0, 0, 4);
    
    console.log("Campfire: Initialization complete");
}

function updateParticleSystem(particles, type, deltaTime) {
    const system = PARTICLE_SYSTEMS[type];
    const positions = particles.geometry.attributes.position;
    const velocities = particles.geometry.attributes.velocity;
    const lifetimes = particles.geometry.attributes.lifetime;

    for (let i = 0; i < system.count; i++) {
        const i3 = i * 3;
        
        // Update lifetime
        lifetimes.array[i] -= deltaTime;
        
        // Reset particle if lifetime expired
        if (lifetimes.array[i] <= 0) {
            // Reset position
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * system.radius;
            positions.array[i3] = Math.cos(theta) * r;
            positions.array[i3 + 1] = Math.random() * system.height * 0.2;
            positions.array[i3 + 2] = Math.sin(theta) * r;
            
            // Reset velocity
            velocities.array[i3] = (Math.random() - 0.5) * 0.1;
            velocities.array[i3 + 1] = Math.random() * system.speed;
            velocities.array[i3 + 2] = (Math.random() - 0.5) * 0.1;
            
            // Reset lifetime
            lifetimes.array[i] = Math.random() * system.lifetime;
        } else {
            // Update position based on velocity
            positions.array[i3] += velocities.array[i3] * deltaTime;
            positions.array[i3 + 1] += velocities.array[i3 + 1] * deltaTime;
            positions.array[i3 + 2] += velocities.array[i3 + 2] * deltaTime;
            
            // Add some random movement
            positions.array[i3] += (Math.random() - 0.5) * 0.01;
            positions.array[i3 + 2] += (Math.random() - 0.5) * 0.01;
            
            // Fade out particles near end of life
            const opacity = Math.min(lifetimes.array[i] / system.lifetime, 1);
            particles.material.opacity = opacity;
        }
    }
    
    positions.needsUpdate = true;
    velocities.needsUpdate = true;
    lifetimes.needsUpdate = true;
}

export function Update(deltaTime) {
    elapsedTime += deltaTime;
    
    // Update fire light
    if (fireLight) {
        const flicker = Math.sin(elapsedTime * FLICKER_SPEED) * INTENSITY_VARIATION;
        const noise = (Math.random() - 0.5) * 0.2;
        fireLight.intensity = LIGHT_INTENSITY + flicker + noise;
    }
    
    // Update particle systems
    updateParticleSystem(fireParticles, 'fire', deltaTime);
    updateParticleSystem(smokeParticles, 'smoke', deltaTime);
    updateParticleSystem(emberParticles, 'embers', deltaTime);
    
    // Keep campfire in fixed position
    campfire.position.set(0, 0, 4);
} 