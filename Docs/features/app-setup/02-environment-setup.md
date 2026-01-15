# 02 - Environment Setup

## Purpose

Configure environment variables and install required npm dependencies for the application.

---

## Prerequisites

- `01-critical-fixes.md` completed
- Supabase project created (get URL and keys from dashboard)
- Clerk application created (get keys from dashboard)

---

## Files to Create/Edit

- `.env.local` (create)
- `.env.example` (create)
- `package.json` (verify/update)

---

## Implementation

### Step 1: Create `.env.local`

Create a new file `.env.local` in the project root with the following content:

```bash
# ===========================================
# Polhem MVP - Environment Variables
# ===========================================

# Clerk Authentication
# Get these from: https://dashboard.clerk.com → Your App → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
# Get these from: https://supabase.com/dashboard → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Important:** Replace the placeholder values with your actual keys:

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys → Secret keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SECRET` | Supabase Dashboard → Settings → API → service_role secret |

---

### Step 2: Create `.env.example`

Create a template file `.env.example` for other developers:

```bash
# ===========================================
# Polhem MVP - Environment Variables Template
# ===========================================
# Copy this file to .env.local and fill in your values

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET=eyJxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

### Step 3: Install Required Dependencies

Run the following command to install all required dependencies:

```bash
npm install uuid dotenv bottleneck @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities tailwindcss-animate
```

**Note:** `uuid`, `dotenv`, and `bottleneck` are required by `Modules/supabase.js`.

---

### Step 4: Verify package.json

Ensure your `package.json` has all required dependencies. The following should be present:

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "@dnd-kit/utilities": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "bottleneck": "^2.x",
    "dotenv": "^16.x",
    "uuid": "^9.x",
    "next": "^16.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "sonner": "^1.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "class-variance-authority": "^0.x",
    "tailwindcss-animate": "^1.x"
  }
}
```

If any are missing, install them:

```bash
npm install uuid dotenv bottleneck @clerk/nextjs @supabase/supabase-js sonner lucide-react clsx tailwind-merge class-variance-authority tailwindcss-animate
```

---

### Step 5: Add to .gitignore

Ensure `.env.local` is in your `.gitignore` file:

```bash
# Check if .env.local is in .gitignore
grep -q ".env.local" .gitignore || echo ".env.local" >> .gitignore
```

Or manually add this line to `.gitignore`:

```
.env.local
```

---

## Environment Variables Reference

### Public Variables (exposed to browser)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side authentication |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Redirect URL for sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Redirect URL for sign-up |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after successful sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after successful sign-up |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

### Secret Variables (server-side only)

| Variable | Purpose |
|----------|---------|
| `CLERK_SECRET_KEY` | Clerk server-side authentication |
| `SUPABASE_SECRET` | Supabase service role key (bypasses RLS) |

---

## Verification

1. **Check `.env.local` exists:**
   ```bash
   ls -la .env.local
   ```

2. **Verify dependencies installed:**
   ```bash
   npm list @dnd-kit/core @clerk/nextjs @supabase/supabase-js
   ```

3. **Test that Next.js can read environment variables:**
   ```bash
   npm run dev
   ```
   
   Open `http://localhost:3000` - if no errors about missing environment variables, setup is correct.

4. **Check .gitignore:**
   ```bash
   grep ".env.local" .gitignore
   ```
   Should output: `.env.local`

---

## Troubleshooting

### "Missing Supabase environment variables" error

- Ensure `.env.local` file is in the project root (same level as `package.json`)
- Restart the dev server after creating/modifying `.env.local`
- Check for typos in variable names

### Clerk redirect issues

- Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL` matches your actual sign-in route
- Verify Clerk dashboard has the correct URLs configured

---

## Next Step

Proceed to `03-database-setup.md` to set up the database tables.
