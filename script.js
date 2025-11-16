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
                Vorschau lesen →
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
            alert('Anmeldung erfolgreich! (Simuliert)');
            
            // Felder leeren und Modal schließen
            emailInput.value = '';
            passwordInput.value = '';
            closeLoginModal();
            

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
    const menuToggle = document.getElementById('menu-toggle'); 
    const closeSidebarButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebarElement && closeSidebarButton) {
        
        // Öffnen/Schließen der Sidebar
        menuToggle.addEventListener('click', () => {
            sidebarElement.classList.add('open');
            sidebarElement.setAttribute('aria-hidden', 'false');
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden'; // Verhindert Scrollen des Hintergrunds, wenn Sidebar offen
        });

        closeSidebarButton.addEventListener('click', () => {
            sidebarElement.classList.remove('open');
            sidebarElement.setAttribute('aria-hidden', 'true');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = ''; // Stellt Scrollen wieder her
        });
        
        // Schließt die Sidebar beim Klick auf einen normalen Navigationslink
        const navLinks = sidebarElement.querySelectorAll('a:not([href="#open-login"])');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebarElement.classList.remove('open');
                sidebarElement.setAttribute('aria-hidden', 'true');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }
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
    
    // 3. Initialisiere Modal-Steuerung
    initModalControl();
    
    // 4. NEU: Initialisiere die simulierte Login-Funktionalität
    initTestLogin();
    // 5. Tippeffekt für Hero-Überschrift (nur einfügen, nicht andere Styles ändern)
    try { 
        console.debug('typeHeroText invoked');
        typeHeroText(); 
    } catch (e) { /* ignore if function missing */ }
    // add on-page diagnostic helper (non-destructive)
    try { createAnimationDiagnosticPanel(); } catch (e) { /* ignore */ }
    // add live controls panel for animation
    try { createAnimationControlPanel(); } catch (e) { /* ignore */ }
    // sidebar subscribe handler
    try { initSidebarSubscribeHandler(); } catch (e) { /* ignore */ }
});

/**
 * Tippt die Hero-Überschrift Zeichen für Zeichen ein. Nur fügt Verhalten hinzu,
 * ändert keine bestehenden Styles oder Klassen dauerhaft.
 */
