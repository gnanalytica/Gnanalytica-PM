"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { TicketRelation, RelationType } from "@/types";

const supabase = createClient();

export function useTicketRelations(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-relations", ticketId],
    queryFn: async (): Promise<TicketRelation[]> => {
      const [{ data: outgoing, error: e1 }, { data: incoming, error: e2 }] =
        await Promise.all([
          supabase
            .from("ticket_relations")
            .select(
              "*, target_ticket:tickets!ticket_relations_target_ticket_id_fkey(id,title,status)",
            )
            .eq("source_ticket_id", ticketId),
          supabase
            .from("ticket_relations")
            .select(
              "*, source_ticket:tickets!ticket_relations_source_ticket_id_fkey(id,title,status)",
            )
            .eq("target_ticket_id", ticketId),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return [...(outgoing ?? []), ...(incoming ?? [])];
    },
    enabled: !!ticketId,
  });
}

export function useCreateRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      source_ticket_id,
      target_ticket_id,
      relation_type,
    }: {
      source_ticket_id: string;
      target_ticket_id: string;
      relation_type: RelationType;
    }) => {
      const { data, error } = await supabase
        .from("ticket_relations")
        .insert({ source_ticket_id, target_ticket_id, relation_type })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-relations", variables.source_ticket_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket-relations", variables.target_ticket_id],
      });
    },
  });
}

export function useDeleteRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ticketId }: { id: string; ticketId: string }) => {
      void ticketId;
      const { error } = await supabase
        .from("ticket_relations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-relations", variables.ticketId],
      });
    },
  });
}
