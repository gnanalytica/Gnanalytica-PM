"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import type { Profile } from "@/types";
import { avatarColor } from "@/components/tickets/assignee-picker";

export function MentionTextarea({
  value,
  onChange,
  onSubmit,
  members,
  placeholder = "Write a comment...",
  autoFocus = false,
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  members: Profile[];
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const filtered = members.filter((m) =>
    m.name?.toLowerCase().includes(filter.toLowerCase()),
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const textBefore = value.slice(0, cursor);
    const atIndex = textBefore.lastIndexOf("@");

    if (atIndex === -1) {
      setShowDropdown(false);
      return;
    }

    if (atIndex > 0 && /\w/.test(textBefore[atIndex - 1])) {
      setShowDropdown(false);
      return;
    }

    const query = textBefore.slice(atIndex + 1);
    if (query.includes("\n")) {
      setShowDropdown(false);
      return;
    }

    setFilter(query);
    setMentionStart(atIndex);
    setShowDropdown(true);
    setSelectedIndex(0);
  }, [value]);

  const insertMention = (member: Profile) => {
    if (mentionStart === null) return;
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const mention = `@${member.name} `;
    const newValue = before + mention + after;

    onChange(newValue);
    setShowDropdown(false);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      const pos = mentionStart + mention.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    // Ctrl/Cmd+Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="w-full border border-border-subtle bg-surface-tertiary text-content-primary rounded-md px-2.5 py-1.5 text-sm resize-none"
      />

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-56 bg-surface-tertiary border border-border-subtle rounded-lg z-50 max-h-40 overflow-y-auto"
        >
          {filtered.map((member, i) => (
            <button
              key={member.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Keep textarea focus
                insertMention(member);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-content-primary hover:bg-hover ${
                i === selectedIndex ? "bg-blue-500/10 text-blue-400" : ""
              }`}
            >
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className={`w-5 h-5 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-[9px] font-semibold text-white drop-shadow-sm`}>
                  {member.name?.[0] ?? "?"}
                </div>
              )}
              <span className="truncate">{member.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="text-[10px] text-content-muted mt-0.5">
        @ to mention &middot; Ctrl+Enter to send
      </div>
    </div>
  );
}
