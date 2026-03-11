"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * Persists a numeric value to localStorage with a key.
 * Initializes with defaultValue to avoid hydration mismatch,
 * then syncs from localStorage after mount.
 */
function usePersistedWidth(key: string, defaultValue: number) {
  const [value, setValue] = useState(defaultValue);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed)) setValue(parsed);
    }
  }, [key]);

  const set = useCallback(
    (v: number) => {
      setValue(v);
      localStorage.setItem(key, String(v));
    },
    [key],
  );

  return [value, set] as const;
}

/**
 * Hook for making a panel resizable via a drag handle.
 * Returns the current width and a ref callback for the handle element.
 *
 * @param side - "left" means dragging adjusts a panel to the left of the handle,
 *               "right" means adjusting a panel to the right.
 */
export function useResizable({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
}: {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "left" | "right";
}) {
  const [width, setWidth] = usePersistedWidth(storageKey, defaultWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth =
        side === "left"
          ? startWidth.current + delta
          : startWidth.current - delta;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [minWidth, maxWidth, side, setWidth]);

  return { width, onMouseDown };
}

/**
 * Thin drag-handle bar rendered between panels.
 */
export function ResizeHandle({
  onMouseDown,
  orientation = "vertical",
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  orientation?: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    return (
      <div
        onMouseDown={onMouseDown}
        className="group h-1 cursor-row-resize flex-shrink-0 relative z-10 flex items-center justify-center"
      >
        <div className="w-8 h-0.5 rounded-full bg-border-subtle group-hover:bg-accent/50 group-active:bg-accent transition-colors duration-150" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className="group w-1 cursor-col-resize flex-shrink-0 relative z-10 flex items-center justify-center"
    >
      <div className="w-0.5 h-8 rounded-full bg-border-subtle group-hover:bg-accent/50 group-active:bg-accent transition-colors duration-150" />
    </div>
  );
}
