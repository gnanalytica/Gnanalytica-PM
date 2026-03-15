"use client";

import { useEffect, useRef, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { Ticket, ActivityLog } from "@/types";

const supabase = createClient();

// ── Shared select shape (matches fetchProjectTickets in use-tickets.ts) ──

const TICKET_SELECT = `
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
  first_response_at,
  resolved_at,
  sla_response_breached,
  sla_resolution_breached,
  assignee:profiles!tickets_assignee_id_fkey(id,name,avatar_url,role,created_at),
  creator:profiles!tickets_created_by_fkey(id,name,avatar_url,role,created_at),
  labels:ticket_labels(label:labels(id,name,color,project_id))
`;

const MY_TICKETS_PAGE_SIZE = 50;

function normalizeTicket(t: Record<string, unknown>): Ticket {
  return {
    ...t,
    labels:
      (t.labels as { label: unknown }[] | undefined)?.map((tl) => tl.label) ??
      [],
  } as Ticket;
}

// ── Paginated fetch — returns deduplicated tickets across assigned + created ──

type MyTicketsPage = {
  tickets: Ticket[];
  total: number;
  page: number;
};

async function fetchMyTicketsPage(
  userId: string,
  page: number,
): Promise<MyTicketsPage> {
  const from = page * MY_TICKETS_PAGE_SIZE;
  const to = from + MY_TICKETS_PAGE_SIZE - 1;

  // Fetch assigned + created in parallel, both with same range
  const [assignedRes, createdRes] = await Promise.all([
    supabase
      .from("tickets")
      .select(TICKET_SELECT, { count: "exact" })
      .eq("assignee_id", userId)
      .order("updated_at", { ascending: false })
      .range(from, to),
    supabase
      .from("tickets")
      .select(TICKET_SELECT, { count: "exact" })
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })
      .range(from, to),
  ]);

  // 416 = Range Not Satisfiable — offset is beyond the result set, treat as empty page
  const is416 = (e: { code?: string } | null) => e?.code === "PGRST103";
  if (assignedRes.error && !is416(assignedRes.error)) throw assignedRes.error;
  if (createdRes.error && !is416(createdRes.error)) throw createdRes.error;

  // Deduplicate (a ticket can be both assigned to and created by the user)
  const seen = new Set<string>();
  const tickets: Ticket[] = [];
  for (const raw of [...(assignedRes.data ?? []), ...(createdRes.data ?? [])]) {
    if (seen.has(raw.id)) continue;
    seen.add(raw.id);
    tickets.push(normalizeTicket(raw));
  }

  // Total = max of the two counts (upper bound; actual is lower due to dedup)
  // On 416 errors, count is null — preserve previous count by using 0
  const assignedCount = is416(assignedRes.error) ? 0 : (assignedRes.count ?? 0);
  const createdCount = is416(createdRes.error) ? 0 : (createdRes.count ?? 0);
  const total = Math.max(assignedCount, createdCount);

  return { tickets, total, page };
}

// ── Hydration hook — paginated, incremental store sync ──

/**
 * Fetch tickets assigned to or created by `userId` in pages.
 * First 50 load immediately; remaining pages hydrate in the background.
 * Uses mergeTickets (not setTickets) so project-scoped data is preserved.
 */
export function useHydrateMyTickets(userId: string) {
  const syncedPageCountRef = useRef(0);
  const syncedUserRef = useRef<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["my-tickets", userId],
    queryFn: async ({ pageParam }) => {
      return fetchMyTicketsPage(userId, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = (lastPage.page + 1) * MY_TICKETS_PAGE_SIZE;
      // Stop when this page returned fewer tickets than the page size
      return lastPage.tickets.length >= MY_TICKETS_PAGE_SIZE &&
        fetched < lastPage.total
        ? lastPage.page + 1
        : undefined;
    },
    enabled: !!userId,
  });

  const pages = query.data?.pages;
  const pageCount = pages?.length ?? 0;

  // Incrementally merge pages into the store.
  // Uses mergeTickets (not setTickets) to preserve tickets from other projects.
  useEffect(() => {
    if (!pages || pageCount === 0) return;

    // Reset sync tracking when the user changes
    if (syncedUserRef.current !== userId) {
      syncedUserRef.current = userId;
      syncedPageCountRef.current = 0;
    }

    const alreadySynced = syncedPageCountRef.current;
    if (pageCount <= alreadySynced) return;

    const newTickets: Ticket[] = [];
    for (let i = alreadySynced; i < pageCount; i++) {
      for (const t of pages[i].tickets) {
        newTickets.push(t);
      }
    }

    if (newTickets.length > 0) {
      useTicketStore.getState().mergeTickets(newTickets);
    }
    syncedPageCountRef.current = pageCount;
  }, [pages, pageCount, userId]);

  // Auto-fetch remaining pages in the background
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

// ── User activity hook — React Query only (not stored in Zustand) ──

/**
 * Fetch recent activity log entries for a user across all projects.
 * Returns raw React Query result — activity logs are read-only display data.
 */
export function useUserActivity(userId: string) {
  return useQuery({
    queryKey: ["user-activity", userId],
    queryFn: async (): Promise<
      (ActivityLog & { ticket?: { id: string; title: string } })[]
    > => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, user:profiles!activity_log_user_id_fkey(id,name,avatar_url,role,created_at), ticket:tickets(id, title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}
