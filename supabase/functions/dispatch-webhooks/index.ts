// Supabase Edge Function: dispatch-webhooks
// Dispatches custom webhook events to registered webhook URLs.
// Called when ticket events occur (via database trigger or application code).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface WebhookEvent {
  project_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

serve(async (req: Request) => {
  try {
    const { project_id, event_type, payload }: WebhookEvent = await req.json();

    if (!project_id || !event_type) {
      return new Response(JSON.stringify({ error: 'Missing project_id or event_type' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find active webhooks for this project that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url, secret, events')
      .eq('project_id', project_id)
      .eq('is_active', true);

    if (error) throw error;

    const matching = (webhooks ?? []).filter((wh: { events: string[] }) =>
      wh.events?.includes(event_type),
    );

    let delivered = 0;
    const failures: string[] = [];

    for (const wh of matching) {
      try {
        const body = JSON.stringify({
          event: event_type,
          timestamp: new Date().toISOString(),
          project_id,
          data: payload,
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Sign payload with HMAC-SHA256 if secret is configured
        if (wh.secret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(wh.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
          );
          const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
          const hex = Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          headers['X-Webhook-Signature'] = `sha256=${hex}`;
        }

        const res = await fetch(wh.url, { method: 'POST', headers, body });
        if (res.ok) {
          delivered++;
        } else {
          failures.push(`${wh.url}: ${res.status}`);
        }
      } catch (err) {
        failures.push(`${wh.url}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ delivered, total: matching.length, failures }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
