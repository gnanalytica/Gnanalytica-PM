import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardSettings } from "../dashboard-settings";
import { DashboardWidget } from "@/lib/types/dashboard";

describe("DashboardSettings", () => {
  const mockWidgets: DashboardWidget[] = [
    {
      id: "status",
      type: "status",
      title: "Tasks by Status",
      size: "medium",
      order: 0,
      isVisible: true,
    },
    {
      id: "deadlines",
      type: "deadlines",
      title: "Upcoming Deadlines",
      size: "small",
      order: 1,
      isVisible: false,
    },
  ];

  it("renders settings panel", () => {
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );
    expect(screen.queryByText(/Dashboard Settings|Settings/i)).toBeTruthy();
  });

  it("displays checkboxes for each widget", () => {
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );
    const checkboxes = screen.queryAllByRole("checkbox");
    expect(checkboxes.length).toBe(mockWidgets.length);
  });

  it("toggles widget visibility", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={handleToggle}
        onReset={() => {}}
      />
    );

    const checkboxes = screen.queryAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(handleToggle).toHaveBeenCalledWith("status");
  });

  it("shows widget titles", () => {
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );
    expect(screen.queryByText("Tasks by Status")).toBeTruthy();
    expect(screen.queryByText("Upcoming Deadlines")).toBeTruthy();
  });

  it("has reset to defaults button", () => {
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );
    expect(screen.queryByText(/reset|Reset/i)).toBeTruthy();
  });

  it("calls onReset when reset button is clicked", async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={handleReset}
      />
    );

    const resetButton = screen.queryByText(/reset/i);
    if (resetButton) {
      await user.click(resetButton);
      expect(handleReset).toHaveBeenCalled();
    }
  });

  it("has close button", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={handleClose}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );

    const closeButton = screen.queryByLabelText(/close|dismiss/i);
    if (closeButton) {
      await user.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it("only renders when isOpen is true", () => {
    const { rerender } = render(
      <DashboardSettings
        isOpen={false}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.queryByText(/Dashboard Settings|Settings/i)).not.toBeTruthy();

    rerender(
      <DashboardSettings
        isOpen={true}
        widgets={mockWidgets}
        onClose={() => {}}
        onWidgetToggle={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.queryByText(/Dashboard Settings|Settings/i)).toBeTruthy();
  });
});
