'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Team, TeamMember } from '@/types';

const supabase = createClient();

export function useTeams(projectId: string | undefined) {
  return useQuery({
    queryKey: ['teams', projectId],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('*, members:team_members(*, user:profiles(*))')
        .eq('project_id', projectId!)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: {
      project_id: string;
      name: string;
      description?: string;
      color?: string;
    }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();
      if (error) throw error;
      return data as Team;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.project_id] });
    },
  });
}

export function useUpdateTeam() {
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
      color?: string;
    }) => {
      void project_id;
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Team;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.project_id] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      void project_id;
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.project_id] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      team_id,
      user_id,
      role,
      project_id,
    }: {
      team_id: string;
      user_id: string;
      role?: 'lead' | 'member';
      project_id: string;
    }) => {
      void project_id;
      const { data, error } = await supabase
        .from('team_members')
        .insert({ team_id, user_id, role: role ?? 'member' })
        .select()
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.project_id] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      team_id,
      user_id,
      project_id,
    }: {
      team_id: string;
      user_id: string;
      project_id: string;
    }) => {
      void project_id;
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team_id)
        .eq('user_id', user_id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.project_id] });
    },
  });
}
