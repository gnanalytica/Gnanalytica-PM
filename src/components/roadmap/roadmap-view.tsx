'use client';

import { useMemo } from 'react';
import { useProjectMilestones } from '@/lib/hooks/use-milestones';
import { useProjectTickets } from '@/lib/hooks/use-tickets';
import type { Milestone } from '@/types';

function getDateRange(items: { start?: string | null; end?: string | null }[]) {
  let earliest = new Date();
  let latest = new Date();
  latest.setMonth(latest.getMonth() + 3);

  for (const item of items) {
    if (item.start) {
      const d = new Date(item.start);
      if (d < earliest) earliest = d;
    }
    if (item.end) {
      const d = new Date(item.end);
      if (d > latest) latest = d;
    }
  }

  // Pad by 2 weeks
  earliest.setDate(earliest.getDate() - 14);
  latest.setDate(latest.getDate() + 14);

  return { earliest, latest };
}

function MilestoneBar({
  milestone,
  projectId,
  earliest,
  totalDays,
}: {
  milestone: Milestone;
  projectId: string;
  earliest: Date;
  totalDays: number;
}) {
  const allTickets = useProjectTickets(projectId);
  const tickets = useMemo(
    () => allTickets.filter((t) => t.milestone_id === milestone.id),
    [allTickets, milestone.id],
  );
  const completed = tickets.filter((t) => t.status_category === 'completed').length;
  const total = tickets.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const today = new Date();
  const targetDate = milestone.target_date ? new Date(milestone.target_date) : today;

  // Bar starts 60 days before target (or project start) and ends at target
  const barStartDate = new Date(targetDate);
  barStartDate.setDate(barStartDate.getDate() - 60);
  const startOffset = Math.max(0, (barStartDate.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
  const duration = 60;

  const left = (startOffset / totalDays) * 100;
  const width = (duration / totalDays) * 100;

  const color = milestone.status === 'completed' ? '#5fae7e' : milestone.status === 'canceled' ? '#c27070' : '#6e9ade';

  return (
    <div className="flex items-center h-8 relative group">
      <div
        className="absolute h-5 rounded-sm flex items-center px-2 overflow-hidden"
        style={{
          left: `${left}%`,
          width: `${Math.max(width, 3)}%`,
          backgroundColor: color + '20',
          borderLeft: `3px solid ${color}`,
        }}
      >
        <span className="text-[10px] font-medium truncate" style={{ color }}>
          {milestone.name} ({pct}%)
        </span>
      </div>
    </div>
  );
}

export function RoadmapView({ projectId }: { projectId: string }) {
  const milestones = useProjectMilestones(projectId);
  const allTickets = useProjectTickets(projectId);

  const epics = useMemo(
    () => allTickets.filter((t) => t.issue_type === 'epic'),
    [allTickets],
  );

  const items = useMemo(() => [
    ...milestones.map((m) => ({ start: null, end: m.target_date })),
    ...epics.map((e) => ({ start: e.start_date, end: e.due_date })),
  ], [milestones, epics]);

  const { earliest, latest } = getDateRange(items);
  const totalDays = Math.max(1, (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  // Generate month markers
  const months: { label: string; left: number }[] = [];
  const monthStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  while (monthStart <= latest) {
    const offset = (monthStart.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);
    months.push({
      label: monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      left: (offset / totalDays) * 100,
    });
    monthStart.setMonth(monthStart.getMonth() + 1);
  }

  // Today marker
  const todayOffset = (new Date().getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);
  const todayLeft = (todayOffset / totalDays) * 100;

  if (milestones.length === 0 && epics.length === 0) {
    return (
      <p className="text-sm text-content-muted text-center py-6">
        Create milestones or epics to see the roadmap timeline.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-content-primary">Roadmap</h3>
      <div className="border border-border-subtle rounded-md overflow-hidden">
        {/* Month headers */}
        <div className="relative h-6 bg-surface-secondary border-b border-border-subtle">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute top-0 text-[10px] text-content-muted font-medium px-1 py-1"
              style={{ left: `${m.left}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Timeline body */}
        <div className="relative min-h-[100px] px-1 py-2">
          {/* Today line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-400/50 z-10"
            style={{ left: `${todayLeft}%` }}
          />

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] font-medium uppercase text-content-muted px-2">Milestones</span>
              {milestones.map((m) => (
                <MilestoneBar key={m.id} milestone={m} projectId={projectId} earliest={earliest} totalDays={totalDays} />
              ))}
            </div>
          )}

          {/* Epics */}
          {epics.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase text-content-muted px-2">Epics</span>
              {epics.map((epic) => {
                const start = epic.start_date ? new Date(epic.start_date) : new Date();
                const end = epic.due_date ? new Date(epic.due_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
                const startOff = Math.max(0, (start.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
                const dur = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const left = (startOff / totalDays) * 100;
                const width = (dur / totalDays) * 100;

                return (
                  <div key={epic.id} className="flex items-center h-8 relative">
                    <div
                      className="absolute h-5 rounded-sm flex items-center px-2 overflow-hidden"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 3)}%`,
                        backgroundColor: '#9585c420',
                        borderLeft: '3px solid #9585c4',
                      }}
                    >
                      <span className="text-[10px] font-medium truncate text-[#9585c4]">
                        ⚡ {epic.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
