"use client";

import { useState, useMemo } from "react";
import { useProjectTickets } from "@/lib/hooks/use-tickets";
import type { Ticket, ViewFilters } from "@/types";
import { AvatarStack, avatarColor } from "@/components/tickets/assignee-picker";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#c27070",
  high: "#c48a5a",
  medium: "#c9a04e",
  low: "#8b919a",
};

export function CalendarView({
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
  const rawTickets = useProjectTickets(projectId);
  const allTickets = useMemo(() => {
    let tickets = filterTicketIds
      ? rawTickets.filter((t) => filterTicketIds.has(t.id))
      : rawTickets;
    if (filters?.status?.length) {
      tickets = tickets.filter((t) => filters.status!.includes(t.status));
    }
    if (filters?.priority?.length) {
      tickets = tickets.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters?.assignee_ids?.length) {
      tickets = tickets.filter((t) =>
        t.assignees?.some((a) => filters.assignee_ids!.includes(a.user.id)),
      );
    }
    return tickets;
  }, [rawTickets, filterTicketIds, filters]);
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Group tickets by due_date
  const ticketsByDate = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    for (const t of allTickets) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [allTickets]);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to fill remaining row
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="px-2 py-0.5 text-[11px] text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]"
          >
            &larr;
          </button>
          <span className="text-[12px] font-medium text-content-primary w-32 text-center">
            {viewDate.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={nextMonth}
            className="px-2 py-0.5 text-[11px] text-content-muted hover:text-content-secondary transition-all duration-150 active:scale-[0.96]"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="border border-border-subtle rounded-md overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-surface-secondary border-b border-border-subtle">
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-content-muted py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar body */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dateKey = day ? formatDateKey(year, month, day) : "";
            const dayTickets = day ? (ticketsByDate[dateKey] ?? []) : [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-border-subtle p-1 transition-colors duration-150 ${
                  day
                    ? dayTickets.length > 0
                      ? "bg-surface-primary hover:bg-hover/50"
                      : "bg-surface-primary"
                    : "bg-surface-secondary"
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`text-[11px] font-medium ${
                        isToday
                          ? "bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center"
                          : "text-content-muted"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayTickets.slice(0, 3).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onTicketClick?.(t.id)}
                          className="flex items-center gap-1 w-full text-left text-[10px] px-1 py-0.5 rounded hover:bg-hover transition-all duration-150 active:scale-[0.96]"
                          style={{
                            borderLeft: `2px solid ${PRIORITY_COLOR[t.priority] ?? "#8b919a"}`,
                          }}
                        >
                          <span className="truncate flex-1">{t.title}</span>
                          {(t.assignees?.length ?? 0) > 0 && (
                            <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full ${avatarColor(t.assignees?.[0]?.user?.id ?? t.id)} flex items-center justify-center text-[7px] font-semibold text-white drop-shadow-sm`} title={t.assignees?.map((a) => a.user?.name).join(", ")}>
                              {(t.assignees?.[0]?.user?.name ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </button>
                      ))}
                      {dayTickets.length > 3 && (
                        <span className="text-[9px] text-content-muted px-1">
                          +{dayTickets.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
