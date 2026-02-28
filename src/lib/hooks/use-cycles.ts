'use client';

import { useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { createClient } from '@/lib/supabase-browser';
import { useTicketStore, getCycleIssues } from '@/lib/store/ticket-store';
import type { Cycle, Ticket } from '@/types';

const supabase = createClient();

// ── Hydration ──

/**
 * Fetch cycles for a project and hydrate the Zustand store.
 * Also fetches ticket_cycles junction rows to populate cycleTicketIds.
 */
export function useHydrateCycles(projectId: string | undefined) {
  const hydratedRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ['cycles', projectId],
    queryFn: async () => {
      const [{ data: cycles, error: cyclesErr }, { data: junctions, error: juncErr }] =
        await Promise.all([
          supabase
            .from('cycles')
            .select('*')
            .eq('project_id', projectId)
            .order('start_date', { ascending: false }),
          supabase
            .from('ticket_cycles')
            .select('ticket_id, cycle_id, cycle:cycles!inner(project_id)')
            .eq('cycle.project_id', projectId),
        ]);

      if (cyclesErr) throw cyclesErr;
      if (juncErr) throw juncErr;

      const allCycles: Cycle[] = cycles ?? [];
      const ticketMap: Record<string, string[]> = {};
      for (const j of junctions ?? []) {
        const list = ticketMap[j.cycle_id] ?? [];
        list.push(j.ticket_id);
        ticketMap[j.cycle_id] = list;
      }

      // Hydrate store
      const store = useTicketStore.getState();
      store.setCycles(allCycles);
      for (const cycle of allCycles) {
        store.setCycleTickets(cycle.id, ticketMap[cycle.id] ?? []);
      }

      // Auto-select active cycle (current date falls within range)
      if (!store.activeCycleId) {
        const today = new Date().toISOString().slice(0, 10);
        const current = allCycles.find(
          (c) => c.start_date <= today && c.end_date >= today,
        );
        if (current) store.setActiveCycle(current.id);
      }

      return { cycles: allCycles, ticketMap };
    },
    enabled: !!projectId,
  });

  // Handle cache hits
  if (query.data && hydratedRef.current !== projectId) {
    hydratedRef.current = projectId;
    const store = useTicketStore.getState();
    store.setCycles(query.data.cycles);
    for (const cycle of query.data.cycles) {
      store.setCycleTickets(cycle.id, query.data.ticketMap[cycle.id] ?? []);
    }
  }

  return { isLoading: query.isLoading, isError: query.isError };
}

// ── Selectors ──

export function useProjectCycles(projectId: string): Cycle[] {
  const cyclesById = useTicketStore((s) => s.cyclesById);

  return useMemo(
    () =>
      Object.values(cyclesById)
        .filter((c) => c.project_id === projectId)
        .sort((a, b) => (a.start_date > b.start_date ? -1 : 1)),
    [cyclesById, projectId],
  );
}

export function useActiveCycle(): Cycle | null {
  const { activeCycleId, cyclesById } = useTicketStore(
    useShallow((s) => ({ activeCycleId: s.activeCycleId, cyclesById: s.cyclesById })),
  );
  return activeCycleId ? cyclesById[activeCycleId] ?? null : null;
}

/**
 * Tickets in a specific cycle. Follows the same stable-selector pattern
 * as useProjectTickets — subscribes to raw slices, derives with useMemo.
 */
export function useCycleTickets(cycleId: string | null): Ticket[] {
  const { byId, cycleTicketIds } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, cycleTicketIds: s.cycleTicketIds })),
  );

  return useMemo(() => {
    if (!cycleId) return [];
    return getCycleIssues({ byId, cycleTicketIds } as Parameters<typeof getCycleIssues>[0], cycleId);
  }, [byId, cycleTicketIds, cycleId]);
}

// ── Mutations ──

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cycle: { name: string; start_date: string; end_date: string; project_id: string }) => {
      const { data, error } = await supabase
        .from('cycles')
        .insert(cycle)
        .select()
        .single();
      if (error) throw error;
      return data as Cycle;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', variables.project_id] });
    },
  });
}

export function useAssignTicketToCycle() {
  const queryClient = useQueryClient();
  const storeAssign = useTicketStore((s) => s.assignIssueToCycle);

  return useMutation({
    mutationFn: async ({ ticketId, cycleId, projectId }: { ticketId: string; cycleId: string; projectId: string }) => {
      void projectId;
      const { error } = await supabase
        .from('ticket_cycles')
        .insert({ ticket_id: ticketId, cycle_id: cycleId });
      if (error) throw error;
    },
    onMutate: ({ ticketId, cycleId }) => {
      storeAssign(ticketId, cycleId);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', variables.projectId] });
    },
  });
}

export function useRemoveTicketFromCycle() {
  const queryClient = useQueryClient();
  const storeRemove = useTicketStore((s) => s.removeIssueFromCycle);

  return useMutation({
    mutationFn: async ({ ticketId, cycleId, projectId }: { ticketId: string; cycleId: string; projectId: string }) => {
      void projectId;
      const { error } = await supabase
        .from('ticket_cycles')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('cycle_id', cycleId);
      if (error) throw error;
    },
    onMutate: ({ ticketId, cycleId }) => {
      storeRemove(ticketId, cycleId);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', variables.projectId] });
    },
  });
}
