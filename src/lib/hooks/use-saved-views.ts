'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { SavedView, ViewFilters } from '@/types';

const supabase = createClient();

export function useSavedViews(projectId: string | undefined) {
  return useQuery({
    queryKey: ['saved-views', projectId],
    queryFn: async (): Promise<SavedView[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('project_id', projectId!)
        .eq('created_by', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      name: string;
      filters: ViewFilters;
      sort_key: string;
      sort_dir: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('saved_views')
        .insert({
          project_id: params.project_id,
          created_by: user.id,
          name: params.name,
          filters: params.filters,
          sort_key: params.sort_key,
          sort_dir: params.sort_dir,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', variables.project_id] });
    },
  });
}

export function useUpdateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      project_id: string;
      name?: string;
      filters?: ViewFilters;
      sort_key?: string;
      sort_dir?: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, project_id, ...updates } = params;
      const { data, error } = await supabase
        .from('saved_views')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', variables.project_id] });
    },
  });
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', variables.project_id] });
    },
  });
}
