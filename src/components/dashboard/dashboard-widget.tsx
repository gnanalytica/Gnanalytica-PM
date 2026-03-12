"use client";

import React, { useRef, useEffect, useState } from "react";

export interface DashboardWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  size: "small" | "medium" | "large";
  children: React.ReactNode;
  isDragging?: boolean;
  isDragActive?: boolean;
  onRemove?: () => void;
  onResize?: (height: number) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetDimensions {
  width: number;
  height: number;
  minHeight: number;
  maxHeight: number;
}

export const WIDGET_DIMENSIONS: Record<WidgetSize, WidgetDimensions> = {
  small: { width: 3, height: 240, minHeight: 240, maxHeight: 600 },
  medium: { width: 6, height: 360, minHeight: 320, maxHeight: 600 },
  large: { width: 12, height: 480, minHeight: 360, maxHeight: 600 },
};

const RESIZE_INCREMENT = 120;

export function DashboardWidget({
  id,
  title,
  icon,
  size,
  children,
  isDragging = false,
  isDragActive = false,
  onRemove,
  onResize,
  isLoading = false,
  isEmpty = false,
}: DashboardWidgetProps) {
  const [height, setHeight] = useState(WIDGET_DIMENSIONS[size].height);
  const [isResizing, setIsResizing] = useState(false);
  const [showResizeTooltip, setShowResizeTooltip] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dimensions = WIDGET_DIMENSIONS[size];

  useEffect(() => {
    setHeight(dimensions.height);
  }, [size, dimensions.height]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = Math.max(
        dimensions.minHeight,
        Math.min(
          dimensions.maxHeight,
          e.clientY - rect.top + 16 // Include padding
        )
      );

      // Snap to grid (120px increments)
      const snappedHeight =
        Math.round(newHeight / RESIZE_INCREMENT) * RESIZE_INCREMENT;
      setHeight(snappedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResize?.(height);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, height, dimensions, onResize]);

  const handleResizeStart = () => {
    setIsResizing(true);
    setShowResizeTooltip(true);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setShowResizeTooltip(false);
    onResize?.(height);
  };

  return (
    <div
      ref={containerRef}
      data-widget-id={id}
      style={{ height: `${height}px` }}
      className={`
        relative rounded-lg border transition-all duration-150
        ${
          isDragging
            ? "opacity-70 shadow-lg z-50"
            : "border-border-subtle shadow-sm"
        }
        ${isDragActive ? "border-accent border-dashed" : ""}
        bg-surface-primary
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        {/* Drag handle + Title */}
        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <span className="text-content-muted opacity-50 hover:opacity-100 transition-opacity text-xs">⋮⋮</span>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <h3 className="text-sm font-semibold text-content-primary">{title}</h3>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-content-muted hover:text-content-primary hover:bg-hover rounded transition-colors"
            aria-label="Widget settings"
            title="Settings"
          >
            ⚙️
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 text-content-muted hover:text-error hover:bg-error-soft rounded transition-colors"
              aria-label="Remove widget"
              title="Remove"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Settings Menu */}
      {showSettings && (
        <div className="absolute top-12 right-4 z-10 bg-surface-primary border border-border-subtle rounded-lg shadow-lg p-2 min-w-48">
          <button className="w-full text-left px-3 py-2 text-sm text-content-primary hover:bg-hover rounded transition-colors">
            Customize
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-content-primary hover:bg-hover rounded transition-colors">
            Refresh
          </button>
          {onRemove && (
            <button
              onClick={() => {
                setShowSettings(false);
                onRemove();
              }}
              className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-soft rounded transition-colors"
            >
              Remove Widget
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin-ease w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-content-muted">No data available</p>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleResizeStart}
        onMouseUp={handleResizeEnd}
        onMouseEnter={() => setShowResizeTooltip(true)}
        onMouseLeave={() => setShowResizeTooltip(false)}
        className="absolute bottom-0 right-0 w-3 h-3 bg-accent cursor-se-resize hover:w-4 hover:h-4 rounded-tl transition-all opacity-0 hover:opacity-100"
        title={`${height}px`}
      />

      {/* Resize Tooltip */}
      {showResizeTooltip && (
        <div className="absolute bottom-4 right-4 bg-accent text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
          {height}px
        </div>
      )}
    </div>
  );
}
