import type { Profile } from "@/types";

export type BodySegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; userId: string };

const MENTION_RE = /@([\w][\w .]*[\w])/g;

/**
 * Extract user IDs of all @mentioned members from a comment body.
 */
export function parseMentions(body: string, members: Profile[]): string[] {
  const ids: string[] = [];
  const nameToId = new Map(members.map((m) => [m.name?.toLowerCase(), m.id]));

  let match: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(body)) !== null) {
    const id = nameToId.get(match[1].toLowerCase());
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Split a comment body into text and mention segments for styled rendering.
 */
export function segmentBody(body: string, members: Profile[]): BodySegment[] {
  const nameToProfile = new Map(members.map((m) => [m.name?.toLowerCase(), m]));
  const segments: BodySegment[] = [];
  let lastIndex = 0;

  MENTION_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MENTION_RE.exec(body)) !== null) {
    const profile = nameToProfile.get(match[1].toLowerCase());
    if (!profile) continue;

    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: body.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "mention",
      value: `@${match[1]}`,
      userId: profile.id,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", value: body.slice(lastIndex) });
  }

  return segments;
}
