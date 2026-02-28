'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSavedViews, useDeleteSavedView } from '@/lib/hooks/use-saved-views';
import { useShallowSearch } from '@/lib/hooks/use-workspace-nav';
import { useNotificationStore, selectUnreadCount } from '@/lib/store/notification-store';
import { usePrefetch } from '@/lib/hooks/use-prefetch';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { useState } from 'react';

/* ── Small colored project dot ── */
const PROJECT_COLORS = ['#5e6ad2', '#c27070', '#c48a5a', '#5fae7e', '#6e9ade', '#9585c4', '#c47a9a', '#c9a04e'];
function projectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function InboxLink({ pathname }: { pathname: string }) {
  const unreadCount = useNotificationStore(selectUnreadCount);
  const isActive = pathname.startsWith('/inbox');

  return (
    <Link
      href="/inbox"
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-2 px-2 py-[5px] rounded text-13 ${
        isActive
          ? 'bg-active text-content-primary'
          : 'hover:bg-hover text-content-muted hover:text-content-primary'
      } transition-colors duration-[120ms]`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h2.21a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
      </svg>
      Inbox
      {unreadCount > 0 && (
        <span className="ml-auto text-[11px] text-content-muted tabular-nums">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const searchString = useShallowSearch();
  const { profile, signOut } = useAuth();
  const { data: projects } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);

  // Determine the active project ID from the URL
  const projectMatch = pathname.match(/^\/project\/([^/]+)/);
  const activeProjectId = projectMatch?.[1] ?? undefined;

  const { data: savedViews } = useSavedViews(activeProjectId);
  const deleteSavedView = useDeleteSavedView();
  const { prefetchProjectTickets } = usePrefetch();

  const currentViewId = new URLSearchParams(searchString).get('view');

  return (
    <aside className="w-[220px] h-screen bg-sidebar text-content-secondary flex flex-col flex-shrink-0 border-r border-border-subtle">
      {/* Workspace header */}
      <div className="flex items-center gap-2.5 px-3 h-11">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-semibold text-white leading-none">P</span>
        </div>
        <Link href="/dashboard" className="font-medium text-content-primary text-13 truncate">
          Internal PM
        </Link>
        <div className="ml-auto flex items-center gap-0.5">
          <NotificationBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1.5">
        {/* Workspace section */}
        <div className="px-2 mb-1">
          <span className="px-2 text-[11px] font-medium text-content-muted uppercase tracking-wider">Workspace</span>
        </div>
        <div className="px-2 mb-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-2 py-[5px] rounded text-13 ${
              pathname === '/dashboard'
                ? 'bg-active text-content-primary'
                : 'hover:bg-hover text-content-muted hover:text-content-primary'
            } transition-colors duration-[120ms]`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/my-issues"
            aria-current={pathname.startsWith('/my-issues') ? 'page' : undefined}
            className={`flex items-center gap-2 px-2 py-[5px] rounded text-13 mt-0.5 ${
              pathname.startsWith('/my-issues')
                ? 'bg-active text-content-primary'
                : 'hover:bg-hover text-content-muted hover:text-content-primary'
            } transition-colors duration-[120ms]`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            My Issues
          </Link>
          <InboxLink pathname={pathname} />
        </div>

        {/* Projects section */}
        <div className="px-2">
          <div className="flex items-center justify-between px-2 py-[5px]">
            <button
              onClick={() => setProjectsCollapsed(!projectsCollapsed)}
              className="flex items-center gap-1 text-[11px] font-medium text-content-muted uppercase tracking-wider hover:text-content-secondary transition-colors cursor-pointer"
            >
              <svg className={`w-3 h-3 transition-transform duration-150 ${projectsCollapsed ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              Projects
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="text-content-muted hover:text-content-secondary p-0.5 rounded hover:bg-hover transition-colors duration-[120ms] cursor-pointer"
              title="New project"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {!projectsCollapsed && (
            <div className="space-y-0.5">
              {projects?.map((project) => {
                const isActive = pathname === `/project/${project.id}`;
                const isActiveProject = project.id === activeProjectId;
                return (
                  <div key={project.id}>
                    <Link
                      href={`/project/${project.id}`}
                      onMouseEnter={() => prefetchProjectTickets(project.id)}
                      className={`flex items-center gap-2 px-2 py-[5px] rounded text-13 truncate transition-colors duration-[120ms] ${
                        isActive && !currentViewId
                          ? 'bg-active text-content-primary'
                          : isActive
                            ? 'bg-active/60 text-content-primary'
                            : 'hover:bg-hover text-content-muted hover:text-content-primary'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: projectColor(project.id) }}
                      />
                      {project.name}
                    </Link>

                    {/* Saved views for active project */}
                    {isActiveProject && savedViews && savedViews.length > 0 && (
                      <div className="ml-4 mt-0.5 mb-1 space-y-px">
                        {savedViews.map((view) => {
                          const isViewActive = currentViewId === view.id;
                          return (
                            <div key={view.id} className="group/view flex items-center">
                              <Link
                                href={`/project/${project.id}?view=${view.id}`}
                                className={`flex-1 block pl-3 pr-1 py-1 rounded text-[11px] truncate transition-colors duration-[120ms] ${
                                  isViewActive
                                    ? 'bg-active text-content-primary'
                                    : 'text-content-muted hover:text-content-secondary hover:bg-hover'
                                }`}
                              >
                                <svg className="w-3 h-3 inline-block mr-1 -mt-px" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                                </svg>
                                {view.name}
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteSavedView.mutate({ id: view.id, project_id: project.id });
                                }}
                                className="opacity-0 group-hover/view:opacity-100 p-0.5 text-content-muted hover:text-red-400 transition-all duration-[120ms] flex-shrink-0 mr-1 cursor-pointer rounded"
                                title="Delete view"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {projects?.length === 0 && (
                <p className="px-3 py-4 text-[11px] text-content-muted text-center">
                  No projects yet
                </p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-border-subtle px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-5 h-5 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-content-muted">
                  {(profile?.name ?? 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-13 text-content-secondary truncate">{profile?.name ?? 'User'}</span>
          </div>
          <button
            onClick={signOut}
            className="text-content-muted hover:text-content-secondary flex-shrink-0 rounded transition-colors duration-[120ms] cursor-pointer p-1"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </aside>
  );
}
