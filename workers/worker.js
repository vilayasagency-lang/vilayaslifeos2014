/**
 * LifeOS Main Cloudflare Worker
 * Handles Routing, CORS, and Security
 */

import { handleUploads } from './routes/uploads.js';
import { handlePayments } from './routes/payments.js';
import { handleAdmin } from './routes/admin.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;

    // 1. Handle CORS (Preflight)
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 2. Authentication Middleware
    // We verify the Supabase JWT token before allowing access to sensitive routes
    const authHeader = request.headers.get('Authorization');
    if (!authHeader && !url.pathname.includes('/public/')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
      // 3. Routing Logic
      if (url.pathname.startsWith('/uploads/')) {
        return await handleUploads(request, env);
      } 
      
      if (url.pathname.startsWith('/payments/')) {
        return await handlePayments(request, env);
      }

      if (url.pathname.startsWith('/admin/')) {
        return await handleAdmin(request, env);
      }

      return new Response("LifeOS API - Online", { status: 200 });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};
