import { useCallback } from 'react';
import { useToastStore } from '@/lib/store/toast-store';

export function useToast() {
  const add = useToastStore((s) => s.add);
  const toast = useCallback((message: string) => add(message), [add]);
  return { toast };
}

/**
 * Fire-and-forget toast from outside React (e.g. inside mutation callbacks
 * that don't have hook access). Uses the store directly.
 */
export function toast(message: string) {
  useToastStore.getState().add(message);
}
