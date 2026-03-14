"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useProjectTickets } from "@/lib/hooks/use-tickets";
import { useUpdateTicket } from "@/lib/hooks/use-tickets";
import { useMembers } from "@/lib/hooks/use-members";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { AvatarStack } from "@/components/tickets/assignee-picker";
import { TICKET_PRIORITIES, ISSUE_TYPES } from "@/types";
import type { Ticket, ViewFilters, GroupByKey } from "@/types";

const ROW_HEIGHT = 32;

type Column = {
  key: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
  editable?: boolean;
};

const COLUMN_DEFS: Column[] = [
  { key: "id", label: "ID", defaultWidth: 80, minWidth: 60 },
  { key: "title", label: "Title", defaultWidth: 300, minWidth: 120, editable: true },
  { key: "status", label: "Status", defaultWidth: 120, minWidth: 80, editable: true },
  { key: "priority", label: "Priority", defaultWidth: 100, minWidth: 70, editable: true },
  { key: "issue_type", label: "Type", defaultWidth: 100, minWidth: 70, editable: true },
  { key: "assignee", label: "Assignee", defaultWidth: 140, minWidth: 80, editable: true },
  { key: "story_points", label: "Points", defaultWidth: 70, minWidth: 50, editable: true },
  { key: "due_date", label: "Due Date", defaultWidth: 110, minWidth: 80, editable: true },
  { key: "updated_at", label: "Updated", defaultWidth: 100, minWidth: 70 },
];

function useColumnWidths() {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      const initial: Record<string, number> = {};
      for (const col of COLUMN_DEFS) initial[col.key] = col.defaultWidth;
      return initial;
    }
    try {
      const raw = localStorage.getItem("pm-spreadsheet-col-widths");
      if (raw) {
        return JSON.parse(raw) as Record<string, number>;
      }
    } catch {}
    const initial: Record<string, number> = {};
    for (const col of COLUMN_DEFS) initial[col.key] = col.defaultWidth;
    return initial;
  });

  const resizeColumn = useCallback((key: string, width: number) => {
    setWidths((prev) => {
      const next = { ...prev, [key]: width };
      localStorage.setItem("pm-spreadsheet-col-widths", JSON.stringify(next));
      return next;
    });
  }, []);

  return { widths, resizeColumn };
}

function ColumnResizeHandle({
  columnKey,
  minWidth,
  currentWidth,
  onResize,
}: {
  columnKey: string;
  minWidth: number;
  currentWidth: number;
  onResize: (key: string, width: number) => void;
}) {
  const startX = useRef(0);
  const startWidth = useRef(0);
  const lastResizeTime = useRef(0);
  const THROTTLE_MS = 16; // ~60fps

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = currentWidth;
      lastResizeTime.current = Date.now();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const now = Date.now();
        if (now - lastResizeTime.current < THROTTLE_MS) return;
        lastResizeTime.current = now;

        const delta = ev.clientX - startX.current;
        onResize(columnKey, Math.max(minWidth, startWidth.current + delta));
      };

      const onMouseUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [columnKey, currentWidth, minWidth, onResize],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/40 active:bg-accent/60 transition-colors z-10"
    />
  );
}

type VirtualRow =
  | { type: "header"; label: string }
  | { type: "row"; ticket: Ticket };

const HEADER_HEIGHT = 28;

function getGroupLabel(groupBy: GroupByKey, key: string): string {
  if (!key) {
    if (groupBy === "assignee") return "Unassigned";
    return "None";
  }
  return key;
}

