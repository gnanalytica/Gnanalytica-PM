import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GitHub Webhook handler.
 * Receives events from GitHub (push, pull_request, issues) and links them
 * to tickets via ticket_github_links.
 *
 * Ticket linking: If a commit message or PR title contains "T-XXXXX" or
 * references a ticket ID, we create a github_link record.
 *
 * Auto-transition: When a PR is merged and linked to a ticket, the ticket
 * status can be auto-advanced (e.g. to "done").
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const event = req.headers.get("x-github-event");
    const payload = await req.json();

    if (event === "ping") {
      return NextResponse.json({ message: "pong" }, { status: 200 });
    }

    if (event === "pull_request") {
      const pr = payload.pull_request;
      const action = payload.action;

      // Extract ticket IDs from PR title/body (format: T-XXXX or #XXXX)
      const ticketIds = extractTicketIds(pr.title + " " + (pr.body ?? ""));

      for (const ticketId of ticketIds) {
        // Create or update link
        await supabase.from("ticket_github_links").upsert(
          {
            ticket_id: ticketId,
            github_type: "pull_request",
            github_id: String(pr.id),
            github_number: pr.number,
            github_url: pr.html_url,
            title: pr.title,
            status: pr.state,
            merged: pr.merged ?? false,
          },
          { onConflict: "ticket_id,github_type,github_id" },
        );

        // Auto-transition: PR merged → move ticket to "done"
        if (action === "closed" && pr.merged) {
          await supabase
            .from("tickets")
            .update({
              status: "done",
              status_category: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", ticketId)
            .in("status_category", ["started", "unstarted", "backlog"]);
        }
      }

      return NextResponse.json({ linked: ticketIds.length }, { status: 200 });
    }

    if (event === "push") {
      const commits = payload.commits ?? [];
      const linkedTickets = new Set<string>();

      for (const commit of commits) {
        const ticketIds = extractTicketIds(commit.message);
        for (const ticketId of ticketIds) {
          linkedTickets.add(ticketId);
          await supabase.from("ticket_github_links").upsert(
            {
              ticket_id: ticketId,
              github_type: "commit",
              github_id: commit.id,
              github_url: commit.url,
              title: commit.message.split("\n")[0].slice(0, 200),
              status: "committed",
              merged: false,
            },
            { onConflict: "ticket_id,github_type,github_id" },
          );
        }
      }

      return NextResponse.json({ linked: linkedTickets.size }, { status: 200 });
    }

    return NextResponse.json({ message: "Event not handled" }, { status: 200 });
  } catch (err) {
    console.error("GitHub webhook error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

/**
 * Extract ticket IDs from text.
 * Matches patterns like T-abc123, #abc123, or raw UUIDs.
 */
function extractTicketIds(text: string): string[] {
  const ids: string[] = [];

  // Match T-XXXX pattern (short hex IDs)
  const shortPattern = /\bT-([a-f0-9]{6,})\b/gi;
  let match;
  while ((match = shortPattern.exec(text)) !== null) {
    ids.push(match[1]);
  }

  // Match UUID pattern
  const uuidPattern =
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi;
  while ((match = uuidPattern.exec(text)) !== null) {
    ids.push(match[1]);
  }

  return Array.from(new Set(ids));
}
