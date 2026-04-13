// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le système de traduction
    window.i18n = new I18n();

    // Initialiser le gestionnaire de thèmes
    window.themeManager = new ThemeManager();

    // Initialiser le moteur de dérive
    if (document.getElementById('world')) {
        window.driftEngine = new DriftEngine();
        
        // Connecter la minimap
        document.querySelectorAll('.minimap-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const target = dot.getAttribute('data-target');
                window.driftEngine.goTo(target);
            });
        });

        // Activation des iframes au besoin (Lazy Loading Logic)
        const observeActiveSections = () => {
            document.querySelectorAll('.zone.section-active').forEach(zone => {
                zone.querySelectorAll('iframe[data-src]').forEach(iframe => {
                    iframe.src = iframe.getAttribute('data-src');
                    iframe.removeAttribute('data-src');
                });
            });
            requestAnimationFrame(observeActiveSections);
        };
        observeActiveSections();
    }

    // Gestion du formulaire de contact (mailto)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = contactForm.querySelectorAll('input, textarea');
            const name = inputs[0].value;
            const email = inputs[1].value;
            const message = inputs[2].value;
            
            const subject = encodeURIComponent(`Nouveau message de ${name} via Portfolio`);
            const body = encodeURIComponent(`Nom/ID: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
            
            window.location.href = `mailto:Annonyx.contact@gmail.com?subject=${subject}&body=${body}`;
        });
    }

    // Easter Egg logo click
    const secretTrigger = document.getElementById('secret-trigger');
    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            const modal = document.getElementById('modal-secret');
            if (modal) modal.classList.add('active');
        });
    }

    // Gestion des modales détaillées "En savoir plus"
    const expandBtns = document.querySelectorAll('.expand-btn');
    const closeBtns = document.querySelectorAll('.close-modal');

    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.detail-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Isolation du scroll pour ne pas faire dériver le monde en arrière-plan
    document.querySelectorAll('.detail-modal').forEach(modal => {
        modal.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: true });
        modal.addEventListener('touchmove', (e) => { e.stopPropagation(); }, { passive: true });
        modal.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    });

    // Fermer avec Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.detail-modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Gestion du curseur personnalisé
    initCursor();
});

function initCursor() {
    const cursor = document.getElementById('cursor');
    const trail = document.getElementById('cursor-trail');
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let trailX = mouseX;
    let trailY = mouseY;
    
    window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });
    
    // Animation loop pour lag doucement la traînée
    function animateCursor() {
        trailX += (mouseX - trailX) * 0.15;
        trailY += (mouseY - trailY) * 0.15;
        
        trail.style.left = trailX + 'px';
        trail.style.top = trailY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
    
    // Effet hover sur les éléments interactifs
    const interactives = document.querySelectorAll('button, a, input, textarea, .minimap-dot, .expand-btn');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursor.style.backgroundColor = 'var(--cursor-color)';
            
            // Jouer un petit son si atmosphère active
            if (window.atmosphereManager) window.atmosphereManager.playClick();
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.backgroundColor = 'transparent';
        });
    });

    // Désactivation automatique de l'atmosphère sur mobile (précaution supplémentaire)
    if (window.innerWidth <= 1024 && window.atmosphereManager) {
        // Optionnel : masquer complètement le bouton toggle sur mobile
        const toggle = document.getElementById('atmosphere-toggle');
        if (toggle) toggle.style.display = 'none';
    }
}
