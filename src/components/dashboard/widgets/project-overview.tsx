"use client";

import React from "react";
import { ProjectOverviewCard } from "@/lib/types/dashboard";

interface ProjectOverviewWidgetProps {
  projects: ProjectOverviewCard[];
  onProjectClick: (projectId: string) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function ProjectOverviewWidget({
  projects,
  onProjectClick,
  isLoading = false,
  isEmpty = false,
}: ProjectOverviewWidgetProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isEmpty || projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No projects available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-3">
        {projects.map((project) => (
          <button
            key={project.projectId}
            onClick={() => onProjectClick(project.projectId)}
            className="w-full p-3 rounded-lg border border-border-subtle hover:border-accent hover:bg-surface-secondary transition-all text-left group"
          >
            {/* Header with emoji and name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{project.projectEmoji}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-content-primary group-hover:text-accent truncate">
                  {project.projectName}
                </h4>
              </div>
              <span className="text-xs font-semibold text-accent whitespace-nowrap">
                {project.completionPercentage}%
              </span>
            </div>

            {/* Task counts */}
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-content-muted">
                {project.totalTasks} tasks
              </span>
              <div className="flex items-center gap-1">
                {project.taskCounts.todo > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {project.taskCounts.todo} To Do
                  </span>
                )}
                {project.taskCounts.in_progress > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                    {project.taskCounts.in_progress} In Progress
                  </span>
                )}
                {project.taskCounts.done > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                    {project.taskCounts.done} Done
                  </span>
                )}
              </div>
            </div>

            {/* Completion bar */}
            <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all"
                style={{
                  width: `${project.completionPercentage}%`,
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
