'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Settings,
  Factory,
  Package,
  Users,
  Boxes,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const secondaryNav = [
  { name: 'Products', href: '/settings?tab=products', icon: Package },
  { name: 'Machines', href: '/settings?tab=machines', icon: Factory },
  { name: 'Materials', href: '/settings?tab=materials', icon: Boxes },
  { name: 'Customers', href: '/settings?tab=customers', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-black">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <span className="text-xl font-bold text-white">Polhem</span>
          <span className="ml-2 rounded bg-[#E25822] px-2 py-0.5 text-xs font-medium text-white">
            MVP
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="mb-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Main
            </p>
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="mb-4 mt-8">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Data Management
            </p>
          </div>
          {secondaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">Demo Version 1.0</p>
        </div>
      </div>
    </aside>
  );
}
