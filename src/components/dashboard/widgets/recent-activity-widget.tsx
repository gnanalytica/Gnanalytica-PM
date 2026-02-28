'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

type ActivityEntry = {
  id: string;
  ticket_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  created_at: string;
  ticket?: { title: string };
  user?: { name: string };
};

export function RecentActivityWidget({ projectId }: { projectId: string }) {
  const { data: activities } = useQuery({
    queryKey: ['recent-activity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, ticket_id, field, old_value, new_value, changed_by, created_at, ticket:tickets!inner(title, project_id), user:profiles!activity_log_changed_by_fkey(name)')
        .eq('ticket.project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as ActivityEntry[];
    },
    staleTime: 30_000,
  });

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div>
      <p className="text-[11px] text-content-muted uppercase font-medium mb-2">Recent Activity</p>
      {!activities || activities.length === 0 ? (
        <p className="text-[12px] text-content-muted">No recent activity</p>
      ) : (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-content-secondary truncate">
                  <span className="font-medium">{a.user?.name ?? 'Someone'}</span>
                  {' changed '}
                  <span className="text-content-muted">{a.field}</span>
                  {' on '}
                  <span className="font-medium">{a.ticket?.title ?? 'a ticket'}</span>
                </p>
              </div>
              <span className="text-[10px] text-content-muted flex-shrink-0">
                {formatTime(a.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