function groupTickets(tickets: Ticket[], groupBy: GroupByKey): Map<string, Ticket[]> {
  const map = new Map<string, Ticket[]>();
  for (const t of tickets) {
    let key: string;
    switch (groupBy) {
      case "status":
        key = t.status;
        break;
      case "priority":
        key = t.priority;
        break;
      case "assignee":
        key = t.assignee?.name ?? "";
        break;
      case "issue_type":
        key = t.issue_type ?? "task";
        break;
      case "milestone":
        key = (t as Record<string, unknown>).milestone_id as string ?? "";
        break;
      case "epic":
        key = (t as Record<string, unknown>).epic_id as string ?? "";
        break;
      default:
        key = "";
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

export function SpreadsheetView({
  projectId,
  onTicketClick,
  filters,
  filterTicketIds,
  sortKey,
  sortDir,
  groupBy,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  filters?: ViewFilters;
  filterTicketIds?: Set<string> | null;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  groupBy?: GroupByKey;
}) {
  const allTickets = useProjectTickets(projectId);
  const updateTicket = useUpdateTicket();
  const { data: members } = useMembers();
  const workflow = useProjectWorkflow(projectId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { widths, resizeColumn } = useColumnWidths();

  const [editingCell, setEditingCell] = useState<{
    ticketId: string;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

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
      result = result.filter(
        (t) => t.assignee_id && filters.assignee_ids!.includes(t.assignee_id),
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    const key = sortKey ?? "updated_at";

    return result.sort((a, b) => {
      switch (key) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "priority": {
          const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return dir * ((order[a.priority] ?? 4) - (order[b.priority] ?? 4));
        }
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "due_date": {
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return dir * (aDate - bDate);
        }
        case "created_at":
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case "updated_at":
        default:
          return dir * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      }
    });
  }, [allTickets, filterTicketIds, filters, sortKey, sortDir]);

  const virtualRows: VirtualRow[] = useMemo(() => {
    const activeGroupBy = groupBy && groupBy !== "none" ? groupBy : null;
    if (!activeGroupBy) {
      return tickets.map((ticket) => ({ type: "row" as const, ticket }));
    }
    const grouped = groupTickets(tickets, activeGroupBy);
    const rows: VirtualRow[] = [];
    for (const [key, group] of grouped) {
      rows.push({ type: "header", label: getGroupLabel(activeGroupBy, key) });
      for (const ticket of group) {
        rows.push({ type: "row", ticket });
      }
    }
    return rows;
  }, [tickets, groupBy]);

  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => virtualRows[index]?.type === "header" ? HEADER_HEIGHT : ROW_HEIGHT,
    overscan: 20,
  });

  const startEdit = useCallback(
    (ticketId: string, column: string, currentValue: string) => {
      setEditingCell({ ticketId, column });
      setEditValue(currentValue);
    },
    [],
  );

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { ticketId, column } = editingCell;

    const updates: Record<string, unknown> = {};
    if (column === "title") updates.title = editValue;
    else if (column === "priority") updates.priority = editValue;
    else if (column === "status") updates.status = editValue;
    else if (column === "issue_type") updates.issue_type = editValue;
    else if (column === "story_points")
      updates.story_points = editValue ? parseInt(editValue) : null;
    else if (column === "due_date") updates.due_date = editValue || null;
    else if (column === "assignee") updates.assignee_id = editValue || null;

    if (Object.keys(updates).length > 0) {
      updateTicket.mutate({ id: ticketId, project_id: projectId, ...updates });
    }
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, updateTicket, projectId]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const getCellValue = (ticket: Ticket, col: string): string => {
    switch (col) {
      case "id":
        return ticket.id.slice(0, 6).toUpperCase();
      case "title":
        return ticket.title;
      case "status":
        return ticket.status;
      case "priority":
        return ticket.priority;
      case "issue_type":
        return ticket.issue_type ?? "task";
      case "assignee":
        return ticket.assignee?.name ?? "";
      case "story_points":
        return ticket.story_points?.toString() ?? "";
      case "due_date":
        return ticket.due_date ?? "";
      case "updated_at":
        return new Date(ticket.updated_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      default:
        return "";
    }
  };

  const totalWidth = COLUMN_DEFS.reduce((sum, c) => sum + (widths[c.key] ?? c.defaultWidth), 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-content-primary">Spreadsheet</h3>
      <div className="border border-border-subtle rounded-md overflow-hidden">
        {/* Header */}
        <div
          className="flex bg-surface-secondary border-b border-border-subtle"
          style={{ minWidth: totalWidth }}
        >
          {COLUMN_DEFS.map((col) => (
            <div
              key={col.key}
              className="relative text-[10px] font-medium text-content-muted uppercase px-2 py-1.5 border-r border-border-subtle flex-shrink-0 hover:bg-hover/50 transition-colors duration-150 select-none"
              style={{ width: widths[col.key] ?? col.defaultWidth }}
            >
              {col.label}
              <ColumnResizeHandle
                columnKey={col.key}
                minWidth={col.minWidth}
                currentWidth={widths[col.key] ?? col.defaultWidth}
                onResize={resizeColumn}
              />
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              minWidth: totalWidth,
            }}
          >
            {virtualizer.getVirtualItems().map((vItem) => {
              const item = virtualRows[vItem.index];

              if (item.type === "header") {
                return (
                  <div
                    key={`header-${vItem.index}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: HEADER_HEIGHT,
                      transform: `translateY(${vItem.start}px)`,
                    }}
                    className="flex items-center px-3 bg-surface-secondary border-b border-border-subtle"
                  >
                    <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const ticket = item.ticket;
              return (
                <div
                  key={ticket.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: ROW_HEIGHT,
                    transform: `translateY(${vItem.start}px)`,
                  }}
                  className="flex items-center border-b border-border-subtle hover:bg-hover active:bg-hover/80 transition-colors"
                >
                  {COLUMN_DEFS.map((col) => {
                    const isEditing =
                      editingCell?.ticketId === ticket.id &&
                      editingCell.column === col.key;
                    const value = getCellValue(ticket, col.key);

                    return (
                      <div
                        key={col.key}
                        className="px-2 border-r border-border-subtle flex-shrink-0 h-full flex items-center"
                        style={{ width: widths[col.key] ?? col.defaultWidth }}
                      >
                        {isEditing ? (
                          col.key === "status" ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary cursor-pointer transition-colors"
                            >
                              {workflow.statuses.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          ) : col.key === "priority" ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary cursor-pointer transition-colors"
                            >
                              {TICKET_PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          ) : col.key === "issue_type" ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary cursor-pointer transition-colors"
                            >
                              {ISSUE_TYPES.map((it) => (
                                <option key={it.value} value={it.value}>
                                  {it.label}
                                </option>
                              ))}
                            </select>
                          ) : col.key === "assignee" ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary cursor-pointer transition-colors"
                            >
                              <option value="">Unassigned</option>
                              {members?.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          ) : col.key === "due_date" ? (
                            <input
                              type="date"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") cancelEdit();
                                if (e.key === "Enter") commitEdit();
                              }}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            />
                          ) : (
                            <input
                              type={
                                col.key === "story_points" ? "number" : "text"
                              }
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") cancelEdit();
                                if (e.key === "Enter") commitEdit();
                              }}
                              autoFocus
                              className="w-full text-[11px] bg-transparent border-none outline-none text-content-primary"
                            />
                          )
                        ) : col.key === "assignee" ? (
                          <button
                            onClick={() => {
                              startEdit(ticket.id, col.key, ticket.assignee_id ?? "");
                            }}
                            className="w-full flex items-center gap-1.5 text-[11px] text-content-primary cursor-text hover:bg-surface-secondary rounded px-0.5 truncate"
                          >
                            {ticket.assignees && ticket.assignees.length > 0 ? (
                              <AvatarStack assignees={ticket.assignees.map((a) => a.user).filter(Boolean)} max={2} />
                            ) : ticket.assignee ? (
                              <AvatarStack assignees={[ticket.assignee]} max={1} />
                            ) : (
                              <span className="text-content-muted">{"\u00A0"}</span>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (col.editable) {
                                startEdit(ticket.id, col.key, value);
                              } else if (col.key === "id") {
                                onTicketClick?.(ticket.id);
                              }
                            }}
                            className={`w-full text-left text-[11px] truncate ${
                              col.key === "id"
                                ? "font-mono text-content-muted cursor-pointer hover:text-accent"
                                : col.editable
                                  ? "text-content-primary cursor-text hover:bg-surface-secondary rounded px-0.5"
                                  : "text-content-muted cursor-default"
                            }`}
                          >
                            {value || "\u00A0"}
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
            {tickets.length} issue{tickets.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
