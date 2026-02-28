'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { useTicketStore } from '@/lib/store/ticket-store';
import type { Ticket } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabase = createClient();

/**
 * Subscribe to realtime ticket changes for a project.
 * Updates the Zustand store directly for immediate UI response,
 * then triggers a background React Query refetch for full relations.
 */
export function useRealtimeTickets(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const mutatingCount = useRef(0);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.mutation?.options.mutationKey?.[0] !== 'tickets') return;

      if (event.type === 'updated') {
        const status = event.mutation.state.status;
        if (status === 'pending') {
          mutatingCount.current++;
        } else if (status === 'success' || status === 'error') {
          mutatingCount.current = Math.max(0, mutatingCount.current - 1);
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    if (!projectId) return;

    const { addTicket, updateTicket, removeTicket } = useTicketStore.getState();

    const handleInsert = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
    ) => {
      if (mutatingCount.current > 0) return;

      const row = payload.new as unknown as Ticket;
      if (!row?.id) return;

      // Add to Zustand store immediately
      addTicket({ ...row, labels: [] });

      // Background refetch for full relations (assignee, creator, labels)
      queryClient.invalidateQueries({
        queryKey: ['tickets', projectId],
        refetchType: 'active',
      });
    };

    const handleUpdate = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
    ) => {
      if (mutatingCount.current > 0) return;

      const row = payload.new as unknown as Ticket;
      if (!row?.id) return;

      // Update Zustand store (preserves joined data via partial update)
      const existing = useTicketStore.getState().byId[row.id];
      if (existing) {
        updateTicket(row.id, {
          ...row,
          // Preserve joined data that realtime doesn't include
          assignee: existing.assignee,
          creator: existing.creator,
          labels: existing.labels,
        });
      }

      // Background refetch for full relation data
      queryClient.invalidateQueries({
        queryKey: ['tickets', projectId],
        refetchType: 'active',
      });
      if (existing) {
        queryClient.invalidateQueries({
          queryKey: ['ticket', row.id],
          refetchType: 'active',
        });
      }
    };

    const handleDelete = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
    ) => {
      if (mutatingCount.current > 0) return;

      const deletedId = (payload.old as { id?: string })?.id;
      if (!deletedId) return;

      // Remove from Zustand store
      removeTicket(deletedId);

      queryClient.removeQueries({ queryKey: ['ticket', deletedId] });
    };

    const channel = supabase
      .channel(`tickets:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
          filter: `project_id=eq.${projectId}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `project_id=eq.${projectId}`,
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tickets',
          filter: `project_id=eq.${projectId}`,
        },
        handleDelete
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}

/**
 * Subscribe to realtime comment changes for a ticket.
 * Handles INSERT, UPDATE, and DELETE events.
 */
export function useRealtimeComments(ticketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    };

    const channel = supabase
      .channel(`comments:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);
}

/**
 * Subscribe to realtime changes for ticket relations.
 */
export function useRealtimeTicketRelations(ticketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-relations', ticketId] });
    };

    const channel = supabase
      .channel(`relations:${ticketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_relations', filter: `source_ticket_id=eq.${ticketId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_relations', filter: `target_ticket_id=eq.${ticketId}` }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);
}

/**
 * Subscribe to realtime changes for ticket assignees.
 */
export function useRealtimeTicketAssignees(ticketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    };

    const channel = supabase
      .channel(`assignees:${ticketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_assignees', filter: `ticket_id=eq.${ticketId}` }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);
}

/**
 * Subscribe to realtime changes for ticket attachments.
 */
export function useRealtimeTicketAttachments(ticketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] });
    };

    const channel = supabase
      .channel(`attachments:${ticketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_attachments', filter: `ticket_id=eq.${ticketId}` }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);
}

/**
 * Subscribe to realtime changes for comment reactions.
 */
export function useRealtimeCommentReactions(ticketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    };

    const channel = supabase
      .channel(`reactions:${ticketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_reactions' }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);
}

/**
 * Subscribe to realtime notification changes for the current user.
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
