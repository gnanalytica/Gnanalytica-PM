"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useProjectTickets, useUpdateTicket } from "@/lib/hooks/use-tickets";
import type { Ticket, ViewFilters } from "@/types";
import { AvatarStack } from "@/components/tickets/assignee-picker";

type ZoomLevel = "day" | "week" | "month";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#6b7280",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return addDays(startOfDay(d), -day);
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase();
}

type GanttTicket = Ticket & { startCol: number; spanCols: number };

type DragState = {
  ticketId: string;
  mode: "move" | "resize-left" | "resize-right";
  origStartCol: number;
  origSpanCols: number;
  startX: number;
  currentDeltaCols: number;
};

function applyFilters(tickets: Ticket[], filters?: ViewFilters): Ticket[] {
  if (!filters) return tickets;
  let result = tickets;

  if (filters.status && filters.status.length > 0) {
    const statusSet = new Set(filters.status);
    result = result.filter((t) => statusSet.has(t.status));
  }
  if (filters.priority && filters.priority.length > 0) {
    const prioritySet = new Set(filters.priority);
    result = result.filter((t) => t.priority && prioritySet.has(t.priority));
  }
  if (filters.assignee_ids && filters.assignee_ids.length > 0) {
    const assigneeSet = new Set(filters.assignee_ids);
    result = result.filter(
      (t) => t.assignee_id && assigneeSet.has(t.assignee_id),
    );
  }
  if (filters.issue_type && filters.issue_type.length > 0) {
    const typeSet = new Set(filters.issue_type);
    result = result.filter(
      (t) => t.issue_type && typeSet.has(t.issue_type),
    );
  }

  return result;
}

