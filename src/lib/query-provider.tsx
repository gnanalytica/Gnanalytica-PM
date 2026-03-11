"use client";

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useSyncQueueStore, type MutationDescriptor } from "@/lib/sync-queue";

// ── Retry helpers ──

/** Don't retry client errors (4xx) except 408 (timeout) and 429 (rate limit). */
function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }
  // Also check .code for Supabase/Postgres errors
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    // PGRST* codes are PostgREST client errors — don't retry
    if (typeof code === "string" && code.startsWith("PGRST")) return false;
    // 42* = syntax/access errors — don't retry
    if (typeof code === "string" && code.startsWith("42")) return false;
  }
  return true;
}

function retryFn(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isRetryable(error);
}

function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 15_000);
}

// ── Describe a mutation for the sync queue UI ──

function describeMutation(variables: unknown): string {
  const vars = variables as Record<string, unknown> | null;
  if (!vars) return "Save changes";
  if ("title" in vars && !("id" in vars)) {
    return `Create: ${String(vars.title).slice(0, 40)}`;
  }
  if ("id" in vars) return "Update ticket";
  return "Save changes";
}

// ── Derive dedup key + descriptor from mutation context ──

function deriveDedupeKey(
  mutationKey: readonly unknown[] | undefined,
  variables: unknown,
): string | null {
  const key = mutationKey?.[0];
  if (key !== "tickets" && key !== "comments") return null;

  const vars = variables as Record<string, unknown> | null;
  if (!vars) return null;

  if (key === "tickets") {
    // Delete: has id, no title, no position updates → "delete:tickets:<id>"
    if (
      "id" in vars &&
      Object.keys(vars).length <= 2 &&
      "project_id" in vars &&
      !("title" in vars) &&
      !("status" in vars) &&
      !("position" in vars)
    ) {
      return `delete:tickets:${vars.id}`;
    }
    // Update: has id → "update:tickets:<id>"
    if ("id" in vars) {
      return `update:tickets:${vars.id}`;
    }
    // Reorder: has id + position → "reorder:tickets:<id>" (covered by update above)
    // Create: no id → "create:tickets:<project_id>:<title_hash>"
    if ("project_id" in vars && "title" in vars) {
      const hash = simpleHash(String(vars.title));
      return `create:tickets:${vars.project_id}:${hash}`;
    }
  }

  if (key === "comments") {
    if ("id" in vars && "ticket_id" in vars) {
      return `delete:comments:${vars.id}`;
    }
    if ("ticket_id" in vars && "body" in vars) {
      const hash = simpleHash(String(vars.body));
      return `create:comments:${vars.ticket_id}:${hash}`;
    }
  }

  return null;
}

function deriveDescriptor(
  mutationKey: readonly unknown[] | undefined,
  variables: unknown,
): MutationDescriptor | null {
  const key = mutationKey?.[0];
  const vars = variables as Record<string, unknown> | null;
  if (!vars) return null;

  if (key === "tickets") {
    // Delete
    if (
      "id" in vars &&
      Object.keys(vars).length <= 2 &&
      "project_id" in vars &&
      !("title" in vars) &&
      !("status" in vars) &&
      !("position" in vars)
    ) {
      return {
        table: "tickets",
        operation: "delete",
        payload: { id: vars.id },
      };
    }
    // Update (has id)
    if ("id" in vars) {
      const { id, project_id, label_ids, ...fields } = vars;
      return {
        table: "tickets",
        operation: "update",
        payload: { id, ...fields } as Record<string, unknown>,
      };
    }
    // Create
    if ("project_id" in vars && "title" in vars) {
      const { label_ids, ...ticketData } = vars;
      return {
        table: "tickets",
        operation: "insert",
        payload: ticketData as Record<string, unknown>,
      };
    }
  }

  if (key === "comments") {
    // Delete
    if ("id" in vars && "ticket_id" in vars && !("body" in vars)) {
      return {
        table: "comments",
        operation: "delete",
        payload: { id: vars.id },
      };
    }
    // Create
    if ("ticket_id" in vars && "body" in vars) {
      return {
        table: "comments",
        operation: "insert",
        payload: {
          ticket_id: vars.ticket_id,
          body: vars.body,
          ...(vars.parent_id ? { parent_id: vars.parent_id } : {}),
          // user_id will be missing — the queue retry won't have auth context
          // but we store what we can; executeMutation handles the raw insert
        },
      };
    }
  }

  return null;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

// ── Provider ──

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: retryFn,
            retryDelay,
          },
          mutations: {
            retry: retryFn,
            retryDelay,
          },
        },
        mutationCache: new MutationCache({
          onError: (error, variables, _context, mutation) => {
            const mutationKey = mutation.options.mutationKey;
            const key = mutationKey?.[0];
            if (key !== "tickets" && key !== "comments") return;

            const dedupeKey = deriveDedupeKey(mutationKey, variables);
            if (!dedupeKey) return;

            const descriptor = deriveDescriptor(mutationKey, variables);
            if (!descriptor) return;

            useSyncQueueStore.getState().add({
              dedupeKey,
              description: describeMutation(variables),
              descriptor,
              error: error instanceof Error ? error.message : String(error),
            });
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
