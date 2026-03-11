"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { TicketListView } from "@/components/tickets/ticket-list-view";
import { KanbanBoard } from "@/components/board/kanban-board";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { useHydrateTickets } from "@/lib/hooks/use-tickets";
import { useProject, useDeleteProject } from "@/lib/hooks/use-projects";
import { useRealtimeTickets } from "@/lib/hooks/use-realtime";
import { useSavedViews, useCreateSavedView } from "@/lib/hooks/use-saved-views";
import {
  useHydrateCycles,
  useCycleTickets,
  useActiveCycle,
} from "@/lib/hooks/use-cycles";
import { useHydrateMilestones } from "@/lib/hooks/use-milestones";
import { CycleBar } from "@/components/cycles/cycle-bar";
import { BulkActionsBar } from "@/components/tickets/bulk-actions-bar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useCurrentProjectRole } from "@/lib/hooks/use-current-role";
import { PERMISSIONS } from "@/lib/permissions";

const LazyMilestoneList = lazy(() =>
  import("@/components/milestones/milestone-list").then((m) => ({
    default: m.MilestoneList,
  })),
);
const LazyEpicList = lazy(() =>
  import("@/components/epics/epic-list").then((m) => ({ default: m.EpicList })),
);
const LazyTeamList = lazy(() =>
  import("@/components/teams/team-list").then((m) => ({ default: m.TeamList })),
);
const LazyRoadmapView = lazy(() =>
  import("@/components/roadmap/roadmap-view").then((m) => ({
    default: m.RoadmapView,
  })),
);
const LazyCalendarView = lazy(() =>
  import("@/components/views/calendar-view").then((m) => ({
    default: m.CalendarView,
  })),
);
const LazySpreadsheetView = lazy(() =>
  import("@/components/views/spreadsheet-view").then((m) => ({
    default: m.SpreadsheetView,
  })),
);
const LazySprintPlanning = lazy(() =>
  import("@/components/sprints/sprint-planning").then((m) => ({
    default: m.SprintPlanning,
  })),
);
const LazyGanttView = lazy(() =>
  import("@/components/views/gantt-view").then((m) => ({
    default: m.GanttView,
  })),
);
import {
  useWorkspaceNav,
  useShallowSearch,
  shallowReplace,
  shallowReplaceAll,
} from "@/lib/hooks/use-workspace-nav";
import { BoardSkeleton, IssueListSkeleton } from "@/components/skeletons";
import { UnifiedFilterBar } from "@/components/filters/filter-bar";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import type { ViewFilters, TicketPriority } from "@/types";
import type { SortKey, SortDir } from "@/components/tickets/ticket-list-view";

