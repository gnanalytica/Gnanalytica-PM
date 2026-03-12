'use client';

import { useModetoggle, type ViewMode } from '@/lib/hooks/use-mode-toggle';
import { useState, useEffect } from 'react';

interface ModeButton {
  mode: ViewMode;
  label: string;
  shortcut: string;
}

const MODE_BUTTONS: ModeButton[] = [
  {
    mode: 'list',
    label: 'List',
    shortcut: 'Cmd+1',
  },
  {
    mode: 'ticket',
    label: 'Ticket',
    shortcut: 'Cmd+2',
  },
  {
    mode: 'dashboard',
    label: 'Dashboard',
    shortcut: 'Cmd+3',
  },
];

/**
 * Mode toggle component for switching between List, Ticket, and Dashboard views
 * Uses keyboard shortcuts Cmd+1/2/3 (or Ctrl+1/2/3 on Windows/Linux)
 */
export function ModeToggle() {
  const { mode, setMode } = useModetoggle();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-lg border border-border-subtle shadow-sm">
      {MODE_BUTTONS.map((button) => {
        const isActive = mode === button.mode;
        const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        const shortcutText = isMac ? button.shortcut : button.shortcut.replace('Cmd', 'Ctrl');

        return (
          <button
            key={button.mode}
            onClick={() => setMode(button.mode)}
            title={`${button.label} view (${shortcutText})`}
            className={`
              px-3 py-2 rounded-md text-13 font-medium
              transition-all duration-200 ease-out
              whitespace-nowrap
              ${
                isActive
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface-tertiary'
              }
            `}
            aria-pressed={isActive}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
