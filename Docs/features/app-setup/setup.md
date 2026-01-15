# Polhem MVP - Manual Setup

Complete these steps before running the instruction files.

---

## 1. Install Dependencies

```bash
npm install uuid dotenv bottleneck @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities tailwindcss-animate
```

---

## 2. Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase (from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET=eyJ...your_service_role_key...

# Clerk (from: https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Where to Get |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SECRET` | Supabase → Settings → API → service_role (secret) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk → API Keys → Secret key |

---

## 3. Database Setup

Run in Supabase SQL Editor (in order):

1. `sql/drop-tables.sql` (if resetting)
2. `sql/create-tables.sql`
3. `sql/functions.sql`
4. `sql/seed-data.sql`

---

## 4. Delete Duplicate Files

```bash
rm lib/db.js
```

---

## Done

Now proceed with `01-critical-fixes.md` and follow files in order.
