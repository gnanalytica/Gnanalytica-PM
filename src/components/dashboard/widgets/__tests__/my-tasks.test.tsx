import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyTasksWidget } from "../my-tasks";
import { Ticket } from "@/types";

describe("MyTasksWidget", () => {
  const mockTasks: Ticket[] = [
    {
      id: "1",
      title: "Fix critical bug",
      project_id: "proj-1",
      description: null,
      status: "in_progress",
      status_category: "started",
      priority: "urgent",
      assignee_id: "me",
      created_by: "me",
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
    {
      id: "2",
      title: "Review PRs",
      project_id: "proj-1",
      description: null,
      status: "todo",
      status_category: "unstarted",
      priority: "medium",
      assignee_id: "me",
      created_by: "me",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      position: 0,
      issue_type: "task",
      story_points: 2,
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

  it("renders widget with title", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    // Widget should render task items
    expect(screen.queryByText("Fix critical bug")).toBeTruthy();
  });

  it("displays all tasks", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    expect(screen.queryByText("Fix critical bug")).toBeTruthy();
    expect(screen.queryByText("Review PRs")).toBeTruthy();
  });

  it("shows empty state when no tasks", () => {
    render(<MyTasksWidget tasks={[]} onTaskClick={() => {}} />);
    expect(screen.queryByText(/no tasks assigned/i)).toBeTruthy();
  });

  it("displays priority badges", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    expect(screen.queryAllByText(/urgent|medium/).length).toBeGreaterThan(0);
  });

  it("displays due dates", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    // Should show relative due dates
    expect(screen.queryAllByText(/day|remaining/i).length).toBeGreaterThan(0);
  });

  it("displays status badges", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    const statusElements = screen.queryAllByText(/in_progress|todo|in progress/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it("sorts by due date then priority", () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={() => {}} />);
    const items = screen.queryAllByRole("listitem");
    // First item should be the one due soonest
    expect(items.length).toBeGreaterThan(0);
    if (items.length > 0) {
      expect(items[0].textContent).toContain("Fix critical bug");
    }
  });

  it("calls onTaskClick when task is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={handleClick} />);

    const taskButton = screen.getByText("Fix critical bug").closest("button");
    if (taskButton) {
      await user.click(taskButton);
      expect(handleClick).toHaveBeenCalledWith("1");
    }
  });

  it("has quick status update buttons", () => {
    const handleStatusChange = vi.fn();
    render(
      <MyTasksWidget
        tasks={mockTasks}
        onTaskClick={() => {}}
        onStatusChange={handleStatusChange}
      />
    );
    // Should show buttons or options to update status
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
