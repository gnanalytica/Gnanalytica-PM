"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useMemo } from "react";
import type { TimeEntry } from "@/types";

const supabase = createClient();

export function useTimeEntries(ticketId: string) {
  return useQuery({
    queryKey: ["time-entries", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, user:profiles(*)")
        .eq("ticket_id", ticketId)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimeEntry[];
    },
    enabled: !!ticketId,
  });
}

export function useRunningTimer(userId: string | undefined) {
  return useQuery({
    queryKey: ["running-timer", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, user:profiles(*)")
        .eq("user_id", userId)
        .eq("is_running", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TimeEntry | null;
    },
    enabled: !!userId,
    refetchInterval: 60000, // refresh every minute to keep timer accurate
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      userId,
    }: {
      ticketId: string;
      userId: string;
    }) => {
      // Stop any running timer first
      await supabase
        .from("time_entries")
        .update({ ended_at: new Date().toISOString(), is_running: false })
        .eq("user_id", userId)
        .eq("is_running", true);

      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          started_at: new Date().toISOString(),
          is_running: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["time-entries", vars.ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["running-timer", vars.userId],
      });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      ticketId,
    }: {
      entryId: string;
      ticketId: string;
      userId: string;
    }) => {
      void ticketId;
      const { error } = await supabase
        .from("time_entries")
        .update({ ended_at: new Date().toISOString(), is_running: false })
        .eq("id", entryId);
      if (error) throw error;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["time-entries", vars.ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["running-timer", vars.userId],
      });
    },
  });
}

export function useLogManualTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      ticket_id: string;
      user_id: string;
      duration_minutes: number;
      description?: string;
      started_at?: string;
    }) => {
      const startedAt = entry.started_at || new Date().toISOString();
      const endedAt = new Date(
        new Date(startedAt).getTime() + entry.duration_minutes * 60000,
      ).toISOString();
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          ticket_id: entry.ticket_id,
          user_id: entry.user_id,
          started_at: startedAt,
          ended_at: endedAt,
          duration_minutes: entry.duration_minutes,
          description: entry.description || null,
          is_running: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["time-entries", vars.ticket_id],
      });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ticketId }: { id: string; ticketId: string }) => {
      void ticketId;
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["time-entries", vars.ticketId],
      });
    },
  });
}

export function useTotalTime(entries: TimeEntry[] | undefined): number {
  return useMemo(() => {
    if (!entries) return 0;
    return entries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  }, [entries]);
}
