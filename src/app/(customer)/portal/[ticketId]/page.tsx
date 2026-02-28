'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

export default function CustomerTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = typeof params.ticketId === 'string' ? params.ticketId : '';
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['customer-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });

  const { data: comments } = useQuery({
    queryKey: ['customer-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_comments')
        .select('*, user:customer_users(name, email)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ticketId,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: customerUser } = await supabase
        .from('customer_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!customerUser) throw new Error('Customer user not found');

      const { error } = await supabase
        .from('customer_comments')
        .insert({
          ticket_id: ticketId,
          author_id: customerUser.id,
          body: newComment.trim(),
          is_internal: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['customer-comments', ticketId] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-content-muted">Loading...</p>;
  }

  if (!ticket) {
    return <p className="text-sm text-content-muted">Ticket not found.</p>;
  }

  const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] text-content-muted font-mono">#{ticketId.slice(0, 6)}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {ticket.status?.replace('_', ' ')}
          </span>
        </div>
        <h1 className="text-lg font-semibold text-content-primary">{ticket.title}</h1>
        {ticket.description && (
          <p className="text-[13px] text-content-secondary mt-2 whitespace-pre-wrap">
            {ticket.description}
          </p>
        )}
        <p className="text-[11px] text-content-muted mt-2">
          Submitted {new Date(ticket.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Comments */}
      <div className="border-t border-border-subtle pt-4">
        <h2 className="text-sm font-medium text-content-primary mb-3">Comments</h2>

        <div className="space-y-3 mb-4">
          {comments?.filter((c: { is_internal: boolean }) => !c.is_internal).map((comment: { id: string; body: string; created_at: string; user?: { name: string } }) => (
            <div key={comment.id} className="border border-border-subtle rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium text-content-primary">
                  {comment.user?.name ?? 'Unknown'}
                </span>
                <span className="text-[10px] text-content-muted">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[13px] text-content-secondary whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))}
          {(!comments || comments.filter((c: { is_internal: boolean }) => !c.is_internal).length === 0) && (
            <p className="text-[12px] text-content-muted">No comments yet.</p>
          )}
        </div>

        {/* Add comment */}
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary resize-none"
          />
          <button
            onClick={() => addComment.mutate()}
            disabled={!newComment.trim() || addComment.isPending}
            className="px-3 py-1.5 text-[12px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {addComment.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}
