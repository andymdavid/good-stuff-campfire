import { Mesh, PlaneGeometry, MeshStandardMaterial, Vector2, DataTexture, RGBAFormat, FloatType, RepeatWrapping, Color } from "three";
import { camera } from "../scripts/SimplifiedScene.js";
import { dirToLight } from "../scene/Skybox.js";

const BEACH_SIZE = 200; // Width of the beach
const BEACH_DEPTH = 75; // Increased depth to give room for campfire scene
const BEACH_SEGMENTS_WIDTH = 100; // More segments for smoother curves
const BEACH_SEGMENTS_DEPTH = 50;

export const beach = new Mesh();

function createSandTexture() {
    // Create a procedural sand texture
    const width = 256;
    const height = 256;
    const size = width * height;
    const data = new Float32Array(4 * size);

    for (let i = 0; i < size; i++) {
        const stride = i * 4;
        // Base sand color (slightly randomized beige)
        const r = 0.82 + Math.random() * 0.1;
        const g = 0.70 + Math.random() * 0.1;
        const b = 0.55 + Math.random() * 0.1;
        data[stride] = r;
        data[stride + 1] = g;
        data[stride + 2] = b;
        data[stride + 3] = 1.0;
    }

    const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat = new Vector2(20, 10);
    texture.needsUpdate = true;
    return texture;
}

function createBeachGeometry() {
    const geometry = new PlaneGeometry(
        BEACH_SIZE, 
        BEACH_DEPTH,
        BEACH_SEGMENTS_WIDTH,
        BEACH_SEGMENTS_DEPTH
    );

    // Add natural variation to the shoreline
    const vertices = geometry.attributes.position.array;
    const vertexCount = vertices.length / 3;
    
    // Create a more natural, subtle variation
    for (let i = 0; i < vertexCount; i++) {
        const x = vertices[i * 3];
        const z = vertices[i * 3 + 2];
        
        // Only affect vertices near the water's edge
        const distanceFromBack = 1 - (z / BEACH_DEPTH);
        if (distanceFromBack < 0.3) { // Only affect the back 30% of the beach
            // Create multiple overlapping waves for natural look
            const wave1 = Math.sin(x * 0.05) * 3; // Large, gentle curve
            const wave2 = Math.sin(x * 0.1 + 0.5) * 1.5; // Medium variation
            const wave3 = Math.sin(x * 0.2 + 1.0) * 0.5; // Small details
            
            // Blend waves based on distance from shore
            const blendFactor = Math.pow(1 - (distanceFromBack / 0.3), 2);
            const totalWave = (wave1 + wave2 + wave3) * blendFactor;
            
            // Apply the wave
            vertices[i * 3 + 2] += totalWave;
        }
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
}

export function Start() {
    console.log("Beach: Starting initialization");
    
    // Create beach geometry with natural shoreline
    const geometry = createBeachGeometry();
    console.log("Beach: Geometry created", geometry);
    
    // Use MeshStandardMaterial for physically based rendering
    const material = new MeshStandardMaterial({
        map: createSandTexture(),
        color: 0xd2b48c,
        roughness: 0.65, // Balanced roughness for good light response
        metalness: 0.0, // Sand is not metallic
        emissive: 0x332211, // Slightly lighter warm color for nighttime
        emissiveIntensity: 0.08, // Increased base glow
        envMapIntensity: 1.0 // Full environment reflection for daytime
    });
    console.log("Beach: Material created", material);
    
    // Setup the beach mesh
    beach.geometry = geometry;
    beach.material = material;
    beach.rotation.x = -Math.PI / 2; // Lay flat
    beach.position.y = 0; // At ocean level
    beach.position.z = BEACH_DEPTH * 0.25; // Position beach closer to camera
    beach.receiveShadow = true; // Allow the beach to receive shadows
    
    console.log("Beach: Mesh configured", beach);
    console.log("Beach: Initialization complete");
}

export function Update() {
    // Keep beach centered on camera position but slightly forward
    beach.position.set(
        camera.position.x,
        0,
        camera.position.z + BEACH_DEPTH * 0.25
    );
    
    // Update beach lighting based on sun direction
    const sunIntensity = Math.max(0.1, dirToLight.y); // Keep minimum light level
    
    // Adjust material properties based on time of day
    const material = beach.material;
    
    // More dramatic lighting changes between day and night
    if (sunIntensity <= 0.2) {
        // Night time settings
        material.emissiveIntensity = 0.05; // Reduced base glow at night
        material.roughness = 0.8; // Increased roughness at night
        material.envMapIntensity = 0.3; // Reduced environment reflection at night
    } else {
        // Day time settings
        material.emissiveIntensity = 0.0; // No emissive during day
        material.roughness = 0.65; // Standard roughness during day
        material.envMapIntensity = 1.0; // Full environment reflection during day
    }
    
    // Smoothly interpolate the material color based on sun intensity
    const dayColor = new Color(0xd2b48c); // Warm sand color for day
    const nightColor = new Color(0x7a6a4f); // Darker, cooler sand color for night
    material.color.lerpColors(nightColor, dayColor, sunIntensity);
    
    if (beach.parent) {
        console.log("Beach position:", beach.position);
    } else {
        console.warn("Beach not in scene!");
    }
} 