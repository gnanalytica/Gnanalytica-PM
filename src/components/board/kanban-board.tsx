"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { LayoutGroup } from "motion/react";
import { useReorderTicket, useProjectTickets } from "@/lib/hooks/use-tickets";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { useMembers } from "@/lib/hooks/use-members";
import { useProjectMilestones } from "@/lib/hooks/use-milestones";
import { KanbanColumn } from "./kanban-column";
import { TicketCard } from "./ticket-card";
import type { Ticket, StatusCategory, ViewFilters, GroupByKey } from "@/types";
import {
  STATUS_CATEGORIES,
  TICKET_PRIORITIES,
  ISSUE_TYPES,
  STATUS_EMOJI,
  PRIORITY_EMOJI,
  ISSUE_TYPE_EMOJI,
} from "@/types";

type ColumnDef = {
  key: string;
  title: string;
  tickets: Ticket[];
  emoji?: string;
};

const STATUS_COLUMNS: { id: StatusCategory; title: string }[] =
  STATUS_CATEGORIES.map((c) => ({
    id: c.value,
    title: c.label,
  }));

const POSITION_GAP = 1000;

function calculatePosition(
  columnTickets: Ticket[],
  targetIndex: number,
): number {
  if (columnTickets.length === 0) return POSITION_GAP;

  if (targetIndex <= 0) {
    return columnTickets[0].position - POSITION_GAP;
  }

  if (targetIndex >= columnTickets.length) {
    return columnTickets[columnTickets.length - 1].position + POSITION_GAP;
  }

  const prev = columnTickets[targetIndex - 1].position;
  const next = columnTickets[targetIndex].position;
  return Math.round((prev + next) / 2);
}

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

