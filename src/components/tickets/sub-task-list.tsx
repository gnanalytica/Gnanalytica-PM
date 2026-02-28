'use client';

import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTicketStore } from '@/lib/store/ticket-store';
import { useCreateTicket, useUpdateTicket } from '@/lib/hooks/use-tickets';
import { StatusCircle } from '@/components/tickets/ticket-list-view';
import type { Ticket } from '@/types';

export function SubTaskList({
  parentId,
  projectId,
  onTicketClick,
}: {
  parentId: string;
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  const subTasks = useMemo(
    () =>
      ids
        .map((id) => byId[id])
        .filter((t): t is Ticket => t != null && t.parent_id === parentId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [byId, ids, parentId],
  );

  const completedCount = subTasks.filter((t) => t.status_category === 'completed').length;
  const totalCount = subTasks.length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await createTicket.mutateAsync({
      project_id: projectId,
      title: newTitle.trim(),
      parent_id: parentId,
      issue_type: 'sub_task',
    });
    setNewTitle('');
    setShowAddForm(false);
  };

  const toggleComplete = (task: Ticket) => {
    const newStatus = task.status_category === 'completed' ? 'todo' : 'done';
    updateTicket.mutate({
      id: task.id,
      project_id: projectId,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-content-muted">
          Sub-tasks {totalCount > 0 && `(${completedCount}/${totalCount})`}
        </span>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-[11px] text-content-muted hover:text-content-secondary transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5fae7e] transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Sub-tasks list */}
      <div className="space-y-0.5">
        {subTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 py-1 px-1 rounded hover:bg-hover transition-colors group"
          >
            <button onClick={() => toggleComplete(task)} className="flex-shrink-0">
              <StatusCircle status={task.status} />
            </button>
            <button
              onClick={() => onTicketClick?.(task.id)}
              className={`text-[13px] truncate flex-1 text-left ${
                task.status_category === 'completed'
                  ? 'text-content-muted line-through'
                  : 'text-content-primary'
              }`}
            >
              {task.title}
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Sub-task title..."
            className="flex-1 border border-border-subtle rounded px-2 py-1 text-xs bg-surface-secondary text-content-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setShowAddForm(false); setNewTitle(''); }
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || createTicket.isPending}
            className="px-2 py-1 text-xs bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
