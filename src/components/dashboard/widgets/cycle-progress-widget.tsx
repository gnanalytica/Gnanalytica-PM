"use client";

import { useMemo, useRef, useEffect } from "react";
import { useActiveCycle, useCycleTickets } from "@/lib/hooks/use-cycles";
import { getCycleProgress } from "@/types";

export function CycleProgressWidget({ projectId }: { projectId: string }) {
  void projectId;
  const activeCycle = useActiveCycle();
  const cycleTickets = useCycleTickets(activeCycle?.id ?? null);
  const nowRef = useRef(0);

  // Initialize nowRef on first render
  if (nowRef.current === 0) {
    nowRef.current = Date.now();
  }

  // Update the current time periodically so daysLeft stays accurate
  useEffect(() => {
    const interval = setInterval(() => {
      nowRef.current = Date.now();
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(
    () => getCycleProgress(cycleTickets),
    [cycleTickets],
  );

  const daysLeft = useMemo(() => {
    if (!activeCycle) return 0;
    return Math.max(
      0,
      Math.ceil(
        (new Date(activeCycle.end_date).getTime() - nowRef.current) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }, [activeCycle]);

  if (!activeCycle) {
    return (
      <div>
        <p className="text-[11px] text-content-muted uppercase font-medium mb-2">
          Active Cycle
        </p>
        <p className="text-[12px] text-content-muted">No active cycle</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] text-content-muted uppercase font-medium mb-2">
        {activeCycle.name}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-content-primary">
            {progress.percentage}%
          </span>
          <span className="text-[11px] text-content-muted">
            {daysLeft}d left
          </span>
        </div>
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-content-muted">
          <span>
            {progress.completed}/{progress.total} completed
          </span>
          <span>
            {new Date(activeCycle.start_date + "T00:00:00").toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" },
            )}
            {" – "}
            {new Date(activeCycle.end_date + "T00:00:00").toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" },
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
