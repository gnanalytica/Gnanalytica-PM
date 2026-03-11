"use client";

import { useState, useEffect } from "react";
import {
  useUpdateCycle,
  useCompleteSprintWithRollover,
} from "@/lib/hooks/use-cycles";
import type { Cycle } from "@/types";

export function RetrospectiveDialog({
  cycle,
  projectId,
  open,
  onClose,
}: {
  cycle: Cycle;
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const updateCycle = useUpdateCycle();
  const completeSprint = useCompleteSprintWithRollover();
  const [notes, setNotes] = useState(cycle.retrospective_notes ?? "");
  const [autoRollover, setAutoRollover] = useState(
    cycle.auto_rollover ?? false,
  );

  useEffect(() => {
    if (open) {
      setNotes(cycle.retrospective_notes ?? "");
      setAutoRollover(cycle.auto_rollover ?? false);
    }
  }, [open, cycle]);

  if (!open) return null;

  const handleSaveNotes = () => {
    updateCycle.mutate({
      id: cycle.id,
      projectId,
      retrospective_notes: notes,
      auto_rollover: autoRollover,
    });
  };

  const handleComplete = () => {
    // Save notes first, then complete
    updateCycle.mutate(
      {
        id: cycle.id,
        projectId,
        retrospective_notes: notes,
        auto_rollover: autoRollover,
      },
      {
        onSuccess: () => {
          completeSprint.mutate(
            { cycleId: cycle.id, projectId },
            { onSuccess: () => onClose() },
          );
        },
      },
    );
  };

  const isCompleted = cycle.status === "completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-overlay-in" onClick={onClose} />
      <div className="relative bg-surface-primary border border-border-subtle rounded-lg w-full max-w-lg p-5 animate-modal-in shadow-overlay">
        <h2 className="text-sm font-semibold text-content-primary mb-3">
          Sprint Retrospective — {cycle.name}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-content-muted font-medium block mb-1">
              Retrospective Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? What could improve? Action items..."
              rows={6}
              className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary resize-none"
              disabled={isCompleted}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRollover}
              onChange={(e) => setAutoRollover(e.target.checked)}
              className="rounded border-border-subtle text-accent w-3.5 h-3.5"
              disabled={isCompleted}
            />
            <span className="text-[12px] text-content-secondary">
              Auto-rollover incomplete issues to next sprint
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] text-content-muted hover:text-content-secondary active:scale-[0.96] transition-all duration-150"
          >
            Cancel
          </button>
          {!isCompleted && (
            <>
              <button
                onClick={handleSaveNotes}
                disabled={updateCycle.isPending}
                className="px-3 py-1.5 text-[12px] bg-surface-secondary border border-border-subtle text-content-primary rounded hover:bg-hover active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
              >
                {updateCycle.isPending ? "Saving..." : "Save Notes"}
              </button>
              <button
                onClick={handleComplete}
                disabled={completeSprint.isPending || updateCycle.isPending}
                className="px-3 py-1.5 text-[12px] bg-accent text-white rounded hover:opacity-90 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
              >
                {completeSprint.isPending ? "Completing..." : "Complete Sprint"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
