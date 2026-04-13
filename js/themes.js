// js/themes.js

class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.buttons = document.querySelectorAll('.theme-switcher button');
        
        // Theme fonts links
        this.fonts = {
            neon: document.querySelector('.theme-font-neon'),
            prairie: document.querySelector('.theme-font-prairie'),
            medieval: document.querySelector('.theme-font-medieval')
        };
        
        this.init();
    }

    init() {
        // Prendre la sauvegarde ou le default
        const savedTheme = localStorage.getItem('onyx_theme') || 'neon';
        this.setTheme(savedTheme);

        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.getAttribute('data-set-theme'));
            });
        });
    }

    setTheme(themeName) {
        // Mettre à jour l'attribut HTML pour les variables CSS globales
        this.html.setAttribute('data-theme', themeName);
        
        // Gérer les polices (désactiver pour perf/conflits, activer celle du theme)
        Object.keys(this.fonts).forEach(key => {
            if (this.fonts[key]) {
                if (key === themeName) {
                    this.fonts[key].removeAttribute('disabled');
                } else {
                    this.fonts[key].setAttribute('disabled', 'true');
                }
            }
        });

        // Gérer le stylesheet spécifique
        const themeLink = document.getElementById('theme-stylesheet');
        if (themeLink) {
            themeLink.href = `css/themes/${themeName}.css`;
        }

        // Mettre à jour l'UI des boutons
        this.buttons.forEach(btn => {
            if (btn.getAttribute('data-set-theme') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        localStorage.setItem('onyx_theme', themeName);
    }
}
