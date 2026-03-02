// SceneConfig.js - Configuration storage for scene settings

const STORAGE_KEYS = {
    SELECTED_CHARACTERS: 'campfire-selected-characters',
    API_KEY_OPENROUTER: 'campfire-api-openrouter',
    SCENE_ELEMENTS: 'campfire-scene-elements'
};

const DEFAULTS = {
    selectedCharacters: ['pete', 'andy'],
    sceneElements: {
        palmTree: true,
        campfire: true,
        ocean: true
    }
};

// Character selection
export function getSelectedCharacters() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_CHARACTERS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length >= 2) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to load character selection:', e);
    }
    return [...DEFAULTS.selectedCharacters];
}

export function setSelectedCharacters(characters) {
    if (!Array.isArray(characters) || characters.length < 2) {
        console.warn('Invalid character selection, need at least 2');
        return false;
    }
    try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CHARACTERS, JSON.stringify(characters));
        return true;
    } catch (e) {
        console.error('Failed to save character selection:', e);
        return false;
    }
}

export function isCharacterSelected(characterId) {
    return getSelectedCharacters().includes(characterId);
}

// API key storage (for future sprite generator)
export function getApiKey(service = 'openrouter') {
    try {
        const key = localStorage.getItem(`campfire-api-${service}`);
        return key || null;
    } catch (e) {
        return null;
    }
}

export function setApiKey(service, key) {
    try {
        if (key) {
            localStorage.setItem(`campfire-api-${service}`, key);
        } else {
            localStorage.removeItem(`campfire-api-${service}`);
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Scene element toggles (for future feature)
export function getSceneElements() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SCENE_ELEMENTS);
        if (stored) {
            return { ...DEFAULTS.sceneElements, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load scene elements:', e);
    }
    return { ...DEFAULTS.sceneElements };
}

export function setSceneElement(element, enabled) {
    const elements = getSceneElements();
    elements[element] = enabled;
    try {
        localStorage.setItem(STORAGE_KEYS.SCENE_ELEMENTS, JSON.stringify(elements));
        return true;
    } catch (e) {
        return false;
    }
}
