"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type {
  CustomFieldDefinition,
  CustomFieldValue,
  CustomFieldType,
} from "@/types";

const supabase = createClient();

// ── Definitions ──

export function useCustomFieldDefinitions(projectId: string | undefined) {
  return useQuery({
    queryKey: ["custom-field-definitions", projectId],
    queryFn: async (): Promise<CustomFieldDefinition[]> => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .select("*")
        .eq("project_id", projectId!)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (field: {
      project_id: string;
      name: string;
      field_type: CustomFieldType;
      options?: string[];
      required?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .insert(field)
        .select()
        .single();
      if (error) throw error;
      return data as CustomFieldDefinition;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["custom-field-definitions", variables.project_id],
      });
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      project_id,
    }: {
      id: string;
      project_id: string;
    }) => {
      void project_id;
      const { error } = await supabase
        .from("custom_field_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["custom-field-definitions", variables.project_id],
      });
    },
  });
}

// ── Values ──

export function useCustomFieldValues(ticketId: string) {
  return useQuery({
    queryKey: ["custom-field-values", ticketId],
    queryFn: async (): Promise<CustomFieldValue[]> => {
      const { data, error } = await supabase
        .from("ticket_custom_field_values")
        .select("*")
        .eq("ticket_id", ticketId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ticketId,
  });
}

export function useUpsertCustomFieldValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticket_id,
      field_id,
      value,
    }: {
      ticket_id: string;
      field_id: string;
      value: string | null;
    }) => {
      const { data, error } = await supabase
        .from("ticket_custom_field_values")
        .upsert(
          { ticket_id, field_id, value, updated_at: new Date().toISOString() },
          { onConflict: "ticket_id,field_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["custom-field-values", variables.ticket_id],
      });
    },
  });
}
