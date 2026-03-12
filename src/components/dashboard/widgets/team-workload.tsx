"use client";

import React, { useMemo, useState } from "react";
import { TeamMemberWorkload } from "@/lib/types/dashboard";

interface TeamWorkloadWidgetProps {
  workload: TeamMemberWorkload[];
  isLoading?: boolean;
  isEmpty?: boolean;
  sortBy?: "name" | "workload";
}

const STATUS_COLORS = {
  balanced: "#10B981",
  overload: "#F59E0B",
  crisis: "#EF4444",
};

const STATUS_LABELS = {
  balanced: "Balanced",
  overload: "Overload",
  crisis: "Crisis",
};

const STATUS_THRESHOLDS = {
  balanced: { max: 8, label: "Balanced" },
  overload: { max: 14, label: "Overload" },
  crisis: { max: Infinity, label: "Crisis" },
};

export function TeamWorkloadWidget({
  workload,
  isLoading = false,
  isEmpty = false,
  sortBy = "name",
}: TeamWorkloadWidgetProps) {
  const [sortByCurrent, setSortBy] = useState<"name" | "workload">(sortBy);

  const sortedWorkload = useMemo(() => {
    const sorted = [...workload];
    if (sortByCurrent === "workload") {
      sorted.sort((a, b) => b.taskCount - a.taskCount);
    } else {
      sorted.sort((a, b) => a.userName.localeCompare(b.userName));
    }
    return sorted;
  }, [workload, sortByCurrent]);

  const maxTasks = useMemo(() => {
    return Math.max(...workload.map((m) => m.taskCount), 1);
  }, [workload]);

  const toggleSort = () => {
    setSortBy(sortByCurrent === "name" ? "workload" : "name");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isEmpty || sortedWorkload.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No team members</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header with sort button */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <p className="text-xs font-medium text-content-muted uppercase">
          Workload Status
        </p>
        <button
          onClick={toggleSort}
          className="text-xs px-2 py-1 rounded bg-surface-secondary hover:bg-hover text-content-primary transition-colors"
          title={`Sort by ${sortByCurrent === "name" ? "workload" : "name"}`}
        >
          {sortByCurrent === "name" ? "Sort by Load" : "Sort by Name"}
        </button>
      </div>

      {/* Workload Items */}
      <div className="flex-1 space-y-3 min-h-0 overflow-y-auto">
        {sortedWorkload.map((member) => {
          const percentage = (member.taskCount / maxTasks) * 100;
          const statusColor = STATUS_COLORS[member.status];

          return (
            <div
              key={member.userId}
              role="listitem"
              className="space-y-1.5"
            >
              {/* Member info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
                    {member.userName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-content-primary truncate">
                    {member.userName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-content-primary">
                    {member.taskCount}
                  </span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded text-white"
                    style={{
                      backgroundColor: statusColor,
                    }}
                  >
                    {STATUS_LABELS[member.status]}
                  </span>
                </div>
              </div>

              {/* Workload bar */}
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: statusColor,
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
        <p className="text-xs text-content-muted mb-2">Status Legend</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.balanced }}
            />
            <span className="text-content-muted">Balanced (≤8 tasks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.overload }}
            />
            <span className="text-content-muted">Overload (9-14 tasks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.crisis }}
            />
            <span className="text-content-muted">Crisis (15+ tasks)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
