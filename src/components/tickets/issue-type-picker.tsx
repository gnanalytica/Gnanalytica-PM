"use client";

import { useState, useRef, useEffect } from "react";
import { ISSUE_TYPES } from "@/types";
import type { IssueType } from "@/types";

export function IssueTypePicker({
  value,
  onChange,
  isOpen: controlledOpen,
  onToggle,
}: {
  value: IssueType;
  onChange: (type: IssueType) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Use controlled state if provided, otherwise internal
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

  const current = ISSUE_TYPES.find((t) => t.value === value) ?? ISSUE_TYPES[2];

  return (
    <div className="relative" ref={ref} data-dropdown>
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 hover:bg-hover hover:shadow-xs active:scale-[0.96] ${open ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
      >
        <span className="text-[12px]">{current.icon}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 min-w-[150px] py-1 shadow-lg">
          {ISSUE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                onChange(t.value);
                close();
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.98] ${
                value === t.value
                  ? "bg-accent-soft text-accent"
                  : "text-content-secondary hover:bg-hover"
              }`}
            >
              <span className="text-[12px]">{t.icon}</span>
              {t.label}
              {value === t.value && (
                <svg className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function IssueTypeIcon({
  type,
  className,
}: {
  type: IssueType;
  className?: string;
}) {
  const t = ISSUE_TYPES.find((i) => i.value === type);
  return <span className={className ?? "text-[12px]"}>{t?.icon ?? "☑️"}</span>;
}
