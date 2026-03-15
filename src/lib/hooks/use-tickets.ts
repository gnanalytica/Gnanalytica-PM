"use client";

import { useMemo, useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { createClient } from "@/lib/supabase-browser";
import {
  logTicketChanges,
  fetchTicketSnapshot,
} from "@/lib/hooks/use-activity-log";
import { ensureWatching, notifyWatchers } from "@/lib/hooks/use-watchers";
import { useTicketStore } from "@/lib/store/ticket-store";
import { toast } from "@/lib/hooks/use-toast";
import type {
  Ticket,
  Label,
  TicketPriority,
  IssueType,
  StatusCategory,
} from "@/types";
import { getStatusCategory } from "@/types";
import { getCycleIssues } from "@/lib/store/ticket-store";

const supabase = createClient();

// ── Pure fetch functions ──

const TICKET_PAGE_SIZE = 50;
const MAX_LOADED_TICKETS = 500; // Cap at 500 tickets per project to prevent memory bloat

type TicketPage = {
  tickets: Ticket[];
  total: number;
  page: number;
};

export function normalizeTicket(t: any): Ticket {
  return {
    ...t,
    issue_type: t.issue_type ?? "task",
    story_points: t.story_points ?? null,
    start_date: t.start_date ?? null,
    parent_id: t.parent_id ?? null,
    epic_id: t.epic_id ?? null,
    milestone_id: t.milestone_id ?? null,
    first_response_at: t.first_response_at ?? null,
    resolved_at: t.resolved_at ?? null,
    sla_response_breached: t.sla_response_breached ?? false,
    sla_resolution_breached: t.sla_resolution_breached ?? false,
    labels: t.labels?.map((tl: { label: unknown }) => tl.label) ?? [],
    assignees: t.assignees ?? [],
    parent: t.parent ?? null,
    milestone: t.milestone ?? null,
  };
}

export const TICKET_SELECT = `
  id,
  title,
  description,
  status,
  status_category,
  priority,
  issue_type,
  project_id,
  assignee_id,
  created_by,
  parent_id,
  created_at,
  updated_at,
  due_date,
  position,
  story_points,
  start_date,
  epic_id,
  milestone_id,
  assignee:profiles!tickets_assignee_id_fkey(id,name,avatar_url,role,created_at),
  creator:profiles!tickets_created_by_fkey(id,name,avatar_url,role,created_at),
  labels:ticket_labels(label:labels(id,name,color,project_id)),
  assignees:ticket_assignees(user:profiles(id,name,avatar_url,role,created_at))
`;

async function fetchProjectTicketsPage(
  projectId: string,
  page: number,
): Promise<TicketPage> {
  const from = page * TICKET_PAGE_SIZE;
  const to = from + TICKET_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("tickets")
    .select(TICKET_SELECT, { count: "exact" })
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    tickets: (data ?? []).map(normalizeTicket),
    total: count ?? 0,
    page,
  };
}

async function fetchTicketById(ticketId: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", ticketId)
    .single();
  if (error) throw error;
  return normalizeTicket(data);
}

// ── Hydration: React Query fetches, Zustand store is populated ──
//
// Called once per route. They own the fetch lifecycle and push data into
// the store. Components never read query.data — only loading/error status.

function upsertTicketInStore(ticket: Ticket) {
  const { byId, addTicket, updateTicket } = useTicketStore.getState();
  if (byId[ticket.id]) {
    updateTicket(ticket.id, ticket);
  } else {
    addTicket(ticket);
  }
}

/**
 * Fetch tickets for a project in pages and hydrate the Zustand store.
 * First page (50 items) loads immediately; remaining pages are fetched
 * in the background and incrementally merged into the store.
 *
 * Page 0: setTickets (clean baseline, replaces stale localStorage data)
 * Pages 1+: mergeTickets (incremental append, no full rebuild)
 */
