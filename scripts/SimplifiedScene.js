import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer, sRGBEncoding, BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import * as Skybox from "../scene/Skybox.js";
import * as Ocean from "../scene/Ocean.js";
import * as Beach from "../scene/Beach.js";

export const body = document.createElement("div");

export const renderer = new WebGLRenderer({ antialias: true });
export const scene = new Scene();
export const camera = new PerspectiveCamera();

export const cameraRight = new Vector3();
export const cameraUp = new Vector3();
export const cameraForward = new Vector3();

// Set fixed position for camera
const CAMERA_POSITION = new Vector3(0, 5, 15);
const CAMERA_LOOK_AT = new Vector3(0, 0, 0);

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

export let fov = 70;
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
    renderer.outputEncoding = sRGBEncoding;
    renderer.setClearColor(0x000033, 1);
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

    // Add a debug cube to verify rendering
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);
    
    // Simple zoom function with mouse wheel
    window.addEventListener('wheel', function(event) {
        const zoomSpeed = 0.5;
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        const newPos = camera.position.clone();
        
        // Move camera closer or further along its forward vector
        newPos.add(cameraForward.clone().multiplyScalar(zoomDirection * zoomSpeed));
        
        // Limit how close/far the camera can go
        const distance = newPos.distanceTo(CAMERA_LOOK_AT);
        if (distance > 5 && distance < 30) {
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

    console.log("SimplifiedScene: Starting Skybox");
    try {
        Skybox.Start();
        scene.add(Skybox.skybox);
        console.log("Skybox added:", Skybox.skybox);
    } catch (error) {
        console.error("Error starting Skybox:", error);
    }

    console.log("SimplifiedScene: Starting Ocean");
    try {
        Ocean.Start();
        scene.add(Ocean.surface);
        console.log("Ocean added:", Ocean.surface);
    } catch (error) {
        console.error("Error starting Ocean:", error);
    }
    
    console.log("SimplifiedScene: Starting Beach");
    try {
        Beach.Start();
        scene.add(Beach.beach);
        console.log("Beach added:", Beach.beach);
    } catch (error) {
        console.error("Error starting Beach:", error);
    }
    
    console.log("SimplifiedScene: Initialization complete");
}

let frameCount = 0;

export function Update() {
    // Add some debug output on the first few frames
    if (frameCount < 5) {
        console.log(`Rendering frame ${frameCount} - Camera position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
        frameCount++;
    }
    
    try {
        Skybox.Update();
        Ocean.Update();
        Beach.Update();
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error during scene update:", error);
    }
} 