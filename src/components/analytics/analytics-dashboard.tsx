"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ProjectOverview } from "./project-overview";

const VelocityChart = dynamic(() => import("./velocity-chart").then(m => ({ default: m.VelocityChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-surface-tertiary rounded animate-pulse" />,
});

const BurndownChart = dynamic(() => import("./burndown-chart").then(m => ({ default: m.BurndownChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-surface-tertiary rounded animate-pulse" />,
});

const CompletionTrends = dynamic(() => import("./completion-trends").then(m => ({ default: m.CompletionTrends })), {
  ssr: false,
  loading: () => <div className="h-64 bg-surface-tertiary rounded animate-pulse" />,
});

export function AnalyticsDashboard({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-4">
      <ProjectOverview projectId={projectId} />
      <div className="bg-surface-secondary rounded-lg p-4">
        <Suspense fallback={<div className="h-64 bg-surface-tertiary rounded animate-pulse" />}>
          <VelocityChart projectId={projectId} />
        </Suspense>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-secondary rounded-lg p-4">
          <Suspense fallback={<div className="h-64 bg-surface-tertiary rounded animate-pulse" />}>
            <BurndownChart projectId={projectId} />
          </Suspense>
        </div>
        <div className="bg-surface-secondary rounded-lg p-4">
          <Suspense fallback={<div className="h-64 bg-surface-tertiary rounded animate-pulse" />}>
            <CompletionTrends projectId={projectId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
