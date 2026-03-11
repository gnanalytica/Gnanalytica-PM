"use client";

import { useState } from "react";
import { useMembers } from "@/lib/hooks/use-members";
import { useProjectMilestones } from "@/lib/hooks/use-milestones";
import { TICKET_PRIORITIES, ISSUE_TYPES, STATUS_EMOJI, PRIORITY_EMOJI } from "@/types";
import type { ViewFilters, TicketPriority, IssueType } from "@/types";

type FilterDropdown =
  | "status"
  | "priority"
  | "assignee"
  | "issue_type"
  | "milestone"
  | "sort"
  | null;

type SortKey = "id" | "updated_at" | "created_at" | "priority" | "title" | "due_date" | "status" | "assignee";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated_at", label: "Last updated" },
  { key: "created_at", label: "Created" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
  { key: "due_date", label: "Due date" },
  { key: "status", label: "Status" },
];

export function UnifiedFilterBar({
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
  const milestones = useProjectMilestones(projectId);
  const [openDropdown, setOpenDropdown] = useState<FilterDropdown>(null);

  const toggleDropdown = (key: FilterDropdown) => {
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

  const toggleIssueType = (type: IssueType) => {
    const current = filters.issue_type ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, issue_type: next.length ? next : undefined });
  };

  const setMilestoneFilter = (milestoneId: string | undefined) => {
    onFiltersChange({ ...filters, milestone_id: milestoneId });
  };

  const toggleQuickFilter = (
    key: "has_assignee" | "is_overdue" | "my_tickets",
  ) => {
    onFiltersChange({ ...filters, [key]: filters[key] ? undefined : true });
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  const activeCount =
    (filters.status?.length ? 1 : 0) +
    (filters.priority?.length ? 1 : 0) +
    (filters.assignee_ids?.length ? 1 : 0) +
    (filters.issue_type?.length ? 1 : 0) +
    (filters.milestone_id ? 1 : 0) +
    (filters.has_assignee ? 1 : 0) +
    (filters.is_overdue ? 1 : 0) +
    (filters.my_tickets ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-secondary border border-border-subtle rounded-md mb-1 text-[11px] relative flex-wrap">
      <span className="text-content-muted font-medium mr-1">Filters</span>

      {/* Status */}
      <DropdownButton
        label="Status"
        count={filters.status?.length}
        isOpen={openDropdown === "status"}
        onClick={() => toggleDropdown("status")}
      />
      {openDropdown === "status" && (
        <DropdownPanel onClose={() => setOpenDropdown(null)}>
          {workflowStatuses.map((s) => (
            <CheckboxOption
              key={s.key}
              label={`${STATUS_EMOJI[s.key] ?? ""} ${s.label}`}
              checked={filters.status?.includes(s.key) ?? false}
              onChange={() => toggleStatus(s.key)}
            />
          ))}
        </DropdownPanel>
      )}

      {/* Priority */}
      <DropdownButton
        label="Priority"
        count={filters.priority?.length}
        isOpen={openDropdown === "priority"}
        onClick={() => toggleDropdown("priority")}
      />
      {openDropdown === "priority" && (
        <DropdownPanel onClose={() => setOpenDropdown(null)}>
          {TICKET_PRIORITIES.map((p) => (
            <CheckboxOption
              key={p.value}
              label={`${PRIORITY_EMOJI[p.value] ?? ""} ${p.label}`}
              checked={filters.priority?.includes(p.value) ?? false}
              onChange={() => togglePriority(p.value)}
            />
          ))}
        </DropdownPanel>
      )}

      {/* Assignee */}
      <DropdownButton
        label="Assignee"
        count={filters.assignee_ids?.length}
        isOpen={openDropdown === "assignee"}
        onClick={() => toggleDropdown("assignee")}
      />
      {openDropdown === "assignee" && (
        <DropdownPanel onClose={() => setOpenDropdown(null)} maxHeight>
          {members?.map((m) => (
            <CheckboxOption
              key={m.id}
              label={m.name}
              checked={filters.assignee_ids?.includes(m.id) ?? false}
              onChange={() => toggleAssignee(m.id)}
            />
          ))}
          {(!members || members.length === 0) && (
            <p className="px-3 py-1 text-[11px] text-content-muted">
              No members
            </p>
          )}
        </DropdownPanel>
      )}

      {/* Issue Type */}
      <DropdownButton
        label="Type"
        count={filters.issue_type?.length}
        isOpen={openDropdown === "issue_type"}
        onClick={() => toggleDropdown("issue_type")}
      />
      {openDropdown === "issue_type" && (
        <DropdownPanel onClose={() => setOpenDropdown(null)}>
          {ISSUE_TYPES.map((it) => (
            <CheckboxOption
              key={it.value}
              label={`${it.icon} ${it.label}`}
              checked={filters.issue_type?.includes(it.value) ?? false}
              onChange={() => toggleIssueType(it.value)}
            />
          ))}
        </DropdownPanel>
      )}

      {/* Milestone */}
      <DropdownButton
        label="Milestone"
        count={filters.milestone_id ? 1 : undefined}
        isOpen={openDropdown === "milestone"}
        onClick={() => toggleDropdown("milestone")}
      />
      {openDropdown === "milestone" && (
        <DropdownPanel onClose={() => setOpenDropdown(null)}>
          <button
            onClick={() => {
              setMilestoneFilter(undefined);
              setOpenDropdown(null);
            }}
            className={`block w-full text-left px-3 py-1 text-[11px] hover:bg-hover transition-all duration-150 active:scale-[0.96] ${!filters.milestone_id ? "text-accent font-medium" : "text-content-secondary"}`}
          >
            All
          </button>
          {milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMilestoneFilter(m.id);
                setOpenDropdown(null);
              }}
              className={`block w-full text-left px-3 py-1 text-[11px] hover:bg-hover transition-all duration-150 active:scale-[0.96] ${filters.milestone_id === m.id ? "text-accent font-medium" : "text-content-secondary"}`}
            >
              {m.name}
            </button>
          ))}
        </DropdownPanel>
      )}

      {/* Quick filters */}
      <div className="h-3 w-px bg-border-subtle mx-0.5" />
      <QuickChip
        label="Assigned"
        active={!!filters.has_assignee}
        onClick={() => toggleQuickFilter("has_assignee")}
      />
      <QuickChip
        label="Overdue"
        active={!!filters.is_overdue}
        onClick={() => toggleQuickFilter("is_overdue")}
      />
      <QuickChip
        label="My Issues"
        active={!!filters.my_tickets}
        onClick={() => toggleQuickFilter("my_tickets")}
      />

      {/* Sort */}
      {onSortChange && (
        <>
          <div className="h-3 w-px bg-border-subtle mx-0.5" />
          <DropdownButton
            label={`Sort: ${SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "Updated"}`}
            count={sortKey && sortKey !== "updated_at" ? 1 : undefined}
            isOpen={openDropdown === "sort"}
            onClick={() => toggleDropdown("sort")}
          />
          {openDropdown === "sort" && (
            <DropdownPanel onClose={() => setOpenDropdown(null)}>
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
                  className={`w-full flex items-center justify-between px-3 py-1 text-[11px] hover:bg-hover transition-all duration-150 active:scale-[0.96] ${
                    sortKey === s.key
                      ? "text-accent font-medium"
                      : "text-content-secondary"
                  }`}
                >
                  <span>{s.label}</span>
                  {sortKey === s.key && (
                    <span className="text-[9px] text-content-muted ml-2">
                      {sortDir === "asc" ? "A-Z" : "Z-A"}
                    </span>
                  )}
                </button>
              ))}
            </DropdownPanel>
          )}
        </>
      )}

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="ml-1 px-1.5 py-0.5 text-[11px] text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]"
        >
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}

function DropdownButton({
  label,
  count,
  isOpen,
  onClick,
}: {
  label: string;
  count?: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  const active = (count ?? 0) > 0 || isOpen;
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`px-2 py-0.5 rounded border text-[11px] transition-all duration-150 active:scale-[0.96] hover:shadow-xs ${
          active
            ? "bg-accent-soft border-accent/30 text-accent"
            : "bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted"
        }`}
      >
        {label}
        {count ? ` (${count})` : ""}
      </button>
    </div>
  );
}

function DropdownPanel({
  children,
  onClose,
  maxHeight,
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxHeight?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        className={`absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl shadow-xl animate-dropdown-in z-30 py-1 min-w-[140px] ${maxHeight ? "max-h-[200px] overflow-y-auto" : ""}`}
      >
        {children}
      </div>
    </>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-border-subtle text-accent w-3 h-3"
      />
      <span className="text-[11px] text-content-secondary">{label}</span>
    </label>
  );
}

function QuickChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-150 active:scale-[0.96] ${
        active
          ? "bg-accent text-white"
          : "bg-surface-tertiary text-content-muted hover:text-content-secondary"
      }`}
    >
      {label}
    </button>
  );
}
