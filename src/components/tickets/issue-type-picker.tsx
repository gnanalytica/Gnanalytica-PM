'use client';

import { useState, useRef, useEffect } from 'react';
import { ISSUE_TYPES } from '@/types';
import type { IssueType } from '@/types';

export function IssueTypePicker({
  value,
  onChange,
}: {
  value: IssueType;
  onChange: (type: IssueType) => void;
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

  const current = ISSUE_TYPES.find((t) => t.value === value) ?? ISSUE_TYPES[2];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs hover:bg-hover transition-colors"
      >
        <span className="text-[12px]">{current.icon}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 min-w-[150px] py-1">
          {ISSUE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { onChange(t.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                value === t.value ? 'bg-accent-soft text-accent' : 'text-content-secondary hover:bg-hover'
              }`}
            >
              <span className="text-[12px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function IssueTypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const t = ISSUE_TYPES.find((i) => i.value === type);
  return <span className={className ?? 'text-[12px]'}>{t?.icon ?? '☑️'}</span>;
}
