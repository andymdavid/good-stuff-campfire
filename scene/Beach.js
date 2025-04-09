import { Mesh } from "three";
import { camera } from "../scripts/SimplifiedScene.js";

// Create an empty beach implementation to satisfy dependencies
export const beach = new Mesh();

export function Start() {
    // Empty implementation - no actual beach geometry for now
    console.log("Beach module loaded - simplified implementation");
}

export function Update() {
    // Update beach position relative to camera
    beach.position.set(camera.position.x, 0, camera.position.z);
} 