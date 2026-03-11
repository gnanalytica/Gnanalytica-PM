"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useHydrateMyTickets,
  useUserActivity,
} from "@/lib/hooks/use-my-tickets";
import { useAssignedTickets, useCreatedTickets } from "@/lib/hooks/use-tickets";
import { useWorkspaceNav } from "@/lib/hooks/use-workspace-nav";
import { EmptyState, ClipboardIcon, ClockIcon } from "@/components/empty-state";
import { MyIssueListSkeleton } from "@/components/skeletons";
import {
  PriorityIcon,
  StatusCircle,
} from "@/components/tickets/ticket-list-view";
import { avatarColor } from "@/components/tickets/assignee-picker";
import type { Ticket, ActivityLog } from "@/types";

// ── Constants ──

type Tab = "assigned" | "created" | "activity";

const ACTION_LABELS: Record<string, string> = {
  ticket_created: "created ticket",
  status_changed: "changed status",
  assignee_changed: "changed assignee",
  comment_added: "commented on",
};

// ── Date grouping utility ──

type DateGroups<T> = {
  today: T[];
  yesterday: T[];
  thisWeek: T[];
  earlier: T[];
};

function groupByDate<T>(
  items: T[],
  dateKey: (item: T) => string,
): DateGroups<T> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - todayStart.getDay());

  const groups: DateGroups<T> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const item of items) {
    const d = new Date(dateKey(item));
    if (d >= todayStart) {
      groups.today.push(item);
    } else if (d >= yesterdayStart) {
      groups.yesterday.push(item);
    } else if (d >= weekStart) {
      groups.thisWeek.push(item);
    } else {
      groups.earlier.push(item);
    }
  }

  return groups;
}

// ── Flatten grouped data into virtualizable rows ──

type VirtualTicketRow =
  | { type: "header"; label: string; count: number }
  | { type: "ticket"; ticket: Ticket };
type VirtualActivityRow =
  | { type: "header"; label: string; count: number }
  | {
      type: "activity";
      entry: ActivityLog & { ticket?: { id: string; title: string } };
    };

function flattenTicketGroups(tickets: Ticket[]): VirtualTicketRow[] {
  if (tickets.length === 0) return [];
  const groups = groupByDate(tickets, (t) => t.updated_at);
  const sections: { label: string; items: Ticket[] }[] = [
    { label: "Today", items: groups.today },
    { label: "Yesterday", items: groups.yesterday },
    { label: "This Week", items: groups.thisWeek },
    { label: "Earlier", items: groups.earlier },
  ];
  const rows: VirtualTicketRow[] = [];
  for (const section of sections) {
    if (section.items.length === 0) continue;
    rows.push({
      type: "header",
      label: section.label,
      count: section.items.length,
    });
    for (const ticket of section.items) {
      rows.push({ type: "ticket", ticket });
    }
  }
  return rows;
}

function flattenActivityGroups(
  entries: (ActivityLog & { ticket?: { id: string; title: string } })[],
): VirtualActivityRow[] {
  if (entries.length === 0) return [];
  const groups = groupByDate(entries, (e) => e.created_at);
  const sections = [
    { label: "Today", items: groups.today },
    { label: "Yesterday", items: groups.yesterday },
    { label: "This Week", items: groups.thisWeek },
    { label: "Earlier", items: groups.earlier },
  ];
  const rows: VirtualActivityRow[] = [];
  for (const section of sections) {
    if (section.items.length === 0) continue;
    rows.push({
      type: "header",
      label: section.label,
      count: section.items.length,
    });
    for (const entry of section.items) {
      rows.push({ type: "activity", entry });
    }
  }
  return rows;
}

// ── Sub-components ──

function LoadingSkeleton() {
  return <MyIssueListSkeleton />;
}

// ── Helpers ──

function ticketShortId(id: string) {
  return `T-${id.slice(0, 4).toUpperCase()}`;
}

function formatDescriptiveDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `Updated on ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Virtualized ticket list with date grouping ──

function VirtualizedTicketList({
  tickets,
  onTicketClick,
}: {
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
}) {
  const rows = useMemo(() => flattenTicketGroups(tickets), [tickets]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index].type === "header" ? 32 : 40),
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  if (tickets.length === 0) return null;

  return (
    <div ref={scrollRef} className="overflow-y-auto flex-1">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];

          if (row.type === "header") {
            return (
              <div
                key={`header-${row.label}`}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex items-center gap-2 px-6 pt-3 pb-1">
                  <svg
                    className="w-3 h-3 text-content-muted"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                  <span className="text-[12px] font-medium text-content-secondary">
                    {row.label}
                  </span>
                  <span className="text-[11px] text-content-muted flex items-center gap-0.5">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      opacity="0.5"
                    >
                      <path d="M8 3l5 9H3z" />
                    </svg>
                    {row.count}
                  </span>
                </div>
              </div>
            );
          }

          const ticket = row.ticket;

          return (
            <div
              key={ticket.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                onClick={() => onTicketClick(ticket.id)}
                className="w-full flex items-center px-6 py-2 text-left border-b border-border-subtle hover:bg-hover active:bg-hover transition-colors duration-[120ms]"
              >
                {/* Priority bars icon */}
                <div className="flex-shrink-0 mr-2">
                  <PriorityIcon priority={ticket.priority} />
                </div>

                {/* Ticket ID */}
                <span className="text-[11px] text-content-muted font-mono flex-shrink-0 mr-2">
                  {ticketShortId(ticket.id)}
                </span>

                {/* Status circle */}
                <div className="flex-shrink-0 mr-2">
                  <StatusCircle status={ticket.status} />
                </div>

                {/* Title */}
                <span className="text-[13px] text-content-primary font-medium truncate flex-1 min-w-0">
                  {ticket.title}
                </span>

                {/* Labels as pills */}
                {ticket.labels && ticket.labels.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0 ml-3">
                    {ticket.labels.slice(0, 2).map((label) => (
                      <span
                        key={label.id}
                        className="px-1.5 py-px rounded text-[10px] font-medium leading-tight"
                        style={{
                          backgroundColor: label.color + "15",
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Assignee avatar */}
                <div className="flex-shrink-0 ml-2.5">
                  {ticket.assignee ? (
                    ticket.assignee.avatar_url ? (
                      <Image
                        src={ticket.assignee.avatar_url}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${avatarColor(ticket.assignee.id)} flex items-center justify-center`}>
                        <span className="text-[9px] font-semibold text-white drop-shadow-sm">
                          {(ticket.assignee.name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </div>

                {/* Descriptive date */}
                <span className="text-[11px] text-content-muted flex-shrink-0 text-right ml-3 whitespace-nowrap">
                  {formatDescriptiveDate(ticket.updated_at)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Virtualized activity list with date grouping ──

function VirtualizedActivityList({
  entries,
  onEntryClick,
}: {
  entries: (ActivityLog & { ticket?: { id: string; title: string } })[];
  onEntryClick: (ticketId: string) => void;
}) {
  const rows = useMemo(() => flattenActivityGroups(entries), [entries]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index].type === "header" ? 32 : 34),
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  if (entries.length === 0) return null;

  return (
    <div ref={scrollRef} className="overflow-y-auto flex-1">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];

          if (row.type === "header") {
            return (
              <div
                key={`header-${row.label}`}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex items-center gap-2 px-6 pt-3 pb-1">
                  <svg
                    className="w-3 h-3 text-content-muted"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                  <span className="text-[12px] font-medium text-content-secondary">
                    {row.label}
                  </span>
                  <span className="text-[11px] text-content-muted flex items-center gap-0.5">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      opacity="0.5"
                    >
                      <path d="M8 3l5 9H3z" />
                    </svg>
                    {row.count}
                  </span>
                </div>
              </div>
            );
          }

          const entry = row.entry;
          const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;

          return (
            <div
              key={entry.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                onClick={() => entry.ticket && onEntryClick(entry.ticket.id)}
                className="w-full flex items-center gap-2 px-6 py-1.5 text-left hover:bg-hover active:bg-hover transition-colors duration-[120ms]"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-surface-tertiary" />
                <span className="text-[13px] text-content-secondary truncate flex-1">
                  <span className="text-content-primary">{actionLabel}</span>
                  {entry.ticket && (
                    <span className="text-content-muted">
                      {" "}
                      &middot; {entry.ticket.title}
                    </span>
                  )}
                  {entry.field === "status" &&
                    entry.old_value &&
                    entry.new_value && (
                      <span className="text-content-muted">
                        {" "}
                        ({entry.old_value} &rarr; {entry.new_value})
                      </span>
                    )}
                </span>
                <span className="text-[11px] text-content-muted flex-shrink-0">
                  {formatRelativeTime(entry.created_at)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page component ──

export default function MyIssuesPage() {
  const { profile, loading: authLoading } = useAuth();
  const userId = profile?.id ?? "";

  const {
    isLoading: ticketsLoading,
    isError,
    isFetchingNextPage,
    totalCount,
    loadedCount,
  } = useHydrateMyTickets(userId);
  const assignedTickets = useAssignedTickets(userId);
  const createdTickets = useCreatedTickets(userId);
  const { data: activity, isLoading: activityLoading } =
    useUserActivity(userId);

  const { openTicket } = useWorkspaceNav();

  const [tab, setTab] = useState<Tab>("assigned");

  // Show loading while auth is resolving or tickets are being fetched
  const isLoading = authLoading || ticketsLoading;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "assigned", label: "Assigned", count: assignedTickets.length },
    { key: "created", label: "Created", count: createdTickets.length },
    { key: "activity", label: "Activity" },
  ];

  const handleTicketClick = useCallback(
    (id: string) => openTicket(id),
    [openTicket],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-11 flex items-center px-4 sm:px-6 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-13 font-medium text-content-primary">My Issues</h1>
      </div>

      {/* Tab bar — bordered pill buttons */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-1.5 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-full border transition-colors ${
              tab === t.key
                ? "bg-content-primary/10 border-content-primary/20 text-content-primary"
                : "border-border-subtle text-content-muted hover:text-content-secondary hover:border-content-muted"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-[10px] text-content-muted tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="text-center py-4 text-red-500 text-sm">
          <p>Failed to load tickets. Check your connection and try again.</p>
        </div>
      ) : (
        <>
          {tab === "assigned" &&
            (assignedTickets.length > 0 ? (
              <VirtualizedTicketList
                tickets={assignedTickets}
                onTicketClick={handleTicketClick}
              />
            ) : (
              <EmptyState
                icon={<ClipboardIcon className="w-10 h-10" />}
                title="No tickets assigned to you"
                description="Issues assigned to you will appear here."
              />
            ))}

          {tab === "created" &&
            (createdTickets.length > 0 ? (
              <VirtualizedTicketList
                tickets={createdTickets}
                onTicketClick={handleTicketClick}
              />
            ) : (
              <EmptyState
                icon={<ClipboardIcon className="w-10 h-10" />}
                title="No tickets created"
                description="Issues you create will appear here."
              />
            ))}

          {tab === "activity" &&
            (activityLoading ? (
              <LoadingSkeleton />
            ) : activity && activity.length > 0 ? (
              <VirtualizedActivityList
                entries={activity}
                onEntryClick={handleTicketClick}
              />
            ) : (
              <EmptyState
                icon={<ClockIcon className="w-10 h-10" />}
                title="No recent activity"
                description="Your actions across all projects will appear here."
              />
            ))}
        </>
      )}

      {isFetchingNextPage && (
        <p className="text-center py-2 text-[11px] text-content-muted">
          Loading more ({loadedCount}
          {totalCount != null ? ` of ~${totalCount}` : ""})...
        </p>
      )}

      {/* TicketSidePanel removed — now at layout level */}
    </div>
  );
}