export function useHydrateTickets(projectId: string | undefined) {
  // Track how many pages have been synced to the store so we only
  // merge the delta on each new page arrival.
  const syncedPageCountRef = useRef(0);
  const syncedProjectRef = useRef<string | undefined>(undefined);

  const query = useInfiniteQuery({
    queryKey: ["tickets", projectId],
    queryFn: async ({ pageParam }) => {
      if (!projectId) return { tickets: [], total: 0, page: 0 };
      return fetchProjectTicketsPage(projectId, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = (lastPage.page + 1) * TICKET_PAGE_SIZE;
      // Stop loading after MAX_LOADED_TICKETS or when all tickets are fetched
      return fetched < Math.min(lastPage.total, MAX_LOADED_TICKETS)
        ? lastPage.page + 1
        : undefined;
    },
    enabled: !!projectId,
  });

  const pages = query.data?.pages;
  const pageCount = pages?.length ?? 0;

  // Incrementally sync pages into the Zustand store.
  // Page 0 → setTickets (establishes clean baseline).
  // Pages 1+ → mergeTickets (batch upsert, no full rebuild).
  useEffect(() => {
    if (!pages || pageCount === 0) return;

    // Reset sync tracking when the project changes
    if (syncedProjectRef.current !== projectId) {
      syncedProjectRef.current = projectId;
      syncedPageCountRef.current = 0;
    }

    const alreadySynced = syncedPageCountRef.current;

    if (alreadySynced === 0) {
      // First page: full replace to clear stale localStorage data
      useTicketStore.getState().setTickets(pages[0].tickets);
      syncedPageCountRef.current = 1;
    }

    // Merge any pages beyond what we've already synced
    const start = Math.max(alreadySynced, 1);
    if (pageCount > start) {
      const newTickets: Ticket[] = [];
      for (let i = start; i < pageCount; i++) {
        for (const t of pages[i].tickets) {
          newTickets.push(t);
        }
      }
      if (newTickets.length > 0) {
        useTicketStore.getState().mergeTickets(newTickets);
      }
      syncedPageCountRef.current = pageCount;
    }
  }, [pages, pageCount, projectId]);

  // Auto-fetch remaining pages in the background after the first page loads
  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query]);

  const loadedCount = useMemo(() => {
    if (!pages) return 0;
    let count = 0;
    for (const p of pages) count += p.tickets.length;
    return count;
  }, [pages]);

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    totalCount: pages?.[0]?.total ?? null,
    loadedCount,
  };
}

/**
 * Fetch a single ticket and hydrate it into the Zustand store.
 * Used on the ticket detail page and side panel for direct navigation.
 */
export function useHydrateTicket(ticketId: string) {
  const query = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const ticket = await fetchTicketById(ticketId);
      upsertTicketInStore(ticket);
      return ticket;
    },
    enabled: !!ticketId,
  });

  // Sync cache hits into the store via effect (not during render)
  useEffect(() => {
    if (query.data) {
      upsertTicketInStore(query.data);
    }
  }, [query.data]);

  return { isLoading: query.isLoading, isError: query.isError };
}

// ── Store-only selectors — the ONLY way components read ticket data ──
// Subscribe to raw store slices (stable references) and derive with useMemo.
// Avoids violating useSyncExternalStore's contract — selectors that create
// new arrays on every call (filter/sort) would cause infinite re-renders.

export function useProjectTickets(projectId: string): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(
    () =>
      ids
        .map((id) => byId[id])
        .filter((t): t is Ticket => t != null && t.project_id === projectId)
        .sort(
          (a, b) =>
            a.position - b.position ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [byId, ids, projectId],
  );
}

export function useTicketsByStatus(
  projectId: string,
  status: string,
): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(
    () =>
      ids
        .map((id) => byId[id])
        .filter(
          (t): t is Ticket =>
            t != null && t.project_id === projectId && t.status === status,
        )
        .sort(
          (a, b) =>
            a.position - b.position ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [byId, ids, projectId, status],
  );
}

export function useStoreTicket(ticketId: string): Ticket | undefined {
  return useTicketStore((s) => s.byId[ticketId]);
}

export function useFlashIds(): Record<string, true> {
  return useTicketStore((s) => s.flashIds);
}

