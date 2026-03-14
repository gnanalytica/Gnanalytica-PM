"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { Profile } from "@/types";

interface MembersContextType {
  members: Profile[];
  loading: boolean;
  error: Error | null;
  getMemberById: (id: string) => Profile | undefined;
  // Backward compatibility - return React Query interface
  data: Profile[];
  isLoading: boolean;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, role, created_at");

      if (error) throw error;
      return data as Profile[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const membersMap = useMemo(() => {
    const map = new Map<string, Profile>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const value: MembersContextType = {
    members,
    loading: isLoading,
    error: error as Error | null,
    getMemberById: (id: string) => membersMap.get(id),
    // Backward compatibility
    data: members,
    isLoading,
  };

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  );
}

export function useMembers() {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error("useMembers must be used within MembersProvider");
  }
  return context;
}
