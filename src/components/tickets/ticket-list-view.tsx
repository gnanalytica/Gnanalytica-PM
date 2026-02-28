'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useProjectTickets, useFlashIds } from '@/lib/hooks/use-tickets';
import { useMembers } from '@/lib/hooks/use-members';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { usePrefetch } from '@/lib/hooks/use-prefetch';
import { TICKET_PRIORITIES } from '@/types';
import { EmptyState, ClipboardIcon, FunnelIcon } from '@/components/empty-state';
import type { Ticket, TicketPriority, ViewFilters } from '@/types';

// ── Visual maps ──

export const DEFAULT_STATUS_ICON: Record<string, { color: string; bg: string }> = {
  backlog: { color: 'text-[#6b7280]', bg: 'bg-[#6b7280]' },
  todo: { color: 'text-[#8b919a]', bg: 'bg-[#8b919a]' },
  in_progress: { color: 'text-[#6e9ade]', bg: 'bg-[#6e9ade]' },
  done: { color: 'text-[#5fae7e]', bg: 'bg-[#5fae7e]' },
  canceled: { color: 'text-[#c27070]', bg: 'bg-[#c27070]' },
};

const FALLBACK_STATUS_ICON = { color: 'text-[#8b919a]', bg: 'bg-[#8b919a]' };

export function getStatusIcon(status: string): { color: string; bg: string } {
  return DEFAULT_STATUS_ICON[status] ?? FALLBACK_STATUS_ICON;
}

// ── Linear-style priority bar icons ──