// ── User-centric selectors (derived state only — no API calls) ──
//
// These scan the full store so they work across projects. For the "My Issues"
// workspace, a hydration hook that fetches user tickets across all projects
// (and addTicket-s rather than setTickets) should populate the store first.
// The selectors themselves are pure derivations from whatever is in the store.
//
// Sort comparator uses direct string comparison on ISO-8601 timestamps
// (Supabase returns consistent format) to avoid Date object allocation.

function byUpdatedAtDesc(a: Ticket, b: Ticket): number {
  if (a.updated_at > b.updated_at) return -1;
  if (a.updated_at < b.updated_at) return 1;
  return 0;
}

/**
 * All tickets assigned to `userId`, sorted by updated_at DESC.
 * Single-pass filter → sort to avoid intermediate array allocations.
 */
export function useAssignedTickets(userId: string): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(() => {
    const result: Ticket[] = [];
    for (let i = 0; i < ids.length; i++) {
      const t = byId[ids[i]];
      if (
        t &&
        (t.assignee_id === userId ||
          t.assignees?.some((a) => a.user?.id === userId))
      )
        result.push(t);
    }
    return result.sort(byUpdatedAtDesc);
  }, [byId, ids, userId]);
}

/**
 * All tickets created by `userId`, sorted by updated_at DESC.
 */
export function useCreatedTickets(userId: string): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(() => {
    const result: Ticket[] = [];
    for (let i = 0; i < ids.length; i++) {
      const t = byId[ids[i]];
      if (t && t.created_by === userId) result.push(t);
    }
    return result.sort(byUpdatedAtDesc);
  }, [byId, ids, userId]);
}

/**
 * All tickets in the store, sorted by updated_at DESC.
 * "Recent" is determined by the consumer (slice to desired count).
 */
export function useRecentlyUpdatedTickets(): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(() => {
    const result: Ticket[] = [];
    for (let i = 0; i < ids.length; i++) {
      const t = byId[ids[i]];
      if (t) result.push(t);
    }
    return result.sort(byUpdatedAtDesc);
  }, [byId, ids]);
}

// ── Derived metrics selectors (store-only, no API calls) ──

/** Tickets in a project whose status_category is 'completed'. */
export function useCompletedIssues(projectId: string): Ticket[] {
  return useCategoryTickets(projectId, "completed");
}

/** Tickets in a project whose status_category is 'started'. */
export function useStartedIssues(projectId: string): Ticket[] {
  return useCategoryTickets(projectId, "started");
}

/** Count of tickets in a project whose status_category is 'backlog'. */
export function useBacklogCount(projectId: string): number {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(() => {
    let count = 0;
    for (let i = 0; i < ids.length; i++) {
      const t = byId[ids[i]];
      if (t && t.project_id === projectId && t.status_category === "backlog")
        count++;
    }
    return count;
  }, [byId, ids, projectId]);
}

/**
 * Velocity = completed issues per cycle.
 * Returns the average across all provided cycle IDs and per-cycle breakdown.
 * Computed entirely from the Zustand store (cycleTicketIds + byId).
 */
export function useVelocityPerCycle(cycleIds: string[]): {
  average: number;
  byCycle: { cycleId: string; completed: number; total: number }[];
} {
  const { byId, cycleTicketIds } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, cycleTicketIds: s.cycleTicketIds })),
  );

  return useMemo(() => {
    const byCycle: { cycleId: string; completed: number; total: number }[] = [];
    let totalCompleted = 0;

    for (const cycleId of cycleIds) {
      const issues = getCycleIssues(
        { byId, cycleTicketIds } as Parameters<typeof getCycleIssues>[0],
        cycleId,
      );
      const completed = issues.filter(
        (t) => t.status_category === "completed",
      ).length;
      totalCompleted += completed;
      byCycle.push({ cycleId, completed, total: issues.length });
    }

    const average =
      cycleIds.length === 0 ? 0 : Math.round(totalCompleted / cycleIds.length);
    return { average, byCycle };
  }, [byId, cycleTicketIds, cycleIds]);
}

/** Internal: filter project tickets by a single status_category. */
function useCategoryTickets(
  projectId: string,
  category: StatusCategory,
): Ticket[] {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(() => {
    const result: Ticket[] = [];
    for (let i = 0; i < ids.length; i++) {
      const t = byId[ids[i]];
      if (t && t.project_id === projectId && t.status_category === category) {
        result.push(t);
      }
    }
    return result.sort(byUpdatedAtDesc);
  }, [byId, ids, projectId, category]);
}

