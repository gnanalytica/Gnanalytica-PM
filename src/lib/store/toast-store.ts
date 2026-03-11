import { create } from "zustand";

export type Toast = {
  id: string;
  message: string;
  undoFn?: () => void;
  variant?: "success" | "error" | "info";
};

type ToastState = {
  toasts: Toast[];
  add: (message: string, options?: { undoFn?: () => void; variant?: Toast["variant"] }) => void;
  dismiss: (id: string) => void;
};

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (message, options) => {
    const id = String(++nextId);
    set((s) => ({
      toasts: [...s.toasts, { id, message, undoFn: options?.undoFn, variant: options?.variant }],
    }));
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
