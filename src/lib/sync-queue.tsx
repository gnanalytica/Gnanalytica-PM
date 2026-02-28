'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

// ── Types ──

export type MutationDescriptor = {
  table: 'tickets' | 'ticket_labels' | 'comments' | 'ticket_relations' | 'ticket_assignees' | 'ticket_attachments' | 'milestones' | 'teams' | 'team_members' | 'ticket_custom_field_values' | 'comment_reactions';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
};

type SyncItem = {
  id: string;
  dedupeKey: string;
  description: string;
  descriptor: MutationDescriptor;
  error: string;
  retries: number;
  nextRetryAt: number;
  createdAt: number;
};

type SyncQueueState = {
  items: SyncItem[];
  isOnline: boolean;
  processing: boolean;
  add: (item: {
    dedupeKey: string;
    description: string;
    descriptor: MutationDescriptor;
    error: string;
  }) => void;
  remove: (id: string) => void;
  incrementRetry: (id: string) => void;
  setOnline: (online: boolean) => void;
  setProcessing: (processing: boolean) => void;
  clear: () => void;
  clearFailed: () => void;
  retryFailed: () => void;
};

export const MAX_RETRIES = 5;

function computeNextRetry(retries: number): number {
  return Date.now() + Math.min(1000 * 2 ** retries, 30_000);
}

// ── Store ──

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set) => ({
      items: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      processing: false,

      add: (item) =>
        set((state) => {
          // Dedup: replace existing item with same key
          const filtered = state.items.filter((i) => i.dedupeKey !== item.dedupeKey);
          return {
            items: [
              ...filtered,
              {
                ...item,
                id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                retries: 0,
                nextRetryAt: computeNextRetry(0),
                createdAt: Date.now(),
              },
            ],
          };
        }),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      incrementRetry: (id) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const newRetries = i.retries + 1;
            return {
              ...i,
              retries: newRetries,
              nextRetryAt: computeNextRetry(newRetries),
            };
          }),
        })),

      setOnline: (online) => set({ isOnline: online }),
      setProcessing: (processing) => set({ processing }),
      clear: () => set({ items: [] }),

      clearFailed: () =>
        set((state) => ({
          items: state.items.filter((i) => i.retries < MAX_RETRIES),
        })),

      retryFailed: () =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.retries < MAX_RETRIES) return i;
            return { ...i, retries: 0, nextRetryAt: computeNextRetry(0) };
          }),
        })),
    }),
    {
      name: 'pm-sync-queue',
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);

// ── Execute a mutation from its serializable descriptor ──

async function executeMutation(descriptor: MutationDescriptor): Promise<void> {
  const supabase = createClient();
  const { table, operation, payload } = descriptor;

  switch (operation) {
    case 'insert': {
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      break;
    }
    case 'update': {
      const { id, ...fields } = payload;
      const { error } = await supabase.from(table).update(fields).eq('id', id as string);
      if (error) throw error;
      break;
    }
    case 'delete': {
      const { id } = payload;
      const { error } = await supabase.from(table).delete().eq('id', id as string);
      if (error) throw error;
      break;
    }
  }
}

// ── Processor hook — call once in app layout ──

