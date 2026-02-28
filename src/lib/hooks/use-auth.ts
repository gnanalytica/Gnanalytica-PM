'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchOrCreateProfile = useCallback(
    async (authUser: User): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (data) return data;

        if (error && error.code === 'PGRST116') {
          const meta = authUser.user_metadata;
          const { data: created } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              name: meta?.full_name ?? meta?.name ?? 'User',
              avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            })
            .select()
            .single();
          return created;
        }
      } catch (e) {
        console.error('Profile fetch/create error:', e);
      }
      return null;
    },
    [supabase]
  );

  useEffect(() => {
    // Fetch initial session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const p = await fetchOrCreateProfile(currentUser);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const p = await fetchOrCreateProfile(currentUser);
          setProfile(p);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchOrCreateProfile]);

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Sign in with Google failed:', error.message);
      throw error;
    }
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No OAuth URL returned. Check that Google provider is enabled in Supabase.');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, profile, loading, signInWithGoogle, signOut };
}
