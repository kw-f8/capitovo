// Passwort einblenden/ausblenden im Login-Formular (wie Registrierung)
document.addEventListener('DOMContentLoaded', function() {
    var pwInput = document.getElementById('password');
    var toggleBtn = document.getElementById('toggle-password-login');
    var icon = document.getElementById('icon-password-login');
    if (pwInput && toggleBtn && icon) {
        // Icon erst anzeigen, wenn etwas eingegeben wurde
        pwInput.addEventListener('input', function() {
            toggleBtn.style.display = pwInput.value ? '' : 'none';
        });
        // Initial prüfen (z.B. Autofill)
        toggleBtn.style.display = pwInput.value ? '' : 'none';

        toggleBtn.addEventListener('click', function() {
            var isPw = pwInput.type === 'password';
            pwInput.type = isPw ? 'text' : 'password';
            // Verwende exakt dieselben SVG-Elemente wie in registrieren.html
            if (icon) {
                if (isPw) {
                    // nach dem Klick: sichtbar -> durchgestrichenes Auge
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>' +
                                     '<circle cx="12" cy="12" r="3" stroke-width="2"/>' +
                                     '<line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2"/>';
                } else {
                    // nach dem Klick: versteckt -> normales Auge
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>' +
                                     '<circle cx="12" cy="12" r="3" stroke-width="2"/>';
                }
            }
        });
    }
});
// script.js

// === FAVICON (GLOBAL) ===
// Safari & Co. can cache favicons aggressively. We ensure a small, standard favicon set
// exists on every page that loads `script.js`, and we add a version query to bust caches.
(function ensureCapitovoFavicon(){
    try{
        // bump this value whenever you change favicon assets
        const version = '2025-12-21c';
        const scriptEl = document.currentScript || document.querySelector('script[src*="script.js"]');
        const scriptUrl = scriptEl && scriptEl.src ? new URL(scriptEl.src, document.baseURI) : new URL(document.baseURI);
        const rootUrl = new URL('.', scriptUrl);

        const icon16 = new URL('assets/favicon-16.png', rootUrl);
        icon16.searchParams.set('v', version);
        const icon32 = new URL('assets/favicon-32.png', rootUrl);
        icon32.searchParams.set('v', version);
        const appleTouch = new URL('assets/apple-touch-icon.png', rootUrl);
        appleTouch.searchParams.set('v', version);

        // Remove existing favicon declarations so we don't end up with conflicting icons.
        document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
            .forEach(el => el.parentNode && el.parentNode.removeChild(el));

        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;

        const link32 = document.createElement('link');
        link32.rel = 'icon';
        link32.type = 'image/png';
        link32.sizes = '32x32';
        link32.href = icon32.toString();
        head.appendChild(link32);

        const link16 = document.createElement('link');
        link16.rel = 'icon';
        link16.type = 'image/png';
        link16.sizes = '16x16';
        link16.href = icon16.toString();
        head.appendChild(link16);

        const shortcut = document.createElement('link');
        shortcut.rel = 'shortcut icon';
        shortcut.href = icon32.toString();
        head.appendChild(shortcut);

        const apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        apple.sizes = '180x180';
        apple.href = appleTouch.toString();
        head.appendChild(apple);
    }catch(e){ /* ignore */ }
})();

// === FAVORITEN: MIGRATION TITEL -> ID (EINMALIG) ===
// Ältere Versionen speicherten Favoriten als Titel. Ab jetzt nutzen wir die stabile Analyse-ID.
(async function migrateFavoritesTitleToId(){
    let favoritesRaw = [];
    try { favoritesRaw = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]'); } catch(e) { favoritesRaw = []; }
    if (!Array.isArray(favoritesRaw) || favoritesRaw.length === 0) return;

    // Nur migrieren, wenn überhaupt Nicht-ID Werte drin sind (heuristisch: kein '-' oder sehr kurz).
    const mightContainTitles = favoritesRaw.some(v => typeof v === 'string' && v && (!v.includes('-') || v.length < 12));
    if (!mightContainTitles) return;

    const basePath = (location && location.pathname ? location.pathname.toLowerCase() : '');
    const candidates = [];
    if (basePath.includes('/abonenten/aktien-monitor/')) {
        candidates.push('../../data/analysen.json');
        candidates.push('../data/analysen.json');
        candidates.push('/capitovo/data/analysen.json');
    } else if (basePath.includes('/abonenten/')) {
        candidates.push('../data/analysen.json');
        candidates.push('../../data/analysen.json');
        candidates.push('/capitovo/data/analysen.json');
    } else {
        candidates.push('data/analysen.json');
        candidates.push('../data/analysen.json');
        candidates.push('/capitovo/data/analysen.json');
    }

    let analyses = null;
    for (const url of candidates) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            analyses = await res.json();
            if (Array.isArray(analyses) && analyses.length) break;
        } catch(e) {}
    }
    if (!Array.isArray(analyses) || analyses.length === 0) return;

    const titleToId = new Map();
    const validIds = new Set();
    analyses.forEach(a => {
        if (a && typeof a.id === 'string' && a.id) validIds.add(a.id);
        if (a && typeof a.title === 'string' && a.title && typeof a.id === 'string' && a.id) titleToId.set(a.title, a.id);
    });

    const migrated = [];
    for (const fav of favoritesRaw) {
        if (typeof fav !== 'string' || !fav) continue;
        if (validIds.has(fav)) { migrated.push(fav); continue; }
        const mapped = titleToId.get(fav);
        migrated.push(mapped || fav);
    }

    // dedupe
    const deduped = Array.from(new Set(migrated));
    const changed = deduped.length !== favoritesRaw.length || deduped.some((v, i) => v !== favoritesRaw[i]);
    if (changed) {
        try { localStorage.setItem('capitovo_favorites', JSON.stringify(deduped)); } catch(e) {}
        document.dispatchEvent(new CustomEvent('favorites-updated'));
    }
})();

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

