'use client';

import { useState, useMemo } from 'react';
import { useProjectMilestones, useDeleteMilestone, useUpdateMilestone } from '@/lib/hooks/use-milestones';
import { useProjectTickets } from '@/lib/hooks/use-tickets';
import { CreateMilestoneDialog } from './create-milestone-dialog';
import type { Milestone } from '@/types';

function MilestoneProgress({ milestone, projectId }: { milestone: Milestone; projectId: string }) {
  const allTickets = useProjectTickets(projectId);
  const milestoneTickets = useMemo(
    () => allTickets.filter((t) => t.milestone_id === milestone.id),
    [allTickets, milestone.id],
  );
  const completed = milestoneTickets.filter((t) => t.status_category === 'completed').length;
  const total = milestoneTickets.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-content-muted flex-shrink-0">{completed}/{total}</span>
    </div>
  );
}

export function MilestoneList({ projectId }: { projectId: string }) {
  const milestones = useProjectMilestones(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const deleteMilestone = useDeleteMilestone();
  const updateMilestone = useUpdateMilestone();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Milestones</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-2.5 py-1 text-[12px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
        >
          New Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-content-muted text-center py-6">No milestones yet. Create your first milestone to organize work.</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="border border-border-subtle rounded-md p-3 hover:bg-hover transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-content-primary">{m.name}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    m.status === 'active' ? 'bg-blue-50 text-blue-600' :
                    m.status === 'completed' ? 'bg-green-50 text-green-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {m.status === 'active' && (
                    <button
                      onClick={() => updateMilestone.mutate({ id: m.id, project_id: projectId, status: 'completed' })}
                      className="text-[11px] text-content-muted hover:text-green-600 transition-colors px-1"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => deleteMilestone.mutate({ id: m.id, project_id: projectId })}
                    className="text-[11px] text-content-muted hover:text-red-400 transition-colors px-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {m.description && (
                <p className="text-[12px] text-content-muted mb-1.5">{m.description}</p>
              )}
              <div className="flex items-center gap-3">
                {m.target_date && (
                  <span className="text-[11px] text-content-muted">
                    Target: {new Date(m.target_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <MilestoneProgress milestone={m} projectId={projectId} />
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateMilestoneDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
      />
    </div>
  );
}
