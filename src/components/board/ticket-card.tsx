"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import Link from "next/link";
import {
  PriorityIcon,
  StatusCircle,
} from "@/components/tickets/ticket-list-view";
import { IssueTypeIcon } from "@/components/tickets/issue-type-picker";
import { StoryPointsBadge } from "@/components/tickets/story-points-picker";
import { AvatarStack } from "@/components/tickets/assignee-picker";
import { useUpdateTicket, useDeleteTicket } from "@/lib/hooks/use-tickets";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { useContextMenu, type ContextMenuItem } from "@/components/context-menu";
import { TICKET_PRIORITIES } from "@/types";
import type { Ticket } from "@/types";

function shortId(id: string) {
  return `T-${id.slice(0, 4).toUpperCase()}`;
}

function formatCreatedDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `Created ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export const TicketCard = memo(function TicketCard({
  ticket,
  isDragging,
  onTicketClick,
  isFlashing,
}: {
  ticket: Ticket;
  isDragging?: boolean;
  onTicketClick?: (ticketId: string) => void;
  isFlashing?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: ticket.id });
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const workflow = useProjectWorkflow(ticket.project_id);

  const { onContextMenu, contextMenu } = useContextMenu(() => {
    const statusItems: ContextMenuItem[] = workflow.statuses.map((s) => ({
      type: "item" as const,
      label: s.label,
      icon: <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />,
      onClick: () => updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, status: s.key }),
    }));
    const priorityItems: ContextMenuItem[] = TICKET_PRIORITIES.map((p) => ({
      type: "item" as const,
      label: p.label,
      onClick: () => updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, priority: p.value }),
    }));
    return [
      { type: "item", label: "Copy ID", onClick: () => navigator.clipboard.writeText(shortId(ticket.id)) },
      { type: "item", label: "Copy link", onClick: () => navigator.clipboard.writeText(`${window.location.origin}/ticket/${ticket.id}`) },
      { type: "separator" },
      { type: "submenu", label: "Set status", items: statusItems },
      { type: "submenu", label: "Set priority", items: priorityItems },
      { type: "separator" },
      { type: "item", label: "Open in new tab", onClick: () => window.open(`/ticket/${ticket.id}`, "_blank") },
      { type: "separator" },
      { type: "item", label: "Delete", danger: true, onClick: () => deleteTicket.mutate({ id: ticket.id, project_id: ticket.project_id }) },
    ];
  });

  // Overlay = floating ghost in DragOverlay; placeholder = faded card left in column
  const isOverlay = isDragging;
  const isPlaceholder = isSortableDragging;

  const style = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
      : undefined,
    transition: transition ?? undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      className={`group bg-surface-primary rounded-lg border px-3 py-2.5 cursor-grab active:cursor-grabbing outline-none ${
        isOverlay
          ? "scale-[1.03] rotate-[1.5deg] border-accent/40 bg-surface-primary z-50 shadow-lg ring-1 ring-accent/10"
          : isPlaceholder
            ? "opacity-20 border-dashed border-border-subtle bg-surface-secondary"
            : "card-interactive border-border-subtle shadow-xs hover:border-border-medium active:scale-[0.97]"
      } ${isFlashing ? "animate-flash" : ""}`}
    >
      {/* Row 1: ticket ID ... assignee avatar */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-content-muted font-medium">
          {shortId(ticket.id)}
        </span>
        <div className="flex-shrink-0">
          {ticket.assignees && ticket.assignees.length > 0 ? (
            <AvatarStack
              assignees={ticket.assignees.map((a) => a.user).filter(Boolean)}
              max={3}
            />
          ) : ticket.assignee ? (
            <AvatarStack assignees={[ticket.assignee]} max={1} />
          ) : null}
        </div>
      </div>

      {/* Row 2: status circle + title */}
      <div className="flex items-start gap-1.5 mb-1">
        <div className="flex-shrink-0 mt-0.5">
          <StatusCircle status={ticket.status} />
        </div>
        {onTicketClick ? (
          <button
            type="button"
            className="text-sm leading-snug font-medium text-content-primary group-hover:text-content-primary block truncate text-left w-full focus-visible:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onTicketClick(ticket.id);
            }}
          >
            {ticket.title}
          </button>
        ) : (
          <Link
            href={`/ticket/${ticket.id}`}
            className="text-sm leading-snug font-medium text-content-primary group-hover:text-content-primary block truncate focus-visible:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.title}
          </Link>
        )}
      </div>

      {/* Row 3: issue type + priority bars + story points + labels */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <IssueTypeIcon type={ticket.issue_type ?? "task"} />
        <PriorityIcon priority={ticket.priority} />
        <StoryPointsBadge points={ticket.story_points ?? null} />
        {ticket.labels && ticket.labels.length > 0 && (
          <>
            {ticket.labels.map((label) => (
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
          </>
        )}
      </div>

      {/* Row 4: created date */}
      <p className="text-[10px] text-content-muted mt-1.5">
        {formatCreatedDate(ticket.created_at)}
      </p>
      {contextMenu}
    </div>
  );
});
