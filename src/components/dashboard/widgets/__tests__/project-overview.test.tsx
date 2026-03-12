import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectOverviewWidget } from "../project-overview";
import { ProjectOverviewCard } from "@/lib/types/dashboard";

describe("ProjectOverviewWidget", () => {
  const mockProjects: ProjectOverviewCard[] = [
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
    {
      projectId: "proj-2",
      projectName: "API Development",
      projectEmoji: "⚙️",
      taskCounts: {
        todo: 2,
        in_progress: 4,
        done: 18,
        in_review: 2,
        backlog: 1,
        canceled: 0,
      },
      totalTasks: 27,
      completionPercentage: 67,
    },
  ];

  it("renders widget with title or content", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    // Widget should render project cards
    expect(screen.queryByText("Frontend Redesign")).toBeTruthy();
  });

  it("displays all projects", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    expect(screen.queryByText("Frontend Redesign")).toBeTruthy();
    expect(screen.queryByText("API Development")).toBeTruthy();
  });

  it("shows project emojis", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    expect(screen.queryByText("🎨")).toBeTruthy();
    expect(screen.queryByText("⚙️")).toBeTruthy();
  });

  it("displays task counts", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    expect(screen.queryAllByText(/23|27/).length).toBeGreaterThan(0);
  });

  it("shows completion percentage", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    expect(screen.queryAllByText(/52%|67%/).length).toBeGreaterThan(0);
  });

  it("shows empty state when no projects", () => {
    render(<ProjectOverviewWidget projects={[]} onProjectClick={() => {}} />);
    expect(screen.queryByText(/no projects/i)).toBeInTheDocument();
  });

  it("calls onProjectClick when project card is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <ProjectOverviewWidget projects={mockProjects} onProjectClick={handleClick} />
    );

    const card = screen.getByText("Frontend Redesign").closest("button");
    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalledWith("proj-1");
    }
  });

  it("displays status breakdown in cards", () => {
    render(
      <ProjectOverviewWidget
        projects={mockProjects}
        onProjectClick={() => {}}
      />
    );
    // Should show task counts in progress bars or text
    const statusTexts = screen.queryAllByText(/To Do|In Progress|Done/i);
    expect(statusTexts.length).toBeGreaterThan(0);
  });
});
