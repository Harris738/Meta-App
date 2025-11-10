// ===================================================
// 1. GLOBALE VARIABLEN & HTML-Element-Selektion
// ===================================================

let weaponData = []; 
let currentWeaponList = []; 
let currentActiveGame = 'warzone'; 

const weaponList = document.getElementById('weapon-list');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const appTitle = document.getElementById('app-title'); // NEU: Selektor für den dynamischen Titel

const FAVORITES_KEY = 'wzMetaFavorites';


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
        
        weaponData = await response.json(); 
        
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

/**
 * Performante Funktion zum Umschalten der Loadout-Sichtbarkeit (Meta Cards).
 */
function toggleLoadout(button) {
    const card = button.closest('.weapon-card');
    card.classList.toggle('expanded');
}

/**
 * Performante Funktion zum Umschalten des Loadouts im Start Hub.
 */
function toggleStartHubLoadout(button) {
    const container = button.closest('.start-hub-weapon-card');
    const icon = container.querySelector('.start-toggle-btn i'); 

    const isExpanded = container.classList.toggle('expanded');
    
    if (isExpanded) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}


/**
 * Rendert die Startseite mit Top 3 Waffen und Meta-Zusammenfassung.
 */
function renderStartHub() {
    if (!weaponList) return; 

    // Filtern nach dem aktuell aktiven Spiel (Standard: warzone)
    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);

    // 1. Daten sortieren und Top 3 holen
    const sortedWeapons = [...activeGameWeapons].sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));
    const top3Weapons = sortedWeapons.slice(0, 3);
    
    // 2. Statistiken berechnen (nur für das aktive Spiel)
    const totalWeapons = activeGameWeapons.length;
    const absoluteMetaCount = activeGameWeapons.filter(w => parseFloat(w.pick) >= 5.0).length;
    
    // Zähle nur Favoriten, die auch zum aktuellen Spiel gehören
    const favoriteNames = loadFavorites();
    const favoriteCount = activeGameWeapons.filter(w => favoriteNames.has(w.name)).length;


    // Bestimme den Titel
    const gameTitle = currentActiveGame === 'warzone' ? 'Warzone' : 'Black Ops 7';

    // 3. HTML-Erstellung
    let htmlContent = `
        <div class="start-hub-container" style="padding: 20px;">
            <h2 style="color: var(--primary-color); margin-bottom: 25px; text-align: center;">Deine ${gameTitle} Meta-Übersicht</h2>
            
            <div class="stat-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px;">
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 8px; text-align: center; border-left: 3px solid #3498db;">
                    <p style="font-size: 1.5em; font-weight: bold;">${totalWeapons}</p>
                    <p style="font-size: 0.7em; color: var(--subtle-text);">Verfügbare Loadouts</p>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 8px; text-align: center; border-left: 3px solid var(--secondary-color);">
                    <p style="font-size: 1.5em; font-weight: bold;">${absoluteMetaCount}</p>
                    <p style="font-size: 0.7em; color: var(--subtle-text);">Absolute Meta</p>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 8px; text-align: center; border-left: 3px solid var(--favorite-color);">
                    <p style="font-size: 1.5em; font-weight: bold;">${favoriteCount}</p>
                    <p style="font-size: 0.7em; color: var(--subtle-text);">Deine Favoriten</p>
                </div>
            </div>
    `;
    
    if (top3Weapons.length === 0) {
        htmlContent += `<h3 style="text-align: center; margin-top: 30px; color: var(--subtle-text);">Noch keine Top-Waffen für ${gameTitle} verfügbar.</h3>`;
    } else {
        htmlContent += `
            <h3 class="meta-section-title">TOP 3 WAFFEN DER META</h3>
            <div class="top-3-container" id="top-3-container" style="display: flex; flex-direction: column; gap: 15px;">
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
                <div class="start-hub-weapon-card" style="background-color: var(--card-bg); border-radius: 8px; border-left: 4px solid ${tierColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    
                    <div class="start-card-header" style="display: flex; align-items: center; padding: 15px; cursor: pointer;" data-weapon-index="${index}">
                        <span style="font-size: 1.8em; font-weight: bold; margin-right: 15px; color: var(--secondary-color);">${index + 1}.</span>
                        <div style="flex-grow: 1;">
                            <p style="font-size: 1.1em; font-weight: bold; color: var(--text-color);">${weapon.name}</p>
                            <p style="font-size: 0.8em; color: var(--subtle-text);">${weapon.category} | Tier ${weapon.tier}</p>
                        </div>
                        <span style="font-size: 1.2em; font-weight: bold; color: var(--primary-color); margin-right: 15px;">${weapon.pick}</span>
                        <button class="start-toggle-btn" style="background: none; border: none; color: var(--text-color); font-size: 1.2em; padding: 5px; cursor: pointer;">
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
            <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: var(--subtle-text);">
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


/**
 * Rendert die komplette Meta-Liste mit Sektionen (Absolute Meta, Meta).
 */
function renderWeapons(weapons) {
    if (!weaponList) return; 
    weaponList.innerHTML = ''; 

    // Wir rendern nur Waffen, die zum aktuell aktiven Spiel gehören
    const filteredWeaponsByGame = weapons.filter(w => w.game === currentActiveGame);

    if (filteredWeaponsByGame.length === 0) {
        const gameName = currentActiveGame === 'warzone' ? 'Warzone' : 'Black Ops 7';
        weaponList.innerHTML = `<p style="text-align: center; padding: 20px;">Keine ${gameName} Waffen gefunden, die den Kriterien entsprechen.</p>`;
        currentWeaponList = []; 
        return;
    }

    // 1. Sortiere die Waffen zuerst nach Pick Rate (absteigend)
    filteredWeaponsByGame.sort((a, b) => parseFloat(b.pick) - parseFloat(a.pick));

    // 2. Kategorien für die Meta-Sektionen
    const absoluteMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) >= 5.0); // >= 5%
    const regularMeta = filteredWeaponsByGame.filter(w => parseFloat(w.pick) < 5.0); // < 5%

    // Hilfsfunktion, die die Überschrift und die zugehörigen Waffen-Karten rendert
    function appendWeapons(weaponArray, title) {
        if (weaponArray.length > 0) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'meta-section-title';
            titleElement.textContent = title;
            weaponList.appendChild(titleElement);

            weaponArray.forEach(weapon => {
                const isFav = isFavorite(weapon.name);
                const favIcon = isFav ? '★' : '☆';
                
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
                            <button class="toggle-loadout-btn">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <span class="category-label">${weapon.category}</span>
                        <span class="pick-rate-label">${weapon.pick} Pick Rate</span>
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

    // 3. Füge die Sektionen hinzu
    appendWeapons(absoluteMeta, 'ABSOLUTE META');
    appendWeapons(regularMeta, 'META');
    
    currentWeaponList = filteredWeaponsByGame; 
}


function renderFavorites() {
    const favoriteNames = loadFavorites();
    
    // Zuerst nach Spiel filtern, dann nach Favoriten filtern
    const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);
    const favorites = activeGameWeapons.filter(weapon => favoriteNames.has(weapon.name));
    
    if (favorites.length === 0) {
        const gameName = currentActiveGame === 'warzone' ? 'Warzone' : 'Black Ops 7';
        weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Du hast noch keine ${gameName} Favoriten gespeichert.</h2>`;
        currentWeaponList = []; 
        return;
    }
    
    weaponList.innerHTML = '';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'meta-section-title';
    titleElement.textContent = `DEINE FAVORITEN (${currentActiveGame.toUpperCase()})`;
    weaponList.appendChild(titleElement);
    
    favorites.forEach(weapon => {
        const isFav = isFavorite(weapon.name);
        const favIcon = isFav ? '★' : '☆';
        
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
                    <button class="toggle-loadout-btn">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-weapon-name="${weapon.name}">${favIcon}</button>
                </div>
            </div>
            
            <div class="info-row">
                <span class="category-label">${weapon.category}</span>
                <span class="pick-rate-label">${weapon.pick} Pick Rate</span>
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
    
    // NEU: Basisliste ist IMMER zuerst nach dem aktiven Spiel gefiltert
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
// 6. NAVIGATION LOGIK
// ===================================================

function setupBottomNav() {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            
            resetFilterDropdown(); 

            // NEU: Titel anpassen und Inhalt rendern
            if (filter === 'start') {
                if (appTitle) appTitle.textContent = 'Übersicht'; // Dein Wunsch: "Übersicht"
                renderStartHub(); 
                document.querySelector('.controls-area').style.display = 'none';
            } else if (filter === 'favorites') {
                if (appTitle) appTitle.textContent = 'Favoriten'; // Dein Wunsch: "Favoriten"
                renderFavorites(); 
                document.querySelector('.controls-area').style.display = 'flex';
            } else if (filter === 'all') {
                if (appTitle) appTitle.textContent = 'Meta-Ranking'; // Dein Wunsch: "Meta-Ranking"
                const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);
                renderWeapons(activeGameWeapons); 
                document.querySelector('.controls-area').style.display = 'flex';
            } else {
                const tabName = button.querySelector('span').textContent;
                if (appTitle) appTitle.textContent = tabName; 
                weaponList.innerHTML = `<h2 style="text-align: center; margin-top: 50px;">Inhalt für den Tab: ${tabName}</h2>`;
                document.querySelector('.controls-area').style.display = 'none';
            }
        });
    });
}


