"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTheme } from "@/lib/use-theme";
import { useSavedViews, useDeleteSavedView } from "@/lib/hooks/use-saved-views";
import { useShallowSearch } from "@/lib/hooks/use-workspace-nav";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/lib/store/notification-store";
import { useState, useCallback } from "react";

const PROJECT_COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
];
function projectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-content-muted transition-transform duration-200 ease-out ${expanded ? "rotate-90" : ""}`}
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
  );
}

function SubNavIcon({ type, className }: { type: string; className?: string }) {
  const cn = className ?? "w-3.5 h-3.5";
  switch (type) {
    case "list":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      );
    case "board":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      );
    case "cycle":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
      );
    case "milestone":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
          />
        </svg>
      );
    case "filter":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
          />
        </svg>
      );
    case "gantt":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 3v3m6-3v3m6-3v3"
          />
        </svg>
      );
    case "settings":
      return (
        <svg
          className={cn}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

type ProjectSubNav =
  | "issues"
  | "board"
  | "cycles"
  | "milestones"
  | "gantt"
  | "views"
  | "settings";

const PROJECT_SUB_NAV: {
  key: ProjectSubNav;
  label: string;
  icon: string;
  viewParam?: string;
}[] = [
  { key: "issues", label: "Issues", icon: "list", viewParam: "list" },
  { key: "board", label: "Board", icon: "board", viewParam: "board" },
  { key: "cycles", label: "Cycles", icon: "cycle", viewParam: "sprints" },
  {
    key: "milestones",
    label: "Milestones",
    icon: "milestone",
    viewParam: "milestones",
  },
  { key: "gantt", label: "Gantt", icon: "gantt", viewParam: "gantt" },
  { key: "views", label: "Views", icon: "filter" },
  {
    key: "settings",
    label: "Settings",
    icon: "settings",
    viewParam: "workflow",
  },
];

function MobileProjectSubNav({
  projectId,
  pathname,
  searchString,
  onClose,
}: {
  projectId: string;
  pathname: string;
  searchString: string;
  onClose: () => void;
}) {
  const { data: savedViews } = useSavedViews(projectId);
  const deleteSavedView = useDeleteSavedView();
  const isProjectPage = pathname === `/project/${projectId}`;
  const currentParams = new URLSearchParams(searchString);
  const currentView = currentParams.get("view");

  return (
    <div className="ml-[18px] pl-2.5 mt-0.5 mb-1.5 space-y-px border-l border-border-subtle">
      {PROJECT_SUB_NAV.map((item) => {
        if (item.key === "views") {
          if (!savedViews || savedViews.length === 0) return null;
          return (
            <div key="views" className="pt-1">
              <span className="block px-2 py-0.5 text-[10px] font-semibold text-content-muted uppercase tracking-widest">
                Views
              </span>
              {savedViews.map((view) => {
                const isViewActive = isProjectPage && currentView === view.id;
                return (
                  <div key={view.id} className="group/view flex items-center">
                    <Link
                      href={`/project/${projectId}?view=${view.id}`}
                      onClick={onClose}
                      className={`flex-1 flex items-center gap-1.5 px-2 py-[5px] rounded-md text-[12px] truncate transition-all duration-100 ${
                        isViewActive
                          ? "bg-active text-content-primary font-medium"
                          : "text-content-muted hover:text-content-secondary hover:bg-hover"
                      }`}
                    >
                      <SubNavIcon
                        type="filter"
                        className="w-3 h-3 flex-shrink-0"
                      />
                      {view.name}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteSavedView.mutate({
                          id: view.id,
                          project_id: projectId,
                        });
                      }}
                      className="opacity-0 group-hover/view:opacity-100 p-0.5 text-content-muted hover:text-red-400 transition-all duration-100 flex-shrink-0 mr-1 cursor-pointer rounded"
                      title="Delete view"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        }

        const href = item.viewParam
          ? `/project/${projectId}?view=${item.viewParam}`
          : `/project/${projectId}`;
        const isActive =
          isProjectPage &&
          (item.viewParam ? currentView === item.viewParam : !currentView);

        return (
          <Link
            key={item.key}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-1.5 px-2 py-[5px] rounded-md text-[12px] transition-all duration-100 select-none ${
              isActive
                ? "bg-active text-content-primary font-medium"
                : "text-content-muted hover:text-content-secondary hover:bg-hover"
            }`}
          >
            <SubNavIcon type={item.icon} className="w-3 h-3 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchString = useShallowSearch();
  const { profile, signOut } = useAuth();
  const { data: projects } = useProjects();
  const { theme, toggleTheme, mounted } = useTheme();
  const unreadCount = useNotificationStore(selectUnreadCount);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-overlay-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-sidebar border-r border-border-subtle z-50 flex flex-col animate-slide-in lg:hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3.5 h-[52px] flex-shrink-0 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-[11px] font-bold text-white leading-none tracking-tight">
                G
              </span>
            </div>
            <span className="font-semibold text-content-primary text-[14px] tracking-[-0.02em]">
              Internal PM
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-content-muted hover:text-content-secondary active:scale-[0.95] rounded-md hover:bg-hover transition-all duration-100 select-none"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
          {/* Top links */}
          <div className="px-2 mb-1">
            {/* Inbox */}
            <Link
              href="/inbox"
              onClick={onClose}
              className={`group flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[13px] font-[430] tracking-[-0.01em] select-none ${
                pathname.startsWith("/inbox")
                  ? "bg-active text-content-primary font-medium"
                  : "text-content-secondary hover:bg-hover hover:text-content-primary active:scale-[0.98]"
              } transition-all duration-100`}
            >
              <svg
                className={`w-[18px] h-[18px] flex-shrink-0 ${pathname.startsWith("/inbox") ? "text-accent" : "text-content-muted group-hover:text-content-secondary"} transition-colors`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h2.21a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
                />
              </svg>
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold bg-accent text-white rounded-full px-1 tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* My Issues */}
            <Link
              href="/my-issues"
              onClick={onClose}
              className={`group flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[13px] font-[430] tracking-[-0.01em] select-none ${
                pathname.startsWith("/my-issues")
                  ? "bg-active text-content-primary font-medium"
                  : "text-content-secondary hover:bg-hover hover:text-content-primary active:scale-[0.98]"
              } transition-all duration-100`}
            >
              <svg
                className={`w-[18px] h-[18px] flex-shrink-0 ${pathname.startsWith("/my-issues") ? "text-accent" : "text-content-muted group-hover:text-content-secondary"} transition-colors`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <span>My Issues</span>
            </Link>
          </div>

          <div className="mx-3 my-1.5 border-t border-border-subtle" />

          {/* ── Projects section ── */}
          <div className="px-2">
            <div className="flex items-center px-2 py-1.5">
              <span className="text-[11px] font-semibold text-content-muted uppercase tracking-widest select-none">
                Projects
              </span>
            </div>

            <div className="space-y-px">
              {projects?.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const isActive = pathname.startsWith(`/project/${project.id}`);

                return (
                  <div key={project.id}>
                    <div className="flex items-center group/project">
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="p-1 text-content-muted hover:text-content-secondary rounded transition-colors flex-shrink-0 select-none"
                      >
                        <ChevronIcon expanded={isExpanded} />
                      </button>

                      <Link
                        href={`/project/${project.id}`}
                        onClick={onClose}
                        className={`flex-1 flex items-center gap-2 px-1.5 py-[6px] rounded-md text-[13px] font-[430] tracking-[-0.01em] truncate select-none transition-all duration-100 ${
                          isActive
                            ? "bg-active text-content-primary font-medium"
                            : "text-content-secondary hover:bg-hover hover:text-content-primary active:scale-[0.98]"
                        }`}
                      >
                        <span
                          className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                          style={{ backgroundColor: projectColor(project.id) }}
                        />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    </div>

                    {isExpanded && (
                      <MobileProjectSubNav
                        projectId={project.id}
                        pathname={pathname}
                        searchString={searchString}
                        onClose={onClose}
                      />
                    )}
                  </div>
                );
              })}
              {projects?.length === 0 && (
                <p className="px-3 py-6 text-[12px] text-content-muted text-center">
                  No projects yet
                </p>
              )}
            </div>
          </div>

          <div className="mx-3 my-1.5 border-t border-border-subtle" />

          {/* Settings */}
          <div className="px-2">
            <Link
              href="/settings/notifications"
              onClick={onClose}
              className={`group flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[13px] font-[430] tracking-[-0.01em] select-none ${
                pathname.startsWith("/settings")
                  ? "bg-active text-content-primary font-medium"
                  : "text-content-secondary hover:bg-hover hover:text-content-primary active:scale-[0.98]"
              } transition-all duration-100`}
            >
              <svg
                className={`w-[18px] h-[18px] flex-shrink-0 ${pathname.startsWith("/settings") ? "text-accent" : "text-content-muted group-hover:text-content-secondary"} transition-colors`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-border-subtle px-3 py-2.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full flex-shrink-0 ring-1 ring-border-subtle"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[11px] font-semibold text-white">
                    {(profile?.name ?? "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[13px] font-[430] text-content-secondary truncate tracking-[-0.01em]">
                {profile?.name ?? "User"}
              </span>
            </div>
            <div className="flex items-center gap-px">
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="text-content-muted hover:text-content-primary flex-shrink-0 rounded-md hover:bg-hover transition-all duration-100 cursor-pointer p-1.5 select-none"
                  title={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                >
                  {theme === "dark" ? (
                    <svg
                      className="w-[15px] h-[15px]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-[15px] h-[15px]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                      />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="text-content-muted hover:text-content-primary flex-shrink-0 rounded-md hover:bg-hover transition-all duration-100 cursor-pointer p-1.5 select-none"
                title="Sign out"
              >
                <svg
                  className="w-[15px] h-[15px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
