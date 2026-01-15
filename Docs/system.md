# System Architecture Documentation
# Polhem MVP

---

## Overview

This document describes the complete system architecture, technology stack, deployment configuration, and project structure for the Polhem production planning demo application.

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework with App Router |
| React | 19.x | UI library (bundled with Next.js 16) |
| Node.js | 20.10.0 | Runtime environment |
| JavaScript | ES2022+ | Programming language (no TypeScript) |

### Styling

| Technology | Purpose |
|------------|---------|
| Tailwind CSS | Utility-first CSS framework |
| shadcn/ui | Reusable component library |

> **Note:** Dark theme is the default and only theme. See `Docs/reference/brand-guide.md` for color specifications.

### Database

| Technology | Purpose |
|------------|---------|
| Supabase | Hosted PostgreSQL database |
| PostgreSQL 15 | Database engine (managed by Supabase) |

### Authentication

| Technology | Purpose |
|------------|---------|
| Clerk | Authentication and user management |

### Hosting & Infrastructure

| Service | Purpose |
|---------|---------|
| DigitalOcean App Platform | Application hosting (PaaS) |
| Cloudflare | DNS, CDN, DDoS protection |
| GitHub | Version control, CI/CD trigger |

---

## Architecture Diagram

```
                              ┌─────────────────────┐
                              │     Cloudflare      │
                              │  (DNS, CDN, SSL)    │
                              └──────────┬──────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────┐
                    │     DigitalOcean App Platform      │
                    │  ┌──────────────────────────────┐  │
                    │  │      Next.js Application     │  │
                    │  │                              │  │
                    │  │  ┌────────┐    ┌─────────┐   │  │
                    │  │  │ Pages  │    │   API   │   │  │
                    │  │  │(React) │    │ Routes  │   │  │
                    │  │  └────────┘    └─────────┘   │  │
                    │  │                              │  │
                    │  │  ┌────────────────────────┐  │  │
                    │  │  │   Server Components    │  │  │
                    │  │  └────────────────────────┘  │  │
                    │  └──────────────────────────────┘  │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │    Clerk     │  │   Supabase   │  │   Pyramid    │
           │    (Auth)    │  │  (Database)  │  │(ERP) [PROD]  │
           └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Project Structure

```
polhem-mvp-demo/
├── app/                        # Next.js App Router
│   ├── layout.js               # Root layout with providers
│   ├── page.js                 # Home/redirect page
│   ├── globals.css             # Global styles (Tailwind)
│   ├── (auth)/                 # Auth route group
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── layout.js           # Dashboard layout with sidebar
│   │   ├── orders/             # Orders tab
│   │   │   └── page.js
│   │   ├── settings/           # Models/Settings tab
│   │   │   └── page.js
│   │   └── schedule/           # Production schedule tab
│   │       └── page.js
│   └── api/                    # API routes
│       ├── customers/
│       ├── products/
│       ├── orders/
│       ├── settings/
│       ├── schedule/
│       └── machines/
│
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components (sidebar, nav)
│   ├── orders/                 # Orders tab components
│   ├── settings/               # Settings tab components
│   └── schedule/               # Schedule tab components
│
├── models/                     # Business logic models (JS)
│   ├── storage-cost.js         # Storage cost calculations
│   ├── prediction-error.js     # Forecast error calculations
│   ├── schedule-generator.js   # Production schedule generation
│   └── oee-calculator.js       # OEE calculations
│
├── lib/                        # Shared utilities
│   ├── supabase/
│   │   ├── client.js           # Supabase browser client
│   │   └── server.js           # Supabase server client
│   └── utils.js                # General utilities
│
├── contexts/                   # React Context providers
│   └── settings-context.js     # Active settings state
│
├── hooks/                      # Custom React hooks
│   └── use-settings.js         # Settings hook
│
├── Docs/                       # Documentation
│   ├── prd.md                  # Product requirements
│   ├── database.md             # Database schema
│   ├── system.md               # System architecture (this file)
│   ├── models/                 # Model documentation
│   │   ├── storage-cost.md
│   │   ├── prediction-error.md
│   │   ├── schedule-generator.md
│   │   └── oee-calculator.md
│   ├── notion/                 # Original Notion exports
│   └── reference/              # Brand guide, assets
│
├── public/                     # Static assets
│
├── .env.local                  # Environment variables (local)
├── .env.example                # Environment template
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
├── jsconfig.json               # JavaScript path aliases
├── package.json                # Dependencies
└── README.md                   # Project readme
```

---

## Models Architecture

The `/models` directory contains business logic for calculations. Each model is a JavaScript module with pure functions.

### Model Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `storage-cost.js` | Calculate inventory holding costs | `calculateStorageCost()`, `calculateCapitalInterest()` |
| `prediction-error.js` | Calculate forecast accuracy | `calculatePredictionError()`, `isReliable()` |
| `schedule-generator.js` | Generate production schedules | `generateSchedule()`, `assignToMachine()` |
| `oee-calculator.js` | Calculate OEE metrics | `calculateMachineOEE()`, `calculateGlobalOEE()` |

### Model Documentation

Detailed documentation for each model is in `/Docs/models/`:

- Input parameters
- Output format
- Calculation formulas
- Statistical methods (for production)
- Example usage

> **Demo Note:** For the demo, models return simplified calculations (averages, constants). Production implementations will use proper statistical methods.

---

## Environment Variables

### Required Variables

```bash
# .env.local

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/orders
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/orders

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment File Template