// ── Mutations (update store optimistically, sync to Supabase in background) ──

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const addTicket = useTicketStore((s) => s.addTicket);
  const removeTicket = useTicketStore((s) => s.removeTicket);

  return useMutation({
    mutationKey: ["tickets"],
    mutationFn: async (ticket: {
      project_id: string;
      title: string;
      description?: string;
      status?: string;
      priority?: TicketPriority;
      assignee_id?: string | null;
      assignee_ids?: string[];
      due_date?: string | null;
      label_ids?: string[];
      position?: number;
      issue_type?: IssueType;
      story_points?: number | null;
      start_date?: string | null;
      parent_id?: string | null;
      epic_id?: string | null;
      milestone_id?: string | null;
    }) => {
      const { label_ids, assignee_ids, ...ticketData } = ticket;
      // Set primary assignee from multi-assign list
      if (assignee_ids && assignee_ids.length > 0) {
        ticketData.assignee_id = assignee_ids[0];
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tickets")
        .insert({ ...ticketData, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;

      if (label_ids && label_ids.length > 0) {
        const { error: labelError } = await supabase
          .from("ticket_labels")
          .insert(
            label_ids.map((lid) => ({ ticket_id: data.id, label_id: lid })),
          );
        if (labelError) throw labelError;
      }

      // Insert multi-assignees into junction table
      if (assignee_ids && assignee_ids.length > 0) {
        const { error: assigneeError } = await supabase
          .from("ticket_assignees")
          .insert(
            assignee_ids.map((uid) => ({ ticket_id: data.id, user_id: uid })),
          );
        if (assigneeError) throw assigneeError;
      }

      return data;
    },
    onMutate: async (newTicket) => {
      const tempId = `temp-${Date.now()}`;
      const status = newTicket.status ?? "todo";
      const optimistic: Ticket = {
        id: tempId,
        project_id: newTicket.project_id,
        title: newTicket.title,
        description: newTicket.description ?? null,
        status,
        status_category: getStatusCategory(status),
        priority: newTicket.priority ?? "medium",
        assignee_id: newTicket.assignee_id ?? null,
        created_by: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: newTicket.due_date ?? null,
        position: newTicket.position ?? 0,
        issue_type: newTicket.issue_type ?? "task",
        story_points: newTicket.story_points ?? null,
        start_date: newTicket.start_date ?? null,
        parent_id: newTicket.parent_id ?? null,
        epic_id: newTicket.epic_id ?? null,
        milestone_id: newTicket.milestone_id ?? null,
        first_response_at: null,
        resolved_at: null,
        sla_response_breached: false,
        sla_resolution_breached: false,
        labels: [],
        assignees: [],
      };

      addTicket(optimistic);
      return { tempId };
    },
    onError: (_err, _variables, context) => {
      if (context?.tempId) {
        removeTicket(context.tempId);
      }
    },
    onSuccess: async (data, variables) => {
      if (data?.id && data?.created_by) {
        logTicketChanges(data.id, data.created_by, "created", {}, {});
        // Auto-watch: creator
        await ensureWatching(data.id, data.created_by);
        // Auto-watch: all assignees
        const watchIds = variables.assignee_ids ?? (data.assignee_id ? [data.assignee_id] : []);
        for (const uid of watchIds) {
          await ensureWatching(data.id, uid);
        }
      }
      toast("Issue created");
    },
    onSettled: (_data, _err, variables, context) => {
      // Only refetch on error — optimistic update already covers the success case
      if (_err && context?.tempId) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", variables.project_id],
        });
      }
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const storeUpdate = useTicketStore((s) => s.updateTicket);
  const store = useTicketStore;

  return useMutation({
    mutationKey: ["tickets"],
    mutationFn: async ({
      id,
      project_id,
      label_ids,
      assignee_ids,
      ...updates
    }: {
      id: string;
      project_id: string;
      title?: string;
      description?: string;
      status?: string;
      priority?: TicketPriority;
      assignee_id?: string | null;
      assignee_ids?: string[];
      due_date?: string | null;
      label_ids?: string[];
      position?: number;
      issue_type?: IssueType;
      story_points?: number | null;
      start_date?: string | null;
      parent_id?: string | null;
      epic_id?: string | null;
      milestone_id?: string | null;
    }) => {
      void project_id;

      // Get old snapshot from in-memory Zustand store instead of fetching
      const existingTicket = store.getState().byId[id];
      const oldSnap = {
        status: existingTicket?.status,
        priority: existingTicket?.priority,
        assignee_id: existingTicket?.assignee_id ?? null,
        label_ids: existingTicket?.labels?.map((l) => l.id) ?? [],
        issue_type: existingTicket?.issue_type,
        story_points: existingTicket?.story_points ?? null,
        start_date: existingTicket?.start_date ?? null,
        milestone_id: existingTicket?.milestone_id ?? null,
        epic_id: existingTicket?.epic_id ?? null,
        parent_id: existingTicket?.parent_id ?? null,
      };

      // Sync primary assignee from multi-assign list
      if (assignee_ids !== undefined) {
        updates.assignee_id = assignee_ids[0] ?? null;
      }

      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (label_ids !== undefined) {
        await supabase.from("ticket_labels").delete().eq("ticket_id", id);
        if (label_ids.length > 0) {
          const { error: labelError } = await supabase
            .from("ticket_labels")
            .insert(label_ids.map((lid) => ({ ticket_id: id, label_id: lid })));
          if (labelError) throw labelError;
        }
      }

      // Sync multi-assignees junction table
      if (assignee_ids !== undefined) {
        await supabase.from("ticket_assignees").delete().eq("ticket_id", id);
        if (assignee_ids.length > 0) {
          const { error: assigneeError } = await supabase
            .from("ticket_assignees")
            .insert(
              assignee_ids.map((uid) => ({ ticket_id: id, user_id: uid })),
            );
          if (assigneeError) throw assigneeError;
          // Auto-watch all assignees
          for (const uid of assignee_ids) {
            await ensureWatching(id, uid);
          }
        }
      }

      // Log all detected changes in a single batch insert
      await logTicketChanges(id, data.created_by, "updated", oldSnap, {
        status: updates.status,
        assignee_id: "assignee_id" in updates ? updates.assignee_id : undefined,
        label_ids,
      });

      // Notify watchers of meaningful field changes
      const {
        data: { user: actorUser },
      } = await supabase.auth.getUser();
      if (actorUser) {
        const actorId = actorUser.id;

        if (updates.status && updates.status !== oldSnap.status) {
          await notifyWatchers(id, "status_changed", actorId);
        }
        if (updates.priority && updates.priority !== oldSnap.priority) {
          await notifyWatchers(id, "priority_changed", actorId);
        }
        if (
          "assignee_id" in updates &&
          updates.assignee_id !== oldSnap.assignee_id
        ) {
          const excludeIds = updates.assignee_id ? [updates.assignee_id] : [];
          await notifyWatchers(id, "ticket_assigned", actorId, excludeIds);
        }
      }

      return data;
    },
    onMutate: async (variables) => {
      const { id, project_id, label_ids, assignee_ids, ...fields } = variables;

      // Snapshot for rollback
      const previous = store.getState().byId[id];

      // Resolve label objects for optimistic update
      let labelUpdate: { labels: Label[] } | Record<string, never> = {};
      if (label_ids !== undefined) {
        const allLabels = queryClient.getQueryData<Label[]>([
          "labels",
          project_id,
        ]);
        if (allLabels) {
          labelUpdate = {
            labels: allLabels.filter((l) => label_ids.includes(l.id)),
          };
        }
      }

      // Resolve assignee objects for optimistic multi-assign update
      let assigneeUpdate: Record<string, unknown> = {};
      if (assignee_ids !== undefined) {
        const allMembers =
          queryClient.getQueryData<{ id: string; name: string; avatar_url: string | null }[]>(["members"]) ?? [];
        assigneeUpdate = {
          assignee_id: assignee_ids[0] ?? null,
          assignees: assignee_ids
            .map((uid) => {
              const m = allMembers.find((p) => p.id === uid);
              return m ? { user: m } : null;
            })
            .filter(Boolean),
        };
      }

      // Derive status_category when status changes
      const categoryUpdate = fields.status
        ? { status_category: getStatusCategory(fields.status) }
        : {};

      // Optimistic update in Zustand store
      storeUpdate(id, {
        ...fields,
        ...labelUpdate,
        ...assigneeUpdate,
        ...categoryUpdate,
      });

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        storeUpdate(variables.id, context.previous);
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.status) {
        toast(`Status changed to ${variables.status.replace("_", " ")}`);
      }
    },
    onSettled: (_data, _err, variables, context) => {
      // Only refetch on error — optimistic update already covers the success case
      if (_err && context?.previous) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", variables.project_id],
        });
      }
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const removeTicket = useTicketStore((s) => s.removeTicket);

  return useMutation({
    mutationKey: ["tickets"],
    mutationFn: async ({ id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: (variables) => {
      const previous = useTicketStore.getState().byId[variables.id];
      removeTicket(variables.id);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        useTicketStore.getState().addTicket(context.previous);
      }
    },
    onSuccess: (_data, variables, context) => {
      const prev = context?.previous;
      if (prev) {
        toast("Issue deleted", {
          undoFn: async () => {
            // Re-insert the ticket
            const { error } = await supabase.from("tickets").insert({
              id: prev.id,
              project_id: prev.project_id,
              title: prev.title,
              description: prev.description,
              status: prev.status,
              status_category: prev.status_category,
              priority: prev.priority,
              issue_type: prev.issue_type,
              assignee_id: prev.assignee_id,
              created_by: prev.created_by,
              story_points: prev.story_points,
              due_date: prev.due_date,
              start_date: prev.start_date,
              position: prev.position,
            });
            if (!error) {
              useTicketStore.getState().addTicket(prev);
              queryClient.invalidateQueries({
                queryKey: ["tickets", variables.project_id],
              });
              toast("Issue restored");
            }
          },
        });
      }
    },
    onSettled: (_data, _err, variables, context) => {
      if (_err && context?.previous) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", variables.project_id],
        });
      }
    },
  });
}

