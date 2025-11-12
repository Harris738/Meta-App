<<<<<<< HEAD
// ===================================================
// 1. GLOBALE VARIABLEN & HTML-Element-Selektion
// ===================================================

let weaponData = []; 
let currentWeaponList = []; 
let currentMainGame = 'warzone'; 
let currentActiveGame = 'warzone'; 

const CURRENT_APP_VERSION = "1.0.3"; // ✅ AKTUELLE BASISVERSION FÜR KONTROLLE

let newWorker; // Globale Variable für den Service Worker

const weaponList = document.getElementById('weapon-list');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const appTitle = document.getElementById('app-title'); 
const bf6SubTabsContainer = document.getElementById('bf6-sub-tabs'); 
const controlsArea = document.querySelector('.controls-area'); 
const updateToast = document.getElementById('update-toast');

const FAVORITES_KEY = 'wzMetaFavorites';

// Map für dynamische Titel (für den BF6 Hub)
const gameTitleMap = {
    'warzone': 'Warzone',
    'bo7': 'Black Ops 7',
    'bf6_redsec': 'BF6 | RedSec',
    'bf6_multiplayer': 'BF6 | Multiplayer'
};

// ===================================================
// NEUE FUNKTION: THEME-KLASSE AKTUALISIEREN
// ===================================================

/**
 * Aktualisiert die Klasse auf dem Body-Tag, um spielspezifisches Styling anzuwenden.
 */
function updateThemeClass(gameName) {
    const body = document.body;
    
    // Entferne alle alten Spiel-Klassen
    body.classList.remove('game-warzone-active', 'game-bo7-active', 'game-bf6-active');

    // Füge die neue Klasse hinzu
    if (gameName === 'warzone') {
        body.classList.add('game-warzone-active');
    } else if (gameName === 'bo7') {
        body.classList.add('game-bo7-active');
    } else if (gameName === 'bf6') {
        body.classList.add('game-bf6-active');
    }
}


// ===================================================
// 2. FAVORITEN-FUNKTIONEN (Local Storage)
// ===================================================
function loadFavorites() {
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return new Set(favoritesJson ? JSON.parse(favoritesJson) : []);
}

function saveFavorites(favoritesSet) {
    const favoritesArray = Array.from(favoritesSet);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesArray));
}

function isFavorite(weaponName) {
    return loadFavorites().has(weaponName);
}

function toggleFavorite(weaponName) {
    const favorites = loadFavorites();
    
    if (favorites.has(weaponName)) {
        favorites.delete(weaponName);
    } else {
        favorites.add(weaponName);
    }
    
    saveFavorites(favorites);
    
    const currentActiveFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
    
    // Neu rendern basierend auf dem aktuellen Filter und Spiel
    if (currentActiveFilter === 'favorites') {
        renderFavorites(); 
    } else if (currentActiveFilter === 'all') {
        filterAndSearch();
    }
}


// ===================================================
// 3. DATENLADE-FUNKTION (Asynchron & Initialisierung)
// ===================================================

async function loadMetaWeapons() {
    try {
        const response = await fetch('./meta-data.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json(); 
        
        // Versions-Check ausführen
        checkAppVersion(data.appVersion);
        
        weaponData = data.weapons || []; // Speichere nur die Waffendaten
        
        setupThemeToggle();
        initializeApp(); 
        loadInitialWarzoneState();
        
    } catch (e) {
        console.error("Fehler beim Laden der Waffendaten:", e);
        if (weaponList) {
             weaponList.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">FEHLER: Die Meta-Daten konnten nicht geladen werden. Prüfe die meta-data.json.</p>';
        }
    }
}


// ===================================================
// 4. RENDER-FUNKTIONEN (Start Hub, Meta Liste)
// ===================================================

function toggleLoadout(button) {
    const card = button.closest('.weapon-card');
    card.classList.toggle('expanded');
    const icon = button.querySelector('i');
    if (card.classList.contains('expanded')) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

function toggleStartHubLoadout(button) {
    const container = button.closest('.start-hub-weapon-card');
    const icon = container.querySelector('.start-toggle-btn i'); 

    const isExpanded = container.classList.toggle('expanded');
    
    if (isExpanded) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        container.querySelector('.start-loadout-details').classList.add('visible');
    } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        container.querySelector('.start-loadout-details').classList.remove('visible');
    }
}


