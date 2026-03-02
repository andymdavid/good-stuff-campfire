// ScenePanel.js - Home screen panel for scene configuration

import * as SceneConfig from './SceneConfig.js';

let panelElement = null;
let onLaunchCallback = null;
let guestDrawer = null;
let selectedGuestCount = 0;
let selectedGuests = [];

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

    const content = document.createElement('div');
    content.className = 'panel-content';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'The Good Stuff Campfire';
    title.className = 'panel-title';
    content.appendChild(title);

    // People count selector
    const countSection = document.createElement('div');
    countSection.className = 'count-section';

    const countLabel = document.createElement('h2');
    countLabel.textContent = 'How many people?';
    countLabel.className = 'section-label';
    countSection.appendChild(countLabel);

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

    countSection.appendChild(countButtons);
    content.appendChild(countSection);

    // Hosts section (always visible)
    const hostsSection = document.createElement('div');
    hostsSection.className = 'hosts-section';

    const hostsLabel = document.createElement('h2');
    hostsLabel.textContent = 'Hosts';
    hostsLabel.className = 'section-label';
    hostsSection.appendChild(hostsLabel);

    const hostsGrid = document.createElement('div');
    hostsGrid.className = 'character-grid hosts-grid';

    Object.entries(HOSTS).forEach(([id, char]) => {
        const hostCard = createCharacterCard(id, char, false);
        hostsGrid.appendChild(hostCard);
    });

    hostsSection.appendChild(hostsGrid);
    content.appendChild(hostsSection);

    // Guest drawer (hidden by default)
    guestDrawer = document.createElement('div');
    guestDrawer.className = 'guest-drawer hidden';

    const guestHeader = document.createElement('div');
    guestHeader.className = 'guest-header';

    const guestLabel = document.createElement('h2');
    guestLabel.textContent = 'Select Guest(s)';
    guestLabel.className = 'section-label';
    guestHeader.appendChild(guestLabel);

    const guestHint = document.createElement('span');
    guestHint.id = 'guest-hint';
    guestHint.className = 'guest-hint';
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
    // Update button states
    panelElement.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.getAttribute('data-count')) === count);
    });

    const guestsNeeded = count - 2;

    // Show/hide guest drawer
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

    // Trim guests if we reduced the count
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
        // Deselect
        selectedGuests.splice(index, 1);
    } else {
        // Select (if we haven't reached the limit)
        if (selectedGuests.length < selectedGuestCount) {
            selectedGuests.push(guestId);
        } else if (selectedGuestCount === 1) {
            // For single guest, replace the selection
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
    const totalPeople = 2 + selectedGuestCount;
    const selectedCount = document.querySelector('.count-btn.selected');

    // Enable if: count is selected AND (no guests needed OR correct number of guests selected)
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

    // Determine count from saved selection
    const count = saved.length;
    if (count >= 2 && count <= 4) {
        selectCount(count);

        // Load guests (everything except pete and andy)
        selectedGuests = saved.filter(id => id !== 'pete' && id !== 'andy');
        updateGuestSelection();
    } else {
        // Default to 2
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

// Keyboard shortcut handler for returning to panel
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