export function useReorderTicket() {
  const storeMove = useTicketStore((s) => s.moveTicket);
  const storeUpdate = useTicketStore((s) => s.updateTicket);

  return useMutation({
    mutationKey: ["tickets"],
    mutationFn: async ({
      id,
      position,
      status,

      status_category,
    }: {
      id: string;
      project_id: string;
      position: number;
      status?: string;
      status_category?: StatusCategory;
    }) => {
      const updates: { position: number; status?: string } = { position };
      if (status !== undefined) updates.status = status;

      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: (variables) => {
      const { id, position, status, status_category } = variables;
      const previous = useTicketStore.getState().byId[id];

      if (status !== undefined) {
        const cat = status_category ?? getStatusCategory(status);
        storeMove(id, status, cat, position);
      } else {
        storeUpdate(id, { position });
      }

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        const t = context.previous;
        storeMove(t.id, t.status, t.status_category, t.position);
      }
    },
    // No onSettled invalidation — store is source of truth until next full refetch
  });
}

export function useUpdateMultipleTickets() {
  const queryClient = useQueryClient();
  const storeUpdate = useTicketStore((s) => s.updateTicket);

  return useMutation({
    mutationKey: ["tickets", "bulk"],
    mutationFn: async ({
      ids,
      project_id,
      updates,
    }: {
      ids: string[];
      project_id: string;
      updates: {
        status?: string;
        priority?: TicketPriority;
        assignee_id?: string | null;
        milestone_id?: string | null;
        epic_id?: string | null;
        issue_type?: IssueType;
      };
    }) => {
      void project_id;
      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
    },
    onMutate: ({ ids, updates }) => {
      const categoryUpdate = updates.status
        ? { status_category: getStatusCategory(updates.status) }
        : {};
      for (const id of ids) {
        storeUpdate(id, { ...updates, ...categoryUpdate });
      }
    },
    onSettled: (_data, _err, variables) => {
      if (_err) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", variables.project_id],
        });
      }
    },
  });
}
