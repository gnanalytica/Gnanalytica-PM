"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const signOut = () => {
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - sticky on top, responsive padding */}
      <header className="fixed top-0 z-30 w-full border-b border-border-subtle bg-surface-secondary">
        <div className="flex justify-between h-14 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-medium text-sm text-content-primary"
            >
              Internal PM
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <span className="text-sm text-content-secondary">
                Test User
              </span>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-content-muted hover:text-content-secondary"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content wrapper with three-panel layout */}
      <div className="flex flex-col md:flex-row flex-1 pt-14 gap-0 md:gap-4">
        {/* Left panel: Sidebar (hidden on mobile, shows on md+) */}
        <div className="hidden md:block md:w-64 lg:w-72 flex-shrink-0 bg-sidebar">
          <Sidebar />
        </div>

        {/* Center panel: Main content (full width on mobile, flex-1 on larger) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Right panel: Detail panel (hidden on mobile and tablet, shows on lg+) */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0 bg-surface-primary border-l border-border-subtle overflow-y-auto py-6">
          {/* Detail panel content will go here in future */}
        </div>
      </div>
    </div>
  );
}
