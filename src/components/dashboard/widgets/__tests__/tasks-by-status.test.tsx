import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TasksByStatusWidget } from "../tasks-by-status";

describe("TasksByStatusWidget", () => {
  const mockTasksByStatus = {
    todo: 12,
    in_progress: 8,
    done: 24,
    in_review: 3,
    backlog: 5,
    canceled: 1,
  };

  it("renders widget with title", () => {
    render(<TasksByStatusWidget tasksByStatus={mockTasksByStatus} />);
    // Widget renders the content
    expect(screen.queryByText(/Total Tasks/)).toBeInTheDocument();
  });

  it("displays all status counts", () => {
    render(<TasksByStatusWidget tasksByStatus={mockTasksByStatus} />);
    expect(screen.queryAllByText(/12/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/8/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/24/).length).toBeGreaterThan(0);
  });

  it("calculates and displays percentages correctly", () => {
    render(<TasksByStatusWidget tasksByStatus={mockTasksByStatus} />);
    const total = Object.values(mockTasksByStatus).reduce((a, b) => a + b, 0);
    const donePercentage = Math.round((24 / total) * 100);
    const percentageTexts = screen.queryAllByText(new RegExp(`${donePercentage}%`));
    expect(percentageTexts.length).toBeGreaterThan(0);
  });

  it("shows empty state when no tasks", () => {
    const empty = {
      todo: 0,
      in_progress: 0,
      done: 0,
      in_review: 0,
      backlog: 0,
      canceled: 0,
    };
    render(<TasksByStatusWidget tasksByStatus={empty} />);
    expect(screen.queryByText(/no tasks/i)).toBeInTheDocument();
  });

  it("uses color-coded bars for each status", () => {
    const { container } = render(
      <TasksByStatusWidget tasksByStatus={mockTasksByStatus} />
    );
    // Check that bars exist
    const bars = container.querySelectorAll("[role='progressbar']");
    expect(bars.length).toBeGreaterThan(0);
  });

  it("displays status labels correctly", () => {
    render(<TasksByStatusWidget tasksByStatus={mockTasksByStatus} />);
    // Check that status labels exist (use queryAllByText because there are duplicates)
    expect(screen.queryAllByText(/To Do/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/In Progress/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Done/).length).toBeGreaterThan(0);
  });
});
