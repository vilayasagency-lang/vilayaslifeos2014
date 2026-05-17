document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Initialize Cashfree
    const cashfree = Cashfree({
        mode: "sandbox" // Change to "production" when going live
    });

    loadSubscriptionStatus(user.id);

    // 2. Handle Upgrade Button Click
    const upgradeBtns = document.querySelectorAll('#upgrade-pro-btn, #upgrade-legend-btn');
    
    upgradeBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const planId = e.target.id === 'upgrade-pro-btn' ? 'pro_monthly' : 'legend_yearly';
            const originalText = btn.innerText;
            
            try {
                btn.innerText = "Processing...";
                btn.disabled = true;

                // Step A: Create Payment Session via Cloudflare Worker
                const sessionData = await api.createPaymentSession(planId);

                if (!sessionData.payment_session_id) {
                    throw new Error("Failed to create payment session");
                }

                // Step B: Launch Cashfree Checkout
                let checkoutOptions = {
                    paymentSessionId: sessionData.payment_session_id,
                    redirectTarget: "_self", // Opens in same tab
                };

                cashfree.checkout(checkoutOptions).then((result) => {
                    if (result.error) {
                        alert(result.error.message);
                    }
                    if (result.redirect) {
                        console.log("Redirecting user to payment page...");
                    }
                });

            } catch (err) {
                alert("Payment Error: " + err.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    });
});

// 3. Load Current Plan Status
async function loadSubscriptionStatus(userId) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan, plan_expiry')
        .eq('id', userId)
        .single();

    if (error) return;

    const planName = document.getElementById('current-plan-name');
    const planExpiry = document.getElementById('plan-expiry');
    const statusBadge = document.getElementById('status-badge');

    if (profile.subscription_plan) {
        planName.innerText = profile.subscription_plan.toUpperCase();
        statusBadge.innerText = "Active";
        statusBadge.className = "plan-badge active-plan";
        
        if (profile.plan_expiry) {
            planExpiry.innerText = `Renews on: ${new Date(profile.plan_expiry).toLocaleDateString()}`;
        }
    }
}
