'use client';

import { useState } from 'react';
import { useCreateCycle } from '@/lib/hooks/use-cycles';
import type { Cycle } from '@/types';

export function CreateCycleDialog({
  open,
  onClose,
  projectId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated?: (cycle: Cycle) => void;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createCycle = useCreateCycle();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !startDate || !endDate) {
      setError('Name and dates are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date.');
      return;
    }
    try {
      const cycle = await createCycle.mutateAsync({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        project_id: projectId,
      });
      setName('');
      setStartDate('');
      setEndDate('');
      onClose();
      onCreated?.(cycle as Cycle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cycle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-secondary rounded-md border border-border-subtle w-full max-w-md p-5 animate-fade-in">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Create Cycle</h2>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded mb-3" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              placeholder="e.g. Sprint 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 hover:bg-hover active:bg-hover rounded-md transition-colors duration-[120ms]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCycle.isPending || !name.trim() || !startDate || !endDate}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors duration-[120ms]"
            >
              {createCycle.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
