/**
 * LifeOS PWA Handler
 * Handles Service Worker registration & App Installation
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/pwa/service-worker.js')
            .then(reg => console.log('Service Worker Registered!', reg.scope))
            .catch(err => console.log('Service Worker Registration Failed', err));
    });
}

let deferredPrompt;
const installBtn = document.getElementById('install-pwa-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Show the install button (if you have one in UI)
    if (installBtn) installBtn.style.display = 'block';
});

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
    }
}
