// js/i18n.js

const translations = {
    fr: {
        hero_role: "Créateur Digital",
        scroll_prompt: "Scroll / Dérive",
        about_title: "À Propos",
        about_text: "Je suis Ønyx. Je crée des expériences immersives, brisant les frontières entre les mondes numériques et réels.",
        about_skills: "Design | Code | 3D | Magie",
        "3d_title": "Créations 3D",
        web_title: "Web Apps",
        games_title: "Jeux Indés",
        other_title: "Expérimentations",
        other_desc: "Génératif, Audio, et au-delà.",
        contact_title: "Transmission",
        contact_name: "Nom // ID",
        contact_msg: "Message...",
        contact_btn: "Envoyer"
    },
    en: {
        hero_role: "Digital Creator",
        scroll_prompt: "Scroll / Drift",
        about_title: "About",
        about_text: "I am Ønyx. I craft immersive experiences, blurring the lines between digital and physical realms.",
        about_skills: "Design | Code | 3D | Magic",
        "3d_title": "3D Artworks",
        web_title: "Web Apps",
        games_title: "Indie Games",
        other_title: "Experiments",
        other_desc: "Generative, Audio, and beyond.",
        contact_title: "Transmission",
        contact_name: "Name // ID",
        contact_msg: "Message...",
        contact_btn: "Send"
    }
};

class I18n {
    constructor() {
        this.buttons = document.querySelectorAll('.lang-switcher button');
        this.init();
    }

    init() {
        const savedLang = localStorage.getItem('onyx_lang') || 'fr';
        this.setLang(savedLang);

        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLang(btn.getAttribute('data-set-lang'));
            });
        });
    }

    setLang(lang) {
        if (!translations[lang]) return;

        // Update text nodes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        // UI active state
        this.buttons.forEach(btn => {
            if (btn.getAttribute('data-set-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        localStorage.setItem('onyx_lang', lang);
    }
}
