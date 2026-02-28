// Supabase Edge Function: send-digest
// Sends a daily digest email summarizing project activity.
// Should be invoked via a cron trigger (e.g. Supabase pg_cron or external scheduler).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find users who have digest enabled
    const { data: subscribers, error: subErr } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('digest_enabled', true);

    if (subErr) throw subErr;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    // Get activity from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activities, error: actErr } = await supabase
      .from('activity_log')
      .select('field, old_value, new_value, created_at, ticket:tickets(title)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (actErr) throw actErr;

    if (!activities || activities.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_activity' }), { status: 200 });
    }

    // Build digest HTML
    const activityItems = activities
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => `<li><strong>${a.ticket?.title ?? 'Unknown'}</strong>: ${a.field} changed</li>`)
      .join('\n');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Daily Activity Digest</h2>
        <p style="color: #555;">Here's what happened in the last 24 hours:</p>
        <ul style="color: #555; line-height: 1.8;">${activityItems}</ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Manage your preferences in Settings.</p>
      </div>
    `;

    // Send to each subscriber
    let sent = 0;
    for (const sub of subscribers) {
      const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);
      if (!user?.email) continue;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PM Tool <digest@pm.example.com>',
          to: user.email,
          subject: `Daily Digest — ${new Date().toLocaleDateString()}`,
          html,
        }),
      });

      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
