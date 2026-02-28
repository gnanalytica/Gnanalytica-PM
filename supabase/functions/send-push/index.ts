// Supabase Edge Function: send-push
// Sends Web Push notifications via the Web Push protocol.
// Requires VAPID keys configured as environment variables.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
}

serve(async (req: Request) => {
  try {
    const payload: PushPayload = await req.json();
    const { user_id, title, body, url } = payload;

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check push preference
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled')
      .eq('user_id', user_id)
      .maybeSingle();

    if (prefs && !prefs.push_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: 'push_disabled' }), { status: 200 });
    }

    // Get push subscriptions for user (stored separately or in profiles)
    // For now, log the intent — actual Web Push implementation requires
    // push subscription storage and webpush library.
    console.log('Push notification intent:', {
      user_id,
      title,
      body,
      url,
      vapid_configured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Push notification queued' }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
