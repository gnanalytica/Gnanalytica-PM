"use client";

import { useEffect, useRef, useCallback } from "react";
import { useToastStore } from "@/lib/store/toast-store";
import type { Toast } from "@/lib/store/toast-store";

const AUTO_DISMISS_MS = 4000;
const UNDO_DISMISS_MS = 6000;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasUndo = !!toast.undoFn;

  useEffect(() => {
    timerRef.current = setTimeout(
      onDismiss,
      hasUndo ? UNDO_DISMISS_MS : AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timerRef.current);
  }, [onDismiss, hasUndo]);

  const handleUndo = useCallback(() => {
    toast.undoFn?.();
    onDismiss();
  }, [toast, onDismiss]);

  const variant = toast.variant ?? "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 bg-surface-primary text-content-primary border border-border-subtle text-sm pl-3.5 pr-2 py-2.5 rounded-xl animate-toast-in shadow-lg backdrop-blur-sm"
    >
      {/* Icon */}
      {variant === "success" && (
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3 h-3 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
      )}
      {variant === "error" && (
        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3 h-3 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}
      {variant === "info" && (
        <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3 h-3 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </div>
      )}

      <span className="font-medium text-[13px]">{toast.message}</span>

      {hasUndo && (
        <>
          <div className="w-px h-4 bg-border-subtle mx-0.5" />
          <button
            onClick={handleUndo}
            className="text-[12px] font-medium text-accent hover:text-accent-hover px-2 py-1 rounded-md hover:bg-accent/10 transition-all duration-150 active:scale-[0.96] flex-shrink-0"
          >
            Undo
          </button>
        </>
      )}

      <button
        onClick={onDismiss}
        className="p-1 text-content-muted hover:text-content-secondary rounded-md hover:bg-hover transition-all duration-150 flex-shrink-0 ml-0.5"
        aria-label="Dismiss"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
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
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
