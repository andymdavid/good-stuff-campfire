// SpriteGenerator.js - OpenRouter API integration for sprite generation

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/images/generations';
const DEFAULT_MODEL = 'nanobanana/nano-banana-2';

/**
 * Build the prompt for generating a sprite sheet
 */
export function buildSpritePrompt(characterName, description) {
    return `Pixel art sprite sheet of ${description}, character named ${characterName}, sitting pose facing slightly to the side, 4 columns by 2 rows grid layout (8 frames total), each frame shows subtle idle animation variation (slight movement, breathing), transparent background, consistent character appearance across all frames, retro pixel art style, warm campfire lighting colors`;
}

/**
 * Generate a sprite using OpenRouter API
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

    const prompt = buildSpritePrompt(characterName, description);

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
                model: DEFAULT_MODEL,
                prompt: prompt,
                size: '1344x1152',
                response_format: 'b64_json'
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

        if (data.data && data.data[0]) {
            const imageData = data.data[0].b64_json || data.data[0].url;

            if (data.data[0].b64_json) {
                return {
                    success: true,
                    data: `data:image/png;base64,${imageData}`
                };
            } else if (data.data[0].url) {
                return {
                    success: true,
                    data: imageData
                };
            }
        }

        return { success: false, error: 'No image data in response' };

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
