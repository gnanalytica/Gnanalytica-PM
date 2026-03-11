import { useCallback } from "react";
import { useToastStore } from "@/lib/store/toast-store";
import type { Toast } from "@/lib/store/toast-store";

type ToastOptions = { undoFn?: () => void; variant?: Toast["variant"] };

export function useToast() {
  const add = useToastStore((s) => s.add);
  const toast = useCallback(
    (message: string, options?: ToastOptions) => add(message, options),
    [add],
  );
  return { toast };
}

/**
 * Fire-and-forget toast from outside React (e.g. inside mutation callbacks
 * that don't have hook access). Uses the store directly.
 */
export function toast(message: string, options?: ToastOptions) {
  useToastStore.getState().add(message, options);
}
