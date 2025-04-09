import * as TIME from "./scripts/Time.js";
import * as SCENE from "./scripts/SimplifiedScene.js";
import * as SETTINGS from "./shaders/Settings.js";

TIME.Start();
SETTINGS.Start();
SCENE.Start();

requestAnimationFrame(UpdateFrame);

function UpdateFrame() {
    TIME.Update();
    SCENE.Update();
    
    requestAnimationFrame(UpdateFrame);
}