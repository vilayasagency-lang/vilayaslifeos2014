/**
 * LifeOS API Bridge
 * Handles communication with Cloudflare Workers
 */

const WORKER_URL = 'https://api.your-subdomain.workers.dev'; // Aapka deployed worker URL

const api = {
    // Helper to get Auth Token from Supabase session
    async getAuthHeader() {
        const { data: { session } } = await supabase.auth.getSession();
        return session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
    },

    // 1. Get Signed URL for R2 Upload (Security: User directly uploads to R2 using a temporary link)
    async getUploadUrl(fileName, fileType, folder = 'vault-files') {
        const headers = await this.getAuthHeader();
        const response = await fetch(`${WORKER_URL}/uploads/sign?file=${fileName}&type=${fileType}&folder=${folder}`, {
            headers
        });
        return await response.json(); // Returns { uploadUrl, fileKey }
    },

    // 2. Create Cashfree Payment Session
    async createPaymentSession(planId) {
        const headers = await this.getAuthHeader();
        const response = await fetch(`${WORKER_URL}/payments/create-session`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId })
        });
        return await response.json(); // Returns payment_session_id
    },

    // 3. Verify Payment Status
    async verifyPayment(orderId) {
        const headers = await this.getAuthHeader();
        const response = await fetch(`${WORKER_URL}/payments/verify?orderId=${orderId}`, {
            headers
        });
        return await response.json();
    },

    // 4. Admin: Get Platform Stats
    async getAdminStats() {
        const headers = await this.getAuthHeader();
        const response = await fetch(`${WORKER_URL}/admin/stats`, {
            headers
        });
        if (response.status === 403) throw new Error("Unauthorized");
        return await response.json();
    },

    // 5. Shared Family Notifications (Trigger Push)
    async sendFamilyAlert(alertType, message) {
        const headers = await this.getAuthHeader();
        await fetch(`${WORKER_URL}/notifications/send`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: alertType, message })
        });
    }
};

window.api = api;
