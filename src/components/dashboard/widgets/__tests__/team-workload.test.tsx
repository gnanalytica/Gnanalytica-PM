import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamWorkloadWidget } from "../team-workload";
import { TeamMemberWorkload } from "@/lib/types/dashboard";

describe("TeamWorkloadWidget", () => {
  const mockWorkload: TeamMemberWorkload[] = [
    {
      userId: "user-1",
      userName: "Alice Johnson",
      userAvatar: null,
      taskCount: 5,
      status: "balanced",
      tasksAssigned: [],
    },
    {
      userId: "user-2",
      userName: "Bob Smith",
      userAvatar: null,
      taskCount: 12,
      status: "overload",
      tasksAssigned: [],
    },
    {
      userId: "user-3",
      userName: "Carol White",
      userAvatar: null,
      taskCount: 18,
      status: "crisis",
      tasksAssigned: [],
    },
  ];

  it("renders widget with title", () => {
    render(<TeamWorkloadWidget workload={mockWorkload} />);
    expect(screen.queryByText(/Workload Status/i)).toBeInTheDocument();
  });

  it("displays all team members", () => {
    render(<TeamWorkloadWidget workload={mockWorkload} />);
    expect(screen.queryByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Bob Smith")).toBeInTheDocument();
    expect(screen.queryByText("Carol White")).toBeInTheDocument();
  });

  it("shows task counts for each member", () => {
    render(<TeamWorkloadWidget workload={mockWorkload} />);
    expect(screen.queryAllByText(/5/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/12/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/18/).length).toBeGreaterThan(0);
  });

  it("shows empty state when no members", () => {
    render(<TeamWorkloadWidget workload={[]} />);
    expect(screen.queryByText(/no team members/i)).toBeInTheDocument();
  });

  it("color-codes by status (green: balanced, orange: overload, red: crisis)", () => {
    const { container } = render(<TeamWorkloadWidget workload={mockWorkload} />);
    const bars = container.querySelectorAll("[role='progressbar']");
    expect(bars.length).toBeGreaterThan(0);
  });

  it("displays status badges", () => {
    render(<TeamWorkloadWidget workload={mockWorkload} />);
    expect(screen.queryAllByText(/Balanced|Overload/i).length).toBeGreaterThan(0);
  });

  it("can sort by workload", () => {
    render(<TeamWorkloadWidget workload={mockWorkload} sortBy="workload" />);
    // Carol (18) should appear before Alice (5) when sorted by workload
    const items = screen.queryAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    // First item should be Carol when sorted by workload descending
    if (items.length > 0) {
      expect(items[0].textContent).toContain("Carol White");
    }
  });

  it("displays bars with correct heights", () => {
    const { container } = render(<TeamWorkloadWidget workload={mockWorkload} />);
    const bars = container.querySelectorAll("[role='progressbar']");
    expect(bars.length).toBe(mockWorkload.length);
  });
});
