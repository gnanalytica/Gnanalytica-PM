"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { TicketAttachment } from "@/types";

const supabase = createClient();

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-attachments", ticketId],
    queryFn: async (): Promise<TicketAttachment[]> => {
      const { data, error } = await supabase
        .from("ticket_attachments")
        .select("*, uploader:profiles!ticket_attachments_uploaded_by_fkey(*)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ticketId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      file,
    }: {
      ticketId: string;
      file: File;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const storagePath = `attachments/${ticketId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ticket-attachments")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("ticket_attachments")
        .insert({
          ticket_id: ticketId,
          uploaded_by: user.id,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type || null,
          file_size: file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-attachments", variables.ticketId],
      });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      storagePath,
    }: {
      id: string;
      ticketId: string;
      storagePath: string;
    }) => {
      await supabase.storage.from("ticket-attachments").remove([storagePath]);
      const { error } = await supabase
        .from("ticket_attachments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-attachments", variables.ticketId],
      });
    },
  });
}
