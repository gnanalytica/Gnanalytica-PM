"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { ActivityLog } from "@/types";

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
  issue_type?: string;
  story_points?: number | null;
  start_date?: string | null;
  milestone_id?: string | null;
  epic_id?: string | null;
  parent_id?: string | null;
};

// ── Core logging helper ──

/**
 * Insert one or more activity_log rows in a single round-trip.
 * Accepts userId directly — callers in mutations already have it,
 * so we avoid redundant auth.getUser() calls.
 */
export async function logActivities(entries: ActivityEntry[]) {
  if (entries.length === 0) return;
  await supabase.from("activity_log").insert(entries);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await logActivities([
    {
      ticket_id,
      user_id: user.id,
      action,
      field: field ?? null,
      old_value: old_value ?? null,
      new_value: new_value ?? null,
    },
  ]);
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
  action: "created" | "updated",
  oldState: TicketSnapshot,
  newState: TicketSnapshot,
) {
  const entries: ActivityEntry[] = [];
  const base = { ticket_id: ticketId, user_id: userId };

  if (action === "created") {
    entries.push({
      ...base,
      action: "ticket_created",
      field: null,
      old_value: null,
      new_value: null,
    });
  }

  // Status change
  if (newState.status !== undefined && newState.status !== oldState.status) {
    entries.push({
      ...base,
      action: "status_changed",
      field: "status",
      old_value: oldState.status ?? null,
      new_value: newState.status,
    });
  }

  // Priority change
  if (
    newState.priority !== undefined &&
    newState.priority !== oldState.priority
  ) {
    entries.push({
      ...base,
      action: "priority_changed",
      field: "priority",
      old_value: oldState.priority ?? null,
      new_value: newState.priority,
    });
  }

  // Assignee change
  if (
    newState.assignee_id !== undefined &&
    newState.assignee_id !== oldState.assignee_id
  ) {
    entries.push({
      ...base,
      action: "assignee_changed",
      field: "assignee_id",
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
        action: "label_changed",
        field: "labels",
        old_value: (oldState.label_ids ?? []).join(",") || null,
        new_value: newState.label_ids.join(",") || null,
      });
    }
  }

  // Issue type change
  if (
    newState.issue_type !== undefined &&
    newState.issue_type !== oldState.issue_type
  ) {
    entries.push({
      ...base,
      action: "issue_type_changed",
      field: "issue_type",
      old_value: oldState.issue_type ?? null,
      new_value: newState.issue_type,
    });
  }

  // Story points change
  if (
    newState.story_points !== undefined &&
    newState.story_points !== oldState.story_points
  ) {
    entries.push({
      ...base,
      action: "story_points_changed",
      field: "story_points",
      old_value:
        oldState.story_points != null ? String(oldState.story_points) : null,
      new_value:
        newState.story_points != null ? String(newState.story_points) : null,
    });
  }

  // Start date change
  if (
    newState.start_date !== undefined &&
    newState.start_date !== oldState.start_date
  ) {
    entries.push({
      ...base,
      action: "start_date_changed",
      field: "start_date",
      old_value: oldState.start_date ?? null,
      new_value: newState.start_date ?? null,
    });
  }

  // Milestone change
  if (
    newState.milestone_id !== undefined &&
    newState.milestone_id !== oldState.milestone_id
  ) {
    entries.push({
      ...base,
      action: "milestone_changed",
      field: "milestone_id",
      old_value: oldState.milestone_id ?? null,
      new_value: newState.milestone_id ?? null,
    });
  }

  // Epic change
  if (newState.epic_id !== undefined && newState.epic_id !== oldState.epic_id) {
    entries.push({
      ...base,
      action: "epic_changed",
      field: "epic_id",
      old_value: oldState.epic_id ?? null,
      new_value: newState.epic_id ?? null,
    });
  }

  // Parent change
  if (
    newState.parent_id !== undefined &&
    newState.parent_id !== oldState.parent_id
  ) {
    entries.push({
      ...base,
      action: "parent_changed",
      field: "parent_id",
      old_value: oldState.parent_id ?? null,
      new_value: newState.parent_id ?? null,
    });
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
      .from("tickets")
      .select(
        "status, priority, assignee_id, issue_type, story_points, start_date, milestone_id, epic_id, parent_id",
      )
      .eq("id", ticketId)
      .single(),
    supabase.from("ticket_labels").select("label_id").eq("ticket_id", ticketId),
  ]);

  return {
    status: ticket?.status ?? undefined,
    priority: ticket?.priority ?? undefined,
    assignee_id: ticket?.assignee_id ?? null,
    label_ids: labels?.map((l: { label_id: string }) => l.label_id) ?? [],
    issue_type: ticket?.issue_type ?? undefined,
    story_points: ticket?.story_points ?? null,
    start_date: ticket?.start_date ?? null,
    milestone_id: ticket?.milestone_id ?? null,
    epic_id: ticket?.epic_id ?? null,
    parent_id: ticket?.parent_id ?? null,
  };
}

// ── React Query hooks (unchanged) ──

export function useActivityLog(ticketId: string) {
  return useQuery({
    queryKey: ["activity-log", ticketId],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, ticket_id, user_id, action, field, old_value, new_value, created_at, user:profiles(id, name, avatar_url, role, created_at)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ActivityLog[];
    },
    enabled: !!ticketId,
  });
}

export function useInvalidateActivityLog() {
  const queryClient = useQueryClient();
  return (ticketId: string) => {
    queryClient.invalidateQueries({ queryKey: ["activity-log", ticketId] });
  };
}
