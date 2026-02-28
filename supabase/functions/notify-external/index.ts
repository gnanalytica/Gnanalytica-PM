// Supabase Edge Function: notify-external
// Dispatches notifications to Slack/Discord via incoming webhook URLs.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface ExternalNotification {
  type: 'slack' | 'discord';
  webhook_url: string;
  message: string;
  title?: string;
  url?: string;
}

serve(async (req: Request) => {
  try {
    const payload: ExternalNotification = await req.json();
    const { type, webhook_url, message, title, url } = payload;

    if (!webhook_url || !message) {
      return new Response(JSON.stringify({ error: 'Missing webhook_url or message' }), { status: 400 });
    }

    let body: string;

    if (type === 'slack') {
      body = JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: title ? `*${title}*\n${message}` : message,
            },
          },
          ...(url
            ? [{
                type: 'actions',
                elements: [{
                  type: 'button',
                  text: { type: 'plain_text', text: 'View' },
                  url,
                }],
              }]
            : []),
        ],
      });
    } else {
      // Discord
      body = JSON.stringify({
        embeds: [{
          title: title ?? 'Notification',
          description: message,
          url,
          color: 0x5e6ad2,
        }],
      });
    }

    const res = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'Webhook delivery failed', details: errText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
