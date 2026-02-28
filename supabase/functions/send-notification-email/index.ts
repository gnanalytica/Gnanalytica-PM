// Supabase Edge Function: send-notification-email
// Sends email notifications for ticket updates using Resend API.
// Triggered by a database webhook or called via supabase.functions.invoke().

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface NotificationPayload {
  user_id: string;
  subject: string;
  body: string;
  ticket_id?: string;
}

serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();
    const { user_id, subject, body } = payload;

    if (!user_id || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_mode')
      .eq('user_id', user_id)
      .maybeSingle();

    if (prefs?.email_mode === 'none') {
      return new Response(JSON.stringify({ skipped: true, reason: 'email_disabled' }), { status: 200 });
    }

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), { status: 404 });
    }

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PM Tool <notifications@pm.example.com>',
        to: user.email,
        subject,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #555; line-height: 1.6;">${body}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">You received this because of your notification preferences.</p>
        </div>`,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return new Response(JSON.stringify({ error: 'Resend API error', details: errBody }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
