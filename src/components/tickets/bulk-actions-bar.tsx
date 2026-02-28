'use client';

import { useState } from 'react';
import { useUpdateMultipleTickets } from '@/lib/hooks/use-tickets';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { TICKET_PRIORITIES } from '@/types';
import { useMembers } from '@/lib/hooks/use-members';
import type { TicketPriority } from '@/types';

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
  const workflow = useProjectWorkflow(projectId);
  const { data: members } = useMembers();
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | 'assignee' | null>(null);

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface-primary border border-border-subtle rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
      <span className="text-[12px] font-medium text-content-primary">
        {selectedIds.length} selected
      </span>

      <div className="h-4 w-px bg-border-subtle" />

      {/* Status */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover text-content-secondary transition-colors"
        >
          Set Status
        </button>
        {openDropdown === 'status' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute bottom-full left-0 mb-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[140px]">
              {workflow.statuses.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStatusChange(s.key)}
                  className="block w-full text-left px-3 py-1 text-[11px] text-content-secondary hover:bg-hover transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Priority */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover text-content-secondary transition-colors"
        >
          Set Priority
        </button>
        {openDropdown === 'priority' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute bottom-full left-0 mb-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[120px]">
              {TICKET_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className="block w-full text-left px-3 py-1 text-[11px] text-content-secondary hover:bg-hover transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignee */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
          className="px-2.5 py-1 text-[11px] bg-surface-secondary border border-border-subtle rounded hover:bg-hover text-content-secondary transition-colors"
        >
          Assign
        </button>
        {openDropdown === 'assignee' && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
            <div className="absolute bottom-full left-0 mb-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
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

      <button
        onClick={onClear}
        className="text-[11px] text-content-muted hover:text-content-secondary transition-colors"
      >
        Clear
      </button>

      {updateMultiple.isPending && (
        <span className="text-[10px] text-content-muted animate-pulse">Updating...</span>
      )}
    </div>
  );
}
