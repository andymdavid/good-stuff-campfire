// ScenePanel.js - Home screen panel for scene configuration

import * as SceneConfig from './SceneConfig.js';
import * as SpriteGenerator from './SpriteGenerator.js';

let panelElement = null;
let onLaunchCallback = null;
let guestDrawer = null;
let selectedGuestCount = 0;
let selectedGuests = [];
let currentTab = 'scene';

// Sprite Creator state
let spritePreviewUrl = null;
let isGenerating = false;

// Hosts (always included)
const HOSTS = {
    pete: { name: 'Pete', thumbnail: 'images/PeteSprite.png' },
    andy: { name: 'Andy', thumbnail: 'images/AndySprite.png' }
};

// Available guests (built-in)
const BUILT_IN_GUESTS = ['joel', 'gabe', 'bill'];

const GUESTS = {
    joel: { name: 'Joel', thumbnail: 'images/JoelSprite.png' },
    gabe: { name: 'Gabe', thumbnail: 'images/Gabe-Sprite.png' },
    bill: { name: 'Bill', thumbnail: 'images/Bill-Sprite.png' }
};

export function Start(onLaunch) {
    onLaunchCallback = onLaunch;
    loadCustomSpritesToGuests();
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
    panelElement = document.createElement('div');
    panelElement.id = 'scene-panel';
    panelElement.className = 'scene-panel';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'panel-sidebar';

    // Logo/Title
    const logo = document.createElement('div');
    logo.className = 'panel-logo';
    logo.textContent = 'The Good Stuff';
    sidebar.appendChild(logo);

    // Navigation
    const nav = document.createElement('nav');
    nav.className = 'panel-nav';

    const tabs = [
        { id: 'scene', label: 'Scene Setup' },
        { id: 'sprites', label: 'Sprite Creator' },
        { id: 'settings', label: 'Settings' }
    ];

    tabs.forEach(tab => {
        const navItem = document.createElement('button');
        navItem.className = 'nav-item' + (tab.id === 'scene' ? ' active' : '');
        navItem.setAttribute('data-tab', tab.id);
        navItem.onclick = () => switchTab(tab.id);
        navItem.textContent = tab.label;
        nav.appendChild(navItem);
    });

    sidebar.appendChild(nav);
    panelElement.appendChild(sidebar);

    // Main content area
    const main = document.createElement('div');
    main.className = 'panel-main';

    // Scene Setup tab content
    const sceneTab = createSceneSetupTab();
    sceneTab.id = 'tab-scene';
    sceneTab.className = 'tab-content active';
    main.appendChild(sceneTab);

    // Sprite Creator tab content
    const spritesTab = createSpriteCreatorTab();
    spritesTab.id = 'tab-sprites';
    spritesTab.className = 'tab-content';
    main.appendChild(spritesTab);

    // Settings tab content
    const settingsTab = createSettingsTab();
    settingsTab.id = 'tab-settings';
    settingsTab.className = 'tab-content';
    main.appendChild(settingsTab);

    panelElement.appendChild(main);
    document.body.appendChild(panelElement);
}

