// Supabase Configuration
const SUPABASE_URL = 'https://gjjwtwhdodwjqvyvfnwc.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_pzabgc-npmu-GS_1f4cKFQ_oiiBQ2k8';

// Initialize the Supabase Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Helper to check session
async function checkUserSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        return null;
    }
    return session.user;
}

// Global Logout Function
async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("Error logging out: " + error.message);
    } else {
        window.location.href = '/login.html';
    }
}

// Export for use in other files
window.supabase = supabase;