function renderStartHub() {
    if (!weaponList) return; 

    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);

    const sortedWeapons = [...activeGameWeapons].sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));
    const top3Weapons = sortedWeapons.slice(0, 3);
    
    const totalWeapons = activeGameWeapons.length;
    const absoluteMetaCount = activeGameWeapons.filter(w => parseFloat(w.pick) >= 5.0).length;
    
    const favoriteNames = loadFavorites();
    const favoriteCount = activeGameWeapons.filter(w => favoriteNames.has(w.name)).length;


    const gameTitle = gameTitleMap[currentActiveGame] || 'Meta Hub';

    let htmlContent = `
        <div class="start-hub-container">
            <h2 style="color: var(--dynamic-primary-color); margin-bottom: 25px; text-align: center;">Deine ${gameTitle} Meta-Übersicht</h2>
            
            <div class="stat-grid">
                <div class="stat-card" style="border-left: 3px solid var(--dynamic-primary-color);">
                    <p class="stat-value">${totalWeapons}</p>
                    <p class="stat-label">Verfügbare Loadouts</p>
                </div>
                <div class="stat-card" style="border-left: 3px solid var(--dynamic-primary-color);">
                    <p class="stat-value">${absoluteMetaCount}</p>
                    <p class="stat-label">Absolute Meta</p>
                </div>
                <div class="stat-card" style="border-left: 3px solid var(--favorite-color);">
                    <p class="stat-value">${favoriteCount}</p>
                    <p class="stat-label">Deine Favoriten</p>
                </div>
            </div>
    `;
    
    if (top3Weapons.length === 0) {
        htmlContent += `<h3 style="text-align: center; margin-top: 30px; color: var(--subtle-text);">Noch keine Top-Waffen für ${gameTitle} verfügbar.</h3>`;
    } else {
        htmlContent += `
            <h3 class="meta-section-title">TOP 3 WAFFEN DER META</h3>
            <div class="top-3-container" id="top-3-container">
        `;
        
        top3Weapons.forEach((weapon, index) => {
            const tierColor = index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32';
            
            const loadoutHtml = weapon.loadout.map(item => 
                `<div class="loadout-item-start">
                    <span class="slot">${item.slot}:</span>
                    <span class="attachment">${item.name}</span>
                </div>`
            ).join('');
            
            htmlContent += `
                <div class="start-hub-weapon-card">
                    
                    <div class="start-card-header" data-weapon-index="${index}">
                        <span class="ranking-number" style="color: ${tierColor};">${index + 1}.</span>
                        <div class="start-weapon-info">
                            <p class="weapon-name">${weapon.name}</p>
                            <p class="weapon-details">${weapon.category} | Tier ${weapon.tier}</p>
                        </div>
                        <span class="pick-rate-display">${weapon.pick}%</span>
                        <button class="start-toggle-btn" title="Loadout anzeigen">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    
                    <div class="start-loadout-details">
                        <h4>Bestes Loadout:</h4>
                        <div class="loadout-list-start">
                            ${loadoutHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        htmlContent += `</div>`;
    }

    htmlContent += `
             <p class="start-tip">
                 Für eine vollständige Liste und Loadouts, wechsle zum **Meta-Tab**.
             </p>
        </div>
    `;

    weaponList.innerHTML = htmlContent;
    currentWeaponList = [];
    
    document.querySelectorAll('.start-toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleStartHubLoadout(e.currentTarget);
        });
    });
}


function renderWeapons(weapons) {
    if (!weaponList) return; 
    weaponList.innerHTML = ''; 

    const filteredWeaponsByGame = weapons.filter(w => w.game === currentActiveGame);

    if (filteredWeaponsByGame.length === 0) {
        const gameName = gameTitleMap[currentActiveGame] || 'Spiel';
        weaponList.innerHTML = `<p style="text-align: center; padding: 20px;">Keine ${gameName} Waffen gefunden, die den Kriterien entsprechen.</p>`;
        currentWeaponList = []; 
        return;
    }

    filteredWeaponsByGame.sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));

    const absoluteMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) >= 5.0);
    const regularMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) < 5.0);

    function appendWeapons(weaponArray, title) {
        if (weaponArray.length > 0) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'meta-section-title';
            titleElement.textContent = title;
            weaponList.appendChild(titleElement);

            weaponArray.forEach(weapon => {
                const isFav = isFavorite(weapon.name);
                const favIcon = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                
                const loadoutHtml = weapon.loadout.map(item => 
                    `<div class="loadout-item">
                        <span class="slot">${item.slot}:</span>
                        <span class="attachment">${item.name}</span>
                    </div>`
                ).join('');

                const weaponElement = document.createElement('div');
                weaponElement.className = `weapon-card tier-${weapon.tier.toLowerCase().replace('-', '').replace(' ', '')}`; 
                weaponElement.innerHTML = `
                    <div class="header">
                        <h2>${weapon.name}</h2>
                        
                        <div style="display: flex; align-items: center;">
                            <span class="pick-rate-label pick-rate-inline">${weapon.pick}%</span>
                            <button class="toggle-loadout-btn" title="Loadout anzeigen/ausblenden">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <span class="category-label">${weapon.category}</span>
                    </div>

                    <div class="loadout-container">
                        <div class="details">
                            <span class="type">${weapon.type}</span> | 
                            <span class="tier">${weapon.tier}</span>
                        </div>

                        <h3>Bestes Loadout:</h3>
                        <div class="loadout-grid">
                            ${loadoutHtml}
                        </div>
                    </div>
                `;
                
                weaponElement.querySelector('.toggle-loadout-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    toggleLoadout(e.currentTarget); 
                });

                weaponElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    toggleFavorite(weapon.name);
                });
                
                weaponList.appendChild(weaponElement);
            });
        }
    }

    appendWeapons(absoluteMeta, 'ABSOLUTE META');
    appendWeapons(regularMeta, 'META');
    
    currentWeaponList = filteredWeaponsByGame; 
}


function renderFavorites() {
    const favoriteNames = loadFavorites();
    
    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);
    const favorites = activeGameWeapons.filter(weapon => favoriteNames.has(weapon.name));
    
    if (favorites.length === 0) {
        const gameName = gameTitleMap[currentActiveGame] || 'Spiel';
        weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Du hast noch keine ${gameName} Favoriten gespeichert.</h2>`;
        currentWeaponList = []; 
        return;
    }
    
    weaponList.innerHTML = '';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'meta-section-title';
    titleElement.textContent = `DEINE FAVORITEN (${gameTitleMap[currentActiveGame].toUpperCase()})`;
    weaponList.appendChild(titleElement);
    
    favorites.forEach(weapon => {
        const isFav = isFavorite(weapon.name);
        const favIcon = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        
        const loadoutHtml = weapon.loadout.map(item => 
            `<div class="loadout-item">
                <span class="slot">${item.slot}:</span>
                <span class="attachment">${item.name}</span>
            </div>`
        ).join('');

        const weaponElement = document.createElement('div');
        weaponElement.className = `weapon-card tier-${weapon.tier.toLowerCase().replace('-', '').replace(' ', '')}`;
        weaponElement.innerHTML = `
            <div class="header">
                <h2>${weapon.name}</h2>
                
                <div style="display: flex; align-items: center;">
                    <span class="pick-rate-label pick-rate-inline">${weapon.pick}%</span>
                    <button class="toggle-loadout-btn" title="Loadout anzeigen/ausblenden">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                </div>
            </div>
            
            <div class="info-row">
                <span class="category-label">${weapon.category}</span>
            </div>

            <div class="loadout-container">
                <div class="details">
                    <span class="type">${weapon.type}</span> | 
                    <span class="tier">${weapon.tier}</span>
                </div>

                <h3>Bestes Loadout:</h3>
                <div class="loadout-grid">
                    ${loadoutHtml}
                </div>
            </div>
        `;

        weaponElement.querySelector('.toggle-loadout-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleLoadout(e.currentTarget);
        });

        weaponElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavorite(weapon.name);
        });
        
        weaponList.appendChild(weaponElement);
    });
    
    currentWeaponList = favorites;
}


