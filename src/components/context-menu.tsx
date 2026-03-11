"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem =
  | { type: "item"; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }
  | { type: "separator" }
  | { type: "submenu"; label: string; icon?: React.ReactNode; items: ContextMenuItem[] };

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

/* ── Hook: returns { onContextMenu, contextMenu } ── */
export function useContextMenu(items: ContextMenuItem[] | (() => ContextMenuItem[])) {
  const [state, setState] = useState<ContextMenuState | null>(null);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const resolved = typeof items === "function" ? items() : items;
      setState({ x: e.clientX, y: e.clientY, items: resolved });
    },
    [items],
  );

  const close = useCallback(() => setState(null), []);

  return {
    onContextMenu,
    contextMenu: state ? (
      <ContextMenuPortal x={state.x} y={state.y} items={state.items} onClose={close} />
    ) : null,
  };
}

/* ── Portal-rendered menu ── */
function ContextMenuPortal({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [subOpen, setSubOpen] = useState<number | null>(null);

  // Adjust position to stay in viewport
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (x + rect.width > window.innerWidth - 8) nx = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) ny = window.innerHeight - rect.height - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  // Close on outside click / escape / scroll
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[100] animate-dropdown-in"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-surface-tertiary border border-border-subtle rounded-lg shadow-lg py-1 min-w-[180px] max-w-[260px]">
        {items.map((item, i) => {
          if (item.type === "separator") {
            return <div key={i} className="my-1 border-t border-border-subtle" />;
          }
          if (item.type === "submenu") {
            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setSubOpen(i)}
                onMouseLeave={() => setSubOpen(null)}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-content-secondary hover:bg-hover cursor-pointer transition-colors duration-100">
                  {item.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  <svg className="w-3 h-3 text-content-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                {subOpen === i && (
                  <div className="absolute left-full top-0 ml-0.5 bg-surface-tertiary border border-border-subtle rounded-lg shadow-lg py-1 min-w-[160px] animate-dropdown-in">
                    {item.items.map((sub, si) =>
                      sub.type === "separator" ? (
                        <div key={si} className="my-1 border-t border-border-subtle" />
                      ) : sub.type === "item" ? (
                        <button
                          key={si}
                          onClick={(e) => { e.stopPropagation(); sub.onClick(); onClose(); }}
                          disabled={sub.disabled}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors duration-100 ${
                            sub.danger ? "text-red-400 hover:bg-red-500/10" : "text-content-secondary hover:bg-hover"
                          } ${sub.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {sub.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{sub.icon}</span>}
                          <span>{sub.label}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          }
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); item.onClick(); onClose(); }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors duration-100 ${
                item.danger ? "text-red-400 hover:bg-red-500/10" : "text-content-secondary hover:bg-hover"
              } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
