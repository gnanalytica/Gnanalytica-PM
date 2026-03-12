"use client";

import React from "react";
import { DashboardWidget, WIDGET_METADATA } from "@/lib/types/dashboard";

interface DashboardSettingsProps {
  isOpen: boolean;
  widgets: DashboardWidget[];
  onClose: () => void;
  onWidgetToggle: (widgetId: string) => void;
  onReset: () => void;
}

export function DashboardSettings({
  isOpen,
  widgets,
  onClose,
  onWidgetToggle,
  onReset,
}: DashboardSettingsProps) {
  if (!isOpen) return null;

  const visibleCount = widgets.filter((w) => w.isVisible).length;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface-primary border-l border-border-subtle shadow-lg z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-lg font-bold text-content-primary">
            Dashboard Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-content-muted hover:text-content-primary hover:bg-hover rounded transition-colors"
            aria-label="Close settings"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Widget visibility section */}
            <div>
              <p className="text-xs font-semibold text-content-muted uppercase mb-3">
                Visible Widgets ({visibleCount}/{widgets.length})
              </p>
              <div className="space-y-2">
                {widgets.map((widget) => (
                  <label
                    key={widget.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={widget.isVisible}
                      onChange={() => onWidgetToggle(widget.id)}
                      className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-accent cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary">
                        {widget.title}
                      </p>
                      <p className="text-xs text-content-muted">
                        {WIDGET_METADATA[widget.type]?.description || ""}
                      </p>
                    </div>
                    <span className="text-xs text-content-muted flex-shrink-0">
                      {WIDGET_METADATA[widget.type]?.icon || ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border-subtle" />

            {/* Information */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
              <p className="text-xs text-content-muted">
                <span className="font-semibold">💡 Tip:</span> Toggle widgets to customize your dashboard. Changes are saved automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4 flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 rounded-lg border border-border-subtle text-content-primary hover:bg-surface-secondary transition-colors text-sm font-medium"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
