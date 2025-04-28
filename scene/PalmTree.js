import {
    Group,
    CylinderGeometry,
    MeshStandardMaterial,
    Mesh,
    Vector3,
    SphereGeometry,
    Object3D,
    MathUtils,
    DoubleSide
} from 'three';

// Create a group to hold all palm tree components
export const palmTree = new Group();

// Constants for tree dimensions
const TRUNK_HEIGHT = 4.5;
const TRUNK_RADIUS = 0.4;
const TRUNK_SEGMENTS = 6;
const BEND_ANGLE = Math.PI / 12; // 15 degrees bend
const NUM_FRONDS = 12;
const FROND_LENGTH = 3;

// Store the original frond rotations
let originalFrondRotations = [];

function createTrunk() {
    // Create a slightly curved trunk using segments
    const segments = 4;
    const trunkGroup = new Group();
    
    for (let i = 0; i < segments; i++) {
        const height = TRUNK_HEIGHT / segments;
        const geometry = new CylinderGeometry(
            TRUNK_RADIUS * (1 - i * 0.1), // Taper the trunk slightly
            TRUNK_RADIUS * (1 - (i + 1) * 0.1),
            height,
            TRUNK_SEGMENTS
        );
        
        // Create bark material with rich texture
        const material = new MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8,
            metalness: 0.1,
            side: DoubleSide
        });
        
        const segment = new Mesh(geometry, material);
        segment.castShadow = true;
        segment.receiveShadow = true;
        segment.position.y = (i * height) + height/2;
        
        // Add slight bend to trunk
        const bendAmount = (i / segments) * BEND_ANGLE;
        segment.rotation.x = bendAmount;
        
        trunkGroup.add(segment);
    }
    
    // Add bark texture details using small cylinders
    for (let i = 0; i < 20; i++) {
        const barkDetail = new CylinderGeometry(0.05, 0.05, 0.3, 4);
        const barkMaterial = new MeshStandardMaterial({
            color: 0x3a2718,
            roughness: 1,
            metalness: 0,
            side: DoubleSide
        });
        const bark = new Mesh(barkDetail, barkMaterial);
        bark.castShadow = true;
        bark.receiveShadow = true;
        
        // Random position around trunk
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * TRUNK_HEIGHT;
        bark.position.set(
            Math.cos(angle) * (TRUNK_RADIUS - 0.05),
            height,
            Math.sin(angle) * (TRUNK_RADIUS - 0.05)
        );
        bark.rotation.set(
            Math.random() * 0.5,
            angle,
            Math.PI/2 + Math.random() * 0.5
        );
        trunkGroup.add(bark);
    }
    
    return trunkGroup;
}

function createPalmFrond() {
    const frondGroup = new Group();
    
    // Create the main stem
    const stemGeometry = new CylinderGeometry(0.05, 0.02, FROND_LENGTH, 4);
    const stemMaterial = new MeshStandardMaterial({
        color: 0x2d5a27,
        roughness: 0.8,
        side: DoubleSide
    });
    const stem = new Mesh(stemGeometry, stemMaterial);
    stem.castShadow = true;
    stem.receiveShadow = true;
    stem.rotation.z = Math.PI / 2;
    stem.position.x = FROND_LENGTH / 2;
    frondGroup.add(stem);
    
    // Create leaf segments
    const leafMaterial = new MeshStandardMaterial({
        color: 0x1a4f1a,
        roughness: 0.7,
        metalness: 0.1,
        side: DoubleSide
    });
    
    const numLeafPairs = 12;
    for (let i = 0; i < numLeafPairs; i++) {
        const leafGeometry = new CylinderGeometry(
            0.2, // base
            0, // tip
            1.5, // length
            3 // triangular shape
        );
        
        // Create a pair of leaves
        for (let side = -1; side <= 1; side += 2) {
            const leaf = new Mesh(leafGeometry, leafMaterial);
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            leaf.position.set(
                (i / numLeafPairs) * FROND_LENGTH,
                0,
                0
            );
            leaf.rotation.set(
                Math.PI/2,
                0,
                (Math.PI/4) * side + (i * 0.1)
            );
            leaf.scale.set(0.5, 1, 0.1);
            frondGroup.add(leaf);
        }
    }
    
    return frondGroup;
}

function createFronds() {
    const frondsGroup = new Group();
    
    for (let i = 0; i < NUM_FRONDS; i++) {
        const frond = createPalmFrond();
        
        // Position fronds in a circular pattern
        const angle = (i / NUM_FRONDS) * Math.PI * 2;
        const tiltAngle = Math.PI/4; // 45 degrees tilt
        
        frond.rotation.set(
            Math.sin(angle) * tiltAngle,
            angle,
            Math.cos(angle) * tiltAngle
        );
        
        frondsGroup.add(frond);
    }
    
    return frondsGroup;
}

export function Start() {
    console.log("PalmTree: Starting initialization");
    
    // Create and add trunk
    const trunk = createTrunk();
    palmTree.add(trunk);
    
    // Create and add fronds at the top of the trunk
    const fronds = createFronds();
    fronds.position.y = TRUNK_HEIGHT;
    fronds.rotation.x = BEND_ANGLE; // Match trunk bend
    palmTree.add(fronds);
    
    // Store original rotations of each frond
    fronds.children.forEach(frond => {
        originalFrondRotations.push({
            x: frond.rotation.x,
            y: frond.rotation.y,
            z: frond.rotation.z
        });
    });
    
    // Position the palm tree near the campfire
    palmTree.position.set(-4, 0, 2); // Moved further back and to the side
    palmTree.rotation.y = Math.PI / 4; // Adjusted rotation for better view
    palmTree.scale.set(1, 1, 1); // Slightly larger scale
    
    // Add some randomization to make it look more natural
    palmTree.rotation.x += MathUtils.randFloatSpread(0.1);
    palmTree.rotation.z += MathUtils.randFloatSpread(0.1);
    
    console.log("PalmTree: Initialization complete");
}

export function Update() {
    // Add subtle wind movement to fronds
    const time = Date.now() * 0.001;
    const windStrength = 0.02;
    
    // Get the fronds group (second child of palmTree)
    const frondsGroup = palmTree.children[1];
    if (!frondsGroup) return; // Safety check
    
    // Iterate through each frond in the fronds group
    frondsGroup.children.forEach((frond, index) => {
        if (!frond || !originalFrondRotations[index]) return; // Safety check
        
        const offset = index * 0.1;
        // Apply gentle wave motion on top of original rotation
        const waveX = Math.sin(time + offset) * windStrength;
        const waveZ = Math.cos(time + offset) * windStrength * 0.5;
        
        // Apply wind motion while preserving original position
        frond.rotation.x = originalFrondRotations[index].x + waveX;
        frond.rotation.z = originalFrondRotations[index].z + waveZ;
        // Keep Y rotation constant to maintain the circular arrangement
        frond.rotation.y = originalFrondRotations[index].y;
    });
} 