export function useSyncProcessor() {
  const queryClient = useQueryClient();
  const processingRef = useRef(false);

  const processQueue = useCallback(async () => {
    const state = useSyncQueueStore.getState();
    if (processingRef.current || state.items.length === 0) return;

    const now = Date.now();
    const ready = state.items.filter(
      (item) => item.retries < MAX_RETRIES && now >= item.nextRetryAt,
    );
    if (ready.length === 0) return;

    processingRef.current = true;
    state.setProcessing(true);

    const { remove, incrementRetry } = state;

    for (const item of ready) {
      try {
        await executeMutation(item.descriptor);
        remove(item.id);
        // Invalidate related queries
        const table = item.descriptor.table;
        if (table === 'tickets' || table === 'ticket_labels') {
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        } else if (table === 'comments') {
          queryClient.invalidateQueries({ queryKey: ['comments'] });
        } else if (table === 'ticket_relations') {
          queryClient.invalidateQueries({ queryKey: ['ticket-relations'] });
        } else if (table === 'ticket_assignees') {
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        } else if (table === 'ticket_attachments') {
          queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] });
        } else if (table === 'milestones') {
          queryClient.invalidateQueries({ queryKey: ['milestones'] });
        } else if (table === 'teams' || table === 'team_members') {
          queryClient.invalidateQueries({ queryKey: ['teams'] });
        } else if (table === 'ticket_custom_field_values') {
          queryClient.invalidateQueries({ queryKey: ['custom-field-values'] });
        } else if (table === 'comment_reactions') {
          queryClient.invalidateQueries({ queryKey: ['comment-reactions'] });
        }
      } catch {
        incrementRetry(item.id);
      }
    }

    processingRef.current = false;
    useSyncQueueStore.getState().setProcessing(false);
  }, [queryClient]);

  // Track online/offline + sync on reconnect
  useEffect(() => {
    const setOnline = useSyncQueueStore.getState().setOnline;
    const onOnline = () => {
      setOnline(true);
      // Re-sync: invalidate all queries so hydration hooks refetch server data
      queryClient.invalidateQueries();
      processQueue();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [processQueue, queryClient]);

  // Process on mount (pick up persisted items)
  useEffect(() => {
    const { items, isOnline } = useSyncQueueStore.getState();
    if (isOnline && items.length > 0) {
      processQueue();
    }
  }, [processQueue]);

  // Periodic retry every 5s
  useEffect(() => {
    const id = setInterval(() => {
      const { items, isOnline } = useSyncQueueStore.getState();
      if (isOnline && items.length > 0) {
        processQueue();
      }
    }, 5_000);
    return () => clearInterval(id);
  }, [processQueue]);
}

// ── Compact sync indicator ──

export function SyncStatus() {
  const items = useSyncQueueStore((s) => s.items);
  const isOnline = useSyncQueueStore((s) => s.isOnline);
  const processing = useSyncQueueStore((s) => s.processing);
  const clearFailed = useSyncQueueStore((s) => s.clearFailed);
  const retryFailed = useSyncQueueStore((s) => s.retryFailed);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const failedItems = items.filter((i) => i.retries >= MAX_RETRIES);
  const pendingItems = items.filter((i) => i.retries < MAX_RETRIES);

  if (!mounted) return null;

  // All clear — nothing to show
  if (items.length === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      {/* Offline */}
      {!isOnline && (
        <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[11px] font-medium text-yellow-700">Offline</span>
        </div>
      )}

      {/* Syncing */}
      {processing && pendingItems.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 px-2.5 py-1">
          <svg
            className="w-3 h-3 text-blue-500 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-[11px] font-medium text-blue-700">Syncing...</span>
        </div>
      )}

      {/* Pending (not processing) */}
      {!processing && pendingItems.length > 0 && isOnline && (
        <PendingPill items={pendingItems} />
      )}

      {/* Failed */}
      {failedItems.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-[11px] font-medium text-red-700">
            {failedItems.length} failed
          </span>
          <button
            onClick={retryFailed}
            className="text-[10px] font-medium text-red-600 hover:text-red-800 ml-0.5 px-1 py-0.5 rounded hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={clearFailed}
            className="text-[10px] text-red-400 hover:text-red-600 px-0.5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pending pill with countdown ──

function PendingPill({ items }: { items: SyncItem[] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nearest = Math.min(...items.map((i) => i.nextRetryAt));
  const secsLeft = Math.max(0, Math.ceil((nearest - now) / 1000));

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface-secondary border border-border-subtle px-2.5 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      <span className="text-[11px] font-medium text-gray-600">
        {items.length} pending
        {secsLeft > 0 && <span className="text-gray-400 ml-0.5">({secsLeft}s)</span>}
      </span>
    </div>
  );
}