export function PriorityIcon({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case 'urgent':
      return (
        <svg className="w-3.5 h-3.5 text-[#c27070]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Zm3 0a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case 'high':
      return (
        <svg className="w-3.5 h-3.5 text-[#c48a5a]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 4.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Zm3-1a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5Zm3-2a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case 'medium':
      return (
        <svg className="w-3.5 h-3.5 text-[#c9a04e]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 6.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5Zm3-2a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
    case 'low':
      return (
        <svg className="w-3.5 h-3.5 text-content-muted" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 8.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V9a.5.5 0 0 1 .5-.5Z" />
        </svg>
      );
  }
}

// ── Status circle component ──

export function StatusCircle({ status }: { status: string }) {
  const si = getStatusIcon(status);
  if (status === 'done') {
    return (
      <svg className={`w-3.5 h-3.5 ${si.color}`} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
        <path d="M5.5 8l2 2 3-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'canceled') {
    return (
      <svg className={`w-3.5 h-3.5 ${si.color}`} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
        <path d="M5.5 8h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // Default: hollow circle with colored border
  const colorMap: Record<string, string> = {
    backlog: '#6b7280',
    todo: '#8b919a',
    in_progress: '#6e9ade',
  };
  const strokeColor = colorMap[status] ?? '#8b919a';
  const isDashed = status === 'backlog';
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeDasharray={isDashed ? '3 2' : undefined}
      />
      {status === 'in_progress' && (
        <path d="M8 2.5A5.5 5.5 0 0 1 13.5 8" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ── Sorting ──

export type SortKey = 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'updated_at';
export type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const DEFAULT_STATUS_ORDER: Record<string, number> = { backlog: 0, todo: 1, in_progress: 2, done: 3, canceled: 4 };

function compareTickets(a: Ticket, b: Ticket, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case 'id':
      cmp = a.id.localeCompare(b.id);
      break;
    case 'title':
      cmp = a.title.localeCompare(b.title);
      break;
    case 'status':
      cmp = (DEFAULT_STATUS_ORDER[a.status] ?? 99) - (DEFAULT_STATUS_ORDER[b.status] ?? 99);
      break;
    case 'priority':
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      break;
    case 'assignee':
      cmp = (a.assignee?.name ?? 'zzz').localeCompare(b.assignee?.name ?? 'zzz');
      break;
    case 'updated_at':
      cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      break;
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ── Helpers ──

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Filter helpers ──

function hasActiveFilters(filters: ViewFilters): boolean {
  return (
    (filters.status?.length ?? 0) > 0 ||
    (filters.priority?.length ?? 0) > 0 ||
    (filters.assignee_ids?.length ?? 0) > 0
  );
}

function activeFilterCount(filters: ViewFilters): number {
  let count = 0;
  if (filters.status?.length) count++;
  if (filters.priority?.length) count++;
  if (filters.assignee_ids?.length) count++;
  return count;
}

function applyFilters(tickets: Ticket[], filters: ViewFilters): Ticket[] {
  return tickets.filter((t) => {
    if (filters.status?.length && !filters.status.includes(t.status)) return false;
    if (filters.priority?.length && !filters.priority.includes(t.priority)) return false;
    if (filters.assignee_ids?.length) {
      if (!t.assignee_id || !filters.assignee_ids.includes(t.assignee_id)) return false;
    }
    return true;
  });
}

// ── Filter bar component ──

function FilterBar({
  filters,
  onFiltersChange,
  workflowStatuses,
}: {
  filters: ViewFilters;
  onFiltersChange: (filters: ViewFilters) => void;
  workflowStatuses: { key: string; label: string }[];
}) {
  const { data: members } = useMembers();
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
    onFiltersChange({ ...filters, assignee_ids: next.length ? next : undefined });
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-secondary border border-border-subtle rounded-md mb-1 text-[11px] relative">
      <span className="text-content-muted font-medium mr-1">Filters</span>

      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('status')}
          className={`px-2 py-0.5 rounded border text-[11px] transition-colors ${
            filters.status?.length
              ? 'bg-accent-soft border-accent/30 text-accent'
              : 'bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted'
          }`}
        >
          Status{filters.status?.length ? ` (${filters.status.length})` : ''}
        </button>
        {openDropdown === 'status' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute top-full left-0 mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[140px]">
              {workflowStatuses.map((s) => (
                <label key={s.key} className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(s.key) ?? false}
                    onChange={() => toggleStatus(s.key)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary">{s.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Priority dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('priority')}
          className={`px-2 py-0.5 rounded border text-[11px] transition-colors ${
            filters.priority?.length
              ? 'bg-accent-soft border-accent/30 text-accent'
              : 'bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted'
          }`}
        >
          Priority{filters.priority?.length ? ` (${filters.priority.length})` : ''}
        </button>
        {openDropdown === 'priority' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute top-full left-0 mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[140px]">
              {TICKET_PRIORITIES.map((p) => (
                <label key={p.value} className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(p.value) ?? false}
                    onChange={() => togglePriority(p.value)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary">{p.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignee dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('assignee')}
          className={`px-2 py-0.5 rounded border text-[11px] transition-colors ${
            filters.assignee_ids?.length
              ? 'bg-accent-soft border-accent/30 text-accent'
              : 'bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted'
          }`}
        >
          Assignee{filters.assignee_ids?.length ? ` (${filters.assignee_ids.length})` : ''}
        </button>
        {openDropdown === 'assignee' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute top-full left-0 mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
              {members?.map((m) => (
                <label key={m.id} className="flex items-center gap-2 px-3 py-1 hover:bg-hover cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.assignee_ids?.includes(m.id) ?? false}
                    onChange={() => toggleAssignee(m.id)}
                    className="rounded border-border-subtle text-accent w-3 h-3"
                  />
                  <span className="text-[11px] text-content-secondary truncate">{m.name}</span>
                </label>
              ))}
              {(!members || members.length === 0) && (
                <p className="px-3 py-1 text-[11px] text-content-muted">No members</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Clear all */}
      {hasActiveFilters(filters) && (
        <button
          onClick={clearAll}
          className="ml-1 px-1.5 py-0.5 text-[11px] text-content-muted hover:text-content-secondary transition-colors"
        >
          Clear ({activeFilterCount(filters)})
        </button>
      )}
    </div>
  );
}

// ── Row height ──

const ROW_HEIGHT = 36;

// ── Main component ──

export function TicketListView({
  projectId,
  onTicketClick,
  filters,
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSortChange,
  onFiltersChange,
  filterTicketIds,
  isFetchingMore,
  totalCount,
  loadedCount,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
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
}) {
  const allTickets = useProjectTickets(projectId);
  const tickets = filterTicketIds
    ? allTickets.filter((t) => filterTicketIds.has(t.id))
    : allTickets;
  // Internal state as fallback when not controlled
  const [internalSortKey] = useState<SortKey>('updated_at');
  const [internalSortDir] = useState<SortDir>('desc');
  const [internalFilters, setInternalFilters] = useState<ViewFilters>({});

  const sortKey = controlledSortKey ?? internalSortKey;
  const sortDir = controlledSortDir ?? internalSortDir;
  const activeFilters = filters ?? internalFilters;

  const flashIds = useFlashIds();
  const workflow = useProjectWorkflow(projectId);
  const { prefetchTicket } = usePrefetch();

  const handleFiltersChange = useCallback((newFilters: ViewFilters) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  }, [onFiltersChange]);

  const filtered = useMemo(
    () => applyFilters(tickets, activeFilters),
    [tickets, activeFilters],
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareTickets(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  );

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
        title={filterTicketIds?.size ? 'No tickets in this cycle' : 'No issues yet'}
        description={filterTicketIds?.size ? 'Add issues to the cycle to track them here.' : 'Create your first issue to get started.'}
      />
    );
  }

  return (
    <div>
      <FilterBar filters={activeFilters} onFiltersChange={handleFiltersChange} workflowStatuses={workflow.statuses} />

      <div className="rounded-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {/* Virtualized scroll area */}
        <div ref={scrollRef} className="overflow-y-auto flex-1">
          {sorted.length === 0 ? (
            <EmptyState
              icon={<FunnelIcon className="w-8 h-8" />}
              title="No results"
              description="Try adjusting your filters to find what you're looking for."
              compact
            />
          ) : (
            <div
              style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const ticket = sorted[virtualRow.index];
                return (
                  <div
                    key={ticket.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: ROW_HEIGHT,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onMouseEnter={() => prefetchTicket(ticket.id)}
                    className={`flex items-center border-b border-border-subtle hover:bg-hover active:bg-hover transition-colors duration-[120ms] ${flashIds[ticket.id] ? 'animate-flash' : ''}`}
                  >
                    {/* Status circle */}
                    <div className="pl-3 pr-2 flex-shrink-0">
                      <StatusCircle status={ticket.status} />
                    </div>

                    {/* ID */}
                    <span className="text-[11px] text-content-muted font-mono flex-shrink-0 mr-2">{shortId(ticket.id)}</span>

                    {/* Title */}
                    <button
                      onClick={() => onTicketClick?.(ticket.id)}
                      className="text-[13px] text-content-primary font-medium truncate flex-1 min-w-0 text-left transition-colors focus-visible:text-accent"
                    >
                      {ticket.title}
                    </button>

                    {/* Priority */}
                    <div className="flex-shrink-0 ml-3">
                      <PriorityIcon priority={ticket.priority} />
                    </div>

                    {/* Assignee avatar */}
                    <div className="flex-shrink-0 ml-2.5">
                      {ticket.assignee ? (
                        ticket.assignee.avatar_url ? (
                          <img src={ticket.assignee.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center">
                            <span className="text-[9px] font-medium text-content-muted">
                              {(ticket.assignee.name ?? '?')[0].toUpperCase()}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                    </div>

                    {/* Updated */}
                    <span className="text-[11px] text-content-muted flex-shrink-0 w-12 text-right pr-3 ml-2">
                      {relativeTime(ticket.updated_at)}
                    </span>
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
              ? `${tickets.length} issue${tickets.length !== 1 ? 's' : ''}`
              : `${sorted.length} of ${tickets.length} issue${tickets.length !== 1 ? 's' : ''}`}
            {isFetchingMore && (
              <span className="ml-2 text-content-muted">
                Loading more ({loadedCount ?? 0}{totalCount != null ? ` of ${totalCount}` : ''})...
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
