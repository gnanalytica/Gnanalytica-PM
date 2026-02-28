'use client';

import { useMemo } from 'react';
import { useProjectTickets } from '@/lib/hooks/use-tickets';
import { useProjectMilestones } from '@/lib/hooks/use-milestones';

export function ProjectOverview({ projectId }: { projectId: string }) {
  const tickets = useProjectTickets(projectId);
  const milestones = useProjectMilestones(projectId);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status_category !== 'completed' && t.status_category !== 'canceled').length;
    const closed = tickets.filter((t) => t.status_category === 'completed').length;
    const total = tickets.length;
    const pct = total === 0 ? 0 : Math.round((closed / total) * 100);
    const overdue = tickets.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status_category !== 'completed' && t.status_category !== 'canceled';
    }).length;
    const upcomingMilestones = milestones
      .filter((m) => m.status === 'active' && m.target_date)
      .sort((a, b) => (a.target_date ?? '').localeCompare(b.target_date ?? ''))
      .slice(0, 3);

    return { open, closed, total, pct, overdue, upcomingMilestones };
  }, [tickets, milestones]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="border border-border-subtle rounded-md p-3">
        <p className="text-[11px] text-content-muted uppercase font-medium">Open Issues</p>
        <p className="text-xl font-semibold text-content-primary mt-1">{stats.open}</p>
      </div>
      <div className="border border-border-subtle rounded-md p-3">
        <p className="text-[11px] text-content-muted uppercase font-medium">Completed</p>
        <p className="text-xl font-semibold text-[#5fae7e] mt-1">{stats.closed}</p>
      </div>
      <div className="border border-border-subtle rounded-md p-3">
        <p className="text-[11px] text-content-muted uppercase font-medium">Progress</p>
        <p className="text-xl font-semibold text-content-primary mt-1">{stats.pct}%</p>
        <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden mt-1">
          <div className="h-full bg-accent rounded-full" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>
      <div className="border border-border-subtle rounded-md p-3">
        <p className="text-[11px] text-content-muted uppercase font-medium">Overdue</p>
        <p className={`text-xl font-semibold mt-1 ${stats.overdue > 0 ? 'text-[#c27070]' : 'text-content-primary'}`}>{stats.overdue}</p>
      </div>
      {stats.upcomingMilestones.length > 0 && (
        <div className="col-span-2 md:col-span-4 border border-border-subtle rounded-md p-3">
          <p className="text-[11px] text-content-muted uppercase font-medium mb-1">Upcoming Milestones</p>
          <div className="space-y-1">
            {stats.upcomingMilestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-[12px] text-content-primary">{m.name}</span>
                <span className="text-[11px] text-content-muted">
                  {m.target_date && new Date(m.target_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
