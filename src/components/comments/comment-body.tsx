"use client";

import { segmentBody } from "@/lib/mentions";
import type { Profile } from "@/types";

export function CommentBody({
  body,
  members,
}: {
  body: string;
  members: Profile[];
}) {
  const segments = segmentBody(body, members);

  return (
    <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span key={i} className="text-blue-600 bg-blue-50 rounded px-0.5">
            {seg.value}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </p>
  );
}
