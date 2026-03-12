"use client";

import React, { useState, ReactNode, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface GridWidget {
  id: string;
  order: number;
  colStart: number;
  colSpan: number;
}

export interface WidgetGridProps {
  children: ReactNode;
  isDragging?: boolean;
  onDragEnd?: (widgets: GridWidget[]) => void;
}

interface SortableWidgetWrapperProps {
  id: string;
  children: ReactNode;
}

function SortableWidgetWrapper({ id, children }: SortableWidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function WidgetGrid({
  children,
  isDragging: _isDragging,
  onDragEnd,
}: WidgetGridProps) {
  const [widgets, setWidgets] = useState<GridWidget[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Extract widget IDs from children
  useEffect(() => {
    const widgetList: GridWidget[] = [];
    React.Children.forEach(children, (child, index) => {
      if (React.isValidElement(child)) {
        const id = child.key || `widget-${index}`;
        widgetList.push({
          id: String(id),
          order: index,
          colStart: 1,
          colSpan: isMobile ? 1 : isTablet ? 6 : 12,
        });
      }
    });
    setWidgets(widgetList);
  }, [children, isMobile, isTablet]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = [...widgets];
        const [movedWidget] = newWidgets.splice(oldIndex, 1);
        newWidgets.splice(newIndex, 0, movedWidget);

        // Update order
        newWidgets.forEach((w, i) => {
          w.order = i;
        });

        setWidgets(newWidgets);
        onDragEnd?.(newWidgets);
      }
    }
  };

  const columns = isMobile ? 1 : isTablet ? 6 : 12;

  const widgetIds = widgets.map((w) => w.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`
          grid gap-4 w-full
          ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-6" : "grid-cols-12"}
          transition-all duration-300
        `}
      >
        <SortableContext
          items={widgetIds}
          strategy={verticalListSortingStrategy}
        >
          {React.Children.map(children, (child, index) => {
            const widget = widgets[index];
            if (!widget) return null;

            return (
              <div
                key={widget.id}
                className={`
                  transition-all duration-200
                  ${
                    isMobile
                      ? "col-span-1"
                      : isTablet
                        ? `col-span-${widget.colSpan}`
                        : `col-span-${widget.colSpan}`
                  }
                `}
              >
                <SortableWidgetWrapper id={widget.id}>
                  {child}
                </SortableWidgetWrapper>
              </div>
            );
          })}
        </SortableContext>
      </div>
    </DndContext>
  );
}
