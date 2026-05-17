# LifeOS — Billion-Dollar Scaling Architecture

## 🚀 Quick Deployment Guide

### 1. Supabase Setup
- Create a project at [supabase.com](https://supabase.com).
- Run the provided SQL scripts (from the code files above) in the SQL Editor.
- Enable Email/Password Auth.

### 2. Cloudflare R2 & Workers
- Create an R2 Bucket named `lifeos-assets`.
- Deploy the Worker using Wrangler: `wrangler deploy`.
- Set Environment Variables in Cloudflare Dashboard:
  - `CASHFREE_APP_ID`
  - `CASHFREE_SECRET_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `R2_BUCKET` (Binding)

### 3. Frontend Hosting
- Connect your GitHub repo to **Cloudflare Pages** or **Vercel**.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your environment.

### 4. Cashfree Integration
- Get API keys from [cashfree.com](https://cashfree.com).
- Add the Webhook URL: `https://your-worker.workers.dev/payments/webhook`.

## 📂 Architecture Overview
- **Frontend:** Vanilla JS, HTML5, CSS3 (Lightweight & Fast).
- **Backend:** Cloudflare Workers (Scalable Edge Functions).
- **Database:** Supabase PostgreSQL (Structured Data).
- **Storage:** Cloudflare R2 (Ultra Cheap Object Storage).
- **Payments:** Cashfree (Indian Market Leader).
