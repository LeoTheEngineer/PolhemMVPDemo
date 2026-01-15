'use client';

import { useClerk } from '@clerk/nextjs';

export default function UnauthorizedPage() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/sign-in' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="mx-auto max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mb-4 text-5xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold text-white">Access Denied</h1>
        <p className="mb-6 text-zinc-400">
          You are not part of the developer team and do not have access to this
          application.
        </p>
        <p className="mb-6 text-sm text-zinc-500">
          If you believe this is an error, please contact the administrator.
        </p>
        <button
          onClick={handleSignOut}
          className="rounded-md bg-[#E25822] px-4 py-2 text-white transition-colors hover:bg-[#E25822]/80"
        >
          Sign out and try another account
        </button>
      </div>
    </div>
  );
}
