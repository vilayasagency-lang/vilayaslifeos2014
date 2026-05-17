/**
 * Cashfree Payment Gateway Handler (Cloudflare Worker)
 */

export async function handlePayments(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  // 1. Create Payment Session
  if (url.pathname === '/payments/create-session' && method === 'POST') {
    const { planId } = await request.json();
    const userId = request.headers.get('user-id'); // Set from auth middleware

    // Plan pricing logic
    const amount = planId === 'pro_monthly' ? 199.00 : 999.00;
    const orderId = `order_${Date.now()}_${userId.substring(0, 5)}`;

    const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_amount: amount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: userId,
          customer_email: "user@example.com", // Fetch from Supabase in production
          customer_phone: "9999999999"
        },
        order_meta: {
          return_url: `${env.FRONTEND_URL}/subscription.html?order_id={order_id}`,
          payment_methods: "cc,dc,upi,nb"
        }
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  // 2. Webhook Handler (Cashfree calls this when payment is done)
  if (url.pathname === '/payments/webhook' && method === 'POST') {
    const payload = await request.json();
    
    // Security: Verify Cashfree Signature here...

    if (payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const userId = payload.data.customer_details.customer_id;
      const orderAmount = payload.data.order.order_amount;
      const plan = orderAmount > 500 ? 'legend' : 'pro';

      // Update Supabase Database via Service Role Key (Bypass RLS)
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          subscription_plan: plan,
          plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        })
      });
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Not Found", { status: 404 });
}
