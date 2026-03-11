"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { Label } from "@/types";

const supabase = createClient();

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: async (): Promise<Label[]> => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .eq("project_id", projectId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      project_id,
      name,
      color,
    }: {
      project_id: string;
      name: string;
      color: string;
    }) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({ project_id, name, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", variables.project_id],
      });
    },
  });
}
