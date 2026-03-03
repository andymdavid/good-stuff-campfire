// SpriteGenerator.js - OpenRouter API integration for sprite generation

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3.1-flash-image-preview'; // Nano Banana 2

// Reference sprite paths
const REFERENCE_SPRITES = [
    'images/PeteSprite.png',
    'images/AndySprite.png'
];

// Cache for loaded reference images
let referenceImagesCache = null;

/**
 * Remove green screen background from an image (chroma key)
 * We ask the AI to generate sprites on a bright green (#00FF00) background
 * This function removes that green, making those pixels truly transparent
 */
async function removeGreenBackground(imageDataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check if a pixel is "green screen" green
            // We look for pixels where green is dominant and red/blue are low
            const isGreenScreen = (r, g, b) => {
                // Pure green: high G, low R and B
                if (g > 200 && r < 100 && b < 100) return true;
                // Bright green variations
                if (g > 180 && g > r * 1.5 && g > b * 1.5) return true;
                // Also catch lighter greens that might appear
                if (g > 150 && r < 120 && b < 120 && g > r && g > b) return true;
                return false;
            };

            // Also detect checkerboard pattern (white/gray alternating)
            const isCheckerboard = (r, g, b) => {
                // White or near-white
                if (r > 245 && g > 245 && b > 245) return true;
                // Light gray (common checkerboard color)
                if (r > 180 && r < 220 && g > 180 && g < 220 && b > 180 && b < 220 &&
                    Math.abs(r - g) < 10 && Math.abs(g - b) < 10) return true;
                return false;
            };

            let greenCount = 0;
            let checkerCount = 0;
            let totalPixels = canvas.width * canvas.height;

            // First pass: count background pixels to determine which removal to use
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (isGreenScreen(r, g, b)) greenCount++;
                if (isCheckerboard(r, g, b)) checkerCount++;
            }

            console.log(`Background detection: ${greenCount} green pixels, ${checkerCount} checker pixels out of ${totalPixels}`);

            // Determine which background type to remove
            const useGreen = greenCount > totalPixels * 0.1; // More than 10% green
            const useChecker = checkerCount > totalPixels * 0.1; // More than 10% checker

            // Second pass: make background pixels transparent
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];

                let shouldRemove = false;
                if (useGreen && isGreenScreen(r, g, b)) shouldRemove = true;
                if (useChecker && isCheckerboard(r, g, b)) shouldRemove = true;

                if (shouldRemove) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            console.log('SpriteGenerator: Background removal complete');
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            console.warn('Failed to process image for background removal');
            resolve(imageDataUrl); // Return original on error
        };

        img.src = imageDataUrl;
    });
}

/**
 * Load an image and convert to base64 data URL
 */
