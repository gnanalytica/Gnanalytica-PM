// Supabase Edge Function: send-due-date-reminders
// Sends reminder emails for tickets due within the next 24 hours.
// Should be invoked via a daily cron trigger.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Find tickets due today or tomorrow that are not completed/canceled
    const { data: tickets, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, title, due_date, assignee_id, project:projects(name)')
      .gte('due_date', today)
      .lte('due_date', tomorrow)
      .not('status_category', 'in', '("completed","canceled")')
      .not('assignee_id', 'is', null);

    if (ticketErr) throw ticketErr;
    if (!tickets || tickets.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_due_tickets' }), { status: 200 });
    }

    // Group by assignee
    const byAssignee: Record<string, typeof tickets> = {};
    for (const t of tickets) {
      if (!t.assignee_id) continue;
      if (!byAssignee[t.assignee_id]) byAssignee[t.assignee_id] = [];
      byAssignee[t.assignee_id].push(t);
    }

    let sent = 0;
    for (const [userId, userTickets] of Object.entries(byAssignee)) {
      // Check preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_mode')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefs?.email_mode === 'none') continue;

      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (!user?.email) continue;

      const items = userTickets
         
        .map((t: any) => `<li><strong>${t.title}</strong> — due ${t.due_date} (${t.project?.name ?? 'Unknown project'})</li>`)
        .join('\n');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PM Tool <reminders@pm.example.com>',
          to: user.email,
          subject: `Due Date Reminder: ${userTickets.length} issue${userTickets.length > 1 ? 's' : ''} due soon`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Due Date Reminder</h2>
              <p style="color: #555;">The following issues are due soon:</p>
              <ul style="color: #555; line-height: 1.8;">${items}</ul>
            </div>
          `,
        }),
      });

      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
