// script.js

// === HILFSFUNKTIONEN FÜR MODAL & SIDEBAR STEUERUNG ===

/** Öffnet das Login-Modal und schließt die Sidebar, falls geöffnet. */
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const sidebar = document.getElementById('sidebar');

    if (loginModal) {
        // Schließt die Sidebar und setzt Styles zurück
        if (sidebar) {
            sidebar.classList.remove('open');
            sidebar.style.transform = '';
            sidebar.style.display = '';
            sidebar.style.opacity = '';
            sidebar.style.pointerEvents = '';
            sidebar.setAttribute('aria-hidden', 'true');
        }
        const menuToggle = document.getElementById('menu-toggle') || document.querySelector('.menu-toggle');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        
        // Stellt sicher, dass alle alten Fehlermeldungen entfernt werden
        const existingError = loginModal.querySelector('#login-error-message');
        if (existingError) {
            existingError.remove();
        }

        loginModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Verhindert Scrollen des Hintergrunds
    }
}

/** Sidebar: Subscribe form handler */
function initSidebarSubscribeHandler(){
    const form = document.getElementById('sidebar-subscribe-form');
    if (!form) return;
    const emailInput = document.getElementById('sidebar-subscribe-email');
    const msg = document.getElementById('sidebar-subscribe-msg');

    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        if (!emailInput) return;
        const val = (emailInput.value || '').trim();
        if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){
            if (msg) { msg.style.display='block'; msg.textContent='Bitte gültige E-Mail eingeben.'; msg.style.color='rgba(255,180,180,0.95)'; }
            return;
        }

        // persist subscription locally (placeholder for real backend)
        try{
            const list = JSON.parse(localStorage.getItem('capitovo_newsletter')||'[]');
            if (!list.includes(val)) list.push(val);
            localStorage.setItem('capitovo_newsletter', JSON.stringify(list));
        } catch(err){ /* ignore */ }

        if (msg) { msg.style.display='block'; msg.textContent='Danke! Bestätige deine E-Mail in deinem Posteingang.'; msg.style.color='rgba(200,255,220,0.95)'; }
        emailInput.value = '';

        // close sidebar shortly after subscribe to show confirmation
        setTimeout(()=>{
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menu-toggle');
            if (sidebar) { sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); }
            if (menuToggle) menuToggle.setAttribute('aria-expanded','false');
            document.body.style.overflow = '';
        }, 900);
    });
}

/** Schließt das Login-Modal. */
function closeLoginModal() {
    const loginModal = document.getElementById('login-modal');

    if (loginModal) {
        loginModal.classList.add('hidden');
        document.body.style.overflow = ''; // Stellt das Scrollen wieder her
    }
}

// Lightweight scroll-triggered reveal helper (Disabled).
const ScrollReveal = {
    init: () => {},
    add: () => {}
};

// Kontaktverwaltung: Verwendung einer dedizierten Seite `Abonenten/kontaktdaten.html`.

// === ANALYSEN RENDERING LOGIK ===

/**
 * Erstellt das HTML für einen einzelnen Analyse-Artikel.
 * Hinweis: Verwendet 'text-blue-500', da 'text-accent-blue' eine Custom-Klasse ist, 
 * die Tailwind ggf. nicht kennt, falls sie nicht in der config.js ist.
 */
function createAnalysisArticle(analysis, idx){
    // Verwendung des neuen, von Ihnen genehmigten HTML-Templates, angepasst an die Datenstruktur
    return `
            <a href="${computeAnalysisLink(analysis, idx)}" class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block overflow-hidden group" data-scroll="fade-up">
            
            <div class="media bg-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <img src="${analysis.image}" alt="Vorschaubild für ${analysis.title}" 
                     class="w-full h-full object-cover group-hover:opacity-85 transition duration-300">
            </div>
            
            <p class="text-xs font-semibold uppercase tracking-widest text-primary-blue mb-1">
                ${analysis.category}
            </p>
            
            <h4 class="text-lg font-bold text-gray-900 mb-2 leading-snug">
                ${analysis.title}
            </h4>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-3">
                ${analysis.summary}
            </p>
            
            <span class="text-sm font-medium text-primary-blue hover:text-blue-600 transition duration-150 flex items-center">
                Jetzt lesen →
            </span>
            
        </a>
    `;
}

