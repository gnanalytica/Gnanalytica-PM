"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrCreateProfile = useCallback(
    async (authUser: User): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data) return data;

        if (error && error.code === "PGRST116") {
          const meta = authUser.user_metadata;
          const { data: created } = await supabase
            .from("profiles")
            .insert({
              id: authUser.id,
              name: meta?.full_name ?? meta?.name ?? "User",
              avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            })
            .select()
            .single();
          return created;
        }
      } catch (e) {
        console.error("Profile fetch/create error:", e);
      }
      return null;
    },
    [supabase],
  );

  useEffect(() => {
    let isMounted = true;

    // Fetch initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const p = await fetchOrCreateProfile(currentUser);
        if (isMounted) setProfile(p);
      }
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const p = await fetchOrCreateProfile(currentUser);
        if (isMounted) setProfile(p);
      } else {
        setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchOrCreateProfile]);

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Sign in with Google failed:", error.message);
      throw error;
    }
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error(
        "No OAuth URL returned. Check that Google provider is enabled in Supabase.",
      );
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
