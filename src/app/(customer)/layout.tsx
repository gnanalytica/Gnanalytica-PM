'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-border-subtle flex items-center justify-between px-6 flex-shrink-0">
        <Link href="/portal" className="text-sm font-semibold text-content-primary">
          Support Portal
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/portal"
            className={`text-[13px] ${
              pathname === '/portal' ? 'text-accent font-medium' : 'text-content-muted hover:text-content-secondary'
            } transition-colors`}
          >
            My Tickets
          </Link>
          <Link
            href="/kb"
            className={`text-[13px] ${
              pathname.startsWith('/kb') ? 'text-accent font-medium' : 'text-content-muted hover:text-content-secondary'
            } transition-colors`}
          >
            Knowledge Base
          </Link>
          <Link
            href="/portal/new"
            className="px-3 py-1 text-[12px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            New Ticket
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
