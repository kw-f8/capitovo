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

/** Öffnet das Kontakt-Modal und füllt das Formular (falls Daten vorhanden). */
function openContactModal(){
    const contactModal = document.getElementById('contact-modal');
    const sidebar = document.getElementById('sidebar');
    if (!contactModal) return;

    // close sidebar if open
    if (sidebar && sidebar.classList.contains('open')) { sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); }

    try{
        const data = JSON.parse(localStorage.getItem('capitovo_contact')||'{}');
        if (data && typeof data === 'object'){
            ['name','email','phone','address'].forEach(f => {
                const el = document.getElementById('contact-' + f);
                if (el && data[f]) el.value = data[f];
            });

            // populate payment fields (masking full values)
            try{
                const pm = data.payment && data.payment.method ? data.payment.method : '';
                const select = document.getElementById('contact-payment-method');
                if (select) {
                    select.value = pm;
                    // trigger change so initContactForm's listener shows correct groups
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (pm === 'card' && data.payment.card_last4) {
                    const nameEl = document.getElementById('contact-card-name');
                    if (nameEl) nameEl.value = data.payment.card_name || '';
                    const numEl = document.getElementById('contact-card-number');
                    if (numEl) {
                        numEl.value = '';
                        numEl.placeholder = '•••• •••• •••• ' + (data.payment.card_last4 || '');
                    }
                }

                if (pm === 'sepa' && data.payment.iban_last4) {
                    const ibanEl = document.getElementById('contact-iban');
                    if (ibanEl) {
                        ibanEl.value = '';
                        ibanEl.placeholder = '•••• ' + data.payment.iban_last4;
                    }
                }

                if (pm === 'paypal' && data.payment.paypal_email) {
                    const ppEl = document.getElementById('contact-paypal-email');
                    if (ppEl) ppEl.value = data.payment.paypal_email;
                }
            }catch(e){}
        }
    }catch(e){}

    contactModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/** Schließt das Kontakt-Modal. */
function closeContactModal(){
    const contactModal = document.getElementById('contact-modal');
    if (!contactModal) return;
    contactModal.classList.add('hidden');
    document.body.style.overflow = '';
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
}

/** Initialisiert die Modal-Steuerung mit Event Delegation (Login + Kontakt). */
function initModalControl() {
    const loginModalElement = document.getElementById('login-modal');
    const contactModalElement = document.getElementById('contact-modal');

    // only enable contact-related handlers when the modal or an open link exists on the page
    const hasContactControls = !!contactModalElement || !!document.querySelector('a[href="#open-contact"]');

    // Event delegation: open login or contact modal
    document.body.addEventListener('click', (e) => {
        const linkLogin = e.target.closest('a[href="#open-login"]');
        if (linkLogin) { e.preventDefault(); openLoginModal(); return; }
        if (hasContactControls) {
            const linkContact = e.target.closest('a[href="#open-contact"]');
            if (linkContact) { e.preventDefault(); openContactModal(); return; }
        }
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