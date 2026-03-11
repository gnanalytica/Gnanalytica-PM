"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/hooks/use-auth";
import type { ProjectRole } from "@/types";

const supabase = createClient();

export function useCurrentProjectRole(projectId: string | undefined) {
  const { profile } = useAuth();
  const userId = profile?.id;

  const { data: role, isLoading } = useQuery({
    queryKey: ["my-project-role", projectId, userId],
    queryFn: async (): Promise<ProjectRole | null> => {
      const { data, error } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as ProjectRole) ?? null;
    },
    enabled: !!projectId && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Default to "member" when no explicit project role is found.
  // Workspace members who haven't been added to project_members
  // should still be able to edit tickets.
  return { role: role ?? (isLoading ? undefined : "member" as ProjectRole), isLoading };
}
