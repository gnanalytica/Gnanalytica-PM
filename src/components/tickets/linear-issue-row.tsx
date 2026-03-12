"use client";

import { memo, useState, useCallback } from "react";
import {
  PriorityIcon,
  StatusCircle,
} from "@/components/tickets/ticket-list-view";
import { AvatarStack } from "@/components/tickets/assignee-picker";
import { useUpdateTicket, useDeleteTicket } from "@/lib/hooks/use-tickets";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { useContextMenu, type ContextMenuItem } from "@/components/context-menu";
import { InlineEditCell } from "@/components/tickets/inline-edit-cell";
import { QuickActionButtons } from "@/components/tickets/quick-action-buttons";
import { TICKET_PRIORITIES, STATUS_EMOJI, PRIORITY_EMOJI } from "@/types";
import type { Ticket, TicketPriority } from "@/types";

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function InlineDropdown({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="animate-dropdown-in absolute top-full left-0 mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-40 py-1.5 min-w-[180px] shadow-xl max-h-56 overflow-y-auto">
        {children}
      </div>
    </>
  );
}

export const LinearIssueRow = memo(function LinearIssueRow({
  ticket,
  isSelected,
  isFlashing,
  isChecked,
  showCheckbox,
  onCheckToggle,
  onClick,
  onMouseEnter,
}: {
  ticket: Ticket;
  isSelected: boolean;
  isFlashing?: boolean;
  isChecked?: boolean;
  showCheckbox?: boolean;
  onCheckToggle?: (ticketId: string) => void;
  onClick?: () => void;
  onMouseEnter?: () => void;
}) {
  const [activeDropdown, setActiveDropdown] = useState<"status" | "priority" | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const workflow = useProjectWorkflow(ticket.project_id);

  const { onContextMenu, contextMenu } = useContextMenu(() => {
    const statusItems: ContextMenuItem[] = workflow.statuses.map((s) => ({
      type: "item" as const,
      label: `${STATUS_EMOJI[s.key] ?? ""} ${s.label}`,
      icon: <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />,
      onClick: () => updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, status: s.key }),
    }));
    const priorityItems: ContextMenuItem[] = TICKET_PRIORITIES.map((p) => ({
      type: "item" as const,
      label: `${PRIORITY_EMOJI[p.value] ?? ""} ${p.label}`,
      onClick: () => updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, priority: p.value }),
    }));
    return [
      { type: "item", label: "Copy ID", icon: <CopyIcon />, onClick: () => navigator.clipboard.writeText(shortId(ticket.id)) },
      { type: "item", label: "Copy link", icon: <LinkIcon />, onClick: () => navigator.clipboard.writeText(`${window.location.origin}/ticket/${ticket.id}`) },
      { type: "separator" },
      { type: "submenu", label: "Set status", items: statusItems },
      { type: "submenu", label: "Set priority", items: priorityItems },
      { type: "separator" },
      { type: "item", label: "Open in new tab", onClick: () => window.open(`/ticket/${ticket.id}`, "_blank") },
      { type: "separator" },
      { type: "item", label: "Delete", danger: true, onClick: () => deleteTicket.mutate({ id: ticket.id, project_id: ticket.project_id }) },
    ];
  });

  const handleStatusChange = useCallback((status: string) => {
    updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, status });
    setActiveDropdown(null);
  }, [ticket.id, ticket.project_id, updateTicket]);

  const handlePriorityChange = useCallback((priority: TicketPriority) => {
    updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, priority });
    setActiveDropdown(null);
  }, [ticket.id, ticket.project_id, updateTicket]);

  const handleTitleSave = useCallback(async (value: string | number) => {
    await new Promise((resolve) => {
      updateTicket.mutate(
        { id: ticket.id, project_id: ticket.project_id, title: String(value) },
        { onSuccess: resolve, onError: resolve }
      );
    });
  }, [ticket.id, ticket.project_id, updateTicket]);

  const handleDueDateSave = useCallback(async (value: string | number) => {
    await new Promise((resolve) => {
      updateTicket.mutate(
        { id: ticket.id, project_id: ticket.project_id, due_date: value ? new Date(String(value)).toISOString() : null },
        { onSuccess: resolve, onError: resolve }
      );
    });
  }, [ticket.id, ticket.project_id, updateTicket]);

  const handleQuickAssign = useCallback(() => {
    // TODO: Open assignee picker
  }, []);

  const handleQuickDueDate = useCallback(() => {
    // TODO: Open date picker
  }, []);

  const handleQuickPriority = useCallback(() => {
    setActiveDropdown("priority");
  }, []);

  const handleQuickExpand = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const formatDueDate = (date: string | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div
      onMouseEnter={() => { setIsHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
      className={`group/row row-interactive flex items-center h-12 border-b border-border-subtle hover:bg-surface-secondary active:bg-surface-secondary/80 transition-all duration-[120ms] cursor-pointer px-4 gap-2 ${
        isSelected ? "issue-row-selected" : ""
      } ${isFlashing ? "animate-flash" : ""}`}
      onClick={onClick}
    >
      {/* Checkbox or Priority indicator */}
      {showCheckbox && (
        <div
          className="flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onCheckToggle?.(ticket.id); }}
        >
          <div
            className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer ${
              isChecked
                ? "bg-accent border-accent"
                : "border-content-muted/40 hover:border-content-muted bg-surface-primary"
            }`}
          >
            {isChecked && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Title — flex-grow with inline editing */}
      <div className="flex-1 min-w-0 py-1" onClick={(e) => e.stopPropagation()}>
        <InlineEditCell
          value={ticket.title}
          field="title"
          onSave={handleTitleSave}
          placeholder="Untitled"
          type="text"
        />
      </div>

      {/* Status badge — clickable with inline dropdown */}
      <div
        className="flex-shrink-0 relative w-20"
        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "status" ? null : "status"); }}
      >
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-all duration-100 ${
          activeDropdown === "status" ? "bg-surface-tertiary ring-1 ring-accent/30" : "hover:bg-surface-tertiary"
        }`}>
          <StatusCircle status={ticket.status} />
          <span className="text-content-secondary truncate">
            {workflow.getStatusLabel(ticket.status)}
          </span>
        </div>
        <InlineDropdown open={activeDropdown === "status"} onClose={() => setActiveDropdown(null)}>
          {workflow.statuses.map((s) => (
            <button
              key={s.key}
              onClick={(e) => { e.stopPropagation(); handleStatusChange(s.key); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-all duration-150 active:scale-[0.98] ${
                ticket.status === s.key ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-hover"
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200" style={{ backgroundColor: s.color }} />
              {STATUS_EMOJI[s.key] ?? ""} {s.label}
              {ticket.status === s.key && (
                <svg className="w-3 h-3 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </InlineDropdown>
      </div>

      {/* Assignee — clickable for inline editing */}
      <div className="flex-shrink-0 w-12" onClick={(e) => e.stopPropagation()}>
        {ticket.assignees && ticket.assignees.length > 0 ? (
          <AvatarStack
            assignees={ticket.assignees.map((a) => a.user).filter(Boolean)}
            max={1}
          />
        ) : ticket.assignee ? (
          <AvatarStack assignees={[ticket.assignee]} max={1} />
        ) : (
          <div className="text-[10px] text-content-muted px-1 py-0.5 rounded hover:bg-surface-tertiary transition-colors cursor-pointer">
            —
          </div>
        )}
      </div>

      {/* Priority icon — clickable for inline dropdown */}
      <div
        className="flex-shrink-0 w-10 relative"
        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "priority" ? null : "priority"); }}
      >
        <div className={`inline-flex items-center justify-center hover:bg-surface-tertiary rounded p-1 transition-all duration-100 cursor-pointer ${
          activeDropdown === "priority" ? "bg-surface-tertiary ring-1 ring-accent/30" : ""
        }`}>
          <PriorityIcon priority={ticket.priority} />
        </div>
        <InlineDropdown open={activeDropdown === "priority"} onClose={() => setActiveDropdown(null)}>
          {TICKET_PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={(e) => { e.stopPropagation(); handlePriorityChange(p.value); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-all duration-150 active:scale-[0.98] ${
                ticket.priority === p.value ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-hover"
              }`}
            >
              <PriorityIcon priority={p.value} />
              {PRIORITY_EMOJI[p.value] ?? ""} {p.label}
              {ticket.priority === p.value && (
                <svg className="w-3 h-3 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </InlineDropdown>
      </div>

      {/* Due date — inline editable with date input */}
      <div className="flex-shrink-0 w-20" onClick={(e) => e.stopPropagation()}>
        <InlineEditCell
          value={ticket.due_date ? formatDueDate(ticket.due_date) : ""}
          field="dueDate"
          onSave={handleDueDateSave}
          placeholder="—"
          type="date"
        />
      </div>

      {/* Quick action buttons — show on hover */}
      <div className="flex-shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
        <QuickActionButtons
          isVisible={isHovered}
          onAssignClick={handleQuickAssign}
          onDueDateClick={handleQuickDueDate}
          onPriorityClick={handleQuickPriority}
          onExpandClick={handleQuickExpand}
        />
      </div>

      {contextMenu}
    </div>
  );
});

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}