const LazyAnalyticsDashboard = lazy(() =>
  import("@/components/analytics/analytics-dashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);

// View is now determined by ?view= URL param (driven from sidebar)
type ViewType =
  | "list"
  | "board"
  | "calendar"
  | "spreadsheet"
  | "workflow"
  | "analytics"
  | "roadmap"
  | "milestones"
  | "epics"
  | "teams"
  | "sprints"
  | "gantt";

const VALID_VIEWS: ViewType[] = [
  "list",
  "board",
  "calendar",
  "spreadsheet",
  "workflow",
  "analytics",
  "roadmap",
  "milestones",
  "epics",
  "teams",
  "sprints",
  "gantt",
];

// Compact view switcher only shows these primary views
const PRIMARY_VIEWS: { key: ViewType; label: string }[] = [
  { key: "list", label: "List" },
  { key: "board", label: "Board" },
  { key: "sprints", label: "Sprints" },
  { key: "calendar", label: "Calendar" },
  { key: "gantt", label: "Gantt" },
  { key: "spreadsheet", label: "Table" },
  { key: "roadmap", label: "Roadmap" },
];

const SECONDARY_VIEWS: { key: ViewType; label: string }[] = [
  { key: "milestones", label: "Milestones" },
  { key: "epics", label: "Epics" },
  { key: "teams", label: "Teams" },
  { key: "analytics", label: "Analytics" },
  { key: "workflow", label: "Workflow" },
];

function arraysEqual(a?: string[], b?: string[]): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function shallowEqualFilters(a: ViewFilters, b: ViewFilters): boolean {
  return (
    arraysEqual(a.status, b.status) &&
    arraysEqual(a.priority, b.priority) &&
    arraysEqual(a.assignee_ids, b.assignee_ids)
  );
}

function parseStatusParam(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const items = val.split(",").filter(Boolean);
  return items.length ? items : undefined;
}

function parsePriorityParam(val: string | null): TicketPriority[] | undefined {
  if (!val) return undefined;
  const valid: TicketPriority[] = ["low", "medium", "high", "urgent"];
  const items = val
    .split(",")
    .filter((p): p is TicketPriority => valid.includes(p as TicketPriority));
  return items.length ? items : undefined;
}

function parseAssigneeParam(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const items = val.split(",").filter(Boolean);
  return items.length ? items : undefined;
}

const VALID_SORT_KEYS: SortKey[] = [
  "id",
  "title",
  "status",
  "priority",
  "assignee",
  "updated_at",
];

function MoreViewsMenu({
  views,
  currentView,
  onSwitch,
}: {
  views: { key: ViewType; label: string }[];
  currentView: ViewType;
  onSwitch: (view: ViewType) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSecondaryActive = views.some((v) => v.key === currentView);

  return (
    <div className="relative" data-dropdown>
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all duration-150 active:scale-[0.97] ${
          isSecondaryActive
            ? "bg-surface-primary text-content-primary border-border-subtle shadow-xs"
            : "text-content-muted hover:text-content-secondary border-transparent hover:border-border-subtle"
        }`}
      >
        {isSecondaryActive ? views.find((v) => v.key === currentView)?.label : "More"}
        <svg className="w-3 h-3 ml-0.5 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="animate-dropdown-in absolute right-0 top-full mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => { onSwitch(v.key); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[11px] transition-all duration-150 active:scale-[0.98] ${
                  currentView === v.key
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-content-secondary hover:bg-hover"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectActionsMenu({
  projectId,
  projectName,
  onDelete,
}: {
  projectId: string;
  projectName: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative" data-dropdown>
      <button
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        className="p-1.5 text-content-muted hover:text-content-secondary rounded-md hover:bg-hover transition-all duration-150 active:scale-[0.97]"
        title="Project actions"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
          <div className="animate-dropdown-in absolute right-0 top-full mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[180px] shadow-xl">
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-content-secondary hover:bg-hover transition-all duration-150 active:scale-[0.98]"
            >
              Copy project link
            </button>
            <div className="my-1 border-t border-border-subtle" />
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 transition-all duration-150 active:scale-[0.98]"
              >
                Delete project
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <p className="text-[11px] text-red-400 font-medium">
                  Delete &ldquo;{projectName}&rdquo;? All issues will be lost.
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setOpen(false); setConfirmDelete(false); onDelete(); }}
                    className="flex-1 px-2 py-1 text-[11px] bg-red-500 text-white rounded hover:bg-red-600 active:scale-[0.96] transition-all duration-150"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-[11px] text-content-muted hover:text-content-secondary transition-all duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";
  const router = useRouter();
  const searchString = useShallowSearch();

  // Redirect to dashboard if project ID is missing
  useEffect(() => {
    if (params && !projectId) {
      router.replace("/dashboard");
    }
  }, [projectId, params, router]);

  const {
    ticketId: selectedTicketId,
    openTicket,
    closeTicket,
  } = useWorkspaceNav();

  const { role } = useCurrentProjectRole(projectId);
  const canEdit = PERMISSIONS.canEditTicket(role);
  const canCreate = PERMISSIONS.canCreateTicket(role);

  const [showCreate, setShowCreate] = useState(false);
  const [cycleFilter, setCycleFilter] = useState<"all" | "active">("all");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const deleteProject = useDeleteProject();

  // Filter/sort state
  const [filters, setFilters] = useState<ViewFilters>({});
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeViewName, setActiveViewName] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<import("@/types").GroupByKey>("none");
  const [groupByOpen, setGroupByOpen] = useState(false);

  // Save view inline form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");

  const { data: savedViews } = useSavedViews(projectId);
  const createSavedView = useCreateSavedView();

  const savedViewIds = useMemo(
    () => savedViews?.map((v) => v.id).join(",") ?? "",
    [savedViews],
  );

  // Track first sync so we only set view on initial load
  const isFirstSync = useRef(true);

  // Derive current view from URL
  const currentView = useMemo((): ViewType => {
    const p = new URLSearchParams(searchString);
    const v = p.get("view");
    if (v && VALID_VIEWS.includes(v as ViewType)) return v as ViewType;
    return "list"; // default
  }, [searchString]);

  // ── Sync React state FROM URL ──
  useEffect(() => {
    const p = new URLSearchParams(searchString);
    const viewId = p.get("view");

    // Handle ?create=1 (from command palette navigation)
    if (p.get("create") === "1") {
      setShowCreate(true);
      shallowReplace({ create: null });
    }

    // ── Saved view (UUID-style) ──
    if (viewId && savedViews && !VALID_VIEWS.includes(viewId as ViewType)) {
      const view = savedViews.find((v) => v.id === viewId);
      if (view) {
        const nextFilters = view.filters ?? {};
        setFilters((prev) =>
          shallowEqualFilters(prev, nextFilters) ? prev : nextFilters,
        );
        setSortKey((prev) => {
          const next = (view.sort_key as SortKey) || "updated_at";
          return prev === next ? prev : next;
        });
        setSortDir((prev) => {
          const next = (view.sort_dir as SortDir) || "desc";
          return prev === next ? prev : next;
        });
        setActiveViewName((prev) => (view.name === prev ? prev : view.name));
        isFirstSync.current = false;
        return;
      }
    }

    // Wait for savedViews to load when a view param exists that looks like a UUID
    if (viewId && !savedViews && !VALID_VIEWS.includes(viewId as ViewType))
      return;

    // ── Inline filter / sort params ──
    const statusParam = parseStatusParam(p.get("status"));
    const priorityParam = parsePriorityParam(p.get("priority"));
    const assigneeParam = parseAssigneeParam(p.get("assignee"));
    const sortParam = p.get("sort") as SortKey | null;
    const dirParam = p.get("dir") as SortDir | null;

    const newFilters: ViewFilters = {
      status: statusParam,
      priority: priorityParam,
      assignee_ids: assigneeParam,
    };
    setFilters((prev) =>
      JSON.stringify(prev) === JSON.stringify(newFilters) ? prev : newFilters,
    );

    const newSortKey =
      sortParam && VALID_SORT_KEYS.includes(sortParam)
        ? sortParam
        : "updated_at";
    setSortKey((prev) => (prev === newSortKey ? prev : newSortKey));

    const newSortDir =
      dirParam === "asc" || dirParam === "desc" ? dirParam : "desc";
    setSortDir((prev) => (prev === newSortDir ? prev : newSortDir));

    if (!viewId || VALID_VIEWS.includes(viewId as ViewType)) {
      setActiveViewName((prev) => (prev === null ? prev : null));
    }

    isFirstSync.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString, savedViewIds]);

  // ── Sync URL FROM React state ──
  const updateUrl = useCallback(
    (
      newFilters: ViewFilters,
      newSortKey: SortKey,
      newSortDir: SortDir,
      viewId: string | null,
    ) => {
      const params: Record<string, string> = {};
      if (viewId) {
        params.view = viewId;
      } else {
        // Keep current view type
        params.view = currentView;
        if (newFilters.status?.length)
          params.status = newFilters.status.join(",");
        if (newFilters.priority?.length)
          params.priority = newFilters.priority.join(",");
        if (newFilters.assignee_ids?.length)
          params.assignee = newFilters.assignee_ids.join(",");
        if (newSortKey !== "updated_at") params.sort = newSortKey;
        if (newSortDir !== "desc") params.dir = newSortDir;
      }
      shallowReplaceAll(params, ["ticket"]);
    },
    [currentView],
  );

  const handleFiltersChange = useCallback(
    (newFilters: ViewFilters) => {
      setFilters(newFilters);
      setActiveViewName(null);
      updateUrl(newFilters, sortKey, sortDir, null);
    },
    [sortKey, sortDir, updateUrl],
  );

  const handleSortChange = useCallback(
    (newKey: SortKey, newDir: SortDir) => {
      setSortKey(newKey);
      setSortDir(newDir);
      setActiveViewName(null);
      updateUrl(filters, newKey, newDir, null);
    },
    [filters, updateUrl],
  );

  const handleSaveView = useCallback(() => {
    if (!saveViewName.trim()) return;
    createSavedView.mutate(
      {
        project_id: projectId,
        name: saveViewName.trim(),
        filters,
        sort_key: sortKey,
        sort_dir: sortDir,
      },
      {
        onSuccess: (saved) => {
          setActiveViewName(saved.name);
          setShowSaveForm(false);
          setSaveViewName("");
          updateUrl(filters, sortKey, sortDir, saved.id);
        },
      },
    );
  }, [
    saveViewName,
    projectId,
    filters,
    sortKey,
    sortDir,
    createSavedView,
    updateUrl,
  ]);

  const handleViewSwitch = useCallback((view: ViewType) => {
    shallowReplaceAll({ view }, ["ticket"]);
  }, []);

  const { data: project } = useProject(projectId);

  // Hydrate
  const { isLoading, isError, isFetchingNextPage, totalCount, loadedCount } =
    useHydrateTickets(projectId);
  useHydrateCycles(projectId);
  useHydrateMilestones(projectId);
  useRealtimeTickets(projectId);

  const workflow = useProjectWorkflow(projectId);

  // Cycle filter
  const activeCycle = useActiveCycle();
  const cycleTickets = useCycleTickets(
    cycleFilter === "active" ? (activeCycle?.id ?? null) : null,
  );
  const cycleTicketIdSet = useMemo(
    () =>
      cycleFilter === "active" && activeCycle
        ? new Set(cycleTickets.map((t) => t.id))
        : null,
    [cycleFilter, activeCycle, cycleTickets],
  );

  // Show cycle bar only in cycle-related views
  const showCycleBar =
    currentView === "sprints" ||
    currentView === "list" ||
    currentView === "board";

  if (!projectId) {
    return <BoardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-5 sm:px-6 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
          <h1 className="text-sm font-semibold text-content-primary truncate tracking-tight">
            {project?.name ?? "Loading..."}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Compact view switcher — primary views only */}
          <div className="flex items-center gap-0.5">
            <div className="flex items-center bg-surface-secondary rounded-lg border border-border-subtle overflow-hidden p-0.5">
              {PRIMARY_VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => handleViewSwitch(v.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 active:scale-[0.97] ${
                    currentView === v.key
                      ? "bg-surface-primary text-content-primary shadow-xs"
                      : "text-content-muted hover:text-content-secondary"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <MoreViewsMenu
              views={SECONDARY_VIEWS}
              currentView={currentView}
              onSwitch={handleViewSwitch}
            />
          </div>

          {/* Group by dropdown */}
          {(currentView === "list" || currentView === "board" || currentView === "spreadsheet" || currentView === "calendar" || currentView === "gantt") && (
            <div className="relative" data-dropdown>
              <button
                onClick={() => setGroupByOpen(!groupByOpen)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all duration-150 active:scale-[0.97] ${
                  groupBy !== "none"
                    ? "bg-accent-soft border-accent/30 text-accent"
                    : "text-content-muted hover:text-content-secondary border-border-subtle bg-surface-secondary"
                }`}
              >
                {groupBy !== "none" ? `Grouped: ${groupBy}` : "Group"}
              </button>
              {groupByOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setGroupByOpen(false)} />
                  <div className="animate-dropdown-in absolute right-0 top-full mt-1 bg-[var(--surface-tertiary)] backdrop-blur-xl border border-border-subtle rounded-xl z-30 py-1 min-w-[140px] shadow-xl">
                    {(["none", "status", "priority", "assignee", "issue_type", "milestone"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => { setGroupBy(g as import("@/types").GroupByKey); setGroupByOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] transition-all duration-150 active:scale-[0.98] ${
                          groupBy === g
                            ? "bg-accent-soft text-accent font-medium"
                            : "text-content-secondary hover:bg-hover"
                        }`}
                      >
                        {g === "none" ? "No grouping" : g === "issue_type" ? "Issue Type" : g[0].toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-3.5 py-1.5 text-[12px] font-medium bg-accent text-white rounded-lg hover:bg-accent-hover active:scale-[0.97] transition-all shadow-sm"
            >
              + New Issue
            </button>
          )}

          {/* Project actions menu */}
          <ProjectActionsMenu
            projectId={projectId}
            projectName={project?.name ?? ""}
            onDelete={() => {
              deleteProject.mutate({ id: projectId }, {
                onSuccess: () => router.replace("/dashboard"),
              });
            }}
          />
        </div>
      </div>

      {/* Save view bar (list view only) */}
      {(currentView === "list" || currentView === "board" || currentView === "spreadsheet" || currentView === "calendar") && (
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-1 flex-shrink-0">
          {activeViewName && (
            <span className="text-[12px] text-content-muted font-medium bg-surface-tertiary px-2 py-0.5 rounded">
              {activeViewName}
            </span>
          )}
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="ml-auto text-[11px] text-content-muted hover:text-content-secondary active:scale-[0.96] rounded transition-all duration-150 px-2 py-0.5"
            >
              Save View
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-1.5">
              <input
                type="text"
                value={saveViewName}
                onChange={(e) => setSaveViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveView();
                  if (e.key === "Escape") {
                    setShowSaveForm(false);
                    setSaveViewName("");
                  }
                }}
                placeholder="View name..."
                className="text-xs border border-border-subtle rounded px-2 py-0.5 w-36 bg-surface-secondary text-content-primary"
                autoFocus
              />
              <button
                onClick={handleSaveView}
                disabled={!saveViewName.trim() || createSavedView.isPending}
                className="text-[11px] bg-accent text-white px-2 py-0.5 rounded hover:opacity-90 active:scale-[0.96] disabled:opacity-50 transition-all duration-150"
              >
                {createSavedView.isPending ? "..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setSaveViewName("");
                }}
                className="text-[11px] text-content-muted hover:text-content-secondary rounded px-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2">
        {showCycleBar && (
          <CycleBar
            projectId={projectId}
            cycleFilter={cycleFilter}
            onCycleFilterChange={setCycleFilter}
          />
        )}

        {isLoading ? (
          currentView === "list" ? (
            <IssueListSkeleton />
          ) : (
            <BoardSkeleton />
          )
        ) : isError ? (
          <div className="text-center py-4 text-red-500 text-sm">
            <p>Failed to load tickets. Check your connection and try again.</p>
          </div>
        ) : currentView === "analytics" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load analytics.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazyAnalyticsDashboard projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "board" ? (
          <>
            <UnifiedFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              workflowStatuses={workflow.statuses}
              projectId={projectId}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
            <KanbanBoard
              projectId={projectId}
              onTicketClick={openTicket}
              filterTicketIds={cycleTicketIdSet}
              filters={filters}
              groupBy={groupBy}
            />
          </>
        ) : currentView === "workflow" ? (
          <WorkflowEditor projectId={projectId} />
        ) : currentView === "roadmap" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load roadmap.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazyRoadmapView projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "milestones" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load milestones.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazyMilestoneList projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "epics" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load epics.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazyEpicList projectId={projectId} onTicketClick={openTicket} />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "teams" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load teams.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazyTeamList projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "calendar" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load calendar.
              </div>
            }
          >
            <UnifiedFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              workflowStatuses={workflow.statuses}
              projectId={projectId}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
            <Suspense fallback={<BoardSkeleton />}>
              <LazyCalendarView
                projectId={projectId}
                onTicketClick={openTicket}
                filters={filters}
                filterTicketIds={cycleTicketIdSet}
              />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "spreadsheet" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load spreadsheet.
              </div>
            }
          >
            <UnifiedFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              workflowStatuses={workflow.statuses}
              projectId={projectId}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
            <Suspense fallback={<BoardSkeleton />}>
              <LazySpreadsheetView
                projectId={projectId}
                onTicketClick={openTicket}
                filters={filters}
                filterTicketIds={cycleTicketIdSet}
                sortKey={sortKey}
                sortDir={sortDir}
                groupBy={groupBy}
              />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "sprints" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load sprints.
              </div>
            }
          >
            <Suspense fallback={<BoardSkeleton />}>
              <LazySprintPlanning
                projectId={projectId}
                onTicketClick={openTicket}
              />
            </Suspense>
          </ErrorBoundary>
        ) : currentView === "gantt" ? (
          <ErrorBoundary
            fallback={
              <div className="text-center py-8 text-red-500 text-sm">
                Failed to load Gantt chart.
              </div>
            }
          >
            <UnifiedFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              workflowStatuses={workflow.statuses}
              projectId={projectId}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
            <Suspense fallback={<BoardSkeleton />}>
              <LazyGanttView
                projectId={projectId}
                onTicketClick={openTicket}
                filters={filters}
                filterTicketIds={cycleTicketIdSet}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <TicketListView
            projectId={projectId}
            onTicketClick={openTicket}
            selectedTicketId={selectedTicketId}
            filters={filters}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onFiltersChange={handleFiltersChange}
            filterTicketIds={cycleTicketIdSet}
            isFetchingMore={isFetchingNextPage}
            totalCount={totalCount}
            loadedCount={loadedCount}
            groupBy={groupBy}
            selectedIds={bulkSelectedIds}
            onSelectionChange={setBulkSelectedIds}
          />
        )}
      </div>

      <CreateTicketDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
      />

      {/* TicketSidePanel removed — now at layout level */}

      <BulkActionsBar
        selectedIds={bulkSelectedIds}
        projectId={projectId}
        onClear={() => setBulkSelectedIds([])}
      />
    </div>
  );
}
