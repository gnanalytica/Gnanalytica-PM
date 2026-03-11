"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useProjectTickets, useFlashIds } from "@/lib/hooks/use-tickets";
import { useMembers } from "@/lib/hooks/use-members";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { usePrefetch } from "@/lib/hooks/use-prefetch";
import { TICKET_PRIORITIES, ISSUE_TYPES, STATUS_EMOJI, PRIORITY_EMOJI } from "@/types";
import { LinearIssueRow } from "@/components/tickets/linear-issue-row";
import {
  EmptyState,
  ClipboardIcon,
  FunnelIcon,
} from "@/components/empty-state";
import { useLabels } from "@/lib/hooks/use-labels";
import type { Ticket, TicketPriority, ViewFilters, GroupByKey } from "@/types";

// ── Visual maps ──

export const DEFAULT_STATUS_ICON: Record<
  string,
  { color: string; bg: string }
> = {
  backlog: { color: "text-[#6b7280]", bg: "bg-[#6b7280]" },
  todo: { color: "text-[#8b919a]", bg: "bg-[#8b919a]" },
  in_progress: { color: "text-[#6e9ade]", bg: "bg-[#6e9ade]" },
  in_review: { color: "text-[#a78bfa]", bg: "bg-[#a78bfa]" },
  done: { color: "text-[#5fae7e]", bg: "bg-[#5fae7e]" },
  canceled: { color: "text-[#c27070]", bg: "bg-[#c27070]" },
};

const FALLBACK_STATUS_ICON = { color: "text-[#8b919a]", bg: "bg-[#8b919a]" };

export function getStatusIcon(status: string): { color: string; bg: string } {
  return DEFAULT_STATUS_ICON[status] ?? FALLBACK_STATUS_ICON;
}

// ── Linear-style priority bar icons ──