// ===================================================
// 5. FILTER & SUCHLOGIK
// ===================================================

function resetFilterDropdown() { 
    if (filterCategory) {
        filterCategory.value = 'all'; 
    }
}


function filterAndSearch() {
    const currentActiveFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
    
    let baseList = weaponData.filter(weapon => weapon.game === currentActiveGame);
    
    if (currentActiveFilter === 'favorites') {
        const favoriteNames = loadFavorites();
        baseList = baseList.filter(weapon => favoriteNames.has(weapon.name)); 
    } 
    
    if (!baseList || baseList.length === 0) {
        renderWeapons([]);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = filterCategory.value;

    const filteredWeapons = baseList.filter(weapon => { 
        const matchesSearch = weapon.name.toLowerCase().includes(searchTerm) || 
                              weapon.category.toLowerCase().includes(searchTerm) ||
                              weapon.type.toLowerCase().includes(searchTerm) ||
                              weapon.tier.toLowerCase().includes(searchTerm) ||
                              weapon.loadout.some(l => l.name.toLowerCase().includes(searchTerm));

        const matchesCategory = selectedCategory === 'all' || weapon.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderWeapons(filteredWeapons);
}


// ===================================================
// 6. NAVIGATION LOGIK (MAIN TABS & SUB TABS)
// ===================================================

function updateTitleAndContent(filter) {
    
    if (filter === 'start') {
        if (appTitle) appTitle.textContent = 'Übersicht'; 
        renderStartHub(); 
        if (controlsArea) controlsArea.style.display = 'none';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';
    } else if (filter === 'favorites') {
        if (appTitle) appTitle.textContent = 'Favoriten';
        renderFavorites(); 
        if (controlsArea) controlsArea.style.display = 'flex';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = (currentMainGame === 'bf6') ? 'flex' : 'none';
    } else if (filter === 'all') {
        if (appTitle) appTitle.textContent = 'Meta-Ranking'; 
        filterAndSearch(); 
        if (controlsArea) controlsArea.style.display = 'flex';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = (currentMainGame === 'bf6') ? 'flex' : 'none';
    } else {
        const tabName = document.querySelector('.bottom-nav .nav-item[data-filter="community"] span')?.textContent || 'Community';
        if (appTitle) appTitle.textContent = tabName; 
        weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Inhalt für den Tab: ${tabName}</h2>`;
        if (controlsArea) controlsArea.style.display = 'none';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';
    }
}


function setupBottomNav() {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            
            resetFilterDropdown(); 
            updateTitleAndContent(filter);
        });
    });
}


function setupGameTabs() {
    const gameTabs = document.querySelectorAll('.app-header .game-tab');

    gameTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            
            gameTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const newMainGame = tab.getAttribute('data-game');
            currentMainGame = newMainGame; // Setze den aktiven Haupt-Tab
            
            // NEU: Theme-Klasse setzen
            updateThemeClass(newMainGame);

            // BF6 Logik
            if (newMainGame === 'bf6') {
                currentActiveGame = 'bf6_redsec';
                if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'flex';
                document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-game-mode="bf6_redsec"]').classList.add('active');
            } else {
                currentActiveGame = newMainGame;
            }
            
            const currentBottomFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');

            updateTitleAndContent(currentBottomFilter);
        });
    });
    
    // Listener für BF6 Sub-Tabs
    if (bf6SubTabsContainer) {
        document.querySelectorAll('.sub-tab').forEach(subTab => {
            subTab.addEventListener('click', (e) => {
                const newSubGameMode = e.currentTarget.getAttribute('data-game-mode');
                if (newSubGameMode === currentActiveGame) return;
                
                currentActiveGame = newSubGameMode; 
                
                document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                document.querySelector(`.sub-tab[data-game-mode="${newSubGameMode}"]`).classList.add('active');

                const currentBottomFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
                updateTitleAndContent(currentBottomFilter);
            });
        });
    }
}


// Stellt den initialen Zustand her (Warzone / Start Hub)
function loadInitialWarzoneState() {
    currentMainGame = 'warzone';
    currentActiveGame = 'warzone';
    
    // NEU: Theme-Klasse initial setzen
    updateThemeClass('warzone');
    
    const warzoneTab = document.querySelector('.app-header .game-tab[data-game="warzone"]');
    if (warzoneTab) { 
        document.querySelectorAll('.app-header .game-tab').forEach(t => t.classList.remove('active'));
        warzoneTab.classList.add('active');
    }
    if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';

    const startTab = document.querySelector('.bottom-nav .nav-item[data-filter="start"]');
    if (startTab) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
        startTab.classList.add('active'); 
    }

    if (controlsArea) controlsArea.style.display = 'none'; 

    if (appTitle) appTitle.textContent = 'Übersicht'; 
    renderStartHub(); 
}


// ===================================================
// 7. DARK / LIGHT MODE FUNKTIONALITÄT
// ===================================================
function setupThemeToggle() {
    const settingsButton = document.querySelector('.settings-button');
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal || !settingsButton) return; 

    const closeButton = settingsModal.querySelector('.close-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    settingsButton.addEventListener('click', () => {
        // Versionsnummer im Modal setzen
        const versionDisplay = settingsModal.querySelector('#app-version-display');
        if (versionDisplay) { // Sicherheitsprüfung nach HTML-Fix
            versionDisplay.textContent = `App Version: ${CURRENT_APP_VERSION}`;
        }
        
        settingsModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        darkModeToggle.checked = false; 
    } else {
        body.classList.remove('light-mode');
        darkModeToggle.checked = true; 
        if (!savedTheme) localStorage.setItem('theme', 'dark'); 
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}


// ===================================================
// 8. INITIALISIERUNG
// ===================================================

function initializeApp() {
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);
    if (filterCategory) filterCategory.addEventListener('change', filterAndSearch);

    setupBottomNav(); 
    setupGameTabs();
}

// ===================================================
// 9. Versionskontrolle & Update-Toast
// ===================================================

/**
 * Vergleicht die lokale App-Version mit der in den Daten gespeicherten Version.
 * Zeigt bei Unterschied den Update-Toast an.
 * @param {string} latestVersion - Die Versionsnummer aus meta-data.json
 */
function checkAppVersion(latestVersion) {
    // Einfacher Vergleich der Versions-Strings
    if (latestVersion && latestVersion !== CURRENT_APP_VERSION) {
        showUpdateToast(latestVersion);
    }
}

/**
 * Zeigt den schwebenden Update-Toast an.
 * @param {string} newVersion - Die neue verfügbare Versionsnummer.
 */
function showUpdateToast(newVersion) {
    if (!updateToast) return;
    
    // Nachricht im Toast aktualisieren
    const message = updateToast.querySelector('#toast-message');
    if (message) {
        message.textContent = `Neue App-Version ${newVersion} verfügbar. Bitte neu laden.`;
    }
    
    // CSS-Klasse hinzufügen, um den Toast einzublenden
    updateToast.classList.add('show');
    
    // Listener für den Reload-Button hinzufügen
    const reloadButton = updateToast.querySelector('#reload-button');
    if (reloadButton) {
        // Sicherstellen, dass keine alten Listener existieren
        const newReloadHandler = () => {
            // Befehl an den wartenden Service Worker senden
            if (newWorker) {
                console.log("Sende 'skipWaiting' an den neuen Service Worker.");
                newWorker.postMessage({ action: 'skipWaiting' });
            }
            
            // Toast sofort ausblenden
            updateToast.classList.remove('show');
            
            // ✅ KORREKTUR: Fallback-Reload nach 3 Sekunden
            // Wenn der controllerchange Listener in der PWA-Umgebung fehlschlägt,
            // erzwingen wir eine späte Neuladung als Fallback.
            setTimeout(() => {
                 console.log("Fallback-Reload nach 3 Sekunden ausgelöst.");
                 window.location.reload(true); // true forces reload from server
            }, 3000);
            
            // WICHTIG: KEIN window.location.reload() HIER! Das macht der controllerchange-Listener.
        };

        // Alten EventListener entfernen (falls vorhanden) und den neuen hinzufügen
        reloadButton.removeEventListener('click', reloadButton.oldHandler);
        reloadButton.addEventListener('click', newReloadHandler);
        reloadButton.oldHandler = newReloadHandler; 
    }
}


// ===================================================
// 10. Service Worker Registrierung & Update-Handler
// ===================================================

if ('serviceWorker' in navigator) {
    // ✅ KORREKTUR VOM VORHERIGEN SCHRITT: Controllerchange-Listener nach oben verschoben.
    // Dieser Listener löst das Neuladen aus, nachdem skipWaiting erfolgreich war.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("Service Worker-Controller gewechselt. Lade Seite neu...");
        // Wenn der Controller wechselt (nach skipWaiting), lade neu.
        window.location.reload();
    });
    
    // Registriere oder hole die existierende Registrierung
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            console.log('Service Worker erfolgreich registriert:', reg);
            
            // Erzwinge die sofortige Update-Prüfung beim App-Start.
            reg.update();

            // WICHTIG: Wenn ein Update gefunden wird (neue .js oder .html gecacht), den Worker speichern
            reg.onupdatefound = () => {
                newWorker = reg.installing; // Den neuen, installierenden Worker speichern

                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // Ein neuer Service Worker ist installiert und wartet.
                            // Das App-Update (Toast) wird durch checkAppVersion ausgelöst.
                            console.log("Neuer Service Worker installiert. Warte auf meta-data.json Check.");
                        } else {
                            // Erster Besuch: Worker ist aktiv.
                            console.log("Inhalt ist nun für Offline-Nutzung gecacht.");
                        }
                    }
                };
            };
        })
        .catch(error => {
            console.error('Service Worker Registrierung fehlgeschlagen:', error);
        });
}


document.addEventListener('DOMContentLoaded', loadMetaWeapons);
=======
// ===================================================
// 1. GLOBALE VARIABLEN & HTML-Element-Selektion
// ===================================================

let weaponData = []; 
let currentWeaponList = []; 
let currentMainGame = 'warzone'; 
let currentActiveGame = 'warzone'; 

const CURRENT_APP_VERSION = "1.0.2"; // ✅ AKTUELLE BASISVERSION FÜR KONTROLLE

let newWorker; // Globale Variable für den Service Worker

const weaponList = document.getElementById('weapon-list');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const appTitle = document.getElementById('app-title'); 
const bf6SubTabsContainer = document.getElementById('bf6-sub-tabs'); 
const controlsArea = document.querySelector('.controls-area'); 
const updateToast = document.getElementById('update-toast');

const FAVORITES_KEY = 'wzMetaFavorites';

// Map für dynamische Titel (für den BF6 Hub)
const gameTitleMap = {
    'warzone': 'Warzone',
    'bo7': 'Black Ops 7',
    'bf6_redsec': 'BF6 | RedSec',
    'bf6_multiplayer': 'BF6 | Multiplayer'
};

// ===================================================
// NEUE FUNKTION: THEME-KLASSE AKTUALISIEREN
// ===================================================

/**
 * Aktualisiert die Klasse auf dem Body-Tag, um spielspezifisches Styling anzuwenden.
 */
function updateThemeClass(gameName) {
    const body = document.body;
    
    // Entferne alle alten Spiel-Klassen
    body.classList.remove('game-warzone-active', 'game-bo7-active', 'game-bf6-active');

    // Füge die neue Klasse hinzu
    if (gameName === 'warzone') {
        body.classList.add('game-warzone-active');
    } else if (gameName === 'bo7') {
        body.classList.add('game-bo7-active');
    } else if (gameName === 'bf6') {
        body.classList.add('game-bf6-active');
    }
}


// ===================================================
// 2. FAVORITEN-FUNKTIONEN (Local Storage)
// ===================================================
function loadFavorites() {
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return new Set(favoritesJson ? JSON.parse(favoritesJson) : []);
}

function saveFavorites(favoritesSet) {
    const favoritesArray = Array.from(favoritesSet);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesArray));
}

function isFavorite(weaponName) {
    return loadFavorites().has(weaponName);
}

function toggleFavorite(weaponName) {
    const favorites = loadFavorites();
    
    if (favorites.has(weaponName)) {
        favorites.delete(weaponName);
    } else {
        favorites.add(weaponName);
    }
    
    saveFavorites(favorites);
    
    const currentActiveFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
    
    // Neu rendern basierend auf dem aktuellen Filter und Spiel
    if (currentActiveFilter === 'favorites') {
        renderFavorites(); 
    } else if (currentActiveFilter === 'all') {
        filterAndSearch();
    }
}


// ===================================================
// 3. DATENLADE-FUNKTION (Asynchron & Initialisierung)
// ===================================================

async function loadMetaWeapons() {
    try {
        const response = await fetch('./meta-data.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json(); 
        
        // Versions-Check ausführen
        checkAppVersion(data.appVersion);
        
        weaponData = data.weapons || []; // Speichere nur die Waffendaten
        
        setupThemeToggle();
        initializeApp(); 
        loadInitialWarzoneState();
        
    } catch (e) {
        console.error("Fehler beim Laden der Waffendaten:", e);
        if (weaponList) {
             weaponList.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">FEHLER: Die Meta-Daten konnten nicht geladen werden. Prüfe die meta-data.json.</p>';
        }
    }
}


// ===================================================
// 4. RENDER-FUNKTIONEN (Start Hub, Meta Liste)
// ===================================================

function toggleLoadout(button) {
    const card = button.closest('.weapon-card');
    card.classList.toggle('expanded');
    const icon = button.querySelector('i');
    if (card.classList.contains('expanded')) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

function toggleStartHubLoadout(button) {
    const container = button.closest('.start-hub-weapon-card');
    const icon = container.querySelector('.start-toggle-btn i'); 

    const isExpanded = container.classList.toggle('expanded');
    
    if (isExpanded) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        container.querySelector('.start-loadout-details').classList.add('visible');
    } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        container.querySelector('.start-loadout-details').classList.remove('visible');
    }
}


function renderStartHub() {
    if (!weaponList) return; 

    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);

    const sortedWeapons = [...activeGameWeapons].sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));
    const top3Weapons = sortedWeapons.slice(0, 3);
    
    const totalWeapons = activeGameWeapons.length;
    const absoluteMetaCount = activeGameWeapons.filter(w => parseFloat(w.pick) >= 5.0).length;
    
    const favoriteNames = loadFavorites();
    const favoriteCount = activeGameWeapons.filter(w => favoriteNames.has(w.name)).length;


    const gameTitle = gameTitleMap[currentActiveGame] || 'Meta Hub';

    let htmlContent = `
        <div class="start-hub-container">
            <h2 style="color: var(--dynamic-primary-color); margin-bottom: 25px; text-align: center;">Deine ${gameTitle} Meta-Übersicht</h2>
            
            <div class="stat-grid">
                <div class="stat-card" style="border-left: 3px solid var(--dynamic-primary-color);">
                    <p class="stat-value">${totalWeapons}</p>
                    <p class="stat-label">Verfügbare Loadouts</p>
                </div>
                <div class="stat-card" style="border-left: 3px solid var(--dynamic-primary-color);">
                    <p class="stat-value">${absoluteMetaCount}</p>
                    <p class="stat-label">Absolute Meta</p>
                </div>
                <div class="stat-card" style="border-left: 3px solid var(--favorite-color);">
                    <p class="stat-value">${favoriteCount}</p>
                    <p class="stat-label">Deine Favoriten</p>
                </div>
            </div>
    `;
    
    if (top3Weapons.length === 0) {
        htmlContent += `<h3 style="text-align: center; margin-top: 30px; color: var(--subtle-text);">Noch keine Top-Waffen für ${gameTitle} verfügbar.</h3>`;
    } else {
        htmlContent += `
            <h3 class="meta-section-title">TOP 3 WAFFEN DER META</h3>
            <div class="top-3-container" id="top-3-container">
        `;
        
        top3Weapons.forEach((weapon, index) => {
            const tierColor = index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32';
            
            const loadoutHtml = weapon.loadout.map(item => 
                `<div class="loadout-item-start">
                    <span class="slot">${item.slot}:</span>
                    <span class="attachment">${item.name}</span>
                </div>`
            ).join('');
            
            htmlContent += `
                <div class="start-hub-weapon-card">
                    
                    <div class="start-card-header" data-weapon-index="${index}">
                        <span class="ranking-number" style="color: ${tierColor};">${index + 1}.</span>
                        <div class="start-weapon-info">
                            <p class="weapon-name">${weapon.name}</p>
                            <p class="weapon-details">${weapon.category} | Tier ${weapon.tier}</p>
                        </div>
                        <span class="pick-rate-display">${weapon.pick}%</span>
                        <button class="start-toggle-btn" title="Loadout anzeigen">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    
                    <div class="start-loadout-details">
                        <h4>Bestes Loadout:</h4>
                        <div class="loadout-list-start">
                            ${loadoutHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        htmlContent += `</div>`;
    }

    htmlContent += `
             <p class="start-tip">
                 Für eine vollständige Liste und Loadouts, wechsle zum **Meta-Tab**.
             </p>
        </div>
    `;

    weaponList.innerHTML = htmlContent;
    currentWeaponList = [];
    
    document.querySelectorAll('.start-toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleStartHubLoadout(e.currentTarget);
        });
    });
}


function renderWeapons(weapons) {
    if (!weaponList) return; 
    weaponList.innerHTML = ''; 

    const filteredWeaponsByGame = weapons.filter(w => w.game === currentActiveGame);

    if (filteredWeaponsByGame.length === 0) {
        const gameName = gameTitleMap[currentActiveGame] || 'Spiel';
        weaponList.innerHTML = `<p style="text-align: center; padding: 20px;">Keine ${gameName} Waffen gefunden, die den Kriterien entsprechen.</p>`;
        currentWeaponList = []; 
        return;
    }

    filteredWeaponsByGame.sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));

    const absoluteMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) >= 5.0);
    const regularMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) < 5.0);

    function appendWeapons(weaponArray, title) {
        if (weaponArray.length > 0) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'meta-section-title';
            titleElement.textContent = title;
            weaponList.appendChild(titleElement);

            weaponArray.forEach(weapon => {
                const isFav = isFavorite(weapon.name);
                const favIcon = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                
                const loadoutHtml = weapon.loadout.map(item => 
                    `<div class="loadout-item">
                        <span class="slot">${item.slot}:</span>
                        <span class="attachment">${item.name}</span>
                    </div>`
                ).join('');

                const weaponElement = document.createElement('div');
                weaponElement.className = `weapon-card tier-${weapon.tier.toLowerCase().replace('-', '').replace(' ', '')}`; 
                weaponElement.innerHTML = `
                    <div class="header">
                        <h2>${weapon.name}</h2>
                        
                        <div style="display: flex; align-items: center;">
                            <span class="pick-rate-label pick-rate-inline">${weapon.pick}%</span>
                            <button class="toggle-loadout-btn" title="Loadout anzeigen/ausblenden">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <span class="category-label">${weapon.category}</span>
                    </div>

                    <div class="loadout-container">
                        <div class="details">
                            <span class="type">${weapon.type}</span> | 
                            <span class="tier">${weapon.tier}</span>
                        </div>

                        <h3>Bestes Loadout:</h3>
                        <div class="loadout-grid">
                            ${loadoutHtml}
                        </div>
                    </div>
                `;
                
                weaponElement.querySelector('.toggle-loadout-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    toggleLoadout(e.currentTarget); 
                });

                weaponElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    toggleFavorite(weapon.name);
                });
                
                weaponList.appendChild(weaponElement);
            });
        }
    }

    appendWeapons(absoluteMeta, 'ABSOLUTE META');
    appendWeapons(regularMeta, 'META');
    
    currentWeaponList = filteredWeaponsByGame; 
}


