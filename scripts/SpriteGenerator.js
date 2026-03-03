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
export function buildSpritePrompt(characterName, description) {
    return `Generate a new character sprite sheet that EXACTLY matches the pixel art style of the reference images I've provided.

The reference images show the art style you must match:
- Same pixel art resolution and detail level
- Same proportions and character sizing
- Same color palette warmth and saturation
- Same shading technique and lighting style

NEW CHARACTER TO CREATE:
- Name: ${characterName}
- Appearance: ${description}
- Pose: Sitting, facing slightly to the side (like the references)

SPRITE SHEET REQUIREMENTS:
- Layout: 4 columns × 2 rows grid (8 frames total)
- Each frame shows subtle idle animation (slight breathing/movement)
- Transparent background
- Character must be consistent across all 8 frames
- Match the exact pixel art style of the reference sprites

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
