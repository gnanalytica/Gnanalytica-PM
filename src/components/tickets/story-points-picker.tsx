'use client';

import { useState, useRef, useEffect } from 'react';
import { STORY_POINTS } from '@/types';

export function StoryPointsPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (points: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:bg-hover transition-colors"
      >
        {value != null ? (
          <span className="bg-surface-secondary px-1.5 py-0.5 rounded text-[11px] font-medium">{value}</span>
        ) : (
          <span className="text-content-muted">None</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 p-2">
          <div className="grid grid-cols-4 gap-1">
            {STORY_POINTS.map((sp) => (
              <button
                key={sp}
                onClick={() => { onChange(sp); setOpen(false); }}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  value === sp
                    ? 'bg-accent text-white'
                    : 'bg-surface-secondary text-content-secondary hover:bg-hover'
                }`}
              >
                {sp}
              </button>
            ))}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-8 h-8 rounded text-xs text-content-muted hover:bg-hover transition-colors"
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
