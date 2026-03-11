import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/types";

// ── Normalized state ──

type NotificationState = {
  byId: Record<string, Notification>;
  ids: string[]; // ordered by created_at DESC

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

// ── Selector (pure function) ──

export function selectUnreadCount(state: NotificationState): number {
  let count = 0;
  for (const id of state.ids) {
    if (state.byId[id] && !state.byId[id].read) count++;
  }
  return count;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      byId: {},
      ids: [],

      setNotifications: (notifications) =>
        set((state) => {
          if (
            state.ids.length === notifications.length &&
            notifications.every(
              (n, i) => state.ids[i] === n.id && state.byId[n.id] === n,
            )
          ) {
            return state;
          }
          const byId: Record<string, Notification> = {};
          const ids: string[] = [];
          for (const n of notifications) {
            byId[n.id] = n;
            ids.push(n.id);
          }
          return { byId, ids };
        }),

      addNotification: (notification) =>
        set((state) => {
          if (state.byId[notification.id]) return state;
          return {
            byId: { ...state.byId, [notification.id]: notification },
            ids: [notification.id, ...state.ids], // prepend (newest first)
          };
        }),

      markRead: (id) =>
        set((state) => {
          const existing = state.byId[id];
          if (!existing || existing.read) return state;
          return {
            byId: { ...state.byId, [id]: { ...existing, read: true } },
          };
        }),

      markAllRead: () =>
        set((state) => {
          let changed = false;
          const byId: Record<string, Notification> = {};
          for (const id of state.ids) {
            const n = state.byId[id];
            if (n && !n.read) {
              byId[id] = { ...n, read: true };
              changed = true;
            } else {
              byId[id] = n;
            }
          }
          if (!changed) return state;
          return { byId };
        }),
    }),
    {
      name: "pm-notification-store",
      partialize: (state) => ({
        byId: state.byId,
        ids: state.ids,
      }),
    },
  ),
);