/** Öffnet das Passwort-vergessen-Modal (gleicher Screen wie Login-Modal). */
function openForgotPasswordModal() {
    const forgotModal = document.getElementById('forgot-password-modal');
    const loginModal = document.getElementById('login-modal');
    if (!forgotModal) return;

    // Login-Modal schließen, falls offen
    if (loginModal && !loginModal.classList.contains('hidden')) {
        loginModal.classList.add('hidden');
    }

    // alte Hinweise zurücksetzen
    try {
        const hint = document.getElementById('forgot-password-hint');
        if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
    } catch(e) {}

    forgotModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/** Schließt das Passwort-vergessen-Modal. */
function closeForgotPasswordModal() {
    const forgotModal = document.getElementById('forgot-password-modal');
    if (!forgotModal) return;
    forgotModal.classList.add('hidden');
    document.body.style.overflow = '';
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

/** Resolve a relative prefix to the repo root for pages nested under folders like /Abonenten/...
 * Example: '/capitovo/Abonenten/Aktien-Monitor/aktien-monitor_apple.html' -> '../' repeated 2 -> '../../'
 */
/** Returns a prefix like '../../' that brings the current page to the repository root.
 * Example: '/capitovo/Abonenten/Aktien-Monitor/seite.html' -> '../../'
 */
function prefixToRepoRoot(){
    try{
        const pathname = (window.location.pathname || '').split('?')[0].split('#')[0];
        const parts = pathname.split('/').filter(Boolean);
        // If path is just '/' or '/index.html' -> no prefix
        const depth = Math.max(0, parts.length - 1);
        return '../'.repeat(depth);
    }catch(e){ return ''; }
}

/** Return the repository base path (path segment(s) before a given directory name like 'Abonenten').
 * Example: '/capitovo/Abonenten/...'=> '/capitovo' ; '/Abonenten/..' => ''
 */
function repoBasePathBefore(dirName){
    try{
        const pathname = (window.location.pathname || '').split('?')[0].split('#')[0];
        const parts = pathname.split('/').filter(Boolean);
        const idx = parts.map(p=>p.toLowerCase()).indexOf(String(dirName).toLowerCase());
        if (idx <= 0) return '';
        return '/' + parts.slice(0, idx).join('/');
    }catch(e){ return ''; }
}

// Kontaktverwaltung: Verwendung einer dedizierten Seite `Abonenten/kontaktdaten.html`.

// === ANALYSEN RENDERING LOGIK ===

/**
 * Erstellt das HTML für einen einzelnen Analyse-Artikel.
 * Hinweis: Verwendet 'text-blue-500', da 'text-accent-blue' eine Custom-Klasse ist, 
 * die Tailwind ggf. nicht kennt, falls sie nicht in der config.js ist.
 */
function createAnalysisArticle(analysis, idx){
    // Auf der Startseite (nicht im Abonenten-Bereich) soll der Link zum Login führen
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const link = isInAbonenten ? computeAnalysisLink(analysis, idx) : '#open-login';
    
    // Verwendung des neuen, von Ihnen genehmigten HTML-Templates, angepasst an die Datenstruktur
    return `
            <a href="${link}" class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block overflow-hidden group" data-scroll="fade-up">
            
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
            
            <div class="mt-auto">
                <p class="text-xs text-gray-500 mb-2">Aktualisiert: Dez. 2025 · Fundamentalanalyse</p>
                <span class="text-sm font-medium text-primary-blue hover:text-blue-600 transition duration-150 flex items-center">
                    Analyse ansehen →
                </span>
            </div>
            
        </a>
    `;
}

/** Öffnet ein Modal, das den Nutzer auffordert, ein Abonnement abzuschließen. */
function openSubscriptionModal() {
    let modal = document.getElementById('subscription-modal');
    if (!modal) {
        const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
        const pricingLink = isInAbonenten ? '../checkout.html?plan=premium' : 'checkout.html?plan=premium';
        
        modal = document.createElement('div');
        modal.id = 'subscription-modal';
                if (ok) {
                    // Kein Erfolgstext gewünscht
                    hint.style.display = 'none';
                    hint.textContent = '';
                } else {
                    hint.style.display = 'block';
                    hint.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
                    hint.style.color = '#ef4444';
                }
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-gray-200 relative" style="z-index: 10051;">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-4">
                    <svg class="h-6 w-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 class="text-lg leading-6 font-bold text-gray-900 mb-2">Abonnement erforderlich</h3>
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

/** Öffnet ein Hinweis-Modal für Nutzer im Free-Abo (eingeschränkter Zugriff) inkl. CTA zu Premium. */
function openFreePlanGateModal() {
    let modal = document.getElementById('free-plan-gate-modal');

    // Compute checkout link that works from nested Abonenten pages.
    let checkoutLink = 'checkout.html?plan=premium';
    try {
        const prefix = prefixToRepoRoot();
        checkoutLink = prefix + 'checkout.html?plan=premium';
    } catch (e) {}

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'free-plan-gate-modal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-75 backdrop-blur-xl-custom flex items-center justify-center p-4';
        modal.style.zIndex = '1001';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl">
                <div class="mb-3 text-center">
                    <div class="flex flex-wrap items-center justify-center gap-2 w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <circle cx="12" cy="16" r="0.5" />
                        </svg>
                        <h3 class="text-xl leading-6 font-bold text-gray-900 text-center" style="margin:0;">Sie nutzen aktuell das kostenlose Abonnement</h3>
                    </div>
                    <p class="text-sm text-gray-600 mt-3 mx-auto" style="max-width:520px;">Der kostenlose Zugang bietet Ihnen einen begrenzten Einblick</p>
                </div>

                <div class="rounded-md p-4 text-sm text-gray-700 mb-5" style="border:1px solid rgba(0,145,214,0.12); box-shadow: 0 4px 12px rgba(2,6,23,0.04); background-color:#ffffff;">
                    <p class="font-bold text-gray-900 mb-2">Mit dem Premium Abonnement erhalten Sie Zugriff auf:</p>
                    <ul class="list-disc pl-5 space-y-1">
                        <li>Alle veröffentlichten Analysen</li>
                        <li>Neue Analysen während der Laufzeit des Abonnements</li>
                        <li>Den Aktienmonitor</li>
                        <li>Den Wirtschaftskalender</li>
                    </ul>
                </div>

                <div class="flex flex-col gap-3">
                    <a href="${checkoutLink}" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-blue text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm">
                        Premium Abonnement abschließen
                    </a>
                    <button type="button" id="close-free-plan-gate" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                        Weiter mit kostenlosem Zugang
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        const btn = modal.querySelector('#close-free-plan-gate');
        if (btn) btn.addEventListener('click', close);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/** Zeigt den Free-Abo Hinweis einmalig pro Session im Abonenten-Bereich. */
function maybeShowFreePlanGate() {
    try {
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.includes('/abonenten/')) return;
        // Don't show on checkout itself (if embedded/linked) or on public pages.
        if (path.endsWith('/checkout.html')) return;

        // Only show once per session/tab.
        if (sessionStorage.getItem('capitovo_free_gate_shown') === 'true') return;

        const sess = JSON.parse(localStorage.getItem('capitovo_session') || '{}');
        const email = (sess.email || '').toString().trim().toLowerCase();
        const sub = (sess.subscription || '').toString().trim().toLowerCase();

        // Require a logged-in session.
        const loggedIn = sessionStorage.getItem('capitovo_logged_in') === 'true' || !!email;
        if (!loggedIn) return;

        // Premium users should not see this.
        const isPremium = (email === 'test@capitovo.de') || (sub && sub !== 'none');
        if (isPremium) return;

        // Mark as shown before opening to avoid double-open on re-inits.
        sessionStorage.setItem('capitovo_free_gate_shown', 'true');
        openFreePlanGateModal();
    } catch (e) {
        // fail silently
    }
}

/** Erstellt eine größere, gestaltete Karte für die Abonnenten-Seite. */
function createMemberAnalysisCard(a, idx, showFavorites = false){
    const title = a.title || 'Unbenannte Analyse';
    const favId = a.id || title;
    const summary = a.summary || '';
    // Sanitize summary for preview: remove Zahlen, Währungs- und Prozentzeichen
    const previewSummary = (summary
        .replace(/[€$%]/g, '')           // strip currency/percent symbols
        .replace(/\b\d[\d.,/]*\b/g, '') // remove numeric blobs (incl. decimals, slashes)
        .replace(/\s+/g, ' ')            // collapse spaces
        .replace(/\s+([.,;:])/g, '$1')   // fix spaces before punctuation
        .trim()) || summary.trim();       // fallback to original text if everything got stripped
    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const base = isInAbonenten ? '../' : '';
    const rawImg = a.image || 'data/vorschaubilder_analysen/placeholder.png';
    const img = (/^(https?:)?\/\//i.test(rawImg) || rawImg.startsWith('/')) ? rawImg : (base + rawImg);
    const category = a.category || 'Analyse';
    const link = computeAnalysisLink(a, idx, base);

    // check access (members page usually expects logged-in users)
    let hasAccess = false;
    try {
        const sess = JSON.parse(localStorage.getItem('capitovo_session') || '{}');
        if (sess.email === 'test@capitovo.de' || (sess.subscription && sess.subscription !== 'none')) hasAccess = true;
    } catch(e) {}

    const finalLink = hasAccess ? link : '#';
    const onclickAttr = hasAccess ? '' : 'onclick="event.preventDefault(); openSubscriptionModal();"';

    // Favoriten-Status lesen
    let favorites = [];
    try { favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]'); } catch(e) { favorites = []; }
    const isFav = favorites.includes(favId);
    const safeId = favId.replace(/"/g, '&quot;');
    const favClasses = isFav ? 'text-yellow-400' : 'text-gray-400';
    const favFill = isFav ? 'currentColor' : 'none';
    const favLabel = isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen';

    // Return the exact same markup used on the homepage so visuals match site-wide, plus optional Favoriten-Stern
    return `
            <a href="${finalLink}" ${onclickAttr} class="relative bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block overflow-hidden group" data-scroll="fade-up">
            
            ${showFavorites ? `
                <button
                    class="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 p-0 text-gray-400 hover:text-yellow-400 transition-colors z-10"
                    style="background:transparent;border:none"
                    aria-label="${favLabel}"
                    aria-pressed="${isFav ? 'true' : 'false'}"
                    title="${favLabel}"
                    data-title="${safeId}"
                    onclick="toggleFavorite(event, this.dataset.title)"
                >
                    <svg class="w-5 h-5 ${favClasses}" viewBox="0 0 24 24" fill="${favFill}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                </button>
            ` : ''}

            <div class="media bg-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <img src="${img}" alt="Vorschaubild für ${title}" 
                     class="w-full h-full object-cover group-hover:opacity-85 transition duration-300">
            </div>
            
            <p class="text-xs font-semibold uppercase tracking-widest text-primary-blue mb-1">
                ${category}
            </p>
            
            <h4 class="text-lg font-bold text-gray-900 mb-2 leading-snug">
                ${title}
            </h4>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-3">
                ${previewSummary}
            </p>
            
            <div class="mt-auto">
                <p class="text-xs text-gray-500 mb-2">Aktualisiert: Dez. 2025 · Fundamentalanalyse</p>
                <span class="text-sm font-medium text-primary-blue hover:text-blue-600 transition duration-150 flex items-center">
                    Analyse ansehen →
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
    btn.setAttribute('aria-pressed', index === -1 ? 'true' : 'false');
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
    // Special-case links that include the Abonenten/ prefix (generated by n8n):
    // Convert them to a repo-root relative path so they resolve correctly
    // regardless of nesting (e.g. '/capitovo/Abonenten/slug.html').
    if (/^abonenten\//i.test(raw)){
        const rest = raw.replace(/^abonenten\//i, '');
        const base = repoBasePathBefore('abonenten'); // e.g. '/capitovo' or ''
        return (base ? base : '') + '/Abonenten/' + rest;
    }
    return base + raw;
}

/** Lädt die Analysen speziell für die Abonnenten-Seite und rendert hochwertige Karten. */
async function loadAndRenderMemberAnalyses(){
    const container = document.getElementById('member-analyses');
    if (!container) return;
    const cacheBuster = `?t=${new Date().getTime()}`;
    try{
        // Resolve correct relative path depending on current page location.
        // Try multiple fallbacks so nested pages (and pages hosted under a repo base path)
        // reliably find `data/analysen.json`.
        const tried = [];
        const candidates = [];
        // If repoBasePathBefore can derive a repo base (e.g. '/capitovo'), prefer absolute repo-root path
        const repoBase = repoBasePathBefore('abonenten');
        if (repoBase) candidates.push(repoBase + '/data/analysen.json');
        // Then try the calculated relative prefix (handles simple nested folders)
        const prefix = prefixToRepoRoot();
        candidates.push(prefix + 'data/analysen.json');
        // Also try common alternatives as fallbacks
        candidates.push('data/analysen.json');
        candidates.push('../data/analysen.json');
        candidates.push('./data/analysen.json');

        let res = null;
        let data = null;
        for (let p of candidates) {
            try {
                tried.push(p + cacheBuster);
                const r = await fetch(p + cacheBuster);
                if (r && r.ok) { res = r; break; }
            } catch (e) {
                // swallow and try next
            }
        }
        if (!res) {
            throw new Error('Fetch fehlgeschlagen: keine Kandidaten erreichbar: ' + tried.join(', '));
        }
        data = await res.json();
        
        // Sort by date descending (newest first)
        data.sort((a,b) => {
            const da = a.date ? Date.parse(a.date) : 0;
            const db = b.date ? Date.parse(b.date) : 0;
            return (db - da) || 0;
        });

                // Optional: allow page to request a filtered set (e.g. only Apple) via data attributes on the container
                const filterValue = (container.dataset && container.dataset.filter) ? String(container.dataset.filter).toLowerCase().trim() : '';
                const layout = (container.dataset && container.dataset.layout) ? String(container.dataset.layout).toLowerCase().trim() : '';

                let items = data.slice();
                if (filterValue) {
                        items = items.filter(d => {
                                try{
                                        const title = (d.title||'').toString().toLowerCase();
                                        const category = (d.category||'').toString().toLowerCase();
                                        const tags = Array.isArray(d.tags) ? d.tags.map(t=>String(t).toLowerCase()) : [];
                                        return title.includes(filterValue) || category.includes(filterValue) || tags.includes(filterValue);
                                }catch(e){ return false; }
                        });
                }

                // If page requests a carousel layout, render horizontally with navigation
                if (layout === 'carousel') {
                        const slice = items.slice(0, 12); // up to 12 in carousel
                        const cards = slice.map((d,i) => `<div style="flex:0 0 300px; max-width:300px;">${createMemberAnalysisCard(d,i,false)}</div>`).join('');
                        const html = `
                                <div class="relative">
                                    <button class="carousel-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white border shadow" aria-label="Vorherige">
                                        &#8249;
                                    </button>
                                    <div class="carousel-track flex gap-6 overflow-x-auto no-scrollbar" style="scroll-behavior:smooth; padding:8px 56px;">
                                        ${cards}
                                    </div>
                                    <button class="carousel-next absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white border shadow" aria-label="Nächste">
                                        &#8250;
                                    </button>
                                </div>`;
                        container.innerHTML = html;

                        try { ScrollReveal.add(container.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }

                        // attach simple prev/next behavior
                        try{
                            // enforce sizes similar to grid cards (image height, card max width)
                            const style = document.createElement('style');
                            style.appendChild(document.createTextNode('\n.carousel-track .member-card { max-width: 300px; }\n.carousel-track .member-card .media { height: 220px !important; }\n.carousel-track .member-card img { height: 100% !important; }\n'));
                            document.head.appendChild(style);

                            const track = container.querySelector('.carousel-track');
                            const prev = container.querySelector('.carousel-prev');
                            const next = container.querySelector('.carousel-next');
                            if (prev && next && track){
                                prev.addEventListener('click', function(){ track.scrollBy({ left: -Math.max(track.clientWidth * 0.6, 300), behavior: 'smooth' }); });
                                next.addEventListener('click', function(){ track.scrollBy({ left: Math.max(track.clientWidth * 0.6, 300), behavior: 'smooth' }); });
                            }
                        }catch(e){}

                } else {
                        // default: render up to 6 analyses in a responsive grid (ohne Favoriten-Sterne auf abonenten.html)
                        const html = `<div class="grid md:grid-cols-3 gap-8">` + items.slice(0,6).map((d,i) => createMemberAnalysisCard(d,i,false)).join('') + `</div>`;
                        container.innerHTML = html;
                        try { ScrollReveal.add(container.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }
                }
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
    const riskSelect = document.getElementById('risk-select');
    const performanceSelect = document.getElementById('performance-select');
    const typeSelect = document.getElementById('type-select');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const favToggle = document.getElementById('favorites-toggle');
    const resetFilters = document.getElementById('reset-filters');

    if (!grid) return;

    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    // Build candidate paths to reliably locate data/analysen.json when pages are nested
    const repoBase = repoBasePathBefore('abonenten');
    const candidates = [];
    if (repoBase) candidates.push(repoBase + '/data/analysen.json');
    const prefix = prefixToRepoRoot();
    candidates.push(prefix + 'data/analysen.json');
    candidates.push('data/analysen.json');
    candidates.push('../data/analysen.json');
    candidates.push('./data/analysen.json');

    // Check URL params for initial filter
    const urlParams = new URLSearchParams(window.location.search);
    let showFavoritesOnly = urlParams.get('filter') === 'favorites';
    
    // Update toggle button state if present
    if (favToggle && showFavoritesOnly) {
        favToggle.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
        favToggle.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
        const span = favToggle.querySelector('span');
        const icon = favToggle.querySelector('svg');
        if(span) span.textContent = 'Alle Analysen';
        if(icon) icon.style.display = 'none';
    }

    let data = [];
    try{
        let res = null;
        for (let p of candidates) {
            try {
                res = await fetch(p + `?t=${Date.now()}`);
                if (res && res.ok) break;
            } catch(e) { res = null; }
        }
        if (!res || !res.ok) throw new Error('fetch failed for candidates: ' + candidates.join(', '));
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
        const risk = (filterOpts.risk || '').trim();
        const performance = (filterOpts.performance || '').trim();
        const type = (filterOpts.type || '').trim();
        const dateFromVal = filterOpts.dateFrom || '';
        const dateToVal = filterOpts.dateTo || '';
        const sort = filterOpts.sort || 'newest';
        const onlyFavs = filterOpts.onlyFavs || false;

        let items = data.slice();
        
        // filter favorites
        if (onlyFavs) {
            const favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
            items = items.filter(i => favorites.includes(i.id));
        }

        // filter sector
        if (sector) items = items.filter(i => (i.category||'').toLowerCase() === sector.toLowerCase());
        
        // filter by risk (if field exists in data)
        if (risk) items = items.filter(i => (i.risk||'').toLowerCase() === risk.toLowerCase());
        
        // filter by performance (if field exists in data)
        if (performance) items = items.filter(i => (i.performance||'').toLowerCase() === performance.toLowerCase());
        
        // filter by type (if field exists in data)
        if (type) items = items.filter(i => (i.type||'').toLowerCase() === type.toLowerCase());
        
        // filter by date range
        if (dateFromVal) {
            items = items.filter(i => {
                const itemDate = i.date ? new Date(i.date) : null;
                return itemDate && itemDate >= new Date(dateFromVal);
            });
        }
        if (dateToVal) {
            items = items.filter(i => {
                const itemDate = i.date ? new Date(i.date) : null;
                return itemDate && itemDate <= new Date(dateToVal);
            });
        }
        
        // search
        if (q) items = items.filter(i => ((i.title||'') + ' ' + (i.summary||'') + ' ' + (i.category||'')).toLowerCase().includes(q));

        // sort
        if (sort === 'newest'){
            items.sort((a,b)=>{
                const da = a.date ? Date.parse(a.date) : 0;
                const db = b.date ? Date.parse(b.date) : 0;
                return (db - da) || 0;
            });
        } else if (sort === 'oldest') {
            items.sort((a,b)=>{
                const da = a.date ? Date.parse(a.date) : 0;
                const db = b.date ? Date.parse(b.date) : 0;
                return (da - db) || 0;
            });
        } else if (sort === 'alpha-asc') {
            items.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
        } else if (sort === 'alpha-desc') {
            items.sort((a,b)=> (b.title||'').localeCompare(a.title||''));
        }

        // render
        if (!items.length) { 
            grid.innerHTML = onlyFavs 
                ? '<div class="col-span-3 text-center py-12"><p class="text-gray-500 mb-2">Keine Favoriten gefunden.</p><p class="text-sm text-gray-400">Markieren Sie Analysen mit dem Stern-Symbol, um sie hier zu sehen.</p></div>' 
                : '<p class="text-gray-500">Keine Analysen gefunden.</p>'; 
            return; 
        }
        grid.innerHTML = '<div class="grid md:grid-cols-3 gap-8">' + items.map((it, idx) => createMemberAnalysisCard(it, idx, true)).join('') + '</div>';
        try { ScrollReveal.add(grid.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }
    }

    // wire controls
    function readAndRender(){
        renderList({ 
            q: searchInput?.value || '', 
            sector: sectorSelect?.value || '', 
            risk: riskSelect?.value || '',
            performance: performanceSelect?.value || '',
            type: typeSelect?.value || '',
            dateFrom: dateFrom?.value || '',
            dateTo: dateTo?.value || '',
            sort: sortSelect?.value || 'newest',
            onlyFavs: showFavoritesOnly
        });
    }
    
    // Reset filters handler
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (sectorSelect) sectorSelect.value = '';
            if (riskSelect) riskSelect.value = '';
            if (performanceSelect) performanceSelect.value = '';
            if (typeSelect) typeSelect.value = '';
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            if (sortSelect) sortSelect.value = 'newest';
            showFavoritesOnly = false;
            if (favToggle) {
                favToggle.classList.remove('bg-red-50', 'text-red-600', 'border-red-200');
                favToggle.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
                const span = favToggle.querySelector('span');
                const icon = favToggle.querySelector('svg');
                if(span) span.textContent = 'Nur Favoriten';
                if(icon) icon.style.display = 'block';
            }
            readAndRender();
        });
    }
    
    sortSelect?.addEventListener('change', readAndRender);
    sectorSelect?.addEventListener('change', readAndRender);
    riskSelect?.addEventListener('change', readAndRender);
    performanceSelect?.addEventListener('change', readAndRender);
    typeSelect?.addEventListener('change', readAndRender);
    dateFrom?.addEventListener('change', readAndRender);
    dateTo?.addEventListener('change', readAndRender);
    searchInput?.addEventListener('input', () => { readAndRender(); });
    clearBtn?.addEventListener('click', (e)=>{ e.preventDefault(); if (searchInput) searchInput.value=''; readAndRender(); });
    
    // Favorites Toggle Handler
    if (favToggle) {
        favToggle.addEventListener('click', (e) => {
            e.preventDefault();
            showFavoritesOnly = !showFavoritesOnly;
            
            // Update Button UI
            const span = favToggle.querySelector('span');
            const icon = favToggle.querySelector('svg');
            if (showFavoritesOnly) {
                favToggle.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
                favToggle.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
                if(span) span.textContent = 'Alle Analysen';
                if(icon) icon.style.display = 'none';
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('filter', 'favorites');
                window.history.pushState({}, '', url);
            } else {
                favToggle.classList.remove('bg-red-50', 'text-red-600', 'border-red-200');
                favToggle.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
                if(span) span.textContent = 'Nur Favoriten';
                if(icon) icon.style.display = 'block';
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
            payment: { method: 'paypal', paypal_email: 'test@capitovo.de' }
        }
    };
    
    // Handle plan selection buttons
    const planButtons = document.querySelectorAll('.plan-select-btn');
    planButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const plan = this.getAttribute('data-plan');
            if (plan) {
                sessionStorage.setItem('selected_plan', plan);
            }
        });
    });
    
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
                
                // Set session storage for paywall checks
                sessionStorage.setItem('capitovo_logged_in', 'true');
                sessionStorage.setItem('capitovo_subscription_active', user.sub !== 'none' && user.sub ? 'true' : 'false');
                // Ensure the free-gate flag is cleared on new login so the gate shows for non-premium users
                try { sessionStorage.removeItem('capitovo_free_gate_shown'); } catch(e) {}
                
                // Set contact data if defined for this user
                if (USER_CONTACTS[enteredEmail]) {
                    localStorage.setItem('capitovo_contact', JSON.stringify(USER_CONTACTS[enteredEmail]));
                } else {
                    // Clear contact data for other users to avoid mixup
                    localStorage.removeItem('capitovo_contact');
                }
            }catch(e){}
            
            // Check if user selected a plan before login
            const selectedPlan = sessionStorage.getItem('selected_plan');
            if (selectedPlan) {
                // Clear the selected plan from session storage
                sessionStorage.removeItem('selected_plan');
                // Only redirect to checkout if user doesn't have an active subscription
                if (user.sub === 'none' || !user.sub) {
                    window.location.href = 'checkout.html?plan=' + selectedPlan;
                } else {
                    // User already has active subscription, go to member area
                    window.location.href = 'Abonenten/abonenten.html';
                }
            } else {
                // Normal redirect to member area
                window.location.href = 'Abonenten/abonenten.html';
            }
            return;
        } else {
            // Fehlerhafte Anmeldung
            const errorMessage = document.createElement('p');
            errorMessage.id = 'login-error-message';
            errorMessage.className = 'text-red-500 text-sm mt-3 text-center'; 
            errorMessage.textContent = 'Ungültige E-Mail-Adresse oder Passwort';
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
        // Force the sidebar off-screen using the right-based transform that our CSS expects.
        // This is intentionally explicit to avoid stale inline styles or prior debug changes
        // that left the panel visible after navigation.
        // Keep the element rendered (`display:block`) but positioned off-screen
        // via transform so CSS transitions run reliably.
        sidebarElement.style.transform = 'translateX(100%)';
        sidebarElement.style.display = 'block';
        sidebarElement.style.opacity = '1';
        sidebarElement.style.pointerEvents = 'none';
        // Ensure menu toggle reflects closed state
        try{ if (menuToggle) menuToggle.setAttribute('aria-expanded','false'); } catch(e){}
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
            // Rely on the CSS `.open` class to animate the transform.
            // Avoid writing inline `transform`/`opacity` which can cancel transitions
            // or cause a visual jump on first open after reload.
            // Ensure sidebar is visible for assistive tech and prevent background scroll.
            // Ensure sidebar is rendered (clear any inline transform that may block transition)
            try{ sidebarElement.style.transform = ''; } catch(e){}
            sidebarElement.style.display = 'block';
            sidebarElement.classList.add('open');
            sidebarElement.style.pointerEvents = 'auto';
            sidebarElement.style.zIndex = sidebarElement.style.zIndex || '10050';
            try{ menuToggle.setAttribute('aria-expanded','true'); }catch(e){}
            sidebarElement.setAttribute('aria-hidden','false');
            document.body.style.overflow = 'hidden';
        } catch(err){ console.error('openSidebar error', err); }
    }
    function closeSidebar(){
        try{
            // Remove the open class and restore page scrolling. Keep display value
            // as-is to avoid relayout glitches; pointer-events are disabled so
            // the hidden sidebar doesn't intercept clicks.
            sidebarElement.classList.remove('open');
            try{ sidebarElement.style.pointerEvents = 'none'; } catch(e){}
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
    const forgotPasswordModalElement = document.getElementById('forgot-password-modal');
    const contactModalElement = document.getElementById('contact-modal');

    // only enable contact-related handlers when the modal exists on the page
    // Note: we no longer treat `a[href="#open-contact"]` as a modal trigger —
    // Links should navigate to a dedicated Kontaktseite instead.
    const hasContactControls = !!contactModalElement;

    // Event delegation: open login or contact modal
    document.body.addEventListener('click', (e) => {
        const linkLogin = e.target.closest('a[href="#open-login"]');
        if (linkLogin) { e.preventDefault(); openLoginModal(); return; }

        const linkForgot = e.target.closest('a[href="#open-forgot-password"]');
        if (linkForgot) { e.preventDefault(); openForgotPasswordModal(); return; }
        // Kontakt-Links are not intercepted here anymore. They should be full links
        // to a Kontaktseite (e.g. `Abonenten/kontaktdaten.html`).
    });

    // Backdrop click to close login
    if (loginModalElement) {
        loginModalElement.addEventListener('click', (e) => {
            if (e.target === loginModalElement) closeLoginModal();
        });
    }

    // Backdrop click to close forgot-password modal
    if (forgotPasswordModalElement) {
        forgotPasswordModalElement.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModalElement) closeForgotPasswordModal();
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
        if (forgotPasswordModalElement && !forgotPasswordModalElement.classList.contains('hidden')) closeForgotPasswordModal();
        if (hasContactControls && contactModalElement && !contactModalElement.classList.contains('hidden')) closeContactModal();
    });
}

/** Initialisiert die Passwort-vergessen Maske (Code anfordern). */
function initForgotPassword() {
    const modal = document.getElementById('forgot-password-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('forgot-password-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e){
            e.preventDefault();
            closeForgotPasswordModal();
        });
    }

    const form = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('forgot-email');
    const hint = document.getElementById('forgot-password-hint');

    if (form) {
        form.addEventListener('submit', function(e){
            e.preventDefault();
            const email = (emailInput && emailInput.value ? emailInput.value : '').trim();
            const ok = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (hint) {
                hint.style.display = 'block';
                hint.textContent = ok
                    ? 'Wenn ein Konto mit dieser E-Mail existiert, erhalten Sie in Kürze einen Code.'
                    : 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
                hint.style.color = ok ? '#475569' : '#ef4444';
            }
        });
    }
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
    // 2b. Ensure monitor CTA on homepage opens login modal instead of redirecting
    try{
        document.querySelectorAll('a.monitor-cta').forEach(function(el){
            el.addEventListener('click', function(e){
                // Treat current page as 'homepage' if it contains the main hero section
                if (document.querySelector('.hero') || document.querySelector('.hero-inner')){
                    e.preventDefault();
                    try{ openLoginModal(); } catch(err){}
                }
            });
        });
    }catch(e){}
    try{
        const mt = document.getElementById('menu-toggle');
        // post-init: menu-toggle presence recorded
    } catch(e){}

    // Diagnostics removed.
    
    // 3. Initialisiere Modal-Steuerung
    initModalControl();

    // 3b. Passwort-vergessen Modal
    initForgotPassword();

    // Check for hash to open login modal automatically
    if (window.location.hash === '#open-login') {
        setTimeout(() => {
            openLoginModal();
            // Entferne den Hash aus der URL, damit ein Reload nicht erneut das Modal öffnet
            history.replaceState(null, '', window.location.pathname + window.location.search);
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
    // 8. Ensure header logo on Abonenten pages links back to the Abonenten start page
    try { initLogoLinkBehavior(); } catch(e) { /* ignore */ }

    // 8b. Show Free-Abo gate once per session inside members area
    try { maybeShowFreePlanGate(); } catch(e) { /* ignore */ }

    // 9. Ensure Rechtliches links do NOT open a new tab (same-tab navigation)
    try { initLegalLinksSameTab(); } catch(e) { /* ignore */ }
});

/** Ensure internal Rechtliches links (Impressum/Datenschutz/Haftung/AGB) open in the same tab.
 * Some pages historically used `target="_blank"` for these links.
 * This normalizer also covers pages with hardcoded footers (no components).
 */
function initLegalLinksSameTab(){
    const legalFiles = ['impressum.html','datenschutz.html','haftung.html','agb.html'];

    function isInternalLegalHref(rawHref){
        if (!rawHref) return false;
        const href = String(rawHref).trim();
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        let url;
        try{ url = new URL(href, document.baseURI); }catch(e){ return false; }
        try{
            // For file://, both origins are 'null' which should match.
            if (url.origin !== window.location.origin) return false;
        }catch(e){ /* ignore */ }
        const path = (url.pathname || '').toLowerCase();
        if (!path.includes('/rechtliches/')) return false;
        return legalFiles.some(f => path.endsWith('/rechtliches/' + f));
    }

    function normalizeOnce(){
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        anchors.forEach(a => {
            try{
                const href = a.getAttribute('href');
                if (!isInternalLegalHref(href)) return;

                // Remove new-tab behavior for internal legal pages.
                if ((a.getAttribute('target') || '').toLowerCase() === '_blank') {
                    a.removeAttribute('target');
                }
                // rel noopener/noreferrer isn't needed without target=_blank (and can be confusing)
                const rel = (a.getAttribute('rel') || '').toLowerCase();
                if (rel.includes('noopener') || rel.includes('noreferrer')) {
                    a.removeAttribute('rel');
                }
            }catch(e){ /* ignore */ }
        });
    }

    // Run now, then after components may have been injected.
    normalizeOnce();
    setTimeout(normalizeOnce, 200);
    setTimeout(normalizeOnce, 1200);

    // Watch for dynamically inserted footers/links (component loader).
    try{
        if (!window.MutationObserver || !document.body) return;
        let t = null;
        const obs = new MutationObserver(function(){
            if (t) clearTimeout(t);
            t = setTimeout(function(){
                t = null;
                normalizeOnce();
            }, 80);
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }catch(e){ /* ignore */ }
}

/** Ensure header/logo anchor navigates back to the Abonenten start page in the same tab.
 * This prevents accidental new-tab navigation caused by absolute URLs or prior markup.
 */
function initLogoLinkBehavior(){
    try{
        const path = (window.location.pathname || '').toLowerCase();
        const marker = '/abonenten/';
        const idx = path.indexOf(marker);
        if(idx === -1) return;

        // Build an absolute path to the Abonenten startseite that also works from subfolders.
        const base = window.location.pathname.slice(0, idx + marker.length);
        const target = base + 'abonenten.html';

        const anchors = Array.from(document.querySelectorAll('.header-content .logo a, header .logo a'));
        if(!anchors.length) return;
        anchors.forEach(a=>{
            try{
                a.setAttribute('href', target);
                a.setAttribute('target', '_self');
                try{ a.removeAttribute('rel'); } catch(e){}
                a.addEventListener('click', function(ev){
                    if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1) return;
                    ev.preventDefault();
                    window.location.assign(target);
                });
            }catch(e){}
        });
    }catch(e){ console.error('initLogoLinkBehavior error', e); }
}

/** Initialisiert Logout-Handler auf allen Seiten.
 * Falls ein `#logout-confirm-modal` vorhanden ist, verwendet er dieses,
 * ansonsten zeigt er ein einfaches `confirm()` an.
 */
function initLogoutHandlers(){
    // Ensure we always have the designed logout modal available.
    // Some pages ship without the markup; in that case we inject it.
    let modal = document.getElementById('logout-confirm-modal');

    function ensureLogoutModal(){
        modal = document.getElementById('logout-confirm-modal');
        if (modal) return modal;
        try{
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <div id="logout-confirm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 class="text-lg font-semibold mb-2">Abmelden</h3>
                        <p class="text-sm text-gray-700 mb-4">Möchten Sie sich wirklich abmelden? Lokale Sitzungsdaten werden entfernt.</p>
                        <div class="flex gap-3">
                            <button id="logout-confirm-no" class="flex-1 py-2 px-4 rounded border border-gray-300 text-gray-700">Abbrechen</button>
                            <button id="logout-confirm-yes" class="flex-1 py-2 px-4 rounded bg-primary-blue text-white">Abmelden</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrapper.firstElementChild);
            modal = document.getElementById('logout-confirm-modal');
        }catch(e){
            // If injection fails for any reason, we'll fall back to confirm below.
            modal = null;
        }
        return modal;
    }

    function computeIndexRedirect(){
        try{
            const pathname = (window.location.pathname || '').split('?')[0].split('#')[0];
            const lower = pathname.toLowerCase();

            // If we're inside /Abonenten/, we can reliably compute the repo base (/capitovo) on GitHub Pages.
            if (lower.includes('/abonenten/')) {
                const base = repoBasePathBefore('Abonenten');
                return (base || '') + '/index.html';
            }

            // For non-Abonenten pages: on *.github.io repos, the first path segment is usually the repo name.
            const parts = pathname.split('/').filter(Boolean);
            if (window.location.hostname && window.location.hostname.endsWith('github.io') && parts.length > 0) {
                return '/' + parts[0] + '/index.html';
            }

            // Custom domain or root-hosted: assume index.html at root.
            return '/index.html';
        }catch(e){
            return '/index.html';
        }
    }

    const redirectPath = computeIndexRedirect();

    function doLogout(){
        try{ localStorage.removeItem('capitovo_session'); }catch(e){}
        // clear any other session-like keys if present
        try{ localStorage.removeItem('capitovo_contact'); }catch(e){}
        // clear session storage for paywall checks
        try{ 
            sessionStorage.removeItem('capitovo_logged_in');
            sessionStorage.removeItem('capitovo_subscription_active');
        }catch(e){}
        window.location.href = redirectPath;
    }

    const links = Array.from(document.querySelectorAll('a.logout-link'));
    if (!links.length) return;

    // Prefer modal (injected or existing). Only fall back to confirm if we cannot create/find it.
    const ensuredModal = ensureLogoutModal();
    if (ensuredModal) {
        const yesBtn = document.getElementById('logout-confirm-yes');
        const noBtn = document.getElementById('logout-confirm-no');
        function openConfirm(){ ensuredModal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
        function closeConfirm(){ ensuredModal.classList.add('hidden'); document.body.style.overflow = ''; }
        if (yesBtn) yesBtn.addEventListener('click', function(e){ e.preventDefault(); closeConfirm(); doLogout(); });
        if (noBtn) noBtn.addEventListener('click', function(e){ e.preventDefault(); closeConfirm(); });
        links.forEach(l => l.addEventListener('click', function(e){ e.preventDefault(); openConfirm(); }));
        ensuredModal.addEventListener('click', function(e){ if (e.target === ensuredModal) closeConfirm(); });
        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeConfirm(); });
    } else {
        links.forEach(l => l.addEventListener('click', function(e){
            e.preventDefault();
            if (window.confirm('Möchten Sie sich wirklich abmelden?')) doLogout();
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
    const prefix = prefixToRepoRoot();
    const dataPath = prefix + 'data/analysen.json' + cacheBuster;

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
        const imgRaw = analysis.image || 'data/vorschaubilder_analysen/placeholder.png';
        const img = (/^(https?:)?\/\//i.test(imgRaw) || imgRaw.startsWith('/')) ? imgRaw : (prefix + imgRaw);
        const bodyHtml = analysis.content ? analysis.content : `<p class="text-gray-700">${(analysis.summary || '')}</p>`;

        // Extract Stock Name from Title
        let stockName = '';
        if (title.includes('—')) {
            stockName = title.split('—')[0].trim();
        } else if (title.includes(':')) {
            stockName = title.split(':')[0].trim();
        }
        if (stockName.length > 25) stockName = '';

        // Favorites Logic for Detail View (ID-basiert)
        const favorites = JSON.parse(localStorage.getItem('capitovo_favorites') || '[]');
        const favId = analysis.id || title;
        const isFav = favorites.includes(favId);
        const starFill = isFav ? 'currentColor' : 'none';
        const starColor = isFav ? 'text-yellow-400' : 'text-gray-400';

        const favButton = `
            <button onclick="toggleFavorite(event, '${String(favId).replace(/'/g, "\\'")}')" 
                    class="p-2 transition-colors hover:scale-110"
                    title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
                <svg class="w-6 h-6 ${starColor} drop-shadow-md" fill="${starFill}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
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