function typeHeroText(options = {}){
    console.debug('typeHeroText: start');
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
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.debug('stock animation skipped: prefers-reduced-motion');
        return;
    }

    let mounted = false;
    let rafId = null;

    function mount(){
        if (mounted) return; mounted = true;
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
        const canvasYOffset = -36;

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
        let volatility = 24; // amplitude for random moves (px)
        let amplitude = volatility;
        // upward trend: px per second (negative moves line up visually)
        let trendPerSecond = (typeof initial.trendPerSecond === 'number') ? Number(initial.trendPerSecond) : -6;
        // cumulative trend applied to newly appended points (px)
        let cumulativeTrend = 0;

        // initialize points to fill width
        function initPoints(){
            points = [];
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const width = parseInt(c.style.width,10) || Math.floor((c.width || window.innerWidth)/DPR);
            const count = Math.ceil(width / pointSpacing) + 6;
            const baseline = (c.height / DPR) / 2;
            for(let i=0;i<count;i++){
                const y = baseline + (Math.random() - 0.5) * amplitude;
                const xPos = i * pointSpacing;
                points.push({x: xPos, y});
            }
        }

        function appendPoint(){
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            const baseline = (c.height / DPR) / 2;
            const last = points.length ? points[points.length-1] : {y: baseline};
            // mostly moderate jitter, occasional larger spike for realism
            const spike = Math.random() < 0.12; // 12% chance of spike
            const baseFactor = 0.45 + Math.random() * 0.7; // 0.45 - 1.15
            const multiplier = spike ? (1.8 + Math.random()*1.6) : baseFactor;
            const jitter = (Math.random() - 0.5) * amplitude * multiplier;
            // limit per-step jump to avoid extreme stuttering
            const maxJump = Math.max(6, amplitude * 0.9);
            const delta = Math.max(-maxJump, Math.min(maxJump, jitter));
            // include cumulative trend so the overall shape shows an upward drift over time
            const yRaw = last.y + delta + cumulativeTrend;
            const y = Math.max(2, Math.min((c.height/DPR)-2, yRaw));
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

            // update cumulative trend based on time (px per second)
            cumulativeTrend += (trendPerSecond * (dt / 1000));

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
                try { console.debug('line.frame', _frameCount, 'points', points.length, 'canvasCSS', c.width/DPR, c.height/DPR); } catch(e){}
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

                // build offset points for extrusion (perspective from top-left => offset down-right)
                const depthOffsetX = Number(depthX) || 0;
                const depthOffsetY = Number(depthY) || 0;

                // build offset points with perspective: offset grows with normalized x -> further right appears deeper
                const widthForPerspective = Math.max(1, cssWidth);
                const offsetPoints = points.map(p => {
                    const t = Math.max(0, Math.min(1, p.x / widthForPerspective));
                    return { x: p.x + depthOffsetX * t, y: p.y + depthOffsetY * t };
                });

                // fill the extrusion polygon between line and its offset to simulate depth (with gradient)
                try{
                    x.beginPath();
                    x.moveTo(points[0].x, points[0].y);
                    for(let i=1;i<points.length;i++){
                        const p = points[i];
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
                x.moveTo(points[0].x, points[0].y);
                for(let i=1;i<points.length;i++){
                    const p = points[i];
                    x.lineTo(p.x, p.y);
                }
                x.stroke();

                // subtle highlight along the top-left edge of extrusion
                try{
                    x.beginPath();
                    x.moveTo(points[0].x, points[0].y);
                    for(let i=1;i<points.length;i++){
                        const p = points[i];
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

// --- Diagnostic helper UI -------------------------------------------------
function createAnimationDiagnosticPanel(){
    if (document.getElementById('anim-diag-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'anim-diag-panel';
    Object.assign(panel.style, {
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: 99999,
        fontFamily: 'system-ui,Segoe UI,Roboto,Arial',
    });

    const btn = document.createElement('button');
    btn.textContent = 'Diagnose Animation';
    Object.assign(btn.style, {
        background: '#0ea5a6',
        color: '#fff',
        border: 'none',
        padding: '8px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(2,6,23,0.2)'
    });

    const output = document.createElement('pre');
    Object.assign(output.style, {
        display: 'none',
        minWidth: '320px',
        maxWidth: '680px',
        maxHeight: '50vh',
        overflow: 'auto',
        marginTop: '8px',
        padding: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: '#e6fffa',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: '1.3'
    });

    btn.addEventListener('click', async () => {
        output.style.display = 'block';
        output.textContent = 'Running diagnostics...\n';

        // 1) Canvas existence
        const c = document.getElementById('stock');
        output.textContent += `stock canvas element: ${c ? 'FOUND' : 'MISSING'}\n`;

        // 1a) prefers-reduced-motion and hero presence
        output.textContent += `prefers-reduced-motion: ${window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches}\n`;
        output.textContent += `hero-wrapper present: ${!!document.querySelector('.hero-wrapper')}\n`;
        output.textContent += `hero h2 present: ${!!document.querySelector('.hero h2')}\n`;

        if (!c) return;

        // 2) layout and sizes
        const cs = getComputedStyle(c);
        const crect = c.getBoundingClientRect();
        output.textContent += `\ncomputed style: left=${cs.left}, top=${cs.top}, width=${cs.width}, height=${cs.height}, zIndex=${cs.zIndex}\n`;
        output.textContent += `DOM rect: left=${crect.left}, top=${crect.top}, width=${crect.width}, height=${crect.height}\n`;
        output.textContent += `backing buffer size: width=${c.width}, height=${c.height}\n`;

        // 3) stacking and elementFromPoint
        const h = document.querySelector('.hero h2');
        if (h) output.textContent += `\nheading rect: ${JSON.stringify(h.getBoundingClientRect())}\n`;
        output.textContent += `heading z-index: ${h ? getComputedStyle(h).zIndex : 'n/a'}\n`;
        output.textContent += `canvas z-index: ${getComputedStyle(c).zIndex}\n`;

        try{
            const midX = Math.floor(crect.left + crect.width/2);
            const midY = Math.floor(crect.top + crect.height/2);
            const els = document.elementsFromPoint(midX, midY).slice(0,6).map(e => e.tagName + (e.id ? `#${e.id}` : '') + (e.className ? `.${e.className.split(' ').join('.')}` : ''));
            output.textContent += `elements at canvas center: ${els.join(' > ')}\n`;
        } catch(e){ output.textContent += `elementsFromPoint failed: ${e.message}\n`; }

        // 4) drawing check
        try{
            const ctx = c.getContext('2d');
            output.textContent += `\n2d context ok: ${!!ctx}\n`;
            try{
                const img = ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/2),1,1);
                output.textContent += `pixel at center (RGBA): [${img.data.join(',')}]\n`;
            } catch(err){ output.textContent += `pixel read failed (expected in some browsers): ${err.message}\n`; }
        } catch(e){ output.textContent += `getContext failed: ${e.message}\n`; }

        // Extra compatibility checks: UA, DPR, offscreen canvas pixel test
        try{
            output.textContent += `\nuserAgent: ${navigator.userAgent}\n`;
            output.textContent += `devicePixelRatio: ${window.devicePixelRatio || 1}\n`;

            // offscreen test: draw to an ephemeral canvas and read pixels
            const testCanvas = document.createElement('canvas');
            const DPR = Math.max(1, window.devicePixelRatio || 1);
            testCanvas.width = 4 * DPR; testCanvas.height = 4 * DPR;
            testCanvas.style.width = '4px'; testCanvas.style.height = '4px';
            const tctx = testCanvas.getContext('2d');
            tctx.fillStyle = 'rgb(10,20,30)';
            tctx.fillRect(0,0, testCanvas.width, testCanvas.height);
            // draw a small semi-transparent rect
            tctx.fillStyle = 'rgba(250,200,10,0.5)';
            tctx.fillRect(1*DPR,1*DPR,2*DPR,2*DPR);
            try{
                const td = tctx.getImageData(2*DPR,2*DPR,1,1).data;
                output.textContent += `offscreen test pixel: [${td.join(',')}]\n`;
            } catch(err){ output.textContent += `offscreen pixel read failed: ${err.message}\n`; }
        } catch(e){ output.textContent += `extra diag failed: ${e.message}\n`; }

        output.textContent += '\nDone. If anything looks wrong, paste this output here.';
    });

    panel.appendChild(btn);
    panel.appendChild(output);
    document.body.appendChild(panel);
}

// --- Live control panel for animation ------------------------------------
function createAnimationControlPanel(){
    if (document.getElementById('anim-control-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'anim-control-panel';
    Object.assign(panel.style, {
        position: 'fixed',
        right: '12px',
        bottom: '80px',
        zIndex: 99999,
        fontFamily: 'system-ui,Segoe UI,Roboto,Arial',
    });

    const toggle = document.createElement('button');
    toggle.textContent = 'Animation anpassen';
    Object.assign(toggle.style, {
        background: '#111827',
        color: '#fff',
        border: 'none',
        padding: '8px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(2,6,23,0.2)'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        display: 'none',
        marginTop: '8px',
        background: '#fff',
        color: '#111',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(2,6,23,0.12)',
        minWidth: '260px'
    });

    // helpers
    function makeRow(labelText){
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '8px';
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.marginRight = '8px';
        return {row, label};
    }

    // Color
    const {row: rColor, label: lColor} = makeRow('Farbe');
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#00c88c';
    rColor.appendChild(lColor);
    rColor.appendChild(colorInput);

    // Speed
    const {row: rSpeed, label: lSpeed} = makeRow('Geschwindigkeit');
    const speedInput = document.createElement('input');
    speedInput.type = 'range'; speedInput.min = '1'; speedInput.max = '12'; speedInput.value = '3';
    rSpeed.appendChild(lSpeed); rSpeed.appendChild(speedInput);

    // Line width
    const {row: rLine, label: lLine} = makeRow('Linienstärke');
    const lineInput = document.createElement('input');
    lineInput.type = 'range'; lineInput.min = '1'; lineInput.max = '10'; lineInput.value = '2';
    rLine.appendChild(lLine); rLine.appendChild(lineInput);

    // Candle width
    const {row: rCw, label: lCw} = makeRow('Kerzen-Breite');
    const cwInput = document.createElement('input'); cwInput.type = 'range'; cwInput.min='4'; cwInput.max='40'; cwInput.value='10';
    rCw.appendChild(lCw); rCw.appendChild(cwInput);

    // Spacing
    const {row: rSp, label: lSp} = makeRow('Abstand');
    const spInput = document.createElement('input'); spInput.type='range'; spInput.min='0'; spInput.max='30'; spInput.value='4';
    rSp.appendChild(lSp); rSp.appendChild(spInput);

    // Volatility
    const {row: rVol, label: lVol} = makeRow('Volatilität');
    const volInput = document.createElement('input'); volInput.type='range'; volInput.min='0'; volInput.max='40'; volInput.value='10';
    rVol.appendChild(lVol); rVol.appendChild(volInput);

    // 3D depth (toggle)
    const {row: rDepth, label: lDepth} = makeRow('3D-Effekt');
    const depthInput = document.createElement('input'); depthInput.type = 'checkbox'; depthInput.checked = true;
    rDepth.appendChild(lDepth); rDepth.appendChild(depthInput);

    // Perspective X (px)
    const {row: rDepthX, label: lDepthX} = makeRow('Perspektive X (px)');
    const depthXInput = document.createElement('input'); depthXInput.type = 'range'; depthXInput.min = '0'; depthXInput.max = '60'; depthXInput.value = '8';
    rDepthX.appendChild(lDepthX); rDepthX.appendChild(depthXInput);

    // Perspective Y (px)
    const {row: rDepthY, label: lDepthY} = makeRow('Perspektive Y (px)');
    const depthYInput = document.createElement('input'); depthYInput.type = 'range'; depthYInput.min = '0'; depthYInput.max = '40'; depthYInput.value = '4';
    rDepthY.appendChild(lDepthY); rDepthY.appendChild(depthYInput);

    // Height
    const {row: rHeight, label: lHeight} = makeRow('Höhe (px)');
    const heightInput = document.createElement('input');
    heightInput.type = 'number'; heightInput.min = '40'; heightInput.max = '600'; heightInput.value = '140'; heightInput.style.width = '80px';
    rHeight.appendChild(lHeight); rHeight.appendChild(heightInput);

    // Visibility toggle
    const {row: rVis, label: lVis} = makeRow('Sichtbar');
    const visInput = document.createElement('input'); visInput.type = 'checkbox'; visInput.checked = true;
    rVis.appendChild(lVis); rVis.appendChild(visInput);

    // Save / Reset
    const btnRow = document.createElement('div'); btnRow.style.display = 'flex'; btnRow.style.gap = '8px';
    const saveBtn = document.createElement('button'); saveBtn.textContent = 'Speichern';
    const resetBtn = document.createElement('button'); resetBtn.textContent = 'Zurücksetzen';
    [saveBtn, resetBtn].forEach(b=>{ Object.assign(b.style, {flex: '1', padding: '8px', borderRadius: '6px', border:'none', cursor:'pointer'}) });
    saveBtn.style.background = '#06b6d4'; saveBtn.style.color = '#fff'; resetBtn.style.background = '#ef4444'; resetBtn.style.color = '#fff';
    btnRow.appendChild(saveBtn); btnRow.appendChild(resetBtn);

    // Append rows (include candle controls)
    box.appendChild(rColor);
    box.appendChild(rSpeed);
    box.appendChild(rLine);
    box.appendChild(rCw);
    box.appendChild(rSp);
    box.appendChild(rVol);
    box.appendChild(rDepth);
    box.appendChild(rHeight);
    box.appendChild(rVis);
    box.appendChild(btnRow);

    // Toggle behavior
    toggle.addEventListener('click', () => { box.style.display = box.style.display === 'none' ? 'block' : 'none'; });

    // helper to apply values via controller when available
    function applyToController(){
        const col = colorInput.value || '#00c88c';
        // convert hex to rgba with alpha ~0.45
        const hex = col.replace('#','');
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        const rgba = `rgba(${r},${g},${b},0.45)`;
        const speed = Number(speedInput.value)||3;
        const lw = Number(lineInput.value)||2;
        const h = Number(heightInput.value)||140;
        const vis = !!visInput.checked;

        const cw = Number(cwInput.value) || 10;
        const sp = Number(spInput.value) || 4;
        const vol = Number(volInput.value) || 10;
        const enabled3d = !!depthInput.checked;
        const dx = enabled3d ? Number(depthXInput.value || 8) : 0;
        const dy = enabled3d ? Number(depthYInput.value || 4) : 0;

        if (window.stockAnimController){
            window.stockAnimController.setColor(rgba);
            window.stockAnimController.setSpeed(speed);
            window.stockAnimController.setLineWidth(lw);
            window.stockAnimController.setHeight(h);
            window.stockAnimController.setVisible(vis);
            // candle specifics
            window.stockAnimController.setCandleWidth(cw);
            window.stockAnimController.setSpacing(sp);
            window.stockAnimController.setVolatility(vol);
            window.stockAnimController.setDepthX(dx);
            window.stockAnimController.setDepthY(dy);
        } else {
            // set config so mount reads it when ready
            window.stockAnimConfig = window.stockAnimConfig || {};
            window.stockAnimConfig.color = rgba;
            window.stockAnimConfig.speed = speed;
            window.stockAnimConfig.lineWidth = lw;
            window.stockAnimConfig.height = h;
            window.stockAnimConfig.visible = vis;
            window.stockAnimConfig.candleWidth = cw;
            window.stockAnimConfig.spacing = sp;
            window.stockAnimConfig.volatility = vol;
            window.stockAnimConfig.depthX = dx;
            window.stockAnimConfig.depthY = dy;
        }
    }

    // live apply on change
    [colorInput, speedInput, lineInput, heightInput, visInput, cwInput, spInput, volInput, depthInput, depthXInput, depthYInput].forEach(inp => inp.addEventListener('input', applyToController));

    // save to localStorage
    saveBtn.addEventListener('click', () => {
        const cfg = window.stockAnimController ? window.stockAnimController.getConfig() : window.stockAnimConfig;
        try{ localStorage.setItem('capitovo_stock_anim', JSON.stringify(cfg)); alert('Einstellungen gespeichert'); } catch(e){ alert('Speichern fehlgeschlagen'); }
    });

    // reset
    resetBtn.addEventListener('click', () => {
        colorInput.value = '#00c88c'; speedInput.value = '3'; lineInput.value = '2'; heightInput.value = '140'; visInput.checked = true;
        cwInput.value = '10'; spInput.value = '4'; volInput.value = '10'; depthInput.checked = true;
        depthXInput.value = '8'; depthYInput.value = '4';
        applyToController(); try{ localStorage.removeItem('capitovo_stock_anim'); }catch(e){}
    });

    // hydrate values from localStorage or window.stockAnimConfig
    try{
        const fromStorage = JSON.parse(localStorage.getItem('capitovo_stock_anim')||'null');
        const cfg = fromStorage || window.stockAnimConfig || {};
        if (cfg.color){
            // convert rgba back to hex if possible: skip if not hex; keep default otherwise
            // we'll just keep picker default and apply rgba when controller available
            colorInput.value = cfg._hex || '#00c88c';
            // directly apply rgba to controller on mount
        }
        if (cfg.speed) speedInput.value = cfg.speed;
        if (cfg.lineWidth) lineInput.value = cfg.lineWidth;
        if (cfg.height) heightInput.value = cfg.height;
        if (typeof cfg.visible === 'boolean') visInput.checked = cfg.visible;
        if (cfg.candleWidth) cwInput.value = cfg.candleWidth;
        if (cfg.spacing) spInput.value = cfg.spacing;
        if (cfg.volatility) volInput.value = cfg.volatility;
        if (typeof cfg.depthX === 'number') depthXInput.value = cfg.depthX;
        if (typeof cfg.depthY === 'number') depthYInput.value = cfg.depthY;
        if (typeof cfg.depthX === 'number' || typeof cfg.depthY === 'number') depthInput.checked = (cfg.depthX||0) > 0 || (cfg.depthY||0) > 0;
    } catch(e){}

    // apply once at creation
    setTimeout(applyToController, 100);

    panel.appendChild(toggle);
    panel.appendChild(box);
    document.body.appendChild(panel);
}