"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useHydrateNotifications,
  useStoreNotifications,
  useStoreUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  formatNotification,
} from "@/lib/hooks/use-notifications";
import { useRealtimeNotifications } from "@/lib/hooks/use-realtime";
import { useWorkspaceNav } from "@/lib/hooks/use-workspace-nav";
import { EmptyState, BellIcon } from "@/components/empty-state";
import type { Notification } from "@/types";

// ── Types ──

type Tab = "all" | "unread";

// ── Date grouping utility (from my-issues/page.tsx) ──

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

// ── Flatten grouped notifications into virtualizable rows ──

type VirtualRow =
  | { type: "header"; label: string }
  | { type: "notification"; notification: Notification };

function flattenGroups(notifications: Notification[]): VirtualRow[] {
  if (notifications.length === 0) return [];
  const groups = groupByDate(notifications, (n) => n.created_at);
  const sections = [
    { label: "Today", items: groups.today },
    { label: "Yesterday", items: groups.yesterday },
    { label: "This Week", items: groups.thisWeek },
    { label: "Earlier", items: groups.earlier },
  ];
  const rows: VirtualRow[] = [];
  for (const section of sections) {
    if (section.items.length === 0) continue;
    rows.push({ type: "header", label: section.label });
    for (const n of section.items) {
      rows.push({ type: "notification", notification: n });
    }
  }
  return rows;
}

// ── Helpers ──

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

function NotificationTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "ticket_assigned":
      return (
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      );
    case "comment_added":
      return (
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      );
    case "mentioned":
      return (
        <svg
          className="w-4 h-4 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"
          />
        </svg>
      );
    case "status_changed":
      return (
        <svg
          className="w-4 h-4 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
      );
    case "priority_changed":
      return (
        <svg
          className="w-4 h-4 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-4 h-4 text-content-muted"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      );
  }
}

// ── Skeleton ──

function InboxSkeleton() {
  return (
    <div className="animate-pulse space-y-1 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-6 py-2">
          <div className="w-2 h-2 rounded-full bg-surface-tertiary" />
          <div className="w-4 h-4 rounded bg-surface-tertiary" />
          <div className="flex-1 h-3.5 rounded bg-surface-tertiary" />
          <div className="w-8 h-3 rounded bg-surface-tertiary" />
        </div>
      ))}
    </div>
  );
}

// ── Page component ──

export default function InboxPage() {
  const { user } = useAuth();
  const { isLoading, isError } = useHydrateNotifications();
  const notifications = useStoreNotifications();
  const unreadCount = useStoreUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useRealtimeNotifications(user?.id);

  const { openTicket } = useWorkspaceNav();

  const [tab, setTab] = useState<Tab>("all");

  const filteredNotifications = useMemo(
    () =>
      tab === "unread" ? notifications.filter((n) => !n.read) : notifications,
    [notifications, tab],
  );

  const rows = useMemo(
    () => flattenGroups(filteredNotifications),
    [filteredNotifications],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index].type === "header" ? 28 : 42),
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const handleNotificationClick = useCallback(
    (n: Notification) => {
      if (!n.read) markRead.mutate(n.id);
      if (n.ticket_id) openTicket(n.ticket_id);
    },
    [markRead, openTicket],
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-4 sm:px-6 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-13 font-medium text-content-primary">Inbox</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-[12px] text-accent hover:opacity-80 active:opacity-70 disabled:opacity-50 rounded transition-colors duration-[120ms] cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-1.5 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-full transition-colors ${
              tab === t.key
                ? "bg-active text-content-primary"
                : "text-content-muted hover:text-content-secondary hover:bg-hover"
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
        <InboxSkeleton />
      ) : isError ? (
        <div className="text-center py-4 text-red-500 text-sm">
          <p>
            Failed to load notifications. Check your connection and try again.
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="w-10 h-10" />}
          title={
            tab === "unread"
              ? "No unread notifications"
              : "No notifications yet"
          }
          description={
            tab === "unread"
              ? "You're all caught up."
              : "Notifications will appear here when someone assigns you a ticket, comments, or mentions you."
          }
        />
      ) : (
        <div ref={scrollRef} className="overflow-y-auto flex-1">
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          >
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
                    <h3 className="text-[11px] font-medium text-content-muted uppercase tracking-wider px-6 pt-2 pb-1">
                      {row.label}
                    </h3>
                  </div>
                );
              }

              const n = row.notification;

              return (
                <div
                  key={n.id}
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
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-center gap-2.5 px-6 py-2 text-left border-b border-border-subtle hover:bg-hover active:bg-hover transition-colors duration-[120ms] ${
                      !n.read ? "bg-accent-soft" : ""
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="w-2 flex-shrink-0 flex justify-center">
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>

                    {/* Type icon */}
                    <div className="flex-shrink-0">
                      <NotificationTypeIcon type={n.type} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-13 text-content-primary truncate">
                        {formatNotification(n)}
                      </p>
                      {n.ticket && (
                        <p className="text-[12px] text-content-muted truncate">
                          {(n.ticket as { title: string }).title}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-[11px] text-content-muted flex-shrink-0">
                      {formatRelativeTime(n.created_at)}
                    </span>

                    {/* Mark read button */}
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate(n.id);
                        }}
                        className="flex-shrink-0 p-1 text-content-muted hover:text-accent rounded-full transition-colors duration-[120ms] cursor-pointer"
                        title="Mark as read"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </button>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TicketSidePanel removed — now at layout level */}
    </div>
  );
}
