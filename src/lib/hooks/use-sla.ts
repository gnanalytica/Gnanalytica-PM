"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { SLAPolicy, TicketPriority, Ticket } from "@/types";

const supabase = createClient();

export function useSLAPolicies(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sla-policies", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("sla_policies")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data ?? []) as SLAPolicy[];
    },
    enabled: !!projectId,
  });
}

export function useUpsertSLAPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: {
      project_id: string;
      priority: TicketPriority;
      response_time_minutes: number;
      resolution_time_minutes: number;
    }) => {
      const { data, error } = await supabase
        .from("sla_policies")
        .upsert(policy, { onConflict: "project_id,priority" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["sla-policies", vars.project_id],
      });
    },
  });
}

export type SLAStatus = {
  responseElapsed: number; // minutes
  responseTarget: number;
  responseBreached: boolean;
  responseRemaining: number;
  resolutionElapsed: number;
  resolutionTarget: number;
  resolutionBreached: boolean;
  resolutionRemaining: number;
  hasPolicy: boolean;
};

export function computeSLAStatus(
  ticket: Ticket,
  policies: SLAPolicy[],
): SLAStatus | null {
  const policy = policies.find((p) => p.priority === ticket.priority);
  if (!policy) return null;

  const now = Date.now();
  const created = new Date(ticket.created_at).getTime();

  // Response
  const responseEnd = ticket.first_response_at
    ? new Date(ticket.first_response_at).getTime()
    : now;
  const responseElapsed = Math.round((responseEnd - created) / 60000);
  const responseBreached =
    ticket.sla_response_breached ||
    (!ticket.first_response_at &&
      responseElapsed > policy.response_time_minutes);
  const responseRemaining = policy.response_time_minutes - responseElapsed;

  // Resolution
  const resolutionEnd = ticket.resolved_at
    ? new Date(ticket.resolved_at).getTime()
    : now;
  const resolutionElapsed = Math.round((resolutionEnd - created) / 60000);
  const resolutionBreached =
    ticket.sla_resolution_breached ||
    (!ticket.resolved_at && resolutionElapsed > policy.resolution_time_minutes);
  const resolutionRemaining =
    policy.resolution_time_minutes - resolutionElapsed;

  return {
    responseElapsed,
    responseTarget: policy.response_time_minutes,
    responseBreached,
    responseRemaining,
    resolutionElapsed,
    resolutionTarget: policy.resolution_time_minutes,
    resolutionBreached,
    resolutionRemaining,
    hasPolicy: true,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
