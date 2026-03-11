"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "motion/react";
import { TicketCard } from "./ticket-card";
import { useCreateTicket, useFlashIds } from "@/lib/hooks/use-tickets";
import { StatusCircle } from "@/components/tickets/ticket-list-view";
import { STATUS_EMOJI } from "@/types";
import type { Ticket, StatusCategory } from "@/types";

export const KanbanColumn = memo(function KanbanColumn({
  id,
  title,
  tickets,
  projectId,
  defaultStatus,
  onTicketClick,
  isDragging,
  emoji,
  readOnly,
}: {
  id: string;
  title: string;
  tickets: Ticket[];
  projectId: string;
  defaultStatus?: string;
  onTicketClick?: (ticketId: string) => void;
  isDragging?: boolean;
  /** Emoji to show in the column header instead of the status emoji */
  emoji?: string;
  /** When true, hide the inline create input (used for non-status groupings) */
  readOnly?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);
  const createTicket = useCreateTicket();
  const flashIds = useFlashIds();

  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  const reset = useCallback(() => {
    setIsCreating(false);
    setNewTitle("");
  }, []);

  const handleSubmit = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const trimmed = newTitle.trim();
    if (!trimmed) {
      reset();
      return;
    }
    const lastTicket = tickets[tickets.length - 1];
    const position = lastTicket ? lastTicket.position + 1000 : 1000;
    createTicket.mutate({
      project_id: projectId,
      title: trimmed,
      status: defaultStatus,
      position,
    });
    setNewTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      cancelledRef.current = true;
      reset();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[75vw] sm:w-[272px] snap-center bg-surface-secondary rounded-xl p-2.5 transition-all duration-200 ease-out ${
        isOver ? "bg-accent-soft ring-1 ring-accent/20 scale-[1.005]" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {!emoji && <StatusCircle status={id} />}
          <h3 className="text-xs font-medium text-content-secondary">
            {emoji ?? (defaultStatus ? STATUS_EMOJI[defaultStatus] ?? "" : "")} {title}
          </h3>
          <span className="text-[11px] text-content-muted flex items-center gap-0.5">
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              opacity="0.5"
            >
              <path d="M8 3l5 9H3z" />
            </svg>
            {tickets.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-hover text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <circle cx="8" cy="3" r="1.2" />
              <circle cx="8" cy="8" r="1.2" />
              <circle cx="8" cy="13" r="1.2" />
            </svg>
          </button>
          {!readOnly && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-hover text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5 min-h-[32px]">
          <AnimatePresence initial={false} mode="popLayout">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                layoutId={isDragging ? undefined : `ticket-${ticket.id}`}
                layout="position"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{
                  layout: {
                    type: "tween",
                    duration: 0.15,
                    ease: [0.32, 0.72, 0, 1],
                  },
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                <TicketCard
                  ticket={ticket}
                  onTicketClick={onTicketClick}
                  isFlashing={!!flashIds[ticket.id]}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      {!readOnly && (
        isCreating ? (
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder="Issue title"
            className="mt-1.5 w-full bg-surface-primary border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-content-primary placeholder-content-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 shadow-xs"
          />
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="mt-1.5 w-full text-left px-2.5 py-1 text-xs text-content-muted hover:text-content-secondary rounded-lg hover:bg-hover transition-all duration-150 active:scale-[0.96]"
          >
            + New issue
          </button>
        )
      )}
    </div>
  );
});
