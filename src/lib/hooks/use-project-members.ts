'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { ProjectMember, ProjectRole } from '@/types';

const supabase = createClient();

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async (): Promise<ProjectMember[]> => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*, user:profiles(*)')
        .eq('project_id', projectId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useUpdateProjectMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      project_id,
      user_id,
      role,
    }: {
      project_id: string;
      user_id: string;
      role: ProjectRole;
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .upsert(
          { project_id, user_id, role },
          { onConflict: 'project_id,user_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.project_id] });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      project_id,
      user_id,
    }: {
      project_id: string;
      user_id: string;
    }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project_id)
        .eq('user_id', user_id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.project_id] });
    },
  });
}
