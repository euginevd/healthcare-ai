'use client';

import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 p-8 sm:p-16 font-sans bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="self-end">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton>
            <button className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
              Sign in
            </button>
          </SignInButton>
        )}
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Healthcare AI</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Turn raw consultation notes into a record summary, actionable next steps,
          and a patient-friendly email — drafted live as you watch.
        </p>
      </div>

      <Link
        href="/consult/new"
        className="px-6 py-3 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium shadow-md hover:opacity-90 transition"
      >
        Start a new consultation
      </Link>
    </main>
  );
}
