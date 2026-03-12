import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SprintVelocityWidget } from "../sprint-velocity";
import { SprintVelocityData } from "@/lib/types/dashboard";

describe("SprintVelocityWidget", () => {
  const mockVelocity: SprintVelocityData[] = [
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
    {
      sprintName: "Sprint 4",
      completed: 35,
      total: 42,
      velocity: 35,
      isCurrentSprint: false,
    },
    {
      sprintName: "Sprint 5",
      completed: 30,
      total: 36,
      velocity: 30,
      isCurrentSprint: false,
    },
  ];

  it("renders widget with title", () => {
    render(<SprintVelocityWidget velocity={mockVelocity} />);
    // Component renders with stats labels like Current, Average, Trend
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("displays last 5 sprints", () => {
    render(<SprintVelocityWidget velocity={mockVelocity} />);
    expect(screen.queryByText("Sprint 1")).toBeInTheDocument();
    expect(screen.queryByText("Sprint 5")).toBeInTheDocument();
  });

  it("shows empty state when no sprints", () => {
    render(<SprintVelocityWidget velocity={[]} />);
    expect(screen.queryByText(/no sprint data|No sprint/i)).toBeInTheDocument();
  });

  it("highlights current sprint", () => {
    const { container } = render(<SprintVelocityWidget velocity={mockVelocity} />);
    const currentSprints = container.querySelectorAll("[data-current='true']");
    expect(currentSprints.length).toBeGreaterThan(0);
  });

  it("displays velocity points", () => {
    render(<SprintVelocityWidget velocity={mockVelocity} />);
    expect(screen.queryAllByText(/28/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/35/).length).toBeGreaterThan(0);
  });

  it("shows trend direction (up/down/stable)", () => {
    render(<SprintVelocityWidget velocity={mockVelocity} />);
    // Should show trend indicators
    expect(screen.queryAllByText(/↑|↓|→/).length).toBeGreaterThan(0);
  });

  it("displays completion percentage", () => {
    render(<SprintVelocityWidget velocity={mockVelocity} />);
    // 28/35 = 80%
    expect(screen.queryAllByText(/%/).length).toBeGreaterThan(0);
  });
});
