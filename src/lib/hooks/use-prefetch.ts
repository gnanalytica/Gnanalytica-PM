'use client';

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { useTicketStore } from '@/lib/store/ticket-store';
import { TICKET_SELECT, normalizeTicket } from '@/lib/hooks/use-tickets';

const supabase = createClient();

/**
 * Prefetch utilities for warming the Zustand store and React Query cache
 * on hover. All methods are safe to call multiple times — they check for
 * existing data before issuing network requests.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  // Track in-flight project prefetches to avoid duplicate requests
  const inflightProjects = useRef(new Set<string>());

  /**
   * Prefetch the first page of tickets for a project and silently merge
   * them into the Zustand store. Skips if the store already contains
   * tickets for this project or a request is already in-flight.
   */
  const prefetchProjectTickets = useCallback((projectId: string) => {
    // Already in-flight
    if (inflightProjects.current.has(projectId)) return;

    // Check if we already have tickets for this project in the store
    const store = useTicketStore.getState();
    const hasProjectTickets = store.ids.some(
      (id) => store.byId[id]?.project_id === projectId,
    );
    if (hasProjectTickets) return;

    inflightProjects.current.add(projectId);

    supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        inflightProjects.current.delete(projectId);
        if (error || !data) return;
        const tickets = data.map(normalizeTicket);
        useTicketStore.getState().mergeTickets(tickets);
      });
  }, []);

  /**
   * Prefetch a single ticket into the React Query cache (key: ['ticket', id]).
   * When the user navigates to the ticket detail or side panel,
   * useHydrateTicket will resolve instantly from the warm cache.
   * Skips if the cache already has fresh data.
   */
  const prefetchTicket = useCallback(
    (ticketId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['ticket', ticketId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select(TICKET_SELECT)
            .eq('id', ticketId)
            .single();
          if (error) throw error;
          const ticket = normalizeTicket(data);
          // Upsert into Zustand store
          const store = useTicketStore.getState();
          if (store.byId[ticketId]) {
            store.updateTicket(ticketId, ticket);
          } else {
            store.addTicket(ticket);
          }
          return ticket;
        },
        staleTime: 30_000,
      });
    },
    [queryClient],
  );

  return { prefetchProjectTickets, prefetchTicket };
}
