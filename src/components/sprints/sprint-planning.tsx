'use client';

import { useState, useMemo, useCallback } from 'react';
import { useProjectTickets } from '@/lib/hooks/use-tickets';
import { useActiveCycle, useCycleTickets, useAssignTicketToCycle, useRemoveTicketFromCycle, useProjectCycles } from '@/lib/hooks/use-cycles';
import { StatusCircle, PriorityIcon } from '@/components/tickets/ticket-list-view';
import type { Ticket } from '@/types';

export function SprintPlanning({
  projectId,
  onTicketClick,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
}) {
  const allTickets = useProjectTickets(projectId);
  const cycles = useProjectCycles(projectId);
  const activeCycle = useActiveCycle();
  const cycleTickets = useCycleTickets(activeCycle?.id ?? null);
  const assignTicket = useAssignTicketToCycle();
  const removeTicket = useRemoveTicketFromCycle();

  const [backlogSearch, setBacklogSearch] = useState('');
  const [sprintSearch, setSprintSearch] = useState('');

  const cycleTicketIds = useMemo(
    () => new Set(cycleTickets.map((t) => t.id)),
    [cycleTickets],
  );

  // Backlog: tickets not in the active cycle
  const backlogTickets = useMemo(() => {
    const base = allTickets.filter(
      (t) => !cycleTicketIds.has(t.id) && t.status_category !== 'completed' && t.status_category !== 'canceled',
    );
    if (!backlogSearch.trim()) return base;
    const q = backlogSearch.toLowerCase();
    return base.filter((t) => t.title.toLowerCase().includes(q));
  }, [allTickets, cycleTicketIds, backlogSearch]);

  const filteredSprintTickets = useMemo(() => {
    if (!sprintSearch.trim()) return cycleTickets;
    const q = sprintSearch.toLowerCase();
    return cycleTickets.filter((t) => t.title.toLowerCase().includes(q));
  }, [cycleTickets, sprintSearch]);

  // Story points totals
  const sprintPoints = useMemo(
    () => cycleTickets.reduce((sum, t) => sum + (t.story_points ?? 0), 0),
    [cycleTickets],
  );

  const completedPoints = useMemo(
    () => cycleTickets
      .filter((t) => t.status_category === 'completed')
      .reduce((sum, t) => sum + (t.story_points ?? 0), 0),
    [cycleTickets],
  );

  const handleAdd = useCallback(
    (ticketId: string) => {
      if (!activeCycle) return;
      assignTicket.mutate({ ticketId, cycleId: activeCycle.id, projectId });
    },
    [activeCycle, assignTicket, projectId],
  );

  const handleRemove = useCallback(
    (ticketId: string) => {
      if (!activeCycle) return;
      removeTicket.mutate({ ticketId, cycleId: activeCycle.id, projectId });
    },
    [activeCycle, removeTicket, projectId],
  );

  if (cycles.length === 0) {
    return (
      <p className="text-sm text-content-muted text-center py-6">
        Create a cycle first to start planning sprints.
      </p>
    );
  }

  if (!activeCycle) {
    return (
      <p className="text-sm text-content-muted text-center py-6">
        Select an active cycle to begin sprint planning.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Sprint Planning</h3>
        <div className="flex items-center gap-3 text-[11px] text-content-muted">
          <span>{sprintPoints} pts planned</span>
          <span>{completedPoints} pts completed</span>
          <span>{cycleTickets.length} issues</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Backlog pane */}
        <div className="border border-border-subtle rounded-md overflow-hidden">
          <div className="bg-surface-secondary border-b border-border-subtle px-3 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-content-muted uppercase">Backlog ({backlogTickets.length})</span>
            <input
              type="text"
              value={backlogSearch}
              onChange={(e) => setBacklogSearch(e.target.value)}
              placeholder="Search..."
              className="text-[11px] bg-transparent border border-border-subtle rounded px-1.5 py-0.5 w-28 text-content-primary"
            />
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {backlogTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                action="add"
                onAction={() => handleAdd(ticket.id)}
                onClick={() => onTicketClick?.(ticket.id)}
              />
            ))}
            {backlogTickets.length === 0 && (
              <p className="text-[11px] text-content-muted text-center py-4">No backlog items</p>
            )}
          </div>
        </div>

        {/* Sprint pane */}
        <div className="border border-border-subtle rounded-md overflow-hidden">
          <div className="bg-surface-secondary border-b border-border-subtle px-3 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-content-muted uppercase">
              {activeCycle.name} ({cycleTickets.length})
            </span>
            <input
              type="text"
              value={sprintSearch}
              onChange={(e) => setSprintSearch(e.target.value)}
              placeholder="Search..."
              className="text-[11px] bg-transparent border border-border-subtle rounded px-1.5 py-0.5 w-28 text-content-primary"
            />
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredSprintTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                action="remove"
                onAction={() => handleRemove(ticket.id)}
                onClick={() => onTicketClick?.(ticket.id)}
              />
            ))}
            {filteredSprintTickets.length === 0 && (
              <p className="text-[11px] text-content-muted text-center py-4">No sprint items</p>
            )}
          </div>
          {/* Points bar */}
          {sprintPoints > 0 && (
            <div className="border-t border-border-subtle px-3 py-1.5 bg-surface-secondary">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, (completedPoints / sprintPoints) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-content-muted">
                  {completedPoints}/{sprintPoints} pts
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  action,
  onAction,
  onClick,
}: {
  ticket: Ticket;
  action: 'add' | 'remove';
  onAction: () => void;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle hover:bg-hover transition-colors group">
      <StatusCircle status={ticket.status} />
      <button
        onClick={onClick}
        className="flex-1 text-[12px] text-content-primary truncate text-left hover:text-accent transition-colors"
      >
        {ticket.title}
      </button>
      {ticket.story_points && (
        <span className="text-[10px] text-content-muted bg-surface-secondary px-1.5 py-0.5 rounded">
          {ticket.story_points}
        </span>
      )}
      <PriorityIcon priority={ticket.priority} />
      <button
        onClick={(e) => { e.stopPropagation(); onAction(); }}
        className={`opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded transition-all ${
          action === 'add'
            ? 'text-accent hover:bg-accent/10'
            : 'text-content-muted hover:text-red-400 hover:bg-red-400/10'
        }`}
      >
        {action === 'add' ? '+ Add' : '- Remove'}
      </button>
    </div>
  );
}
