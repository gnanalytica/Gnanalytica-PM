"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook to manage drag-to-reorder for a list of section IDs.
 * Persists order to localStorage.
 * Initializes with defaults to avoid hydration mismatch, then syncs after mount.
 */
export function useDraggableSections(
  storageKey: string,
  defaultOrder: string[],
) {
  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultOrder;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const known = new Set(defaultOrder);
        const filtered = parsed.filter((id) => known.has(id));
        const missing = defaultOrder.filter((id) => !parsed.includes(id));
        return [...filtered, ...missing];
      }
    } catch {}
    return defaultOrder;
  });

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(storageKey + "-collapsed");
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const draggedItem = useRef<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const onDragStart = useCallback((id: string) => {
    draggedItem.current = id;
  }, []);

  const onDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (draggedItem.current && draggedItem.current !== id) {
        setDragOverItem(id);
      }
    },
    [],
  );

  const onDragEnd = useCallback(() => {
    if (draggedItem.current && dragOverItem) {
      setOrder((prev) => {
        const from = prev.indexOf(draggedItem.current!);
        const to = prev.indexOf(dragOverItem);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        next.splice(from, 1);
        next.splice(to, 0, draggedItem.current!);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    }
    draggedItem.current = null;
    setDragOverItem(null);
  }, [dragOverItem, storageKey]);

  const toggleCollapse = useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(
          storageKey + "-collapsed",
          JSON.stringify([...next]),
        );
        return next;
      });
    },
    [storageKey],
  );

  const isCollapsed = useCallback(
    (id: string) => collapsed.has(id),
    [collapsed],
  );

  return {
    order,
    dragOverItem,
    onDragStart,
    onDragOver,
    onDragEnd,
    isCollapsed,
    toggleCollapse,
  };
}

/**
 * A draggable section wrapper with a drag handle and collapse toggle.
 */
export function DraggableSection({
  id,
  title,
  isCollapsed,
  isDragOver,
  onToggle,
  onDragStart,
  onDragOver,
  onDragEnd,
  children,
}: {
  id: string;
  title: string;
  isCollapsed: boolean;
  isDragOver: boolean;
  onToggle: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragEnd={onDragEnd}
      className={`transition-all duration-200 ${
        isDragOver
          ? "ring-2 ring-accent/30 ring-offset-2 ring-offset-surface-primary rounded-xl"
          : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing p-0.5 text-content-muted/40 hover:text-content-secondary transition-colors flex-shrink-0">
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>

        {/* Collapse chevron */}
        <button
          onClick={() => onToggle(id)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-content-muted uppercase tracking-wider hover:text-content-secondary transition-all duration-150"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${
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
          {title}
        </button>
      </div>

      {!isCollapsed && children}
    </div>
  );
}