A `.env.example` file should be provided with placeholder values for all required variables.

---

## DigitalOcean App Platform Configuration

### App Spec (app.yaml)

```yaml
name: polhem-mvp

services:
  - name: web
    github:
      repo: your-org/polhem-mvp-demo
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${CLERK_PUBLISHABLE_KEY}
      - key: CLERK_SECRET_KEY
        scope: RUN_TIME
        type: SECRET
      - key: NEXT_PUBLIC_SUPABASE_URL
        scope: RUN_AND_BUILD_TIME
        value: ${SUPABASE_URL}
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${SUPABASE_ANON_KEY}
```

### Deployment Flow

```
Developer pushes to main branch
         │
         ▼
GitHub webhook triggers DigitalOcean
         │
         ▼
App Platform pulls latest code
         │
         ▼
Build phase: npm run build
         │
         ▼
Deploy phase: npm start
         │
         ▼
Cloudflare routes traffic to app
```

### Scaling (Future)

For production with background tasks, use separate worker components:

```yaml
services:
  - name: web
    instance_count: 2  # Multiple web instances
    # ... web config

workers:
  - name: background-jobs
    github:
      repo: your-org/polhem-mvp-demo
      branch: main
    build_command: npm run build
    run_command: node workers/scheduler.js
    instance_count: 1
    instance_size_slug: basic-xs
```

> **Note:** App Platform manages process lifecycle automatically. For running multiple processes within a single container or on a Droplet, PM2 can be used. For this demo with App Platform, PM2 is not required.

---

## Cloudflare Configuration

### DNS Setup

| Record Type | Name | Content |
|-------------|------|---------|
| CNAME | @ | app-xxx.ondigitalocean.app |
| CNAME | www | polhem.yourdomain.com |

### Recommended Settings

| Setting | Value |
|---------|-------|
| SSL/TLS | Full (strict) |
| Always Use HTTPS | On |
| Minimum TLS | 1.2 |
| Auto Minify | JS, CSS, HTML |
| Brotli | On |

### Caching Rules

```
Cache static assets (/_next/static/*): 1 year
Cache images (/images/*): 1 month
Bypass cache for API routes (/api/*): No cache
```

---

## Authentication Flow

### Clerk Integration

```
User visits protected page
         │
         ▼
Clerk middleware checks session
         │
         ├── No session → Redirect to /sign-in
         │
         └── Valid session → Allow access
                    │
                    ▼
         Server Components can use
         auth() to get user info
```

### Protected Routes

All routes under `/(dashboard)` require authentication:
- `/orders`
- `/settings`
- `/schedule`

### Middleware Configuration

```javascript
// middleware.js
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## Supabase Integration

### Client Setup

Two clients are provided:

1. **Browser Client** (`lib/supabase/client.js`)
   - Used in Client Components
   - Uses anon key
   - Respects RLS policies

2. **Server Client** (`lib/supabase/server.js`)
   - Used in Server Components and API routes
   - Can use service role key for admin operations

### Database Access Pattern

```javascript
// Server Component
import { createServerClient } from '@/lib/supabase/server';

