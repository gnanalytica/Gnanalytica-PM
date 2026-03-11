"use client";

import { useIsWatching, useToggleWatch } from "@/lib/hooks/use-watchers";

export function WatchButton({
  ticketId,
  userId,
}: {
  ticketId: string;
  userId: string;
}) {
  const watching = useIsWatching(ticketId, userId);
  const toggleWatch = useToggleWatch();

  return (
    <button
      onClick={() => toggleWatch.mutate({ ticketId, userId, watching })}
      disabled={toggleWatch.isPending}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all duration-150 active:scale-[0.96] ${
        watching
          ? "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:shadow-xs"
          : "text-content-muted border-border-subtle hover:bg-hover hover:shadow-xs"
      }`}
      title={watching ? "Stop watching" : "Watch this ticket"}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        {watching ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        )}
        {watching && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        )}
      </svg>
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
