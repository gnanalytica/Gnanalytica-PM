'use client';

import { useMemo, useState } from 'react';
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
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { LayoutGroup } from 'framer-motion';
import { useReorderTicket, useProjectTickets } from '@/lib/hooks/use-tickets';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { KanbanColumn } from './kanban-column';
import { TicketCard } from './ticket-card';
import type { Ticket, StatusCategory } from '@/types';
import { STATUS_CATEGORIES } from '@/types';

const COLUMNS: { id: StatusCategory; title: string }[] = STATUS_CATEGORIES.map((c) => ({
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

export function KanbanBoard({
  projectId,
  onTicketClick,
  filterTicketIds,
}: {
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
  /** When set, only show tickets whose ids are in this set. */
  filterTicketIds?: Set<string> | null;
}) {
  const allTickets = useProjectTickets(projectId);
  const tickets = filterTicketIds
    ? allTickets.filter((t) => filterTicketIds.has(t.id))
    : allTickets;
  const reorderTicket = useReorderTicket();
  const workflow = useProjectWorkflow(projectId);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const columns = useMemo<Record<StatusCategory, Ticket[]>>(() => {
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
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    // Determine target column: over.id could be a category column id or a ticket id
    let targetCategory: StatusCategory | undefined;
    let overTicketId: string | undefined;

    if (COLUMNS.some((c) => c.id === over.id)) {
      targetCategory = over.id as StatusCategory;
    } else {
      overTicketId = over.id as string;
      // Dropped over a ticket — find which category column it belongs to
      for (const col of COLUMNS) {
        if (columns[col.id].some((t) => t.id === over.id)) {
          targetCategory = col.id;
          break;
        }
      }
    }

    if (!targetCategory) return;

    const currentCategory = currentTicket.status_category ?? workflow.getStatusCategory(currentTicket.status);
    const isSameColumn = currentCategory === targetCategory;
    const targetColumn = columns[targetCategory];

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
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tickets={columns[col.id]}
              projectId={projectId}
              defaultStatus={workflow.getDefaultStatusForCategory(col.id)}
              onTicketClick={onTicketClick}
              isDragging={activeTicket !== null}
            />
          ))}
        </div>
      </LayoutGroup>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
        {activeTicket ? <TicketCard ticket={activeTicket} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