export default async function OrdersPage() {
  const supabase = createServerClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, products(*), customers(*)');

  return <OrdersList orders={orders} />;
}
```

```javascript
// Client Component
'use client';
import { createBrowserClient } from '@/lib/supabase/client';

function OrderForm() {
  const supabase = createBrowserClient();

  const handleSubmit = async () => {
    await supabase.from('orders').insert({...});
  };
}
```

---

## State Management

### Approach

The application uses a minimal state management approach suitable for a demo:

| State Type | Solution |
|------------|----------|
| Server data | Server Components (direct fetch) |
| Shared UI state | React Context |
| URL state (filters) | URL search params |
| Local UI state | React useState |

### Settings Context

```javascript
// contexts/settings-context.js
'use client';

import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children, initialSettings }) {
  const [activeSettings, setActiveSettings] = useState(initialSettings);

  return (
    <SettingsContext.Provider value={{ activeSettings, setActiveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
```

### URL State for Filters

```javascript
// Using Next.js useSearchParams
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

function Filters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const customerId = searchParams.get('customer');

  const setCustomer = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set('customer', id);
    router.push(`?${params.toString()}`);
  };
}
```

> **Demo Approach:** For this demo, the complexity of a state management library is unnecessary. Server Components handle most data fetching, and simple Context handles shared UI state.

> **Production Enhancement `[PRODUCTION]`:** Add Zustand for state management if the application grows in complexity. Zustand is lightweight, easy to adopt incrementally, and works well with React Server Components.

---

## API Routes

### Structure

```
/api
├── /customers
│   └── route.js          # GET (list), POST (create)
├── /customers/[id]
│   └── route.js          # GET, PUT, DELETE
├── /products
│   └── route.js          # GET, POST
├── /orders
│   └── route.js          # GET, POST
├── /settings
│   └── route.js          # GET, PUT (single row with id='main')
├── /production-blocks
│   ├── route.js          # GET (list all blocks)
│   ├── /generate
│   │   └── route.js      # POST (regenerate schedule)
│   └── /[id]
│       └── route.js      # PUT (update block - drag/drop)
├── /predicted-orders
│   └── route.js          # GET (list predicted orders)
└── /machines
    └── route.js          # GET
```

### Response Format

```javascript
// Success
{
  "data": { ... },
  "meta": { "timestamp": "2026-01-12T10:30:00Z" }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description of what went wrong"
  }
}
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

### Git Workflow

```
main (production)
  │
  └── feature/xxx (development)
         │
         └── Merge to main triggers deploy
```

---

## External Integrations (Production)

### Pyramid ERP `[PRODUCTION]`

| Aspect | Detail |
|--------|--------|
| Protocol | REST API / SOAP |
| Auth | API Key or OAuth |
| Sync | Scheduled job or webhook |
| Data | Customers, Products, Orders, Inventory |

### Rectron `[PRODUCTION]`

| Aspect | Detail |
|--------|--------|
| Protocol | MQTT / REST |
| Auth | Certificate-based |
| Sync | Real-time streaming |
| Data | Machine status, production metrics |

> **Demo Note:** These integrations are not implemented in the demo. Data is pre-populated in Supabase.

---

## Security Considerations

### Demo Security

| Aspect | Demo Approach |
|--------|---------------|
| Authentication | Clerk handles all auth |
| Authorization | No RLS (single org demo) |
| API Protection | Clerk middleware on all routes |
| Secrets | .env files, DO App Platform secrets |

### Production Security `[PRODUCTION]`

| Aspect | Production Approach |
|--------|---------------------|
| RLS | Enable Supabase Row Level Security |
| Multi-tenancy | Organization-based data isolation |
| Audit Log | Track all data modifications |
| Rate Limiting | API rate limits per user |

---

## Performance Considerations

### Next.js Optimizations

| Feature | Status |
|---------|--------|
| Server Components | Default (reduces JS bundle) |
| Static Generation | Where possible |
| Image Optimization | next/image |
| Font Optimization | next/font |

### Database Optimizations

| Feature | Status |
|---------|--------|
| Indexes | On all foreign keys and filter columns |
| Pagination | Limit/offset on list queries |
| Select Fields | Only select needed columns |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial documentation |
| 1.1 | 2026-01-12 | Claude/Leo | Fixed Next.js version to 16.1.1, added Zustand note for production |
