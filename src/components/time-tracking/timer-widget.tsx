"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useTimeEntries,
  useRunningTimer,
  useStartTimer,
  useStopTimer,
  useLogManualTime,
  useDeleteTimeEntry,
  useTotalTime,
} from "@/lib/hooks/use-time-tracking";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TimerWidget({ ticketId }: { ticketId: string }) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { data: runningTimer } = useRunningTimer(userId);
  const { data: entries } = useTimeEntries(ticketId);
  const totalMinutes = useTotalTime(entries);
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const logManual = useLogManualTime();
  const deleteEntry = useDeleteTimeEntry();

  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(30);
  const [manualDesc, setManualDesc] = useState("");

  const isTimerForThisTicket = runningTimer?.ticket_id === ticketId;

  // Tick the timer
  useEffect(() => {
    if (!isTimerForThisTicket || !runningTimer) return;
    const start = new Date(runningTimer.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerForThisTicket, runningTimer]);

  const handleStart = () => {
    if (!userId) return;
    startTimer.mutate({ ticketId, userId });
  };

  const handleStop = () => {
    if (!runningTimer || !userId) return;
    stopTimer.mutate({ entryId: runningTimer.id, ticketId, userId });
    setElapsed(0);
  };

  const handleLogManual = () => {
    if (!userId) return;
    const duration = manualHours * 60 + manualMinutes;
    if (duration <= 0) return;
    logManual.mutate({
      ticket_id: ticketId,
      user_id: userId,
      duration_minutes: duration,
      description: manualDesc || undefined,
    });
    setShowManual(false);
    setManualHours(0);
    setManualMinutes(30);
    setManualDesc("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-content-muted hover:text-content-secondary transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          Time{" "}
          {totalMinutes > 0 && (
            <span className="text-content-secondary normal-case font-normal">
              ({formatMinutes(totalMinutes)})
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {isTimerForThisTicket ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-[0.95] transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTimer(elapsed)}
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 active:scale-[0.95] transition-all duration-150"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start
            </button>
          )}
          <button
            onClick={() => setShowManual(!showManual)}
            className="px-2 py-0.5 text-[11px] text-content-muted hover:text-content-secondary rounded bg-surface-secondary hover:bg-hover active:scale-[0.95] transition-all duration-150"
          >
            + Log
          </button>
        </div>
      </div>

      {/* Manual time entry form */}
      {showManual && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="number"
            min={0}
            value={manualHours}
            onChange={(e) => setManualHours(parseInt(e.target.value) || 0)}
            className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
          />
          <span className="text-[10px] text-content-muted">h</span>
          <input
            type="number"
            min={0}
            max={59}
            value={manualMinutes}
            onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
            className="w-12 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary text-center"
          />
          <span className="text-[10px] text-content-muted">m</span>
          <input
            type="text"
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            placeholder="Description..."
            className="flex-1 border border-border-subtle rounded px-1.5 py-0.5 text-xs bg-surface-secondary text-content-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogManual();
            }}
          />
          <button
            onClick={handleLogManual}
            disabled={manualHours * 60 + manualMinutes <= 0}
            className="px-2 py-0.5 text-[11px] bg-accent text-white rounded hover:opacity-90 active:scale-[0.95] disabled:opacity-50 transition-all duration-150"
          >
            Log
          </button>
        </div>
      )}

      {/* Time entries list */}
      {showEntries && entries && entries.length > 0 && (
        <div className="space-y-1 mt-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between text-[11px] text-content-secondary py-0.5 group"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-content-muted">
                  {new Date(entry.started_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-medium tabular-nums">
                  {formatMinutes(entry.duration_minutes ?? 0)}
                </span>
                {entry.description && (
                  <span className="text-content-muted truncate max-w-[120px]">
                    {entry.description}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteEntry.mutate({ id: entry.id, ticketId })}
                className="opacity-0 group-hover:opacity-100 text-content-muted hover:text-red-400 transition-all p-0.5"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
