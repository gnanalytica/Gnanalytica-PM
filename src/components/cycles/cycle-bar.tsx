'use client';

import { useMemo, useState } from 'react';
import { useTicketStore } from '@/lib/store/ticket-store';
import { useProjectCycles, useActiveCycle, useCycleTickets } from '@/lib/hooks/use-cycles';
import { CreateCycleDialog } from '@/components/cycles/create-cycle-dialog';
import { RetrospectiveDialog } from '@/components/sprints/retrospective-dialog';
import { getCycleProgress } from '@/types';
import type { Cycle } from '@/types';

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function ProgressBar({
  completed,
  total,
  percentage,
}: {
  completed: number;
  total: number;
  percentage: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6e9ade] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[11px] text-content-secondary tabular-nums">
        {completed}/{total} completed
      </span>
    </div>
  );
}

export function CycleBar({
  projectId,
  cycleFilter,
  onCycleFilterChange,
}: {
  projectId: string;
  cycleFilter: 'all' | 'active';
  onCycleFilterChange: (mode: 'all' | 'active') => void;
}) {
  const cycles = useProjectCycles(projectId);
  const activeCycle = useActiveCycle();
  const setActiveCycle = useTicketStore((s) => s.setActiveCycle);
  const cycleTickets = useCycleTickets(activeCycle?.id ?? null);

  const cycleProgress = useMemo(
    () => getCycleProgress(cycleTickets),
    [cycleTickets],
  );

  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const addCycle = useTicketStore((s) => s.addCycle);

  const handleCycleCreated = (cycle: Cycle) => {
    addCycle(cycle);
    setActiveCycle(cycle.id);
    onCycleFilterChange('active');
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-1.5 px-0.5 flex-wrap">
        {/* Toggle: All / Active Cycle */}
        <div className="flex items-center bg-surface-secondary rounded-md p-0.5">
          <button
            onClick={() => onCycleFilterChange('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors duration-[120ms] cursor-pointer ${
              cycleFilter === 'all'
                ? 'bg-surface-tertiary text-content-primary'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => onCycleFilterChange('active')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors duration-[120ms] cursor-pointer ${
              cycleFilter === 'active'
                ? 'bg-surface-tertiary text-content-primary'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Active Cycle
          </button>
        </div>

        {cycles.length === 0 ? (
          cycleFilter === 'active' && (
            <div className="flex items-center gap-2 text-[11px] text-content-secondary">
              <span>No cycles yet.</span>
              <button
                type="button"
                onClick={() => setShowCreateCycle(true)}
                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer rounded transition-colors duration-[120ms]"
              >
                Create cycle
              </button>
            </div>
          )
        ) : (
          cycleFilter === 'active' && (
            <>
              <select
                value={activeCycle?.id ?? ''}
                onChange={(e) => setActiveCycle(e.target.value || null)}
                className="text-xs border border-border-subtle rounded-md px-2 py-1 bg-surface-tertiary cursor-pointer"
              >
                <option value="">Select cycle...</option>
                {cycles.map((c: Cycle) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatDate(c.start_date)} – {formatDate(c.end_date)})
                  </option>
                ))}
              </select>

              {activeCycle && (
                <ProgressBar
                  completed={cycleProgress.completed}
                  total={cycleProgress.total}
                  percentage={cycleProgress.percentage}
                />
              )}

              {activeCycle && (
                <span className="text-[11px] text-content-muted">
                  {formatDate(activeCycle.start_date)} – {formatDate(activeCycle.end_date)}
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowCreateCycle(true)}
                className="text-[11px] text-content-muted hover:text-content-secondary cursor-pointer rounded transition-colors duration-[120ms]"
                title="Create cycle"
              >
                + New cycle
              </button>

              {activeCycle && (
                <button
                  type="button"
                  onClick={() => setShowRetro(true)}
                  className="text-[11px] text-content-muted hover:text-content-secondary cursor-pointer rounded transition-colors duration-[120ms]"
                  title="Sprint retrospective"
                >
                  Retrospective
                </button>
              )}
            </>
          )
        )}
      </div>

      <CreateCycleDialog
        open={showCreateCycle}
        onClose={() => setShowCreateCycle(false)}
        projectId={projectId}
        onCreated={handleCycleCreated}
      />

      {activeCycle && (
        <RetrospectiveDialog
          cycle={activeCycle}
          projectId={projectId}
          open={showRetro}
          onClose={() => setShowRetro(false)}
        />
      )}
    </>
  );
}