function renderFavorites() {
    const favoriteNames = loadFavorites();
    
    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);
    const favorites = activeGameWeapons.filter(weapon => favoriteNames.has(weapon.name));
    
    if (favorites.length === 0) {
        const gameName = gameTitleMap[currentActiveGame] || 'Spiel';
        weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Du hast noch keine ${gameName} Favoriten gespeichert.</h2>`;
        currentWeaponList = []; 
        return;
    }
    
    weaponList.innerHTML = '';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'meta-section-title';
    titleElement.textContent = `DEINE FAVORITEN (${gameTitleMap[currentActiveGame].toUpperCase()})`;
    weaponList.appendChild(titleElement);
    
    favorites.forEach(weapon => {
        const isFav = isFavorite(weapon.name);
        const favIcon = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        
        const loadoutHtml = weapon.loadout.map(item => 
            `<div class="loadout-item">
                <span class="slot">${item.slot}:</span>
                <span class="attachment">${item.name}</span>
            </div>`
        ).join('');

        const weaponElement = document.createElement('div');
        weaponElement.className = `weapon-card tier-${weapon.tier.toLowerCase().replace('-', '').replace(' ', '')}`;
        weaponElement.innerHTML = `
            <div class="header">
                <h2>${weapon.name}</h2>
                
                <div style="display: flex; align-items: center;">
                    <span class="pick-rate-label pick-rate-inline">${weapon.pick}%</span>
                    <button class="toggle-loadout-btn" title="Loadout anzeigen/ausblenden">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                </div>
            </div>
            
            <div class="info-row">
                <span class="category-label">${weapon.category}</span>
            </div>

            <div class="loadout-container">
                <div class="details">
                    <span class="type">${weapon.type}</span> | 
                    <span class="tier">${weapon.tier}</span>
                </div>

                <h3>Bestes Loadout:</h3>
                <div class="loadout-grid">
                    ${loadoutHtml}
                </div>
            </div>
        `;

        weaponElement.querySelector('.toggle-loadout-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleLoadout(e.currentTarget);
        });

        weaponElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavorite(weapon.name);
        });
        
        weaponList.appendChild(weaponElement);
    });
    
    currentWeaponList = favorites;
}


// ===================================================
// 5. FILTER & SUCHLOGIK
// ===================================================

function resetFilterDropdown() { 
    if (filterCategory) {
        filterCategory.value = 'all'; 
    }
}


function filterAndSearch() {
    const currentActiveFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
    
    let baseList = weaponData.filter(weapon => weapon.game === currentActiveGame);
    
    if (currentActiveFilter === 'favorites') {
        const favoriteNames = loadFavorites();
        baseList = baseList.filter(weapon => favoriteNames.has(weapon.name)); 
    } 
    
    if (!baseList || baseList.length === 0) {
        renderWeapons([]);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = filterCategory.value;

    const filteredWeapons = baseList.filter(weapon => { 
        const matchesSearch = weapon.name.toLowerCase().includes(searchTerm) || 
                              weapon.category.toLowerCase().includes(searchTerm) ||
                              weapon.type.toLowerCase().includes(searchTerm) ||
                              weapon.tier.toLowerCase().includes(searchTerm) ||
                              weapon.loadout.some(l => l.name.toLowerCase().includes(searchTerm));

        const matchesCategory = selectedCategory === 'all' || weapon.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderWeapons(filteredWeapons);
}


// ===================================================
// 6. NAVIGATION LOGIK (MAIN TABS & SUB TABS)
// ===================================================

function updateTitleAndContent(filter) {
    
    if (filter === 'start') {
        if (appTitle) appTitle.textContent = 'Übersicht'; 
        renderStartHub(); 
        if (controlsArea) controlsArea.style.display = 'none';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';
    } else if (filter === 'favorites') {
        if (appTitle) appTitle.textContent = 'Favoriten';
        renderFavorites(); 
        if (controlsArea) controlsArea.style.display = 'flex';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = (currentMainGame === 'bf6') ? 'flex' : 'none';
    } else if (filter === 'all') {
        if (appTitle) appTitle.textContent = 'Meta-Ranking'; 
        filterAndSearch(); 
        if (controlsArea) controlsArea.style.display = 'flex';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = (currentMainGame === 'bf6') ? 'flex' : 'none';
    } else {
        const tabName = document.querySelector('.bottom-nav .nav-item[data-filter="community"] span')?.textContent || 'Community';
        if (appTitle) appTitle.textContent = tabName; 
        weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Inhalt für den Tab: ${tabName}</h2>`;
        if (controlsArea) controlsArea.style.display = 'none';
        if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';
    }
}


