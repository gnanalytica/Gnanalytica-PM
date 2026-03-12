'use client';

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'list' | 'ticket' | 'dashboard';

const MODES: readonly ViewMode[] = ['list', 'ticket', 'dashboard'] as const;

interface UseModeToggleReturn {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  nextMode: () => void;
}

/**
 * Hook for managing view mode toggling with keyboard shortcuts
 * Supports Cmd+1/2/3 on Mac and Ctrl+1/2/3 on Windows/Linux
 *
 * @returns Object with current mode, setMode function, and nextMode function
 */
export function useModetoggle(): UseModeToggleReturn {
  const [mode, setModeState] = useState<ViewMode>('list');

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
  }, []);

  const nextMode = useCallback(() => {
    setModeState((currentMode) => {
      const currentIndex = MODES.indexOf(currentMode);
      const nextIndex = (currentIndex + 1) % MODES.length;
      return MODES[nextIndex];
    });
  }, []);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCommandKey = event.metaKey || event.ctrlKey;

      if (!isCommandKey) return;

      switch (event.code) {
        case 'Digit1':
          event.preventDefault();
          setModeState('list');
          break;
        case 'Digit2':
          event.preventDefault();
          setModeState('ticket');
          break;
        case 'Digit3':
          event.preventDefault();
          setModeState('dashboard');
          break;
        default:
          // Invalid shortcut combination
          return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    mode,
    setMode,
    nextMode,
  };
}
