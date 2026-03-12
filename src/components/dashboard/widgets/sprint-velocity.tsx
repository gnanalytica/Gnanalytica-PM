"use client";

import React, { useMemo } from "react";
import { SprintVelocityData } from "@/lib/types/dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SprintVelocityWidgetProps {
  velocity: SprintVelocityData[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function SprintVelocityWidget({
  velocity,
  isLoading = false,
  isEmpty = false,
}: SprintVelocityWidgetProps) {
  const chartData = useMemo(() => {
    return velocity.slice(-5).map((sprint) => ({
      name: sprint.sprintName,
      velocity: sprint.velocity,
      completed: sprint.completed,
      total: sprint.total,
      isCurrentSprint: sprint.isCurrentSprint,
    }));
  }, [velocity]);

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { average: 0, trend: "stable" as const, current: 0 };
    }

    const velocities = chartData.map((d) => d.velocity);
    const average = Math.round(
      velocities.reduce((a, b) => a + b, 0) / velocities.length
    );

    const current = velocities[velocities.length - 1];
    const previous =
      velocities.length > 1 ? velocities[velocities.length - 2] : current;

    let trend: "up" | "down" | "stable" = "stable";
    if (current > previous) trend = "up";
    if (current < previous) trend = "down";

    return { average, trend, current };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isEmpty || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No sprint data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-border-subtle">
        <div>
          <p className="text-xs text-content-muted uppercase">Current</p>
          <p className="text-lg font-bold text-content-primary">
            {stats.current}
          </p>
        </div>
        <div>
          <p className="text-xs text-content-muted uppercase">Average</p>
          <p className="text-lg font-bold text-accent">{stats.average}</p>
        </div>
        <div>
          <p className="text-xs text-content-muted uppercase">Trend</p>
          <p className="text-lg font-bold flex items-center gap-1">
            {stats.trend === "up" && <span className="text-green-600">↑</span>}
            {stats.trend === "down" && <span className="text-red-600">↓</span>}
            {stats.trend === "stable" && <span className="text-gray-600">→</span>}
            {stats.trend.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 -mx-4 -mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border-subtle)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="var(--color-content-muted)"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="var(--color-content-muted)"
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-primary)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [value, "Completed"]}
              labelStyle={{ color: "var(--color-content-primary)" }}
            />
            <Bar
              dataKey="completed"
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sprint Details */}
      <div className="pt-2 border-t border-border-subtle space-y-1">
        {chartData.map((sprint) => {
          const percentage = Math.round((sprint.completed / sprint.total) * 100);
          return (
            <div
              key={sprint.name}
              data-current={sprint.isCurrentSprint}
              className={`flex items-center justify-between text-xs p-1.5 rounded ${
                sprint.isCurrentSprint ? "bg-accent/10 border border-accent/20" : ""
              }`}
            >
              <span className="font-medium text-content-primary">
                {sprint.name}
                {sprint.isCurrentSprint && (
                  <span className="ml-1 text-accent">●</span>
                )}
              </span>
              <span className="text-content-muted">
                {sprint.completed}/{sprint.total} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
