document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize Dashboard
    initDashboard(user);
    fetchQuickStats(user.id);
});

async function initDashboard(user) {
    // Set User Name
    const userName = user.user_metadata.full_name || 'User';
    document.getElementById('welcome-text').innerText = `Hello, ${userName}`;
    document.getElementById('user-name-display').innerText = userName;

    // Set Current Date
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('date-display').innerText = new Date().toLocaleDateString('en-US', options);
}

async function fetchQuickStats(userId) {
    try {
        // 1. Fetch Expenses Sum (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', userId)
            .gte('date', startOfMonth.toISOString().split('T')[0]);

        if (!expError) {
            const total = expenses.reduce((sum, item) => sum + item.amount, 0);
            document.getElementById('total-expense').innerText = `₹${total.toLocaleString()}`;
        }

        // 2. Fetch Vault Count
        const { count, error: vaultError } = await supabase
            .from('vault_files')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (!vaultError) {
            document.getElementById('vault-count').innerText = count || 0;
        }

        // 3. Fetch Next 3 Reminders
        const { data: reminders } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', userId)
            .gte('time', new Date().toISOString())
            .order('time', { ascending: true })
            .limit(3);

        const reminderList = document.getElementById('quick-reminders-list');
        if (reminders && reminders.length > 0) {
            reminderList.innerHTML = reminders.map(r => `
                <div class="mini-reminder">
                    <strong>${r.title}</strong>
                    <span>${new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `).join('');
        } else {
            reminderList.innerHTML = '<p class="hint">No upcoming tasks</p>';
        }

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
    }
}
