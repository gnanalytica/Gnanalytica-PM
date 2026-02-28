'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { useRouter, usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useProjects } from '@/lib/hooks/use-projects';
import { useMembers } from '@/lib/hooks/use-members';
import { useSearchIndex } from '@/lib/hooks/use-search-index';
import { useCommentSearch } from '@/lib/hooks/use-comment-search';
import { useUpdateTicket, useStoreTicket } from '@/lib/hooks/use-tickets';
import { useProjectCycles, useAssignTicketToCycle } from '@/lib/hooks/use-cycles';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { useShallowSearch } from '@/lib/hooks/use-workspace-nav';
import { useTicketStore } from '@/lib/store/ticket-store';
import type { Ticket } from '@/types';

// ── Helpers ──

function statusDotColor(status: string): string {
  switch (status) {
    case 'backlog': return '#6b7280';
    case 'todo': return '#8b919a';
    case 'in_progress': return '#6e9ade';
    case 'done': return '#5fae7e';
    case 'canceled': return '#c27070';
    default: return '#8b919a';
  }
}

// ── SVG icon paths (avoid duplicating full SVGs) ──

const ICONS = {
  plus: 'M12 4.5v15m7.5-7.5h-15',
  switchProject: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  home: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  folder: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
  inbox: 'M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h2.21a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3',
  status: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  user: 'M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  cycle: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182',
  myIssues: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  comment: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
} as const;

