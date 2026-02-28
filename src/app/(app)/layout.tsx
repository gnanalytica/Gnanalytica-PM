'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { ErrorBoundary } from '@/components/error-boundary';
import { SyncStatus, useSyncProcessor } from '@/lib/sync-queue';
import { OnboardingOverlay } from '@/components/onboarding/onboarding-overlay';
import { KeyboardHelpModal } from '@/components/keyboard-help-modal';
import { useKeyboardHelp } from '@/lib/hooks/use-keyboard-help';
import { SidebarSkeleton } from '@/components/skeletons';
import { ToastContainer } from '@/components/toast-container';
import { logError } from '@/lib/log-error';

function handleError(error: Error, info: React.ErrorInfo) {
  logError(error, { boundary: 'app-layout', componentStack: info.componentStack });
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSyncProcessor();
  const { open: helpOpen, close: helpClose } = useKeyboardHelp();

  return (
    <div className="flex h-screen">
      <ErrorBoundary
        onError={handleError}
        fallback={<SidebarSkeleton />}
      >
        <Sidebar />
      </ErrorBoundary>
      <main className="flex-1 overflow-y-auto bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 py-1.5 animate-fade-in">
          <ErrorBoundary onError={handleError}>
            {children}
          </ErrorBoundary>
        </div>
      </main>
      <ErrorBoundary onError={handleError} fallback={null}>
        <CommandPalette />
      </ErrorBoundary>
      <SyncStatus />
      <OnboardingOverlay />
      <KeyboardHelpModal open={helpOpen} onClose={helpClose} />
      <ToastContainer />
    </div>
  );
}
