"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCompletionTrends } from "@/lib/hooks/use-analytics";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CompletionTrends({ projectId }: { projectId: string }) {
  const { data: trends, isLoading } = useCompletionTrends(projectId, 30);

  const chartData = useMemo(() => {
    if (!trends?.data) return [];
    return trends.data.map((point) => ({
      date: formatDate(point.date),
      rawDate: point.date,
      Completed: point.completed,
    }));
  }, [trends]);

  const totalCompleted = useMemo(
    () => chartData.reduce((sum, d) => sum + (d.Completed ?? 0), 0),
    [chartData],
  );

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Completion Trends
        </h3>
        <span className="text-xs text-gray-500">
          {totalCompleted} completed (30d)
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="Completed"
              stroke="#5fae7e"
              fill="rgba(95, 174, 126, 0.12)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
