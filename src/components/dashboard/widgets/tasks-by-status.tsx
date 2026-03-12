"use client";

import React, { useMemo } from "react";
import { TasksByStatus } from "@/lib/types/dashboard";

interface TasksByStatusWidgetProps {
  tasksByStatus: TasksByStatus;
  isLoading?: boolean;
  isEmpty?: boolean;
}

const STATUS_COLORS: Record<keyof TasksByStatus, string> = {
  todo: "#6B7280",
  in_progress: "#3B82F6",
  done: "#10B981",
  in_review: "#F59E0B",
  backlog: "#8B5CF6",
  canceled: "#EF4444",
};

const STATUS_LABELS: Record<keyof TasksByStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  in_review: "In Review",
  backlog: "Backlog",
  canceled: "Canceled",
};

export function TasksByStatusWidget({
  tasksByStatus,
  isLoading = false,
  isEmpty = false,
}: TasksByStatusWidgetProps) {
  const stats = useMemo(() => {
    const total = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);
    const percentages = Object.entries(tasksByStatus).reduce(
      (acc, [key, value]) => {
        acc[key as keyof TasksByStatus] =
          total > 0 ? Math.round((value / total) * 100) : 0;
        return acc;
      },
      {} as Record<keyof TasksByStatus, number>
    );
    return { total, percentages };
  }, [tasksByStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isEmpty || stats.total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No tasks in any status</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-2xl font-bold text-content-primary">
            {stats.total}
          </p>
          <p className="text-xs text-content-muted">Total Tasks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">
            {tasksByStatus.done}
          </p>
          <p className="text-xs text-content-muted">Completed</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="flex-1 space-y-3 min-h-0 overflow-y-auto">
        {Object.entries(tasksByStatus).map(([status, count]) => {
          const key = status as keyof TasksByStatus;
          const percentage = stats.percentages[key];
          const label = STATUS_LABELS[key];
          const color = STATUS_COLORS[key];

          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-primary">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-content-primary">
                    {count}
                  </span>
                  <span className="text-xs text-content-muted">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    transition: "width 0.3s ease-in-out",
                  }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-border-subtle">
        <p className="text-xs text-content-muted mb-2">Distribution</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(STATUS_COLORS).slice(0, 3).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-content-muted">
                {STATUS_LABELS[status as keyof TasksByStatus]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
