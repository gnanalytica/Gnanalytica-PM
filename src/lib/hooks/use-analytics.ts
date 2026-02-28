'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import type { Cycle } from '@/types';

const supabase = createClient();

type BurndownPoint = { date: string; remaining: number; ideal: number };

/**
 * Compute burndown data for a cycle.
 * Fetches tickets in the cycle and activity_log status changes,
 * then reconstructs daily remaining count from start to end.
 */
export function useBurndownData(
  cycleId: string | null,
  projectId: string,
) {
  const { getStatusCategory } = useProjectWorkflow(projectId);

  return useQuery({
    queryKey: ['burndown', cycleId],
    queryFn: async () => {
      // Fetch cycle details
      const { data: cycle, error: cycleErr } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', cycleId!)
        .single();
      if (cycleErr) throw cycleErr;

      const typedCycle = cycle as Cycle;

      // Fetch ticket IDs in this cycle
      const { data: junctions, error: juncErr } = await supabase
        .from('ticket_cycles')
        .select('ticket_id')
        .eq('cycle_id', cycleId!);
      if (juncErr) throw juncErr;

      const ticketIds = (junctions ?? []).map((j) => j.ticket_id);
      if (ticketIds.length === 0) {
        return { data: [] as BurndownPoint[], totalScope: 0 };
      }

      // Fetch status change activity logs for these tickets
      const { data: logs, error: logErr } = await supabase
        .from('activity_log')
        .select('ticket_id, new_value, old_value, created_at')
        .in('ticket_id', ticketIds)
        .eq('action', 'status_changed')
        .gte('created_at', typedCycle.start_date)
        .order('created_at', { ascending: true });
      if (logErr) throw logErr;

      // Also fetch current ticket statuses to know initial state
      const { data: tickets, error: tickErr } = await supabase
        .from('tickets')
        .select('id, status')
        .in('id', ticketIds);
      if (tickErr) throw tickErr;

      const totalScope = ticketIds.length;

      // Work backwards from current state to reconstruct initial state at cycle start.
      // First, count how many are currently completed.
      const currentCompleted = new Set(
        (tickets ?? [])
          .filter((t) => getStatusCategory(t.status) === 'completed')
          .map((t) => t.id),
      );

      // Build a map of ticket completion events by date
      const events: { date: string; ticketId: string; completed: boolean }[] = [];
      for (const log of logs ?? []) {
        const date = log.created_at.slice(0, 10);
        const newCat = getStatusCategory(log.new_value ?? '');
        const oldCat = getStatusCategory(log.old_value ?? '');

        if (oldCat !== 'completed' && newCat === 'completed') {
          events.push({ date, ticketId: log.ticket_id, completed: true });
        } else if (oldCat === 'completed' && newCat !== 'completed') {
          events.push({ date, ticketId: log.ticket_id, completed: false });
        }
      }

      // Reconstruct completed count at cycle start by undoing all events
      let completedAtStart = currentCompleted.size;
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].completed) completedAtStart--;
        else completedAtStart++;
      }

      // Build daily data points
      const startDate = new Date(typedCycle.start_date + 'T00:00:00');
      const endDate = new Date(typedCycle.end_date + 'T00:00:00');
      const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      const chartEnd = endDate < today ? endDate : today;
      const totalDays = Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      // Group events by date
      const eventsByDate = new Map<string, { completed: boolean }[]>();
      for (const e of events) {
        const list = eventsByDate.get(e.date) ?? [];
        list.push({ completed: e.completed });
        eventsByDate.set(e.date, list);
      }

      const data: BurndownPoint[] = [];
      let completedSoFar = completedAtStart;

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().slice(0, 10);
        const dayIndex = Math.round(
          (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Apply events for this day
        const dayEvents = eventsByDate.get(dateStr);
        if (dayEvents) {
          for (const ev of dayEvents) {
            if (ev.completed) completedSoFar++;
            else completedSoFar--;
          }
        }

        const remaining = totalScope - completedSoFar;
        const ideal = Math.round(
          (totalScope - (totalScope * dayIndex) / totalDays) * 10,
        ) / 10;

        // Only show actual remaining for dates up to today
        if (d <= chartEnd) {
          data.push({ date: dateStr, remaining, ideal });
        } else {
          // Future: only show ideal line
          data.push({ date: dateStr, remaining: NaN, ideal });
        }
      }

      return { data, totalScope };
    },
    enabled: !!cycleId,
    staleTime: 30_000,
  });
}

/**
 * Fetch daily issue completion counts over the last N days for a project.
 */
export function useCompletionTrends(projectId: string, days = 30) {
  const { getStatusCategory } = useProjectWorkflow(projectId);

  return useQuery({
    queryKey: ['completion-trends', projectId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      // Fetch all tickets in the project to scope the query
      const { data: tickets, error: tickErr } = await supabase
        .from('tickets')
        .select('id')
        .eq('project_id', projectId);
      if (tickErr) throw tickErr;

      const ticketIds = (tickets ?? []).map((t) => t.id);
      if (ticketIds.length === 0) {
        return { data: [] as { date: string; completed: number }[] };
      }

      // Fetch status_changed logs for these tickets in the time range
      const { data: logs, error: logErr } = await supabase
        .from('activity_log')
        .select('new_value, old_value, created_at')
        .in('ticket_id', ticketIds)
        .eq('action', 'status_changed')
        .gte('created_at', sinceStr)
        .order('created_at', { ascending: true });
      if (logErr) throw logErr;

      // Count completions per day
      const countByDate = new Map<string, number>();
      for (const log of logs ?? []) {
        const oldCat = getStatusCategory(log.old_value ?? '');
        const newCat = getStatusCategory(log.new_value ?? '');
        if (oldCat !== 'completed' && newCat === 'completed') {
          const date = log.created_at.slice(0, 10);
          countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
        }
      }

      // Fill in all days in the range
      const data: { date: string; completed: number }[] = [];
      const cursor = new Date(since.toISOString().slice(0, 10) + 'T00:00:00');
      const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      while (cursor <= today) {
        const dateStr = cursor.toISOString().slice(0, 10);
        data.push({ date: dateStr, completed: countByDate.get(dateStr) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      return { data };
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}
