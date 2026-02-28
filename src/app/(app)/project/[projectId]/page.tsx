'use client';

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TicketListView } from '@/components/tickets/ticket-list-view';
import { KanbanBoard } from '@/components/board/kanban-board';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { TicketSidePanel } from '@/components/tickets/ticket-side-panel';
import { WorkflowEditor } from '@/components/workflow/workflow-editor';
import { useHydrateTickets } from '@/lib/hooks/use-tickets';
import { useProject } from '@/lib/hooks/use-projects';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime';
import { useSavedViews, useCreateSavedView } from '@/lib/hooks/use-saved-views';
import { useHydrateCycles, useCycleTickets, useActiveCycle } from '@/lib/hooks/use-cycles';
import { CycleBar } from '@/components/cycles/cycle-bar';
import {
  useWorkspaceNav,
  useShallowSearch,
  shallowReplace,
  shallowReplaceAll,
} from '@/lib/hooks/use-workspace-nav';
import { BoardSkeleton, IssueListSkeleton } from '@/components/skeletons';
import type { ViewFilters, TicketPriority } from '@/types';
import type { SortKey, SortDir } from '@/components/tickets/ticket-list-view';

const LazyAnalyticsDashboard = lazy(() =>
  import('@/components/analytics/analytics-dashboard').then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);

type Tab = 'board' | 'list' | 'workflow' | 'analytics';

function parseStatusParam(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const items = val.split(',').filter(Boolean);
  return items.length ? items : undefined;
}

function parsePriorityParam(val: string | null): TicketPriority[] | undefined {
  if (!val) return undefined;
  const valid: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
  const items = val.split(',').filter((p): p is TicketPriority => valid.includes(p as TicketPriority));
  return items.length ? items : undefined;
}

function parseAssigneeParam(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const items = val.split(',').filter(Boolean);
  return items.length ? items : undefined;
}

