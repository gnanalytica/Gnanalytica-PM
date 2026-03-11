"use client";

import {
  useSLAPolicies,
  computeSLAStatus,
  formatDuration,
} from "@/lib/hooks/use-sla";
import type { Ticket } from "@/types";

export function SLABadge({ ticket }: { ticket: Ticket }) {
  const { data: policies } = useSLAPolicies(ticket.project_id);
  if (!policies || policies.length === 0) return null;

  const sla = computeSLAStatus(ticket, policies);
  if (!sla) return null;

  // Don't show for completed/canceled
  const isClosed =
    ticket.status_category === "completed" ||
    ticket.status_category === "canceled";

  const responseColor = sla.responseBreached
    ? "text-red-500 bg-red-500/10"
    : sla.responseRemaining < sla.responseTarget * 0.25
      ? "text-amber-500 bg-amber-500/10"
      : "text-emerald-500 bg-emerald-500/10";

  const resolutionColor = sla.resolutionBreached
    ? "text-red-500 bg-red-500/10"
    : sla.resolutionRemaining < sla.resolutionTarget * 0.25
      ? "text-amber-500 bg-amber-500/10"
      : "text-emerald-500 bg-emerald-500/10";

  return (
    <div className="flex items-center gap-1.5">
      {/* Response SLA */}
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${ticket.first_response_at ? "text-content-muted bg-surface-secondary" : responseColor}`}
      >
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
        {ticket.first_response_at
          ? "Responded"
          : isClosed
            ? "No response"
            : formatDuration(Math.max(0, sla.responseRemaining))}
      </div>

      {/* Resolution SLA */}
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${ticket.resolved_at ? "text-content-muted bg-surface-secondary" : resolutionColor}`}
      >
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        {ticket.resolved_at
          ? "Resolved"
          : isClosed
            ? "-"
            : formatDuration(Math.max(0, sla.resolutionRemaining))}
      </div>
    </div>
  );
}
