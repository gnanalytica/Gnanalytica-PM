"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useActivityLog } from "@/lib/hooks/use-activity-log";
import { EmptyState, ClockIcon } from "@/components/empty-state";
import { avatarColor } from "@/components/tickets/assignee-picker";
import type { ActivityLog, WorkflowStatus } from "@/types";

// ── Helpers ──

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const DEFAULT_STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  canceled: "Canceled",
};

const DEFAULT_STATUS_DOT: Record<string, string> = {
  backlog: "bg-[#6b7280]",
  todo: "bg-[#8b919a]",
  in_progress: "bg-[#6e9ade]",
  done: "bg-[#5fae7e]",
  canceled: "bg-[#c27070]",
};

function buildStatusHelpers(workflowStatuses?: WorkflowStatus[]) {
  if (!workflowStatuses || workflowStatuses.length === 0) {
    return {
      getLabel: (v: string) => DEFAULT_STATUS_LABELS[v] ?? v,
      getDot: (v: string) => DEFAULT_STATUS_DOT[v] ?? "bg-[#8b919a]",
    };
  }
  const map = new Map(workflowStatuses.map((s) => [s.key, s]));
  return {
    getLabel: (v: string) => map.get(v)?.label ?? DEFAULT_STATUS_LABELS[v] ?? v,
    getDot: (v: string) => {
      const ws = map.get(v);
      if (ws) return `bg-[${ws.color}]`;
      return DEFAULT_STATUS_DOT[v] ?? "bg-[#8b919a]";
    },
  };
}

// ── Action descriptions ──

function ActionText({
  log,
  statusHelpers,
}: {
  log: ActivityLog;
  statusHelpers: ReturnType<typeof buildStatusHelpers>;
}) {
  switch (log.action) {
    case "ticket_created":
      return <span>created this ticket</span>;

    case "status_changed":
      return (
        <span>
          changed status to{" "}
          <span className="inline-flex items-center gap-1">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${statusHelpers.getDot(log.new_value ?? "")}`}
            />
            <span className="font-medium text-gray-800">
              {statusHelpers.getLabel(log.new_value ?? "")}
            </span>
          </span>
          {log.old_value && (
            <span className="text-gray-400">
              {" "}
              from {statusHelpers.getLabel(log.old_value)}
            </span>
          )}
        </span>
      );

    case "assignee_changed":
      return log.new_value ? (
        <span>assigned this ticket</span>
      ) : (
        <span>removed the assignee</span>
      );

    case "label_changed":
      return <span>updated labels</span>;

    case "comment_added":
      return <span>added a comment</span>;

    default:
      return <span>{log.action.replace(/_/g, " ")}</span>;
  }
}

// ── Action icon ──

function ActionIcon({ action }: { action: string }) {
  const base = "w-3.5 h-3.5";
  const props = {
    className: base,
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
  };

  switch (action) {
    case "ticket_created":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      );
    case "status_changed":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      );
    case "assignee_changed":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"
          />
        </svg>
      );
    case "label_changed":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 6h.008v.008H6V6Z"
          />
        </svg>
      );
    case "comment_added":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      );
  }
}

// ── Day grouping ──

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (d >= todayStart) return "Today";
  if (d >= yesterdayStart) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type DayGroup = { label: string; entries: ActivityLog[] };

function groupByDay(logs: ActivityLog[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;

  for (const log of logs) {
    const label = getDayLabel(log.created_at);
    if (!current || current.label !== label) {
      current = { label, entries: [] };
      groups.push(current);
    }
    current.entries.push(log);
  }

  return groups;
}

// ── Sub-components ──

function Avatar({
  name,
  avatarUrl,
  userId,
}: {
  name: string;
  avatarUrl?: string | null;
  userId?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={20}
        height={20}
        className="w-5 h-5 rounded-full object-cover"
      />
    );
  }
  return (
    <div className={`w-5 h-5 rounded-full ${avatarColor(userId ?? name)} flex items-center justify-center`}>
      <span className="text-[9px] font-semibold text-white drop-shadow-sm">
        {(name || "?")[0].toUpperCase()}
      </span>
    </div>
  );
}

function TimelineEntry({
  log,
  isLast,
  statusHelpers,
}: {
  log: ActivityLog;
  isLast: boolean;
  statusHelpers: ReturnType<typeof buildStatusHelpers>;
}) {
  return (
    <div className="flex gap-2.5 relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-gray-100" />
      )}

      {/* Avatar */}
      <div className="flex-shrink-0 relative z-10">
        <Avatar name={log.user?.name ?? ""} avatarUrl={log.user?.avatar_url} userId={log.user_id} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-800">
                {log.user?.name ?? "Unknown"}
              </span>{" "}
              <ActionText log={log} statusHelpers={statusHelpers} />
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-px">
            <span className="text-gray-300">
              <ActionIcon action={log.action} />
            </span>
            <time
              dateTime={log.created_at}
              className="text-[10px] text-gray-400 tabular-nums"
              title={new Date(log.created_at).toLocaleString()}
            >
              {getRelativeTime(log.created_at)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-gray-200/70 animate-shimmer rounded w-3/4" />
            <div className="h-2 bg-gray-100 animate-shimmer rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ──

export function ActivityTimeline({
  ticketId,
  workflowStatuses,
}: {
  ticketId: string;
  workflowStatuses?: WorkflowStatus[];
}) {
  const { data: logs, isLoading } = useActivityLog(ticketId);
  const statusHelpers = useMemo(
    () => buildStatusHelpers(workflowStatuses),
    [workflowStatuses],
  );

  const dayGroups = useMemo(
    () => (logs && logs.length > 0 ? groupByDay(logs) : []),
    [logs],
  );

  if (isLoading) return <LoadingSkeleton />;

  if (dayGroups.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon className="w-8 h-8" />}
        title="No activity yet"
        description="Changes to this ticket will appear here."
        compact
      />
    );
  }

  return (
    <div role="feed" aria-label="Activity timeline">
      {dayGroups.map((group) => (
        <div key={group.label}>
          <DayHeader label={group.label} />
          {group.entries.map((log, i) => (
            <TimelineEntry
              key={log.id}
              log={log}
              isLast={i === group.entries.length - 1}
              statusHelpers={statusHelpers}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
