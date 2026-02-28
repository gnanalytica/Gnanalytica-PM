'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useHydrateTicket, useUpdateTicket, useStoreTicket } from '@/lib/hooks/use-tickets';
import { useMembers } from '@/lib/hooks/use-members';
import { useLabels, useCreateLabel } from '@/lib/hooks/use-labels';
import { ActivityTimeline } from '@/components/tickets/activity-timeline';
import { CommentList } from '@/components/comments/comment-list';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { TICKET_PRIORITIES } from '@/types';
import type { TicketPriority } from '@/types';

const PRIORITY_CHIP: Record<TicketPriority, string> = {
  urgent: 'bg-[#c27070]/10 text-[#c27070]',
  high: 'bg-[#c48a5a]/10 text-[#c48a5a]',
  medium: 'bg-[#c9a04e]/10 text-[#c9a04e]',
  low: 'bg-surface-secondary text-content-muted',
};

const LABEL_COLORS = ['#c27070', '#c48a5a', '#c9a04e', '#5fae7e', '#6e9ade', '#9585c4', '#c47a9a', '#8b919a'];

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-content-muted w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

function shortId(id: string) {
  return `PM-${id.slice(0, 4).toUpperCase()}`;
}

type DropdownType = null | 'status' | 'priority' | 'assignee' | 'duedate';