function setupGameTabs() {
    const gameTabs = document.querySelectorAll('.app-header .game-tab');

    gameTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            
            gameTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const gameFilter = tab.getAttribute('data-game');
            currentActiveGame = gameFilter; 
            
            resetFilterDropdown(); 
            
            const currentBottomFilter = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-filter');

            // Zeige Filter/Suche nur, wenn wir uns im Meta- oder Favoriten-Tab befinden
            const showControls = (currentBottomFilter === 'all' || currentBottomFilter === 'favorites');
            document.querySelector('.controls-area').style.display = showControls ? 'flex' : 'none';

            // Titel-Update bei Spielwechsel (nur für Meta/Fav relevant)
            if (currentBottomFilter === 'all') {
                if (appTitle) appTitle.textContent = 'Meta-Ranking'; 
            } else if (currentBottomFilter === 'favorites') {
                if (appTitle) appTitle.textContent = 'Favoriten';
            } else if (currentBottomFilter === 'start') {
                if (appTitle) appTitle.textContent = 'Übersicht';
            }


            // Render-Funktion auf Basis des aktuellen Bottom-Nav-Filters aufrufen
            if (currentBottomFilter === 'start') {
                renderStartHub(); 
            } else if (currentBottomFilter === 'all') {
                const activeGameWeapons = weaponData.filter(w => w.game === currentActiveGame);
                renderWeapons(activeGameWeapons); 
            } else if (currentBottomFilter === 'favorites') {
                renderFavorites(); 
            } 
        });
    });
}

