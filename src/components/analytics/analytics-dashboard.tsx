'use client';

import { VelocityChart } from './velocity-chart';
import { BurndownChart } from './burndown-chart';
import { CompletionTrends } from './completion-trends';

export function AnalyticsDashboard({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface-secondary rounded-lg p-4">
        <VelocityChart projectId={projectId} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-secondary rounded-lg p-4">
          <BurndownChart projectId={projectId} />
        </div>
        <div className="bg-surface-secondary rounded-lg p-4">
          <CompletionTrends projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
