'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/lib/hooks/use-auth';

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { data: projects } = useProjects();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-content-muted hover:text-content-primary transition-colors"
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-sidebar border-r border-border-subtle flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle">
              <span className="font-medium text-content-primary text-[13px]">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              <NavLink href="/dashboard" current={pathname === '/dashboard'}>
                Dashboard
              </NavLink>
              <NavLink href="/my-issues" current={pathname.startsWith('/my-issues')}>
                My Issues
              </NavLink>
              <NavLink href="/inbox" current={pathname.startsWith('/inbox')}>
                Inbox
              </NavLink>
              <NavLink href="/settings/notifications" current={pathname.startsWith('/settings')}>
                Settings
              </NavLink>

              <div className="pt-3 pb-1">
                <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider px-2">
                  Projects
                </span>
              </div>
              {projects?.map((project) => (
                <NavLink
                  key={project.id}
                  href={`/project/${project.id}`}
                  current={pathname === `/project/${project.id}`}
                >
                  {project.name}
                </NavLink>
              ))}
            </nav>

            {/* User */}
            <div className="border-t border-border-subtle px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] text-content-secondary truncate">
                {profile?.name ?? 'User'}
              </span>
              <button
                onClick={signOut}
                className="text-[11px] text-content-muted hover:text-content-secondary transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded text-[13px] transition-colors ${
        current
          ? 'bg-active text-content-primary font-medium'
          : 'text-content-muted hover:text-content-primary hover:bg-hover'
      }`}
    >
      {children}
    </Link>
  );
}
