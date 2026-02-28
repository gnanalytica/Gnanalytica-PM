'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useProjectCycles, useActiveCycle } from '@/lib/hooks/use-cycles';
import { useBurndownData } from '@/lib/hooks/use-analytics';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BurndownChart({ projectId }: { projectId: string }) {
  const cycles = useProjectCycles(projectId);
  const activeCycle = useActiveCycle();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  // Default to active cycle
  const cycleId = selectedCycleId ?? activeCycle?.id ?? null;
  const { data: burndown, isLoading } = useBurndownData(cycleId, projectId);

  const chartData = useMemo(() => {
    if (!burndown?.data) return [];
    return burndown.data.map((point) => ({
      date: formatDate(point.date),
      rawDate: point.date,
      Remaining: Number.isNaN(point.remaining) ? undefined : point.remaining,
      Ideal: point.ideal,
    }));
  }, [burndown]);

  if (cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No cycles yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Burndown</h3>
        <select
          value={cycleId ?? ''}
          onChange={(e) => setSelectedCycleId(e.target.value || null)}
          className="text-xs border border-border-subtle rounded px-2 py-1 bg-surface-tertiary cursor-pointer"
        >
          <option value="">Select cycle...</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!cycleId ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          Select a cycle
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              labelFormatter={(label) => label}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="Ideal"
              stroke="#9ca3af"
              strokeDasharray="4 4"
              fill="none"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Remaining"
              stroke="#6e9ade"
              fill="rgba(110, 154, 222, 0.12)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
