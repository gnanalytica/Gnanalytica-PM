import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient<any>> | null = null;

/**
 * Custom lock that steals orphaned Web Locks to prevent the auth session
 * from hanging indefinitely. If the lock can't be acquired within the
 * timeout, it steals it to recover gracefully.
 */
const navigatorLockWithSteal = async <R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> => {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return fn();
  }

  const ac = new AbortController();
  const timeout = Math.max(acquireTimeout, 5000);
  const timer = setTimeout(() => ac.abort(), timeout);

  try {
    return await navigator.locks.request(
      name,
      { signal: ac.signal },
      () => fn(),
    );
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      // Lock acquisition timed out — steal the orphaned lock to recover
      return await navigator.locks.request(
        name,
        { steal: true },
        () => fn(),
      );
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
        lock: navigatorLockWithSteal,
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
