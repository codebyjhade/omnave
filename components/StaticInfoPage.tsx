'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function StaticInfoPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-white px-5 py-8 text-gray-900">
      <article className="mx-auto max-w-2xl">
        <button onClick={() => window.history.length > 1 ? router.back() : router.push('/settings')} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-semibold text-gray-800 border-none cursor-pointer"><ArrowLeft size={16} />Back to settings</button>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs font-medium text-gray-500">Last updated {updated}</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-gray-700 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
