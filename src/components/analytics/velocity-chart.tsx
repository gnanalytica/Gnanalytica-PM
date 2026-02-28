'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useProjectCycles } from '@/lib/hooks/use-cycles';
import { useVelocityPerCycle } from '@/lib/hooks/use-tickets';

export function VelocityChart({ projectId }: { projectId: string }) {
  const cycles = useProjectCycles(projectId);
  const cycleIds = useMemo(() => cycles.map((c) => c.id), [cycles]);
  const { average, byCycle } = useVelocityPerCycle(cycleIds);

  const chartData = useMemo(() => {
    const cycleMap = new Map(cycles.map((c) => [c.id, c]));
    // Reverse so oldest is on the left
    return [...byCycle].reverse().map((item) => ({
      name: cycleMap.get(item.cycleId)?.name ?? 'Cycle',
      total: item.total,
      completed: item.completed,
    }));
  }, [cycles, byCycle]);

  if (cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No cycles yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Cycle Velocity</h3>
        <span className="text-xs text-gray-500">
          Avg: {average} completed / cycle
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="total" name="Total" fill="#4a4f57" radius={[3, 3, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="#6e9ade" radius={[3, 3, 0, 0]} />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#c9a04e"
              strokeDasharray="4 4"
              label={{
                value: `Avg (${average})`,
                position: 'right',
                fontSize: 10,
                fill: '#c9a04e',
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
