# 14. Deployment - DigitalOcean App Platform

This guide covers deploying the Polhem MVP demo to DigitalOcean App Platform with Cloudflare DNS.

---

## Prerequisites

Before deploying, ensure:
- [ ] All code is committed to a Git repository (GitHub recommended)
- [ ] Supabase project is set up with production database
- [ ] Clerk application is configured for production domain
- [ ] DigitalOcean account is active
- [ ] Cloudflare account is set up (if using custom domain)

---

## Step 1: Prepare the Application

### 1.1 Verify Production Build Locally

```bash
# Clean install dependencies
rm -rf node_modules
npm ci

# Run production build
npm run build

# Test production server locally
npm start
```

Ensure no build errors before proceeding.

### 1.2 Update package.json Scripts

Verify these scripts exist in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 1.3 Create next.config.mjs (if not exists)

**Note:** Next.js 16+ uses ES Modules by default. Create `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for optimized Docker builds
  output: 'standalone',
  
  // Disable image optimization if not using next/image extensively
  images: {
    unoptimized: true,
  },
  
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
```

---

## Step 2: DigitalOcean App Platform Configuration

### 2.1 Create App Spec File

Create `.do/app.yaml` in your project root:

```yaml
name: polhem-mvp-demo
region: fra
features:
  - buildpack-stack=ubuntu-22

services:
  - name: web
    github:
      repo: your-username/polhem-mvp-demo
      branch: main
      deploy_on_push: true
    build_command: npm ci && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    health_check:
      http_path: /api/health
      initial_delay_seconds: 10
      period_seconds: 30
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    envs:
      # Supabase
      - key: SUPABASE_SECRET
        scope: RUN_AND_BUILD_TIME
        type: SECRET
      
      # Clerk Authentication
      - key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        scope: RUN_AND_BUILD_TIME
        type: GENERAL
      - key: CLERK_SECRET_KEY
        scope: RUN_AND_BUILD_TIME
        type: SECRET
      - key: NEXT_PUBLIC_CLERK_SIGN_IN_URL
        scope: RUN_AND_BUILD_TIME
        value: /sign-in
      - key: NEXT_PUBLIC_CLERK_SIGN_UP_URL
        scope: RUN_AND_BUILD_TIME
        value: /sign-up
      - key: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
        scope: RUN_AND_BUILD_TIME
        value: /dashboard
      - key: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
        scope: RUN_AND_BUILD_TIME
        value: /dashboard
      
      # Application
      - key: NEXT_PUBLIC_APP_URL
        scope: RUN_AND_BUILD_TIME
        value: ${APP_URL}
      - key: NODE_ENV
        scope: RUN_AND_BUILD_TIME
        value: production
```

### 2.2 Create Health Check Endpoint

Create `app/api/health/route.js`:

```javascript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
}
```

---

## Step 3: Deploy via DigitalOcean Dashboard

### 3.1 Create New App

