"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Tab {
  id: string;
  label: string;
  icon: string;
  path: string;
  shortcut: string;
}

const TABS: Tab[] = [
  {
    id: "list",
    label: "List",
    icon: "📋",
    path: "/tickets",
    shortcut: "Cmd+1",
  },
  {
    id: "ticket",
    label: "Ticket",
    icon: "📄",
    path: "/ticket",
    shortcut: "Cmd+2",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
    path: "/dashboard",
    shortcut: "Cmd+3",
  },
];

export function MobileModeTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("list");

  // Determine active tab based on current pathname
  useEffect(() => {
    const currentTab = TABS.find((tab) => pathname.includes(tab.path));
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [pathname]);

  // Handle keyboard shortcuts (Cmd+1, Cmd+2, Cmd+3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === "1") {
        e.preventDefault();
        handleTabClick(TABS[0]);
      } else if (cmdKey && e.key === "2") {
        e.preventDefault();
        handleTabClick(TABS[1]);
      } else if (cmdKey && e.key === "3") {
        e.preventDefault();
        handleTabClick(TABS[2]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id);
    router.push(tab.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 safe-bottom">
      <div className="flex h-[48px] items-center justify-around gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition-colors ${
              activeTab === tab.id
                ? "bg-gray-50 text-blue-600 dark:bg-gray-900 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
            title={`${tab.label} (${tab.shortcut})`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