export function GanttView({
  projectId,
  onTicketClick,
  filters,
  filterTicketIds,
  groupBy: groupByProp,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  filters?: ViewFilters;
  /** When set, only show tickets whose ids are in this set. */
  filterTicketIds?: Set<string> | null;
  /** If provided, overrides the internal groupBy state. */
  groupBy?: "milestone" | "status";
}) {
  const allTickets = useProjectTickets(projectId);
  const updateTicket = useUpdateTicket();
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [internalGroupBy, setInternalGroupBy] = useState<"milestone" | "status">("status");
  const groupBy = groupByProp ?? internalGroupBy;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Apply ID filter, then view filters
  const tickets = useMemo(() => {
    const byIds = filterTicketIds
      ? allTickets.filter((t) => filterTicketIds.has(t.id))
      : allTickets;
    return applyFilters(byIds, filters);
  }, [allTickets, filterTicketIds, filters]);

  // Filter tickets with dates
  const datedTickets = useMemo(
    () => tickets.filter((t) => t.start_date || t.due_date),
    [tickets],
  );

  // Compute timeline range
  const { timelineStart, timelineEnd, totalDays, columns } = useMemo(() => {
    if (datedTickets.length === 0) {
      const today = startOfDay(new Date());
      const start = addDays(today, -7);
      const end = addDays(today, 28);
      return {
        timelineStart: start,
        timelineEnd: end,
        totalDays: 35,
        columns: generateColumns(start, end, zoom),
      };
    }

    let minDate = Infinity;
    let maxDate = -Infinity;
    for (const t of datedTickets) {
      const s = t.start_date
        ? new Date(t.start_date + "T00:00:00").getTime()
        : null;
      const e = t.due_date
        ? new Date(t.due_date + "T00:00:00").getTime()
        : null;
      if (s && s < minDate) minDate = s;
      if (e && e > maxDate) maxDate = e;
      if (s && !e && s > maxDate) maxDate = s;
      if (e && !s && e < minDate) minDate = e;
    }

    const start = addDays(startOfDay(new Date(minDate)), -7);
    const end = addDays(startOfDay(new Date(maxDate)), 14);
    const days = diffDays(start, end);
    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: days,
      columns: generateColumns(start, end, zoom),
    };
  }, [datedTickets, zoom]);

  // Column width based on zoom
  const colWidth = zoom === "day" ? 40 : zoom === "week" ? 20 : 8;

  // Group tickets
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; tickets: GanttTicket[] }>();

    for (const t of datedTickets) {
      const key =
        groupBy === "milestone"
          ? (t.milestone?.name ?? "No Milestone")
          : t.status_category;
      if (!map.has(key)) map.set(key, { label: key, tickets: [] });

      const startDate = t.start_date
        ? new Date(t.start_date + "T00:00:00")
        : t.due_date
          ? new Date(t.due_date + "T00:00:00")
          : new Date();
      const endDate = t.due_date
        ? new Date(t.due_date + "T00:00:00")
        : startDate;

      const startCol = Math.max(0, diffDays(timelineStart, startDate));
      const spanCols = Math.max(1, diffDays(startDate, endDate) + 1);

      map.get(key)!.tickets.push({ ...t, startCol, spanCols });
    }

    return Array.from(map.values());
  }, [datedTickets, groupBy, timelineStart]);

  // Today marker position
  const todayCol = diffDays(timelineStart, startOfDay(new Date()));

  const undatedTickets = tickets.filter((t) => !t.start_date && !t.due_date);

  // --- Drag logic ---

  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      ticket: GanttTicket,
      mode: DragState["mode"],
    ) => {
      e.stopPropagation();
      e.preventDefault();
      setDrag({
        ticketId: ticket.id,
        mode,
        origStartCol: ticket.startCol,
        origSpanCols: ticket.spanCols,
        startX: e.clientX,
        currentDeltaCols: 0,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drag) return;
      const deltaPx = e.clientX - drag.startX;
      const deltaCols = Math.round(deltaPx / colWidth);
      if (deltaCols !== drag.currentDeltaCols) {
        setDrag((prev) => (prev ? { ...prev, currentDeltaCols: deltaCols } : null));
      }
    },
    [drag, colWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (!drag || drag.currentDeltaCols === 0) {
      setDrag(null);
      return;
    }

    const ticket = datedTickets.find((t) => t.id === drag.ticketId);
    if (!ticket) {
      setDrag(null);
      return;
    }

    const origStart = ticket.start_date
      ? new Date(ticket.start_date + "T00:00:00")
      : ticket.due_date
        ? new Date(ticket.due_date + "T00:00:00")
        : new Date();
    const origEnd = ticket.due_date
      ? new Date(ticket.due_date + "T00:00:00")
      : origStart;

    let newStart: Date;
    let newEnd: Date;

    if (drag.mode === "move") {
      newStart = addDays(origStart, drag.currentDeltaCols);
      newEnd = addDays(origEnd, drag.currentDeltaCols);
    } else if (drag.mode === "resize-left") {
      newStart = addDays(origStart, drag.currentDeltaCols);
      newEnd = origEnd;
      // Don't allow start to go past end
      if (newStart > newEnd) newStart = newEnd;
    } else {
      // resize-right
      newStart = origStart;
      newEnd = addDays(origEnd, drag.currentDeltaCols);
      // Don't allow end to go before start
      if (newEnd < newStart) newEnd = newStart;
    }

    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      start_date: formatISO(newStart),
      due_date: formatISO(newEnd),
    });

    setDrag(null);
  }, [drag, datedTickets, updateTicket]);

  // Compute visual bar position during drag
  const getDraggedBar = useCallback(
    (ticket: GanttTicket) => {
      if (!drag || drag.ticketId !== ticket.id) {
        return { left: ticket.startCol * colWidth, width: Math.max(ticket.spanCols * colWidth, colWidth) };
      }

      let startCol = drag.origStartCol;
      let spanCols = drag.origSpanCols;

      if (drag.mode === "move") {
        startCol = drag.origStartCol + drag.currentDeltaCols;
      } else if (drag.mode === "resize-left") {
        const delta = Math.min(drag.currentDeltaCols, drag.origSpanCols - 1);
        startCol = drag.origStartCol + delta;
        spanCols = drag.origSpanCols - delta;
      } else {
        // resize-right
        spanCols = Math.max(1, drag.origSpanCols + drag.currentDeltaCols);
      }

      return {
        left: startCol * colWidth,
        width: Math.max(spanCols * colWidth, colWidth),
      };
    },
    [drag, colWidth],
  );

  return (
    <div
      className="h-full flex flex-col"
      onMouseMove={drag ? handleMouseMove : undefined}
      onMouseUp={drag ? handleMouseUp : undefined}
      onMouseLeave={drag ? handleMouseUp : undefined}
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-content-muted">Group by</span>
          <select
            value={groupBy}
            onChange={(e) =>
              setInternalGroupBy(e.target.value as "milestone" | "status")
            }
            className="text-[11px] border border-border-subtle rounded px-1.5 py-0.5 bg-surface-secondary text-content-primary cursor-pointer transition-colors outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          >
            <option value="status">Status</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>
        <div className="flex items-center bg-surface-secondary rounded-lg border border-border-subtle overflow-hidden p-0.5">
          {(["day", "week", "month"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`toggle-btn px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-150 active:scale-[0.96] ${
                zoom === z
                  ? "bg-surface-primary text-content-primary shadow-xs"
                  : "text-content-muted hover:text-content-secondary"
              }`}
            >
              {z[0].toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {datedTickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-content-muted mb-1">
              No tickets with dates
            </p>
            <p className="text-[12px] text-content-muted/60">
              Add start dates or due dates to your tickets to see them here.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 overflow-auto ${drag ? "select-none" : ""}`}
          ref={scrollRef}
        >
          <div style={{ minWidth: totalDays * colWidth + 200 }}>
            {/* Timeline header */}
            <div className="flex sticky top-0 z-10 bg-surface-primary border-b border-border-subtle">
              <div className="w-[200px] flex-shrink-0 px-3 py-1.5 text-[11px] font-medium text-content-muted border-r border-border-subtle">
                Ticket
              </div>
              <div className="flex-1 flex relative">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 text-center text-[9px] text-content-muted py-1.5 border-r border-border-subtle/50 ${
                      col.isToday ? "bg-accent/5" : ""
                    }`}
                    style={{ width: col.span * colWidth }}
                  >
                    {col.label}
                  </div>
                ))}
                {/* Today line */}
                {todayCol >= 0 && todayCol <= totalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                    style={{ left: todayCol * colWidth }}
                  />
                )}
              </div>
            </div>

            {/* Groups */}
            {groups.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                <div className="flex border-b border-border-subtle bg-surface-secondary/50">
                  <div className="w-[200px] flex-shrink-0 px-3 py-1 text-[11px] font-semibold text-content-muted uppercase tracking-wider border-r border-border-subtle">
                    {group.label}
                  </div>
                  <div className="flex-1" />
                </div>

                {/* Ticket rows */}
                {group.tickets.map((ticket) => {
                  const bar = getDraggedBar(ticket);
                  const isDragging = drag?.ticketId === ticket.id;
                  const barColor = PRIORITY_COLORS[ticket.priority] ?? "#6b7280";

                  return (
                    <div
                      key={ticket.id}
                      className={`flex border-b border-border-subtle/50 transition-colors duration-100 ${isDragging ? "bg-hover/60" : "hover:bg-hover"}`}
                    >
                      {/* Left label area — clicking opens ticket */}
                      <div
                        className="w-[200px] flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5 border-r border-border-subtle min-w-0 cursor-pointer active:bg-hover/80 transition-all duration-150"
                        onClick={() => onTicketClick?.(ticket.id)}
                      >
                        <span className="text-[9px] font-mono text-content-muted flex-shrink-0">
                          {shortId(ticket.id)}
                        </span>
                        <span className="text-[11px] text-content-primary truncate flex-1">
                          {ticket.title}
                        </span>
                        <div className="flex-shrink-0">
                          {ticket.assignees && ticket.assignees.length > 0 ? (
                            <AvatarStack assignees={ticket.assignees.map((a) => a.user).filter(Boolean)} max={2} />
                          ) : ticket.assignee ? (
                            <AvatarStack assignees={[ticket.assignee]} max={1} />
                          ) : null}
                        </div>
                      </div>

                      {/* Timeline bar area */}
                      <div className="flex-1 relative" style={{ height: 28 }}>
                        {/* Gantt bar */}
                        <div
                          className={`absolute top-1 h-5 rounded-sm flex items-center text-[9px] text-white font-medium truncate group transition-shadow duration-150 ${isDragging ? "shadow-lg opacity-90 z-10" : "hover:shadow-md"}`}
                          style={{
                            left: bar.left,
                            width: bar.width,
                            backgroundColor: barColor,
                            cursor: drag ? (drag.mode === "move" ? "grabbing" : "col-resize") : "grab",
                          }}
                          title={`${ticket.title}\n${ticket.start_date ?? "?"} → ${ticket.due_date ?? "?"}\nDrag to move · Drag edges to resize`}
                          onMouseDown={(e) => handleDragStart(e, ticket, "move")}
                        >
                          {/* Left resize handle */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-l-sm transition-colors duration-100"
                            onMouseDown={(e) => handleDragStart(e, ticket, "resize-left")}
                          />

                          {/* Bar label */}
                          <span className="px-1.5 truncate pointer-events-none select-none">
                            {bar.width > 60 ? ticket.title : ""}
                          </span>

                          {/* Right resize handle */}
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-r-sm transition-colors duration-100"
                            onMouseDown={(e) => handleDragStart(e, ticket, "resize-right")}
                          />
                        </div>

                        {/* Date tooltip during drag */}
                        {isDragging && drag && (
                          <DragTooltip
                            drag={drag}
                            ticket={ticket}
                            colWidth={colWidth}
                            timelineStart={timelineStart}
                          />
                        )}

                        {/* Today line in rows */}
                        {todayCol >= 0 && todayCol <= totalDays && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-red-500/30 pointer-events-none"
                            style={{ left: todayCol * colWidth }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Undated tickets summary */}
            {undatedTickets.length > 0 && (
              <div className="flex border-b border-border-subtle bg-surface-secondary/30">
                <div className="w-[200px] flex-shrink-0 px-3 py-1.5 border-r border-border-subtle">
                  <span className="text-[11px] text-content-muted">
                    {undatedTickets.length} tickets without dates
                  </span>
                </div>
                <div className="flex-1" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Tooltip shown above the bar during drag to preview the new dates
function DragTooltip({
  drag,
  ticket,
  colWidth,
  timelineStart,
}: {
  drag: DragState;
  ticket: GanttTicket;
  colWidth: number;
  timelineStart: Date;
}) {
  const origStart = ticket.start_date
    ? new Date(ticket.start_date + "T00:00:00")
    : ticket.due_date
      ? new Date(ticket.due_date + "T00:00:00")
      : new Date();
  const origEnd = ticket.due_date
    ? new Date(ticket.due_date + "T00:00:00")
    : origStart;

  let newStart: Date;
  let newEnd: Date;

  if (drag.mode === "move") {
    newStart = addDays(origStart, drag.currentDeltaCols);
    newEnd = addDays(origEnd, drag.currentDeltaCols);
  } else if (drag.mode === "resize-left") {
    newStart = addDays(origStart, drag.currentDeltaCols);
    newEnd = origEnd;
    if (newStart > newEnd) newStart = newEnd;
  } else {
    newStart = origStart;
    newEnd = addDays(origEnd, drag.currentDeltaCols);
    if (newEnd < newStart) newEnd = newStart;
  }

  let startCol = drag.origStartCol;
  let spanCols = drag.origSpanCols;

  if (drag.mode === "move") {
    startCol = drag.origStartCol + drag.currentDeltaCols;
  } else if (drag.mode === "resize-left") {
    const delta = Math.min(drag.currentDeltaCols, drag.origSpanCols - 1);
    startCol = drag.origStartCol + delta;
    spanCols = drag.origSpanCols - delta;
  } else {
    spanCols = Math.max(1, drag.origSpanCols + drag.currentDeltaCols);
  }

  const barCenter = startCol * colWidth + (spanCols * colWidth) / 2;
  const days = diffDays(newStart, newEnd) + 1;

  return (
    <div
      className="absolute -top-7 z-30 pointer-events-none"
      style={{ left: barCenter, transform: "translateX(-50%)" }}
    >
      <div className="bg-surface-tertiary border border-border-subtle rounded px-2 py-0.5 shadow-lg whitespace-nowrap text-[10px] font-medium text-content-primary">
        {formatDateShort(newStart)} → {formatDateShort(newEnd)}
        <span className="text-content-muted ml-1">({days}d)</span>
      </div>
    </div>
  );
}

type Column = { label: string; span: number; isToday: boolean };

function generateColumns(start: Date, end: Date, zoom: ZoomLevel): Column[] {
  const cols: Column[] = [];
  const today = startOfDay(new Date());

  if (zoom === "day") {
    let d = new Date(start);
    while (d <= end) {
      cols.push({
        label: formatDateShort(d),
        span: 1,
        isToday: d.getTime() === today.getTime(),
      });
      d = addDays(d, 1);
    }
  } else if (zoom === "week") {
    let d = startOfWeek(start);
    while (d <= end) {
      const weekEnd = addDays(d, 6);
      const days = Math.min(
        diffDays(d < start ? start : d, weekEnd > end ? end : weekEnd) + 1,
        7,
      );
      cols.push({
        label: formatDateShort(d),
        span: days,
        isToday: today >= d && today <= weekEnd,
      });
      d = addDays(d, 7);
    }
  } else {
    // month
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthStart = d < start ? start : d;
      const effEnd = monthEnd > end ? end : monthEnd;
      const days = diffDays(monthStart, effEnd) + 1;
      cols.push({
        label: d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        span: days,
        isToday:
          today.getMonth() === d.getMonth() &&
          today.getFullYear() === d.getFullYear(),
      });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }

  return cols;
}
