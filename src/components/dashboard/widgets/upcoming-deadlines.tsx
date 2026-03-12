"use client";

import React, { useMemo } from "react";
import { UpcomingDeadline } from "@/lib/types/dashboard";

interface UpcomingDeadlinesWidgetProps {
  deadlines: UpcomingDeadline[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

const URGENCY_COLORS = {
  overdue: "bg-red-50 text-red-700 border-red-200",
  "this-week": "bg-orange-50 text-orange-700 border-orange-200",
  "next-week": "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const URGENCY_LABELS = {
  overdue: "Overdue",
  "this-week": "Due This Week",
  "next-week": "Due Next Week",
};

export function UpcomingDeadlinesWidget({
  deadlines,
  isLoading = false,
  isEmpty = false,
}: UpcomingDeadlinesWidgetProps) {
  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort(
      (a, b) =>
        new Date(a.task.due_date || "").getTime() -
        new Date(b.task.due_date || "").getTime()
    );
  }, [deadlines]);

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

  if (isEmpty || sortedDeadlines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      {sortedDeadlines.map((deadline) => (
        <div
          key={deadline.task.id}
          role="listitem"
          className={`deadline-item p-3 rounded-lg border-l-4 ${URGENCY_COLORS[deadline.urgency]}`}
          style={{
            borderLeftColor:
              deadline.urgency === "overdue"
                ? "#EF4444"
                : deadline.urgency === "this-week"
                  ? "#F59E0B"
                  : "#FBBF24",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">
                {deadline.task.title}
              </p>
              <p className="text-xs text-content-muted mt-0.5">
                {formatDueDate(deadline.task.due_date)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  deadline.urgency === "overdue"
                    ? "bg-red-100 text-red-700"
                    : deadline.urgency === "this-week"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {deadline.isOverdue ? "Overdue" : URGENCY_LABELS[deadline.urgency]}
              </span>
              <span
                className={`text-lg ${
                  deadline.task.priority === "urgent"
                    ? "text-red-500"
                    : deadline.task.priority === "high"
                      ? "text-orange-500"
                      : "text-gray-400"
                }`}
              >
                {deadline.task.priority === "urgent" && "🔴"}
                {deadline.task.priority === "high" && "🟠"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
