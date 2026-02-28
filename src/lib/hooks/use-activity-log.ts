'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { ActivityLog } from '@/types';

const supabase = createClient();

// ── Types ──

type ActivityEntry = {
  ticket_id: string;
  user_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
};

type TicketSnapshot = {
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  label_ids?: string[];
};

// ── Core logging helper ──

/**
 * Insert one or more activity_log rows in a single round-trip.
 * Accepts userId directly — callers in mutations already have it,
 * so we avoid redundant auth.getUser() calls.
 */
export async function logActivities(entries: ActivityEntry[]) {
  if (entries.length === 0) return;
  await supabase.from('activity_log').insert(entries);
}

// ── Legacy helper (used by use-comments.ts) ──

/**
 * Single-entry convenience wrapper that resolves userId from the session.
 * Prefer `logTicketChanges` or `logActivities` inside mutations where
 * the userId is already available.
 */
export async function logActivity(
  ticket_id: string,
  action: string,
  field?: string,
  old_value?: string | null,
  new_value?: string | null,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await logActivities([{
    ticket_id,
    user_id: user.id,
    action,
    field: field ?? null,
    old_value: old_value ?? null,
    new_value: new_value ?? null,
  }]);
}

// ── Diff-based mutation wrapper ──

/**
 * Compare old and new ticket snapshots, batch-insert activity_log entries
 * for every detected change. Supports: created, status_changed, assigned,
 * label_changed.
 *
 * Usage inside a mutationFn:
 *   await logTicketChanges(id, userId, 'updated', oldSnap, newSnap);
 */
export async function logTicketChanges(
  ticketId: string,
  userId: string,
  action: 'created' | 'updated',
  oldState: TicketSnapshot,
  newState: TicketSnapshot,
) {
  const entries: ActivityEntry[] = [];
  const base = { ticket_id: ticketId, user_id: userId };

  if (action === 'created') {
    entries.push({
      ...base,
      action: 'ticket_created',
      field: null,
      old_value: null,
      new_value: null,
    });
  }

  // Status change
  if (newState.status !== undefined && newState.status !== oldState.status) {
    entries.push({
      ...base,
      action: 'status_changed',
      field: 'status',
      old_value: oldState.status ?? null,
      new_value: newState.status,
    });
  }

  // Assignee change
  if (newState.assignee_id !== undefined && newState.assignee_id !== oldState.assignee_id) {
    entries.push({
      ...base,
      action: 'assignee_changed',
      field: 'assignee_id',
      old_value: oldState.assignee_id ?? null,
      new_value: newState.assignee_id ?? null,
    });
  }

  // Label change
  if (newState.label_ids !== undefined) {
    const oldSet = new Set(oldState.label_ids ?? []);
    const newSet = new Set(newState.label_ids);
    const added = newState.label_ids.filter((id) => !oldSet.has(id));
    const removed = (oldState.label_ids ?? []).filter((id) => !newSet.has(id));

    if (added.length > 0 || removed.length > 0) {
      entries.push({
        ...base,
        action: 'label_changed',
        field: 'labels',
        old_value: (oldState.label_ids ?? []).join(',') || null,
        new_value: newState.label_ids.join(',') || null,
      });
    }
  }

  await logActivities(entries);
}

// ── Snapshot helper ──

/**
 * Fetch old ticket state (status, assignee_id, label_ids) in a single
 * parallel fetch. Used by useUpdateTicket before applying changes.
 */
export async function fetchTicketSnapshot(
  ticketId: string,
): Promise<TicketSnapshot> {
  const [{ data: ticket }, { data: labels }] = await Promise.all([
    supabase
      .from('tickets')
      .select('status, priority, assignee_id')
      .eq('id', ticketId)
      .single(),
    supabase
      .from('ticket_labels')
      .select('label_id')
      .eq('ticket_id', ticketId),
  ]);

  return {
    status: ticket?.status ?? undefined,
    priority: ticket?.priority ?? undefined,
    assignee_id: ticket?.assignee_id ?? null,
    label_ids: labels?.map((l: { label_id: string }) => l.label_id) ?? [],
  };
}

// ── React Query hooks (unchanged) ──

export function useActivityLog(ticketId: string) {
  return useQuery({
    queryKey: ['activity-log', ticketId],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, user:profiles(*)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useInvalidateActivityLog() {
  const queryClient = useQueryClient();
  return (ticketId: string) => {
    queryClient.invalidateQueries({ queryKey: ['activity-log', ticketId] });
  };
}
