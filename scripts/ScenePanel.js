// ScenePanel.js - Home screen panel for scene configuration

import * as SceneConfig from './SceneConfig.js';

let panelElement = null;
let onLaunchCallback = null;

// Character data (mirrors Characters.js ALL_CHARACTERS)
const CHARACTERS = {
    pete: { name: 'Pete', thumbnail: 'images/PeteSprite.png' },
    andy: { name: 'Andy', thumbnail: 'images/AndySprite.png' },
    joel: { name: 'Joel', thumbnail: 'images/JoelSprite.png' },
    gabe: { name: 'Gabe', thumbnail: 'images/Gabe-Sprite.png' },
    bill: { name: 'Bill', thumbnail: 'images/Bill-Sprite.png' }
};

export function Start(onLaunch) {
    onLaunchCallback = onLaunch;
    createPanelDOM();
    loadSavedSelection();
    show();
    console.log("ScenePanel: Started");
}

export function show() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
    }
}

export function hide() {
    if (panelElement) {
        panelElement.classList.add('hidden');
    }
}

function createPanelDOM() {
    // Create panel container
    panelElement = document.createElement('div');
    panelElement.id = 'scene-panel';
    panelElement.className = 'scene-panel';

    // Inner content wrapper
    const content = document.createElement('div');
    content.className = 'panel-content';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'The Good Stuff Campfire';
    title.className = 'panel-title';
    content.appendChild(title);

    // Character selection section
    const charSection = document.createElement('div');
    charSection.className = 'character-section';

    const charLabel = document.createElement('h2');
    charLabel.textContent = 'Select Characters';
    charLabel.className = 'section-label';
    charSection.appendChild(charLabel);

    const charGrid = document.createElement('div');
    charGrid.className = 'character-grid';

    // Create checkbox for each character
    Object.entries(CHARACTERS).forEach(([id, char]) => {
        const charItem = createCharacterCheckbox(id, char);
        charGrid.appendChild(charItem);
    });

    charSection.appendChild(charGrid);
    content.appendChild(charSection);

    // Launch button
    const launchBtn = document.createElement('button');
    launchBtn.id = 'launch-scene-btn';
    launchBtn.className = 'launch-button';
    launchBtn.textContent = 'Launch Scene';
    launchBtn.onclick = handleLaunch;
    content.appendChild(launchBtn);

    // Hint text
    const hint = document.createElement('p');
    hint.className = 'panel-hint';
    hint.textContent = 'Press Cmd+Escape to return to this panel';
    content.appendChild(hint);

    panelElement.appendChild(content);
    document.body.appendChild(panelElement);
}

function createCharacterCheckbox(id, char) {
    const item = document.createElement('label');
    item.className = 'character-item';
    item.setAttribute('data-character', id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `char-${id}`;
    checkbox.name = 'characters';
    checkbox.value = id;
    checkbox.checked = SceneConfig.isCharacterSelected(id);
    checkbox.onchange = () => updateSelection();

    const preview = document.createElement('div');
    preview.className = 'character-preview';
    preview.style.backgroundImage = `url(${char.thumbnail})`;
    preview.style.backgroundPosition = '0 0';
    preview.style.backgroundSize = '400% 200%'; // 4x2 sprite grid

    const name = document.createElement('span');
    name.className = 'character-name';
    name.textContent = char.name;

    item.appendChild(checkbox);
    item.appendChild(preview);
    item.appendChild(name);

    // Update visual state
    if (checkbox.checked) {
        item.classList.add('selected');
    }

    return item;
}

function updateSelection() {
    const checkboxes = panelElement.querySelectorAll('input[name="characters"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    // Update visual state of character items
    panelElement.querySelectorAll('.character-item').forEach(item => {
        const charId = item.getAttribute('data-character');
        if (selected.includes(charId)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    // Save selection
    if (selected.length >= 2) {
        console.log("ScenePanel: Saving selection:", selected);
        SceneConfig.setSelectedCharacters(selected);
    }

    // Update launch button state
    const launchBtn = document.getElementById('launch-scene-btn');
    launchBtn.disabled = selected.length < 2;
}

function loadSavedSelection() {
    const saved = SceneConfig.getSelectedCharacters();
    saved.forEach(id => {
        const checkbox = document.getElementById(`char-${id}`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.parentElement.classList.add('selected');
        }
    });
    updateSelection();
}

function handleLaunch() {
    const selected = SceneConfig.getSelectedCharacters();
    if (selected.length < 2) {
        return;
    }

    console.log("ScenePanel: Launching with characters:", selected);
    hide();

    if (onLaunchCallback) {
        onLaunchCallback(selected);
    }
}

// Keyboard shortcut handler for returning to panel
export function setupReturnShortcut(onReturn) {
    document.addEventListener('keydown', (event) => {
        // Cmd+Escape (Mac) or Ctrl+Escape (Windows)
        if (event.key === 'Escape' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            console.log("ScenePanel: Return shortcut triggered");
            if (onReturn) {
                onReturn();
            }
        }
    });
}