function createSceneSetupTab() {
    const container = document.createElement('div');
    container.className = 'tab-container';

    // Header
    const header = document.createElement('div');
    header.className = 'tab-header';

    const title = document.createElement('h1');
    title.className = 'tab-title';
    title.textContent = 'Scene Setup';

    const subtitle = document.createElement('p');
    subtitle.className = 'tab-subtitle';
    subtitle.textContent = 'Configure your campfire scene';

    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'tab-body';

    // People count card
    const countCard = document.createElement('div');
    countCard.className = 'panel-card';

    const countLabel = document.createElement('h3');
    countLabel.className = 'card-label';
    countLabel.textContent = 'How many people?';
    countCard.appendChild(countLabel);

    const countButtons = document.createElement('div');
    countButtons.className = 'count-buttons';

    [2, 3, 4].forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'count-btn';
        btn.setAttribute('data-count', num);
        btn.textContent = num;
        btn.onclick = () => selectCount(num);
        countButtons.appendChild(btn);
    });

    countCard.appendChild(countButtons);
    content.appendChild(countCard);

    // Hosts card
    const hostsCard = document.createElement('div');
    hostsCard.className = 'panel-card';

    const hostsLabel = document.createElement('h3');
    hostsLabel.className = 'card-label';
    hostsLabel.textContent = 'Hosts';
    hostsCard.appendChild(hostsLabel);

    const hostsGrid = document.createElement('div');
    hostsGrid.className = 'character-grid hosts-grid';

    Object.entries(HOSTS).forEach(([id, char]) => {
        const hostCard = createCharacterCard(id, char, false);
        hostsGrid.appendChild(hostCard);
    });

    hostsCard.appendChild(hostsGrid);
    content.appendChild(hostsCard);

    // Guest drawer
    guestDrawer = document.createElement('div');
    guestDrawer.className = 'panel-card guest-drawer hidden';

    const guestHeader = document.createElement('div');
    guestHeader.className = 'card-header';

    const guestLabel = document.createElement('h3');
    guestLabel.className = 'card-label';
    guestLabel.textContent = 'Guests';
    guestHeader.appendChild(guestLabel);

    const guestHint = document.createElement('span');
    guestHint.id = 'guest-hint';
    guestHint.className = 'card-hint';
    guestHint.textContent = 'Select 1 guest';
    guestHeader.appendChild(guestHint);

    guestDrawer.appendChild(guestHeader);

    const guestGrid = document.createElement('div');
    guestGrid.className = 'character-grid guest-grid';

    Object.entries(GUESTS).forEach(([id, char]) => {
        const guestCard = createCharacterCard(id, char, true);
        guestGrid.appendChild(guestCard);
    });

    guestDrawer.appendChild(guestGrid);
    content.appendChild(guestDrawer);

    container.appendChild(content);

    // Footer with launch button
    const footer = document.createElement('div');
    footer.className = 'tab-footer';

    const launchBtn = document.createElement('button');
    launchBtn.id = 'launch-scene-btn';
    launchBtn.className = 'launch-button';
    launchBtn.textContent = 'Launch Scene';
    launchBtn.onclick = handleLaunch;
    footer.appendChild(launchBtn);

    const hint = document.createElement('p');
    hint.className = 'footer-hint';
    hint.textContent = 'Cmd+Escape to return';
    footer.appendChild(hint);

    container.appendChild(footer);

    return container;
}

function createSpriteCreatorTab() {
    const container = document.createElement('div');
    container.className = 'tab-container';

    // Header
    const header = document.createElement('div');
    header.className = 'tab-header';

    const title = document.createElement('h1');
    title.className = 'tab-title';
    title.textContent = 'Sprite Creator';

    const subtitle = document.createElement('p');
    subtitle.className = 'tab-subtitle';
    subtitle.textContent = 'Generate custom character sprites with AI';

    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Content - Form
    const content = document.createElement('div');
    content.className = 'tab-body';

    const form = document.createElement('div');
    form.className = 'sprite-form';

    // Character name input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'form-label';
    nameLabel.textContent = 'Character Name';
    nameGroup.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'character-name-input';
    nameInput.className = 'form-input';
    nameInput.placeholder = 'e.g., Sarah';
    nameGroup.appendChild(nameInput);

    form.appendChild(nameGroup);

    // Description textarea
    const descGroup = document.createElement('div');
    descGroup.className = 'form-group';

    const descLabel = document.createElement('label');
    descLabel.className = 'form-label';
    descLabel.textContent = 'Character Visual Features';
    descGroup.appendChild(descLabel);

    const descInput = document.createElement('textarea');
    descInput.id = 'character-desc-input';
    descInput.className = 'form-textarea';
    descInput.value = `• Gender:
• Hair:
• Face:
• Skin tone:
• Top:
• Bottom:
• Extras: `;
    descGroup.appendChild(descInput);

    form.appendChild(descGroup);

    // Generate button
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-sprite-btn';
    generateBtn.className = 'generate-button';
    generateBtn.textContent = 'Generate Sprite';
    generateBtn.onclick = handleGenerateSprite;
    form.appendChild(generateBtn);

    // Error/Success message area
    const messageArea = document.createElement('div');
    messageArea.id = 'sprite-message';
    messageArea.style.display = 'none';
    form.appendChild(messageArea);

    // Preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'sprite-preview-container';
    previewContainer.id = 'sprite-preview-container';

    const previewPlaceholder = document.createElement('p');
    previewPlaceholder.className = 'sprite-preview-placeholder';
    previewPlaceholder.id = 'sprite-preview-placeholder';
    previewPlaceholder.textContent = 'Generated sprite will appear here';
    previewContainer.appendChild(previewPlaceholder);

    form.appendChild(previewContainer);

    // Save button (hidden until sprite is generated)
    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-sprite-btn';
    saveBtn.className = 'save-button';
    saveBtn.textContent = 'Save & Add to Characters';
    saveBtn.style.display = 'none';
    saveBtn.onclick = handleSaveSprite;
    form.appendChild(saveBtn);

    content.appendChild(form);
    container.appendChild(content);

    return container;
}

