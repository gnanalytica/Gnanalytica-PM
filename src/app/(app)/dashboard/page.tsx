"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAssignedTickets } from "@/lib/hooks/use-tickets";
import { useHydrateMyTickets } from "@/lib/hooks/use-my-tickets";
import { useWorkspaceNav } from "@/lib/hooks/use-workspace-nav";

const CreateProjectDialog = dynamic(
  () => import("@/components/projects/create-project-dialog").then(m => ({ default: m.CreateProjectDialog })),
  { ssr: false }
);
import { EmptyState, FolderIcon } from "@/components/empty-state";
import { DashboardSkeleton } from "@/components/skeletons";
import {
  PriorityIcon,
  StatusCircle,
} from "@/components/tickets/ticket-list-view";
import {
  useDraggableSections,
  DraggableSection,
} from "@/components/draggable-sections";

const PROJECT_COLORS = [
  "#5e6ad2",
  "#c27070",
  "#c48a5a",
  "#5fae7e",
  "#6e9ade",
  "#9585c4",
  "#c47a9a",
  "#c9a04e",
];
function projectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const { isLoading: ticketsLoading } = useHydrateMyTickets(userId);
  const assignedTickets = useAssignedTickets(userId);
  const { openTicket } = useWorkspaceNav();
  const [showCreate, setShowCreate] = useState(false);
  const sections = useDraggableSections("pm-dashboard-order", [
    "metrics",
    "issues",
    "projects",
  ]);

  // Compute summary metrics
  const overdueCount = assignedTickets.filter((t) => {
    if (!t.due_date || t.status === "done" || t.status === "canceled")
      return false;
    return new Date(t.due_date + "T00:00:00") < new Date();
  }).length;
  const recentlyCompleted = assignedTickets
    .filter((t) => t.status === "done")
    .slice(0, 5);
  const activeIssues = assignedTickets.filter(
    (t) => t.status !== "done" && t.status !== "canceled",
  );
  const recentIssues = activeIssues.slice(0, 8);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-5 sm:px-6 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-sm font-semibold text-content-primary tracking-tight">
          Home
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3.5 py-1.5 text-[12px] font-medium bg-accent text-white rounded-lg hover:bg-accent-hover active:scale-[0.97] transition-all shadow-sm"
        >
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <div className="text-center py-4 text-red-500 text-sm">
            <p>Failed to load projects. Check your connection and try again.</p>
          </div>
        ) : projects?.length === 0 ? (
          <EmptyState
            icon={<FolderIcon className="w-10 h-10" />}
            title="No projects yet"
            description="Create your first project to start tracking issues."
            action={{
              label: "New Project",
              onClick: () => setShowCreate(true),
            }}
          />
        ) : (
          <div className="space-y-6">
            {sections.order.map((sectionId) => {
              if (sectionId === "metrics") {
                return (
                  <DraggableSection
                    key="metrics"
                    id="metrics"
                    title="Summary"
                    isCollapsed={sections.isCollapsed("metrics")}
                    isDragOver={sections.dragOverItem === "metrics"}
                    onToggle={sections.toggleCollapse}
                    onDragStart={sections.onDragStart}
                    onDragOver={sections.onDragOver}
                    onDragEnd={sections.onDragEnd}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-surface-secondary rounded-xl border border-border-subtle p-4 shadow-xs">
                        <p className="text-[11px] text-content-muted font-medium uppercase tracking-wider mb-1.5">
                          Assigned to you
                        </p>
                        <p className="text-2xl font-bold text-content-primary tabular-nums tracking-tight">
                          {activeIssues.length}
                        </p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl border border-border-subtle p-4 shadow-xs">
                        <p className="text-[11px] text-content-muted font-medium uppercase tracking-wider mb-1.5">
                          Overdue
                        </p>
                        <p
                          className={`text-2xl font-bold tabular-nums tracking-tight ${overdueCount > 0 ? "text-red-500" : "text-content-primary"}`}
                        >
                          {overdueCount}
                        </p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl border border-border-subtle p-4 shadow-xs">
                        <p className="text-[11px] text-content-muted font-medium uppercase tracking-wider mb-1.5">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-emerald-500 tabular-nums tracking-tight">
                          {recentlyCompleted.length}
                        </p>
                      </div>
                    </div>
                  </DraggableSection>
                );
              }

              if (sectionId === "issues" && recentIssues.length > 0) {
                return (
                  <DraggableSection
                    key="issues"
                    id="issues"
                    title="Your Issues"
                    isCollapsed={sections.isCollapsed("issues")}
                    isDragOver={sections.dragOverItem === "issues"}
                    onToggle={sections.toggleCollapse}
                    onDragStart={sections.onDragStart}
                    onDragOver={sections.onDragOver}
                    onDragEnd={sections.onDragEnd}
                  >
                    <div className="bg-surface-secondary rounded-xl border border-border-subtle overflow-hidden shadow-xs">
                      {recentIssues.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => openTicket(ticket.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-b border-border-subtle last:border-b-0 hover:bg-hover transition-all duration-150"
                        >
                          <PriorityIcon priority={ticket.priority} />
                          <StatusCircle status={ticket.status} />
                          <span className="text-[13px] text-content-primary font-medium truncate flex-1 min-w-0">
                            {ticket.title}
                          </span>
                          <span className="text-[11px] text-content-muted flex-shrink-0">
                            {relativeTime(ticket.updated_at)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {activeIssues.length > 8 && (
                      <Link
                        href="/my-issues"
                        className="inline-block mt-2 text-[12px] text-accent font-medium hover:opacity-80 transition-opacity"
                      >
                        View all {activeIssues.length} issues &rarr;
                      </Link>
                    )}
                  </DraggableSection>
                );
              }

              if (sectionId === "projects") {
                return (
                  <DraggableSection
                    key="projects"
                    id="projects"
                    title="Projects"
                    isCollapsed={sections.isCollapsed("projects")}
                    isDragOver={sections.dragOverItem === "projects"}
                    onToggle={sections.toggleCollapse}
                    onDragStart={sections.onDragStart}
                    onDragOver={sections.onDragOver}
                    onDragEnd={sections.onDragEnd}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects?.map((project) => (
                        <Link
                          key={project.id}
                          href={`/project/${project.id}`}
                          className="group block bg-surface-secondary rounded-xl border border-border-subtle p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-border-medium transition-all duration-200"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-surface-secondary"
                              style={{ backgroundColor: projectColor(project.id) }}
                            />
                            <span className="text-13 font-semibold text-content-primary truncate group-hover:text-accent transition-colors">
                              {project.name}
                            </span>
                          </div>
                          {project.description ? (
                            <p className="text-[12px] text-content-secondary line-clamp-2 leading-relaxed">
                              {project.description}
                            </p>
                          ) : (
                            <p className="text-[12px] text-content-muted italic">
                              No description
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </DraggableSection>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
