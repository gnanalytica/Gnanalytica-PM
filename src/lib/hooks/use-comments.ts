'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { logActivity } from '@/lib/hooks/use-activity-log';
import { parseMentions } from '@/lib/mentions';
import { ensureWatching } from '@/lib/hooks/use-watchers';
import { toast } from '@/lib/hooks/use-toast';
import type { Comment, Profile } from '@/types';

const supabase = createClient();

/**
 * Build a threaded tree from a flat list of comments.
 * Returns only root-level comments; replies are nested in `.replies`.
 */
function buildThreads(flat: Comment[]): Comment[] {
  const byId = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] });
  }

  byId.forEach((c) => {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
}

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(*)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return buildThreads(data ?? []);
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['comments'],
    mutationFn: async ({
      ticket_id,
      body,
      parent_id,
      members,
      assignee_id,
    }: {
      ticket_id: string;
      body: string;
      parent_id?: string | null;
      members?: Profile[];
      assignee_id?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const insertPayload: { ticket_id: string; body: string; user_id: string; parent_id?: string } = {
        ticket_id,
        body,
        user_id: user.id,
      };
      if (parent_id) insertPayload.parent_id = parent_id;

      const { data, error } = await supabase
        .from('comments')
        .insert(insertPayload)
        .select('*, user:profiles(*)')
        .single();
      if (error) throw error;

      // Auto-watch the commenter
      await ensureWatching(ticket_id, user.id);

      // Generate notifications
      if (members && members.length > 0) {
        const mentionedIds = parseMentions(body, members);
        const notifySet = new Set<string>();

        // Fetch watchers
        const { data: watchers } = await supabase
          .from('ticket_watchers')
          .select('user_id')
          .eq('ticket_id', ticket_id);

        // Mentioned users → 'mentioned' notifications
        const notifications: {
          user_id: string;
          ticket_id: string;
          type: string;
          actor_id: string;
        }[] = [];

        for (const uid of mentionedIds) {
          if (uid !== user.id) {
            notifySet.add(uid);
            notifications.push({
              user_id: uid,
              ticket_id,
              type: 'mentioned',
              actor_id: user.id,
            });
          }
        }

        // Watchers + assignee → 'comment_added' notifications (deduped)
        const watcherIds = (watchers ?? []).map((w: { user_id: string }) => w.user_id);
        if (assignee_id && assignee_id !== user.id) {
          watcherIds.push(assignee_id);
        }

        for (const uid of watcherIds) {
          if (uid !== user.id && !notifySet.has(uid)) {
            notifySet.add(uid);
            notifications.push({
              user_id: uid,
              ticket_id,
              type: 'comment_added',
              actor_id: user.id,
            });
          }
        }

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['watchers', variables.ticket_id] });
      logActivity(variables.ticket_id, 'comment_added');
      toast('Comment added');
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['comments'],
    mutationFn: async ({ id, ticket_id }: { id: string; ticket_id: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      return { ticket_id };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticket_id] });
    },
  });
}
