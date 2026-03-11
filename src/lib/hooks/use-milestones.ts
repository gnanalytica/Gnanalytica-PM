"use client";

import { useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { createClient } from "@/lib/supabase-browser";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { Milestone } from "@/types";

const supabase = createClient();

// ── Hydration ──

export function useHydrateMilestones(projectId: string | undefined) {
  const hydratedRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("target_date", { ascending: true, nullsFirst: false });
      if (error) throw error;

      const milestones: Milestone[] = data ?? [];
      useTicketStore.getState().setMilestones(milestones);
      return milestones;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (query.data && hydratedRef.current !== projectId) {
      hydratedRef.current = projectId ?? null;
      useTicketStore.getState().setMilestones(query.data);
    }
  }, [query.data, projectId]);

  return { isLoading: query.isLoading, isError: query.isError };
}

// ── Selectors ──

export function useProjectMilestones(projectId: string): Milestone[] {
  const { milestonesById, milestoneIds } = useTicketStore(
    useShallow((s) => ({
      milestonesById: s.milestonesById,
      milestoneIds: s.milestoneIds,
    })),
  );

  return useMemo(
    () =>
      milestoneIds
        .map((id) => milestonesById[id])
        .filter((m): m is Milestone => m != null && m.project_id === projectId),
    [milestonesById, milestoneIds, projectId],
  );
}

// ── Mutations ──

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone: {
      project_id: string;
      name: string;
      description?: string;
      target_date?: string;
    }) => {
      const { data, error } = await supabase
        .from("milestones")
        .insert(milestone)
        .select()
        .single();
      if (error) throw error;
      return data as Milestone;
    },
    onSuccess: (data) => {
      useTicketStore.getState().addMilestone(data);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", variables.project_id],
      });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      project_id,
      ...updates
    }: {
      id: string;
      project_id: string;
      name?: string;
      description?: string;
      target_date?: string | null;
      status?: "active" | "completed" | "canceled";
    }) => {
      void project_id;
      const { data, error } = await supabase
        .from("milestones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Milestone;
    },
    onMutate: ({ id, ...updates }) => {
      useTicketStore.getState().updateMilestone(id, updates);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", variables.project_id],
      });
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      project_id,
    }: {
      id: string;
      project_id: string;
    }) => {
      void project_id;
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: ({ id }) => {
      useTicketStore.getState().removeMilestone(id);
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", variables.project_id],
      });
    },
  });
}