// Stellt den initialen Zustand her (Warzone / Start Hub)
function loadInitialWarzoneState() {
    // 1. Setze das aktive Spiel auf Warzone
    currentActiveGame = 'warzone';
    
    // 2. Visuelle Header-Aktivierung
    const warzoneTab = document.querySelector('.app-header .game-tab[data-game="warzone"]');
    if (warzoneTab) { 
        document.querySelectorAll('.app-header .game-tab').forEach(t => t.classList.remove('active'));
        warzoneTab.classList.add('active');
    }

    // 3. Visuelle Bottom-Nav-Aktivierung (Standard ist Start-Tab)
    const startTab = document.querySelector('.bottom-nav .nav-item[data-filter="start"]');
    if (startTab) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
        startTab.classList.add('active'); 
    }

    // 4. Setze den initialen Titel auf "Übersicht"
    if (appTitle) {
        appTitle.textContent = 'Übersicht';
    }

    // 5. Content-Rendering und Filter-Sichtbarkeit
    const controlsArea = document.querySelector('.controls-area');
    if (controlsArea) controlsArea.style.display = 'none'; 

    renderStartHub(); 
}


// ===================================================
// 7. INITIALISIERUNG
// ===================================================

function initializeApp() {
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);
    if (filterCategory) filterCategory.addEventListener('change', filterAndSearch);

    setupBottomNav(); 
    setupGameTabs();
}


// STARTE die App, indem die Daten geladen werden
loadMetaWeapons();