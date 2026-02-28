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
    hydratedRef.current = projectId ?? null;
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

export function useUpdateCycle() {
  const queryClient = useQueryClient();
  const storeUpdateCycle = useTicketStore((s) => s.updateCycle);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...updates
    }: {
      id: string;
      projectId: string;
      name?: string;
      start_date?: string;
      end_date?: string;
      retrospective_notes?: string;
      auto_rollover?: boolean;
      status?: 'planned' | 'active' | 'completed';
    }) => {
      void projectId;
      const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Cycle;
    },
    onMutate: ({ id, ...updates }) => {
      storeUpdateCycle(id, updates);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', variables.projectId] });
    },
  });
}

/**
 * Complete a sprint and optionally roll over incomplete issues to the next cycle.
 * Creates a new cycle if auto_rollover is enabled and no next cycle exists.
 */
export function useCompleteSprintWithRollover() {
  const queryClient = useQueryClient();
  const store = useTicketStore;

  return useMutation({
    mutationFn: async ({
      cycleId,
      projectId,
      nextCycleId,
    }: {
      cycleId: string;
      projectId: string;
      nextCycleId?: string;
    }) => {
      // Mark cycle as completed
      const { error: updateErr } = await supabase
        .from('cycles')
        .update({ status: 'completed' })
        .eq('id', cycleId);
      if (updateErr) throw updateErr;

      // Get cycle config
      const cycle = store.getState().cyclesById[cycleId];
      if (!cycle?.auto_rollover) return { rolledOver: 0 };

      // Find incomplete tickets
      const ticketIds = store.getState().cycleTicketIds[cycleId] ?? [];
      const byId = store.getState().byId;
      const incompleteIds = ticketIds.filter((id) => {
        const t = byId[id];
        return t && t.status_category !== 'completed' && t.status_category !== 'canceled';
      });

      if (incompleteIds.length === 0) return { rolledOver: 0 };

      let targetCycleId = nextCycleId;

      // Create a new cycle if needed
      if (!targetCycleId) {
        const startDate = new Date(cycle.end_date);
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date(startDate);
        const duration = Math.round(
          (new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / (1000 * 60 * 60 * 24),
        );
        endDate.setDate(endDate.getDate() + duration);

        const { data: newCycle, error: createErr } = await supabase
          .from('cycles')
          .insert({
            project_id: projectId,
            name: `${cycle.name} (next)`,
            start_date: startDate.toISOString().slice(0, 10),
            end_date: endDate.toISOString().slice(0, 10),
            auto_rollover: cycle.auto_rollover,
          })
          .select()
          .single();
        if (createErr) throw createErr;
        targetCycleId = newCycle.id;
      }

      // Move incomplete tickets to next cycle
      const { error: insertErr } = await supabase
        .from('ticket_cycles')
        .insert(incompleteIds.map((tid) => ({ ticket_id: tid, cycle_id: targetCycleId! })));
      if (insertErr) throw insertErr;

      return { rolledOver: incompleteIds.length, newCycleId: targetCycleId };
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', variables.projectId] });
    },
  });
}
