'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Header({ title }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-black/95 px-6 backdrop-blur">
      <h1 className="text-xl font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 bg-zinc-900 pl-10 text-sm border-zinc-800"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-zinc-400" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#E25822]" />
        </Button>

        {/* User */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  );
}
