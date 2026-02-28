'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { WorkflowStatus, ProjectWorkflow, StatusCategory } from '@/types';

const supabase = createClient();

/** The 6 built-in default statuses — used when a project has no custom workflow. */
export const DEFAULT_WORKFLOW: WorkflowStatus[] = [
  { key: 'backlog', label: 'Backlog', category: 'backlog', color: '#6b7280', position: 0 },
  { key: 'todo', label: 'Todo', category: 'unstarted', color: '#8b919a', position: 1 },
  { key: 'in_progress', label: 'In Progress', category: 'started', color: '#6e9ade', position: 2 },
  { key: 'in_review', label: 'In Review', category: 'started', color: '#a78bfa', position: 3 },
  { key: 'done', label: 'Done', category: 'completed', color: '#5fae7e', position: 4 },
  { key: 'canceled', label: 'Canceled', category: 'canceled', color: '#c27070', position: 5 },
];

async function fetchWorkflow(projectId: string): Promise<ProjectWorkflow | null> {
  const { data, error } = await supabase
    .from('project_workflows')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type WorkflowHelpers = {
  statuses: WorkflowStatus[];
  transitions: Record<string, string[]> | null;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  getStatusCategory: (status: string) => StatusCategory;
  getDefaultStatusForCategory: (category: StatusCategory) => string;
  isTransitionAllowed: (from: string, to: string) => boolean;
  getAllowedTransitions: (from: string) => string[];
};

/**
 * Fetch and cache the workflow for a project. Falls back to DEFAULT_WORKFLOW
 * when the project has no custom workflow row.
 */
export function useProjectWorkflow(projectId: string | undefined): WorkflowHelpers {
  const { data: workflow } = useQuery({
    queryKey: ['project-workflow', projectId],
    queryFn: () => fetchWorkflow(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const statuses = workflow?.statuses?.length ? workflow.statuses : DEFAULT_WORKFLOW;
  const transitions = workflow?.transitions ?? null;

  return useMemo(() => {
    const statusMap = new Map<string, WorkflowStatus>();
    for (const s of statuses) {
      statusMap.set(s.key, s);
    }

    const getStatusLabel = (status: string): string =>
      statusMap.get(status)?.label ?? status;

    const getStatusColor = (status: string): string =>
      statusMap.get(status)?.color ?? '#8b919a';

    const getStatusCategoryFn = (status: string): StatusCategory =>
      statusMap.get(status)?.category ?? 'unstarted';

    const getDefaultStatusForCategory = (category: StatusCategory): string => {
      const match = statuses.find((s) => s.category === category);
      return match?.key ?? 'todo';
    };

    const isTransitionAllowed = (from: string, to: string): boolean => {
      if (!transitions) return true;
      const allowed = transitions[from];
      if (!allowed) return true;
      return allowed.includes(to);
    };

    const getAllowedTransitions = (from: string): string[] => {
      if (!transitions) return statuses.map((s) => s.key);
      const allowed = transitions[from];
      if (!allowed) return statuses.map((s) => s.key);
      return allowed;
    };

    return {
      statuses,
      transitions,
      getStatusLabel,
      getStatusColor,
      getStatusCategory: getStatusCategoryFn,
      getDefaultStatusForCategory,
      isTransitionAllowed,
      getAllowedTransitions,
    };
  }, [statuses, transitions]);
}

/** Upsert a project workflow (insert or update). */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow: {
      project_id: string;
      statuses: WorkflowStatus[];
      transitions: Record<string, string[]> | null;
    }) => {
      const { data, error } = await supabase
        .from('project_workflows')
        .upsert(
          {
            project_id: workflow.project_id,
            statuses: workflow.statuses,
            transitions: workflow.transitions,
          },
          { onConflict: 'project_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-workflow', variables.project_id] });
    },
  });
}
