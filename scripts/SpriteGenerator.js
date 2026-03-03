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
export function buildSpritePrompt(characterName, characterFeatures) {
    return `Create a full-body pixel-art sprite sheet of a seated character based on the attached reference images for art style. The character must be visible from head to feet in every frame, with no cropping, no missing limbs, and no partial body framing.

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

Transparent background. No seat, props, or environment. Just the character.

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
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function generateSprite(apiKey, characterName, description) {
    if (!apiKey) {
        return { success: false, error: 'API key is required' };
    }

    if (!characterName || !description) {
        return { success: false, error: 'Character name and description are required' };
    }

    // Load reference images
    const referenceImages = await loadReferenceImages();

    // Build message content with reference images first, then prompt
    const content = [];

    // Add reference images
    for (const imageDataUrl of referenceImages) {
        content.push({
            type: 'image_url',
            image_url: { url: imageDataUrl }
        });
    }

    // Add the text prompt
    content.push({
        type: 'text',
        text: buildSpritePrompt(characterName, description)
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

        // Parse response - Gemini returns image in message content
        if (data.choices && data.choices[0]?.message?.content) {
            const messageContent = data.choices[0].message.content;

            // Content can be a string or array of content parts
            if (Array.isArray(messageContent)) {
                // Look for image content
                for (const part of messageContent) {
                    if (part.type === 'image_url' && part.image_url?.url) {
                        return { success: true, data: part.image_url.url };
                    }
                    if (part.type === 'image' && part.image?.url) {
                        return { success: true, data: part.image.url };
                    }
                    // Some models return base64 directly
                    if (part.type === 'image' && part.image?.data) {
                        return {
                            success: true,
                            data: `data:image/png;base64,${part.image.data}`
                        };
                    }
                }
            }

            // If it's inline base64 in the response
            if (typeof messageContent === 'string' && messageContent.startsWith('data:image')) {
                return { success: true, data: messageContent };
            }
        }

        // Check for image in different response formats
        if (data.data && data.data[0]) {
            if (data.data[0].b64_json) {
                return {
                    success: true,
                    data: `data:image/png;base64,${data.data[0].b64_json}`
                };
            }
            if (data.data[0].url) {
                return { success: true, data: data.data[0].url };
            }
        }

        console.log('SpriteGenerator: Unexpected response format:', data);
        return { success: false, error: 'No image in response. The model may not have generated an image.' };

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
