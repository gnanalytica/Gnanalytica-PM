'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import type { Ticket, TicketPriority } from '@/types';

const priorityColor: Record<TicketPriority, string> = {
  urgent: 'bg-[#c27070]',
  high: 'bg-[#c48a5a]',
  medium: 'bg-[#c9a04e]',
  low: 'bg-[#6b7280]',
};

function shortId(id: string) {
  return `PM-${id.slice(0, 4).toUpperCase()}`;
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
      className={`group bg-surface-tertiary rounded-sm border px-2 py-1 cursor-grab active:cursor-grabbing transition-all duration-[120ms] ease-out outline-none ${
        isOverlay
          ? 'scale-[1.03] rotate-[1.5deg] border-blue-300 bg-surface-tertiary z-50'
          : isPlaceholder
          ? 'opacity-30 border-dashed border-border-subtle bg-surface-secondary'
          : 'border-border-subtle hover:border-content-muted hover:-translate-y-px hover:bg-hover active:scale-[0.98]'
      } ${isFlashing ? 'animate-flash' : ''}`}
    >
      {/* Row 1: priority + ticket ID ... assignee avatar */}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[ticket.priority]}`} />
          <span className="text-xs text-content-muted font-medium">{shortId(ticket.id)}</span>
        </div>
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

      {/* Row 2: title */}
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

      {/* Row 3: labels (only if present) */}
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1">
          {ticket.labels.map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-px rounded text-[10px] font-medium leading-tight"
              style={{ backgroundColor: label.color + '15', color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
