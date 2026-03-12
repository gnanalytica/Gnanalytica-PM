"use client";

import { useState, useEffect, useMemo } from "react";
import { TicketCountWidget } from "./widgets/ticket-count-widget";
import { OverdueWidget } from "./widgets/overdue-widget";
import { CycleProgressWidget } from "./widgets/cycle-progress-widget";
import { RecentActivityWidget } from "./widgets/recent-activity-widget";

type WidgetKey =
  | "ticket-count"
  | "overdue"
  | "cycle-progress"
  | "recent-activity";

const ALL_WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: "ticket-count", label: "Ticket Count" },
  { key: "overdue", label: "Overdue Issues" },
  { key: "cycle-progress", label: "Cycle Progress" },
  { key: "recent-activity", label: "Recent Activity" },
];

const STORAGE_KEY = "dashboard-widgets";

function loadWidgets(): WidgetKey[] {
  if (typeof window === "undefined") return ALL_WIDGETS.map((w) => w.key);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return ALL_WIDGETS.map((w) => w.key);
}

export function WidgetGrid({ projectId }: { projectId: string }) {
  const [activeWidgets, setActiveWidgets] = useState<WidgetKey[]>(() =>
    loadWidgets()
  );
  const [showConfig, setShowConfig] = useState(false);

  const toggleWidget = (key: WidgetKey) => {
    setActiveWidgets((prev) => {
      const next = prev.includes(key)
        ? prev.filter((w) => w !== key)
        : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const renderWidget = (key: WidgetKey) => {
    switch (key) {
      case "ticket-count":
        return <TicketCountWidget projectId={projectId} />;
      case "overdue":
        return <OverdueWidget projectId={projectId} />;
      case "cycle-progress":
        return <CycleProgressWidget projectId={projectId} />;
      case "recent-activity":
        return <RecentActivityWidget projectId={projectId} />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Dashboard</h3>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-[11px] text-content-muted hover:text-content-secondary transition-colors"
        >
          {showConfig ? "Done" : "Customize"}
        </button>
      </div>

      {showConfig && (
        <div className="flex flex-wrap gap-2 p-2 bg-surface-secondary border border-border-subtle rounded-md">
          {ALL_WIDGETS.map((w) => (
            <button
              key={w.key}
              onClick={() => toggleWidget(w.key)}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                activeWidgets.includes(w.key)
                  ? "bg-accent text-white"
                  : "bg-surface-tertiary text-content-muted hover:text-content-secondary"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeWidgets.map((key) => (
          <div key={key} className="border border-border-subtle rounded-md p-3">
            {renderWidget(key)}
          </div>
        ))}
      </div>
    </div>
  );
}
