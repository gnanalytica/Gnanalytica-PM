import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket, Cycle, Milestone, StatusCategory } from '@/types';

// ── Normalized state ──

type TicketState = {
  byId: Record<string, Ticket>;
  ids: string[];
  flashIds: Record<string, true>;

  // Cycle state — normalized: cycleTicketIds maps cycle id → set of ticket ids
  activeCycleId: string | null;
  cyclesById: Record<string, Cycle>;
  cycleTicketIds: Record<string, string[]>;

  // Milestone state
  milestonesById: Record<string, Milestone>;
  milestoneIds: string[];

  // Ticket actions
  setTickets: (tickets: Ticket[]) => void;
  mergeTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, fields: Partial<Ticket>) => void;
  moveTicket: (id: string, status: string, statusCategory: StatusCategory, position: number) => void;
  removeTicket: (id: string) => void;

  // Cycle actions
  setActiveCycle: (cycleId: string | null) => void;
  setCycles: (cycles: Cycle[]) => void;
  addCycle: (cycle: Cycle) => void;
  updateCycle: (id: string, fields: Partial<Cycle>) => void;
  assignIssueToCycle: (ticketId: string, cycleId: string) => void;
  removeIssueFromCycle: (ticketId: string, cycleId: string) => void;
  setCycleTickets: (cycleId: string, ticketIds: string[]) => void;

  // Milestone actions
  setMilestones: (milestones: Milestone[]) => void;
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (id: string, fields: Partial<Milestone>) => void;
  removeMilestone: (id: string) => void;
};

// ── Getters (pure functions for use outside React — see NOTE at bottom) ──

/**
 * Return ticket objects for a given cycle from current store state.
 * Call via useTicketStore.getState() or inside a selector + useMemo.
 */
