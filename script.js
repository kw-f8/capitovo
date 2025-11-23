// script.js

// === HILFSFUNKTIONEN FÜR MODAL & SIDEBAR STEUERUNG ===

/** Öffnet das Login-Modal und schließt die Sidebar, falls geöffnet. */
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const sidebar = document.getElementById('sidebar');

    if (loginModal) {
        // Schließt die Sidebar, falls sie geöffnet ist
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open'); 
        }
        
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

// Lightweight scroll-triggered reveal helper.
const ScrollReveal = (() => {
    const baseClass = 'scroll-reveal';
    const visibleClass = 'sr-visible';
    const supportsIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;
    const reduceMotionQuery = (typeof window !== 'undefined' && window.matchMedia)
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let observer = null;

    function prefersReducedMotion() {
        return reduceMotionQuery ? reduceMotionQuery.matches : false;
    }

    function ensureObserver() {
        if (observer || !supportsIO || prefersReducedMotion()) return;
        observer = new IntersectionObserver(handleIntersect, {
            threshold: 0.12,
            rootMargin: '0px 0px -18% 0px'
        });
    }

    function handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(visibleClass);
                entry.target.style.removeProperty('--sr-delay');
                if (observer) observer.unobserve(entry.target);
            }
        });
    }

    function toArray(elements) {
        if (!elements) return [];
        if (elements instanceof Element) return [elements];
        if (typeof elements.length === 'number') return Array.from(elements); // NodeList, HTMLCollection, Array-like
        return [];
    }

    function prepare(el) {
        if (!el.classList.contains(baseClass)) el.classList.add(baseClass);
    }

    function add(elements, options = {}) {
        const nodes = toArray(elements);
        if (!nodes.length) return;
        const reduced = prefersReducedMotion();
        if (!reduced) ensureObserver();

        const useStagger = !!options.stagger;
        const baseDelay = Number.isFinite(options.baseDelay) ? Number(options.baseDelay) : 70;
        const offset = Number.isFinite(options.offset) ? Number(options.offset) : 0;
        const explicitDelay = Number.isFinite(options.delay) ? Number(options.delay) : null;

        nodes.forEach((el, index) => {
            if (!(el instanceof Element)) return;
            prepare(el);
            const attrDelay = parseInt(el.dataset.scrollDelay || '0', 10) || 0;
            let delayValue = attrDelay;
            if (explicitDelay !== null) {
                delayValue = explicitDelay;
            } else if (useStagger) {
                delayValue = offset + index * baseDelay + attrDelay;
            }

            if (reduced || !supportsIO) {
                el.classList.add(visibleClass);
                el.style.removeProperty('--sr-delay');
                el.style.removeProperty('--sr-duration');
                el.style.removeProperty('--sr-distance');
                el.style.removeProperty('--sr-ease');
                el.style.removeProperty('--sr-scale');
                return;
            }

            if (delayValue > 0) {
                el.style.setProperty('--sr-delay', `${delayValue}ms`);
            } else {
                el.style.removeProperty('--sr-delay');
            }

            const durationAttr = el.dataset.scrollDuration ? parseInt(el.dataset.scrollDuration, 10) : NaN;
            if (Number.isFinite(durationAttr) && durationAttr > 0) {
                el.style.setProperty('--sr-duration', `${durationAttr}ms`);
            } else {
                el.style.removeProperty('--sr-duration');
            }

            const distanceAttr = el.dataset.scrollDistance ? parseInt(el.dataset.scrollDistance, 10) : NaN;
            if (Number.isFinite(distanceAttr)) {
                el.style.setProperty('--sr-distance', `${distanceAttr}px`);
            } else {
                el.style.removeProperty('--sr-distance');
            }

            const scaleAttr = el.dataset.scrollScale ? parseFloat(el.dataset.scrollScale) : NaN;
            if (Number.isFinite(scaleAttr) && scaleAttr > 0 && scaleAttr <= 1) {
                el.style.setProperty('--sr-scale', `${scaleAttr}`);
            } else {
                el.style.removeProperty('--sr-scale');
            }

            const easeAttr = el.dataset.scrollEase;
            if (easeAttr) {
                el.style.setProperty('--sr-ease', easeAttr);
            } else {
                el.style.removeProperty('--sr-ease');
            }

            if (observer) observer.observe(el);
        });
    }

    function init(selector) {
        add(document.querySelectorAll(selector || '[data-scroll]'));
    }

    if (reduceMotionQuery) {
        const listener = () => {
            const reduced = prefersReducedMotion();
            if (reduced) {
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                document.querySelectorAll(`.${baseClass}`).forEach(el => {
                    el.classList.add(visibleClass);
                    el.style.removeProperty('--sr-delay');
                    el.style.removeProperty('--sr-duration');
                    el.style.removeProperty('--sr-distance');
                    el.style.removeProperty('--sr-ease');
                    el.style.removeProperty('--sr-scale');
                });
            } else if (supportsIO) {
                ensureObserver();
                add(document.querySelectorAll('[data-scroll]'));
            }
        };
        if (typeof reduceMotionQuery.addEventListener === 'function') {
            reduceMotionQuery.addEventListener('change', listener);
        } else if (typeof reduceMotionQuery.addListener === 'function') {
            reduceMotionQuery.addListener(listener);
        }
    }

    return { init, add };
})();

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
            <a href="${computeAnalysisLink(analysis, idx)}" class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block overflow-hidden group" data-scroll="fade-up" data-scroll-distance="18" data-scroll-duration="620">
            
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

    return `
    <article class="member-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1" data-scroll="fade-up" data-scroll-distance="18" data-scroll-duration="640">
        <a href="${link}" class="block">
                <div class="media">
                    <img src="${img}" alt="Vorschaubild ${title}" class="w-full h-full object-cover">
                    <span class="category-pill">${category}</span>
                </div>
            <div class="card-body">
                <h3 class="card-title">${title}</h3>
                <p class="card-excerpt">${summary}</p>
                <div class="card-meta">
                    <div class="left-meta">
                        ${author ? `<span class="text-gray-600">${author}</span>` : ''}
                        ${date ? `<span>• ${date}</span>` : ''}
                    </div>
                    <div class="right-meta"><span class="text-primary-blue font-medium">Jetzt lesen →</span></div>
                </div>
            </div>
        </a>
    </article>
    `;
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
        // render up to 12 analyses in a responsive grid
        const html = `<div class="member-analyses-grid">` + data.slice(0,12).map((d,i) => createMemberAnalysisCard(d,i)).join('') + `</div>`;
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

    if (!grid) return;

    const isInAbonenten = (window.location.pathname || '').toLowerCase().includes('/abonenten/');
    const dataPath = (isInAbonenten ? '../' : '') + 'data/analysen.json';

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

        let items = data.slice();
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
        if (!items.length) { grid.innerHTML = '<p class="text-gray-500">Keine Analysen gefunden.</p>'; return; }
        grid.innerHTML = '<div class="member-analyses-grid">' + items.map((it, idx) => createMemberAnalysisCard(it, idx)).join('') + '</div>';
        try { ScrollReveal.add(grid.querySelectorAll('[data-scroll]'), { stagger: true, baseDelay: 80 }); } catch(err) { /* ignore */ }
    }

    // wire controls
    function readAndRender(){
        renderList({ q: searchInput?.value || '', sector: sectorSelect?.value || '', sort: sortSelect?.value || 'newest' });
    }
    sortSelect?.addEventListener('change', readAndRender);
    sectorSelect?.addEventListener('change', readAndRender);
    searchInput?.addEventListener('input', () => { readAndRender(); });
    clearBtn?.addEventListener('click', (e)=>{ e.preventDefault(); if (searchInput) searchInput.value=''; readAndRender(); });

    // initial render
    renderList({ q: '', sector: '', sort: 'newest' });
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
    const TEST_EMAIL = 'test@capitovo.de';
    const TEST_PASSWORD = 'passwort123';
    
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    
    const loginForm = loginModal.querySelector('form');
    if (!loginForm) return;

    // Eingabefelder abrufen (muss nur einmal erfolgen)
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Verhindert das Standard-Formular-Senden

        const enteredEmail = emailInput.value;
        const enteredPassword = passwordInput.value; // <-- HIER KORRIGIERT
        
        // Fehlermeldungen von vorherigen Versuchen entfernen
        const existingError = loginModal.querySelector('#login-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const submitButton = loginModal.querySelector('button[type="submit"]');

        // Überprüfung der Testdaten
        if (enteredEmail === TEST_EMAIL && enteredPassword === TEST_PASSWORD) {
            // **ERFOLGREICHE ANMELDUNG (SIMULIERT)**
            try{ localStorage.setItem('capitovo_session', JSON.stringify({ email: enteredEmail, ts: Date.now() })); }catch(e){}
            // Weiterleitung zum Mitgliederbereich (Pfad korrekt auf Groß-/Kleinschreibung achten)
            window.location.href = 'Abonenten/abonenten.html';
            return;
        } else {
            
            // **FEHLERHAFTE ANMELDUNG**
            
            // Fehlermeldung erstellen und einfügen
            const errorMessage = document.createElement('p');
            errorMessage.id = 'login-error-message';
            // Styling für Fehlermeldung
            errorMessage.className = 'text-red-500 text-sm mt-3 text-center'; 
            errorMessage.textContent = 'Fehler: Ungültige E-Mail oder Passwort. Verwenden Sie test@capitovo.de / passwort123';
            
            // Die Meldung unter dem Button einfügen
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
    const navLinks = sidebarElement.querySelectorAll('a:not([href="#open-login"])');
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

        const data = {
            name: document.getElementById('contact-name')?.value || '',
            email: document.getElementById('contact-email')?.value || '',
            phone: document.getElementById('contact-phone')?.value || '',
            address: document.getElementById('contact-address')?.value || '',
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
    
    // 4. NEU: Initialisiere die simulierte Login-Funktionalität
    initTestLogin();
    // 4b. Initialisiere Kontaktdaten-Formular
    if (document.getElementById('contact-form')) {
        try { initContactForm(); } catch (e) { console.error('initContactForm error', e); }
    }
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

        const html = `
            <article class="max-w-4xl mx-auto">
                <div class="mb-4">
                    <a href="${isInAbonenten ? 'alle_analysen.html' : 'Abonenten/alle_analysen.html'}" onclick="try{ if(history.length>1 && document.referrer){ const ref=new URL(document.referrer); if(ref.origin===location.origin){ history.back(); return false; } } }catch(e){}" class="text-accent-blue text-sm">← Zurück</a>
                </div>
                <header class="mb-2">
                    <p class="text-xs font-semibold uppercase text-primary-blue mb-2">${category}</p>
                    <h1 class="text-3xl font-extrabold text-gray-900 mb-3">${title}</h1>
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