/**
 * LifeOS Utility Helpers
 */

const utils = {
    // 1. Currency Formatter (Indian Rupee - INR)
    formatINR(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    },

    // 2. Date Formatter (e.g., 24 Oct 2023)
    formatDate(dateString) {
        if (!dateString) return "N/A";
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },

    // 3. Time Ago (e.g., "2 hours ago") - For Memories/Alerts
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    },

    // 4. File Size Formatter (Bytes to MB/GB)
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    // 5. Input Sanitization (Prevents basic XSS attacks)
    sanitize(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // 6. Generate Unique ID (Fallback for client-side usage)
    uuid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

    // 7. Copy to Clipboard (For Vault links or Share IDs)
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            if (window.notifications) window.notifications.showToast("Copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
};

window.utils = utils;