async function imageToBase64(imagePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image: ${imagePath}`));
        };

        img.src = imagePath;
    });
}

/**
 * Load reference sprites as base64 (cached)
 */
async function loadReferenceImages() {
    if (referenceImagesCache) {
        return referenceImagesCache;
    }

    try {
        const images = await Promise.all(
            REFERENCE_SPRITES.map(path => imageToBase64(path))
        );
        referenceImagesCache = images;
        console.log('SpriteGenerator: Loaded reference sprites');
        return images;
    } catch (error) {
        console.warn('SpriteGenerator: Could not load reference sprites:', error);
        return [];
    }
}

/**
 * Build the prompt for generating a sprite sheet
 */
export function buildSpritePrompt(characterName, characterFeatures, hasReferencePhoto = false) {
    const referencePhotoInstructions = hasReferencePhoto
        ? `\n\nIMPORTANT: A reference photo of the person has been provided. The character's face, features, and overall appearance should closely match this person while rendered in the pixel art style shown in the style reference images.`
        : '';

    return `Create a full-body pixel-art sprite sheet of a seated character based on the attached reference images for art style. The character must be visible from head to feet in every frame, with no cropping, no missing limbs, and no partial body framing.${referencePhotoInstructions}

Match the EXACT pixel art style of the reference images:
- Same pixel art resolution and detail level
- Same proportions and character sizing
- Same color palette warmth and saturation
- Same shading technique and lighting style

Character Name: ${characterName}

Character Visual Features:
${characterFeatures}

---

Sprite Sheet Requirements

Format: 8 distinct frames arranged in a 4×2 grid.
Each frame MUST be different — no duplicate or near-duplicate frames.

IMPORTANT: Use a solid bright green background (hex #00FF00, pure green) for the entire image. This green background will be removed later to create transparency. Do NOT use a checkerboard pattern. Do NOT use any other background color. The background MUST be solid bright green (#00FF00). No seat, props, or environment. Just the character on a pure green background.

---

Animation Logic

Each frame must show a different pose, expression, or gesture, simulating a natural conversation.
The character is seated the entire time.

Frame-by-frame requirements:

Frame 1 — Idle Pose
• Sitting upright
• Closed-lip friendly smile
• Hands resting naturally on both knees

Frame 2 — Subtle Movement
• Slight lean to the left
• Closed-lip smile
• Hands still on knees

Frame 3 — Subtle Movement
• Slight lean to the right
• Closed-lip smile
• One foot tapping or shifting position slightly

Frame 4 — Head Turn (Left)
• Head turned slightly to the left
• Small, closed-lip smile
• Hands on knees

Frame 5 — Head Turn (Right)
• Head turned slightly to the right
• Big toothy grin
• Hands on knees

Frame 6 — Talking Animation (Mouth Open)
• Looking forward
• Mouth open mid-speech
• One hand lifted in a small conversational gesture

Frame 7 — Talking Animation (Mouth Mid-Shape)
• Looking forward
• Mouth in a mid-speech "O" or "E" shape
• A different hand gesture (e.g., hand slightly raised, palm angled)

Frame 8 — Gesture Emphasis
• Looking forward
• Big friendly toothy grin
• One arm extended slightly outward in an expressive conversation gesture

---

Styling Instructions
• Classic pixel-art style, clean and readable at small resolution
• Consistent palette across all frames
• Clear silhouette and recognizable character
• No repeated frames
• Full-body visible including head, torso, legs, hands, and both feet
• Must look like a natural looping conversational animation when cycled

---

Additional Generation Rules
• Each frame must show a meaningful, obvious change in pose, facial expression, or gesture
• Do NOT duplicate previous frames
• Do NOT crop the character
• Do NOT place the character on a chair or object
• Ensure a friendly, warm appearance — no grumpy expressions

Generate ONLY the sprite sheet image, no text or explanations.`;
}

