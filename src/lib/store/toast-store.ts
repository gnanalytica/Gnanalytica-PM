import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  add: (message: string) => void;
  dismiss: (id: string) => void;
};

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (message) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
