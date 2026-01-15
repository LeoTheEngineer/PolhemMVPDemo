import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-zinc-900 border-zinc-800',
            headerTitle: 'text-white',
            headerSubtitle: 'text-zinc-400',
            socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
            formFieldLabel: 'text-zinc-400',
            formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
            footerActionLink: 'text-[#E25822] hover:text-[#E25822]/80',
            formButtonPrimary: 'bg-[#E25822] hover:bg-[#E25822]/80',
          },
        }}
      />
    </div>
  );
}
