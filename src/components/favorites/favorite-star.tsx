"use client";

import { useIsFavorite, useToggleFavorite } from "@/lib/hooks/use-favorites";

export function FavoriteStar({
  itemType,
  itemId,
  className,
}: {
  itemType: "project" | "ticket";
  itemId: string;
  className?: string;
}) {
  const isFavorite = useIsFavorite(itemType, itemId);
  const toggle = useToggleFavorite();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle.mutate({ itemType, itemId });
      }}
      className={`flex-shrink-0 transition-all duration-150 active:scale-[0.85] ${
        isFavorite
          ? "text-amber-400 hover:text-amber-500 animate-pop-in"
          : "text-content-muted/40 hover:text-amber-400"
      } ${className ?? "p-0.5"}`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    </button>
  );
}
