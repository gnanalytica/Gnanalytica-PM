'use client';

import { useState, useCallback } from 'react';
import { useProjectWorkflow, useUpdateWorkflow } from '@/lib/hooks/use-workflow';
import type { WorkflowStatus, StatusCategory } from '@/types';
import { STATUS_CATEGORIES } from '@/types';

const PRESET_COLORS = [
  '#6b7280', '#8b919a', '#6e9ade', '#5fae7e', '#c27070',
  '#c9a04e', '#9585c4', '#c47a9a', '#5ba8a0', '#c48a5a',
];

const WORKFLOW_TEMPLATES: { name: string; statuses: WorkflowStatus[] }[] = [
  {
    name: 'Kanban',
    statuses: [
      { key: 'backlog', label: 'Backlog', category: 'backlog', color: '#6b7280', position: 0 },
      { key: 'todo', label: 'To Do', category: 'unstarted', color: '#8b919a', position: 1 },
      { key: 'in_progress', label: 'In Progress', category: 'started', color: '#6e9ade', position: 2 },
      { key: 'done', label: 'Done', category: 'completed', color: '#5fae7e', position: 3 },
      { key: 'canceled', label: 'Canceled', category: 'canceled', color: '#c27070', position: 4 },
    ],
  },
  {
    name: 'Scrum',
    statuses: [
      { key: 'backlog', label: 'Backlog', category: 'backlog', color: '#6b7280', position: 0 },
      { key: 'todo', label: 'To Do', category: 'unstarted', color: '#8b919a', position: 1 },
      { key: 'in_progress', label: 'In Progress', category: 'started', color: '#6e9ade', position: 2 },
      { key: 'in_review', label: 'In Review', category: 'started', color: '#a78bfa', position: 3 },
      { key: 'qa', label: 'QA', category: 'started', color: '#c9a04e', position: 4 },
      { key: 'done', label: 'Done', category: 'completed', color: '#5fae7e', position: 5 },
      { key: 'canceled', label: 'Canceled', category: 'canceled', color: '#c27070', position: 6 },
    ],
  },
  {
    name: 'Bug Tracking',
    statuses: [
      { key: 'reported', label: 'Reported', category: 'backlog', color: '#c27070', position: 0 },
      { key: 'triaged', label: 'Triaged', category: 'unstarted', color: '#c9a04e', position: 1 },
      { key: 'investigating', label: 'Investigating', category: 'started', color: '#6e9ade', position: 2 },
      { key: 'fixing', label: 'Fixing', category: 'started', color: '#9585c4', position: 3 },
      { key: 'testing', label: 'Testing', category: 'started', color: '#c48a5a', position: 4 },
      { key: 'resolved', label: 'Resolved', category: 'completed', color: '#5fae7e', position: 5 },
      { key: 'wont_fix', label: "Won't Fix", category: 'canceled', color: '#6b7280', position: 6 },
    ],
  },
];

function generateKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function WorkflowEditor({ projectId }: { projectId: string }) {
  const workflow = useProjectWorkflow(projectId);
  const updateWorkflow = useUpdateWorkflow();

  const [statuses, setStatuses] = useState<WorkflowStatus[]>(workflow.statuses);
  const [transitions, setTransitions] = useState<Record<string, string[]> | null>(workflow.transitions);
  const [restrictTransitions, setRestrictTransitions] = useState(!!workflow.transitions);

  // New status form
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<StatusCategory>('started');
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);

  const [isDirty, setIsDirty] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const applyTemplate = (template: typeof WORKFLOW_TEMPLATES[number]) => {
    setStatuses(template.statuses);
    setTransitions(null);
    setRestrictTransitions(false);
    setShowTemplates(false);
    setIsDirty(true);
  };

  const handleAddStatus = () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = generateKey(label);
    if (statuses.some((s) => s.key === key)) return;

    const newStatus: WorkflowStatus = {
      key,
      label,
      category: newCategory,
      color: newColor,
      position: statuses.length,
    };
    setStatuses((prev) => [...prev, newStatus]);
    setNewLabel('');
    markDirty();
  };

  const handleRemoveStatus = (key: string) => {
    setStatuses((prev) => {
      const next = prev.filter((s) => s.key !== key);
      return next.map((s, i) => ({ ...s, position: i }));
    });
    if (transitions) {
      setTransitions((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[key];
        for (const k of Object.keys(next)) {
          next[k] = next[k].filter((t) => t !== key);
        }
        return next;
      });
    }
    markDirty();
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setStatuses((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, position: i }));
    });
    markDirty();
  };

  const handleMoveDown = (index: number) => {
    if (index >= statuses.length - 1) return;
    setStatuses((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, position: i }));
    });
    markDirty();
  };

  const handleCategoryChange = (key: string, category: StatusCategory) => {
    setStatuses((prev) =>
      prev.map((s) => (s.key === key ? { ...s, category } : s)),
    );
    markDirty();
  };

  const handleColorChange = (key: string, color: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.key === key ? { ...s, color } : s)),
    );
    markDirty();
  };

  const handleToggleRestrictTransitions = () => {
    const next = !restrictTransitions;
    setRestrictTransitions(next);
    if (next) {
      // Initialize: every status can go to any other
      const all = statuses.map((s) => s.key);
      const trans: Record<string, string[]> = {};
      for (const s of statuses) {
        trans[s.key] = all.filter((k) => k !== s.key);
      }
      setTransitions(trans);
    } else {
      setTransitions(null);
    }
    markDirty();
  };

  const handleToggleTransition = (from: string, to: string) => {
    if (!transitions) return;
    setTransitions((prev) => {
      if (!prev) return prev;
      const current = prev[from] ?? [];
      const next = current.includes(to)
        ? current.filter((k) => k !== to)
        : [...current, to];
      return { ...prev, [from]: next };
    });
    markDirty();
  };

  const handleSave = async () => {
    await updateWorkflow.mutateAsync({
      project_id: projectId,
      statuses,
      transitions: restrictTransitions ? transitions : null,
    });
    setIsDirty(false);
  };

  // Group statuses by category for display
  const groupedStatuses = STATUS_CATEGORIES.map((cat) => ({
    ...cat,
    statuses: statuses.filter((s) => s.category === cat.value),
  }));

  return (
    <div className="bg-surface-secondary rounded-sm p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Workflow Configuration</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-hover transition-colors duration-[120ms]"
            >
              Templates
            </button>
            {showTemplates && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowTemplates(false)} />
                <div className="absolute top-full right-0 mt-1 bg-white border border-border-subtle rounded-md shadow-lg z-30 py-1 min-w-[160px]">
                  {WORKFLOW_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => applyTemplate(tmpl)}
                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-hover transition-colors"
                    >
                      {tmpl.name}
                      <span className="text-[10px] text-gray-400 ml-1">
                        ({tmpl.statuses.length} statuses)
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || updateWorkflow.isPending}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors duration-[120ms]"
          >
            {updateWorkflow.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Current statuses grouped by category */}
      <div className="space-y-3">
        {groupedStatuses.map((group) => (
          <div key={group.value}>
            <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              {group.label}
            </h4>
            {group.statuses.length === 0 ? (
              <p className="text-[11px] text-gray-400 pl-2">No statuses</p>
            ) : (
              <div className="space-y-1">
                {group.statuses.map((status) => {
                  const globalIndex = statuses.findIndex((s) => s.key === status.key);
                  return (
                    <div
                      key={status.key}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md"
                    >
                      {/* Color swatch */}
                      <input
                        type="color"
                        value={status.color}
                        onChange={(e) => handleColorChange(status.key, e.target.value)}
                        className="w-5 h-5 rounded border border-border-subtle cursor-pointer p-0"
                        title="Change color"
                      />

                      {/* Label */}
                      <span className="text-xs font-medium text-gray-700 flex-1">
                        {status.label}
                      </span>

                      {/* Key badge */}
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {status.key}
                      </span>

                      {/* Category select */}
                      <select
                        value={status.category}
                        onChange={(e) => handleCategoryChange(status.key, e.target.value as StatusCategory)}
                        className="text-[11px] border border-border-subtle rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        {STATUS_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>

                      {/* Reorder buttons */}
                      <button
                        onClick={() => handleMoveUp(globalIndex)}
                        disabled={globalIndex <= 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5 rounded transition-colors duration-[120ms] cursor-pointer"
                        title="Move up"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(globalIndex)}
                        disabled={globalIndex >= statuses.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5 rounded transition-colors duration-[120ms] cursor-pointer"
                        title="Move down"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveStatus(status.key)}
                        className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors duration-[120ms] cursor-pointer"
                        title="Remove status"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new status */}
      <div className="border-t border-border-subtle pt-3">
        <h4 className="text-[11px] font-medium text-gray-500 mb-2">Add Status</h4>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-0.5">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. In Review"
              className="w-full border border-border-subtle rounded-md px-2.5 py-1.5 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStatus();
                }
              }}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as StatusCategory)}
              className="border border-border-subtle rounded-md px-2 py-1.5 text-xs cursor-pointer"
            >
              {STATUS_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Color</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 rounded border border-border-subtle cursor-pointer p-0"
            />
          </div>
          <button
            onClick={handleAddStatus}
            disabled={!newLabel.trim()}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-hover active:bg-hover disabled:opacity-50 transition-colors duration-[120ms]"
          >
            Add
          </button>
        </div>
      </div>

      {/* Transitions */}
      <div className="border-t border-border-subtle pt-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={restrictTransitions}
              onChange={handleToggleRestrictTransitions}
              className="rounded border-border-subtle text-blue-600 w-3.5 h-3.5"
            />
            <span className="text-xs font-medium text-gray-700">Restrict transitions</span>
          </label>
          <span className="text-[11px] text-gray-400">
            {restrictTransitions ? 'Only allowed transitions will be available' : 'All transitions are allowed'}
          </span>
        </div>

        {restrictTransitions && transitions && (
          <div className="overflow-x-auto">
            <table className="text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-gray-500 font-medium">From \ To</th>
                  {statuses.map((s) => (
                    <th key={s.key} className="px-2 py-1 text-center text-gray-500 font-medium">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statuses.map((from) => (
                  <tr key={from.key}>
                    <td className="px-2 py-1 text-gray-700 font-medium">{from.label}</td>
                    {statuses.map((to) => (
                      <td key={to.key} className="px-2 py-1 text-center">
                        {from.key === to.key ? (
                          <span className="text-gray-300">-</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={transitions[from.key]?.includes(to.key) ?? false}
                            onChange={() => handleToggleTransition(from.key, to.key)}
                            className="rounded border-border-subtle text-blue-600 w-3 h-3 cursor-pointer"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
