"use client";

import { useState, useEffect, useCallback } from "react";

export function useKeyboardHelp() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+/ or Ctrl+/ — works regardless of focus
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      // ? (Shift+/) — only when not in an input/textarea/select
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, toggle, close };
}

/**
 * Global keyboard shortcuts for navigating and performing actions.
 * Should be called once at the layout level.
 */
export function useGlobalShortcuts({
  onCreateIssue,
  onGoToDashboard,
  onGoToMyIssues,
  onGoToInbox,
}: {
  onCreateIssue?: () => void;
  onGoToDashboard?: () => void;
  onGoToMyIssues?: () => void;
  onGoToInbox?: () => void;
}) {
  useEffect(() => {
    let gPending = false;
    let gTimeout: ReturnType<typeof setTimeout>;

    const down = (e: KeyboardEvent) => {
      // Skip when in input/textarea/select or when modifier keys are held
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if (inInput) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // G + <key> sequences (navigation)
      if (gPending) {
        gPending = false;
        clearTimeout(gTimeout);
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            onGoToDashboard?.();
            return;
          case "i":
            e.preventDefault();
            onGoToMyIssues?.();
            return;
          case "n":
            e.preventDefault();
            onGoToInbox?.();
            return;
        }
        return;
      }

      if (e.key === "g") {
        gPending = true;
        gTimeout = setTimeout(() => {
          gPending = false;
        }, 500);
        return;
      }

      // C — Create issue
      if (e.key === "c" && !e.shiftKey) {
        e.preventDefault();
        onCreateIssue?.();
        return;
      }
    };

    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
      clearTimeout(gTimeout);
    };
  }, [onCreateIssue, onGoToDashboard, onGoToMyIssues, onGoToInbox]);
}
