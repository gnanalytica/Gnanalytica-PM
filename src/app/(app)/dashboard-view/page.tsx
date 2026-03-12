"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TasksByStatusWidget } from "@/components/dashboard/widgets/tasks-by-status";
import { UpcomingDeadlinesWidget } from "@/components/dashboard/widgets/upcoming-deadlines";
import { TeamWorkloadWidget } from "@/components/dashboard/widgets/team-workload";
import { SprintVelocityWidget } from "@/components/dashboard/widgets/sprint-velocity";
import { ProjectOverviewWidget } from "@/components/dashboard/widgets/project-overview";
import { MyTasksWidget } from "@/components/dashboard/widgets/my-tasks";
import { DashboardWidget as DashboardWidgetComponent } from "@/components/dashboard/dashboard-widget";
import { WidgetGrid } from "@/components/dashboard/widget-grid-layout";
import { DashboardSettings } from "@/components/dashboard/dashboard-settings";
import { useDashboardLayout } from "@/lib/hooks/use-dashboard-layout";
import {
  DashboardWidget,
  DashboardStats,
  WIDGET_METADATA,
  DEFAULT_LAYOUTS_BY_ROLE,
} from "@/lib/types/dashboard";
import { useAuth } from "@/lib/hooks/use-auth";
import { Ticket, TicketStatus } from "@/types";

// Mock data generator for development
function generateMockDashboardStats(): DashboardStats {
  const mockTickets: Ticket[] = [
    {
      id: "1",
      title: "Fix authentication bug",
      project_id: "proj-1",
      description: null,
      status: "in_progress",
      status_category: "started",
      priority: "urgent",
      assignee_id: "user-1",
      created_by: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 86400000).toISOString(),
      position: 0,
      issue_type: "bug",
      story_points: 3,
      start_date: null,
      parent_id: null,
      epic_id: null,
      milestone_id: null,
      first_response_at: null,
      resolved_at: null,
      sla_response_breached: false,
      sla_resolution_breached: false,
    },
  ];

  return {
    totalTasks: 53,
    tasksByStatus: {
      todo: 12,
      in_progress: 8,
      done: 24,
      in_review: 3,
      backlog: 5,
      canceled: 1,
    },
    upcomingDeadlines: [
      {
        task: mockTickets[0],
        daysUntilDue: 1,
        isOverdue: false,
        urgency: "this-week",
      },
    ],
    teamWorkload: [
      {
        userId: "user-1",
        userName: "Alice Johnson",
        userAvatar: null,
        taskCount: 5,
        status: "balanced",
        tasksAssigned: mockTickets,
      },
      {
        userId: "user-2",
        userName: "Bob Smith",
        userAvatar: null,
        taskCount: 12,
        status: "overload",
        tasksAssigned: [],
      },
    ],
    sprintVelocity: [
      {
        sprintName: "Sprint 1",
        completed: 28,
        total: 35,
        velocity: 28,
        isCurrentSprint: false,
      },
      {
        sprintName: "Sprint 2",
        completed: 32,
        total: 38,
        velocity: 32,
        isCurrentSprint: false,
      },
      {
        sprintName: "Sprint 3",
        completed: 25,
        total: 40,
        velocity: 25,
        isCurrentSprint: true,
      },
    ],
    projects: [
      {
        projectId: "proj-1",
        projectName: "Frontend Redesign",
        projectEmoji: "🎨",
        taskCounts: {
          todo: 5,
          in_progress: 3,
          done: 12,
          in_review: 1,
          backlog: 2,
          canceled: 0,
        },
        totalTasks: 23,
        completionPercentage: 52,
      },
    ],
    myTasks: mockTickets,
  };
}

