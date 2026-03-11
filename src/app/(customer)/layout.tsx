"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
          <Link
            href="/portal"
            className="text-sm font-semibold text-content-primary"
          >
            Support Portal
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/portal"
              className={`text-[13px] ${
                pathname === "/portal"
                  ? "text-accent font-medium"
                  : "text-content-muted hover:text-content-secondary"
              } transition-colors`}
            >
              My Tickets
            </Link>
            <Link
              href="/kb"
              className={`text-[13px] ${
                pathname.startsWith("/kb")
                  ? "text-accent font-medium"
                  : "text-content-muted hover:text-content-secondary"
              } transition-colors`}
            >
              Knowledge Base
            </Link>
            <Link
              href="/portal/new"
              className="px-3 py-1 text-[12px] bg-accent text-white rounded hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              New Ticket
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
