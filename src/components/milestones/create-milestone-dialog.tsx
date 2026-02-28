'use client';

import { useState } from 'react';
import { useCreateMilestone } from '@/lib/hooks/use-milestones';

export function CreateMilestoneDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const createMilestone = useCreateMilestone();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMilestone.mutateAsync({
      project_id: projectId,
      name,
      description: description || undefined,
      target_date: targetDate || undefined,
    });
    setName('');
    setDescription('');
    setTargetDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-secondary rounded-md border border-border-subtle w-full max-w-md p-5 animate-fade-in">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Create Milestone</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border rounded-md px-2.5 py-1.5 text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-md px-2.5 py-1.5 text-sm" rows={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Target Date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full border rounded-md px-2.5 py-1.5 text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-700 hover:bg-hover rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={!name.trim() || createMilestone.isPending} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {createMilestone.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
