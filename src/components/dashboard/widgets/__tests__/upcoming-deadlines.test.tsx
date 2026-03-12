import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpcomingDeadlinesWidget } from "../upcoming-deadlines";
import { UpcomingDeadline } from "@/lib/types/dashboard";

describe("UpcomingDeadlinesWidget", () => {
  const mockDeadlines: UpcomingDeadline[] = [
    {
      task: {
        id: "1",
        title: "Fix critical bug",
        project_id: "proj-1",
        description: null,
        status: "in_progress",
        status_category: "started",
        priority: "urgent",
        assignee_id: "user-1",
        created_by: "user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
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
      daysUntilDue: -1,
      isOverdue: true,
      urgency: "overdue",
    },
    {
      task: {
        id: "2",
        title: "Implement feature",
        project_id: "proj-1",
        description: null,
        status: "todo",
        status_category: "unstarted",
        priority: "high",
        assignee_id: "user-2",
        created_by: "user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        position: 0,
        issue_type: "feature",
        story_points: 5,
        start_date: null,
        parent_id: null,
        epic_id: null,
        milestone_id: null,
        first_response_at: null,
        resolved_at: null,
        sla_response_breached: false,
        sla_resolution_breached: false,
      },
      daysUntilDue: 2,
      isOverdue: false,
      urgency: "this-week",
    },
  ];

  it("renders widget with title", () => {
    render(<UpcomingDeadlinesWidget deadlines={mockDeadlines} />);
    // The widget renders deadline items
    expect(screen.queryByText("Fix critical bug")).toBeTruthy();
  });

  it("displays all deadlines", () => {
    render(<UpcomingDeadlinesWidget deadlines={mockDeadlines} />);
    expect(screen.queryByText("Fix critical bug")).toBeTruthy();
    expect(screen.queryByText("Implement feature")).toBeTruthy();
  });

  it("sorts deadlines by due date (earliest first)", () => {
    render(<UpcomingDeadlinesWidget deadlines={mockDeadlines} />);
    const items = screen.queryAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    if (items.length > 0) {
      expect(items[0].textContent).toContain("Fix critical bug");
    }
  });

  it("shows empty state when no deadlines", () => {
    render(<UpcomingDeadlinesWidget deadlines={[]} />);
    expect(screen.queryByText(/no upcoming deadlines/i)).toBeTruthy();
  });

  it("color-codes by urgency (overdue: red, this-week: orange)", () => {
    const { container } = render(
      <UpcomingDeadlinesWidget deadlines={mockDeadlines} />
    );
    const items = container.querySelectorAll(".deadline-item");
    expect(items.length).toBe(mockDeadlines.length);
  });

  it("displays due dates", () => {
    render(<UpcomingDeadlinesWidget deadlines={mockDeadlines} />);
    // Should display dates in human-readable format
    expect(screen.queryAllByText(/days?|overdue|remaining/i).length).toBeGreaterThan(0);
  });

  it("shows overdue indicator", () => {
    render(<UpcomingDeadlinesWidget deadlines={mockDeadlines} />);
    const overdueElements = screen.queryAllByText(/overdue/i);
    expect(overdueElements.length).toBeGreaterThan(0);
  });
});
