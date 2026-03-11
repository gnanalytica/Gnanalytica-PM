"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { Profile } from "@/types";

const supabase = createClient();

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
