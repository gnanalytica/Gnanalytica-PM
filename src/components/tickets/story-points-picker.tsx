"use client";

import { useState, useRef, useEffect } from "react";
import { STORY_POINTS } from "@/types";

export function StoryPointsPicker({
  value,
  onChange,
  isOpen: controlledOpen,
  onToggle,
}: {
  value: number | null;
  onChange: (points: number | null) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen(!internalOpen));
  const close = onToggle ? () => {} : () => setInternalOpen(false);

  useEffect(() => {
    if (!open || controlledOpen !== undefined) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setInternalOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, controlledOpen]);

  return (
    <div className="relative" ref={ref} data-dropdown>
      <button
        onClick={toggle}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 hover:bg-hover hover:shadow-xs active:scale-[0.96] ${open ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
      >
        {value != null ? (
          <span className="font-medium">{value} pts</span>
        ) : (
          <span className="text-content-muted">Points</span>
        )}
      </button>
      {open && (
        <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-1">
            {STORY_POINTS.map((sp) => (
              <button
                key={sp}
                onClick={() => {
                  onChange(sp);
                  close();
                }}
                className={`w-8 h-8 rounded text-xs font-medium transition-all duration-150 active:scale-[0.95] ${
                  value === sp
                    ? "bg-accent text-white shadow-sm"
                    : "bg-surface-secondary text-content-secondary hover:bg-hover hover:shadow-xs"
                }`}
              >
                {sp}
              </button>
            ))}
            <button
              onClick={() => {
                onChange(null);
                close();
              }}
              className="w-8 h-8 rounded text-xs text-content-muted hover:bg-hover transition-all duration-150 active:scale-[0.95]"
            >
              -
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StoryPointsBadge({ points }: { points: number | null }) {
  if (points == null) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-surface-secondary text-[10px] font-medium text-content-muted">
      {points}
    </span>
  );
}
