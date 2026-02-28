'use client';

import { useMemo } from 'react';
import { useProjectTickets } from '@/lib/hooks/use-tickets';

export function EpicList({
  projectId,
  onTicketClick,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
}) {
  const allTickets = useProjectTickets(projectId);

  const epics = useMemo(
    () => allTickets.filter((t) => t.issue_type === 'epic'),
    [allTickets],
  );

  const getChildCount = (epicId: string) =>
    allTickets.filter((t) => t.epic_id === epicId).length;

  const getCompletedChildCount = (epicId: string) =>
    allTickets.filter((t) => t.epic_id === epicId && t.status_category === 'completed').length;

  if (epics.length === 0) {
    return (
      <p className="text-sm text-content-muted text-center py-6">
        No epics yet. Create a ticket with type &ldquo;Epic&rdquo; to organize related work.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-content-primary">Epics</h3>
      {epics.map((epic) => {
        const total = getChildCount(epic.id);
        const completed = getCompletedChildCount(epic.id);
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

        return (
          <div
            key={epic.id}
            className="border border-border-subtle rounded-md p-3 hover:bg-hover transition-colors cursor-pointer"
            onClick={() => onTicketClick?.(epic.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px]">⚡</span>
                <h4 className="text-sm font-medium text-content-primary">{epic.title}</h4>
              </div>
              <span className="text-[11px] text-content-muted">{completed}/{total} issues</span>
            </div>
            {total > 0 && (
              <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
