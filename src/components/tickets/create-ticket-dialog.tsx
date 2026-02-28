'use client';

import { useState } from 'react';
import { useCreateTicket } from '@/lib/hooks/use-tickets';
import { useLabels, useCreateLabel } from '@/lib/hooks/use-labels';
import { useMembers } from '@/lib/hooks/use-members';
import { useProjectWorkflow } from '@/lib/hooks/use-workflow';
import { TICKET_PRIORITIES } from '@/types';
import type { TicketPriority } from '@/types';

const LABEL_COLORS = ['#c27070', '#c48a5a', '#c9a04e', '#5fae7e', '#6e9ade', '#9585c4', '#c47a9a', '#8b919a'];

export function CreateTicketDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const workflow = useProjectWorkflow(projectId);
  const [status, setStatus] = useState(() => workflow.getDefaultStatusForCategory('unstarted'));
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const createTicket = useCreateTicket();
  const { data: labels } = useLabels(projectId);
  const { data: members } = useMembers();
  const createLabel = useCreateLabel();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTicket.mutateAsync({
      project_id: projectId,
      title,
      description: description || undefined,
      status,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      label_ids: selectedLabels,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus(workflow.getDefaultStatusForCategory('unstarted'));
    setPriority('medium');
    setAssigneeId('');
    setDueDate('');
    setSelectedLabels([]);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const label = await createLabel.mutateAsync({
      project_id: projectId,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    setSelectedLabels((prev) => [...prev, label.id]);
    setNewLabelName('');
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-secondary rounded-md border border-border-subtle w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto animate-fade-in">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Create Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-md px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1.5 text-xs cursor-pointer"
              >
                {workflow.statuses.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full border rounded-md px-2.5 py-1.5 text-xs cursor-pointer"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1.5 text-xs cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Labels</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels?.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    selectedLabels.includes(label.id)
                      ? 'ring-1 ring-offset-1 ring-blue-500'
                      : ''
                  }`}
                  style={{ backgroundColor: label.color + '15', color: label.color, borderColor: label.color }}
                >
                  {label.name}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="New label"
                className="flex-1 border rounded-md px-2.5 py-1 text-xs"
              />
              <select
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs cursor-pointer"
              >
                {LABEL_COLORS.map((c) => (
                  <option key={c} value={c} style={{ color: c }}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim()}
                className="px-2.5 py-1 text-xs bg-gray-100 rounded-md hover:bg-hover active:bg-hover disabled:opacity-50 transition-colors duration-[120ms]"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-3 py-1.5 text-xs text-gray-700 hover:bg-hover active:bg-hover rounded-md transition-colors duration-[120ms]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTicket.isPending || !title.trim()}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors duration-[120ms]"
            >
              {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
