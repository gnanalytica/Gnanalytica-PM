"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const signOut = () => {
    router.replace("/login");
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border-subtle bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
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
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
