'use client';

import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useShallow } from 'zustand/react/shallow';
import { useTicketStore } from '@/lib/store/ticket-store';
import { useProjects } from '@/lib/hooks/use-projects';
import type { Ticket, Project } from '@/types';

export type SearchResultItem =
  | { type: 'ticket'; item: Ticket; projectName?: string }
  | { type: 'project'; item: Project };

export function useSearchIndex(): Fuse<SearchResultItem> | null {
  const { byId, ids } = useTicketStore(
    useShallow((s) => ({ byId: s.byId, ids: s.ids })),
  );
  const { data: projects } = useProjects();

  const fuse = useMemo(() => {
    const projectMap = new Map<string, string>();
    const items: SearchResultItem[] = [];

    if (projects) {
      for (const p of projects) {
        projectMap.set(p.id, p.name);
        items.push({ type: 'project', item: p });
      }
    }

    for (const id of ids) {
      const t = byId[id];
      if (t) {
        items.push({
          type: 'ticket',
          item: t,
          projectName: projectMap.get(t.project_id),
        });
      }
    }

    if (items.length === 0) return null;

    return new Fuse(items, {
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
      keys: [
        { name: 'item.title', weight: 2.0 },
        { name: 'item.name', weight: 2.0 },
        { name: 'item.description', weight: 0.8 },
        { name: 'item.assignee.name', weight: 0.6 },
        { name: 'item.labels.name', weight: 0.5 },
        { name: 'projectName', weight: 0.4 },
        { name: 'item.status', weight: 0.3 },
        { name: 'item.priority', weight: 0.3 },
      ],
    });
  }, [byId, ids, projects]);

  return fuse;
}
