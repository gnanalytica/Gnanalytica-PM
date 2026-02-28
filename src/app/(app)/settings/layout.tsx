'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/settings/notifications', label: 'Notifications' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      <aside className="w-48 border-r border-border-subtle py-4 px-3 flex-shrink-0">
        <h2 className="text-[11px] font-medium text-content-muted uppercase tracking-wider px-2 mb-2">
          Settings
        </h2>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-2 py-1.5 text-[13px] rounded transition-colors ${
                pathname === item.href
                  ? 'bg-active text-content-primary font-medium'
                  : 'text-content-muted hover:text-content-secondary hover:bg-hover'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