/** Öffnet ein Modal, das den Nutzer auffordert, ein Abo abzuschließen. */
function openSubscriptionModal() {
    let modal = document.getElementById('subscription-modal');
    if (!modal) {
        const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
        const pricingLink = isInAbonenten ? '../checkout.html?plan=premium' : 'checkout.html?plan=premium';
        
        modal = document.createElement('div');
        modal.id = 'subscription-modal';
        // Use backdrop-blur-xl-custom for consistent look with login modal
        // Ensure z-index is very high to cover everything including sidebar if needed
        // Add pointer-events-auto to ensure it captures all clicks/hovers
        modal.className = 'hidden fixed inset-0 backdrop-blur-xl-custom bg-black bg-opacity-75 flex items-center justify-center p-4 pointer-events-auto';
        modal.style.zIndex = '10050';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-gray-200 relative" style="z-index: 10051;">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-4">
                    <svg class="h-6 w-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 class="text-lg leading-6 font-bold text-gray-900 mb-2">Abo erforderlich</h3>
                <p class="text-sm text-gray-500 mb-6">
                    Für den Zugriff auf diese Analyse benötigen Sie ein aktives Abonnement.
                </p>
                <div class="flex flex-col gap-3">
                    <a href="${pricingLink}" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-blue text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm">
                        Jetzt abonnieren
                    </a>
                    <button type="button" id="close-subscription-modal" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                        Abbrechen
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close handlers
        const close = () => {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        };
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
        
        const btn = modal.querySelector('#close-subscription-modal');
        if(btn) btn.addEventListener('click', close);
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Block scrolling
}

/** Erstellt eine größere, gestaltete Karte für die Abonnenten-Seite. */
function createMemberAnalysisCard(a, idx){
    // Fallback values
    const title = a.title || 'Unbenannte Analyse';
    const summary = a.summary || '';
    // Resolve relative paths correctly when page sits in /Abonenten/
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const base = isInAbonenten ? '../' : '';
    const rawImg = a.image || 'data/vorschaubilder/placeholder.png';
    const img = (/^(https?:)?\/\//i.test(rawImg) || rawImg.startsWith('/')) ? rawImg : (base + rawImg);
    const category = a.category || 'Analyse';
    const rawLink = a.link || '';
    const link = computeAnalysisLink(a, idx, base);
    const date = a.date || '';
    const author = a.author || '';

    // Extract Stock Name from Title
    let stockName = '';
    if (title.includes('—')) {
        stockName = title.split('—')[0].trim();
    } else if (title.includes(':')) {
        stockName = title.split(':')[0].trim();
    }
    // If stock name is too long (likely a sentence), ignore it
    if (stockName.length > 25) stockName = '';

    // --- Favorites Logic ---
    const favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
    const isFav = favorites.includes(title);
    const starFill = isFav ? 'currentColor' : 'none';
    const starColor = isFav ? 'text-yellow-400' : 'text-gray-400';
    
    const favButton = `
        <button onclick="toggleFavorite(event, '${title.replace(/'/g, "\\'")}')" 
                class="absolute top-4 right-4 z-30 p-2 transition-all duration-200 hover:scale-110"
                title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
            <svg class="w-6 h-6 ${starColor} drop-shadow-md" fill="${starFill}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
        </button>
    `;

    // --- Check Subscription ---
    let hasAccess = false;
    try {
        const sess = JSON.parse(localStorage.getItem('capitovo_session') || '{}');
        // Grant access if subscription is present and not 'none'. 
        // Also fallback for legacy session of 'test@capitovo.de' if needed.
        if (sess.email === 'test@capitovo.de' || (sess.subscription && sess.subscription !== 'none')) {
            hasAccess = true;
        }
    } catch(e) {}

    // If locked: use a dummy link and attach onclick handler
    const finalLink = hasAccess ? link : '#';
    const onclickAttr = hasAccess ? '' : 'onclick="event.preventDefault(); openSubscriptionModal();"';
    
    const blurClass = hasAccess ? '' : 'filter blur-sm select-none pointer-events-none';
    // Removed text span, kept icon
    const lockOverlay = hasAccess ? '' : `
        <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] transition-opacity duration-300 hover:bg-white/40">
            <div class="bg-white p-3 rounded-full shadow-xl">
                <svg class="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
        </div>
    `;

    return `
        <a href="${finalLink}" ${onclickAttr} class="relative bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block overflow-hidden group" data-scroll="fade-up">
            ${lockOverlay}
            ${favButton}
            <div class="${blurClass} transition duration-300 h-full flex flex-col">
                <div class="media bg-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center flex-shrink-0">
                    <img src="${img}" alt="Vorschaubild für ${title}" 
                         class="w-full h-full object-cover group-hover:opacity-85 transition duration-300">
                </div>
                
                <p class="text-xs font-semibold uppercase tracking-widest text-primary-blue mb-1">
                    ${category} ${stockName ? `<span class="text-gray-400 mx-1">•</span> <span class="text-gray-500 font-bold">${stockName}</span>` : ''}
                </p>
                
                <h4 class="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    ${title}
                </h4>
                
                <p class="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
                    ${summary}
                </p>
                
                <span class="text-sm font-medium text-primary-blue hover:text-blue-600 transition duration-150 flex items-center mt-auto">
                    Jetzt lesen →
                </span>
            </div>
        </a>
    `;
}

/** Toggle favorite status of an analysis. */
function toggleFavorite(event, title) {
    event.preventDefault();
    event.stopPropagation();
    
    let favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
    const index = favorites.indexOf(title);
    
    if (index === -1) {
        favorites.push(title);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('capitovo_favorites', JSON.stringify(favorites));
    
    // Update UI icon immediately
    const btn = event.currentTarget;
    const icon = btn.querySelector('svg');
    if (index === -1) {
        // Added
        icon.setAttribute('fill', 'currentColor');
        icon.classList.add('text-yellow-400');
        icon.classList.remove('text-gray-400');
        btn.title = 'Aus Favoriten entfernen';
    } else {
        // Removed
        icon.setAttribute('fill', 'none');
        icon.classList.remove('text-yellow-400');
        icon.classList.add('text-gray-400');
        btn.title = 'Zu Favoriten hinzufügen';
    }

    // Trigger event for filter updates
    document.dispatchEvent(new CustomEvent('favorites-updated'));
}

/** Compute a detail-link for an analysis. Uses numeric index when available. */
function computeAnalysisLink(a, idx, baseOverride){
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const base = typeof baseOverride === 'string' ? baseOverride : (isInAbonenten ? '../' : '');
    // If the analysis already provides an absolute or root link, use it
    const raw = (a && a.link) ? String(a.link) : '';
    // If no explicit link is provided, fall back to the detail page.
    if (!raw) {
        if (typeof idx === 'number' && Number.isFinite(idx)) {
            return base + 'analyse.html?id=' + encodeURIComponent(String(idx));
        }
        return base + 'analyse.html';
    }
    // Preserve explicit modal trigger '#open-login' on public pages,
    // but on members pages (inside /Abonenten/) treat it as a link to the detail page.
    if (raw === '#open-login') {
        if (isInAbonenten) {
            if (typeof idx === 'number' && Number.isFinite(idx)) {
                return base + 'analyse.html?id=' + encodeURIComponent(String(idx));
            }
            return base + 'analyse.html';
        }
        return '#open-login';
    }
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('/')) return raw;
    return base + raw;
}

/** Lädt die Analysen speziell für die Abonnenten-Seite und rendert hochwertige Karten. */
async function loadAndRenderMemberAnalyses(){
    const container = document.getElementById('member-analyses');
    if (!container) return;
    const cacheBuster = `?t=${new Date().getTime()}`;
    try{
        // Resolve correct relative path depending on current page location.
        // Pages inside `Abonenten/` need to fetch from `../data/analysen.json`.
        const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
        const dataPath = (isInAbonenten ? '../' : '') + 'data/analysen.json' + cacheBuster;
        const res = await fetch(dataPath);
        if (!res.ok) throw new Error('Fetch fehlgeschlagen');
        const data = await res.json();
        
        // Sort by date descending (newest first)
        data.sort((a,b) => {
            const da = a.date ? Date.parse(a.date) : 0;
            const db = b.date ? Date.parse(b.date) : 0;
            return (db - da) || 0;
        });

        // render up to 6 analyses in a responsive grid
        const html = `<div class="grid md:grid-cols-3 gap-8">` + data.slice(0,6).map((d,i) => createMemberAnalysisCard(d,i)).join('') + `</div>`;
        container.innerHTML = html;
        try { ScrollReveal.add(container.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }
    }catch(err){
        console.error('Fehler beim Laden der Member-Analysen', err);
        container.innerHTML = '<p class="text-sm text-gray-500">Analysen konnten nicht geladen werden.</p>';
    }
}

/** Initialize the full overview page with filtering, sorting and search. */
async function initAllAnalysesPage(){
    const grid = document.getElementById('all-analyses-grid');
    const sortSelect = document.getElementById('sort-select');
    const sectorSelect = document.getElementById('sector-select');
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const favToggle = document.getElementById('favorites-toggle');

    if (!grid) return;

    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const dataPath = (isInAbonenten ? '../' : '') + 'data/analysen.json';

    // Check URL params for initial filter
    const urlParams = new URLSearchParams(window.location.search);
    let showFavoritesOnly = urlParams.get('filter') === 'favorites';
    
    // Update toggle button state if present
    if (favToggle && showFavoritesOnly) {
        favToggle.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
        favToggle.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
        const span = favToggle.querySelector('span');
        if(span) span.textContent = 'Alle anzeigen';
    }

    let data = [];
    try{
        const res = await fetch(dataPath + `?t=${Date.now()}`);
        if (!res.ok) throw new Error('fetch failed');
        data = await res.json();
    }catch(e){ console.error(e); grid.innerHTML = '<p class="text-red-500">Analysen konnten nicht geladen werden.</p>'; return; }

    // populate sector select
    const sectors = Array.from(new Set(data.map(d => (d.category || '').toString().trim()).filter(Boolean))).sort();
    sectors.forEach(s => {
        const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sectorSelect.appendChild(opt);
    });

    function renderList(filterOpts = {}){
        const q = (filterOpts.q || '').toLowerCase().trim();
        const sector = (filterOpts.sector || '').trim();
        const sort = filterOpts.sort || 'newest';
        const onlyFavs = filterOpts.onlyFavs || false;

        let items = data.slice();
        
        // filter favorites
        if (onlyFavs) {
            const favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
            items = items.filter(i => favorites.includes(i.title));
        }

        // filter sector
        if (sector) items = items.filter(i => (i.category||'').toLowerCase() === sector.toLowerCase());
        // search
        if (q) items = items.filter(i => ((i.title||'') + ' ' + (i.summary||'') + ' ' + (i.category||'')).toLowerCase().includes(q));

        // sort: try to use `date` field; if missing, keep original order
        if (sort === 'newest'){
            items.sort((a,b)=>{
                const da = a.date ? Date.parse(a.date) : 0;
                const db = b.date ? Date.parse(b.date) : 0;
                return (db - da) || 0;
            });
        } else {
            items.sort((a,b)=>{
                const da = a.date ? Date.parse(a.date) : 0;
                const db = b.date ? Date.parse(b.date) : 0;
                return (da - db) || 0;
            });
        }

        // render
        if (!items.length) { 
            grid.innerHTML = onlyFavs 
                ? '<div class="col-span-3 text-center py-12"><p class="text-gray-500 mb-2">Keine Favoriten gefunden.</p><p class="text-sm text-gray-400">Markieren Sie Analysen mit dem Herz-Symbol, um sie hier zu sehen.</p></div>' 
                : '<p class="text-gray-500">Keine Analysen gefunden.</p>'; 
            return; 
        }
        grid.innerHTML = '<div class="grid md:grid-cols-3 gap-8">' + items.map((it, idx) => createMemberAnalysisCard(it, idx)).join('') + '</div>';
        try { ScrollReveal.add(grid.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }
    }

    // wire controls
    function readAndRender(){
        renderList({ 
            q: searchInput?.value || '', 
            sector: sectorSelect?.value || '', 
            sort: sortSelect?.value || 'newest',
            onlyFavs: showFavoritesOnly
        });
    }
    
    sortSelect?.addEventListener('change', readAndRender);
    sectorSelect?.addEventListener('change', readAndRender);
    searchInput?.addEventListener('input', () => { readAndRender(); });
    clearBtn?.addEventListener('click', (e)=>{ e.preventDefault(); if (searchInput) searchInput.value=''; readAndRender(); });
    
    // Favorites Toggle Handler
    if (favToggle) {
        favToggle.addEventListener('click', (e) => {
            e.preventDefault();
            showFavoritesOnly = !showFavoritesOnly;
            
            // Update Button UI
            const span = favToggle.querySelector('span');
            if (showFavoritesOnly) {
                favToggle.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
                favToggle.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
                if(span) span.textContent = 'Alle anzeigen';
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('filter', 'favorites');
                window.history.pushState({}, '', url);
            } else {
                favToggle.classList.remove('bg-red-50', 'text-red-600', 'border-red-200');
                favToggle.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
                if(span) span.textContent = 'Nur Favoriten';
                const url = new URL(window.location);
                url.searchParams.delete('filter');
                window.history.pushState({}, '', url);
            }
            readAndRender();
        });
    }

    // Listen for favorite updates (from card clicks) to refresh list if in favorites mode
    document.addEventListener('favorites-updated', () => {
        if (showFavoritesOnly) readAndRender();
    });

    // initial render
    readAndRender();
}

/** Lädt die Analysen aus JSON und rendert sie im Grid. */
async function loadAndRenderAnalyses() {
    const analysisGrid = document.getElementById('analysis-grid');
    if (!analysisGrid) return; 
    
    // Cache-Buster
    const cacheBuster = `?t=${new Date().getTime()}`; 
    const apiUrl = 'data/analysen.json' + cacheBuster; 
    
    try {
        const response = await fetch(apiUrl); 
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status} (Pfad: ${apiUrl})`);
        }
        
        const analyses = await response.json(); 
        
        // Erzeugt das HTML und fügt es in das Grid ein (lädt max. 6)
        const analysisHTML = analyses.slice(0, 6)
                         .map((d,i) => createAnalysisArticle(d,i))
                         .join('');
        
        analysisGrid.innerHTML = analysisHTML;
        try { ScrollReveal.add(analysisGrid.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }

    } catch (error) {
        console.error("Fehler beim Laden der Analysen:", error);
        analysisGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Aktuelle Analysen konnten nicht geladen werden. Prüfen Sie Konsole.</p>';
    }
}


// === TEST-LOGIN-LOGIK (KORRIGIERT) ===

/** Initialisiert die simulierte Login-Funktionalität. */
function initTestLogin() {
    // Simulierter Benutzer-Datenbank
    const USERS = {
        'test@capitovo.de': { pass: 'passwort123', sub: 'premium' },
        'noabo@capitovo.de': { pass: 'passwort123', sub: 'none' }
    };
    
    // Pre-defined contact data for specific users
    const USER_CONTACTS = {
        'test@capitovo.de': {
            name: 'Kevin Waibel',
            firstname: 'Kevin',
            lastname: 'Waibel',
            email: 'test@capitovo.de',
            phone: '+1234567890',
            address: 'Musterstraße 1, 88400 Biberach',
            street: 'Musterstraße',
            houseno: '1',
            zip: '88400',
            city: 'Biberach',
            payment: { method: 'card', card_last4: '4242', card_name: 'Kevin Waibel' }
        }
    };
    
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    
    const loginForm = loginModal.querySelector('form');
    if (!loginForm) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const enteredEmail = (emailInput.value || '').trim();
        const enteredPassword = passwordInput.value;
        
        const existingError = loginModal.querySelector('#login-error-message');
        if (existingError) existingError.remove();
        
        const submitButton = loginModal.querySelector('button[type="submit"]');

        const user = USERS[enteredEmail];

        if (user && user.pass === enteredPassword) {
            // Erfolgreiche Anmeldung
            try{ 
                localStorage.setItem('capitovo_session', JSON.stringify({ 
                    email: enteredEmail, 
                    subscription: user.sub, 
                    ts: Date.now() 
                })); 
                
                // Set contact data if defined for this user
                if (USER_CONTACTS[enteredEmail]) {
                    localStorage.setItem('capitovo_contact', JSON.stringify(USER_CONTACTS[enteredEmail]));
                } else {
                    // Clear contact data for other users to avoid mixup
                    localStorage.removeItem('capitovo_contact');
                }
            }catch(e){}
            window.location.href = 'Abonenten/abonenten.html';
            return;
        } else {
            // Fehlerhafte Anmeldung
            const errorMessage = document.createElement('p');
            errorMessage.id = 'login-error-message';
            errorMessage.className = 'text-red-500 text-sm mt-3 text-center'; 
            errorMessage.textContent = 'Fehler: Ungültige E-Mail oder Passwort.';
            submitButton.parentNode.insertBefore(errorMessage, submitButton.nextSibling);
        }
    });
}


// === INITIALISIERUNGSFUNKTIONEN (unverändert) ===

/** Initialisiert die Funktionalität der Seitenleiste (Sidebar). */
function initSidebar() {
    const sidebarElement = document.getElementById('sidebar');
    // try multiple ways to find the menu toggle in case markup differs
    let menuToggle = document.getElementById('menu-toggle') || document.querySelector('.menu-toggle') || document.querySelector('[aria-controls="sidebar"]');
    const closeSidebarButton = document.getElementById('close-sidebar') || (sidebarElement && sidebarElement.querySelector('.close-button'));

    if (!sidebarElement) {
        return;
    }

    // Ensure sidebar starts closed and clear any forced inline styles left from debugging
    try{
        sidebarElement.classList.remove('open');
        sidebarElement.setAttribute('aria-hidden','true');
        sidebarElement.style.transform = '';
        sidebarElement.style.display = '';
        sidebarElement.style.opacity = '';
        sidebarElement.style.pointerEvents = '';
        // keep sidebar z-index as defined in CSS
    } catch(e) { /* ignore */ }

    if (!menuToggle) {
        // nothing else to do; return early
        return;
    }

    // defensive: ensure the toggle sits above other positioned elements (e.g. animation canvas)
    try{
        if (menuToggle && window.getComputedStyle(menuToggle).position === 'static') {
            menuToggle.style.position = 'relative';
        }
        // ensure toggle sits above the canvas (zIndex ~100) but below the sidebar (1000)
        try{
            const current = parseInt(menuToggle.style.zIndex||'0',10) || 0;
            menuToggle.style.zIndex = String(Math.max(current, 210));
        }catch(e){}
    } catch(e) { /* ignore */ }

    // menu toggle prepared

    // helper functions to open/close/toggle sidebar
    function openSidebar(){
        try{
            // mark sidebar open and make it visible; keep styles defensive
            sidebarElement.classList.add('open');
            sidebarElement.style.width = sidebarElement.style.width || '300px';
            sidebarElement.style.transform = 'none';
            sidebarElement.style.display = 'block';
            sidebarElement.style.opacity = '1';
            sidebarElement.style.pointerEvents = 'auto';
            sidebarElement.style.zIndex = '10050';
            try{ menuToggle.setAttribute('aria-expanded','true'); }catch(e){}
            document.body.style.overflow = 'hidden';
        } catch(err){ console.error('openSidebar error', err); }
    }
    function closeSidebar(){
        try{
            // closing sidebar
            sidebarElement.classList.remove('open');
            try{ sidebarElement.style.transform = ''; sidebarElement.style.display = ''; sidebarElement.style.opacity = ''; sidebarElement.style.pointerEvents = ''; /* keep zIndex for stacking */ } catch(e){}
            sidebarElement.setAttribute('aria-hidden','true');
            try{ menuToggle.setAttribute('aria-expanded','false'); }catch(e){}
            document.body.style.overflow = '';
            // close complete
        } catch(err){ console.error('closeSidebar error', err); }
    }
    function toggleSidebar(){
        if (sidebarElement.classList.contains('open')) closeSidebar(); else openSidebar();
    }

    // attach direct handler if toggle exists
    try{
        menuToggle.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); toggleSidebar(); });
        try{ menuToggle.dataset.sidebarBound = 'true'; }catch(e){}
    } catch(e){}

    if (closeSidebarButton){
        closeSidebarButton.addEventListener('click', closeSidebar);
    }

    // close when clicking any internal nav link
    const navLinks = sidebarElement.querySelectorAll('a');
    navLinks.forEach(link => link.addEventListener('click', () => { closeSidebar(); }));

    // delegation fallback: handle clicks on dynamically created / differently marked toggles
    document.body.addEventListener('click', (e)=>{
        const t = e.target.closest('#menu-toggle, .menu-toggle, [aria-controls="sidebar"]');
        if (t) {
            e.preventDefault();
            toggleSidebar();
        }
    });

    // header fallback: if the toggle is not receiving clicks (overlay issues), allow clicking the header area
    try{
        const headerArea = document.querySelector('.header-content') || document.querySelector('header');
        if (headerArea) {
            headerArea.addEventListener('click', function(e){
                // ignore clicks on interactive children (links, buttons, inputs)
                if (e.target.closest('a, button, input, label')) return;
                toggleSidebar();
            });
        }
    } catch(e) { /* ignore */ }

    // Close sidebar when clicking outside of it (but ignore clicks on the toggle)
    document.addEventListener('click', function(e){
        try{
            if (!sidebarElement.classList.contains('open')) return;
            const clickedInside = !!e.target.closest('#sidebar');
            const clickedToggle = !!e.target.closest('#menu-toggle') || !!e.target.closest('.menu-toggle') || !!e.target.closest('[aria-controls="sidebar"]');
            if (!clickedInside && !clickedToggle) {
                closeSidebar();
            }
        } catch(err) { /* ignore */ }
    });
}

/** Initialisiert die Modal-Steuerung mit Event Delegation (Login + Kontakt). */
function initModalControl() {
    const loginModalElement = document.getElementById('login-modal');
    const contactModalElement = document.getElementById('contact-modal');

    // only enable contact-related handlers when the modal exists on the page
    // Note: we no longer treat `a[href="#open-contact"]` as a modal trigger —
    // Links should navigate to a dedicated Kontaktseite instead.
    const hasContactControls = !!contactModalElement;

    // Event delegation: open login or contact modal
    document.body.addEventListener('click', (e) => {
        const linkLogin = e.target.closest('a[href="#open-login"]');
        if (linkLogin) { e.preventDefault(); openLoginModal(); return; }
        // Kontakt-Links are not intercepted here anymore. They should be full links
        // to a Kontaktseite (e.g. `Abonenten/kontaktdaten.html`).
    });

    // Backdrop click to close login
    if (loginModalElement) {
        loginModalElement.addEventListener('click', (e) => {
            if (e.target === loginModalElement) closeLoginModal();
        });
    }

    // Backdrop click to close contact (only if modal exists)
    if (contactModalElement) {
        contactModalElement.addEventListener('click', (e) => {
            if (e.target === contactModalElement) closeContactModal();
        });
    }

    // ESC key closes any open modal (contact close only if contact exists)
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (loginModalElement && !loginModalElement.classList.contains('hidden')) closeLoginModal();
        if (hasContactControls && contactModalElement && !contactModalElement.classList.contains('hidden')) closeContactModal();
    });
}

/** Initialisiert Kontaktformular-Handling: speichern/abbrechen */
function initContactForm(){
    const form = document.getElementById('contact-form');
    if (!form) return;

    const closeBtn = document.getElementById('contact-close');
    const cancelBtn = document.getElementById('contact-cancel');

    if (closeBtn) closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeContactModal(); });
    if (cancelBtn) cancelBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeContactModal(); });

    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        // collect contact data
        const rawCard = (document.getElementById('contact-card-number')?.value || '').replace(/\s+/g,'');
        const rawIban = (document.getElementById('contact-iban')?.value || '').replace(/\s+/g,'');
        const paymentMethod = (document.getElementById('contact-payment-method')?.value || '');

        const payment = { method: paymentMethod };
        if (paymentMethod === 'card' && rawCard.length >= 4) {
            payment.card_last4 = rawCard.slice(-4);
            payment.card_name = document.getElementById('contact-card-name')?.value || '';
            // Do NOT store full card number or CVC
        } else if (paymentMethod === 'sepa' && rawIban.length >= 4) {
            payment.iban_last4 = rawIban.slice(-4);
        } else if (paymentMethod === 'paypal') {
            payment.paypal_email = document.getElementById('contact-paypal-email')?.value || '';
        }

        const fname = document.getElementById('contact-firstname')?.value || '';
        const lname = document.getElementById('contact-lastname')?.value || '';
        const name = document.getElementById('contact-name')?.value || (fname + ' ' + lname).trim();

        const street = document.getElementById('contact-street')?.value || '';
        const houseno = document.getElementById('contact-houseno')?.value || '';
        const zip = document.getElementById('contact-zip')?.value || '';
        const city = document.getElementById('contact-city')?.value || '';
        
        let address = document.getElementById('contact-address')?.value || '';
        if (!address && (street || zip || city)) {
            address = `${street} ${houseno}, ${zip} ${city}`.trim();
        }

        const data = {
            name: name,
            firstname: fname,
            lastname: lname,
            email: document.getElementById('contact-email')?.value || '',
            phone: document.getElementById('contact-phone')?.value || '',
            address: address,
            street: street,
            houseno: houseno,
            zip: zip,
            city: city,
            payment: payment,
            savedAt: Date.now()
        };

        try{ localStorage.setItem('capitovo_contact', JSON.stringify(data)); } catch(e){ console.error('Speichern fehlgeschlagen', e); }

        const submitBtn = form.querySelector('button[type="submit"]');
        const oldText = submitBtn ? submitBtn.textContent : null;
        if (submitBtn) submitBtn.textContent = 'Gespeichert';
        setTimeout(()=>{ if (submitBtn && oldText) submitBtn.textContent = oldText; closeContactModal(); }, 900);
    });
    
    // toggle visible payment fields based on selected method
    const pm = document.getElementById('contact-payment-method');
    function updatePaymentFields(){
        const v = pm?.value || '';
        const card = document.getElementById('payment-card-fields');
        const sepa = document.getElementById('payment-sepa-fields');
        const pp = document.getElementById('payment-paypal-fields');
        if (card) card.classList.toggle('hidden', v !== 'card');
        if (sepa) sepa.classList.toggle('hidden', v !== 'sepa');
        if (pp) pp.classList.toggle('hidden', v !== 'paypal');
    }
    if (pm) {
        pm.addEventListener('change', updatePaymentFields);
        updatePaymentFields();
    }
}

/** Initialisiert die Validierung des Registrierungsformulars. */
function initRegistrationFormValidation() {
    const form = document.getElementById('registration-form');
    const button = document.getElementById('register-button');
    
    if (!form || !button) return;

    const inputs = form.querySelectorAll('input');
    const password = document.getElementById('password');
    const confirm = document.getElementById('password-confirm');
    const errorMsg = document.getElementById('password-match-error');
    const confirmLabel = form.querySelector('label[for="password-confirm"]');

    function validate() {
        // Custom password match check - must be done BEFORE checkValidity
        if (password && confirm) {
            // Nur prüfen, wenn im Bestätigungsfeld etwas steht
            if (confirm.value && password.value !== confirm.value) {
                confirm.setCustomValidity("Passwörter stimmen nicht überein");
                
                // Fehler-Styles anwenden
                confirm.classList.remove('border-gray-300', 'focus:border-accent-blue', 'focus:ring-accent-blue');
                confirm.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                
                if (errorMsg) {
                    errorMsg.classList.remove('hidden');
                    errorMsg.style.display = 'block';
                }
                
                if (confirmLabel) {
                    confirmLabel.classList.add('text-red-500');
                    confirmLabel.classList.remove('peer-focus:text-accent-blue');
                    confirmLabel.classList.add('peer-focus:text-red-500');
                }

            } else {
                confirm.setCustomValidity("");
                
                // Fehler-Styles entfernen (Normalzustand)
                confirm.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                confirm.classList.add('border-gray-300', 'focus:border-accent-blue', 'focus:ring-accent-blue');
                
                if (errorMsg) {
                    errorMsg.classList.add('hidden');
                    errorMsg.style.display = 'none';
                }

                if (confirmLabel) {
                    confirmLabel.classList.remove('text-red-500');
                    confirmLabel.classList.remove('peer-focus:text-red-500');
                    confirmLabel.classList.add('peer-focus:text-accent-blue');
                }
            }
        }

        // Check standard HTML5 validity (required, email format, etc.)
        // This now includes the custom validity set above
        let isValid = form.checkValidity();

        if (isValid) {
            button.disabled = false;
            button.classList.remove('bg-gray-400', 'cursor-not-allowed');
            button.classList.add('bg-primary-blue', 'hover:bg-blue-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-accent-blue');
        } else {
            button.disabled = true;
            button.classList.add('bg-gray-400', 'cursor-not-allowed');
            button.classList.remove('bg-primary-blue', 'hover:bg-blue-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-accent-blue');
        }
    }

    // Attach listeners to all inputs to trigger validation on change
    inputs.forEach(input => {
        input.addEventListener('input', validate);
        input.addEventListener('change', validate);
        input.addEventListener('blur', validate);
        input.addEventListener('keyup', validate);
    });
    
    // Initial check
    validate();
}


// === HAUPT-LOGIK ===
document.addEventListener('DOMContentLoaded', () => {
    ScrollReveal.init();

    // 1. Lade die Analysen
    loadAndRenderAnalyses();
    // 1b. Wenn die Abonnenten-Seite ein spezielles Grid hat, lade dort hochwertige Karten
    try { if (document.getElementById('member-analyses')) loadAndRenderMemberAnalyses(); } catch(e){}
    
    // 2. Initialisiere Sidebar und Navigation
    initSidebar();
    try{
        const mt = document.getElementById('menu-toggle');
        // post-init: menu-toggle presence recorded
    } catch(e){}

    // Diagnostics removed.
    
    // 3. Initialisiere Modal-Steuerung
    initModalControl();

    // Check for hash to open login modal automatically
    if (window.location.hash === '#open-login') {
        setTimeout(() => {
            openLoginModal();
        }, 100);
    }
    
    // 4. NEU: Initialisiere die simulierte Login-Funktionalität
    initTestLogin();
    // 4b. Initialisiere Kontaktdaten-Formular
    if (document.getElementById('contact-form')) {
        try { initContactForm(); } catch (e) { console.error('initContactForm error', e); }
    }
    // 4c. Initialisiere Registrierungs-Validierung
    initRegistrationFormValidation();
    // 5. Tippeffekt für Hero-Überschrift (nur einfügen, nicht andere Styles ändern)
    try { 
        typeHeroText(); 
    } catch (e) { /* ignore if function missing */ }
    // 5b. Wenn auf anderen Seiten ein Element mit id 'typing-heading' existiert,
    // tippe dessen Inhalt auf die gleiche Weise wie auf der Startseite.
    try {
        if (document.getElementById('typing-heading')) {
            try { typeElementText('#typing-heading', { speed: 45, delay: 140 }); } catch(e){}
        }
    } catch(e){}
    // 6. Hero candlestick removed per user request (no init)
    // Animation UI: removed automatic diagnostic/control buttons per user request
    // sidebar subscribe handler
    try { initSidebarSubscribeHandler(); } catch (e) { /* ignore */ }
    // 7. Init global logout handlers (works across pages even if modal markup missing)
    try { initLogoutHandlers(); } catch (e) { console.error('initLogoutHandlers error', e); }
    // 1c. If we're on a detail page placeholder, render the analysis
    try { if (document.getElementById('analysis-detail')) renderAnalysisDetail(); } catch(e){}
});

/** Initialisiert Logout-Handler auf allen Seiten.
 * Falls ein `#logout-confirm-modal` vorhanden ist, verwendet er dieses,
 * ansonsten zeigt er ein einfaches `confirm()` an.
 */
function initLogoutHandlers(){
    const modal = document.getElementById('logout-confirm-modal');
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const redirectPath = isInAbonenten ? '../index.html' : 'index.html';

    function doLogout(){
        try{ localStorage.removeItem('capitovo_session'); }catch(e){}
        // clear any other session-like keys if present
        try{ localStorage.removeItem('capitovo_contact'); }catch(e){}
        window.location.href = redirectPath;
    }

    const links = Array.from(document.querySelectorAll('a.logout-link'));
    if (!links.length) return;

    if (modal) {
        const yesBtn = document.getElementById('logout-confirm-yes');
        const noBtn = document.getElementById('logout-confirm-no');
        function openConfirm(){ modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
        function closeConfirm(){ modal.classList.add('hidden'); document.body.style.overflow = ''; }
        if (yesBtn) yesBtn.addEventListener('click', function(e){ e.preventDefault(); closeConfirm(); doLogout(); });
        if (noBtn) noBtn.addEventListener('click', function(e){ e.preventDefault(); closeConfirm(); });
        links.forEach(l => l.addEventListener('click', function(e){ e.preventDefault(); openConfirm(); }));
    } else {
        links.forEach(l => l.addEventListener('click', function(e){
            e.preventDefault();
            if (window.confirm('Möchten Sie sich wirklich abmelden?')) {
                doLogout();
            }
        }));
    }
}

/** Render the analysis detail page when `#analysis-detail` exists. */
async function renderAnalysisDetail(){
    const container = document.getElementById('analysis-detail');
    if (!container) return;
    const params = new URLSearchParams(window.location.search || '');
    const idRaw = params.get('id');
    const cacheBuster = `?t=${new Date().getTime()}`;
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const dataPath = (isInAbonenten ? '../' : '') + 'data/analysen.json' + cacheBuster;

    try{
        const res = await fetch(dataPath);
        if (!res.ok) throw new Error('Fetch fehlgeschlagen');
        const data = await res.json();
        const idx = idRaw ? parseInt(idRaw,10) : NaN;
        const analysis = (Number.isFinite(idx) && idx >= 0 && idx < data.length) ? data[idx] : null;
        if (!analysis) {
            container.innerHTML = `<div class="p-6 bg-white rounded-xl shadow"> <h2 class="text-xl font-semibold">Analyse nicht gefunden</h2><p class="text-sm text-gray-600">Entweder ist die Analyse nicht verfügbar oder die ID ist ungültig.</p><p class="mt-4"><a href="#" onclick="history.back();return false;" class="text-accent-blue">Zurück</a></p></div>`;
            return;
        }

        // build HTML — uses `content` when present, otherwise summary
        const title = analysis.title || 'Untitled';
        const category = analysis.category || '';
        const author = analysis.author || '';
        const date = analysis.date || '';
        const imgRaw = analysis.image || 'data/vorschaubilder/placeholder.png';
        const img = (/^(https?:)?\/\//i.test(imgRaw) || imgRaw.startsWith('/')) ? imgRaw : ((isInAbonenten ? '../' : '') + imgRaw);
        const bodyHtml = analysis.content ? analysis.content : `<p class="text-gray-700">${(analysis.summary || '')}</p>`;

        // Extract Stock Name from Title
        let stockName = '';
        if (title.includes('—')) {
            stockName = title.split('—')[0].trim();
        } else if (title.includes(':')) {
            stockName = title.split(':')[0].trim();
        }
        if (stockName.length > 25) stockName = '';

        // Favorites Logic for Detail View
        const favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
        const isFav = favorites.includes(title);
        const starFill = isFav ? 'currentColor' : 'none';
        const starColor = isFav ? 'text-yellow-400' : 'text-gray-400';

        const favButton = `
            <button onclick="toggleFavorite(event, '${title.replace(/'/g, "\\'")}')" 
                    class="p-2 transition-colors hover:scale-110"
                    title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
                <svg class="w-6 h-6 ${starColor} drop-shadow-md" fill="${starFill}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
            </button>
        `;

        const html = `
            <article class="max-w-4xl mx-auto">
                <div class="mb-4">
                    <a href="${isInAbonenten ? 'alle_analysen.html' : 'Abonenten/alle_analysen.html'}" onclick="try{ if(history.length>1 && document.referrer){ const ref=new URL(document.referrer); if(ref.origin===location.origin){ history.back(); return false; } } }catch(e){}" class="text-accent-blue text-sm">← Zurück</a>
                </div>
                <header class="mb-2 relative">
                    <div class="absolute top-0 right-0">
                        ${favButton}
                    </div>
                    <p class="text-xs font-semibold uppercase text-primary-blue mb-2 pr-12">
                        ${category} ${stockName ? `<span class="text-gray-400 mx-1">•</span> <span class="text-gray-500 font-bold">${stockName}</span>` : ''}
                    </p>
                    <h1 class="text-3xl font-extrabold text-gray-900 mb-3 pr-12">${title}</h1>
                    <div class="text-sm text-gray-500">
                        ${author ? `<span class=\"mr-2\">${author}</span>` : ''}
                        ${date ? `<span>• ${date}</span>` : ''}
                    </div>
                </header>
                <div class="mb-6">
                    <img src="${img}" alt="${title}" class="w-full object-cover">
                </div>
                <div class="prose max-w-none text-gray-700">
                    ${bodyHtml}
                </div>
            </article>
        `;

        container.innerHTML = html;
    }catch(e){
        console.error('Fehler beim Laden der Analyse-Detailseite', e);
        container.innerHTML = '<p class="text-sm text-red-500">Die Analyse konnte nicht geladen werden.</p>';
    }
}

/**
 * Tippt die Hero-Überschrift Zeichen für Zeichen ein. Nur fügt Verhalten hinzu,
 * ändert keine bestehenden Styles oder Klassen dauerhaft.
 */
function typeHeroText(options = {}){
    // start typing effect
    const speed = typeof options.speed === 'number' ? options.speed : 48; // ms per char
    const delay = typeof options.delay === 'number' ? options.delay : 220; // ms before start

    const h2 = document.querySelector('.hero h2');
    if(!h2) return;

    const full = h2.textContent || '';
    // don't run if already empty or already typed
    if(!full.trim() || h2.dataset.typed === 'true') return;

    // Reserve space to prevent layout shift
    const height = h2.offsetHeight;
    h2.style.minHeight = `${height}px`;

    h2.dataset.typed = 'true';
    h2.originalText = full;
    h2.textContent = '';
    h2.classList.add('typing-caret');

    let i = 0;
    setTimeout(() => {
        const timer = setInterval(() => {
            h2.textContent += full.charAt(i);
            i++;
            if(i >= full.length){
                clearInterval(timer);
                // short delay then remove caret
                setTimeout(() => h2.classList.remove('typing-caret'), 300);
            }
        }, speed);
    }, delay);
}

/**
 * Tippt den Text eines Elements (wie auf der Startseite) Zeichen für Zeichen ein.
 * selector: CSS-Selector oder DOM-Element
 */
function typeElementText(selector, options = {}){
    const speed = typeof options.speed === 'number' ? options.speed : 48;
    const delay = typeof options.delay === 'number' ? options.delay : 120;

    let el = null;
    if (typeof selector === 'string') el = document.querySelector(selector);
    else if (selector instanceof Element) el = selector;
    if (!el) return;

    const full = el.textContent || '';
    if (!full.trim() || el.dataset.typed === 'true') return;
    el.dataset.typed = 'true';
    el.originalText = full;
    el.textContent = '';
    el.classList.add('typing-caret');

    let i = 0;
    setTimeout(() => {
        const timer = setInterval(() => {
            el.textContent += full.charAt(i);
            i++;
            if (i >= full.length) {
                clearInterval(timer);
                setTimeout(()=> el.classList.remove('typing-caret'), 300);
            }
        }, speed);
    }, delay);
}

// --- Stock-like canvas background animation (non-destructive) ---
// Adds a full-width canvas behind the top section (hero) and animates a flowing line.
// Respects prefers-reduced-motion and uses devicePixelRatio for crisp rendering.
(function initStockBackground(){
    if (typeof window === 'undefined') return;
    // Disabled: animation removed per user request (do not mount on startpage)
    return;
    // allow pages to disable the animation before script loads
    try{ if (window.stockAnimDisabled) { return; } } catch(e){}
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Only allow mounting on the site's index/root page — prevents accidental mounts
        try{
            const p = (window.location && window.location.pathname || '').toLowerCase();
            const isIndexLike = p.endsWith('index.html') || p === '/' || p.endsWith('/');
            if (!isIndexLike) {
                return;
            }
    } catch(e){}

    let mounted = false;
    let rafId = null;

    function mount(){
        if (mounted) return; mounted = true;
        // Only mount the animation on pages that contain a hero area.
        // Prevents the canvas from being appended to document.body on other pages
        if (!document.querySelector('.hero') && !document.querySelector('.hero-wrapper')) {
            return;
        }
        const hero = document.querySelector('.hero');
        const heading = (hero && hero.querySelector('h2')) || document.querySelector('.hero h2');

        // read initial config (can be set before mount via window.stockAnimConfig)
        const initial = Object.assign({
            color: 'rgba(0,200,140,0.45)',
            speed: 3,
            lineWidth: 2,
            height: 140,
            visible: true
        }, window.stockAnimConfig || {});

        const c = document.createElement('canvas');
        c.id = 'stock';
        Object.assign(c.style, {
            position: 'absolute',
            zIndex: '100',
            pointerEvents: 'none',
            opacity: '1',
            background: '#ffffff',
            willChange: 'transform'
        });

        // Place canvas inside the hero wrapper (or hero) so z-indexing works predictably
        const container = document.querySelector('.hero-wrapper') || hero || document.body;
        // ensure container can position absolute children
        const containerStyle = window.getComputedStyle(container);
        if (containerStyle.position === 'static') container.style.position = 'relative';
        container.appendChild(c);
        const x = c.getContext('2d');

        // animation state variables that controller will update
        let strokeColor = initial.color;
        let animSpeed = Number(initial.speed) || 3;
        let lineW = Number(initial.lineWidth) || 2;
        let desiredHeight = Number(initial.height) || 140;
        let visible = !!initial.visible;
        // 3D perspective offsets (CSS pixels). Separate X/Y for better control.
        let depthX = (typeof initial.depthX === 'number') ? Number(initial.depthX) : ((typeof initial.depth === 'number') ? Number(initial.depth) : 8);
        let depthY = (typeof initial.depthY === 'number') ? Number(initial.depthY) : Math.max(1, Math.round((typeof initial.depth === 'number') ? Number(initial.depth)*0.45 : 4));

        // compute and apply size & position so canvas sits centered under the heading
        let _lastCssWidth = 0, _lastCssHeight = 0, _lastDPR = 0;
        // vertical offset to raise the canvas relative to heading (negative -> moves up)
        let canvasYOffset = -96;

        function resizeAndPosition(){
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const headingRect = heading ? heading.getBoundingClientRect() : null;

            // desired canvas width: 80% of heading width or 60% viewport, clamped
            const vw = window.innerWidth;
            const desiredWidth = headingRect ? Math.min(Math.max(300, headingRect.width * 0.9), Math.floor(vw * 0.8)) : Math.floor(vw * 0.8);
            const hpx = desiredHeight; // px in CSS pixels

            // compute top/left in CSS pixels relative to the container
            const containerRect = container.getBoundingClientRect();
            const top = headingRect ? (headingRect.bottom - containerRect.top + 8 + canvasYOffset) : Math.floor(window.innerHeight * 0.12 + canvasYOffset);
            const left = headingRect ? Math.floor((headingRect.left - containerRect.left) + (headingRect.width - desiredWidth) / 2) : Math.floor((vw - desiredWidth) / 2);

            // apply CSS size/position (relative to container)
            c.style.left = left + 'px';
            c.style.top = top + 'px';
            c.style.width = desiredWidth + 'px';
            c.style.height = hpx + 'px';
            c.style.display = visible ? 'block' : 'none';

                // set backing buffer size for DPR and scale context only when size or DPR changed
                if (desiredWidth !== _lastCssWidth || hpx !== _lastCssHeight || DPR !== _lastDPR) {
                    _lastCssWidth = desiredWidth; _lastCssHeight = hpx; _lastDPR = DPR;
                    c.width = Math.floor(desiredWidth * DPR);
                    c.height = Math.floor(hpx * DPR);
                    // reset transform and scale -> draw using CSS pixels
                    x.setTransform(1, 0, 0, 1, 0, 0);
                    x.scale(DPR, DPR);
                    // reinitialize points for new size
                    try { initPoints(); } catch (e) { /* ignore if not ready */ }
                }
        }

            // ensure heading sits above the canvas
        if (heading) {
            const hs = window.getComputedStyle(heading);
            if (hs.position === 'static') heading.style.position = 'relative';
            // ensure heading is above the canvas
            heading.style.zIndex = '101';
        }

            // initial position
            resizeAndPosition();
            const onResize = () => resizeAndPosition();

            // For scroll we only adjust the CSS position (left/top) to avoid re-allocating the backing buffer
            // or reinitializing points on every scroll tick which caused visual jumps/acceleration.
            function positionOnly(){
                const headingRect = heading ? heading.getBoundingClientRect() : null;
                const containerRect = container.getBoundingClientRect();
                const vw = window.innerWidth;
                const desiredWidth = headingRect ? Math.min(Math.max(300, headingRect.width * 0.9), Math.floor(vw * 0.8)) : Math.floor(vw * 0.8);
                const left = headingRect ? Math.floor((headingRect.left - containerRect.left) + (headingRect.width - desiredWidth) / 2) : Math.floor((vw - desiredWidth) / 2);
                const top = headingRect ? (headingRect.bottom - containerRect.top + 8 + canvasYOffset) : Math.floor(window.innerHeight * 0.12 + canvasYOffset);
                c.style.left = left + 'px';
                c.style.top = top + 'px';
            }

            let _scrollTick = false;
            const onScroll = () => {
                if (!_scrollTick) {
                    _scrollTick = true;
                    requestAnimationFrame(() => { positionOnly(); _scrollTick = false; });
                }
            };

            window.addEventListener('resize', onResize, {passive:true});
            window.addEventListener('scroll', onScroll, {passive:true});

        // animation state: line chart
        let points = [];
        let pointSpacing = 6; // px between sample points
        // higher default volatility for a more jagged, 'market-like' line
        let volatility = 32; // amplitude for random moves (px)
        let amplitude = volatility;
        // upward trend: px per second (negative moves line up visually)
        let trendPerSecond = (typeof initial.trendPerSecond === 'number') ? Number(initial.trendPerSecond) : -6;
        // visualTrend is applied at draw time (so underlying point y-values keep their jitter)
        let visualTrend = 0;

        // initialize points to fill width along an upward-sloping baseline (bottom-left → top-right)
        function initPoints(){
            points = [];
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const cssWidth = parseInt(c.style.width,10) || Math.floor((c.width || window.innerWidth)/DPR);
            const cssHeight = parseInt(c.style.height,10) || Math.floor((c.height || window.innerHeight)/DPR);
            const count = Math.ceil(cssWidth / pointSpacing) + 6;
            // baseline near the bottom of canvas
            const baseline = cssHeight * 0.85;
            // slope amount so right side is visibly higher (less y -> toward top)
            const slope = cssHeight * 0.5; // strong visible slope
            for(let i=0;i<count;i++){
                const xPos = i * pointSpacing;
                const t = Math.max(0, Math.min(1, xPos / Math.max(1, cssWidth)));
                // y decreases with x to create upward trend left->right
                const ideal = baseline - slope * t;
                const jitter = (Math.random() - 0.5) * amplitude;
                const y = Math.max(2, Math.min(cssHeight-2, ideal + jitter));
                points.push({x: xPos, y});
            }
            // reset cumulative trend so initial shape is driven by baseline slope
            cumulativeTrend = 0;
        }

        function appendPoint(){
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const baseline = (c.height / DPR) / 2;
            const last = points.length ? points[points.length-1] : {y: baseline};
            // mostly moderate jitter, occasional larger spike for realism
            const spike = Math.random() < 0.18; // 18% chance of spike for persistent variance
            const baseFactor = 0.45 + Math.random() * 0.7; // 0.45 - 1.15
            const multiplier = spike ? (1.8 + Math.random()*1.6) : baseFactor;
            const jitter = (Math.random() - 0.5) * amplitude * multiplier;
            // limit per-step jump to avoid extreme stuttering
            const maxJump = Math.max(6, amplitude * 0.9);
            const delta = Math.max(-maxJump, Math.min(maxJump, jitter));
            const y = Math.max(2, Math.min((c.height/DPR)-2, last.y + delta));
            const xPos = points.length ? points[points.length-1].x + pointSpacing : 0;
            points.push({x: xPos, y});
        }

        let _frameCount = 0;
        let _lastTime = null;
        function step(now){
            if (!_lastTime) _lastTime = now || performance.now();
            const timestamp = now || performance.now();
            const dt = Math.min(200, timestamp - _lastTime); // cap delta to avoid huge jumps
            _lastTime = timestamp;

            // update visual trend based on time (px per second)
            visualTrend += (trendPerSecond * (dt / 1000));

            // convert animSpeed (legacy: px per frame at 60fps) into px per delta
            const factor = dt / (1000 / 60);
            const moveBy = animSpeed * factor;

            // move points left by time-corrected animSpeed
            for(const p of points) p.x -= moveBy;

            // remove off-screen points
            while(points.length && (points[0].x + pointSpacing) < 0) points.shift();

            // append if needed to fill right side
            const desiredWidth = parseInt(c.style.width,10) || window.innerWidth;
            while(!points.length || (points[points.length-1].x + pointSpacing) < desiredWidth + pointSpacing){
                appendPoint();
            }

            // clear and draw (use CSS pixels)
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const canvasH = c.height / DPR;
            const cssWidth = parseInt(c.style.width, 10) || (c.width / DPR);
            const cssHeight = canvasH;
            x.clearRect(0, 0, cssWidth, cssHeight);
            _frameCount++;
            if (_frameCount % 60 === 0) {
                // periodic frame counter (debug removed)
            }

            // fill white background so it matches page
            try{
                x.save();
                x.fillStyle = '#ffffff';
                x.fillRect(0,0, cssWidth, canvasH);
                x.restore();
            } catch(e){}

            // draw the line with a sharper, more jagged appearance and a 3D extrusion
            if (points.length){
                x.save();
                x.lineWidth = lineW;
                x.strokeStyle = strokeColor;
                x.lineJoin = 'miter';
                x.lineCap = 'butt';

                // build drawPoints = underlying points + visualTrend (visual offset applied at draw time)
                const widthForPerspective = Math.max(1, cssWidth);
                const depthOffsetX = Number(depthX) || 0;
                const depthOffsetY = Number(depthY) || 0;
                let drawPoints = points.map(p => ({ x: p.x, y: p.y + visualTrend }));

                // if the drawn points moved above the canvas top, nudge underlying points down
                // so the curve doesn't clip to the top and become a flat line
                const minY = Math.min(...drawPoints.map(p=>p.y));
                if (minY < 4) {
                    const shift = 4 - minY;
                    for (let k=0;k<points.length;k++) points[k].y += shift;
                    // recompute drawPoints after shifting underlying data
                    drawPoints = points.map(p => ({ x: p.x, y: p.y + visualTrend }));
                }

                // build offsetPoints from drawPoints so extrusion follows the visible curve
                const offsetPoints = drawPoints.map(p => {
                    const t = Math.max(0, Math.min(1, p.x / widthForPerspective));
                    return { x: p.x + depthOffsetX * t, y: p.y + depthOffsetY * t };
                });

                // fill the extrusion polygon between drawPoints and its offset to simulate depth (with gradient)
                try{
                    x.beginPath();
                    x.moveTo(drawPoints[0].x, drawPoints[0].y);
                    for(let i=1;i<drawPoints.length;i++){
                        const p = drawPoints[i];
                        x.lineTo(p.x, p.y);
                    }
                    // connect to offset points in reverse
                    for(let j=offsetPoints.length-1;j>=0;j--){
                        const op = offsetPoints[j];
                        x.lineTo(op.x, op.y);
                    }
                    x.closePath();
                    const grad = x.createLinearGradient(0, 0, 0, cssHeight + depthOffsetY);
                    grad.addColorStop(0, 'rgba(0,0,0,0.06)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
                    x.fillStyle = grad;
                    x.fill();
                } catch(e){}

                // draw the sharp polyline on top (straight segments to keep corners)
                x.beginPath();
                // draw using drawPoints so everything is consistent with extrusion
                x.moveTo(drawPoints[0].x, drawPoints[0].y);
                for(let i=1;i<drawPoints.length;i++){
                    const p = drawPoints[i];
                    x.lineTo(p.x, p.y);
                }
                x.stroke();

                // subtle highlight along the top-left edge of extrusion
                try{
                    x.beginPath();
                    x.moveTo(drawPoints[0].x - depthOffsetX * 0.08 * 0, drawPoints[0].y - depthOffsetY * 0.08 * 0);
                    for(let i=1;i<drawPoints.length;i++){
                        const p = drawPoints[i];
                        const t = Math.max(0, Math.min(1, p.x / widthForPerspective));
                        x.lineTo(p.x - depthOffsetX * 0.08 * t, p.y - depthOffsetY * 0.08 * t);
                    }
                    x.strokeStyle = 'rgba(255,255,255,0.6)';
                    x.lineWidth = Math.max(1, Math.min(2, lineW/2));
                    x.stroke();
                } catch(e){}

                // apply horizontal fade mask so line fades at left and right edges, making overall composition rounder
                try{
                    x.save();
                    x.globalCompositeOperation = 'destination-in';
                    const mask = x.createLinearGradient(0,0,cssWidth,0);
                    const fade = Math.max(0.05, Math.min(0.35, Math.max(0.12, pointSpacing/40)));
                    mask.addColorStop(0, 'rgba(0,0,0,0)');
                    mask.addColorStop(fade, 'rgba(0,0,0,1)');
                    mask.addColorStop(1-fade, 'rgba(0,0,0,1)');
                    mask.addColorStop(1, 'rgba(0,0,0,0)');
                    x.fillStyle = mask;
                    x.fillRect(0,0,cssWidth,cssHeight);
                    x.restore();
                } catch(e){}

                x.restore();
            }

            rafId = requestAnimationFrame(step);
        }

            // initialize and force one immediate draw so the animation doesn't appear "small"
        initPoints();
        // perform a synchronous first frame render
        try { step(performance.now()); } catch(e) { /* ignore */ }
        rafId = requestAnimationFrame(step);

                // expose controller for live changes (extended for candles/line)
        window.stockAnimController = {
            setColor(cNew){ strokeColor = cNew; },
            setSpeed(s){ animSpeed = Number(s) || animSpeed; },
            setLineWidth(w){ lineW = Number(w) || lineW; },
            setHeight(h){ desiredHeight = Number(h) || desiredHeight; resizeAndPosition(); },
            setVisible(v){ visible = !!v; c.style.display = visible ? 'block' : 'none'; },
            // point/line specific
            setCandleWidth(w){ /* legacy alias -> pointSpacing */ pointSpacing = Math.max(1, Number(w) || pointSpacing); initPoints(); },
            setSpacing(s){ pointSpacing = Math.max(1, Number(s) || pointSpacing); initPoints(); },
            setVolatility(v){ volatility = Math.max(0, Number(v) || volatility); amplitude = volatility; },
            // depth X/Y
            setDepthX(dx){ depthX = Math.max(0, Number(dx) || 0); },
            setDepthY(dy){ depthY = Math.max(0, Number(dy) || 0); },
            // legacy: setDepth sets both
            setDepth(d){ depthX = depthY = Math.max(0, Number(d) || 0); },
            // new: control canvas vertical offset (CSS px) and trend
            setCanvasYOffset(y){ canvasYOffset = Number(y) || 0; resizeAndPosition(); },
            setTrendPerSecond(t){ trendPerSecond = Number(t) || 0; },
            getConfig(){ return { color: strokeColor, speed: animSpeed, lineWidth: lineW, height: desiredHeight, visible: visible, pointSpacing: pointSpacing, volatility: volatility, depthX: depthX, depthY: depthY }; }
        };

        // cleanup when page unloads
        function unmount(){
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('pagehide', onPageHide);
            if (c && c.parentNode) c.parentNode.removeChild(c);
            // remove controller
            try{ delete window.stockAnimController; } catch(e){ window.stockAnimController = undefined; }
        }
        function onPageHide(){ unmount(); }
        window.addEventListener('pagehide', onPageHide);
    }

    // Mount after DOM ready to avoid interfering with layout constructs
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(mount, 20);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 20));
    }

})();

// Hero canvas removed: the inline hero chart has been removed per user request.