function Icon({ d, className = 'w-4 h-4 text-gray-400' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ── Types ──

type Page =
  | 'create-ticket'
  | 'open-project'
  | 'change-status'
  | 'assign-user'
  | 'move-to-cycle'
  | 'pick-ticket';

const PAGE_PLACEHOLDERS: Record<Page, string> = {
  'create-ticket': 'Select a project for the new issue...',
  'open-project': 'Search projects...',
  'change-status': 'Pick a status...',
  'assign-user': 'Pick a user...',
  'move-to-cycle': 'Pick a cycle...',
  'pick-ticket': 'Search for a ticket...',
};

// ── Component ──

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<Page | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchString = useShallowSearch();

  const page = pages[pages.length - 1] as Page | undefined;

  // ── Data hooks ──

  const { data: projects } = useProjects();
  const { data: members } = useMembers();

  // Derive ticket context from URL (side panel ?ticket= or /ticket/[id] route)
  const urlTicketId = pathname.startsWith('/ticket/')
    ? pathname.split('/')[2]
    : new URLSearchParams(searchString).get('ticket') ?? null;
  const activeTicketId = actionTicketId ?? urlTicketId;
  const activeTicket = useStoreTicket(activeTicketId ?? '');

  // Current project from URL
  const currentProjectId = pathname.startsWith('/project/')
    ? pathname.split('/')[2]
    : activeTicket?.project_id ?? null;

  // Workflow and cycles for the active ticket's project
  const workflow = useProjectWorkflow(activeTicket?.project_id);
  const cycles = useProjectCycles(activeTicket?.project_id ?? '');

  // Mutations
  const updateTicket = useUpdateTicket();
  const assignToCycle = useAssignTicketToCycle();

  // All tickets from store (for pick-ticket page)
  const { byId: ticketById, ids: ticketIds } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );
  const storeTickets = useMemo<Ticket[]>(
    () => {
      const result: Ticket[] = [];
      for (const id of ticketIds) {
        const t = ticketById[id];
        if (t) result.push(t);
        if (result.length >= 100) break;
      }
      return result;
    },
    [ticketById, ticketIds],
  );

  // Search hooks
  const isSearching = !page && search.length >= 2;
  const fuse = useSearchIndex();
  const { results: commentResults, isSearching: commentsLoading } = useCommentSearch(search, isSearching);

  // Compute fuse results
  const fuseResults = isSearching && fuse ? fuse.search(search, { limit: 10 }) : [];
  const ticketResults = fuseResults.filter((r) => r.item.type === 'ticket').slice(0, 5);
  const projectResults = fuseResults.filter((r) => r.item.type === 'project').slice(0, 3);

  // ── Keyboard shortcut ──

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Actions ──

  const reset = () => {
    setSearch('');
    setPages([]);
    setActionTicketId(null);
    setPendingAction(null);
  };

  const runAction = (fn: () => void) => {
    fn();
    setOpen(false);
    reset();
  };

  const pushPage = (p: Page) => {
    setPages((prev) => [...prev, p]);
    setSearch('');
  };

  /** Push a ticket-dependent page. If no ticket context, show picker first. */
  const pushTicketAction = (action: Page) => {
    if (urlTicketId) {
      pushPage(action);
    } else {
      setPendingAction(action);
      pushPage('pick-ticket');
    }
  };

  /** Called from the pick-ticket page when a ticket is selected. */
  const selectTicketForAction = (ticketId: string) => {
    setActionTicketId(ticketId);
    setSearch('');
    if (pendingAction) {
      setPages((prev) => [...prev.slice(0, -1), pendingAction]);
      setPendingAction(null);
    }
  };

  // ── Render ──

  const placeholder = page
    ? PAGE_PLACEHOLDERS[page]
    : 'Type a command or search...';

  // Determine shouldFilter: disable when we show custom search results
  const shouldFilter = !isSearching;

  return (
    <Command.Dialog
      label="Command palette"
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
      shouldFilter={shouldFilter}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !search && pages.length > 0) {
          e.preventDefault();
          setPages((p) => p.slice(0, -1));
          if (pages.length === 1) {
            setActionTicketId(null);
            setPendingAction(null);
          }
        }
      }}
    >
      <Command.Input
        ref={inputRef}
        value={search}
        onValueChange={setSearch}
        placeholder={placeholder}
      />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        {/* ── Root page: no search ── */}
        {!page && !isSearching && (
          <>
            <Command.Group heading="Actions">
              {/* Create Issue */}
              <Command.Item
                onSelect={() => {
                  if (currentProjectId) {
                    runAction(() =>
                      router.push(`/project/${currentProjectId}?create=1`)
                    );
                  } else {
                    pushPage('create-ticket');
                  }
                }}
              >
                <Icon d={ICONS.plus} />
                Create Issue
                {currentProjectId && (
                  <span className="ml-auto text-[11px] text-gray-500">current project</span>
                )}
              </Command.Item>

              {/* Change Status */}
              <Command.Item onSelect={() => pushTicketAction('change-status')}>
                <Icon d={ICONS.status} />
                Change Status
                {activeTicketId && (
                  <span className="ml-auto text-[11px] text-gray-500">active ticket</span>
                )}
              </Command.Item>

              {/* Assign User */}
              <Command.Item onSelect={() => pushTicketAction('assign-user')}>
                <Icon d={ICONS.user} />
                Assign User
                {activeTicketId && (
                  <span className="ml-auto text-[11px] text-gray-500">active ticket</span>
                )}
              </Command.Item>

              {/* Move to Cycle */}
              <Command.Item onSelect={() => pushTicketAction('move-to-cycle')}>
                <Icon d={ICONS.cycle} />
                Move to Cycle
                {activeTicketId && (
                  <span className="ml-auto text-[11px] text-gray-500">active ticket</span>
                )}
              </Command.Item>

              {/* Open Project */}
              <Command.Item onSelect={() => pushPage('open-project')}>
                <Icon d={ICONS.folder} />
                Open Project
              </Command.Item>

              {/* Go to Inbox */}
              <Command.Item onSelect={() => runAction(() => router.push('/inbox'))}>
                <Icon d={ICONS.inbox} />
                Go to Inbox
              </Command.Item>

              {/* Go to My Issues */}
              <Command.Item onSelect={() => runAction(() => router.push('/my-issues'))}>
                <Icon d={ICONS.myIssues} />
                Go to My Issues
              </Command.Item>

              {/* Go to Dashboard */}
              <Command.Item onSelect={() => runAction(() => router.push('/dashboard'))}>
                <Icon d={ICONS.home} />
                Go to Dashboard
              </Command.Item>

              {/* Focus Search */}
              <Command.Item
                onSelect={() => {
                  setSearch('');
                  inputRef.current?.focus();
                }}
              >
                <Icon d={ICONS.search} />
                Focus Search
                <span className="ml-auto text-[11px] text-gray-500 font-mono">/</span>
              </Command.Item>
            </Command.Group>

            {projects && projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={project.name}
                    onSelect={() => runAction(() => router.push(`/project/${project.id}`))}
                  >
                    <Icon d={ICONS.folder} />
                    {project.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </>
        )}

        {/* ── Root page: search results ── */}
        {!page && isSearching && (
          <>
            {ticketResults.length > 0 && (
              <Command.Group heading="Issues">
                {ticketResults.map((result) => {
                  const ticket = result.item.type === 'ticket' ? result.item.item : null;
                  const projectName = result.item.type === 'ticket' ? result.item.projectName : undefined;
                  if (!ticket) return null;
                  return (
                    <Command.Item
                      key={ticket.id}
                      value={`ticket-${ticket.id}`}
                      onSelect={() => runAction(() => router.push(`/ticket/${ticket.id}`))}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statusDotColor(ticket.status) }}
                      />
                      <span className="truncate">{ticket.title}</span>
                      {projectName && (
                        <span className="ml-auto text-[11px] text-gray-500 flex-shrink-0">{projectName}</span>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {projectResults.length > 0 && (
              <Command.Group heading="Projects">
                {projectResults.map((result) => {
                  const project = result.item.type === 'project' ? result.item.item : null;
                  if (!project) return null;
                  return (
                    <Command.Item
                      key={project.id}
                      value={`project-${project.id}`}
                      onSelect={() => runAction(() => router.push(`/project/${project.id}`))}
                    >
                      <Icon d={ICONS.folder} />
                      {project.name}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            <Command.Group heading={commentsLoading ? 'Comments (searching...)' : 'Comments'}>
              {commentResults.length === 0 && !commentsLoading && (
                <Command.Item disabled value="no-comments">
                  No matching comments
                </Command.Item>
              )}
              {commentResults.map((comment) => (
                <Command.Item
                  key={comment.id}
                  value={`comment-${comment.id}`}
                  onSelect={() => runAction(() => router.push(`/ticket/${comment.ticket_id}`))}
                >
                  <Icon d={ICONS.comment} />
                  <span className="flex flex-col min-w-0">
                    {comment.ticket && (
                      <span className="text-[11px] text-gray-500 truncate">{comment.ticket.title}</span>
                    )}
                    <span className="truncate">{comment.body}</span>
                  </span>
                  {comment.user?.name && (
                    <span className="ml-auto text-[11px] text-gray-500 flex-shrink-0">{comment.user.name}</span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </>
        )}

        {/* ── Create Ticket: pick project ── */}
        {page === 'create-ticket' && (
          <Command.Group heading="Select project for new issue">
            {projects?.map((project) => (
              <Command.Item
                key={project.id}
                value={project.name}
                onSelect={() =>
                  runAction(() =>
                    router.push(`/project/${project.id}?create=1`)
                  )
                }
              >
                <Icon d={ICONS.folder} />
                {project.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* ── Open Project ── */}
        {page === 'open-project' && (
          <Command.Group heading="Open project">
            {projects?.map((project) => (
              <Command.Item
                key={project.id}
                value={project.name}
                onSelect={() =>
                  runAction(() => router.push(`/project/${project.id}`))
                }
              >
                <Icon d={ICONS.folder} />
                {project.name}
                {project.id === currentProjectId && (
                  <span className="ml-auto text-[11px] text-gray-500">current</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* ── Pick Ticket (for context-dependent actions) ── */}
        {page === 'pick-ticket' && (
          <Command.Group heading="Select a ticket">
            {storeTickets.map((ticket) => (
              <Command.Item
                key={ticket.id}
                value={`${ticket.title} ${ticket.id}`}
                onSelect={() => selectTicketForAction(ticket.id)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusDotColor(ticket.status) }}
                />
                <span className="truncate">{ticket.title}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* ── Change Status ── */}
        {page === 'change-status' && activeTicket && (
          <Command.Group heading={`Change status — ${activeTicket.title}`}>
            {workflow.statuses.map((s) => (
              <Command.Item
                key={s.key}
                value={s.label}
                onSelect={() =>
                  runAction(() => {
                    updateTicket.mutate({
                      id: activeTicket.id,
                      project_id: activeTicket.project_id,
                      status: s.key,
                    });
                  })
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
                {activeTicket.status === s.key && (
                  <span className="ml-auto text-[11px] text-gray-500">current</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* ── Assign User ── */}
        {page === 'assign-user' && activeTicket && (
          <Command.Group heading={`Assign user — ${activeTicket.title}`}>
            <Command.Item
              value="Unassigned"
              onSelect={() =>
                runAction(() => {
                  updateTicket.mutate({
                    id: activeTicket.id,
                    project_id: activeTicket.project_id,
                    assignee_id: null,
                  });
                })
              }
            >
              <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
              Unassigned
              {!activeTicket.assignee_id && (
                <span className="ml-auto text-[11px] text-gray-500">current</span>
              )}
            </Command.Item>
            {members?.map((m) => (
              <Command.Item
                key={m.id}
                value={m.name}
                onSelect={() =>
                  runAction(() => {
                    updateTicket.mutate({
                      id: activeTicket.id,
                      project_id: activeTicket.project_id,
                      assignee_id: m.id,
                    });
                  })
                }
              >
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-medium text-gray-600">{(m.name ?? '?')[0].toUpperCase()}</span>
                  </div>
                )}
                {m.name}
                {activeTicket.assignee_id === m.id && (
                  <span className="ml-auto text-[11px] text-gray-500">current</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* ── Move to Cycle ── */}
        {page === 'move-to-cycle' && activeTicket && (
          <Command.Group heading={`Move to cycle — ${activeTicket.title}`}>
            {cycles.length === 0 ? (
              <Command.Item disabled value="no-cycles">
                No cycles in this project
              </Command.Item>
            ) : (
              cycles.map((cycle) => (
                <Command.Item
                  key={cycle.id}
                  value={cycle.name}
                  onSelect={() =>
                    runAction(() => {
                      assignToCycle.mutate({
                        ticketId: activeTicket.id,
                        cycleId: cycle.id,
                        projectId: activeTicket.project_id,
                      });
                    })
                  }
                >
                  <Icon d={ICONS.cycle} />
                  {cycle.name}
                  <span className="ml-auto text-[11px] text-gray-500">
                    {cycle.start_date} — {cycle.end_date}
                  </span>
                </Command.Item>
              ))
            )}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
