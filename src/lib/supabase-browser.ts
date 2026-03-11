import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient<any>> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