export default function DashboardViewPage() {
  const { user } = useAuth();
  const { layout, updateLayout, resetLayout, toggleWidgetVisibility } =
    useDashboardLayout();

  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Mock data
  useEffect(() => {
    // In production, this would fetch from API
    setStats(generateMockDashboardStats());
  }, []);

  // Initialize layout if not already set
  useEffect(() => {
    if (!layout && user) {
      const userRole = (user.role as "product" | "developer" | "admin") || "admin";
      const defaultWidgetTypes =
        DEFAULT_LAYOUTS_BY_ROLE[userRole] ||
        DEFAULT_LAYOUTS_BY_ROLE.admin;

      const defaultWidgets: DashboardWidget[] = (defaultWidgetTypes || DEFAULT_LAYOUTS_BY_ROLE.admin).map(
        (type, index) => {
          const metadata = WIDGET_METADATA[type];
          return {
            id: type,
            type,
            title: metadata.title,
            icon: metadata.icon,
            size: metadata.defaultSize,
            order: index,
            isVisible: true,
          };
        }
      );

      updateLayout(defaultWidgets);
    }

    setIsInitialized(true);
  }, [layout, user, updateLayout]);

  const handleResetLayout = useCallback(() => {
    resetLayout();
    if (user) {
      const userRole = (user.role as "product" | "developer" | "admin") || "admin";
      const defaultWidgetTypes =
        DEFAULT_LAYOUTS_BY_ROLE[userRole] ||
        DEFAULT_LAYOUTS_BY_ROLE.admin;

      const defaultWidgets: DashboardWidget[] = (defaultWidgetTypes || DEFAULT_LAYOUTS_BY_ROLE.admin).map(
        (type, index) => {
          const metadata = WIDGET_METADATA[type];
          return {
            id: type,
            type,
            title: metadata.title,
            icon: metadata.icon,
            size: metadata.defaultSize,
            order: index,
            isVisible: true,
          };
        }
      );

      updateLayout(defaultWidgets);
    }
  }, [user, resetLayout, updateLayout]);

  const handleWidgetToggle = useCallback(
    (widgetId: string) => {
      toggleWidgetVisibility(widgetId);
    },
    [toggleWidgetVisibility]
  );

  const handleProjectClick = useCallback((projectId: string) => {
    // Navigate to project or filter dashboard
    window.location.href = `/project/${projectId}`;
  }, []);

  const handleTaskClick = useCallback((taskId: string) => {
    // Navigate to task
    window.location.href = `/ticket/${taskId}`;
  }, []);

  const handleTaskStatusChange = useCallback(
    (taskId: string, newStatus: TicketStatus) => {
      // In production, update task status via API
      console.log("Update task status:", taskId, newStatus);
    },
    []
  );

  const visibleWidgets = useMemo(() => {
    if (!layout) return [];
    return layout.widgets.filter((w) => w.isVisible).sort((a, b) => a.order - b.order);
  }, [layout]);

  if (!isInitialized || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-surface-primary">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Dashboard</h1>
          <p className="text-sm text-content-muted mt-1">
            Welcome back! Here's your project overview.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 text-content-muted hover:text-content-primary hover:bg-hover rounded-lg transition-colors"
          title="Dashboard settings"
          aria-label="Dashboard settings"
        >
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <WidgetGrid>
          {visibleWidgets.map((widget) => (
            <DashboardWidgetComponent
              key={widget.id}
              id={widget.id}
              title={widget.title}
              icon={widget.icon}
              size={widget.size}
              onRemove={() => toggleWidgetVisibility(widget.id)}
            >
              {widget.type === "status" && (
                <TasksByStatusWidget tasksByStatus={stats.tasksByStatus} />
              )}
              {widget.type === "deadlines" && (
                <UpcomingDeadlinesWidget deadlines={stats.upcomingDeadlines} />
              )}
              {widget.type === "workload" && (
                <TeamWorkloadWidget workload={stats.teamWorkload} />
              )}
              {widget.type === "velocity" && (
                <SprintVelocityWidget velocity={stats.sprintVelocity} />
              )}
              {widget.type === "projects" && (
                <ProjectOverviewWidget
                  projects={stats.projects}
                  onProjectClick={handleProjectClick}
                />
              )}
              {widget.type === "my-tasks" && (
                <MyTasksWidget
                  tasks={stats.myTasks}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleTaskStatusChange}
                />
              )}
            </DashboardWidgetComponent>
          ))}
        </WidgetGrid>
      </div>

      {/* Settings Panel */}
      <DashboardSettings
        isOpen={showSettings}
        widgets={(layout?.widgets || []) as DashboardWidget[]}
        onClose={() => setShowSettings(false)}
        onWidgetToggle={handleWidgetToggle}
        onReset={handleResetLayout}
      />
    </div>
  );
}
