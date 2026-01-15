import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-2">
          Polhem <span className="text-[#E25822]">MVP</span>
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md text-lg">
          Production planning and scheduling system for injection molding operations
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="px-8 py-3 bg-[#E25822] text-white rounded-lg hover:bg-[#E25822]/80 transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