export function TicketSidePanel({
  ticketId,
  onClose,
}: {
  ticketId: string | null;
  onClose: () => void;
}) {
  const { isLoading } = useHydrateTicket(ticketId ?? '');
  const ticket = useStoreTicket(ticketId ?? '');
  const { data: members } = useMembers();
  const { data: projectLabels } = useLabels(ticket?.project_id ?? '');
  const updateTicket = useUpdateTicket();
  const createLabel = useCreateLabel();
  const workflow = useProjectWorkflow(ticket?.project_id);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset state when ticket changes
  useEffect(() => {
    setEditingTitle(false);
    setEditingDesc(false);
    setOpenDropdown(null);
    setShowLabelInput(false);
  }, [ticketId]);

  // Layered escape key: close dropdown → cancel edit → close panel
  useEffect(() => {
    if (!ticketId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdown) {
          setOpenDropdown(null);
        } else if (editingTitle || editingDesc) {
          setEditingTitle(false);
          setEditingDesc(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ticketId, onClose, openDropdown, editingTitle, editingDesc]);

  // Click outside dropdown closes it
  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  const startEditingTitle = useCallback(() => {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditingTitle(true);
  }, [ticket]);

  const saveTitle = useCallback(async () => {
    if (!ticket || !editTitle.trim()) {
      setEditingTitle(false);
      return;
    }
    if (editTitle.trim() !== ticket.title) {
      await updateTicket.mutateAsync({
        id: ticket.id,
        project_id: ticket.project_id,
        title: editTitle.trim(),
      });
    }
    setEditingTitle(false);
  }, [ticket, editTitle, updateTicket]);

  const startEditingDesc = useCallback(() => {
    if (!ticket) return;
    setEditDescription(ticket.description ?? '');
    setEditingDesc(true);
  }, [ticket]);

  const saveDesc = useCallback(async () => {
    if (!ticket) {
      setEditingDesc(false);
      return;
    }
    const newDesc = editDescription.trim();
    if (newDesc !== (ticket.description ?? '')) {
      await updateTicket.mutateAsync({
        id: ticket.id,
        project_id: ticket.project_id,
        description: newDesc || undefined,
      });
    }
    setEditingDesc(false);
  }, [ticket, editDescription, updateTicket]);

  const handleStatusChange = useCallback((status: string) => {
    if (!ticket) return;
    updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, status });
    setOpenDropdown(null);
  }, [ticket, updateTicket]);

  const handlePriorityChange = useCallback((priority: TicketPriority) => {
    if (!ticket || ticket.priority === priority) return;
    updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, priority });
    setOpenDropdown(null);
  }, [ticket, updateTicket]);

  const handleAssigneeChange = useCallback((assigneeId: string) => {
    if (!ticket) return;
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      assignee_id: assigneeId || null,
    });
    setOpenDropdown(null);
  }, [ticket, updateTicket]);

  const handleDueDateChange = useCallback((dueDate: string) => {
    if (!ticket) return;
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      due_date: dueDate || null,
    });
  }, [ticket, updateTicket]);

  const handleLabelToggle = useCallback((labelId: string) => {
    if (!ticket) return;
    const currentIds = ticket.labels?.map((l) => l.id) ?? [];
    const newIds = currentIds.includes(labelId)
      ? currentIds.filter((id) => id !== labelId)
      : [...currentIds, labelId];
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      label_ids: newIds,
    });
  }, [ticket, updateTicket]);

  const handleCreateLabel = useCallback(async () => {
    if (!ticket || !newLabelName.trim()) return;
    const label = await createLabel.mutateAsync({
      project_id: ticket.project_id,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    const currentIds = ticket.labels?.map((l) => l.id) ?? [];
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      label_ids: [...currentIds, label.id],
    });
    setNewLabelName('');
    setShowLabelInput(false);
  }, [ticket, newLabelName, newLabelColor, createLabel, updateTicket]);

  const selectedAssignee = members?.find((m) => m.id === ticket?.assignee_id);

  return (
    <AnimatePresence>
      {ticketId ? (
        <>
          {/* Overlay */}
          <motion.div
            key="side-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            key="side-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-surface-tertiary border-l border-border-subtle z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                {ticket && (
                  <span className="text-xs font-mono text-content-muted">{shortId(ticket.id)}</span>
                )}
                <Link
                  href={`/ticket/${ticketId}`}
                  target="_blank"
                  rel="noopener"
                  className="text-[11px] text-content-muted hover:text-blue-600 transition-colors duration-[120ms]"
                >
                  Open &rarr;
                </Link>
              </div>
              <button
                onClick={onClose}
                className="text-content-muted hover:text-content-secondary active:text-content-primary rounded transition-colors duration-[120ms] p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                /* Simplified skeleton matching flat layout */
                <div className="px-4 pt-3 space-y-3">
                  <div className="h-5 bg-surface-secondary animate-shimmer rounded w-3/4" />
                  <div className="space-y-1">
                    <div className="h-3 bg-surface-secondary animate-shimmer rounded w-full" />
                    <div className="h-3 bg-surface-secondary animate-shimmer rounded w-2/3" />
                  </div>
                  <div className="border-t border-border-subtle pt-2 space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="h-3 bg-surface-secondary animate-shimmer rounded w-16" />
                        <div className="h-5 bg-surface-secondary animate-shimmer rounded w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : !ticket ? (
                <p className="text-sm text-content-muted text-center py-8">Ticket not found.</p>
              ) : (
                <>
                  {/* Title — inline editable */}
                  <div className="px-4 pt-3 pb-1">
                    {editingTitle ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveTitle();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingTitle(false);
                          }
                        }}
                        className="w-full text-base font-medium bg-transparent border-b-2 border-blue-500 outline-none py-0.5"
                        autoFocus
                      />
                    ) : (
                      <h2
                        className="text-base font-medium text-content-primary cursor-text"
                        onClick={startEditingTitle}
                      >
                        {ticket.title}
                      </h2>
                    )}
                  </div>

                  {/* Description — inline editable */}
                  <div className="px-4 pb-3">
                    {editingDesc ? (
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onBlur={saveDesc}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingDesc(false);
                          }
                        }}
                        className="w-full text-sm bg-transparent border-b-2 border-blue-500 outline-none resize-none py-0.5"
                        rows={4}
                        autoFocus
                      />
                    ) : (
                      <p
                        className={`text-sm cursor-text ${ticket.description ? 'text-content-secondary whitespace-pre-wrap' : 'text-content-muted'}`}
                        onClick={startEditingDesc}
                      >
                        {ticket.description || 'Add a description...'}
                      </p>
                    )}
                  </div>

                  {/* Properties */}
                  <div className="px-4 border-t border-border-subtle">
                    {/* Status */}
                    <PropertyRow label="Status">
                      <div className="relative" data-dropdown>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs hover:bg-hover transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: workflow.getStatusColor(ticket.status) }}
                          />
                          {workflow.getStatusLabel(ticket.status)}
                        </button>
                        {openDropdown === 'status' && (
                          <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 min-w-[160px] py-1">
                            {workflow.statuses.map((s) => {
                              const allowed = workflow.isTransitionAllowed(ticket.status, s.key);
                              const isActive = ticket.status === s.key;
                              return (
                                <button
                                  key={s.key}
                                  onClick={() => allowed && handleStatusChange(s.key)}
                                  disabled={!allowed}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                    isActive
                                      ? 'bg-blue-500/[0.07] text-blue-600'
                                      : allowed
                                        ? 'text-content-secondary hover:bg-hover'
                                        : 'opacity-30 cursor-not-allowed'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.label}
                                  {isActive && (
                                    <svg className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </PropertyRow>

                    {/* Priority */}
                    <PropertyRow label="Priority">
                      <div className="relative" data-dropdown>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_CHIP[ticket.priority]}`}
                        >
                          {TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label ?? ticket.priority}
                        </button>
                        {openDropdown === 'priority' && (
                          <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 min-w-[140px] py-1">
                            {TICKET_PRIORITIES.map((p) => {
                              const isActive = ticket.priority === p.value;
                              return (
                                <button
                                  key={p.value}
                                  onClick={() => handlePriorityChange(p.value)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                    isActive ? 'bg-blue-500/[0.07] text-blue-600' : 'text-content-secondary hover:bg-hover'
                                  }`}
                                >
                                  <span className={`w-4 text-center rounded px-0.5 text-[10px] font-medium ${PRIORITY_CHIP[p.value]}`}>
                                    {p.label[0]}
                                  </span>
                                  {p.label}
                                  {isActive && (
                                    <svg className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </PropertyRow>

                    {/* Assignee */}
                    <PropertyRow label="Assignee">
                      <div className="relative" data-dropdown>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs hover:bg-hover transition-colors"
                        >
                          {selectedAssignee ? (
                            <>
                              {selectedAssignee.avatar_url ? (
                                <img src={selectedAssignee.avatar_url} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                                  <span className="text-[8px] font-medium text-content-muted">
                                    {(selectedAssignee.name ?? '?')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="truncate">{selectedAssignee.name}</span>
                            </>
                          ) : (
                            <span className="text-content-muted">None</span>
                          )}
                        </button>
                        {openDropdown === 'assignee' && (
                          <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 min-w-[180px] max-h-48 overflow-y-auto py-1">
                            <button
                              onClick={() => handleAssigneeChange('')}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                !ticket.assignee_id ? 'bg-blue-500/[0.07] text-blue-600' : 'text-content-secondary hover:bg-hover'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 text-content-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </div>
                              Unassigned
                            </button>
                            {members?.map((m) => {
                              const isActive = ticket.assignee_id === m.id;
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => handleAssigneeChange(m.id)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                    isActive ? 'bg-blue-500/[0.07] text-blue-600' : 'text-content-secondary hover:bg-hover'
                                  }`}
                                >
                                  {m.avatar_url ? (
                                    <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                                      <span className="text-[8px] font-medium text-content-muted">
                                        {(m.name ?? '?')[0].toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <span className="truncate">{m.name}</span>
                                  {isActive && (
                                    <svg className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </PropertyRow>

                    {/* Due Date */}
                    <PropertyRow label="Due date">
                      <div className="relative" data-dropdown>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'duedate' ? null : 'duedate')}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs hover:bg-hover transition-colors"
                        >
                          {ticket.due_date ? (
                            new Date(ticket.due_date + 'T00:00:00').toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-content-muted">None</span>
                          )}
                        </button>
                        {openDropdown === 'duedate' && (
                          <div className="absolute right-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-md z-10 p-2">
                            <input
                              type="date"
                              value={ticket.due_date ?? ''}
                              onChange={(e) => handleDueDateChange(e.target.value)}
                              className="border border-border-subtle rounded-md px-2 py-1 text-xs"
                              autoFocus
                            />
                            {ticket.due_date && (
                              <button
                                onClick={() => {
                                  handleDueDateChange('');
                                  setOpenDropdown(null);
                                }}
                                className="mt-1 w-full text-xs text-content-muted hover:text-content-secondary py-1 transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </PropertyRow>

                    {/* Labels */}
                    <PropertyRow label="Labels">
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {ticket.labels && ticket.labels.length > 0 && ticket.labels.map((label) => (
                          <button
                            key={label.id}
                            onClick={() => handleLabelToggle(label.id)}
                            className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                            style={{
                              backgroundColor: label.color + '20',
                              color: label.color,
                            }}
                            title={`Remove ${label.name}`}
                          >
                            {label.name}
                          </button>
                        ))}
                        <button
                          onClick={() => setShowLabelInput(!showLabelInput)}
                          className="text-content-muted hover:text-content-secondary transition-colors text-xs px-1"
                        >
                          +
                        </button>
                      </div>
                    </PropertyRow>

                    {/* Label toggling & creation */}
                    {showLabelInput && (
                      <div className="pb-2 space-y-2">
                        {projectLabels && projectLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {projectLabels.map((label) => {
                              const isSelected = ticket.labels?.some((l) => l.id === label.id) ?? false;
                              return (
                                <button
                                  key={label.id}
                                  onClick={() => handleLabelToggle(label.id)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all duration-[120ms] ${
                                    isSelected
                                      ? 'ring-1 ring-offset-1 ring-blue-500'
                                      : 'opacity-50 hover:opacity-80'
                                  }`}
                                  style={{
                                    backgroundColor: label.color + '15',
                                    color: label.color,
                                    borderColor: label.color + (isSelected ? '' : '40'),
                                  }}
                                >
                                  {label.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="New label"
                            className="flex-1 border border-border-subtle rounded-md px-2.5 py-1 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateLabel();
                              }
                            }}
                          />
                          <select
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="border border-border-subtle rounded-md px-1.5 py-1 text-xs cursor-pointer"
                          >
                            {LABEL_COLORS.map((c) => (
                              <option key={c} value={c} style={{ color: c }}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleCreateLabel}
                            disabled={!newLabelName.trim() || createLabel.isPending}
                            className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors duration-[120ms]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Creator info */}
                  <div className="px-4 py-2 border-t border-border-subtle">
                    <p className="text-[11px] text-content-muted">
                      Created by {ticket.creator?.name ?? 'Unknown'} on{' '}
                      {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Activity */}
                  <div className="px-4 py-2 border-t border-border-subtle">
                    <label className="block text-xs font-medium uppercase tracking-wide text-content-muted mb-2">Activity</label>
                    <ActivityTimeline ticketId={ticket.id} workflowStatuses={workflow.statuses} />
                  </div>

                  {/* Comments */}
                  <div className="px-4 py-2 border-t border-border-subtle">
                    <CommentList ticketId={ticket.id} assigneeId={ticket.assignee_id} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
