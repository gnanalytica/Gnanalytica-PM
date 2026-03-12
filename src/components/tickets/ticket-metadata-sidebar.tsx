'use client';

import { useState } from 'react';
import { Ticket, TICKET_STATUSES, TICKET_PRIORITIES } from '@/types';

interface TicketMetadataSidebarProps {
  ticket: Ticket;
  onPropertyChange: (field: string, value: any) => Promise<void>;
  readonly?: boolean;
}

export function TicketMetadataSidebar({
  ticket,
  onPropertyChange,
  readonly = false,
}: TicketMetadataSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePropertyChange = async (field: string, value: any) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onPropertyChange(field, value);
      setOpenDropdown(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue =
    ticket.due_date &&
    new Date(ticket.due_date) < new Date() &&
    !['done', 'canceled'].includes(ticket.status);

  const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'Todo',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    canceled: 'Canceled',
  };

  const priorityLabels: Record<string, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div className="w-80 bg-surface-primary border-l border-border-subtle flex flex-col p-4 gap-6 overflow-y-auto">
      {/* Assignees Section */}
      <div>
        <h3 className="text-12 font-semibold text-content-muted uppercase tracking-wide mb-3">
          Assignees
        </h3>
        <div className="flex flex-wrap gap-2">
          {ticket.assignees && ticket.assignees.length > 0 ? (
            ticket.assignees.map((assignee) => (
              <div
                key={assignee.user.id}
                className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-semibold text-content-primary cursor-pointer hover:bg-accent/10 transition-colors"
                title={assignee.user.name}
              >
                {assignee.user.name.charAt(0).toUpperCase()}
              </div>
            ))
          ) : (
            <span className="text-content-muted text-13">Unassigned</span>
          )}
          {!readonly && (
            <button
              className="w-8 h-8 rounded-full border-2 border-dashed border-border-subtle text-13 text-content-secondary hover:text-content-primary hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add assignee"
              disabled={isUpdating}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Due Date Section */}
      <div>
        <h3 className="text-12 font-semibold text-content-muted uppercase tracking-wide mb-3">
          Due Date
        </h3>
        <button
          className={`w-full px-3 py-2 rounded text-13 text-left transition-colors text-12 font-medium ${
            isOverdue
              ? 'bg-error/10 text-error'
              : 'bg-surface-secondary text-content-primary'
          } ${readonly ? 'cursor-default' : 'hover:bg-surface-tertiary cursor-pointer'} disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={readonly || isUpdating}
        >
          <div className="flex items-center justify-between">
            <span>{formatDate(ticket.due_date)}</span>
            {isOverdue && (
              <span className="ml-2 text-11 font-semibold px-2 py-0.5 bg-error/20 rounded text-error">
                Overdue
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Priority Section */}
      <div>
        <h3 className="text-12 font-semibold text-content-muted uppercase tracking-wide mb-3">
          Priority
        </h3>
        <div className="relative">
          <button
            className={`w-full px-3 py-2 rounded text-13 text-left border border-border-subtle font-medium transition-all ${
              readonly
                ? 'cursor-default bg-surface-tertiary text-content-muted'
                : 'hover:bg-surface-secondary hover:border-accent text-content-primary'
            } ${
              openDropdown === 'priority'
                ? 'ring-1 ring-accent/40 border-accent'
                : ''
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() =>
              !readonly &&
              setOpenDropdown(
                openDropdown === 'priority' ? null : 'priority'
              )
            }
            disabled={readonly || isUpdating}
          >
            {priorityLabels[ticket.priority] || 'No priority'}
          </button>
          {openDropdown === 'priority' && !readonly && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-primary border border-border-subtle rounded shadow-lg z-10 overflow-hidden">
              {TICKET_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  className="w-full px-3 py-2 text-left text-13 hover:bg-surface-secondary transition-colors border-b border-border-subtle last:border-b-0 text-content-primary"
                  onClick={() =>
                    handlePropertyChange('priority', p.value)
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div>
        <h3 className="text-12 font-semibold text-content-muted uppercase tracking-wide mb-3">
          Status
        </h3>
        <div className="relative">
          <button
            className={`w-full px-3 py-2 rounded text-13 text-left border border-border-subtle font-medium transition-all ${
              readonly
                ? 'cursor-default bg-surface-tertiary text-content-muted'
                : 'hover:bg-surface-secondary hover:border-accent text-content-primary'
            } ${
              openDropdown === 'status'
                ? 'ring-1 ring-accent/40 border-accent'
                : ''
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() =>
              !readonly &&
              setOpenDropdown(
                openDropdown === 'status' ? null : 'status'
              )
            }
            disabled={readonly || isUpdating}
          >
            {statusLabels[ticket.status] || 'Todo'}
          </button>
          {openDropdown === 'status' && !readonly && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-primary border border-border-subtle rounded shadow-lg z-10 overflow-hidden">
              {TICKET_STATUSES.map((s) => (
                <button
                  key={s.value}
                  className="w-full px-3 py-2 text-left text-13 hover:bg-surface-secondary transition-colors border-b border-border-subtle last:border-b-0 text-content-primary"
                  onClick={() =>
                    handlePropertyChange('status', s.value)
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-3 py-2 rounded bg-error/10 text-error text-11 border border-error/20">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isUpdating && (
        <div className="flex items-center justify-center py-2 gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
          <span className="text-12 text-content-muted">Saving...</span>
        </div>
      )}
    </div>
  );
}
