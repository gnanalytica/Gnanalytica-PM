"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { Profile } from "@/types";

export type CommentSearchResult = {
  id: string;
  ticket_id: string;
  body: string;
  created_at: string;
  user: Profile | null;
  ticket: { id: string; title: string; project_id: string } | null;
};

export function useCommentSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<CommentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending debounce
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Abort in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!enabled || query.length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("comments")
          .select(
            "id, ticket_id, body, created_at, user:profiles(*), ticket:tickets(id, title, project_id)",
          )
          .ilike("body", `%${query}%`)
          .limit(5)
          .abortSignal(controller.signal);

        if (controller.signal.aborted) return;

        if (error) {
          console.error("Comment search error:", error);
          setResults([]);
        } else {
          setResults((data as unknown as CommentSearchResult[]) ?? []);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Comment search error:", err);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [query, enabled]);

  return { results, isSearching };
}
