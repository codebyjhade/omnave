'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronRight, Globe, HardDrive, HelpCircle, ShieldCheck, LogOut, Trash2, UserRound, LoaderCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useUserContext } from '@/context/UserContext';
import { clearOfflineStudyData } from '@/lib/offlineStorage';
import { Skeleton } from '@/components/Skeleton';

type BusyAction = 'signout' | 'clear-cache' | 'delete-account' | null;

export default function SettingsPage() {
  const { toast } = useToast();
  const { loading, user } = useUserContext();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const signOut = async () => {
    if (busy) return;
    setBusy('signout');
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      toast('Unable to sign out. Please try again.', 'error');
      setBusy(null);
    }
  };

  const clearDownloads = async () => {
    if (busy) return;
    setBusy('clear-cache');
    try {
      await clearOfflineStudyData();
      toast('Offline study kits removed from this device.', 'success');
    } catch (error) {
      console.error('Offline data cleanup failed:', error);
      toast('Unable to clear offline study kits.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    if (busy || deleteConfirmation !== 'DELETE') return;
    setBusy('delete-account');
    try {
      const response = await fetch('/api/account', { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || payload?.error || 'Account deletion failed');
      }
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      await clearOfflineStudyData();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast(error instanceof Error ? error.message : 'Unable to delete account.', 'error');
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="w-full max-w-xl mx-auto flex flex-col gap-5 pt-4" aria-hidden="true">
      {[1, 2, 3].map((section) => <div key={section} className="space-y-2"><Skeleton className="h-3 w-28 ml-2" /><Skeleton className="h-36 w-full rounded-[20px]" /></div>)}
    </div>;
  }

  const rowClass = 'min-h-[72px] w-full flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-100 last:border-none text-left';
  const iconClass = 'w-10 h-10 rounded-xl bg-[#6949a8]/10 text-[#6949a8] flex items-center justify-center shrink-0';

  return (
    <div className="w-full flex-1 flex flex-col pt-2 max-w-xl mx-auto px-2 sm:px-4 pb-12 text-gray-900">
      <section aria-labelledby="account-settings-heading">
        <h2 id="account-settings-heading" className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase font-poppins ml-2 mb-2 mt-6">Account</h2>
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          <div className={rowClass}>
            <div className="flex items-center min-w-0"><span className={iconClass}><UserRound size={20} /></span><span className="ml-4 min-w-0"><span className="block text-[14px] font-semibold text-gray-900">Signed in account</span><span className="block text-[12px] text-gray-500 truncate">{user?.email || 'Omnave learner'}</span></span></div>
          </div>
          <div className={rowClass}>
            <div className="flex items-center"><span className={iconClass}><Globe size={20} /></span><span className="ml-4"><span className="block text-[14px] font-semibold text-gray-900">Language</span><span className="block text-[12px] text-gray-500">English (US)</span></span></div>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Current</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="device-settings-heading">
        <h2 id="device-settings-heading" className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase font-poppins ml-2 mb-2 mt-6">This device</h2>
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={clearDownloads} disabled={Boolean(busy)} className={`${rowClass} hover:bg-gray-50 cursor-pointer disabled:opacity-60 border-x-0 border-t-0`}>
            <div className="flex items-center"><span className={iconClass}>{busy === 'clear-cache' ? <LoaderCircle size={20} className="animate-spin" /> : <HardDrive size={20} />}</span><span className="ml-4"><span className="block text-[14px] font-semibold text-gray-900">Clear offline study kits</span><span className="block text-[12px] text-gray-500">Removes downloaded content from this device only</span></span></div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </section>

      <section aria-labelledby="support-settings-heading">
        <h2 id="support-settings-heading" className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase font-poppins ml-2 mb-2 mt-6">Support and legal</h2>
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          <Link href="/support" className={`${rowClass} hover:bg-gray-50`}><span className="flex items-center"><span className={iconClass}><HelpCircle size={20} /></span><span className="ml-4 text-[14px] font-semibold text-gray-900">Help and support</span></span><ChevronRight size={18} className="text-gray-400" /></Link>
          <Link href="/privacy" className={`${rowClass} hover:bg-gray-50`}><span className="flex items-center"><span className={iconClass}><ShieldCheck size={20} /></span><span className="ml-4 text-[14px] font-semibold text-gray-900">Privacy policy</span></span><ChevronRight size={18} className="text-gray-400" /></Link>
          <Link href="/terms" className={`${rowClass} hover:bg-gray-50`}><span className="flex items-center"><span className={iconClass}><ShieldCheck size={20} /></span><span className="ml-4 text-[14px] font-semibold text-gray-900">Terms of use</span></span><ChevronRight size={18} className="text-gray-400" /></Link>
        </div>
      </section>

      <section aria-labelledby="session-settings-heading">
        <h2 id="session-settings-heading" className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase font-poppins ml-2 mb-2 mt-6">Session and data</h2>
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={signOut} disabled={Boolean(busy)} className={`${rowClass} hover:bg-gray-50 cursor-pointer disabled:opacity-60 border-x-0 border-t-0`}><span className="flex items-center"><span className={iconClass}>{busy === 'signout' ? <LoaderCircle size={20} className="animate-spin" /> : <LogOut size={20} />}</span><span className="ml-4 text-[14px] font-semibold text-gray-900">Sign out</span></span><ChevronRight size={18} className="text-gray-400" /></button>
          <button onClick={() => setDeleteOpen(true)} disabled={Boolean(busy)} className={`${rowClass} hover:bg-red-50 cursor-pointer disabled:opacity-60 border-x-0 border-t-0`}><span className="flex items-center"><span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={20} /></span><span className="ml-4"><span className="block text-[14px] font-semibold text-red-600">Delete account</span><span className="block text-[12px] text-gray-500">Permanently removes your account and study data</span></span></span><ChevronRight size={18} className="text-red-400" /></button>
        </div>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDeleteOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4"><Trash2 size={22} /></div>
            <h2 id="delete-account-title" className="text-xl font-bold text-gray-900">Delete your Omnave account?</h2>
            <p className="text-sm leading-6 text-gray-600 mt-2">This permanently removes your profile, study kits, generated content, quiz history, usage records, and stored files. This action cannot be undone.</p>
            <label className="block mt-5 text-xs font-semibold text-gray-700" htmlFor="delete-confirmation">Type DELETE to confirm</label>
            <input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} disabled={busy === 'delete-account'} autoComplete="off" className="mt-2 w-full min-h-11 rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-[#6949a8]" />
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => { setDeleteOpen(false); setDeleteConfirmation(''); }} disabled={Boolean(busy)} className="min-h-11 px-5 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold border-none cursor-pointer disabled:opacity-50">Cancel</button>
              <button onClick={deleteAccount} disabled={deleteConfirmation !== 'DELETE' || Boolean(busy)} className="min-h-11 px-5 rounded-full bg-red-600 text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">{busy === 'delete-account' && <LoaderCircle size={16} className="animate-spin" />}Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
