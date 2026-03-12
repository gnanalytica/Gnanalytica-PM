"use client";

import { useState, useEffect, useCallback } from "react";

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  icon?: string;
  size: "small" | "medium" | "large";
  order: number;
  customHeight?: number;
  isVisible: boolean;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  widgets: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = "dashboard-layout";

export function useDashboardLayout(layoutId?: string) {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load layout from storage or API
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (layoutId) {
          // In a real app, this would fetch from API
          // For now, we'll use localStorage
          const stored = localStorage.getItem(`${STORAGE_KEY}-${layoutId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setLayout(parsed);
          } else {
            setLayout(null);
          }
        } else {
          // Load default layout
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setLayout(parsed);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load layout";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [layoutId]);

  // Update layout
  const updateLayout = useCallback(
    async (widgets: WidgetConfig[]) => {
      try {
        setError(null);

        const updated: DashboardLayout = {
          id: layout?.id || "default",
          userId: layout?.userId || "current-user",
          widgets,
          createdAt: layout?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        setLayout(updated);

        // Save to localStorage
        const key = layoutId
          ? `${STORAGE_KEY}-${layoutId}`
          : STORAGE_KEY;
        localStorage.setItem(key, JSON.stringify(updated));

        // In a real app, this would POST to API
        // await api.updateDashboardLayout(layoutId, updated);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update layout";
        setError(message);
        throw err;
      }
    },
    [layout, layoutId]
  );

  // Reorder widgets
  const reorderWidgets = useCallback(
    (widgets: WidgetConfig[]) => {
      if (!layout) return;

      const reordered = widgets.map((w, index) => ({
        ...w,
        order: index,
      }));

      updateLayout(reordered);
    },
    [layout, updateLayout]
  );

  // Show/hide widget
  const toggleWidgetVisibility = useCallback(
    (widgetId: string) => {
      if (!layout) return;

      const updated = layout.widgets.map((w) =>
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      );

      updateLayout(updated);
    },
    [layout, updateLayout]
  );

  // Remove widget
  const removeWidget = useCallback(
    (widgetId: string) => {
      if (!layout) return;

      const filtered = layout.widgets.filter((w) => w.id !== widgetId);
      updateLayout(filtered);
    },
    [layout, updateLayout]
  );

  // Add widget
  const addWidget = useCallback(
    (widget: WidgetConfig) => {
      if (!layout) return;

      const maxOrder = Math.max(...layout.widgets.map((w) => w.order), -1);
      const newWidget = {
        ...widget,
        order: maxOrder + 1,
      };

      updateLayout([...layout.widgets, newWidget]);
    },
    [layout, updateLayout]
  );

  // Update widget
  const updateWidget = useCallback(
    (widgetId: string, updates: Partial<WidgetConfig>) => {
      if (!layout) return;

      const updated = layout.widgets.map((w) =>
        w.id === widgetId ? { ...w, ...updates } : w
      );

      updateLayout(updated);
    },
    [layout, updateLayout]
  );

  // Reset to default
  const resetLayout = useCallback(() => {
    const key = layoutId ? `${STORAGE_KEY}-${layoutId}` : STORAGE_KEY;
    localStorage.removeItem(key);
    setLayout(null);
  }, [layoutId]);

  return {
    layout,
    isLoading,
    error,
    updateLayout,
    reorderWidgets,
    toggleWidgetVisibility,
    removeWidget,
    addWidget,
    updateWidget,
    resetLayout,
  };
}
