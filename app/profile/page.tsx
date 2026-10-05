'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronRight, FileText, Gauge, Settings, Sparkles, Target, Zap } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { Skeleton } from '@/components/Skeleton';
import UpgradeModal from '@/components/UpgradeModal';
import type { UsageSummary } from '@/types/usage';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { user, bestScore, loading, lessons, quizScores } = useUserContext();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgrade') === '1') setShowUpgrade(true);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch('/api/usage/summary', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<UsageSummary> : null)
      .then((summary) => { if (active && summary) setUsage(summary); })
      .catch((error) => console.error('Profile usage request failed:', error));
    return () => { active = false; };
  }, [user]);

  const name = useMemo(() => {
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    if (metaName) return String(metaName);
    const local = user?.email?.split('@')[0] || 'Learner';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [user]);

  const flashcardCount = useMemo(() => lessons.reduce((total, lesson) => total + (Array.isArray(lesson.flashcards) ? lesson.flashcards.length : 0), 0), [lessons]);
  const joined = useMemo(() => user?.created_at ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.created_at)) : null, [user?.created_at]);

  if (loading) return <div className="w-full space-y-5" aria-hidden="true"><Skeleton className="h-32 rounded-[24px]" /><Skeleton className="h-28 rounded-[24px]" /><Skeleton className="h-52 rounded-[24px]" /></div>;

  const plan = usage?.planType || (user?.plan_type === 'pro' ? 'pro' : 'free');
  const usageItems = usage ? [
    { label: 'Study kits', value: `${usage.generation.remaining}/${usage.generation.limit}`, hint: 'remaining this month' },
    { label: 'PDF pages', value: `${usage.pages.remaining}/${usage.pages.limit}`, hint: 'remaining this week' },
    { label: 'Tutor chat', value: `${usage.chatMessages.remaining}/${usage.chatMessages.limit}`, hint: 'remaining today' },
  ] : [];

  return (
    <div className="w-full flex-1 flex flex-col gap-6">
      <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#6949a8] text-white text-2xl font-bold flex items-center justify-center shrink-0">{name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-[22px] font-bold text-gray-900 truncate">{name}</h1><span className="rounded-full bg-[#6949a8]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#6949a8]">{plan} plan</span></div>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {joined && <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><Calendar size={14} />Member since {joined}</p>}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3" aria-label="Learning totals">
        {[{ icon: FileText, value: lessons.length, label: 'Study kits' }, { icon: Zap, value: flashcardCount, label: 'Flashcards' }, { icon: Target, value: quizScores.length, label: 'Quiz attempts' }].map((item) => <div key={item.label} className="rounded-[18px] border border-gray-100 bg-white p-4 text-center shadow-sm"><item.icon size={19} className="mx-auto text-[#6949a8]" /><strong className="mt-2 block text-2xl text-gray-900">{item.value}</strong><span className="text-[10px] font-semibold text-gray-500">{item.label}</span></div>)}
      </section>

      <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current usage</p><h2 className="mt-1 text-lg font-bold text-gray-900">Your {plan} plan</h2></div><Gauge size={22} className="text-[#6949a8]" /></div>
        {usage ? <div className="mt-5 grid sm:grid-cols-3 gap-3">{usageItems.map((item) => <div key={item.label} className="rounded-[15px] bg-gray-50 p-3"><span className="text-[11px] font-semibold text-gray-500">{item.label}</span><strong className="block text-xl text-gray-900">{item.value}</strong><span className="text-[10px] text-gray-500">{item.hint}</span></div>)}</div> : <p className="mt-4 text-sm text-gray-500">Usage information is temporarily unavailable.</p>}
        {bestScore > 0 && <p className="mt-4 text-xs font-semibold text-gray-600">Best quiz score: <span className="text-[#6949a8]">{bestScore}%</span></p>}
      </section>

      <section className="rounded-[24px] bg-[#6949a8] p-6 text-white shadow-[0_14px_28px_rgba(105,73,168,0.22)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Omnave Pro</p><h2 className="mt-1 text-xl font-bold">More room for serious study</h2><p className="mt-1 text-xs leading-5 text-white/80">100 kits monthly, 2,000 pages weekly, 200 tutor messages daily, and larger PDFs.</p></div>
        <button onClick={() => setShowUpgrade(true)} className="min-h-11 shrink-0 rounded-full bg-white px-5 text-sm font-bold text-[#6949a8] border-none cursor-pointer flex items-center justify-center gap-2"><Sparkles size={16} />View plans</button>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
        <Link href="/settings" className="min-h-[64px] flex items-center justify-between px-4 border-b border-gray-100"><span className="flex items-center gap-3 text-sm font-semibold text-gray-800"><Settings size={19} className="text-[#6949a8]" />Account and settings</span><ChevronRight size={18} className="text-gray-400" /></Link>
        <Link href="/support" className="min-h-[64px] flex items-center justify-between px-4"><span className="text-sm font-semibold text-gray-800">Help and support</span><ChevronRight size={18} className="text-gray-400" /></Link>
      </section>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