export function PriorityIcon({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case "urgent":
      return (
        <svg
          className="w-3.5 h-3.5 text-[#c27070]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case "high":
      return (
        <svg
          className="w-3.5 h-3.5 text-[#c48a5a]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3 4.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Zm3-1a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5Zm3-2a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case "medium":
      return (
        <svg
          className="w-3.5 h-3.5 text-[#c9a04e]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3 6.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5Zm3-2a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case "low":
      return (
        <svg
          className="w-3.5 h-3.5 text-content-muted"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3 8.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V9a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
  }
}

// ── Status circle component ──

export function StatusCircle({ status }: { status: string }) {
  const si = getStatusIcon(status);
  if (status === "done") {
    return (
      <svg
        className={`w-3.5 h-3.5 ${si.color}`}
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle cx="8" cy="8" r="6" fill="currentColor" />
        <path
          d="M5.5 8l2 2 3-3.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "canceled") {
    return (
      <svg
        className={`w-3.5 h-3.5 ${si.color}`}
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle cx="8" cy="8" r="6" fill="currentColor" />
        <path
          d="M5.5 8h5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // Default: hollow circle with colored border
  const colorMap: Record<string, string> = {
    backlog: "#6b7280",
    todo: "#8b919a",
    in_progress: "#6e9ade",
    in_review: "#a78bfa",
  };
  const strokeColor = colorMap[status] ?? "#8b919a";
  const isDashed = status === "backlog";
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeDasharray={isDashed ? "3 2" : undefined}
      />
      {status === "in_progress" && (
        <path
          d="M8 2.5A5.5 5.5 0 0 1 13.5 8"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ── Sorting ──

export type SortKey =
  | "id"
  | "title"
  | "status"
  | "priority"
  | "assignee"
  | "updated_at"
  | "created_at"
  | "due_date";
export type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};
const DEFAULT_STATUS_ORDER: Record<string, number> = {
  backlog: 0,
  todo: 1,
  in_progress: 2,
  in_review: 3,
  done: 4,
  canceled: 5,
};

function compareTickets(
  a: Ticket,
  b: Ticket,
  key: SortKey,
  dir: SortDir,
): number {
  let cmp = 0;
  switch (key) {
    case "id":
      cmp = a.id.localeCompare(b.id);
      break;
    case "title":
      cmp = a.title.localeCompare(b.title);
      break;
    case "status":
      cmp =
        (DEFAULT_STATUS_ORDER[a.status] ?? 99) -
        (DEFAULT_STATUS_ORDER[b.status] ?? 99);
      break;
    case "priority":
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      break;
    case "assignee":
      cmp = (a.assignee?.name ?? "zzz").localeCompare(
        b.assignee?.name ?? "zzz",
      );
      break;
    case "updated_at":
      cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      break;
    case "created_at":
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      break;
    case "due_date": {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      cmp = ad - bd;
      break;
    }
  }
  return dir === "asc" ? cmp : -cmp;
}

// ── Helpers ──

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Filter helpers ──

function hasActiveFilters(filters: ViewFilters): boolean {
  return (
    (filters.status?.length ?? 0) > 0 ||
    (filters.priority?.length ?? 0) > 0 ||
    (filters.assignee_ids?.length ?? 0) > 0 ||
    (filters.label_ids?.length ?? 0) > 0 ||
    (filters.issue_type?.length ?? 0) > 0 ||
    !!filters.milestone_id ||
    filters.has_assignee !== undefined ||
    !!filters.is_overdue
  );
}

function activeFilterCount(filters: ViewFilters): number {
  let count = 0;
  if (filters.status?.length) count++;
  if (filters.priority?.length) count++;
  if (filters.assignee_ids?.length) count++;
  if (filters.label_ids?.length) count++;
  if (filters.issue_type?.length) count++;
  if (filters.milestone_id) count++;
  if (filters.has_assignee !== undefined) count++;
  if (filters.is_overdue) count++;
  return count;
}

function applyFilters(tickets: Ticket[], filters: ViewFilters): Ticket[] {
  return tickets.filter((t) => {
    if (filters.status?.length && !filters.status.includes(t.status))
      return false;
    if (filters.priority?.length && !filters.priority.includes(t.priority))
      return false;
    if (filters.assignee_ids?.length) {
      const ticketAssigneeIds = t.assignees?.map((a) => a.user?.id).filter(Boolean) as string[] ?? [];
      const hasMatch = ticketAssigneeIds.some((id) => filters.assignee_ids!.includes(id)) ||
        (t.assignee_id && filters.assignee_ids.includes(t.assignee_id));
      if (!hasMatch) return false;
    }
    if (filters.label_ids?.length) {
      const ticketLabelIds = t.labels?.map((l) => l.id) ?? [];
      if (!filters.label_ids.some((id) => ticketLabelIds.includes(id))) return false;
    }
    if (filters.issue_type?.length) {
      if (!filters.issue_type.includes(t.issue_type ?? "task")) return false;
    }
    if (filters.milestone_id) {
      if (t.milestone_id !== filters.milestone_id) return false;
    }
    if (filters.has_assignee === true) {
      if (!t.assignee_id && !(t.assignees?.length)) return false;
    }
    if (filters.has_assignee === false) {
      if (t.assignee_id || (t.assignees?.length ?? 0) > 0) return false;
    }
    if (filters.is_overdue) {
      if (!t.due_date) return false;
      if (new Date(t.due_date + "T23:59:59") >= new Date()) return false;
    }
    return true;
  });
}

// ── Filter bar component ──

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated_at", label: "Last updated" },
  { key: "created_at", label: "Created" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
  { key: "due_date", label: "Due date" },
  { key: "status", label: "Status" },
];

function FilterBar({
  filters,
  onFiltersChange,
  workflowStatuses,
  projectId,
  sortKey,
  sortDir,
  onSortChange,
}: {
  filters: ViewFilters;
  onFiltersChange: (filters: ViewFilters) => void;
  workflowStatuses: { key: string; label: string }[];
  projectId: string;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (key: SortKey, dir: SortDir) => void;
}) {
  const { data: members } = useMembers();
  const { data: labels } = useLabels(projectId);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const toggleStatus = (status: string) => {
    const current = filters.status ?? [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: next.length ? next : undefined });
  };

  const togglePriority = (priority: TicketPriority) => {
    const current = filters.priority ?? [];
    const next = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    onFiltersChange({ ...filters, priority: next.length ? next : undefined });
  };

  const toggleAssignee = (id: string) => {
    const current = filters.assignee_ids ?? [];
    const next = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    onFiltersChange({
      ...filters,
      assignee_ids: next.length ? next : undefined,
    });
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border-subtle rounded-lg mb-1.5 text-[11px] relative flex-wrap">
      <span className="text-content-muted font-medium mr-1">Filters</span>

      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("status")}
          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
            filters.status?.length
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
          }`}
        >
          Status{filters.status?.length ? ` (${filters.status.length})` : ""}
        </button>
        {openDropdown === "status" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
              {workflowStatuses.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(s.key) ?? false}
                    onChange={() => toggleStatus(s.key)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary">
                    {STATUS_EMOJI[s.key] ?? ""} {s.label}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Priority dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("priority")}
          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
            filters.priority?.length
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
          }`}
        >
          Priority
          {filters.priority?.length ? ` (${filters.priority.length})` : ""}
        </button>
        {openDropdown === "priority" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
              {TICKET_PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(p.value) ?? false}
                    onChange={() => togglePriority(p.value)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary">
                    {PRIORITY_EMOJI[p.value] ?? ""} {p.label}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignee dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("assignee")}
          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
            filters.assignee_ids?.length
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
          }`}
        >
          Assignee
          {filters.assignee_ids?.length
            ? ` (${filters.assignee_ids.length})`
            : ""}
        </button>
        {openDropdown === "assignee" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[160px] max-h-[200px] overflow-y-auto shadow-xl">
              {members?.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.assignee_ids?.includes(m.id) ?? false}
                    onChange={() => toggleAssignee(m.id)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary truncate">
                    {m.name}
                  </span>
                </label>
              ))}
              {(!members || members.length === 0) && (
                <p className="px-3 py-1 text-[11px] text-content-muted">
                  No members
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Label filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("label")}
          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
            filters.label_ids?.length
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
          }`}
        >
          Label{filters.label_ids?.length ? ` (${filters.label_ids.length})` : ""}
        </button>
        {openDropdown === "label" && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[160px] max-h-[200px] overflow-y-auto shadow-xl">
              {labels?.map((l) => (
                <label key={l.id} className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer transition-all duration-150">
                  <input
                    type="checkbox"
                    checked={filters.label_ids?.includes(l.id) ?? false}
                    onChange={() => {
                      const current = filters.label_ids ?? [];
                      const next = current.includes(l.id) ? current.filter((id) => id !== l.id) : [...current, l.id];
                      onFiltersChange({ ...filters, label_ids: next.length ? next : undefined });
                    }}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-[11px] text-content-secondary truncate">{l.name}</span>
                </label>
              ))}
              {(!labels || labels.length === 0) && (
                <p className="px-3 py-1 text-[11px] text-content-muted">No labels</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Type filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("type")}
          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
            filters.issue_type?.length
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
          }`}
        >
          Type{filters.issue_type?.length ? ` (${filters.issue_type.length})` : ""}
        </button>
        {openDropdown === "type" && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
              {ISSUE_TYPES.map((it) => (
                <label key={it.value} className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer transition-all duration-150">
                  <input
                    type="checkbox"
                    checked={filters.issue_type?.includes(it.value) ?? false}
                    onChange={() => {
                      const current = filters.issue_type ?? [];
                      const next = current.includes(it.value) ? current.filter((v) => v !== it.value) : [...current, it.value];
                      onFiltersChange({ ...filters, issue_type: next.length ? next : undefined });
                    }}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary">{it.icon} {it.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sort */}
      {onSortChange && (
        <>
          <div className="h-3 w-px bg-border-subtle mx-0.5" />
          <div className="relative">
            <button
              onClick={() => toggleDropdown("sort")}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.96] ${
                sortKey && sortKey !== "updated_at"
                  ? "bg-accent-soft border-accent/30 text-accent"
                  : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
              }`}
            >
              Sort: {SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "Updated"}
              {sortDir === "asc" ? " \u2191" : " \u2193"}
            </button>
            {openDropdown === "sort" && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setOpenDropdown(null)}
                />
                <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[160px] shadow-xl">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        if (sortKey === s.key) {
                          onSortChange(s.key, sortDir === "asc" ? "desc" : "asc");
                        } else {
                          onSortChange(s.key, "desc");
                        }
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] hover:bg-hover transition-all duration-150 active:scale-[0.96] ${
                        sortKey === s.key
                          ? "text-accent font-medium"
                          : "text-content-secondary"
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortKey === s.key && (
                        <span className="text-[9px] text-content-muted">
                          {sortDir === "asc" ? "A\u2192Z" : "Z\u2192A"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Clear all */}
      {hasActiveFilters(filters) && (
        <button
          onClick={clearAll}
          className="ml-1 px-1.5 py-0.5 text-[11px] text-content-muted hover:text-content-secondary active:scale-[0.96] transition-all duration-150"
        >
          Clear ({activeFilterCount(filters)})
        </button>
      )}
    </div>
  );
}

// ── Row height ──

const ROW_HEIGHT = 44;

// ── Main component ──

export function TicketListView({
  projectId,
  onTicketClick,
  selectedTicketId,
  filters,
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,

  onSortChange,
  onFiltersChange,
  filterTicketIds,
  isFetchingMore,
  totalCount,
  loadedCount,
  groupBy,
  selectedIds,
  onSelectionChange,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  /** Currently selected ticket ID — used to highlight the active row. */
  selectedTicketId?: string | null;
  filters?: ViewFilters;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (key: SortKey, dir: SortDir) => void;
  onFiltersChange?: (filters: ViewFilters) => void;
  /** When set, only show tickets whose ids are in this set (e.g. cycle filter). */
  filterTicketIds?: Set<string> | null;
  /** True while additional pages are loading from the server. */
  isFetchingMore?: boolean;
  /** Total ticket count on the server (null until first page loads). */
  totalCount?: number | null;
  /** Number of tickets loaded into the store so far. */
  loadedCount?: number;
  groupBy?: GroupByKey;
  /** Controlled multi-select state */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const allTickets = useProjectTickets(projectId);
  const tickets = filterTicketIds
    ? allTickets.filter((t) => filterTicketIds.has(t.id))
    : allTickets;
  // Internal state as fallback when not controlled
  const [internalSortKey] = useState<SortKey>("updated_at");
  const [internalSortDir] = useState<SortDir>("desc");
  const [internalFilters, setInternalFilters] = useState<ViewFilters>({});

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const sortKey = controlledSortKey ?? internalSortKey;
  const sortDir = controlledSortDir ?? internalSortDir;
  const activeFilters = filters ?? internalFilters;

  const flashIds = useFlashIds();
  const workflow = useProjectWorkflow(projectId);
  const { prefetchTicket } = usePrefetch();

  // Multi-select
  const selectionEnabled = !!onSelectionChange;
  const checkedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  const handleCheckToggle = useCallback(
    (ticketId: string) => {
      if (!onSelectionChange) return;
      const next = checkedSet.has(ticketId)
        ? (selectedIds ?? []).filter((id) => id !== ticketId)
        : [...(selectedIds ?? []), ticketId];
      onSelectionChange(next);
    },
    [checkedSet, selectedIds, onSelectionChange],
  );

  const handleFiltersChange = useCallback(
    (newFilters: ViewFilters) => {
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      } else {
        setInternalFilters(newFilters);
      }
    },
    [onFiltersChange],
  );

  const filtered = useMemo(
    () => applyFilters(tickets, activeFilters),
    [tickets, activeFilters],
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareTickets(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const allIds = sorted.map((t) => t.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => checkedSet.has(id));
    onSelectionChange(allSelected ? [] : allIds);
  }, [sorted, checkedSet, onSelectionChange]);

  // ── Grouping ──
  const groups = useMemo(() => {
    if (!groupBy || groupBy === "none") {
      return [{ key: "__all__", label: "", tickets: sorted }];
    }

    const map = new Map<string, { key: string; label: string; tickets: Ticket[] }>();

    for (const ticket of sorted) {
      let groupKey: string;
      let groupLabel: string;

      switch (groupBy) {
        case "status":
          groupKey = ticket.status;
          groupLabel = workflow.getStatusLabel(ticket.status);
          break;
        case "priority":
          groupKey = ticket.priority;
          groupLabel = ticket.priority[0].toUpperCase() + ticket.priority.slice(1);
          break;
        case "assignee":
          groupKey = ticket.assignee_id ?? "__unassigned__";
          groupLabel = ticket.assignee?.name ?? "Unassigned";
          break;
        case "issue_type":
          groupKey = ticket.issue_type ?? "task";
          groupLabel = (ticket.issue_type ?? "task")[0].toUpperCase() + (ticket.issue_type ?? "task").slice(1);
          break;
        case "milestone":
          groupKey = ticket.milestone_id ?? "__none__";
          groupLabel = ticket.milestone?.name ?? "No Milestone";
          break;
        default:
          groupKey = "__all__";
          groupLabel = "";
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, { key: groupKey, label: groupLabel, tickets: [] });
      }
      map.get(groupKey)!.tickets.push(ticket);
    }

    return Array.from(map.values());
  }, [sorted, groupBy, workflow]);

  // ── Virtualizer ──
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardIcon className="w-10 h-10" />}
        title={
          filterTicketIds?.size ? "No tickets in this cycle" : "No issues yet"
        }
        description={
          filterTicketIds?.size
            ? "Add issues to the cycle to track them here."
            : "Create your first issue to get started."
        }
      />
    );
  }

  // Total count for non-grouped flat list
  const flatCount = groups.reduce((sum, g) => {
    if (collapsedGroups.has(g.key)) return sum;
    return sum + g.tickets.length;
  }, 0);

  return (
    <div>
      <FilterBar
        filters={activeFilters}
        onFiltersChange={handleFiltersChange}
        workflowStatuses={workflow.statuses}
        projectId={projectId}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={onSortChange}
      />

      <div
        className="rounded-sm overflow-hidden flex flex-col"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        {/* Select-all header */}
        {selectionEnabled && sorted.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border-subtle bg-surface-secondary flex-shrink-0">
            <div
              onClick={handleSelectAll}
              className="cursor-pointer"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-150 ${
                  sorted.length > 0 && sorted.every((t) => checkedSet.has(t.id))
                    ? "bg-accent border-accent"
                    : checkedSet.size > 0
                      ? "bg-accent/40 border-accent/60"
                      : "border-border-subtle hover:border-content-muted"
                }`}
              >
                {sorted.length > 0 && sorted.every((t) => checkedSet.has(t.id)) ? (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : checkedSet.size > 0 ? (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                ) : null}
              </div>
            </div>
            <span className="text-[11px] text-content-muted">
              {checkedSet.size > 0
                ? `${checkedSet.size} of ${sorted.length} selected`
                : "Select all"}
            </span>
          </div>
        )}

        {/* Scrollable area */}
        <div ref={scrollRef} className="overflow-y-auto flex-1">
          {sorted.length === 0 ? (
            <EmptyState
              icon={<FunnelIcon className="w-8 h-8" />}
              title="No results"
              description="Try adjusting your filters to find what you're looking for."
              compact
            />
          ) : groupBy && groupBy !== "none" ? (
            /* ── Grouped rendering ── */
            <div>
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.key);
                return (
                  <div key={group.key}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border-b border-border-subtle hover:bg-hover transition-all duration-150 active:scale-[0.99] sticky top-0 z-[5]"
                    >
                      <svg
                        className={`w-3 h-3 text-content-muted transition-transform duration-150 ${isCollapsed ? "" : "rotate-90"}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      <span className="text-[12px] font-medium text-content-primary">
                        {group.label}
                      </span>
                      <span className="text-[11px] text-content-muted">
                        {group.tickets.length}
                      </span>
                    </button>
                    {/* Group items */}
                    {!isCollapsed && (
                      <div>
                        {group.tickets.map((ticket) => (
                          <div key={ticket.id} style={{ height: ROW_HEIGHT }}>
                            <LinearIssueRow
                              ticket={ticket}
                              isSelected={selectedTicketId === ticket.id}
                              isFlashing={!!flashIds[ticket.id]}
                              showCheckbox={selectionEnabled}
                              isChecked={checkedSet.has(ticket.id)}
                              onCheckToggle={handleCheckToggle}
                              onClick={() => onTicketClick?.(ticket.id)}
                              onMouseEnter={() => prefetchTicket(ticket.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Flat virtualized rendering ── */
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const ticket = sorted[virtualRow.index];
                return (
                  <div
                    key={ticket.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: ROW_HEIGHT,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <LinearIssueRow
                      ticket={ticket}
                      isSelected={selectedTicketId === ticket.id}
                      isFlashing={!!flashIds[ticket.id]}
                      showCheckbox={selectionEnabled}
                      isChecked={checkedSet.has(ticket.id)}
                      onCheckToggle={handleCheckToggle}
                      onClick={() => onTicketClick?.(ticket.id)}
                      onMouseEnter={() => prefetchTicket(ticket.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — issue count */}
        <div className="border-t border-border-subtle px-3 py-1 flex-shrink-0">
          <span className="text-[11px] text-content-muted">
            {sorted.length === tickets.length
              ? `${tickets.length} issue${tickets.length !== 1 ? "s" : ""}`
              : `${sorted.length} of ${tickets.length} issue${tickets.length !== 1 ? "s" : ""}`}
            {isFetchingMore && (
              <span className="ml-2 text-content-muted">
                Loading more ({loadedCount ?? 0}
                {totalCount != null ? ` of ${totalCount}` : ""})...
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
