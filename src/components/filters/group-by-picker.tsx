'use client';

import { useState } from 'react';
import type { GroupByKey } from '@/types';

const GROUP_OPTIONS: { value: GroupByKey | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'issue_type', label: 'Type' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'epic', label: 'Epic' },
];

export function GroupByPicker({
  value,
  onChange,
}: {
  value: GroupByKey | null;
  onChange: (key: GroupByKey | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = GROUP_OPTIONS.find((o) => o.value === value) ?? GROUP_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-0.5 rounded border text-[11px] transition-colors ${
          value
            ? 'bg-accent-soft border-accent/30 text-accent'
            : 'bg-surface-tertiary border-border-subtle text-content-secondary hover:border-content-muted'
        }`}
      >
        Group: {current.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-30 py-1 min-w-[120px]">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1 text-[11px] hover:bg-hover transition-colors ${
                  value === opt.value ? 'text-accent font-medium' : 'text-content-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
