"use client";

import { useState, useEffect } from "react";
import { useSLAPolicies, useUpsertSLAPolicy } from "@/lib/hooks/use-sla";
import { TICKET_PRIORITIES } from "@/types";
import type { TicketPriority } from "@/types";

const DEFAULT_SLA: Record<
  TicketPriority,
  { response: number; resolution: number }
> = {
  urgent: { response: 30, resolution: 240 },
  high: { response: 60, resolution: 480 },
  medium: { response: 240, resolution: 1440 },
  low: { response: 480, resolution: 2880 },
};

function minutesToHM(minutes: number): { h: number; m: number } {
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

function hmToMinutes(h: number, m: number): number {
  return h * 60 + m;
}

export function SLAPolicyEditor({ projectId }: { projectId: string }) {
  const { data: policies } = useSLAPolicies(projectId);
  const upsert = useUpsertSLAPolicy();
  const [values, setValues] = useState<
    Record<
      TicketPriority,
      {
        responseH: number;
        responseM: number;
        resolutionH: number;
        resolutionM: number;
      }
    >
  >({
    urgent: { responseH: 0, responseM: 30, resolutionH: 4, resolutionM: 0 },
    high: { responseH: 1, responseM: 0, resolutionH: 8, resolutionM: 0 },
    medium: { responseH: 4, responseM: 0, resolutionH: 24, resolutionM: 0 },
    low: { responseH: 8, responseM: 0, resolutionH: 48, resolutionM: 0 },
  });

  useEffect(() => {
    if (!policies) return;
    const next = { ...values };
    for (const p of policies) {
      const r = minutesToHM(p.response_time_minutes);
      const res = minutesToHM(p.resolution_time_minutes);
      next[p.priority] = {
        responseH: r.h,
        responseM: r.m,
        resolutionH: res.h,
        resolutionM: res.m,
      };
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policies]);

  const handleSave = (priority: TicketPriority) => {
    const v = values[priority];
    upsert.mutate({
      project_id: projectId,
      priority,
      response_time_minutes: hmToMinutes(v.responseH, v.responseM),
      resolution_time_minutes: hmToMinutes(v.resolutionH, v.resolutionM),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">
          SLA Policies
        </h3>
        <span className="text-[11px] text-content-muted">
          Response &amp; resolution time targets per priority
        </span>
      </div>

      <div className="border border-border-subtle rounded-lg overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_1fr_60px] gap-0 text-[11px] font-medium text-content-muted uppercase tracking-wider bg-surface-secondary px-3 py-2 border-b border-border-subtle">
          <span>Priority</span>
          <span>Response Time</span>
          <span>Resolution Time</span>
          <span />
        </div>
        {TICKET_PRIORITIES.map((p) => {
          const v = values[p.value];
          return (
            <div
              key={p.value}
              className="grid grid-cols-[100px_1fr_1fr_60px] gap-0 items-center px-3 py-2 border-b border-border-subtle last:border-b-0"
            >
              <span className="text-[12px] font-medium text-content-primary">
                {p.label}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={v.responseH}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [p.value]: {
                        ...v,
                        responseH: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
                />
                <span className="text-[10px] text-content-muted">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={v.responseM}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [p.value]: {
                        ...v,
                        responseM: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
                />
                <span className="text-[10px] text-content-muted">m</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={v.resolutionH}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [p.value]: {
                        ...v,
                        resolutionH: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
                />
                <span className="text-[10px] text-content-muted">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={v.resolutionM}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [p.value]: {
                        ...v,
                        resolutionM: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
                />
                <span className="text-[10px] text-content-muted">m</span>
              </div>
              <button
                onClick={() => handleSave(p.value)}
                disabled={upsert.isPending}
                className="px-2 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 hover:shadow-xs active:scale-[0.95] disabled:opacity-50 transition-all duration-150"
              >
                Save
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
