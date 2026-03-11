"use client";

import { useState } from "react";
import { useUpdateMultipleTickets, useDeleteTicket } from "@/lib/hooks/use-tickets";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { TICKET_PRIORITIES, STATUS_EMOJI, PRIORITY_EMOJI } from "@/types";
import { useMembers } from "@/lib/hooks/use-members";
import type { TicketPriority } from "@/types";

export function BulkActionsBar({
  selectedIds,
  projectId,
  onClear,
}: {
  selectedIds: string[];
  projectId: string;
  onClear: () => void;
}) {
  const updateMultiple = useUpdateMultipleTickets();
  const deleteTicket = useDeleteTicket();
  const workflow = useProjectWorkflow(projectId);
  const { data: members } = useMembers();
  const [openDropdown, setOpenDropdown] = useState<
    "status" | "priority" | "assignee" | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleBulkDelete = () => {
    for (const id of selectedIds) {
      deleteTicket.mutate({ id, project_id: projectId });
    }
    setConfirmDelete(false);
    onClear();
  };

  if (selectedIds.length === 0) return null;

  const handleStatusChange = (status: string) => {
    updateMultiple.mutate({
      ids: selectedIds,
      project_id: projectId,
      updates: { status },
    });
    setOpenDropdown(null);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateMultiple.mutate({
      ids: selectedIds,
      project_id: projectId,
      updates: { priority },
    });
    setOpenDropdown(null);
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateMultiple.mutate({
      ids: selectedIds,
      project_id: projectId,
      updates: { assignee_id: assigneeId },
    });
    setOpenDropdown(null);
  };

  return (
    <div className="animate-slide-up fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface-primary border border-border-subtle rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
      <span className="text-[12px] font-medium text-content-primary">
        {selectedIds.length} selected
      </span>

      <div className="h-4 w-px bg-border-subtle" />

      {/* Status */}
      <div className="relative">
        <button
          onClick={() =>
            setOpenDropdown(openDropdown === "status" ? null : "status")
          }
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover hover:shadow-xs text-content-secondary transition-all duration-150 active:scale-[0.96]"
        >
          Set Status
        </button>
        {openDropdown === "status" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute bottom-full left-0 mb-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
              {workflow.statuses.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStatusChange(s.key)}
                  className="block w-full text-left px-3 py-1 text-[11px] text-content-secondary hover:bg-hover transition-colors"
                >
                  {STATUS_EMOJI[s.key] ?? ""} {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Priority */}
      <div className="relative">
        <button
          onClick={() =>
            setOpenDropdown(openDropdown === "priority" ? null : "priority")
          }
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover hover:shadow-xs text-content-secondary transition-all duration-150 active:scale-[0.96]"
        >
          Set Priority
        </button>
        {openDropdown === "priority" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute bottom-full left-0 mb-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[120px] shadow-xl">
              {TICKET_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className="block w-full text-left px-3 py-1 text-[11px] text-content-secondary hover:bg-hover transition-colors"
                >
                  {PRIORITY_EMOJI[p.value] ?? ""} {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignee */}
      <div className="relative">
        <button
          onClick={() =>
            setOpenDropdown(openDropdown === "assignee" ? null : "assignee")
          }
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover hover:shadow-xs text-content-secondary transition-all duration-150 active:scale-[0.96]"
        >
          Assign
        </button>
        {openDropdown === "assignee" && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="animate-dropdown-in absolute bottom-full left-0 mb-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[160px] max-h-[200px] overflow-y-auto shadow-xl">
              <button
                onClick={() => handleAssigneeChange(null)}
                className="block w-full text-left px-3 py-1 text-[11px] text-content-muted hover:bg-hover transition-colors"
              >
                Unassign
              </button>
              {members?.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAssigneeChange(m.id)}
                  className="block w-full text-left px-3 py-1 text-[11px] text-content-secondary hover:bg-hover transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-4 w-px bg-border-subtle" />

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-2.5 py-1 text-[11px] text-red-400 bg-surface-secondary border border-border-subtle rounded hover:bg-red-500/10 hover:border-red-400/30 transition-all duration-150 active:scale-[0.96]"
        >
          Delete
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-red-400 font-medium">
            Delete {selectedIds.length}?
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-2 py-0.5 text-[11px] bg-red-500 text-white rounded hover:bg-red-600 active:scale-[0.96] transition-all duration-150"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-[11px] text-content-muted hover:text-content-secondary px-1"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-border-subtle" />

      <button
        onClick={onClear}
        className="text-[11px] text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]"
      >
        Clear
      </button>

      {(updateMultiple.isPending || deleteTicket.isPending) && (
        <span className="text-[10px] text-content-muted animate-pulse">
          Updating...
        </span>
      )}
    </div>
  );
}
