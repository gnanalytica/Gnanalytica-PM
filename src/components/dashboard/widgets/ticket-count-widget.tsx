'use client';

import { useMemo } from 'react';
import { useProjectTickets } from '@/lib/hooks/use-tickets';

export function TicketCountWidget({ projectId }: { projectId: string }) {
  const tickets = useProjectTickets(projectId);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status_category !== 'completed' && t.status_category !== 'canceled').length;
    const completed = tickets.filter((t) => t.status_category === 'completed').length;
    const canceled = tickets.filter((t) => t.status_category === 'canceled').length;
    return { total: tickets.length, open, completed, canceled };
  }, [tickets]);

  return (
    <div>
      <p className="text-[11px] text-content-muted uppercase font-medium mb-2">Ticket Summary</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xl font-semibold text-content-primary">{stats.total}</p>
          <p className="text-[10px] text-content-muted">Total</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-content-primary">{stats.open}</p>
          <p className="text-[10px] text-content-muted">Open</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-[#5fae7e]">{stats.completed}</p>
          <p className="text-[10px] text-content-muted">Completed</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-content-muted">{stats.canceled}</p>
          <p className="text-[10px] text-content-muted">Canceled</p>
        </div>
      </div>
    </div>
  );
}
