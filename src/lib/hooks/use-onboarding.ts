"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProjects } from "@/lib/hooks/use-projects";
import type { OnboardingState, Project } from "@/types";

const supabase = createClient();

const TOTAL_STEPS = 5;

/**
 * Fetch or initialize the onboarding state for the current user.
 * Auto-creates a row on first login. If the user already has projects,
 * the row is created with completed=true (skip onboarding).
 */
export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const { isLoading: projectsLoading } = useProjects();
  const queryClient = useQueryClient();

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding", userId],
    queryFn: async (): Promise<OnboardingState> => {
      // Try to fetch existing row
      const { data, error } = await supabase
        .from("onboarding_state")
        .select("user_id, step, completed, created_at, updated_at")
        .eq("user_id", userId!)
        .single();

      if (data) return data;

      // No row exists — this is a first login. Create one.
      if (error && error.code === "PGRST116") {
        // Read projects from cache inside queryFn to avoid stale closure / refetch loops
        const projectsFromCache = queryClient.getQueryData<Project[]>([
          "projects",
        ]);
        const hasProjects = (projectsFromCache?.length ?? 0) > 0;
        const initial: Pick<OnboardingState, "user_id" | "step" | "completed"> =
          {
            user_id: userId!,
            step: 1,
            completed: hasProjects,
          };
        const { data: created, error: insertError } = await supabase
          .from("onboarding_state")
          .insert(initial)
          .select()
          .single();
        if (insertError) throw insertError;
        return created;
      }

      throw error;
    },
    enabled: !!userId && !projectsLoading,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (
      updates: Partial<Pick<OnboardingState, "step" | "completed">>,
    ) => {
      const { data, error } = await supabase
        .from("onboarding_state")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId!)
        .select()
        .single();
      if (error) throw error;
      return data as OnboardingState;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["onboarding", userId] });
      const previous = queryClient.getQueryData<OnboardingState>([
        "onboarding",
        userId,
      ]);
      if (previous) {
        queryClient.setQueryData<OnboardingState>(["onboarding", userId], {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["onboarding", userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", userId] });
    },
  });

  const isLoading = authLoading || projectsLoading || onboardingLoading;
  const isActive = !isLoading && !!onboarding && !onboarding.completed;
  const step = onboarding?.step ?? 1;

  const goToStep = useCallback(
    (nextStep: number) => {
      updateMutation.mutate({ step: nextStep });
    },
    [updateMutation],
  );

  const completeOnboarding = useCallback(() => {
    updateMutation.mutate({ step: TOTAL_STEPS, completed: true });
  }, [updateMutation]);

  const skipOnboarding = useCallback(() => {
    updateMutation.mutate({ completed: true });
  }, [updateMutation]);

  return {
    isLoading,
    isActive,
    step,
    totalSteps: TOTAL_STEPS,
    goToStep,
    completeOnboarding,
    skipOnboarding,
  };
}
