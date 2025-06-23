import * as TIME from "./scripts/Time.js";
import * as SCENE from "./scripts/SimplifiedScene.js";
import * as SETTINGS from "./shaders/Settings.js";

// Import the renderer from the scene module
import { renderer } from "./scripts/SimplifiedScene.js";

console.log("Starting initialization...");

console.log("Starting TIME module...");
TIME.Start();

console.log("Starting SETTINGS module...");
SETTINGS.Start();

console.log("Starting SCENE module...");
SCENE.Start();

// --- MediaRecorder Setup --- 
console.log("Setting up MediaRecorder...");

let mediaRecorder;
let recordedChunks = [];
let mediaStream;
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const canvasElement = renderer.domElement; // Get the canvas from the imported renderer

if (!startButton || !stopButton) {
    console.error("Error: Start/Stop buttons not found in the DOM!");
} else {
    startButton.addEventListener('click', () => {
        console.log('Start button clicked.');
        if (canvasElement.captureStream) { // Check if captureStream is supported
            mediaStream = canvasElement.captureStream(30); // Capture at 30 FPS

            // --- Options for MediaRecorder --- 
            const options = { mimeType: 'video/webm;codecs=vp9' }; // High quality webm
            // const options = { mimeType: 'video/webm;codecs=vp8' };
            // const options = { mimeType: 'video/webm' }; 
            // const options = { mimeType: 'video/mp4' }; // Unlikely to work
            
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

            recordedChunks = []; // Clear previous chunks

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                    console.log('Data chunk received, size:', event.data.size);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped. Processing chunks...');
                const blob = new Blob(recordedChunks, {
                    type: options.mimeType // Use the same mimeType used for recording
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
                 // Reset buttons after successful recording
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
             // Ensure buttons are in correct state if stop is clicked inappropriately
             startButton.disabled = false;
             stopButton.disabled = true;
        }
        // Button states are mostly handled in onstop/onerror now
    });
}
// --- End MediaRecorder Setup ---

console.log("Setting up animation frame...");
requestAnimationFrame(UpdateFrame);

function UpdateFrame() {
    TIME.Update();
    SCENE.Update();
    
    requestAnimationFrame(UpdateFrame);
}

console.log("Script.js initialization complete");