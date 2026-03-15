import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient<any>> | null = null;

/**
 * Custom lock implementation that prevents orphaned Web Locks from blocking
 * the auth session indefinitely. Uses navigator.locks with a timeout fallback
 * so the app never gets stuck on skeleton loaders.
 */
const lockTimeout = 5000;
const navigatorLock: (<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
) => Promise<R>) = async (name, acquireTimeout, fn) => {
  if (typeof navigator === "undefined" || !navigator.locks) {
    // Fallback for environments without Web Locks API
    return fn();
  }

  const timeout = Math.max(acquireTimeout, lockTimeout);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);

  try {
    return await navigator.locks.request(
      name,
      { signal: ac.signal },
      async () => fn(),
    );
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      // Lock timed out — run without lock to prevent hanging
      return fn();
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

export function createClient() {
  if (client) return client;

  client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        lock: navigatorLock,
      },
      realtime: {
        params: { eventsPerSecond: 2 },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(1000 * 2 ** tries, 30000),
        timeout: 10000,
      },
    },
  );
  return client;
}
