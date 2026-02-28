'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useProjectTickets } from '@/lib/hooks/use-tickets';
import { useUpdateTicket } from '@/lib/hooks/use-tickets';
import { useMembers } from '@/lib/hooks/use-members';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { TICKET_PRIORITIES, ISSUE_TYPES } from '@/types';
import type { Ticket, ViewFilters } from '@/types';

const ROW_HEIGHT = 32;

type Column = {
  key: string;
  label: string;
  width: number;
  editable?: boolean;
};

const COLUMNS: Column[] = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'title', label: 'Title', width: 300, editable: true },
  { key: 'status', label: 'Status', width: 120, editable: true },
  { key: 'priority', label: 'Priority', width: 100, editable: true },
  { key: 'issue_type', label: 'Type', width: 100, editable: true },
  { key: 'assignee', label: 'Assignee', width: 140, editable: true },
  { key: 'story_points', label: 'Points', width: 70, editable: true },
  { key: 'due_date', label: 'Due Date', width: 110, editable: true },
  { key: 'updated_at', label: 'Updated', width: 100 },
];

export function SpreadsheetView({
  projectId,
  onTicketClick,
  filters,
  filterTicketIds,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  filters?: ViewFilters;
  filterTicketIds?: Set<string> | null;
}) {
  const allTickets = useProjectTickets(projectId);
  const updateTicket = useUpdateTicket();
  const { data: members } = useMembers();
  const workflow = useProjectWorkflow(projectId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editingCell, setEditingCell] = useState<{ ticketId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const tickets = useMemo(() => {
    let result = filterTicketIds
      ? allTickets.filter((t) => filterTicketIds.has(t.id))
      : allTickets;

    if (filters?.status?.length) {
      result = result.filter((t) => filters.status!.includes(t.status));
    }
    if (filters?.priority?.length) {
      result = result.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters?.assignee_ids?.length) {
      result = result.filter((t) => t.assignee_id && filters.assignee_ids!.includes(t.assignee_id));
    }

    return result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [allTickets, filterTicketIds, filters]);

  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const startEdit = useCallback((ticketId: string, column: string, currentValue: string) => {
    setEditingCell({ ticketId, column });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { ticketId, column } = editingCell;

    const updates: Record<string, unknown> = {};
    if (column === 'title') updates.title = editValue;
    else if (column === 'priority') updates.priority = editValue;
    else if (column === 'status') updates.status = editValue;
    else if (column === 'issue_type') updates.issue_type = editValue;
    else if (column === 'story_points') updates.story_points = editValue ? parseInt(editValue) : null;
    else if (column === 'due_date') updates.due_date = editValue || null;
    else if (column === 'assignee') updates.assignee_id = editValue || null;

    if (Object.keys(updates).length > 0) {
      updateTicket.mutate({ id: ticketId, project_id: projectId, ...updates });
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateTicket, projectId]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const getCellValue = (ticket: Ticket, col: string): string => {
    switch (col) {
      case 'id': return ticket.id.slice(0, 6).toUpperCase();
      case 'title': return ticket.title;
      case 'status': return ticket.status;
      case 'priority': return ticket.priority;
      case 'issue_type': return ticket.issue_type ?? 'task';
      case 'assignee': return ticket.assignee?.name ?? '';
      case 'story_points': return ticket.story_points?.toString() ?? '';
      case 'due_date': return ticket.due_date ?? '';
      case 'updated_at': return new Date(ticket.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      default: return '';
    }
  };

  const totalWidth = COLUMNS.reduce((sum, c) => sum + c.width, 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-content-primary">Spreadsheet</h3>
      <div className="border border-border-subtle rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex bg-surface-secondary border-b border-border-subtle" style={{ minWidth: totalWidth }}>
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="text-[10px] font-medium text-content-muted uppercase px-2 py-1.5 border-r border-border-subtle flex-shrink-0"
              style={{ width: col.width }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: totalWidth }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const ticket = tickets[virtualRow.index];
              return (
                <div
                  key={ticket.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center border-b border-border-subtle hover:bg-hover transition-colors"
                >
                  {COLUMNS.map((col) => {
                    const isEditing = editingCell?.ticketId === ticket.id && editingCell.column === col.key;
                    const value = getCellValue(ticket, col.key);

                    return (
                      <div
                        key={col.key}
                        className="px-2 border-r border-border-subtle flex-shrink-0 h-full flex items-center"
                        style={{ width: col.width }}
                      >
                        {isEditing ? (
                          col.key === 'status' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            >
                              {workflow.statuses.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          ) : col.key === 'priority' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            >
                              {TICKET_PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          ) : col.key === 'issue_type' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            >
                              {ISSUE_TYPES.map((it) => (
                                <option key={it.value} value={it.value}>{it.label}</option>
                              ))}
                            </select>
                          ) : col.key === 'assignee' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            >
                              <option value="">Unassigned</option>
                              {members?.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          ) : col.key === 'due_date' ? (
                            <input
                              type="date"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); if (e.key === 'Enter') commitEdit(); }}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            />
                          ) : (
                            <input
                              type={col.key === 'story_points' ? 'number' : 'text'}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); if (e.key === 'Enter') commitEdit(); }}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            />
                          )
                        ) : (
                          <button
                            onClick={() => {
                              if (col.editable) {
                                const rawVal = col.key === 'assignee' ? (ticket.assignee_id ?? '') : value;
                                startEdit(ticket.id, col.key, rawVal);
                              } else if (col.key === 'id') {
                                onTicketClick?.(ticket.id);
                              }
                            }}
                            className={`w-full text-left text-[11px] truncate ${
                              col.key === 'id'
                                ? 'font-mono text-content-muted cursor-pointer hover:text-accent'
                                : col.editable
                                  ? 'text-content-primary cursor-text hover:bg-surface-secondary rounded px-0.5'
                                  : 'text-content-muted cursor-default'
                            }`}
                          >
                            {value || '\u00A0'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle px-3 py-1 bg-surface-secondary">
          <span className="text-[11px] text-content-muted">
            {tickets.length} issue{tickets.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
