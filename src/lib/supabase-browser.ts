import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient<any>> | null = null;

/**
 * Patch navigator.locks.request to prevent orphaned locks from blocking
 * the Supabase auth session indefinitely. If a lock request takes longer
 * than 10 seconds, automatically steal it to recover.
 */
if (typeof navigator !== "undefined" && navigator.locks) {
  const originalRequest = navigator.locks.request.bind(navigator.locks);

  (navigator.locks as any).request = function patchedRequest(
    name: string,
    optionsOrCallback: LockOptions | LockGrantedCallback<any>,
    maybeCallback?: LockGrantedCallback<any>,
  ): Promise<any> {
    const hasOptions = typeof optionsOrCallback !== "function";
    const options = hasOptions ? (optionsOrCallback as LockOptions) : undefined;
    const callback = hasOptions
      ? maybeCallback!
      : (optionsOrCallback as LockGrantedCallback<any>);

    // Only apply steal-timeout to Supabase auth locks
    if (name.startsWith("lock:sb-")) {
      // Don't interfere if already using steal or ifAvailable
      if (options?.steal || options?.ifAvailable) {
        return hasOptions
          ? originalRequest(name, options, callback)
          : originalRequest(name, callback);
      }

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10000);

      return originalRequest(name, { ...options, signal: ac.signal }, callback)
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") {
            // Lock timed out — steal to recover from orphaned lock
            return originalRequest(name, { steal: true }, callback);
          }
          throw e;
        })
        .finally(() => clearTimeout(timer));
    }

    // Pass through non-Supabase lock requests unchanged
    return hasOptions
      ? originalRequest(name, options!, callback)
      : originalRequest(name, callback);
  };
}

export function createClient() {
  if (client) return client;

  client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: { eventsPerSecond: 2 },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) =>
          Math.min(1000 * 2 ** tries, 30000),
        timeout: 10000,
      },
    },
  );
  return client;
}
