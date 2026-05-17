document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Set default date to today in the modal
    document.getElementById('exp-date').valueAsDate = new Date();
    // Set default month picker to current month
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    document.getElementById('month-picker').value = currentMonth;

    loadExpenses(user.id);

    // --- Modal Logic ---
    const modal = document.getElementById('expense-modal');
    document.getElementById('add-expense-btn').onclick = () => modal.style.display = 'flex';
    document.getElementById('close-expense-modal').onclick = () => modal.style.display = 'none';

    // --- Form Submission ---
    document.getElementById('expense-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;

        const expenseData = {
            user_id: user.id,
            amount: parseFloat(document.getElementById('exp-amount').value),
            description: document.getElementById('exp-desc').value,
            category: document.getElementById('exp-category').value,
            date: document.getElementById('exp-date').value
        };

        const { error } = await supabase.from('expenses').insert([expenseData]);

        if (error) {
            alert("Error saving expense: " + error.message);
        } else {
            modal.style.display = 'none';
            e.target.reset();
            loadExpenses(user.id);
        }
        btn.disabled = false;
    };

    // --- Filter Logic ---
    document.getElementById('category-filter').onchange = () => loadExpenses(user.id);
    document.getElementById('month-picker').onchange = () => loadExpenses(user.id);
});

// 1. Load and Render Expenses
async function loadExpenses(userId) {
    const container = document.getElementById('expense-items');
    const categoryFilter = document.getElementById('category-filter').value;
    const monthFilter = document.getElementById('month-picker').value; // YYYY-MM

    let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    // Apply Category Filter
    if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
    }

    // Apply Month Filter
    if (monthFilter) {
        const start = `${monthFilter}-01`;
        const end = `${monthFilter}-31`;
        query = query.gte('date', start).lte('date', end);
    }

    const { data: expenses, error } = await query;

    if (error) {
        container.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
        return;
    }

    if (expenses.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No expenses found for this period.</td></tr>';
        updateSummary(0);
        return;
    }

    let total = 0;
    container.innerHTML = expenses.map(exp => {
        total += exp.amount;
        return `
            <tr>
                <td>${new Date(exp.date).toLocaleDateString()}</td>
                <td>${exp.description}</td>
                <td><span class="badge-category">${exp.category}</span></td>
                <td><strong>₹${exp.amount.toLocaleString()}</strong></td>
                <td><button onclick="deleteExpense('${exp.id}')" class="btn-delete-small">🗑️</button></td>
            </tr>
        `;
    }).join('');

    updateSummary(total);
}

// 2. Update Summary Cards
function updateSummary(total) {
    document.getElementById('monthly-total').innerText = `₹${total.toLocaleString()}`;
    // Simple logic for budget (can be expanded to fetch from a 'budgets' table)
    const budget = 50000; 
    const left = budget - total;
    const budgetEl = document.getElementById('budget-left');
    budgetEl.innerText = `₹${left.toLocaleString()}`;
    budgetEl.style.color = left < 0 ? 'var(--danger)' : 'var(--success)';
}

// 3. Delete Expense
async function deleteExpense(id) {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) location.reload();
}
