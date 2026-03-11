"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import type { CommentReaction } from "@/types";

const supabase = createClient();

const QUICK_REACTIONS = ["👍", "👎", "❤️", "🎉", "😄", "🤔"];

export function CommentReactions({
  commentId,
  ticketId,
  reactions,
  currentUserId,
}: {
  commentId: string;
  ticketId: string;
  reactions?: CommentReaction[];
  currentUserId: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const toggleReaction = useMutation({
    mutationFn: async (emoji: string) => {
      const existing = reactions?.find(
        (r) => r.user_id === currentUserId && r.emoji === emoji,
      );
      if (existing) {
        const { error } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_reactions")
          .insert({ comment_id: commentId, user_id: currentUserId, emoji });
        if (error) throw error;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
    },
  });

  // Group reactions by emoji with counts
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; hasOwn: boolean }>();
    for (const r of reactions ?? []) {
      const existing = map.get(r.emoji) ?? { count: 0, hasOwn: false };
      existing.count++;
      if (r.user_id === currentUserId) existing.hasOwn = true;
      map.set(r.emoji, existing);
    }
    return map;
  }, [reactions, currentUserId]);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from(grouped.entries()).map(([emoji, { count, hasOwn }]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction.mutate(emoji)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-all duration-150 active:scale-[0.95] ${
            hasOwn
              ? "bg-accent-soft border-accent/30 text-accent"
              : "bg-surface-secondary border-border-subtle text-content-muted hover:border-content-muted"
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 rounded-full bg-surface-secondary hover:bg-hover active:scale-[0.9] flex items-center justify-center text-content-muted text-[11px] transition-all duration-150"
        >
          +
        </button>
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />
            <div className="animate-dropdown-in absolute bottom-full left-0 mb-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 p-1 flex gap-0.5 shadow-lg">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    toggleReaction.mutate(emoji);
                    setShowPicker(false);
                  }}
                  className="w-7 h-7 rounded hover:bg-hover active:scale-[0.9] flex items-center justify-center text-sm transition-all duration-150"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
