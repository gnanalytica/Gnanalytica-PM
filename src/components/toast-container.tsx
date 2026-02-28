'use client';

import { useEffect, useRef } from 'react';
import { useToastStore } from '@/lib/store/toast-store';
import type { Toast } from '@/lib/store/toast-store';

const AUTO_DISMISS_MS = 2500;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 bg-surface-tertiary text-content-primary border border-border-subtle text-sm pl-3 pr-3 py-2.5 rounded-lg animate-toast-in"
    >
      {/* Success check icon */}
      <svg
        className="w-4 h-4 text-green-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
      <span>{toast.message}</span>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
