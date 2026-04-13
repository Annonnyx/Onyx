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
    const interactives = document.querySelectorAll('button, a, input, textarea, .minimap-dot');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursor.style.backgroundColor = 'var(--cursor-color)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.backgroundColor = 'transparent';
        });
    });
}