function createSettingsTab() {
    const container = document.createElement('div');
    container.className = 'tab-container';

    // Header
    const header = document.createElement('div');
    header.className = 'tab-header';

    const title = document.createElement('h1');
    title.className = 'tab-title';
    title.textContent = 'Settings';

    const subtitle = document.createElement('p');
    subtitle.className = 'tab-subtitle';
    subtitle.textContent = 'Configure API keys and preferences';

    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'tab-body';

    // API Key card
    const apiCard = document.createElement('div');
    apiCard.className = 'panel-card';

    const apiLabel = document.createElement('h3');
    apiLabel.className = 'card-label';
    apiLabel.textContent = 'OpenRouter API Key';
    apiCard.appendChild(apiLabel);

    const apiKeyWrapper = document.createElement('div');
    apiKeyWrapper.className = 'api-key-wrapper';

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.id = 'settings-api-key-input';
    apiKeyInput.className = 'form-input';
    apiKeyInput.placeholder = 'sk-or-...';
    apiKeyInput.value = SceneConfig.getApiKey('openrouter') || '';
    apiKeyInput.onchange = () => {
        SceneConfig.setApiKey('openrouter', apiKeyInput.value);
        showSettingsMessage('API key saved');
    };
    apiKeyWrapper.appendChild(apiKeyInput);

    const apiKeyToggle = document.createElement('button');
    apiKeyToggle.className = 'api-key-toggle';
    apiKeyToggle.textContent = 'Show';
    apiKeyToggle.onclick = () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            apiKeyToggle.textContent = 'Hide';
        } else {
            apiKeyInput.type = 'password';
            apiKeyToggle.textContent = 'Show';
        }
    };
    apiKeyWrapper.appendChild(apiKeyToggle);

    apiCard.appendChild(apiKeyWrapper);

    const apiHint = document.createElement('p');
    apiHint.className = 'settings-hint';
    apiHint.textContent = 'Get your API key from openrouter.ai';
    apiCard.appendChild(apiHint);

    content.appendChild(apiCard);

    // Message area
    const messageArea = document.createElement('div');
    messageArea.id = 'settings-message';
    messageArea.className = 'success-message';
    messageArea.style.display = 'none';
    content.appendChild(messageArea);

    container.appendChild(content);

    return container;
}

function showSettingsMessage(message) {
    const messageArea = document.getElementById('settings-message');
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.style.display = 'block';
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 2000);
    }
}

