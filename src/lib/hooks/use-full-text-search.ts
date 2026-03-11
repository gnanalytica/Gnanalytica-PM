"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { normalizeTicket } from "@/lib/hooks/use-tickets";
import type { Ticket } from "@/types";

const supabase = createClient();

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Full-text search via PostgreSQL websearch_to_tsquery.
 * Calls the `search_tickets` RPC function created in migrations.
 * Debounced by 300ms to avoid excessive API calls while typing.
 */
export function useFullTextSearch(query: string, projectId?: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["fts", debouncedQuery, projectId],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase.rpc("search_tickets", {
        search_query: debouncedQuery,
        p_project_id: projectId ?? null,
        result_limit: 50,
      });
      if (error) throw error;

      return (data ?? []).map((t: any) => normalizeTicket(t));
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });
}
