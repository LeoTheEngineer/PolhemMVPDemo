# 08 - Layout Components

## Purpose

Create the main layout components: Sidebar navigation, Header with user menu, and the Dashboard layout wrapper that provides the authenticated shell for all pages.

---

## Prerequisites

- `07-business-models.md` completed
- Clerk authentication configured

---

## Files to Create

```
components/
└── layout/
    ├── Sidebar.js
    └── Header.js

app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.js
│   └── sign-up/[[...sign-up]]/page.js
├── (dashboard)/
│   └── layout.js
├── layout.js (update)
├── page.js (update)
└── middleware.js (create in root)
```

---

## Implementation

### Step 1: Create `components/layout/Sidebar.js`

```javascript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Settings,
  Factory
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ClipboardList,
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-zinc-900 border-r border-zinc-800 p-4 z-40">
      {/* Logo area */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <Factory className="w-6 h-6 text-accent" />
        <span className="text-lg font-bold text-white">Polhem</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-4 py-3 bg-zinc-800/50 rounded-lg">
          <p className="text-xs text-zinc-500">
            Production Planning Demo
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
```

---

### Step 2: Create `components/layout/Header.js`

```javascript
'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - can add breadcrumbs or page title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">
            Polhem MVP
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications placeholder */}
          <button 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
```

---

### Step 3: Create Dashboard Layout `app/(dashboard)/layout.js`

```javascript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from 'sonner';

export default async function DashboardLayout({ children }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Sidebar />
      
      {/* Main content area */}
      <main className="ml-60 mt-16 min-h-[calc(100vh-4rem)]">
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fafafa',
          },
        }}
      />
    </div>
  );
}
```

---

### Step 4: Create Auth Pages

#### Create `app/(auth)/sign-in/[[...sign-in]]/page.js`

```javascript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-zinc-900 border border-zinc-800 shadow-xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-zinc-400',
            socialButtonsBlockButton: 
              'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
            socialButtonsBlockButtonText: 'text-white',
            dividerLine: 'bg-zinc-700',
            dividerText: 'text-zinc-500',
            formFieldLabel: 'text-zinc-400',
            formFieldInput: 
              'bg-zinc-800 border-zinc-700 text-white focus:border-accent focus:ring-accent',
            footerActionLink: 'text-accent hover:text-accent/80',
            formButtonPrimary: 
              'bg-accent hover:bg-accent/80 text-white',
            identityPreviewText: 'text-white',
            identityPreviewEditButton: 'text-accent',
          },
        }}
      />
    </div>
  );
}
```

#### Create `app/(auth)/sign-up/[[...sign-up]]/page.js`

```javascript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-zinc-900 border border-zinc-800 shadow-xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-zinc-400',
            socialButtonsBlockButton: 
              'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
            socialButtonsBlockButtonText: 'text-white',
            dividerLine: 'bg-zinc-700',
            dividerText: 'text-zinc-500',
            formFieldLabel: 'text-zinc-400',
            formFieldInput: 
              'bg-zinc-800 border-zinc-700 text-white focus:border-accent focus:ring-accent',
            footerActionLink: 'text-accent hover:text-accent/80',
            formButtonPrimary: 
              'bg-accent hover:bg-accent/80 text-white',
          },
        }}
      />
    </div>
  );
}
```

---

### Step 5: Update Root Layout `app/layout.js`

```javascript
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Polhem MVP - Production Planning',
  description: 'Production planning and scheduling for injection molding',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

### Step 6: Update Landing Page `app/page.js`

```javascript
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Factory, ArrowRight } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Factory className="w-12 h-12 text-accent" />
          <h1 className="text-4xl font-bold text-white">
            Polhem
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-zinc-400 mb-8 text-lg">
          Production planning and scheduling system for injection molding operations
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors font-medium"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium border border-zinc-700"
          >
            Create Account
          </Link>
        </div>

        {/* Demo note */}
        <p className="mt-8 text-sm text-zinc-600">
          Demo version for evaluation purposes
        </p>
      </div>
    </div>
  );
}
```

---

### Step 7: Create Middleware `middleware.js` (in project root)

```javascript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/orders(.*)',
  '/schedule(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

---

### Step 8: Update `tailwind.config.js`

Ensure the accent color is configured:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#E25822',
          foreground: '#FFFFFF',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## Folder Structure Commands

```bash
# Create component directories
mkdir -p components/layout

# Create auth page directories
mkdir -p "app/(auth)/sign-in/[[...sign-in]]"
mkdir -p "app/(auth)/sign-up/[[...sign-up]]"

# Create dashboard directory
mkdir -p "app/(dashboard)"
```

---

## Verification

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the landing page:**
   - Open `http://localhost:3000`
   - Should see the Polhem landing page with Sign In / Create Account buttons
   - If already signed in, should redirect to `/dashboard`

3. **Test authentication:**
   - Click Sign In → should see Clerk sign-in form
   - Sign in with test credentials
   - Should redirect to `/dashboard` (will show 404 until we create dashboard page)

4. **Test protected routes:**
   - Sign out
   - Try to access `http://localhost:3000/dashboard`
   - Should redirect to sign-in

5. **Verify layout:**
   - When signed in, sidebar and header should be visible
   - Navigation links should highlight based on current route

---

## Next Step

Proceed to `09-shared-components.md` to create reusable UI components.