function setupBottomNav() {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            
            resetFilterDropdown(); 
            updateTitleAndContent(filter);
        });
    });
}


function setupGameTabs() {
    const gameTabs = document.querySelectorAll('.app-header .game-tab');

    gameTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            
            gameTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const newMainGame = tab.getAttribute('data-game');
            currentMainGame = newMainGame; // Setze den aktiven Haupt-Tab
            
            // NEU: Theme-Klasse setzen
            updateThemeClass(newMainGame);

            // BF6 Logik
            if (newMainGame === 'bf6') {
                currentActiveGame = 'bf6_redsec';
                if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'flex';
                document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-game-mode="bf6_redsec"]').classList.add('active');
            } else {
                currentActiveGame = newMainGame;
            }
            
            const currentBottomFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');

            updateTitleAndContent(currentBottomFilter);
        });
    });
    
    // Listener für BF6 Sub-Tabs
    if (bf6SubTabsContainer) {
        document.querySelectorAll('.sub-tab').forEach(subTab => {
            subTab.addEventListener('click', (e) => {
                const newSubGameMode = e.currentTarget.getAttribute('data-game-mode');
                if (newSubGameMode === currentActiveGame) return;
                
                currentActiveGame = newSubGameMode; 
                
                document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                document.querySelector(`.sub-tab[data-game-mode="${newSubGameMode}"]`).classList.add('active');

                const currentBottomFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');
                updateTitleAndContent(currentBottomFilter);
            });
        });
    }
}


