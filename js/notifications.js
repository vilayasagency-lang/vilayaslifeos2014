/**
 * LifeOS Notification System
 * Handles Push Notifications & In-App Alerts
 */

const NotificationManager = {
    // 1. Initialize & Request Permission
    async init() {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }

        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                this.showLocalNotification("Notifications Enabled", "You will now receive important life alerts.");
            }
        }
    },

    // 2. Show Immediate Local Notification
    showLocalNotification(title, body, icon = '/assets/icons/icon-192x192.png') {
        if (Notification.permission === "granted") {
            const options = {
                body: body,
                icon: icon,
                badge: '/assets/icons/badge-icon.png',
                vibrate: [200, 100, 200]
            };
            
            // Try via Service Worker (Best for PWA)
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                // Fallback to standard browser notification
                new Notification(title, options);
            }
        }
    },

    // 3. Register Push Subscription (For Backend-to-Frontend Push)
    // Yeh part Cloudflare Workers se backend notifications receive karne ke liye hai
    async subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Generate this in your Worker
            });

            // Send subscription to backend via api.js
            await fetch(`${WORKER_URL}/notifications/save-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            console.log("Push Subscription Successful");
        } catch (err) {
            console.error("Push Subscription Failed:", err);
        }
    },

    // 4. In-App Toast Notification (UI Only)
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;
        toast.innerText = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
window.notifications = NotificationManager;
