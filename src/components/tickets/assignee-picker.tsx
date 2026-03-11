"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Profile } from "@/types";

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-green-500",
  "bg-lime-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-red-500",
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function AvatarStack({
  assignees,
  max = 3,
}: {
  assignees: Profile[];
  max?: number;
}) {
  if (assignees.length === 0) {
    return <span className="text-content-muted text-[12px]">Unassigned</span>;
  }

  const shown = assignees.slice(0, max);
  const overflow = assignees.length - max;

  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div
          key={a.id}
          className="group/avatar relative flex-shrink-0 rounded-full ring-2 ring-surface-primary transition-transform duration-150 hover:scale-110 hover:z-10"
          style={{ marginLeft: i > 0 ? -6 : 0, zIndex: max - i }}
        >
          {a.avatar_url ? (
            <Image
              src={a.avatar_url}
              alt=""
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full ${avatarColor(a.id)} flex items-center justify-center`}>
              <span className="text-[9px] font-semibold text-white drop-shadow-sm">
                {(a.name ?? "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          {/* Tooltip popup */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 rounded-md bg-surface-tertiary border border-border-subtle shadow-lg text-[11px] font-medium text-content-primary whitespace-nowrap opacity-0 scale-95 group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all duration-150 z-50">
            <span className="mr-1">👤</span>{a.name ?? "Unknown"}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-border-subtle" />
          </div>
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="group/overflow relative flex-shrink-0 w-5 h-5 rounded-full bg-surface-secondary ring-2 ring-surface-primary flex items-center justify-center transition-transform duration-150 hover:scale-110 hover:z-10"
          style={{ marginLeft: -6 }}
        >
          <span className="text-[8px] font-medium text-content-muted">
            +{overflow}
          </span>
          {/* Tooltip for overflow */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 rounded-md bg-surface-tertiary border border-border-subtle shadow-lg text-[11px] text-content-primary whitespace-nowrap opacity-0 scale-95 group-hover/overflow:opacity-100 group-hover/overflow:scale-100 transition-all duration-150 z-50">
            {assignees.slice(max).map((a) => a.name).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssigneePicker({
  selectedIds,
  members,
  onToggle,
  onClear,
  readOnly,
  isOpen: controlledOpen,
  onToggleOpen,
}: {
  selectedIds: string[];
  members: Profile[];
  onToggle: (userId: string) => void;
  onClear: () => void;
  readOnly?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggleOpen ?? (() => setInternalOpen(!internalOpen));

  const selectedProfiles = selectedIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as Profile[];

  const filtered = search.trim()
    ? members.filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : members;

  // Close on outside click (only for uncontrolled mode)
  useEffect(() => {
    if (!open || controlledOpen !== undefined) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-assignee-picker]")) setInternalOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, controlledOpen]);

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <div className="relative" data-assignee-picker data-dropdown>
      <button
        onClick={() => !readOnly && toggle()}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 ${
          readOnly
            ? "cursor-default"
            : "hover:bg-hover hover:shadow-xs active:scale-[0.96]"
        } ${open ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
      >
        <AvatarStack assignees={selectedProfiles} />
        {selectedProfiles.length === 1 && (
          <span className="truncate max-w-[80px] ml-0.5">
            {selectedProfiles[0].name}
          </span>
        )}
        {selectedProfiles.length > 1 && (
          <span className="text-content-muted ml-0.5">
            {selectedProfiles.length} assigned
          </span>
        )}
      </button>

      {open && (
        <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 min-w-[220px] max-h-64 overflow-hidden py-1 shadow-lg">
          {/* Search */}
          <div className="px-2 pb-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full border border-border-subtle rounded px-2 py-1 text-xs bg-surface-secondary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Clear option */}
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  onClear();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-content-muted hover:bg-hover transition-all duration-150 active:scale-[0.99]"
              >
                Clear all
              </button>
            )}

            {/* Member list with checkboxes */}
            {filtered.map((m) => {
              const isSelected = selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => onToggle(m.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "bg-accent-soft text-accent"
                      : "text-content-secondary hover:bg-hover"
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                      isSelected
                        ? "bg-accent border-accent"
                        : "border-border-subtle"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt=""
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-4 h-4 rounded-full ${avatarColor(m.id)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[8px] font-semibold text-white drop-shadow-sm">
                        {(m.name ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  <span className="truncate">{m.name}</span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-content-muted">
                No members found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { AvatarStack };