// Stellt den initialen Zustand her (Warzone / Start Hub)
function loadInitialWarzoneState() {
    currentMainGame = 'warzone';
    currentActiveGame = 'warzone';
    
    // NEU: Theme-Klasse initial setzen
    updateThemeClass('warzone');
    
    const warzoneTab = document.querySelector('.app-header .game-tab[data-game="warzone"]');
    if (warzoneTab) { 
        document.querySelectorAll('.app-header .game-tab').forEach(t => t.classList.remove('active'));
        warzoneTab.classList.add('active');
    }
    if (bf6SubTabsContainer) bf6SubTabsContainer.style.display = 'none';

    const startTab = document.querySelector('.bottom-nav .nav-item[data-filter="start"]');
    if (startTab) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
        startTab.classList.add('active'); 
    }

    if (controlsArea) controlsArea.style.display = 'none'; 

    if (appTitle) appTitle.textContent = 'Übersicht'; 
    renderStartHub(); 
}


// ===================================================
// 7. DARK / LIGHT MODE FUNKTIONALITÄT
// ===================================================
function setupThemeToggle() {
    const settingsButton = document.querySelector('.settings-button');
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal || !settingsButton) return; 

    const closeButton = settingsModal.querySelector('.close-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    settingsButton.addEventListener('click', () => {
        // Versionsnummer im Modal setzen
        const versionDisplay = settingsModal.querySelector('#app-version-display');
        if (versionDisplay) { // Sicherheitsprüfung nach HTML-Fix
            versionDisplay.textContent = `App Version: ${CURRENT_APP_VERSION}`;
        }
        
        settingsModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        darkModeToggle.checked = false; 
    } else {
        body.classList.remove('light-mode');
        darkModeToggle.checked = true; 
        if (!savedTheme) localStorage.setItem('theme', 'dark'); 
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}


