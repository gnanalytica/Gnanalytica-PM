"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { createClient } from "@/lib/supabase-browser";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/lib/store/notification-store";
import type { Notification } from "@/types";

const supabase = createClient();

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "*, ticket:tickets(id, title), actor:profiles!notifications_actor_id_fkey(id, name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Store-backed hooks ──

/**
 * Hydrate the Zustand notification store from the React Query cache.
 * Follows the useHydrateTicket pattern from use-tickets.ts.
 */
export function useHydrateNotifications() {
  const { data, isLoading, isError } = useNotifications();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data, setNotifications]);

  return { isLoading, isError };
}

/**
 * Read notifications from the Zustand store (not React Query).
 * Subscribes to raw slices via useShallow and derives array with useMemo.
 */
export function useStoreNotifications(): Notification[] {
  const { byId, ids } = useNotificationStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );

  return useMemo(
    () => ids.map((id) => byId[id]).filter((n): n is Notification => n != null),
    [byId, ids],
  );
}

/**
 * Read unread count from the Zustand store.
 */
export function useStoreUnreadCount(): number {
  return useNotificationStore(selectUnreadCount);
}

/**
 * Format a notification into a human-readable string.
 * Extracted from notification-bell.tsx for shared use.
 */
export function formatNotification(n: Notification): string {
  const actor = n.actor?.name ?? "Someone";
  switch (n.type) {
    case "ticket_assigned":
      return `${actor} assigned you a ticket`;
    case "comment_added":
      return `${actor} commented on a ticket`;
    case "mentioned":
      return `${actor} mentioned you in a comment`;
    case "status_changed":
      return `${actor} changed the status`;
    case "priority_changed":
      return `${actor} changed the priority`;
    default:
      return n.type;
  }
}

/**
 * Mark a single notification as read — optimistic store update + Supabase persist.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const storeMarkRead = useNotificationStore((s) => s.markRead);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onMutate: (notificationId) => {
      storeMarkRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Mark all notifications as read — optimistic store update + Supabase persist.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onMutate: () => {
      storeMarkAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
