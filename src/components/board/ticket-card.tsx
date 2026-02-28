'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { PriorityIcon, StatusCircle } from '@/components/tickets/ticket-list-view';
import { IssueTypeIcon } from '@/components/tickets/issue-type-picker';
import { StoryPointsBadge } from '@/components/tickets/story-points-picker';
import type { Ticket } from '@/types';

function shortId(id: string) {
  return `T-${id.slice(0, 4).toUpperCase()}`;
}

function formatCreatedDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `Created ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function TicketCard({
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

  // Overlay = floating ghost in DragOverlay; placeholder = faded card left in column
  const isOverlay = isDragging;
  const isPlaceholder = isSortableDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-surface-tertiary rounded-sm border px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all duration-[120ms] ease-out outline-none ${
        isOverlay
          ? 'scale-[1.03] rotate-[1.5deg] border-blue-300 bg-surface-tertiary z-50'
          : isPlaceholder
          ? 'opacity-30 border-dashed border-border-subtle bg-surface-secondary'
          : 'border-border-subtle hover:border-content-muted hover:-translate-y-px hover:bg-hover active:scale-[0.98]'
      } ${isFlashing ? 'animate-flash' : ''}`}
    >
      {/* Row 1: ticket ID ... assignee avatar */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-content-muted font-medium">{shortId(ticket.id)}</span>
        {ticket.assignee && (
          <div className="flex-shrink-0">
            {ticket.assignee.avatar_url ? (
              <img
                src={ticket.assignee.avatar_url}
                alt={ticket.assignee.name}
                className="w-[18px] h-[18px] rounded-full"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-surface-secondary flex items-center justify-center">
                <span className="text-[10px] font-medium text-content-muted">
                  {ticket.assignee.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
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
        <IssueTypeIcon type={ticket.issue_type ?? 'task'} />
        <PriorityIcon priority={ticket.priority} />
        <StoryPointsBadge points={ticket.story_points ?? null} />
        {ticket.labels && ticket.labels.length > 0 && (
          <>
            {ticket.labels.map((label) => (
              <span
                key={label.id}
                className="px-1.5 py-px rounded text-[10px] font-medium leading-tight"
                style={{ backgroundColor: label.color + '15', color: label.color }}
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
    </div>
  );
}
