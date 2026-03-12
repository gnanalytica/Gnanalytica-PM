"use client";

import React, { useMemo } from "react";
import { Ticket, TicketStatus, TicketPriority } from "@/types";

interface MyTasksWidgetProps {
  tasks: Ticket[];
  onTaskClick: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TicketStatus) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  backlog: "bg-gray-100 text-gray-700",
  canceled: "bg-red-100 text-red-700",
};

export function MyTasksWidget({
  tasks,
  onTaskClick,
  onStatusChange,
  isLoading = false,
  isEmpty = false,
}: MyTasksWidgetProps) {
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      // Sort by due date first
      if (a.due_date && b.due_date) {
        const dateCompare =
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime();
        if (dateCompare !== 0) return dateCompare;
      }

      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (
        priorityOrder[a.priority as TicketPriority] -
        priorityOrder[b.priority as TicketPriority]
      );
    });
    return sorted;
  }, [tasks]);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
    }
    if (diffDays === 0) {
      return "Due today";
    }
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} remaining`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isEmpty || sortedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No tasks assigned to you</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      {sortedTasks.map((task) => (
        <button
          key={task.id}
          role="listitem"
          onClick={() => onTaskClick(task.id)}
          className="w-full p-3 rounded-lg border border-border-subtle hover:border-accent hover:bg-surface-secondary transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary group-hover:text-accent truncate">
                {task.title}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${PRIORITY_COLORS[task.priority as TicketPriority]}`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${STATUS_COLORS[task.status]}`}
              >
                {task.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-content-muted">
                {formatDueDate(task.due_date)}
              </span>
            </div>
            {task.story_points && (
              <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                {task.story_points}pt
              </span>
            )}
          </div>

          {/* Quick status buttons */}
          {onStatusChange && task.status !== "done" && (
            <div className="mt-2 flex items-center gap-1">
              {task.status === "todo" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "in_progress");
                  }}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Start
                </button>
              )}
              {task.status === "in_progress" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, "in_review");
                    }}
                    className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    Review
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, "done");
                    }}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
              {task.status === "in_review" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "done");
                  }}
                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