const VALID_SORT_KEYS: SortKey[] = ['id', 'title', 'status', 'priority', 'assignee', 'updated_at'];

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : undefined;
  const router = useRouter();
  const searchString = useShallowSearch();

  // Redirect to dashboard if project ID is missing (e.g. invalid or stale URL)
  useEffect(() => {
    if (params && !projectId) {
      router.replace('/dashboard');
    }
  }, [projectId, params, router]);

  const { ticketId: selectedTicketId, openTicket, closeTicket } = useWorkspaceNav();

  const [tab, setTab] = useState<Tab>('board');
  const [showCreate, setShowCreate] = useState(false);
  const [cycleFilter, setCycleFilter] = useState<'all' | 'active'>('all');

  // Filter/sort state
  const [filters, setFilters] = useState<ViewFilters>({});
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeViewName, setActiveViewName] = useState<string | null>(null);

  // Save view inline form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');

  const { data: savedViews } = useSavedViews(projectId);
  const createSavedView = useCreateSavedView();

  // Track first sync so we only set tab on initial load (not on every URL change)
  const isFirstSync = useRef(true);

  // ── Sync React state FROM URL (handles initial load + back/forward) ──
  useEffect(() => {
    const p = new URLSearchParams(searchString);
    const viewId = p.get('view');

    // Handle ?create=1 (from command palette navigation)
    if (p.get('create') === '1') {
      setShowCreate(true);
      shallowReplace({ create: null });
    }

    // ── Saved view ──
    if (viewId && savedViews) {
      const view = savedViews.find((v) => v.id === viewId);
      if (view) {
        const nextFilters = view.filters ?? {};
        setFilters((prev) =>
          JSON.stringify(prev) === JSON.stringify(nextFilters) ? prev : nextFilters,
        );
        setSortKey((prev) => {
          const next = (view.sort_key as SortKey) || 'updated_at';
          return prev === next ? prev : next;
        });
        setSortDir((prev) => {
          const next = (view.sort_dir as SortDir) || 'desc';
          return prev === next ? prev : next;
        });
        setActiveViewName((prev) => (view.name === prev ? prev : view.name));
        if (isFirstSync.current) setTab('list');
        isFirstSync.current = false;
        return;
      }
    }

    // Wait for savedViews to load when a view param exists
    if (viewId && !savedViews) return;

    // ── Inline filter / sort params ──
    const statusParam = parseStatusParam(p.get('status'));
    const priorityParam = parsePriorityParam(p.get('priority'));
    const assigneeParam = parseAssigneeParam(p.get('assignee'));
    const sortParam = p.get('sort') as SortKey | null;
    const dirParam = p.get('dir') as SortDir | null;

    const newFilters: ViewFilters = {
      status: statusParam,
      priority: priorityParam,
      assignee_ids: assigneeParam,
    };
    setFilters((prev) =>
      JSON.stringify(prev) === JSON.stringify(newFilters) ? prev : newFilters,
    );

    const newSortKey =
      sortParam && VALID_SORT_KEYS.includes(sortParam) ? sortParam : 'updated_at';
    setSortKey((prev) => (prev === newSortKey ? prev : newSortKey));

    const newSortDir =
      dirParam === 'asc' || dirParam === 'desc' ? dirParam : 'desc';
    setSortDir((prev) => (prev === newSortDir ? prev : newSortDir));

    // Clear active view when URL has no view param
    if (!viewId) {
      setActiveViewName((prev) => (prev === null ? prev : null));
    }

    // Switch to list tab when filter params are present (first sync only)
    if (isFirstSync.current) {
      const hasInlineFilters = statusParam || priorityParam || assigneeParam || sortParam || dirParam;
      if (hasInlineFilters) setTab('list');
    }
    isFirstSync.current = false;
  }, [searchString, savedViews]);

  // ── Sync URL FROM React state (user-driven filter / sort changes) ──
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
        if (newFilters.status?.length) params.status = newFilters.status.join(',');
        if (newFilters.priority?.length) params.priority = newFilters.priority.join(',');
        if (newFilters.assignee_ids?.length) params.assignee = newFilters.assignee_ids.join(',');
        if (newSortKey !== 'updated_at') params.sort = newSortKey;
        if (newSortDir !== 'desc') params.dir = newSortDir;
      }
      // Preserve 'ticket' param (managed separately by useWorkspaceNav)
      shallowReplaceAll(params, ['ticket']);
    },
    [],
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
          setSaveViewName('');
          updateUrl(filters, sortKey, sortDir, saved.id);
        },
      },
    );
  }, [saveViewName, projectId, filters, sortKey, sortDir, createSavedView, updateUrl]);

  const { data: project } = useProject(projectId);

  // Hydrate: React Query fetches → Zustand store populated
  const { isLoading, isError, isFetchingNextPage, totalCount, loadedCount } = useHydrateTickets(projectId);
  useHydrateCycles(projectId);

  // Realtime subscription for ticket changes
  useRealtimeTickets(projectId);

  // Cycle filter: derive a Set of ticket IDs when filtering by active cycle
  const activeCycle = useActiveCycle();
  const cycleTickets = useCycleTickets(
    cycleFilter === 'active' ? activeCycle?.id ?? null : null,
  );
  const cycleTicketIdSet = useMemo(
    () =>
      cycleFilter === 'active' && activeCycle
        ? new Set(cycleTickets.map((t) => t.id))
        : null,
    [cycleFilter, activeCycle, cycleTickets],
  );

  if (!projectId) {
    return <BoardSkeleton />;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <h1 className="text-sm font-medium text-gray-900">{project?.name ?? 'Loading...'}</h1>
          {project?.description && (
            <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-[120ms]"
        >
          New Ticket
        </button>
      </div>

      <div className="flex items-center gap-1 border-b mb-1.5">
        <button
          onClick={() => setTab('board')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors rounded-t-sm ${
            tab === 'board'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setTab('list')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors rounded-t-sm ${
            tab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setTab('workflow')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors rounded-t-sm ${
            tab === 'workflow'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
          }`}
        >
          Workflow
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors rounded-t-sm ${
            tab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
          }`}
        >
          Analytics
        </button>

        {/* Active view name */}
        {tab === 'list' && activeViewName && (
          <span className="ml-2 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
            {activeViewName}
          </span>
        )}

        {/* Save View button (list tab only) */}
        {tab === 'list' && !showSaveForm && (
          <button
            onClick={() => setShowSaveForm(true)}
            className="ml-auto text-[11px] text-gray-400 hover:text-gray-600 active:text-gray-800 rounded transition-colors px-2 py-0.5"
          >
            Save View
          </button>
        )}

        {/* Inline save form */}
        {tab === 'list' && showSaveForm && (
          <div className="ml-auto flex items-center gap-1.5">
            <input
              type="text"
              value={saveViewName}
              onChange={(e) => setSaveViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveView();
                if (e.key === 'Escape') {
                  setShowSaveForm(false);
                  setSaveViewName('');
                }
              }}
              placeholder="View name..."
              className="text-xs border border-border-subtle rounded px-2 py-0.5 w-36"
              autoFocus
            />
            <button
              onClick={handleSaveView}
              disabled={!saveViewName.trim() || createSavedView.isPending}
              className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
            >
              {createSavedView.isPending ? '...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowSaveForm(false);
                setSaveViewName('');
              }}
              className="text-[11px] text-gray-400 hover:text-gray-600 active:text-gray-800 rounded px-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <CycleBar
        projectId={projectId}
        cycleFilter={cycleFilter}
        onCycleFilterChange={setCycleFilter}
      />

      {isLoading ? (
        tab === 'list' ? <IssueListSkeleton /> : <BoardSkeleton />
      ) : isError ? (
        <div className="text-center py-4 text-red-500 text-sm">
          <p>Failed to load tickets. Check your connection and try again.</p>
        </div>
      ) : tab === 'analytics' ? (
        <Suspense fallback={<BoardSkeleton />}>
          <LazyAnalyticsDashboard projectId={projectId} />
        </Suspense>
      ) : tab === 'board' ? (
        <KanbanBoard projectId={projectId} onTicketClick={openTicket} filterTicketIds={cycleTicketIdSet} />
      ) : tab === 'workflow' ? (
        <WorkflowEditor projectId={projectId} />
      ) : (
        <TicketListView
          projectId={projectId}
          onTicketClick={openTicket}
          filters={filters}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onFiltersChange={handleFiltersChange}
          filterTicketIds={cycleTicketIdSet}
          isFetchingMore={isFetchingNextPage}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}

      <CreateTicketDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
      />

      <TicketSidePanel ticketId={selectedTicketId} onClose={closeTicket} />
    </>
  );
}
