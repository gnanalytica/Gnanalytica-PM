"use client";

import { useState, useCallback, useEffect } from "react";

function persistCollapsedSet(storageKey: string, set: Set<string>) {
  localStorage.setItem(storageKey, JSON.stringify([...set]));
}

/**
 * Hook to manage collapsed state for a group of sections.
 * Persists to localStorage under the given key.
 * Initializes empty to avoid hydration mismatch, then syncs after mount.
 */
export function useCollapsedSections(storageKey: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setCollapsed(new Set(parsed));
      }
    } catch {}
  }, [storageKey]);

  const toggle = useCallback(
    (sectionId: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        persistCollapsedSet(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const isCollapsed = useCallback(
    (sectionId: string) => collapsed.has(sectionId),
    [collapsed],
  );

  return { isCollapsed, toggle };
}

/**
 * A collapsible section with a clickable header that toggles content visibility.
 */
export function CollapsibleSection({
  id,
  title,
  icon,
  isCollapsed,
  onToggle,
  children,
  count,
  className,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2 px-5 py-2 text-left hover:bg-hover/50 transition-colors duration-100 group"
      >
        <svg
          className={`w-3 h-3 text-content-muted transition-transform duration-200 flex-shrink-0 ${
            isCollapsed ? "" : "rotate-90"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
        {icon && (
          <span className="w-3.5 h-3.5 flex items-center justify-center text-content-muted flex-shrink-0">
            {icon}
          </span>
        )}
        <span className="text-[12px] font-medium uppercase tracking-wide text-content-muted">
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] text-content-muted bg-surface-secondary rounded-full px-1.5 py-px font-medium">
            {count}
          </span>
        )}
      </button>
      {!isCollapsed && <div className="px-5 pb-2">{children}</div>}
    </div>
  );
}
