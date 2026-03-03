import * as TIME from "./scripts/Time.js";
import * as SCENE from "./scripts/SimplifiedScene.js";
import * as SETTINGS from "./shaders/Settings.js";
import * as ScenePanel from "./scripts/ScenePanel.js?v=2";

console.log("Starting initialization...");

let sceneActive = false;
let animationFrameId = null;

// MediaRecorder variables
let mediaRecorder = null;
let recordedChunks = [];
let mediaStream = null;

// Start with the panel
ScenePanel.Start(launchScene);
ScenePanel.setupReturnShortcut(returnToPanel);

console.log("ScenePanel started, waiting for user to launch scene...");

function launchScene(selectedCharacters) {
    console.log("Launching scene with characters:", selectedCharacters);

    // Initialize modules
    console.log("Starting TIME module...");
    TIME.Start();

    console.log("Starting SETTINGS module...");
    SETTINGS.Start();

    console.log("Starting SCENE module...");
    SCENE.Start();

    // Setup media recorder after scene is ready
    setupMediaRecorder();

    // Start animation loop
    sceneActive = true;
    console.log("Setting up animation frame...");
    animationFrameId = requestAnimationFrame(UpdateFrame);

    console.log("Scene launched successfully");
}

function returnToPanel() {
    if (!sceneActive) return;

    console.log("Returning to panel...");

    // Stop any active recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }

    // Stop animation loop
    sceneActive = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Cleanup scene
    SCENE.Destroy();

    // Show panel
    ScenePanel.show();

    console.log("Returned to panel");
}

function UpdateFrame() {
    if (!sceneActive) return;

    TIME.Update();
    SCENE.Update();

    animationFrameId = requestAnimationFrame(UpdateFrame);
}

function setupMediaRecorder() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    // Get canvas from the scene renderer
    const canvasElement = SCENE.renderer.domElement;

    if (!startButton || !stopButton) {
        console.log("Recording buttons not found - recording disabled");
        return;
    }

    startButton.addEventListener('click', () => {
        console.log('Start button clicked.');
        if (canvasElement.captureStream) {
            mediaStream = canvasElement.captureStream(30);

            const options = { mimeType: 'video/webm;codecs=vp9' };

            try {
                mediaRecorder = new MediaRecorder(mediaStream, options);
            } catch (e) {
                console.error('Error creating MediaRecorder:', e);
                console.warn('Trying without specific codec...');
                try {
                    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
                } catch (e2) {
                    console.error('Error creating MediaRecorder (fallback): ', e2);
                    alert('MediaRecorder setup failed. Check console for errors.');
                    return;
                }
            }

            recordedChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                    console.log('Data chunk received, size:', event.data.size);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped. Processing chunks...');
                const blob = new Blob(recordedChunks, {
                    type: options.mimeType
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';
                a.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                a.download = `recording-${timestamp}.webm`;
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log('Download link created and clicked.');

                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    console.log('Media stream tracks stopped.');
                }
                mediaStream = null;
                startButton.disabled = false;
                stopButton.disabled = true;
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                alert(`MediaRecorder error: ${event.error.name}`);
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
                startButton.disabled = false;
                stopButton.disabled = true;
            };

            mediaRecorder.start();
            console.log('MediaRecorder started, state:', mediaRecorder.state);
            startButton.disabled = true;
            stopButton.disabled = false;

        } else {
            alert('Your browser does not support canvas.captureStream().');
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    stopButton.addEventListener('click', () => {
        console.log('Stop button clicked.');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            console.log('MediaRecorder not recording or not initialized.');
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    console.log("MediaRecorder setup complete");
}

console.log("Script.js initialization complete");
