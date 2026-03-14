"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { Ticket } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const supabase = createClient();

/**
 * Subscribe to realtime ticket changes for a project.
 * Updates the Zustand store directly for immediate UI response.
 */
export function useRealtimeTickets(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const mutatingCount = useRef(0);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.mutation?.options.mutationKey?.[0] !== "tickets") return;

      if (event.type === "updated") {
        const status = event.mutation.state.status;
        if (status === "pending") {
          mutatingCount.current++;
        } else if (status === "success" || status === "error") {
          mutatingCount.current = Math.max(0, mutatingCount.current - 1);
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    if (!projectId) return;

    const { addTicket, updateTicket, removeTicket } = useTicketStore.getState();

    const handleInsert = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => {
      if (mutatingCount.current > 0) return;

      const row = payload.new as unknown as Ticket;
      if (!row?.id) return;

      // Add to Zustand store immediately
      addTicket({ ...row, labels: [] });

      // Background refetch for full relations
      queryClient.invalidateQueries({
        queryKey: ["tickets", projectId],
        refetchType: "active",
      });
    };

    const handleUpdate = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => {
      if (mutatingCount.current > 0) return;

      const row = payload.new as unknown as Ticket;
      if (!row?.id) return;

      // Update Zustand store (preserves joined data)
      const existing = useTicketStore.getState().byId[row.id];
      if (existing) {
        updateTicket(row.id, {
          ...row,
          assignee: existing.assignee,
          creator: existing.creator,
          labels: existing.labels,
        });
      }

      // Only refetch if this ticket is currently open/cached
      if (existing) {
        queryClient.invalidateQueries({
          queryKey: ["ticket", row.id],
          refetchType: "active",
        });
      }
    };

    const handleDelete = (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => {
      if (mutatingCount.current > 0) return;

      const deletedId = (payload.old as { id?: string })?.id;
      if (!deletedId) return;

      removeTicket(deletedId);
      queryClient.removeQueries({ queryKey: ["ticket", deletedId] });
    };

    const channel = supabase
      .channel(`project:${projectId}:events`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
          filter: `project_id=eq.${projectId}`,
        },
        handleInsert,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `project_id=eq.${projectId}`,
        },
        handleUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tickets",
          filter: `project_id=eq.${projectId}`,
        },
        handleDelete,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Realtime] project events channel error — will retry with backoff",
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}

/**
 * Subscribe to all realtime ticket detail changes (comments, assignees, relations, attachments, reactions).
 * Consolidated into a single channel to reduce connection overhead.
 */
export function useRealtimeTicketDetail(ticketId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;

    const invalidateComments = () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
    };

    const invalidateRelations = () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-relations", ticketId],
      });
    };

    const invalidateAttachments = () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-attachments", ticketId],
      });
    };

    const invalidateTicket = () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    };

    const channel = supabase
      .channel(`ticket:${ticketId}:detail`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidateComments,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_reactions" },
        invalidateComments,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_relations",
          filter: `source_ticket_id=eq.${ticketId}`,
        },
        invalidateRelations,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_relations",
          filter: `target_ticket_id=eq.${ticketId}`,
        },
        invalidateRelations,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_assignees",
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidateTicket,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_attachments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        invalidateAttachments,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Realtime] ticket detail channel error — will retry with backoff",
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);
}

// Keep old function names for backward compatibility, but delegate to consolidated hook
export function useRealtimeComments(ticketId: string) {
  useRealtimeTicketDetail(ticketId);
}

export function useRealtimeTicketRelations(ticketId: string) {
  useRealtimeTicketDetail(ticketId);
}

export function useRealtimeTicketAssignees(ticketId: string) {
  useRealtimeTicketDetail(ticketId);
}

export function useRealtimeTicketAttachments(ticketId: string) {
  useRealtimeTicketDetail(ticketId);
}

export function useRealtimeCommentReactions(ticketId: string) {
  useRealtimeTicketDetail(ticketId);
}

/**
 * Subscribe to realtime notification changes for the current user.
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Realtime] notifications channel error — will retry with backoff",
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
