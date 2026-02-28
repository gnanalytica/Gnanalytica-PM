'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { TicketWatcher } from '@/types';

const supabase = createClient();

export function useWatchers(ticketId: string) {
  return useQuery({
    queryKey: ['watchers', ticketId],
    queryFn: async (): Promise<TicketWatcher[]> => {
      const { data, error } = await supabase
        .from('ticket_watchers')
        .select('*')
        .eq('ticket_id', ticketId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ticketId,
  });
}

export function useIsWatching(ticketId: string, userId: string | undefined) {
  const { data: watchers } = useWatchers(ticketId);
  if (!userId || !watchers) return false;
  return watchers.some((w) => w.user_id === userId);
}

export function useToggleWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      userId,
      watching,
    }: {
      ticketId: string;
      userId: string;
      watching: boolean;
    }) => {
      if (watching) {
        const { error } = await supabase
          .from('ticket_watchers')
          .delete()
          .eq('ticket_id', ticketId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ticket_watchers')
          .upsert({ ticket_id: ticketId, user_id: userId }, { onConflict: 'ticket_id,user_id' });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchers', variables.ticketId] });
    },
  });
}

/**
 * Upsert a watcher row. Used for auto-watch on create/assign/comment.
 * Safe to call even if already watching.
 */
export async function ensureWatching(ticketId: string, userId: string) {
  await supabase
    .from('ticket_watchers')
    .upsert({ ticket_id: ticketId, user_id: userId }, { onConflict: 'ticket_id,user_id' });
}

/**
 * Send a notification to all watchers of a ticket (except the actor and
 * any explicitly excluded user IDs). Used when ticket fields change
 * (status, priority, assignment, etc.).
 */
export async function notifyWatchers(
  ticketId: string,
  type: string,
  actorId: string,
  excludeIds?: string[],
) {
  const { data: watchers } = await supabase
    .from('ticket_watchers')
    .select('user_id')
    .eq('ticket_id', ticketId);

  if (!watchers || watchers.length === 0) return;

  const excludeSet = new Set([actorId, ...(excludeIds ?? [])]);
  const notifications = watchers
    .filter((w) => !excludeSet.has(w.user_id))
    .map((w) => ({
      user_id: w.user_id,
      ticket_id: ticketId,
      type,
      actor_id: actorId,
    }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}
