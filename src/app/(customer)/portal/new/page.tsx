'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

export default function NewCustomerTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const submitTicket = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Look up or create customer user
      let { data: customerUser } = await supabase
        .from('customer_users')
        .select('id, org_id')
        .eq('email', user.email)
        .maybeSingle();

      if (!customerUser) {
        // Auto-create customer user
        const { data: newUser, error: createErr } = await supabase
          .from('customer_users')
          .insert({
            email: user.email!,
            name: user.user_metadata?.name ?? user.email,
          })
          .select('id, org_id')
          .single();
        if (createErr) throw createErr;
        customerUser = newUser;
      }

      const { data, error } = await supabase
        .from('customer_tickets')
        .insert({
          title: title.trim(),
          description: description.trim(),
          priority,
          submitted_by: customerUser!.id,
          org_id: customerUser!.org_id,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      router.push(`/portal/${data.id}`);
    },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-content-primary mb-4">Submit a Ticket</h1>

      <div className="space-y-4">
        <div>
          <label className="text-[12px] font-medium text-content-primary block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your issue..."
            className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary"
          />
        </div>

        <div>
          <label className="text-[12px] font-medium text-content-primary block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={6}
            className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary resize-none"
          />
        </div>

        <div>
          <label className="text-[12px] font-medium text-content-primary block mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button
          onClick={() => submitTicket.mutate()}
          disabled={!title.trim() || submitTicket.isPending}
          className="px-4 py-2 text-[13px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
        </button>

        {submitTicket.isError && (
          <p className="text-[12px] text-red-500">Failed to submit. Please try again.</p>
        )}
      </div>
    </div>
  );
}
