// js/drift.js

class DriftEngine {
    constructor() {
        this.world = document.getElementById('world');
        this.worldBackground = document.getElementById('world-background');
        this.viewport = document.getElementById('viewport');
        this.zones = Array.from(document.querySelectorAll('.zone'));
        this.minimapIndicator = document.querySelector('.minimap-indicator');
        
        // Coordonnées cibles (celles définies dans l'HTML via transform)
        // On les lit pour construire le chemin
        this.waypoints = this.zones.map(zone => {
            const left = zone.style.left;
            const top = zone.style.top;
            return {
                id: zone.id,
                element: zone,
                x: left ? parseFloat(left) : 0,
                y: top ? parseFloat(top) : 0
            };
        });

        // trier les waypoints dans un ordre logique de parcours
        // Pour l'instant, on prend l'ordre du DOM
        
        this.currentProgress = 0; // 0 to 1
        this.targetProgress = 0;
        
        this.scrollSensitivity = 0.0002;
        this.lerpFactor = 0.03;

        // Limites du viewport pour centrer
        this.offsetY = 50; // vh (centrer verticalement)

        this.prevProgress = 0;
        this.velocity = 0;

        this.initEvents();
        this.loop();
    }

    initEvents() {
        window.addEventListener('wheel', (e) => {
            // Empêcher le scroll normal si on dérive
            
            // Calculer le delta global
            const delta = e.deltaY;
            this.targetProgress += delta * this.scrollSensitivity;
            
            // Clamp
            this.targetProgress = Math.max(0, Math.min(1, this.targetProgress));
        }, { passive: false });

        // Touch support pour mobile
        let touchStartY = 0;
        window.addEventListener('touchstart', e => {
            touchStartY = e.touches[0].clientY;
        });
        window.addEventListener('touchmove', e => {
            const deltaY = touchStartY - e.touches[0].clientY;
            this.targetProgress += deltaY * (this.scrollSensitivity * 1.5);
            this.targetProgress = Math.max(0, Math.min(1, this.targetProgress));
            touchStartY = e.touches[0].clientY;
        });
    }

    getWaypointsSegment(progress) {
        if (progress <= 0) return { p1: this.waypoints[0], p2: this.waypoints[0], t: 0, index: 0 };
        if (progress >= 1) return { p1: this.waypoints[this.waypoints.length - 1], p2: this.waypoints[this.waypoints.length - 1], t: 1, index: this.waypoints.length - 1 };

        const segmentsCount = this.waypoints.length - 1;
        const scaledProgress = progress * segmentsCount;
        const index = Math.floor(scaledProgress);
        const t = scaledProgress - index;

        return {
            p1: this.waypoints[index],
            p2: this.waypoints[index + 1],
            t: t,
            index: index
        };
    }

    // Interpolation de base
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Ease in out pour le chemin
    ease(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    update() {
        if (window.innerWidth <= 1024) return;
        
        // smooth target progress
        this.currentProgress = this.lerp(this.currentProgress, this.targetProgress, this.lerpFactor);

        const segment = this.getWaypointsSegment(this.currentProgress);
        
        // Eased interpolation parameter
        const smoothT = this.ease(segment.t);

        // Position de la caméra (inversée par rapport aux entités)
        // La caméra se déplace vers le x/y du waypoint. 
        // Donc le world bouge de -x, -y
        const camX = this.lerp(segment.p1.x, segment.p2.x, smoothT);
        const camY = this.lerp(segment.p1.y, segment.p2.y, smoothT);

        // Appliquer la transformation au monde
        // On veut que camX, camY soit au centre de l'écran (50vw, 50vh)
        this.world.style.transform = `translate(calc(50vw - ${camX}vw), calc(50vh - ${camY}vh))`;

        // Motion Blur based on speed
        this.velocity = Math.abs(this.currentProgress - this.prevProgress);
        this.prevProgress = this.currentProgress;
        
        const blurAmount = Math.min(this.velocity * 500, 10); // Max 10px blur
        if (blurAmount > 0.5) {
            this.world.style.filter = `blur(${blurAmount.toFixed(1)}px)`;
        } else {
            this.world.style.filter = 'blur(0px)';
        }

        // Parallax sur le background pseudo-infini (1vw = 1% environment approx)
        if (this.worldBackground) {
            this.worldBackground.style.backgroundPosition = `calc(50% + ${-camX * 0.5}vw) calc(50% + ${-camY * 0.5}vh)`;
        }

        // Calcul de la distance pour les effets (flou, peinture, magie)
        this.waypoints.forEach(w => {
            const dx = w.x - camX;
            const dy = w.y - camY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // On limite la distance max pour les calculs CSS (ex: au delà de 150vw, l'effet s'arrête de grandir)
            const clampedDist = Math.min(dist, 150);
            w.element.style.setProperty('--dist', clampedDist.toFixed(2));
        });

        this.updateActiveSection(segment);
        this.updateMinimap(camX, camY);
    }

    updateActiveSection(segment) {
        // Marquer le waypoint prédominant comme actif
        const activeIndex = segment.t < 0.5 ? segment.index : segment.index + 1;
        
        this.zones.forEach((zone, i) => {
            if (i === activeIndex) {
                if (!zone.classList.contains('section-active')) {
                    zone.classList.add('section-active');
                }
            } else {
                zone.classList.remove('section-active');
            }
        });
    }

    updateMinimap(x, y) {
        // x est entre ~10vw et ~160vw
        // y est entre ~10vh et ~200vh
        // Mapping simple pour la démo
        if (this.minimapIndicator) {
            // valeurs empiriques basées sur les positions dans html
            const mapLeft = (x / 180) * 100;
            const mapTop = (y / 220) * 100;
            this.minimapIndicator.style.left = `${Math.min(100, Math.max(0, mapLeft))}%`;
            this.minimapIndicator.style.top = `${Math.min(100, Math.max(0, mapTop))}%`;
        }
    }

    // Set progress directly (used by minimap clicks)
    goTo(targetId) {
        const index = this.waypoints.findIndex(w => w.id === targetId);
        if (index !== -1) {
            this.targetProgress = index / (this.waypoints.length - 1);
        }
    }

    loop() {
        this.update();
        requestAnimationFrame(() => this.loop());
    }
}
