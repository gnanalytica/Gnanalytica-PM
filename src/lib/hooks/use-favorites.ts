"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useMemo } from "react";
import type { Favorite } from "@/types";

const supabase = createClient();

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Favorite[];
    },
  });
}

export function useIsFavorite(
  itemType: "project" | "ticket",
  itemId: string,
): boolean {
  const { data: favorites } = useFavorites();
  return useMemo(
    () =>
      favorites?.some(
        (f) => f.item_type === itemType && f.item_id === itemId,
      ) ?? false,
    [favorites, itemType, itemId],
  );
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
    }: {
      itemType: "project" | "ticket";
      itemId: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" as const };
      } else {
        // Get max position
        const { data: maxRow } = await supabase
          .from("favorites")
          .select("position")
          .eq("user_id", user.id)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();
        const position = (maxRow?.position ?? 0) + 1;

        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            position,
          });
        if (error) throw error;
        return { action: "added" as const };
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
