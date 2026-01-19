import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import RegenerationBanner from '@/components/shared/RegenerationBanner';
import { Toaster } from 'sonner';
import { createServerClient } from '@/lib/supabase';

// Allowed emails for the developer team
const ALLOWED_EMAILS = [
  'leomcmillion@gmail.com',
  'vincent@lefevre.se',
];

async function getSettings() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('settings')
    .select('needs_regeneration')
    .eq('id', 'main')
    .single();
  return data;
}

export default async function DashboardLayout({ children }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Verify user email is in allowed list
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  
  if (!userEmail || !ALLOWED_EMAILS.some(email => email.toLowerCase() === userEmail)) {
    redirect('/unauthorized');
  }

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <RegenerationBanner needsRegeneration={settings?.needs_regeneration} />
      
      {/* Main content area */}
      <main className="ml-64 min-h-screen p-6">
        {children}
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
