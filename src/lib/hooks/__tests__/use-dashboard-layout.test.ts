import { describe, it, expect, vi } from "vitest";
import {
  WidgetConfig,
  DashboardLayout,
} from "../use-dashboard-layout";

describe("Dashboard Layout Types and Interfaces", () => {
  describe("WidgetConfig Type", () => {
    it("should have all required properties", () => {
      const widget: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Chart Widget",
        size: "medium",
        order: 0,
        isVisible: true,
      };

      expect(widget).toHaveProperty("id");
      expect(widget).toHaveProperty("type");
      expect(widget).toHaveProperty("title");
      expect(widget).toHaveProperty("size");
      expect(widget).toHaveProperty("order");
      expect(widget).toHaveProperty("isVisible");
    });

    it("should support all valid sizes", () => {
      const sizes: Array<"small" | "medium" | "large"> = [
        "small",
        "medium",
        "large",
      ];

      sizes.forEach((size) => {
        const widget: WidgetConfig = {
          id: "w1",
          type: "chart",
          title: "Widget",
          size,
          order: 0,
          isVisible: true,
        };

        expect(widget.size).toBe(size);
      });
    });

    it("should support optional customHeight", () => {
      const widget: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Widget",
        size: "medium",
        order: 0,
        isVisible: true,
        customHeight: 400,
      };

      expect(widget.customHeight).toBe(400);
    });

    it("should allow customHeight to be undefined", () => {
      const widget: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Widget",
        size: "medium",
        order: 0,
        isVisible: true,
      };

      expect(widget.customHeight).toBeUndefined();
    });
  });

  describe("DashboardLayout Type", () => {
    it("should have all required properties", () => {
      const now = new Date();
      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [],
        createdAt: now,
        updatedAt: now,
      };

      expect(layout).toHaveProperty("id");
      expect(layout).toHaveProperty("userId");
      expect(layout).toHaveProperty("widgets");
      expect(layout).toHaveProperty("createdAt");
      expect(layout).toHaveProperty("updatedAt");
    });

    it("should contain array of widgets", () => {
      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [
          {
            id: "w1",
            type: "chart",
            title: "Chart",
            size: "medium",
            order: 0,
            isVisible: true,
          },
          {
            id: "w2",
            type: "table",
            title: "Table",
            size: "large",
            order: 1,
            isVisible: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout.widgets).toHaveLength(2);
      expect(layout.widgets[0].type).toBe("chart");
      expect(layout.widgets[1].type).toBe("table");
    });

    it("should support empty widgets array", () => {
      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout.widgets).toHaveLength(0);
    });
  });

  describe("Widget Configuration States", () => {
    it("should track widget visibility", () => {
      const visible: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Visible",
        size: "medium",
        order: 0,
        isVisible: true,
      };

      const hidden: WidgetConfig = {
        id: "w2",
        type: "chart",
        title: "Hidden",
        size: "medium",
        order: 1,
        isVisible: false,
      };

      expect(visible.isVisible).toBe(true);
      expect(hidden.isVisible).toBe(false);
    });

    it("should support widget ordering", () => {
      const widgets: WidgetConfig[] = [
        {
          id: "w1",
          type: "chart",
          title: "First",
          size: "medium",
          order: 0,
          isVisible: true,
        },
        {
          id: "w2",
          type: "table",
          title: "Second",
          size: "medium",
          order: 1,
          isVisible: true,
        },
        {
          id: "w3",
          type: "chart",
          title: "Third",
          size: "medium",
          order: 2,
          isVisible: true,
        },
      ];

      expect(widgets[0].order).toBe(0);
      expect(widgets[1].order).toBe(1);
      expect(widgets[2].order).toBe(2);
    });
  });

  describe("Widget Type Support", () => {
    it("should support various widget types", () => {
      const types = ["chart", "table", "metric", "timeline", "feed"];

      types.forEach((type) => {
        const widget: WidgetConfig = {
          id: "w1",
          type,
          title: `${type} widget`,
          size: "medium",
          order: 0,
          isVisible: true,
        };

        expect(widget.type).toBe(type);
      });
    });
  });

  describe("Widget Size Categories", () => {
    it("should define three size categories", () => {
      const smallWidget: WidgetConfig = {
        id: "w1",
        type: "metric",
        title: "Small",
        size: "small",
        order: 0,
        isVisible: true,
      };

      const mediumWidget: WidgetConfig = {
        id: "w2",
        type: "chart",
        title: "Medium",
        size: "medium",
        order: 1,
        isVisible: true,
      };

      const largeWidget: WidgetConfig = {
        id: "w3",
        type: "table",
        title: "Large",
        size: "large",
        order: 2,
        isVisible: true,
      };

      expect(smallWidget.size).toBe("small");
      expect(mediumWidget.size).toBe("medium");
      expect(largeWidget.size).toBe("large");
    });
  });

  describe("Layout Timestamp Management", () => {
    it("should track creation time", () => {
      const createdAt = new Date("2024-01-15T10:00:00Z");
      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [],
        createdAt,
        updatedAt: createdAt,
      };

      expect(layout.createdAt).toEqual(createdAt);
    });

    it("should track update time separately", () => {
      const createdAt = new Date("2024-01-15T10:00:00Z");
      const updatedAt = new Date("2024-01-15T14:30:00Z");

      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [],
        createdAt,
        updatedAt,
      };

      expect(layout.createdAt).toEqual(createdAt);
      expect(layout.updatedAt).toEqual(updatedAt);
      expect(layout.updatedAt.getTime()).toBeGreaterThan(
        layout.createdAt.getTime()
      );
    });
  });

  describe("Layout Identity", () => {
    it("should have unique layout ID", () => {
      const layout1: DashboardLayout = {
        id: "layout-1",
        userId: "user-1",
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const layout2: DashboardLayout = {
        id: "layout-2",
        userId: "user-1",
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout1.id).not.toBe(layout2.id);
    });

    it("should link layout to user ID", () => {
      const layout: DashboardLayout = {
        id: "layout-1",
        userId: "user-123",
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout.userId).toBe("user-123");
    });
  });

  describe("Widget Updates", () => {
    it("should allow partial widget updates", () => {
      const original: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Original",
        size: "medium",
        order: 0,
        isVisible: true,
      };

      const updated: WidgetConfig = {
        ...original,
        title: "Updated Title",
        size: "large",
      };

      expect(updated.id).toBe(original.id);
      expect(updated.type).toBe(original.type);
      expect(updated.title).toBe("Updated Title");
      expect(updated.size).toBe("large");
    });

    it("should preserve other properties during update", () => {
      const original: WidgetConfig = {
        id: "w1",
        type: "chart",
        title: "Widget",
        size: "medium",
        order: 3,
        isVisible: true,
        customHeight: 500,
      };

      const updated: WidgetConfig = {
        ...original,
        isVisible: false,
      };

      expect(updated.order).toBe(original.order);
      expect(updated.customHeight).toBe(original.customHeight);
      expect(updated.isVisible).toBe(false);
    });
  });

  describe("Multiple Widget Management", () => {
    it("should manage collection of widgets", () => {
      const widgets: WidgetConfig[] = Array.from({ length: 5 }, (_, i) => ({
        id: `w${i + 1}`,
        type: i % 2 === 0 ? "chart" : "table",
        title: `Widget ${i + 1}`,
        size: (["small", "medium", "large"] as const)[i % 3],
        order: i,
        isVisible: true,
      }));

      expect(widgets).toHaveLength(5);
      widgets.forEach((w, i) => {
        expect(w.order).toBe(i);
      });
    });

    it("should reorder collection of widgets", () => {
      const widgets: WidgetConfig[] = [
        {
          id: "w1",
          type: "chart",
          title: "First",
          size: "medium",
          order: 0,
          isVisible: true,
        },
        {
          id: "w2",
          type: "table",
          title: "Second",
          size: "medium",
          order: 1,
          isVisible: true,
        },
      ];

      const reordered = [
        { ...widgets[1], order: 0 },
        { ...widgets[0], order: 1 },
      ];

      expect(reordered[0].id).toBe("w2");
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].id).toBe("w1");
      expect(reordered[1].order).toBe(1);
    });

    it("should filter widgets by visibility", () => {
      const widgets: WidgetConfig[] = [
        {
          id: "w1",
          type: "chart",
          title: "Visible",
          size: "medium",
          order: 0,
          isVisible: true,
        },
        {
          id: "w2",
          type: "table",
          title: "Hidden",
          size: "medium",
          order: 1,
          isVisible: false,
        },
        {
          id: "w3",
          type: "chart",
          title: "Visible",
          size: "medium",
          order: 2,
          isVisible: true,
        },
      ];

      const visible = widgets.filter((w) => w.isVisible);
      expect(visible).toHaveLength(2);
      expect(visible[0].id).toBe("w1");
      expect(visible[1].id).toBe("w3");
    });
  });

  describe("Layout Composition", () => {
    it("should create complete layout with widgets", () => {
      const layout: DashboardLayout = {
        id: "main-layout",
        userId: "user-1",
        widgets: [
          {
            id: "chart-1",
            type: "chart",
            title: "Sales",
            size: "medium",
            order: 0,
            isVisible: true,
          },
          {
            id: "table-1",
            type: "table",
            title: "Details",
            size: "large",
            order: 1,
            isVisible: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout.widgets).toHaveLength(2);
      expect(layout.widgets[0].type).toBe("chart");
      expect(layout.widgets[1].type).toBe("table");
    });
  });
});
