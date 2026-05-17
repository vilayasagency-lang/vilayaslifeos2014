/**
 * LifeOS Internationalization (i18n) Logic
 */

const LanguageManager = {
    currentLang: localStorage.getItem('lifeos_lang') || 'en',
    translations: {},

    // 1. Initialize Language
    async init() {
        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        
        // Language Switcher Dropdown (if exists in UI)
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.value = this.currentLang;
            selector.addEventListener('change', (e) => this.switchLanguage(e.target.value));
        }
    },

    // 2. Fetch JSON file
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/translations/${lang}.json`);
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('lifeos_lang', lang);
        } catch (err) {
            console.error("Could not load translations:", err);
            // Fallback to English if Hindi fails
            if (lang !== 'en') await this.loadTranslations('en');
        }
    },

    // 3. Switch Language & Re-render
    async switchLanguage(lang) {
        await this.loadTranslations(lang);
        this.applyTranslations();
        // Dispatch event so other scripts know language changed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    },

    // 4. Update DOM Elements
    applyTranslations() {
        // Elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                // If it's an input with placeholder
                if (el.tagName === 'INPUT' && el.placeholder) {
                    el.placeholder = this.translations[key];
                } else {
                    el.innerText = this.translations[key];
                }
            }
        });

        // Update Document Title if key exists
        if (this.translations['app_title']) {
            document.title = this.translations['app_title'];
        }
    },

    // 5. Helper for JS-only strings
    get(key) {
        return this.translations[key] || key;
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => LanguageManager.init());
window.i18n = LanguageManager;
