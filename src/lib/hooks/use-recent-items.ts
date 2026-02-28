'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { RecentItem } from '@/types';

const supabase = createClient();

export function useRecentItems(limit = 10) {
  return useQuery({
    queryKey: ['recent-items', limit],
    queryFn: async (): Promise<RecentItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('recent_items')
        .select('*')
        .eq('user_id', user.id)
        .order('accessed_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTrackRecentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      item_type,
      item_id,
    }: {
      item_type: 'ticket' | 'project' | 'milestone';
      item_id: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('recent_items')
        .upsert(
          {
            user_id: user.id,
            item_type,
            item_id,
            accessed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,item_type,item_id' },
        );
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-items'] });
    },
  });
}
