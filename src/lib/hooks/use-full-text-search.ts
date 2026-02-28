'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { normalizeTicket } from '@/lib/hooks/use-tickets';
import type { Ticket } from '@/types';

const supabase = createClient();

/**
 * Full-text search via PostgreSQL websearch_to_tsquery.
 * Calls the `search_tickets` RPC function created in migrations.
 */
export function useFullTextSearch(query: string, projectId?: string) {
  return useQuery({
    queryKey: ['fts', query, projectId],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase.rpc('search_tickets', {
        search_query: query,
        p_project_id: projectId ?? null,
        result_limit: 50,
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((t: any) => normalizeTicket(t));
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
