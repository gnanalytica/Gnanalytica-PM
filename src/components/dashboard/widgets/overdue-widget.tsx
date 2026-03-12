"use client";

import { useMemo, useRef, useEffect } from "react";
import { useProjectTickets } from "@/lib/hooks/use-tickets";

export function OverdueWidget({ projectId }: { projectId: string }) {
  const tickets = useProjectTickets(projectId);
  const nowRef = useRef(0);

  // Initialize nowRef on first render
  if (nowRef.current === 0) {
    nowRef.current = Date.now();
  }

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      nowRef.current = Date.now();
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const overdueTickets = useMemo(() => {
    const now = nowRef.current;
    return tickets
      .filter((t) => {
        if (!t.due_date) return false;
        return (
          new Date(t.due_date) < new Date(now) &&
          t.status_category !== "completed" &&
          t.status_category !== "canceled"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      );
  }, [tickets]);

  return (
    <div>
      <p className="text-[11px] text-content-muted uppercase font-medium mb-2">
        Overdue Issues ({overdueTickets.length})
      </p>
      {overdueTickets.length === 0 ? (
        <p className="text-[12px] text-content-muted">No overdue issues</p>
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {overdueTickets.slice(0, 10).map((t) => {
            const daysOverdue = Math.ceil(
              (nowRef.current - new Date(t.due_date!).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-[12px] text-content-primary truncate flex-1">
                  {t.title}
                </span>
                <span className="text-[10px] text-[#c27070] flex-shrink-0 ml-2">
                  {daysOverdue}d overdue
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
