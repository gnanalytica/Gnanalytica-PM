'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

type CustomerTicket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

function useCustomerTickets() {
  return useQuery({
    queryKey: ['customer-tickets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Look up customer user
      const { data: customerUser } = await supabase
        .from('customer_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!customerUser) return [];

      const { data, error } = await supabase
        .from('customer_tickets')
        .select('id, title, status, priority, created_at, updated_at')
        .eq('submitted_by', customerUser.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as CustomerTicket[];
    },
  });
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function CustomerPortalPage() {
  const { data: tickets, isLoading } = useCustomerTickets();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-content-primary">My Tickets</h1>
        <Link
          href="/portal/new"
          className="px-3 py-1.5 text-[12px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
        >
          Submit New Ticket
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-content-muted">Loading...</p>
      ) : !tickets || tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-content-muted mb-2">No tickets yet.</p>
          <Link href="/portal/new" className="text-sm text-accent hover:underline">
            Submit your first ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/${ticket.id}`}
              className="block border border-border-subtle rounded-md p-3 hover:bg-hover transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[13px] font-medium text-content-primary">{ticket.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-content-muted">
                <span>#{ticket.id.slice(0, 6)}</span>
                <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
