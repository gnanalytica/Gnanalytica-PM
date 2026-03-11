"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/teams", label: "Teams" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Navigation — horizontal on mobile, vertical sidebar on desktop */}
      <aside className="md:w-48 border-b md:border-b-0 md:border-r border-border-subtle py-2 md:py-4 px-3 flex-shrink-0">
        <h2 className="text-[11px] font-medium text-content-muted uppercase tracking-wider px-2 mb-2 hidden md:block">
          Settings
        </h2>
        <nav className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-x-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-2 py-1.5 text-[13px] rounded transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? "bg-active text-content-primary font-medium"
                  : "text-content-muted hover:text-content-secondary hover:bg-hover"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}
