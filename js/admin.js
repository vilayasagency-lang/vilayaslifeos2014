document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Security Check: Only allow if role is 'admin'
    if (!user || user.user_metadata.role !== 'admin') {
        alert("Unauthorized Access!");
        window.location.href = '/dashboard.html';
        return;
    }

    // Initialize Admin Dashboard
    loadAdminStats();
    loadUserList();
    loadSystemLogs();

    // Search Logic
    document.getElementById('user-search').addEventListener('input', (e) => {
        filterUsers(e.target.value);
    });
});

// 1. Fetch Aggregate Stats
async function loadAdminStats() {
    try {
        // Fetch Total Users count from Supabase
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Fetch Total Revenue from Payments Table (Sum)
        const { data: revenueData } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'SUCCESS');
        
        const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

        // Fetch R2 Stats via Cloudflare Worker (api.js)
        const systemStats = await api.getAdminStats();

        // Update UI
        document.getElementById('total-users-count').innerText = userCount || 0;
        document.getElementById('total-revenue').innerText = `₹${totalRevenue.toLocaleString()}`;
        document.getElementById('total-r2-usage').innerText = `${systemStats.storageUsedGB} GB`;
        document.getElementById('active-sos-count').innerText = systemStats.activeAlerts;

    } catch (err) {
        console.error("Admin Stats Error:", err);
    }
}

// 2. Load User Management List
async function loadUserList() {
    const container = document.getElementById('admin-user-list');
    
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    window.allUsers = users; // Store globally for filtering
    renderUserTable(users);
}

function renderUserTable(users) {
    const container = document.getElementById('admin-user-list');
    container.innerHTML = users.map(u => `
        <tr>
            <td>
                <div class="user-info">
                    <strong>${u.full_name}</strong><br>
                    <span>${u.id.substring(0, 8)}...</span>
                </div>
            </td>
            <td><span class="badge-${u.subscription_plan}">${u.subscription_plan}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td><span class="status-indicator online">Active</span></td>
            <td>
                <button onclick="manageUser('${u.id}')" class="btn-small">Edit</button>
            </td>
        </tr>
    `).join('');
}

// 3. Admin Actions (Suspend/Delete/Upgrade)
async function manageUser(userId) {
    const action = confirm("Manage User: Select OK to suspend or Cancel to exit.");
    if (action) {
        // Example: Update metadata or profile
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'suspended' })
            .eq('id', userId);
        
        if (!error) {
            alert("User status updated.");
            loadUserList();
        }
    }
}

// 4. System Logs Simulation
function loadSystemLogs() {
    const logs = document.getElementById('system-logs');
    const entries = [
        "Cloudflare Worker: Payment Webhook processed.",
        "R2: Cleanup task completed for /temp-uploads.",
        "Supabase: Database backup successful.",
        "Security: Failed login attempt blocked from IP 192.168.1.1"
    ];
    
    logs.innerHTML = entries.map(entry => `
        <div class="log-entry">[${new Date().toLocaleTimeString()}] ${entry}</div>
    `).join('');
}

function filterUsers(query) {
    const filtered = window.allUsers.filter(u => 
        u.full_name.toLowerCase().includes(query.toLowerCase())
    );
    renderUserTable(filtered);
}
