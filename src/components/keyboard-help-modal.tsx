"use client";

import { useEffect, useRef } from "react";

interface KeyboardHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_SECTIONS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["J"], sep: "/", keys2: ["K"], description: "Navigate issues" },
      {
        keys: ["G"],
        sep: "then",
        keys2: ["D"],
        description: "Go to dashboard",
      },
      {
        keys: ["G"],
        sep: "then",
        keys2: ["I"],
        description: "Go to my issues",
      },
      {
        keys: ["G"],
        sep: "then",
        keys2: ["N"],
        description: "Go to inbox",
      },
    ],
  },
  {
    title: "Issue Actions",
    shortcuts: [
      { keys: ["C"], description: "Create issue" },
      { keys: ["Esc"], description: "Close panel" },
      { keys: ["L"], description: "Add label" },
      { keys: ["\u2318", "Z"], description: "Undo (via toast)" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["Ctrl", "Enter"], description: "Submit comment" },
      { keys: ["\u2318", "Backspace"], description: "Delete" },
    ],
  },
  {
    title: "Search & Help",
    shortcuts: [
      { keys: ["\u2318", "K"], description: "Command palette" },
      { keys: ["/"], description: "Focus search" },
      { keys: ["?"], description: "This help" },
      { keys: ["\u2318", "/"], description: "Toggle help" },
    ],
  },
] as const;

type Shortcut = (typeof SHORTCUT_SECTIONS)[number]["shortcuts"][number];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-surface-tertiary border border-border-subtle rounded text-xs font-mono text-content-secondary">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  const { keys, description } = shortcut;
  const sep = "sep" in shortcut ? shortcut.sep : undefined;
  const keys2 = "keys2" in shortcut ? shortcut.keys2 : undefined;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-content-secondary">{description}</span>
      <span className="flex items-center gap-1 ml-4 shrink-0">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-xs text-content-muted">+</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
        {sep && keys2 && (
          <>
            <span className="text-xs text-content-muted mx-0.5">{sep}</span>
            {keys2.map((k, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-xs text-content-muted">+</span>}
                <Kbd>{k}</Kbd>
              </span>
            ))}
          </>
        )}
      </span>
    </div>
  );
}

export function KeyboardHelpModal({ open, onClose }: KeyboardHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Focus trap: capture previous focus and focus modal on open
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      requestAnimationFrame(() => modalRef.current?.focus());
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", down, true);
    return () => document.removeEventListener("keydown", down, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 animate-overlay-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        tabIndex={-1}
        className="w-full max-w-lg mx-4 bg-surface-secondary rounded-xl outline-none overflow-hidden animate-modal-in shadow-overlay"
        onKeyDown={(e) => {
          // Trap Tab inside modal
          if (e.key === "Tab") {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2
            id="keyboard-help-title"
            className="text-sm font-medium text-content-primary"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content-secondary rounded-md hover:bg-hover active:scale-[0.95] transition-all duration-150"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <div className="divide-y divide-border-subtle">
                  {section.shortcuts.map((shortcut, i) => (
                    <ShortcutRow key={i} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-surface-tertiary">
          <p className="text-xs text-content-muted text-center">
            Press <Kbd>?</Kbd> or <Kbd>{"\u2318"}</Kbd>
            <span className="text-xs text-content-muted mx-0.5">+</span>
            <Kbd>/</Kbd> to toggle this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
