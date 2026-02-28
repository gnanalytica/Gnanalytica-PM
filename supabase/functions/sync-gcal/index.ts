// Supabase Edge Function: sync-gcal
// Syncs ticket due dates and milestones with Google Calendar.
// Requires OAuth tokens stored per user.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

interface SyncPayload {
  user_id: string;
  project_id: string;
  action: 'sync_due_dates' | 'sync_milestones';
}

serve(async (req: Request) => {
  try {
    const { user_id, project_id, action }: SyncPayload = await req.json();

    if (!user_id || !project_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or project_id' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for stored Google OAuth tokens
    // In production, tokens would be stored in a secure table
    // This is a skeleton implementation
    console.log('Google Calendar sync:', {
      user_id,
      project_id,
      action,
      google_configured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    });

    if (action === 'sync_due_dates') {
      // Fetch tickets with due dates
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, title, due_date, status_category')
        .eq('project_id', project_id)
        .not('due_date', 'is', null)
        .not('status_category', 'in', '("completed","canceled")');

      if (error) throw error;

      // In production: create/update Google Calendar events for each ticket
      return new Response(
        JSON.stringify({
          success: true,
          synced: tickets?.length ?? 0,
          message: 'Due date sync completed (skeleton)',
        }),
        { status: 200 },
      );
    }

    if (action === 'sync_milestones') {
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('id, name, target_date, status')
        .eq('project_id', project_id)
        .eq('status', 'active')
        .not('target_date', 'is', null);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          synced: milestones?.length ?? 0,
          message: 'Milestone sync completed (skeleton)',
        }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
