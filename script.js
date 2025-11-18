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


// === ANALYSEN RENDERING LOGIK ===

/**
 * Erstellt das HTML für einen einzelnen Analyse-Artikel.
 * Hinweis: Verwendet 'text-blue-500', da 'text-accent-blue' eine Custom-Klasse ist, 
 * die Tailwind ggf. nicht kennt, falls sie nicht in der config.js ist.
 */
function createAnalysisArticle(analysis) {
    // Verwendung des neuen, von Ihnen genehmigten HTML-Templates, angepasst an die Datenstruktur
    return `
        <a href="${analysis.link}" class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] overflow-hidden group">
            
            <div class="w-full h-40 bg-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
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
                                     .map(createAnalysisArticle)
                                     .join('');
        
        analysisGrid.innerHTML = analysisHTML;

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
                // opening sidebar
            sidebarElement.classList.add('open');
            // force inline transform if a different inline style blocks the CSS class
            try{ sidebarElement.style.transform = 'translateX(0)'; } catch(e){}
            try{ sidebarElement.style.display = 'block'; sidebarElement.style.opacity = '1'; sidebarElement.style.pointerEvents = 'auto'; sidebarElement.style.zIndex = '1000'; } catch(e){}
            sidebarElement.setAttribute('aria-hidden','false');
            try{ menuToggle.setAttribute('aria-expanded','true'); }catch(e){}
            document.body.style.overflow = 'hidden';
            // open complete

            // Verify visibility: bounding rect and computed styles
                try{
                const rect = sidebarElement.getBoundingClientRect();
                const cs = window.getComputedStyle(sidebarElement);

                const visibleEnough = rect.width > 8 && rect.height > 8 && cs.display !== 'none' && cs.opacity !== '0';
                if (!visibleEnough) {
                    console.warn('openSidebar: sidebar not visible after opening — applying forced inline fallback styles');
                    try{
                        sidebarElement.style.position = 'fixed';
                        sidebarElement.style.right = '0';
                        sidebarElement.style.top = '0';
                        sidebarElement.style.height = '100%';
                        sidebarElement.style.width = sidebarElement.style.width || '300px';
                        sidebarElement.style.transform = 'none';
                        sidebarElement.style.display = 'block';
                        sidebarElement.style.opacity = '1';
                        sidebarElement.style.pointerEvents = 'auto';
                        sidebarElement.style.zIndex = '10050';
                    } catch(e){ console.error('openSidebar: forced style apply failed', e); }
                    // log rect after forcing
                    const rect2 = sidebarElement.getBoundingClientRect();
                    // rect after forcing applied
                }
            } catch(e){ console.error('openSidebar: visibility check failed', e); }
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
}

/** Initialisiert die Modal-Steuerung mit Event Delegation. */
function initModalControl() {
    const loginModalElement = document.getElementById('login-modal');
    
    if (!loginModalElement) return;

    // 1. Öffnen des Modals via Event Delegation für ALLE #open-login Links
    document.body.addEventListener('click', (e) => {
        // Findet den nächstgelegenen Link, der auf #open-login zeigt
        const link = e.target.closest('a[href="#open-login"]'); 
        
        if (link) {
            e.preventDefault();
            openLoginModal();
        }
    });

    // 2. Schließen des Modals (Backdrop-Klick)
    loginModalElement.addEventListener('click', (e) => {
        if (e.target === loginModalElement) {
            closeLoginModal();
        }
    });
    
    // 3. Schließen des Modals (ESC-Taste)
    document.addEventListener('keydown', (e) => {
        // Prüft, ob das Modal sichtbar (nicht hidden) ist, bevor geschlossen wird
        if (e.key === 'Escape' && !loginModalElement.classList.contains('hidden')) {
            closeLoginModal();
        }
    });
}


// === HAUPT-LOGIK ===
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Lade die Analysen
    loadAndRenderAnalyses();
    
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
    // 5. Tippeffekt für Hero-Überschrift (nur einfügen, nicht andere Styles ändern)
    try { 
        typeHeroText(); 
    } catch (e) { /* ignore if function missing */ }
    // 6. Initialize hero candlestick canvas controller (if present on page)
    try { initHeroCandles(); } catch(e){}
    // Animation UI: removed automatic diagnostic/control buttons per user request
    // sidebar subscribe handler
    try { initSidebarSubscribeHandler(); } catch (e) { /* ignore */ }
});

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

// Animation diagnostic/control helpers removed (user requested full removal)

/* --- Hero inline stock chart (controlled via small console) --- */
function initHeroCandles(){
    const canvas = document.getElementById('hero-stock-canvas');
    if(!canvas) return;
    const headingEl = document.querySelector('.hero h2');
    // color / basic inputs (backwards-compatible fallbacks included)
    const colorInput = document.getElementById('hs-color'); // legacy
    const colorUpInput = document.getElementById('hs-color-up');
    const colorDownInput = document.getElementById('hs-color-down');
    const widthInput = document.getElementById('hs-linewidth'); // legacy
    const candleWidthInput = document.getElementById('hs-candlewidth');
    const volInput = document.getElementById('hs-vol');
    const trendInput = document.getElementById('hs-trend');
    const countInput = document.getElementById('hs-count');
    const gapInput = document.getElementById('hs-gap');
    const paddingInput = document.getElementById('hs-padding');
    const depthInput = document.getElementById('hs-depth');
    const gridInput = document.getElementById('hs-grid');
    const shadowInput = document.getElementById('hs-shadow');
    const visibleInput = document.getElementById('hs-visible');
    const resetBtn = document.getElementById('hs-reset');
    const renderBtn = document.getElementById('hs-render');

    const ctx = canvas.getContext('2d');
    let DPR = Math.max(1, window.devicePixelRatio || 1);
    function resize(){
        DPR = Math.max(1, window.devicePixelRatio || 1);
        const cs = getComputedStyle(canvas);
        // Compute width based on heading width and parent container.
        // On desktop: match the heading's width exactly and center the canvas below it.
        // On mobile (narrow viewports): limit to 95% of the parent width.
        const parent = canvas.parentElement || document.body;
        const parentRect = parent.getBoundingClientRect();
        const headingWidth = headingEl ? Math.floor(headingEl.getBoundingClientRect().width) : 0;
        let cssW;
        if (window.innerWidth < 640) {
            // mobile: use the heading width if available, otherwise 95% parent
            cssW = headingWidth || Math.max(240, Math.floor(parentRect.width * 0.95));
        } else {
            // desktop: use the exact heading width
            cssW = headingWidth || Math.max(320, Math.floor(parentRect.width * 0.9));
        }
        // ensure parent flex centering so canvas sits centered under the heading
        try{ parent.style.display = 'flex'; parent.style.justifyContent = 'center'; }catch(e){}
        canvas.style.width = cssW + 'px';
        canvas.style.margin = '8px 0 0';
        let cssH = Math.floor(parseFloat(cs.height));
        if (!cssW || isNaN(cssW)) cssW = Math.max(200, canvas.clientWidth || 900);
        if (!cssH || isNaN(cssH)) cssH = Math.max(100, canvas.clientHeight || 260);
        canvas.width = Math.max(120, Math.round(cssW * DPR));
        canvas.height = Math.max(40, Math.round(cssH * DPR));
        canvas.style.height = cssH + 'px';
        ctx.setTransform(DPR,0,0,DPR,0,0);
    }

    // deterministic PRNG (mulberry32) so chart stays identical across reloads
    function mulberry32(a){
        return function(){
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
    const FIXED_SEED = 271828; // constant seed for reproducible charts
    function genOHLC(count, volatility, trendPerCandle){
        const out = [];
        const rng = mulberry32(FIXED_SEED);
        let price = 100 + rng()*8;
        for(let i=0;i<count;i++){
            const open = price;
            const jitter = (rng()-0.5)*volatility;
            const delta = (trendPerCandle || 0) + jitter;
            const close = Math.max(0.1, open + delta);
            const high = Math.max(open, close) + rng()*Math.abs(volatility*0.4);
            const low = Math.min(open, close) - rng()*Math.abs(volatility*0.4);
            out.push({o:open,h:high,l:low,c:close});
            price = close;
        }
        return out;
    }

    function drawGrid(cssW, cssH){
        if(!gridInput || !gridInput.checked) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(15,23,42,0.04)';
        ctx.lineWidth = 1;
        const lines = 4;
        for(let i=0;i<=lines;i++){
            const y = 10 + (i/(lines))* (cssH - 20);
            ctx.beginPath(); ctx.moveTo(6,y); ctx.lineTo(cssW-6,y); ctx.stroke();
        }
        ctx.restore();
    }

    function renderCandles(){
        try{
            resize();
            const cssW = canvas.width / DPR; const cssH = canvas.height / DPR;
            ctx.clearRect(0,0,cssW,cssH);
            if(visibleInput && !visibleInput.checked) return;
            // background
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,cssW,cssH);

            // read controls with fallbacks
            const count = Math.max(6, Math.min(1000, Number(countInput?.value) || Number(document.getElementById('hs-speed')?.value) || 40));
            const vol = Math.max(0, Number(volInput?.value) || 28);
            const trend = Number(trendInput?.value) || 0; // price delta per candle
            const candleW = Math.max(2, Number(candleWidthInput?.value) || Number(widthInput?.value) || 4);
            const padding = Number(paddingInput?.value) || 16;
            const usableW = Math.max(40, cssW - padding*2);
            const gap = Math.max(0, Number(gapInput?.value) || 0 );
            const depth = Math.max(0, Number(depthInput?.value) || 40);
            const showGrid = gridInput ? gridInput.checked : false;
            const showShadow = shadowInput ? shadowInput.checked : true;

            const upColor = colorUpInput?.value || colorInput?.value || '#00a0da';
            const downColor = colorDownInput?.value || '#858585';

            const ohlc = genOHLC(count, vol, trend);
            // compute price scale
            let minP = Infinity, maxP = -Infinity;
            for(const d of ohlc){ minP = Math.min(minP, d.l); maxP = Math.max(maxP, d.h); }
            const padPrice = (maxP - minP) * 0.12 || 2;
            minP -= padPrice; maxP += padPrice;
            const priceToY = p => {
                const r = (p - minP) / Math.max(1e-6, (maxP - minP));
                return cssH - (r * (cssH - 20)) - 10; // top/bottom padding
            };

            // optional grid
            if(showGrid) drawGrid(cssW, cssH);

            // draw each candle with simple 3D extrusion to bottom-right
            for(let i=0;i<ohlc.length;i++){
                const data = ohlc[i];
                const x = padding + gap + i * (candleW + gap);
                const cx = x + 0.5; // crisp lines
                const yOpen = priceToY(data.o);
                const yClose = priceToY(data.c);
                const yHigh = priceToY(data.h);
                const yLow = priceToY(data.l);
                const bodyTop = Math.min(yOpen, yClose);
                const bodyBottom = Math.max(yOpen, yClose);

                const up = data.c >= data.o;
                const fillColor = up ? upColor : downColor;

                // extrusion polygon (offset)
                const dx = depth * 0.6, dy = depth * 0.35;

                if(showShadow && depth > 0){
                    ctx.beginPath();
                    ctx.moveTo(x, bodyTop);
                    ctx.lineTo(x + candleW, bodyTop);
                    ctx.lineTo(x + candleW + dx, bodyTop + dy);
                    ctx.lineTo(x + dx, bodyTop + dy);
                    ctx.closePath();
                    const grad = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom + dy);
                    grad.addColorStop(0, 'rgba(0,0,0,0.06)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
                    ctx.fillStyle = grad; ctx.fill();

                    // right face subtle shading
                    ctx.beginPath();
                    ctx.moveTo(x + candleW, bodyTop);
                    ctx.lineTo(x + candleW, bodyBottom);
                    ctx.lineTo(x + candleW + dx, bodyBottom + dy);
                    ctx.lineTo(x + candleW + dx, bodyTop + dy);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fill();
                }

                // body
                ctx.beginPath();
                ctx.rect(x, bodyTop, candleW, Math.max(1, bodyBottom - bodyTop));
                ctx.fillStyle = fillColor; ctx.fill();
                // border
                ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.strokeRect(x+0.5, bodyTop+0.5, candleW, Math.max(1, bodyBottom - bodyTop));

                // wick (use explicit wick width fallback)
                ctx.beginPath();
                ctx.moveTo(cx + candleW/2 - 0.5, yHigh);
                ctx.lineTo(cx + candleW/2 - 0.5, yLow);
                const wickW = Number(document.getElementById('hs-wick')?.value) || 3;
                ctx.lineWidth = wickW;
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.stroke();

                // small top highlight for 3D feel
                ctx.beginPath();
                ctx.moveTo(x, bodyTop);
                ctx.lineTo(x + candleW, bodyTop);
                ctx.strokeStyle = 'rgba(255,255,255,0.22)';
                ctx.lineWidth = 1; ctx.stroke();
            }

            // edge fade mask (left/right) to avoid hard clipping
            try{
                const fadePx = Number(document.getElementById('hs-fade')?.value || 48);
                const f = Math.max(0, Math.min(1, fadePx / Math.max(1, cssW)));
                if(f > 0){
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-in';
                    const mask = ctx.createLinearGradient(0,0,cssW,0);
                    mask.addColorStop(0, 'rgba(0,0,0,0)');
                    mask.addColorStop(Math.max(0, f*0.9), 'rgba(0,0,0,1)');
                    mask.addColorStop(Math.max(0, 1 - f*0.9), 'rgba(0,0,0,1)');
                    mask.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = mask;
                    ctx.fillRect(0,0,cssW,cssH);
                    ctx.restore();
                }
            }catch(e){ console.error('fade mask error', e); }

            // price labels (min/max) on left/right
            try{
                const showLabels = document.getElementById('hs-pricelabels')?.checked;
                if(showLabels){
                    ctx.save();
                    ctx.fillStyle = 'rgba(2,6,23,0.7)';
                    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial';
                    const minLabel = minP.toFixed(2);
                    const maxLabel = maxP.toFixed(2);
                    ctx.fillText(maxLabel, 8, 16);
                    const w = ctx.measureText(minLabel).width;
                    ctx.fillText(minLabel, cssW - w - 8, cssH - 6);
                    ctx.restore();
                }
            }catch(e){ console.error('price labels error', e); }

        }catch(e){ console.error('renderCandles error', e); }
    }

    // Debug overlay: zeigt gemessene Werte für Heading und Canvas an (sichtbar auf der Seite)
    function ensureDebugOverlay(){
        let el = document.getElementById('hero-debug-overlay');
        if(!el){
            el = document.createElement('div');
            el.id = 'hero-debug-overlay';
            el.style.position = 'fixed';
            el.style.right = '12px';
            el.style.bottom = '12px';
            el.style.zIndex = '99999';
            el.style.background = 'rgba(0,0,0,0.7)';
            el.style.color = '#fff';
            el.style.fontSize = '12px';
            el.style.padding = '10px 12px';
            el.style.borderRadius = '8px';
            el.style.maxWidth = '320px';
            el.style.lineHeight = '1.2';
            el.style.fontFamily = 'system-ui, Arial, sans-serif';
            el.style.pointerEvents = 'auto';
            document.body.appendChild(el);
        }
        return el;
    }

    function updateDebugOverlay(){
        try{
            const overlay = ensureDebugOverlay();
            const heading = document.querySelector('.hero h2');
            const canvasEl = document.getElementById('hero-stock-canvas');
            const hr = heading ? heading.getBoundingClientRect() : null;
            const cr = canvasEl ? canvasEl.getBoundingClientRect() : null;
            overlay.innerHTML = '<strong>Hero Debug</strong><br/>' +
                (hr ? `Heading — w:${Math.round(hr.width)} h:${Math.round(hr.height)} left:${Math.round(hr.left)} top:${Math.round(hr.top)}<br/>` : 'Heading: n/a<br/>') +
                (cr ? `Canvas — w:${Math.round(cr.width)} h:${Math.round(cr.height)} left:${Math.round(cr.left)} top:${Math.round(cr.top)}<br/>` : 'Canvas: n/a<br/>') +
                `Viewport — w:${window.innerWidth} h:${window.innerHeight}`;
        }catch(e){ /* ignore */ }
    }


    // wire inputs -> render on change (static chart, no animation loop)
    const inputs = [colorUpInput, colorDownInput, candleWidthInput, widthInput, volInput, trendInput, countInput, gapInput, paddingInput, depthInput, gridInput, shadowInput, visibleInput];
    inputs.forEach(el => { if(!el) return; el.addEventListener('input', ()=>{ renderCandles(); }); });
    if(renderBtn) renderBtn.addEventListener('click', ()=>{ renderCandles(); });

    // export/import settings helpers
    function getSettings(){
        return {
            colorUp: colorUpInput?.value || colorInput?.value || '#00a0da',
            colorDown: colorDownInput?.value || '#858585',
            candleWidth: Number(candleWidthInput?.value || widthInput?.value || 4),
            wickWidth: Number(document.getElementById('hs-wick')?.value || 3),
            gap: Number(gapInput?.value || 0),
            padding: Number(paddingInput?.value || 16),
            depth: Number(depthInput?.value || 40),
            volatility: Number(volInput?.value || 28),
            trend: Number(trendInput?.value || 0),
            count: Number(countInput?.value || document.getElementById('hs-speed')?.value || 40),
            grid: !!(gridInput && gridInput.checked),
            shadow: !!(shadowInput && shadowInput.checked),
            visible: !!(visibleInput && visibleInput.checked),
            fadePx: Number(document.getElementById('hs-fade')?.value || 48),
            borderOpacity: Number(document.getElementById('hs-border')?.value || 0.08),
            bgColor: document.getElementById('hs-bg')?.value || '#ffffff',
            priceLabels: !!(document.getElementById('hs-pricelabels')?.checked)
        };
    }

    function applySettings(s){
        try{
            if(!s || typeof s !== 'object') return;
            if(colorUpInput && s.colorUp) colorUpInput.value = s.colorUp;
            if(colorDownInput && s.colorDown) colorDownInput.value = s.colorDown;
            if(candleWidthInput && typeof s.candleWidth !== 'undefined') candleWidthInput.value = s.candleWidth;
            if(document.getElementById('hs-wick') && typeof s.wickWidth !== 'undefined') document.getElementById('hs-wick').value = s.wickWidth;
            if(gapInput && typeof s.gap !== 'undefined') gapInput.value = s.gap;
            if(paddingInput && typeof s.padding !== 'undefined') paddingInput.value = s.padding;
            if(depthInput && typeof s.depth !== 'undefined') depthInput.value = s.depth;
            if(volInput && typeof s.volatility !== 'undefined') volInput.value = s.volatility;
            if(trendInput && typeof s.trend !== 'undefined') trendInput.value = s.trend;
            if(countInput && typeof s.count !== 'undefined') countInput.value = s.count;
            if(document.getElementById('hs-fade') && typeof s.fadePx !== 'undefined') document.getElementById('hs-fade').value = s.fadePx;
            if(document.getElementById('hs-border') && typeof s.borderOpacity !== 'undefined') document.getElementById('hs-border').value = s.borderOpacity;
            if(document.getElementById('hs-bg') && typeof s.bgColor !== 'undefined') document.getElementById('hs-bg').value = s.bgColor;
            if(gridInput && typeof s.grid !== 'undefined') gridInput.checked = !!s.grid;
            if(shadowInput && typeof s.shadow !== 'undefined') shadowInput.checked = !!s.shadow;
            if(visibleInput && typeof s.visible !== 'undefined') visibleInput.checked = !!s.visible;
            if(document.getElementById('hs-pricelabels') && typeof s.priceLabels !== 'undefined') document.getElementById('hs-pricelabels').checked = !!s.priceLabels;
            // re-render after applying
            setTimeout(()=>{ renderCandles(); }, 20);
        }catch(e){ console.error('applySettings error', e); }
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('hs-export');
    const importBtn = document.getElementById('hs-import');
    if(exportBtn){
        exportBtn.addEventListener('click', async ()=>{
            try{
                const settings = getSettings();
                const json = JSON.stringify(settings, null, 2);
                // show modal with JSON for easy copying
                const modal = document.getElementById('hs-import-modal');
                const ta = document.getElementById('hs-import-textarea');
                if(ta) ta.value = json;
                if(modal) modal.classList.remove('hidden');
                // try copy to clipboard as well
                if(navigator.clipboard && navigator.clipboard.writeText){
                    await navigator.clipboard.writeText(json);
                    exportBtn.textContent = 'Kopiert ✓';
                    setTimeout(()=> exportBtn.textContent = 'Export', 1500);
                }
                console.log('Hero candlestick settings:', settings);
            }catch(e){ console.error('export failed', e); alert('Export fehlgeschlagen — siehe Konsole.'); }
        });
    }
    if(importBtn){
        importBtn.addEventListener('click', ()=>{
            const modal = document.getElementById('hs-import-modal');
            const ta = document.getElementById('hs-import-textarea');
            const err = document.getElementById('hs-import-error');
            if(err) err.textContent = '';
            if(ta) ta.value = '';
            if(modal) modal.classList.remove('hidden');
            // focus textarea
            setTimeout(()=>{ if(ta) ta.focus(); }, 40);
        });
    }

    // import modal controls
    const importModal = document.getElementById('hs-import-modal');
    if(importModal){
        const ta = document.getElementById('hs-import-textarea');
        const applyBtn = document.getElementById('hs-import-apply');
        const closeBtn = document.getElementById('hs-import-close');
        const cancelBtn = document.getElementById('hs-import-cancel');
        const err = document.getElementById('hs-import-error');
        function closeModal(){ if(importModal) importModal.classList.add('hidden'); if(err) err.textContent=''; }
        if(closeBtn) closeBtn.addEventListener('click', ()=> closeModal());
        if(cancelBtn) cancelBtn.addEventListener('click', ()=> closeModal());
        if(applyBtn) applyBtn.addEventListener('click', ()=>{
            if(!ta) return;
            try{
                const obj = JSON.parse(ta.value);
                applySettings(obj);
                closeModal();
            }catch(e){ if(err) err.textContent = 'Ungültiges JSON: ' + (e && e.message ? e.message : 'parse error'); }
        });
        // close when clicking outside modal content
        importModal.addEventListener('click', (ev)=>{ if(ev.target === importModal) closeModal(); });
    }

    if(resetBtn) resetBtn.addEventListener('click', ()=>{
        if(colorUpInput) colorUpInput.value = '#00a0da';
        if(colorDownInput) colorDownInput.value = '#858585';
        if(candleWidthInput) candleWidthInput.value = 4;
        if(widthInput) widthInput.value = 4;
        if(gapInput) gapInput.value = 0;
        if(paddingInput) paddingInput.value = 16;
        if(depthInput) depthInput.value = 40;
        if(volInput) volInput.value = 28;
        if(trendInput) trendInput.value = 0;
        if(countInput) countInput.value = 40;
        if(gridInput) gridInput.checked = true;
        if(shadowInput) shadowInput.checked = true;
        if(visibleInput) visibleInput.checked = true;
        renderCandles();
    });

    // initial render when layout stable
    setTimeout(()=>{ try{ renderCandles(); }catch(e){ console.error('initHeroCandles error', e); } }, 60);
}

// Verbesserte Funktion zur Anpassung des Canvas an die Überschrift
function adjustHeroCanvas() {
    const canvas = document.getElementById('hero-stock-canvas');
    const heading = document.querySelector('.hero h2');

    if (canvas && heading) {
        const headingRect = heading.getBoundingClientRect();
        const headingWidth = headingRect.width;
        const headingLeft = headingRect.left;

        // Setze die Breite und Position des Canvas
        canvas.style.position = 'absolute';
        canvas.style.width = `${headingWidth}px`;
        canvas.style.left = `${headingLeft}px`;
        canvas.style.top = `${headingRect.bottom + 10}px`; // 10px Abstand unter der Überschrift

        // Setze die interne Breite des Canvas für die Darstellung
        const DPR = window.devicePixelRatio || 1;
        canvas.width = Math.floor(headingWidth * DPR);
        canvas.height = Math.floor(140 * DPR); // Feste Höhe von 140px

        const ctx = canvas.getContext('2d');
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Beispiel: Zeichne eine Linie zur Überprüfung
        ctx.strokeStyle = 'rgba(0, 200, 140, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        console.log('Canvas angepasst:', {
            width: canvas.style.width,
            left: canvas.style.left,
            top: canvas.style.top,
        });
    } else {
        console.warn('Canvas oder Überschrift nicht gefunden.');
    }
}

// Rufe die Funktion beim Laden und bei Größenänderungen des Fensters auf
window.addEventListener('load', adjustHeroCanvas);
window.addEventListener('resize', adjustHeroCanvas);