// ===================================================
// 8. INITIALISIERUNG
// ===================================================

function initializeApp() {
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);
    if (filterCategory) filterCategory.addEventListener('change', filterAndSearch);

    setupBottomNav(); 
    setupGameTabs();
}

// ===================================================
// 9. Versionskontrolle & Update-Toast
// ===================================================

/**
 * Vergleicht die lokale App-Version mit der in den Daten gespeicherten Version.
 * Zeigt bei Unterschied den Update-Toast an.
 * @param {string} latestVersion - Die Versionsnummer aus meta-data.json
 */
function checkAppVersion(latestVersion) {
    // Einfacher Vergleich der Versions-Strings
    if (latestVersion && latestVersion !== CURRENT_APP_VERSION) {
        showUpdateToast(latestVersion);
    }
}

/**
 * Zeigt den schwebenden Update-Toast an.
 * @param {string} newVersion - Die neue verfügbare Versionsnummer.
 */
function showUpdateToast(newVersion) {
    if (!updateToast) return;
    
    // Nachricht im Toast aktualisieren
    const message = updateToast.querySelector('#toast-message');
    if (message) {
        message.textContent = `Neue App-Version ${newVersion} verfügbar. Bitte neu laden.`;
    }
    
    // CSS-Klasse hinzufügen, um den Toast einzublenden
    updateToast.classList.add('show');
    
    // Listener für den Reload-Button hinzufügen
    const reloadButton = updateToast.querySelector('#reload-button');
    if (reloadButton) {
        // Sicherstellen, dass keine alten Listener existieren
        const newReloadHandler = () => {
            // Befehl an den wartenden Service Worker senden
            if (newWorker) {
                console.log("Sende 'skipWaiting' an den neuen Service Worker.");
                newWorker.postMessage({ action: 'skipWaiting' });
            }
            
            // Toast sofort ausblenden
            updateToast.classList.remove('show');
            
            // ✅ KORREKTUR: Fallback-Reload nach 3 Sekunden
            // Wenn der controllerchange Listener in der PWA-Umgebung fehlschlägt,
            // erzwingen wir eine späte Neuladung als Fallback.
            setTimeout(() => {
                 console.log("Fallback-Reload nach 3 Sekunden ausgelöst.");
                 window.location.reload(true); // true forces reload from server
            }, 3000);
            
            // WICHTIG: KEIN window.location.reload() HIER! Das macht der controllerchange-Listener.
        };

        // Alten EventListener entfernen (falls vorhanden) und den neuen hinzufügen
        reloadButton.removeEventListener('click', reloadButton.oldHandler);
        reloadButton.addEventListener('click', newReloadHandler);
        reloadButton.oldHandler = newReloadHandler; 
    }
}


