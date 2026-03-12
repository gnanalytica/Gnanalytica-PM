import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/views
 * Get all global views
 * Returns predefined views: All Tasks, My Tasks, By Project, By Assignee, Overdue, Due This Week, Sprints
 * No auth required (public views)
 */
export async function GET(req: NextRequest) {
  try {
    const views = [
      {
        id: "all-tasks",
        name: "All Tasks",
        description: "All tasks across all projects",
        icon: "list",
        filters: {
          includeArchived: false,
        },
      },
      {
        id: "my-tasks",
        name: "My Tasks",
        description: "Tasks assigned to me",
        icon: "user",
        filters: {
          assigneeId: "current_user",
          includeArchived: false,
        },
      },
      {
        id: "by-project",
        name: "By Project",
        description: "Tasks grouped by project",
        icon: "folder",
        filters: {
          groupBy: "project",
          includeArchived: false,
        },
      },
      {
        id: "by-assignee",
        name: "By Assignee",
        description: "Tasks grouped by assignee",
        icon: "users",
        filters: {
          groupBy: "assignee",
          includeArchived: false,
        },
      },
      {
        id: "overdue",
        name: "Overdue",
        description: "Tasks with due dates in the past",
        icon: "alert-circle",
        filters: {
          dueDateBefore: "now",
          statusCategory: ["unstarted", "started"],
          includeArchived: false,
        },
      },
      {
        id: "due-this-week",
        name: "Due This Week",
        description: "Tasks due within the next 7 days",
        icon: "calendar",
        filters: {
          dueDateRange: {
            start: "now",
            end: "+7d",
          },
          statusCategory: ["unstarted", "started"],
          includeArchived: false,
        },
      },
      {
        id: "sprints",
        name: "Sprints",
        description: "View tasks by sprint/cycle",
        icon: "zap",
        filters: {
          groupBy: "sprint",
          includeArchived: false,
        },
      },
    ];

    return NextResponse.json({ views }, { status: 200 });
  } catch (err) {
    console.error("Views GET error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
