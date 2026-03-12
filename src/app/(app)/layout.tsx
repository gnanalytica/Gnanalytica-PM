"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { MobileModeTabs } from "@/components/layout/mobile-mode-tabs";
import { CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";
import { SyncStatus, useSyncProcessor } from "@/lib/sync-queue";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";
import { KeyboardHelpModal } from "@/components/keyboard-help-modal";
import { useKeyboardHelp, useGlobalShortcuts } from "@/lib/hooks/use-keyboard-help";
import { SidebarSkeleton } from "@/components/skeletons";
import { ToastContainer } from "@/components/toast-container";
import { logError } from "@/lib/log-error";
import { useWorkspaceNav } from "@/lib/hooks/use-workspace-nav";
import { TicketDetailPanel } from "@/components/tickets/ticket-detail-panel";
import { TicketSidePanel } from "@/components/tickets/ticket-side-panel";
import { useResizable, ResizeHandle } from "@/components/resize-handle";
import { ModeToggle } from "@/components/mode-toggle";

function handleError(error: Error, info: React.ErrorInfo) {
  logError(error, {
    boundary: "app-layout",
    componentStack: info.componentStack,
  });
}

/** Memoized page content — prevents re-renders when layout-level state changes (sidebar, mobile nav, help modal) */
const PageContent = memo(function PageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full animate-fade-in">
      <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>
    </div>
  );
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSyncProcessor();
  const router = useRouter();
  const { open: helpOpen, close: helpClose } = useKeyboardHelp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { ticketId, closeTicket, replaceTicket } = useWorkspaceNav();

  useGlobalShortcuts({
    onGoToDashboard: useCallback(() => router.push("/dashboard"), [router]),
    onGoToMyIssues: useCallback(() => router.push("/my-issues"), [router]),
    onGoToInbox: useCallback(() => router.push("/inbox"), [router]),
  });

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const collapseSidebar = useCallback(() => setSidebarCollapsed(true), []);
  const expandSidebar = useCallback(() => setSidebarCollapsed(false), []);

  const sidebar = useResizable({
    storageKey: "pm-sidebar-width",
    defaultWidth: 220,
    minWidth: 180,
    maxWidth: 360,
    side: "left",
  });

  const detailPanel = useResizable({
    storageKey: "pm-detail-panel-width",
    defaultWidth: 440,
    minWidth: 320,
    maxWidth: 700,
    side: "right",
  });

  return (
    <div className="flex h-screen">
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-sidebar border-b border-border-subtle flex items-center px-4 gap-3 z-30 lg:hidden">
        <button
          onClick={openMobileNav}
          className="p-1 text-content-secondary hover:text-content-primary rounded transition-colors"
          aria-label="Open navigation"
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
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <span className="text-13 font-semibold text-content-primary truncate tracking-tight">
          Internal PM
        </span>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex transition-[width] duration-200 ease-out flex-shrink-0 ${sidebarCollapsed ? "w-0 overflow-hidden" : ""}`}
        style={sidebarCollapsed ? undefined : { width: sidebar.width }}
      >
        <ErrorBoundary onError={handleError} fallback={<SidebarSkeleton />}>
          <Sidebar onCollapse={collapseSidebar} />
        </ErrorBoundary>
      </div>

      {/* Sidebar resize handle */}
      {!sidebarCollapsed && (
        <div className="hidden lg:flex">
          <ResizeHandle onMouseDown={sidebar.onMouseDown} />
        </div>
      )}

      {/* Collapsed sidebar expand button */}
      {sidebarCollapsed && (
        <button
          onClick={expandSidebar}
          className="hidden lg:flex fixed top-2 left-2 z-30 p-1.5 bg-surface-secondary border border-border-subtle rounded-md text-content-muted hover:text-content-primary shadow-sm transition-colors"
          title="Expand sidebar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      )}

      {/* Mobile nav drawer */}
      <MobileNavDrawer open={mobileNavOpen} onClose={closeMobileNav} />

      {/* Main content area — three-panel layout on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop header with mode toggle */}
        <div className="hidden lg:flex h-12 border-b border-border-subtle bg-surface-primary items-center px-4 justify-between">
          <div className="flex-1" />
          <ModeToggle />
          <div className="flex-1" />
        </div>

        {/* Content panels */}
        <div className="flex-1 flex flex-row overflow-hidden pt-12 lg:pt-0">
          {/* Middle panel (page content) */}
          <main
            className={`flex-1 overflow-y-auto bg-surface-primary min-w-0 transition-all duration-200 ${ticketId ? "lg:flex-[1_1_0%]" : ""}`}
          >
            <PageContent>{children}</PageContent>
          </main>

        {/* Desktop detail panel — inline, not overlay */}
        {ticketId && (
          <>
            <div className="hidden lg:flex">
              <ResizeHandle onMouseDown={detailPanel.onMouseDown} />
            </div>
            <div
              className="hidden lg:flex flex-shrink-0 border-l border-border-subtle bg-surface-primary overflow-hidden"
              style={{ width: detailPanel.width }}
            >
              <div className="w-full h-full overflow-hidden">
                <TicketDetailPanel
                  ticketId={ticketId}
                  onClose={closeTicket}
                  onTicketNavigate={replaceTicket}
                />
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Mobile: overlay side panel */}
      <div className="lg:hidden">
        <TicketSidePanel ticketId={ticketId} onClose={closeTicket} />
      </div>

      {/* Mobile mode tabs */}
      <MobileModeTabs />

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