export function KanbanBoard({
  projectId,
  onTicketClick,
  filterTicketIds,
  filters,
  groupBy,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  /** When set, only show tickets whose ids are in this set. */
  filterTicketIds?: Set<string> | null;
  filters?: ViewFilters;
  groupBy?: GroupByKey;
}) {
  const allTickets = useProjectTickets(projectId);
  const filteredByIds = filterTicketIds
    ? allTickets.filter((t) => filterTicketIds.has(t.id))
    : allTickets;
  const tickets = applyFilters(filteredByIds, filters);
  const reorderTicket = useReorderTicket();
  const workflow = useProjectWorkflow(projectId);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const { data: members } = useMembers();
  const milestones = useProjectMilestones(projectId);

  const isStatusGrouping =
    !groupBy || groupBy === "status" || groupBy === "none";

  // Status-based columns (used for drag-and-drop)
  const statusColumns = useMemo<Record<StatusCategory, Ticket[]>>(() => {
    const sorted = [...tickets].sort((a, b) => a.position - b.position);
    const grouped: Record<StatusCategory, Ticket[]> = {
      backlog: [],
      unstarted: [],
      started: [],
      completed: [],
      canceled: [],
    };
    for (const t of sorted) {
      const cat = t.status_category ?? workflow.getStatusCategory(t.status);
      grouped[cat].push(t);
    }
    return grouped;
  }, [tickets, workflow]);

  // Dynamic columns based on groupBy
  const dynamicColumns = useMemo<ColumnDef[]>(() => {
    if (isStatusGrouping) {
      return STATUS_COLUMNS.map((col) => ({
        key: col.id,
        title: col.title,
        tickets: statusColumns[col.id],
        emoji: undefined,
      }));
    }

    const sorted = [...tickets].sort((a, b) => a.position - b.position);

    if (groupBy === "priority") {
      return TICKET_PRIORITIES.map((p) => ({
        key: p.value,
        title: p.label,
        tickets: sorted.filter((t) => t.priority === p.value),
        emoji: PRIORITY_EMOJI[p.value],
      }));
    }

    if (groupBy === "assignee") {
      const memberList = members ?? [];
      const cols: ColumnDef[] = memberList.map((m) => ({
        key: m.id,
        title: m.name,
        tickets: sorted.filter((t) => t.assignee_id === m.id),
        emoji: undefined,
      }));
      cols.push({
        key: "__unassigned__",
        title: "Unassigned",
        tickets: sorted.filter((t) => !t.assignee_id),
        emoji: undefined,
      });
      return cols;
    }

    if (groupBy === "issue_type") {
      return ISSUE_TYPES.map((it) => ({
        key: it.value,
        title: it.label,
        tickets: sorted.filter((t) => t.issue_type === it.value),
        emoji: ISSUE_TYPE_EMOJI[it.value],
      }));
    }

    if (groupBy === "milestone") {
      const cols: ColumnDef[] = milestones.map((m) => ({
        key: m.id,
        title: m.name,
        tickets: sorted.filter((t) => t.milestone_id === m.id),
        emoji: undefined,
      }));
      cols.push({
        key: "__no_milestone__",
        title: "No milestone",
        tickets: sorted.filter((t) => !t.milestone_id),
        emoji: undefined,
      });
      return cols;
    }

    // Fallback: status grouping
    return STATUS_COLUMNS.map((col) => ({
      key: col.id,
      title: col.title,
      tickets: statusColumns[col.id],
      emoji: undefined,
    }));
  }, [
    isStatusGrouping,
    groupBy,
    tickets,
    statusColumns,
    members,
    milestones,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    if (!isStatusGrouping) return; // No drag between columns for non-status groupings

    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    // Determine target column: over.id could be a category column id or a ticket id
    let targetCategory: StatusCategory | undefined;
    let overTicketId: string | undefined;

    if (STATUS_COLUMNS.some((c) => c.id === over.id)) {
      targetCategory = over.id as StatusCategory;
    } else {
      overTicketId = over.id as string;
      // Dropped over a ticket — find which category column it belongs to
      for (const col of STATUS_COLUMNS) {
        if (statusColumns[col.id].some((t) => t.id === over.id)) {
          targetCategory = col.id;
          break;
        }
      }
    }

    if (!targetCategory) return;

    const currentCategory =
      currentTicket.status_category ??
      workflow.getStatusCategory(currentTicket.status);
    const isSameColumn = currentCategory === targetCategory;
    const targetColumn = statusColumns[targetCategory];

    if (isSameColumn) {
      // Same-column reorder
      if (!overTicketId || ticketId === overTicketId) return;

      const oldIndex = targetColumn.findIndex((t) => t.id === ticketId);
      const newIndex = targetColumn.findIndex((t) => t.id === overTicketId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(targetColumn, oldIndex, newIndex);
      const newPosition = calculatePosition(
        reordered.filter((t) => t.id !== ticketId),
        newIndex,
      );

      reorderTicket.mutate({
        id: ticketId,
        project_id: projectId,
        position: newPosition,
      });
    } else {
      // Cross-column move — assign the category's default status
      let targetIndex: number;
      if (overTicketId) {
        targetIndex = targetColumn.findIndex((t) => t.id === overTicketId);
        if (targetIndex === -1) targetIndex = targetColumn.length;
      } else {
        // Dropped on column itself — append to end
        targetIndex = targetColumn.length;
      }

      const newPosition = calculatePosition(targetColumn, targetIndex);
      const newStatus = workflow.getDefaultStatusForCategory(targetCategory);

      reorderTicket.mutate({
        id: ticketId,
        project_id: projectId,
        position: newPosition,
        status: newStatus,
        status_category: targetCategory,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <LayoutGroup>
        <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:snap-none">
          {dynamicColumns.map((col) => (
            <KanbanColumn
              key={col.key}
              id={col.key}
              title={col.title}
              tickets={col.tickets}
              projectId={projectId}
              defaultStatus={
                isStatusGrouping
                  ? workflow.getDefaultStatusForCategory(
                      col.key as StatusCategory,
                    )
                  : undefined
              }
              onTicketClick={onTicketClick}
              isDragging={activeTicket !== null}
              emoji={col.emoji}
              readOnly={!isStatusGrouping}
            />
          ))}
        </div>
      </LayoutGroup>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
        {activeTicket ? <TicketCard ticket={activeTicket} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