async function handleGenerateSprite() {
    const apiKey = SceneConfig.getApiKey('openrouter');
    const characterName = document.getElementById('character-name-input').value.trim();
    const description = document.getElementById('character-desc-input').value.trim();
    const generateBtn = document.getElementById('generate-sprite-btn');
    const messageArea = document.getElementById('sprite-message');
    const previewContainer = document.getElementById('sprite-preview-container');
    const saveBtn = document.getElementById('save-sprite-btn');

    // Validate inputs
    if (!apiKey) {
        showMessage(messageArea, 'Please add your OpenRouter API key in Settings', 'error');
        return;
    }
    if (!characterName) {
        showMessage(messageArea, 'Please enter a character name', 'error');
        return;
    }
    if (!description) {
        showMessage(messageArea, 'Please enter a character description', 'error');
        return;
    }

    // Set loading state
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    generateBtn.textContent = '';
    saveBtn.style.display = 'none';
    hideMessage(messageArea);

    try {
        const result = await SpriteGenerator.generateSprite(apiKey, characterName, description);

        if (result.success) {
            spritePreviewUrl = result.data;

            // Show preview
            previewContainer.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.className = 'sprite-preview-image';
            previewImg.src = spritePreviewUrl;
            previewImg.alt = `Generated sprite for ${characterName}`;
            previewContainer.appendChild(previewImg);

            // Show save button
            saveBtn.style.display = 'block';

            showMessage(messageArea, 'Sprite generated successfully!', 'success');
        } else {
            showMessage(messageArea, result.error || 'Failed to generate sprite', 'error');
        }
    } catch (error) {
        console.error('Sprite generation error:', error);
        showMessage(messageArea, 'An unexpected error occurred', 'error');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        generateBtn.textContent = 'Generate Sprite';
    }
}

function handleSaveSprite() {
    const characterName = document.getElementById('character-name-input').value.trim();
    const messageArea = document.getElementById('sprite-message');

    if (!spritePreviewUrl || !characterName) {
        showMessage(messageArea, 'No sprite to save', 'error');
        return;
    }

    // Generate a safe ID from the character name
    const characterId = characterName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Save to localStorage
    const customSprites = getCustomSprites();
    customSprites[characterId] = {
        name: characterName,
        dataUrl: spritePreviewUrl,
        createdAt: new Date().toISOString()
    };
    saveCustomSprites(customSprites);

    // Add to GUESTS list for this session
    GUESTS[characterId] = {
        name: characterName,
        thumbnail: spritePreviewUrl
    };

    // Refresh the guest grid if visible
    refreshGuestGrid();

    showMessage(messageArea, `${characterName} added to available characters!`, 'success');

    // Clear form
    document.getElementById('character-name-input').value = '';
    document.getElementById('character-desc-input').value = `• Gender:
• Hair:
• Face:
• Skin tone:
• Top:
• Bottom:
• Extras: `;
    document.getElementById('sprite-preview-container').innerHTML = '<p class="sprite-preview-placeholder">Generated sprite will appear here</p>';
    document.getElementById('save-sprite-btn').style.display = 'none';
    spritePreviewUrl = null;
}

function getCustomSprites() {
    try {
        const stored = localStorage.getItem('campfire-custom-sprites');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

function saveCustomSprites(sprites) {
    try {
        localStorage.setItem('campfire-custom-sprites', JSON.stringify(sprites));
    } catch (e) {
        console.error('Failed to save custom sprites:', e);
    }
}

function loadCustomSpritesToGuests() {
    const customSprites = getCustomSprites();
    Object.entries(customSprites).forEach(([id, sprite]) => {
        GUESTS[id] = {
            name: sprite.name,
            thumbnail: sprite.dataUrl
        };
    });
}

function refreshGuestGrid() {
    const guestGrid = document.querySelector('.guest-grid');
    if (!guestGrid) return;

    guestGrid.innerHTML = '';
    Object.entries(GUESTS).forEach(([id, char]) => {
        const guestCard = createCharacterCard(id, char, true);
        guestGrid.appendChild(guestCard);
    });
    updateGuestSelection();
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type === 'error' ? 'error-message' : 'success-message';
    element.style.display = 'block';
}

function hideMessage(element) {
    element.style.display = 'none';
}

function switchTab(tabId) {
    currentTab = tabId;

    // Update nav items
    panelElement.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });

    // Update tab content
    panelElement.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });
}

