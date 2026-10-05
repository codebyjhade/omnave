'use client';

import localforage from 'localforage';

export interface QuizProgressMutation {
  mutationId: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  xpAwarded: number;
  timezone: string;
  createdAt: string;
}

interface QueuedMutation extends QuizProgressMutation {
  attempts: number;
  conflict?: string;
}

const queue = localforage.createInstance({ name: 'omnave', storeName: 'progress_mutations' });
const SYNC_EVENT = 'omnave:progress-sync';

export interface ProgressSyncSummary {
  pending: number;
  conflicts: number;
}

async function announceSyncState() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: await getProgressSyncSummary() }));
}

export async function getProgressSyncSummary(): Promise<ProgressSyncSummary> {
  const keys = await queue.keys();
  let conflicts = 0;
  for (const key of keys) {
    const mutation = await queue.getItem<QueuedMutation>(key);
    if (mutation?.conflict) conflicts += 1;
  }
  return { pending: keys.length, conflicts };
}

export const PROGRESS_SYNC_EVENT = SYNC_EVENT;

async function send(mutation: QuizProgressMutation) {
  const response = await fetch('/api/progress/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mutation),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'Unable to sync progress') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return result;
}

export async function submitQuizProgress(mutation: QuizProgressMutation) {
  await queue.setItem<QueuedMutation>(mutation.mutationId, { ...mutation, attempts: 0 });
  await announceSyncState();
  try {
    const result = await send(mutation);
    await queue.removeItem(mutation.mutationId);
    await announceSyncState();
    return result;
  } catch (error) {
    const typed = error as Error & { status?: number };
    const current = await queue.getItem<QueuedMutation>(mutation.mutationId);
    await queue.setItem(mutation.mutationId, {
      ...(current || { ...mutation, attempts: 0 }),
      attempts: (current?.attempts || 0) + 1,
      conflict: typed.status === 409 ? typed.message : undefined,
    });
    await announceSyncState();
    if (typed.status === 409 || (typeof navigator !== 'undefined' && navigator.onLine)) throw error;
    return { queued: true };
  }
}

export async function replayQuizProgressQueue() {
  if (typeof navigator === 'undefined' || !navigator.onLine) return;
  const keys = await queue.keys();
  for (const key of keys) {
    const mutation = await queue.getItem<QueuedMutation>(key);
    if (!mutation || mutation.conflict) continue;
    try {
      await send(mutation);
      await queue.removeItem(key);
      await announceSyncState();
    } catch (error) {
      const typed = error as Error & { status?: number };
      await queue.setItem(key, {
        ...mutation,
        attempts: mutation.attempts + 1,
        conflict: typed.status === 409 ? typed.message : undefined,
      });
      await announceSyncState();
      if (!typed.status) break;
    }
  }
}