// ===================================================
// 10. Service Worker Registrierung & Update-Handler
// ===================================================

if ('serviceWorker' in navigator) {
    // ✅ KORREKTUR VOM VORHERIGEN SCHRITT: Controllerchange-Listener nach oben verschoben.
    // Dieser Listener löst das Neuladen aus, nachdem skipWaiting erfolgreich war.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("Service Worker-Controller gewechselt. Lade Seite neu...");
        // Wenn der Controller wechselt (nach skipWaiting), lade neu.
        window.location.reload();
    });
    
    // Registriere oder hole die existierende Registrierung
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            console.log('Service Worker erfolgreich registriert:', reg);
            
            // Erzwinge die sofortige Update-Prüfung beim App-Start.
            reg.update();

            // WICHTIG: Wenn ein Update gefunden wird (neue .js oder .html gecacht), den Worker speichern
            reg.onupdatefound = () => {
                newWorker = reg.installing; // Den neuen, installierenden Worker speichern

                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // Ein neuer Service Worker ist installiert und wartet.
                            // Das App-Update (Toast) wird durch checkAppVersion ausgelöst.
                            console.log("Neuer Service Worker installiert. Warte auf meta-data.json Check.");
                        } else {
                            // Erster Besuch: Worker ist aktiv.
                            console.log("Inhalt ist nun für Offline-Nutzung gecacht.");
                        }
                    }
                };
            };
        })
        .catch(error => {
            console.error('Service Worker Registrierung fehlgeschlagen:', error);
        });
}


document.addEventListener('DOMContentLoaded', loadMetaWeapons);




















>>>>>>> 5b44b6b46967f38001e6e751a889777021e135cd
