// ScenePanel.js - Home screen panel for scene configuration

import * as SceneConfig from './SceneConfig.js';

let panelElement = null;
let onLaunchCallback = null;
let guestDrawer = null;
let selectedGuestCount = 0;
let selectedGuests = [];
let currentTab = 'scene';

// Hosts (always included)
const HOSTS = {
    pete: { name: 'Pete', thumbnail: 'images/PeteSprite.png' },
    andy: { name: 'Andy', thumbnail: 'images/AndySprite.png' }
};

// Available guests
const GUESTS = {
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
        { id: 'sprites', label: 'Sprite Creator' }
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

    // Sprite Creator tab content (placeholder)
    const spritesTab = createSpriteCreatorTab();
    spritesTab.id = 'tab-sprites';
    spritesTab.className = 'tab-content';
    main.appendChild(spritesTab);

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
    subtitle.textContent = 'Generate custom character sprites';

    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Placeholder content
    const content = document.createElement('div');
    content.className = 'tab-body';

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-card';

    const placeholderIcon = document.createElement('div');
    placeholderIcon.className = 'placeholder-icon';
    placeholderIcon.textContent = '';

    const placeholderText = document.createElement('p');
    placeholderText.className = 'placeholder-text';
    placeholderText.textContent = 'Coming soon';

    placeholder.appendChild(placeholderIcon);
    placeholder.appendChild(placeholderText);
    content.appendChild(placeholder);

    container.appendChild(content);

    return container;
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
        card.onclick = () => toggleGuest(id);
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
