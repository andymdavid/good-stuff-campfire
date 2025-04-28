import * as TIME from "./scripts/Time.js";
import * as SCENE from "./scripts/SimplifiedScene.js";
import * as SETTINGS from "./shaders/Settings.js";

console.log("Starting initialization...");

console.log("Starting TIME module...");
TIME.Start();

console.log("Starting SETTINGS module...");
SETTINGS.Start();

console.log("Starting SCENE module...");
SCENE.Start();

console.log("Setting up animation frame...");
requestAnimationFrame(UpdateFrame);

function UpdateFrame() {
    TIME.Update();
    SCENE.Update();
    
    requestAnimationFrame(UpdateFrame);
}

console.log("Script.js initialization complete");