export function getCycleIssues(state: TicketState, cycleId: string): Ticket[] {
  const ids = state.cycleTicketIds[cycleId];
  if (!ids) return [];
  const result: Ticket[] = [];
  for (const id of ids) {
    const t = state.byId[id];
    if (t) result.push(t);
  }
  return result;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set) => ({
      byId: {},
      ids: [],
      flashIds: {},

      activeCycleId: null,
      cyclesById: {},
      cycleTicketIds: {},

      milestonesById: {},
      milestoneIds: [],

      setTickets: (tickets) =>
        set((state) => {
          // Skip update if same tickets in same order with same references
          if (
            state.ids.length === tickets.length &&
            tickets.every((t, i) => state.ids[i] === t.id && state.byId[t.id] === t)
          ) {
            return state;
          }
          const byId: Record<string, Ticket> = {};
          const ids: string[] = [];
          for (const t of tickets) {
            byId[t.id] = t;
            ids.push(t.id);
          }
          return { byId, ids };
        }),

      mergeTickets: (tickets) =>
        set((state) => {
          if (tickets.length === 0) return state;
          let changed = false;
          const byId = { ...state.byId };
          const newIds: string[] = [];
          for (const t of tickets) {
            if (!byId[t.id]) {
              newIds.push(t.id);
              changed = true;
            } else if (byId[t.id] !== t) {
              changed = true;
            }
            byId[t.id] = t;
          }
          if (!changed) return state;
          const ids = newIds.length > 0 ? [...state.ids, ...newIds] : state.ids;
          return { byId, ids };
        }),

      addTicket: (ticket) =>
        set((state) => {
          if (state.byId[ticket.id]) return state;
          return {
            byId: { ...state.byId, [ticket.id]: ticket },
            ids: [...state.ids, ticket.id],
          };
        }),

      updateTicket: (id, fields) => {
        set((state) => {
          const existing = state.byId[id];
          if (!existing) return state;
          return {
            byId: { ...state.byId, [id]: { ...existing, ...fields } },
            flashIds: { ...state.flashIds, [id]: true as const },
          };
        });
        setTimeout(() => {
          set((state) => {
            if (!state.flashIds[id]) return state;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _flash, ...rest } = state.flashIds;
            return { flashIds: rest };
          });
        }, 600);
      },

      moveTicket: (id, status, statusCategory, position) =>
        set((state) => {
          const existing = state.byId[id];
          if (!existing) return state;
          return {
            byId: { ...state.byId, [id]: { ...existing, status, status_category: statusCategory, position } },
          };
        }),

      removeTicket: (id) =>
        set((state) => {
          if (!state.byId[id]) return state;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _ticket, ...rest } = state.byId;
          return {
            byId: rest,
            ids: state.ids.filter((i) => i !== id),
          };
        }),

      // ── Cycle actions ──

      setActiveCycle: (cycleId) => set({ activeCycleId: cycleId }),

      setCycles: (cycles) =>
        set(() => {
          const cyclesById: Record<string, Cycle> = {};
          for (const c of cycles) {
            cyclesById[c.id] = c;
          }
          return { cyclesById };
        }),

      addCycle: (cycle) =>
        set((state) => ({
          cyclesById: { ...state.cyclesById, [cycle.id]: cycle },
          cycleTicketIds: { ...state.cycleTicketIds, [cycle.id]: state.cycleTicketIds[cycle.id] ?? [] },
        })),

      assignIssueToCycle: (ticketId, cycleId) =>
        set((state) => {
          const existing = state.cycleTicketIds[cycleId] ?? [];
          if (existing.includes(ticketId)) return state;
          return {
            cycleTicketIds: {
              ...state.cycleTicketIds,
              [cycleId]: [...existing, ticketId],
            },
          };
        }),

      removeIssueFromCycle: (ticketId, cycleId) =>
        set((state) => {
          const existing = state.cycleTicketIds[cycleId];
          if (!existing || !existing.includes(ticketId)) return state;
          return {
            cycleTicketIds: {
              ...state.cycleTicketIds,
              [cycleId]: existing.filter((id) => id !== ticketId),
            },
          };
        }),

      setCycleTickets: (cycleId, ticketIds) =>
        set((state) => ({
          cycleTicketIds: {
            ...state.cycleTicketIds,
            [cycleId]: ticketIds,
          },
        })),

      updateCycle: (id, fields) =>
        set((state) => {
          const existing = state.cyclesById[id];
          if (!existing) return state;
          return {
            cyclesById: { ...state.cyclesById, [id]: { ...existing, ...fields } },
          };
        }),

      // ── Milestone actions ──

      setMilestones: (milestones) =>
        set(() => {
          const milestonesById: Record<string, Milestone> = {};
          const milestoneIds: string[] = [];
          for (const m of milestones) {
            milestonesById[m.id] = m;
            milestoneIds.push(m.id);
          }
          return { milestonesById, milestoneIds };
        }),

      addMilestone: (milestone) =>
        set((state) => {
          if (state.milestonesById[milestone.id]) return state;
          return {
            milestonesById: { ...state.milestonesById, [milestone.id]: milestone },
            milestoneIds: [...state.milestoneIds, milestone.id],
          };
        }),

      updateMilestone: (id, fields) =>
        set((state) => {
          const existing = state.milestonesById[id];
          if (!existing) return state;
          return {
            milestonesById: { ...state.milestonesById, [id]: { ...existing, ...fields } },
          };
        }),

      removeMilestone: (id) =>
        set((state) => {
          if (!state.milestonesById[id]) return state;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...rest } = state.milestonesById;
          return {
            milestonesById: rest,
            milestoneIds: state.milestoneIds.filter((i) => i !== id),
          };
        }),
    }),
    {
      name: 'pm-ticket-store',
      partialize: (state) => ({
        byId: state.byId,
        ids: state.ids,
        activeCycleId: state.activeCycleId,
        cyclesById: state.cyclesById,
        cycleTicketIds: state.cycleTicketIds,
        milestonesById: state.milestonesById,
        milestoneIds: state.milestoneIds,
      }),
    },
  ),
);

// NOTE: Do NOT pass array-creating selectors (filter/sort) directly to
// useTicketStore() — useSyncExternalStore requires stable references.
// Use the hooks in use-tickets.ts (useProjectTickets, useStoreTicket)
// which subscribe to raw slices (byId, ids) and derive via useMemo.
// For cycle issues, use the useCycleIssues hook or getCycleIssues getter.