1. Log in to [DigitalOcean Cloud Console](https://cloud.digitalocean.com/)
2. Navigate to **Apps** in the left sidebar
3. Click **Create App**
4. Select **GitHub** as the source
5. Authorize DigitalOcean to access your repository
6. Select the `polhem-mvp-demo` repository
7. Choose the `main` branch
8. Click **Next**

### 3.2 Configure Resources

1. DigitalOcean will auto-detect Next.js
2. Verify the following settings:
   - **Type:** Web Service
   - **Build Command:** `npm ci && npm run build`
   - **Run Command:** `npm start`
   - **HTTP Port:** 3000
3. Select instance size:
   - **Basic** ($5/mo) for demo
   - **Professional** for production
4. Click **Next**

### 3.3 Configure Environment Variables

Add these environment variables in the dashboard:

| Variable | Value | Encrypt |
|----------|-------|---------|
| `SUPABASE_SECRET` | Your Supabase service role key | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key | No |
| `CLERK_SECRET_KEY` | Your Clerk secret key | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | No |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | No |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | No |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.ondigitalocean.app` | No |
| `NODE_ENV` | `production` | No |

### 3.4 Review and Deploy

1. Review the configuration
2. Click **Create Resources**
3. Wait for the build and deployment to complete (5-10 minutes)
4. Note the assigned URL: `https://polhem-mvp-demo-xxxxx.ondigitalocean.app`

---

## Step 4: Custom Domain with Cloudflare

### 4.1 Add Domain in DigitalOcean

1. In your app's **Settings** tab, find **Domains**
2. Click **Edit**
3. Add your custom domain (e.g., `demo.polhem.app`)
4. DigitalOcean will provide a CNAME target

### 4.2 Configure Cloudflare DNS

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Go to **DNS** > **Records**
4. Add a CNAME record:

| Type | Name | Target | Proxy status |
|------|------|--------|--------------|
| CNAME | `demo` | `polhem-mvp-demo-xxxxx.ondigitalocean.app` | Proxied (orange cloud) |

### 4.3 Configure Cloudflare SSL

1. Go to **SSL/TLS** > **Overview**
2. Set mode to **Full (strict)**
3. Go to **SSL/TLS** > **Edge Certificates**
4. Enable **Always Use HTTPS**
5. Enable **Automatic HTTPS Rewrites**

### 4.4 Configure Cloudflare Page Rules (Optional)

For caching optimization:

1. Go to **Rules** > **Page Rules**
2. Add rule for static assets:
   - URL: `demo.polhem.app/_next/static/*`
   - Setting: **Cache Level** = Cache Everything
   - Setting: **Edge Cache TTL** = 1 month

### 4.5 Update Environment Variables

After domain is configured, update:

1. In DigitalOcean App Settings:
   - `NEXT_PUBLIC_APP_URL` = `https://demo.polhem.app`

2. In Clerk Dashboard:
   - Add `https://demo.polhem.app` to allowed origins
   - Update redirect URLs to use new domain

---

## Step 5: Update Clerk for Production

### 5.1 Configure Production Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to **Configure** > **Paths**
4. Verify redirect URLs match your deployment:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

### 5.2 Add Production Domain

1. Go to **Configure** > **Domains**
2. Add your production domain: `demo.polhem.app`
3. Follow verification steps if required

### 5.3 Update Allowed Origins

1. Go to **Configure** > **Settings**
2. Under **Allowed origins**, add:
   - `https://demo.polhem.app`
   - `https://polhem-mvp-demo-xxxxx.ondigitalocean.app` (if keeping as fallback)

---

## Step 6: Supabase Production Configuration

### 6.1 Configure Connection Pooling

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **Database**
4. Enable **Connection Pooling** for better performance
5. Note: For demo scale, direct connection is fine

### 6.2 Row Level Security (RLS)

For the demo, RLS can remain disabled since all access goes through API routes with Clerk authentication. For production:

1. Enable RLS on all tables
2. Create policies based on authenticated user context

### 6.3 Database Backups

1. Go to **Settings** > **Database**
2. Verify automatic backups are enabled
3. For demo: Daily backups are sufficient
4. For production: Point-in-time recovery recommended

---

## Step 7: Post-Deployment Verification

### 7.1 Verify Health Check

```bash
curl https://demo.polhem.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T...",
  "version": "1.0.0"
}
```

### 7.2 Verify Authentication Flow

1. Navigate to `https://demo.polhem.app`
2. Should redirect to `/sign-in`
3. Complete sign-in with Clerk
4. Should redirect to `/dashboard`

### 7.3 Verify API Connectivity

```bash
# Test orders endpoint (requires authentication in browser)
curl https://demo.polhem.app/api/orders
```

### 7.4 Check Build Logs

1. In DigitalOcean App Dashboard
2. Go to **Activity** tab
3. Click on latest deployment
4. Review **Build Logs** and **Deploy Logs** for any warnings

---

## Step 8: Monitoring and Alerts

### 8.1 DigitalOcean Monitoring

1. In App Dashboard, go to **Insights**
2. Monitor:
   - CPU usage
   - Memory usage
   - Request latency
   - Error rate

### 8.2 Set Up Alerts (Optional)

1. Go to **Settings** > **Alerts**
2. Configure alerts for:
   - High error rate (> 5%)
   - High latency (> 2s average)
   - Deployment failures

### 8.3 Logging

DigitalOcean automatically captures:
- Build logs
- Runtime logs
- HTTP access logs

Access via **Runtime Logs** in the app dashboard.

---

## Deployment Checklist

Before marking deployment complete:

- [ ] Production build succeeds locally
- [ ] App deployed to DigitalOcean
- [ ] Health check endpoint responds
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Clerk authentication working
- [ ] API routes return data
- [ ] Dashboard loads correctly
- [ ] Schedule page renders
- [ ] Environment variables all set
- [ ] Cloudflare proxy enabled (if using)

---

## Troubleshooting

### Build Fails

1. Check build logs in DigitalOcean
2. Verify all dependencies in `package.json`
3. Ensure `npm ci` works locally
4. Check for case-sensitivity issues in imports (Linux is case-sensitive)

### Authentication Errors

1. Verify Clerk keys match environment
2. Check domain is allowed in Clerk dashboard
3. Ensure cookies are being set (check browser dev tools)

### Database Connection Errors

1. Verify `SUPABASE_SECRET` is set correctly
2. Check Supabase project is not paused
3. Verify service role key (not anon key)

### 502 Bad Gateway

1. Check runtime logs for crashes
2. Verify `npm start` command works
3. Ensure HTTP port 3000 is correct
4. Check for memory issues (upgrade instance if needed)

### SSL/HTTPS Issues

1. If using Cloudflare, set SSL mode to "Full (strict)"
2. Wait for SSL certificate provisioning (up to 24 hours)
3. Clear browser cache and try incognito

---

## Rollback Procedure

If deployment fails:

1. In DigitalOcean App Dashboard
2. Go to **Activity** tab
3. Find last successful deployment
4. Click **Rollback to this deployment**

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| DigitalOcean Basic ($5 instance) | $5 |
| Supabase Free Tier | $0 |
| Clerk Free Tier (up to 10,000 MAU) | $0 |
| Cloudflare Free Plan | $0 |
| **Total for Demo** | **$5/month** |

For production with higher traffic:
- DigitalOcean Professional: $12-50/month
- Supabase Pro: $25/month
- Clerk Pro: Based on MAU

---

## Next Steps

After successful deployment:

1. Proceed to `15-verification.md` for complete testing checklist
2. Share demo URL with stakeholders
3. Monitor for first 24-48 hours for issues
4. Set up regular backup verification
