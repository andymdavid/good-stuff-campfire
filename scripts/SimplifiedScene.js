import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer, SRGBColorSpace, BoxGeometry, Mesh, MeshBasicMaterial, DirectionalLight, AmbientLight, Clock } from "three";
import * as Skybox from "../scene/Skybox.js";
import * as Ocean from "../scene/Ocean.js";
import * as Beach from "../scene/Beach.js";
import * as Campfire from "../scene/Campfire.js";
import * as Characters from "../scene/Characters.js";
import * as PalmTree from "../scene/PalmTree.js";

export const body = document.createElement("div");
export const clock = new Clock();

export const renderer = new WebGLRenderer({ antialias: true });
export const scene = new Scene();
export const camera = new PerspectiveCamera();

export const cameraRight = new Vector3();
export const cameraUp = new Vector3();
export const cameraForward = new Vector3();

// Set fixed position for camera
const CAMERA_POSITION = new Vector3(0, 2, 8);
const CAMERA_LOOK_AT = new Vector3(0, 1, 0);

// Create lights
export const sunLight = new DirectionalLight(0xffffff, 2.0);
export const ambientLight = new AmbientLight(0x404040, 0.5);

export function UpdateCameraRotation() {
    cameraRight.copy(new Vector3(1, 0, 0).applyQuaternion(camera.quaternion));
    cameraUp.copy(new Vector3(0, 1, 0).applyQuaternion(camera.quaternion));
    cameraForward.copy(new Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
}

export let resMult = 1;
export function SetResolution(value) {
    resMult = value;
    let width = window.innerWidth * value * window.devicePixelRatio;
    let height = window.innerHeight * value * window.devicePixelRatio;
    
    body.style.transform = "";
    body.style.width = window.innerWidth + "px";
    body.style.height = window.innerHeight + "px";
    
    renderer.setSize(width, height, false);
}

export let fov = 60;
export function SetFOV(value) {
    fov = value;
    camera.fov = value;
    camera.updateProjectionMatrix();
}

export let antialias = true;
export function SetAntialias(value) {
    antialias = value;
    renderer.antialias = antialias;
}

export function Start() {
    console.log("SimplifiedScene: Start initialization");
    document.body.appendChild(body);

    // Create a new renderer with proper settings
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClearColor = true;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x000033, 1);
    renderer.shadowMap.enabled = true;
    body.appendChild(renderer.domElement);
    
    console.log("Renderer initialized:", renderer);
    
    // Set scene background
    scene.background = new Color(0x000033);
    
    // Setup camera
    camera.fov = fov;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.near = 0.3;
    camera.far = 4000;
    camera.updateProjectionMatrix();
    
    // Set camera to fixed position looking at the scene
    camera.position.copy(CAMERA_POSITION);
    camera.lookAt(CAMERA_LOOK_AT);
    UpdateCameraRotation();

    // Add lights to the scene
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    scene.add(ambientLight);

    // Initialize and add all scene components
    try {
        Skybox.Start();
        scene.add(Skybox.skybox);
        console.log("Added Skybox to scene");

        Ocean.Start();
        scene.add(Ocean.surface);
        console.log("Added Ocean to scene");

        Beach.Start();
        scene.add(Beach.beach);
        console.log("Added Beach to scene");

        Campfire.Start();
        scene.add(Campfire.campfire);
        console.log("Added Campfire to scene");

        Characters.Start();
        scene.add(Characters.charactersGroup);
        console.log("Added Characters to scene");

        PalmTree.Start();
        scene.add(PalmTree.palmTree);
        console.log("Added Palm Tree to scene");
    } catch (error) {
        console.error("Error during scene component initialization:", error);
    }

    // Simple zoom function with mouse wheel
    window.addEventListener('wheel', function(event) {
        const zoomSpeed = 0.5;
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        const newPos = camera.position.clone();
        
        // Move camera closer or further along its forward vector
        newPos.add(cameraForward.clone().multiplyScalar(zoomDirection * zoomSpeed));
        
        // Limit how close/far the camera can go
        const distance = newPos.distanceTo(CAMERA_LOOK_AT);
        if (distance > 3 && distance < 15) {
            camera.position.copy(newPos);
        }
        
        camera.lookAt(CAMERA_LOOK_AT);
        UpdateCameraRotation();
    });

    window.onresize = function() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    console.log("SimplifiedScene: Initialization complete");
}

let frameCount = 0;

export function Update() {
    const deltaTime = clock.getDelta();
    
    // Add some debug output on the first few frames
    if (frameCount < 5) {
        console.log(`Rendering frame ${frameCount} - Camera position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
        frameCount++;
    }
    
    try {
        // Update sun light direction based on skybox
        sunLight.position.copy(Skybox.dirToLight).multiplyScalar(100);
        sunLight.lookAt(0, 0, 0);
        
        Skybox.Update();
        Ocean.Update();
        Beach.Update();
        Campfire.Update(deltaTime);
        Characters.Update();
        PalmTree.Update();
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error during scene update:", error);
    }
} 