function createCharacterCard(id, char, isGuest) {
    const card = document.createElement('div');
    card.className = 'character-item' + (isGuest ? '' : ' host-card');
    card.setAttribute('data-character', id);

    if (isGuest) {
        card.onclick = (e) => {
            // Don't toggle if clicking delete button
            if (e.target.classList.contains('delete-guest-btn')) return;
            toggleGuest(id);
        };
    }

    // Add delete button for custom guests (not built-in)
    const isCustomGuest = isGuest && !BUILT_IN_GUESTS.includes(id);
    if (isCustomGuest) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-guest-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteGuest(id);
        };
        card.appendChild(deleteBtn);
    }

    const preview = document.createElement('div');
    preview.className = 'character-preview';
    preview.style.backgroundImage = `url(${char.thumbnail})`;
    preview.style.backgroundPosition = '0 0';
    preview.style.backgroundSize = '400% 200%';

    const name = document.createElement('span');
    name.className = 'character-name';
    name.textContent = char.name;

    card.appendChild(preview);
    card.appendChild(name);

    return card;
}

function deleteGuest(guestId) {
    // Remove from GUESTS
    delete GUESTS[guestId];

    // Remove from localStorage
    const customSprites = getCustomSprites();
    delete customSprites[guestId];
    saveCustomSprites(customSprites);

    // Remove from selected guests if selected
    const index = selectedGuests.indexOf(guestId);
    if (index > -1) {
        selectedGuests.splice(index, 1);
    }

    // Refresh the guest grid
    refreshGuestGrid();
    updateLaunchButton();
    saveSelection();

    console.log(`ScenePanel: Deleted custom guest "${guestId}"`);
}

function selectCount(count) {
    panelElement.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.getAttribute('data-count')) === count);
    });

    const guestsNeeded = count - 2;

    if (guestsNeeded > 0) {
        guestDrawer.classList.remove('hidden');
        document.getElementById('guest-hint').textContent =
            guestsNeeded === 1 ? 'Select 1 guest' : `Select ${guestsNeeded} guests`;
    } else {
        guestDrawer.classList.add('hidden');
        selectedGuests = [];
        updateGuestSelection();
    }

    selectedGuestCount = guestsNeeded;

    if (selectedGuests.length > guestsNeeded) {
        selectedGuests = selectedGuests.slice(0, guestsNeeded);
        updateGuestSelection();
    }

    updateLaunchButton();
    saveSelection();
}

function toggleGuest(guestId) {
    const index = selectedGuests.indexOf(guestId);

    if (index > -1) {
        selectedGuests.splice(index, 1);
    } else {
        if (selectedGuests.length < selectedGuestCount) {
            selectedGuests.push(guestId);
        } else if (selectedGuestCount === 1) {
            selectedGuests = [guestId];
        }
    }

    updateGuestSelection();
    updateLaunchButton();
    saveSelection();
}

function updateGuestSelection() {
    panelElement.querySelectorAll('.guest-grid .character-item').forEach(card => {
        const charId = card.getAttribute('data-character');
        card.classList.toggle('selected', selectedGuests.includes(charId));
    });
}

function updateLaunchButton() {
    const launchBtn = document.getElementById('launch-scene-btn');
    const selectedCount = document.querySelector('.count-btn.selected');
    const isValid = selectedCount && (selectedGuestCount === 0 || selectedGuests.length === selectedGuestCount);
    launchBtn.disabled = !isValid;
}

function saveSelection() {
    const characters = ['pete', 'andy', ...selectedGuests];
    if (characters.length >= 2) {
        console.log("ScenePanel: Saving selection:", characters);
        SceneConfig.setSelectedCharacters(characters);
    }
}

function loadSavedSelection() {
    const saved = SceneConfig.getSelectedCharacters();
    const count = saved.length;

    if (count >= 2 && count <= 4) {
        selectCount(count);
        selectedGuests = saved.filter(id => id !== 'pete' && id !== 'andy');
        updateGuestSelection();
    } else {
        selectCount(2);
    }

    updateLaunchButton();
}

function handleLaunch() {
    const characters = ['pete', 'andy', ...selectedGuests];

    if (characters.length < 2) {
        return;
    }

    console.log("ScenePanel: Launching with characters:", characters);
    hide();

    if (onLaunchCallback) {
        onLaunchCallback(characters);
    }
}

export function setupReturnShortcut(onReturn) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            console.log("ScenePanel: Return shortcut triggered");
            if (onReturn) {
                onReturn();
            }
        }
    });
}