/**
 * Generate a sprite using OpenRouter API with Gemini
 * @param {string} apiKey - OpenRouter API key
 * @param {string} characterName - Name of the character
 * @param {string} description - Description of the character's appearance
 * @param {string|null} referencePhotoDataUrl - Optional reference photo of the person
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function generateSprite(apiKey, characterName, description, referencePhotoDataUrl = null) {
    if (!apiKey) {
        return { success: false, error: 'API key is required' };
    }

    if (!characterName || !description) {
        return { success: false, error: 'Character name and description are required' };
    }

    // Load style reference images (Pete and Andy sprites)
    const styleReferenceImages = await loadReferenceImages();

    // Build message content with images first, then prompt
    const content = [];

    // Add style reference images first
    for (const imageDataUrl of styleReferenceImages) {
        content.push({
            type: 'image_url',
            image_url: { url: imageDataUrl }
        });
    }

    // Add user's reference photo if provided
    if (referencePhotoDataUrl) {
        content.push({
            type: 'image_url',
            image_url: { url: referencePhotoDataUrl }
        });
    }

    // Add the text prompt
    content.push({
        type: 'text',
        text: buildSpritePrompt(characterName, description, !!referencePhotoDataUrl)
    });

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'The Good Stuff Campfire'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: content
                    }
                ],
                modalities: ['image', 'text']
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 401) {
                return { success: false, error: 'Invalid API key' };
            }
            if (response.status === 429) {
                return { success: false, error: 'Rate limited. Please wait and try again.' };
            }
            if (response.status === 402) {
                return { success: false, error: 'Insufficient credits. Please add credits to your OpenRouter account.' };
            }

            return {
                success: false,
                error: errorData.error?.message || `API error: ${response.status}`
            };
        }

        const data = await response.json();
        console.log('SpriteGenerator: Full API response:', JSON.stringify(data, null, 2));

        // Helper to find image data URL in any object structure
        function findImageUrl(obj, depth = 0) {
            if (depth > 10 || !obj) return null;

            // Direct data URL string
            if (typeof obj === 'string' && obj.startsWith('data:image')) {
                return obj;
            }

            // Check common URL properties
            if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('data:image')) {
                return obj.url;
            }
            if (obj.image_url?.url) {
                return obj.image_url.url;
            }
            if (obj.b64_json) {
                return `data:image/png;base64,${obj.b64_json}`;
            }
            if (obj.data && typeof obj.data === 'string' && !obj.data.startsWith('{')) {
                return `data:image/png;base64,${obj.data}`;
            }

            // Recurse into arrays
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = findImageUrl(item, depth + 1);
                    if (found) return found;
                }
            }

            // Recurse into objects
            if (typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                    const found = findImageUrl(obj[key], depth + 1);
                    if (found) return found;
                }
            }

            return null;
        }

        // Parse response - try to find image anywhere in the response
        let rawImageUrl = null;

        if (data.choices && data.choices[0]?.message) {
            const message = data.choices[0].message;
            console.log('SpriteGenerator: Message keys:', Object.keys(message));

            // Check for images array (OpenRouter Gemini format)
            if (message.images && Array.isArray(message.images) && message.images.length > 0) {
                console.log('SpriteGenerator: Found images array with', message.images.length, 'images');
                rawImageUrl = findImageUrl(message.images[0]);
            }

            // Check content array
            if (!rawImageUrl && Array.isArray(message.content)) {
                console.log('SpriteGenerator: Content is array with', message.content.length, 'parts');
                for (const part of message.content) {
                    console.log('SpriteGenerator: Part type:', part.type);
                    rawImageUrl = findImageUrl(part);
                    if (rawImageUrl) break;
                }
            }

            // Check if content itself is a data URL
            if (!rawImageUrl && typeof message.content === 'string') {
                console.log('SpriteGenerator: Content is string, length:', message.content.length);
                if (message.content.startsWith('data:image')) {
                    rawImageUrl = message.content;
                } else {
                    // Log first 200 chars of text response
                    console.log('SpriteGenerator: Text response:', message.content.substring(0, 200));
                }
            }

            // Try recursive search on entire message
            if (!rawImageUrl) {
                rawImageUrl = findImageUrl(message);
                if (rawImageUrl) {
                    console.log('SpriteGenerator: Found image via recursive search');
                }
            }
        }

        // Fallback: Check for OpenAI-style image response
        if (!rawImageUrl && data.data && data.data[0]) {
            rawImageUrl = findImageUrl(data.data[0]);
        }

        // Try recursive search on entire response as last resort
        if (!rawImageUrl) {
            rawImageUrl = findImageUrl(data);
            if (rawImageUrl) {
                console.log('SpriteGenerator: Found image in response via deep search');
            }
        }

        // If we found an image, process it to remove checkerboard background
        if (rawImageUrl) {
            console.log('SpriteGenerator: Processing image to remove background...');
            const processedImageUrl = await removeGreenBackground(rawImageUrl);
            return { success: true, data: processedImageUrl };
        }

        // Extract any text response for error message
        const textContent = data.choices?.[0]?.message?.content;
        const errorDetail = typeof textContent === 'string' ? textContent.substring(0, 100) : '';
        console.log('SpriteGenerator: No image found. Response text:', errorDetail);

        return {
            success: false,
            error: errorDetail
                ? `Model returned text instead of image: "${errorDetail}..."`
                : 'No image in response. The model may not have generated an image.'
        };

    } catch (error) {
        console.error('Sprite generation error:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }

        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

/**
 * Validate that an image URL or data URL is accessible
 * @param {string} imageUrl - URL or data URL to validate
 * @returns {Promise<boolean>}
 */
export function validateImage(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imageUrl;
    });
}

/**
 * Preload reference images (call on app init for faster generation)
 */
export async function preloadReferences() {
    await loadReferenceImages();
}
