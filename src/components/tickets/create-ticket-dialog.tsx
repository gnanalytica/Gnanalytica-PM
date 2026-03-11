"use client";

import { useState } from "react";
import { useCreateTicket } from "@/lib/hooks/use-tickets";
import { useLabels, useCreateLabel } from "@/lib/hooks/use-labels";
import { useMembers } from "@/lib/hooks/use-members";
import { AssigneePicker } from "@/components/tickets/assignee-picker";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { useProjectMilestones } from "@/lib/hooks/use-milestones";
import { TICKET_PRIORITIES, ISSUE_TYPES, STORY_POINTS } from "@/types";
import type { TicketPriority, IssueType } from "@/types";

const LABEL_COLORS = [
  "#c27070",
  "#c48a5a",
  "#c9a04e",
  "#5fae7e",
  "#6e9ade",
  "#9585c4",
  "#c47a9a",
  "#8b919a",
];

export function CreateTicketDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const workflow = useProjectWorkflow(projectId);
  const [status, setStatus] = useState(() =>
    workflow.getDefaultStatusForCategory("unstarted"),
  );
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [issueType, setIssueType] = useState<IssueType>("task");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [milestoneId, setMilestoneId] = useState("");

  const createTicket = useCreateTicket();
  const { data: labels } = useLabels(projectId);
  const { data: members } = useMembers();
  const createLabel = useCreateLabel();
  const milestones = useProjectMilestones(projectId);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTicket.mutateAsync({
      project_id: projectId,
      title,
      description: description || undefined,
      status,
      priority,
      assignee_id: assigneeIds[0] || null,
      assignee_ids: assigneeIds,
      due_date: dueDate || null,
      label_ids: selectedLabels,
      issue_type: issueType,
      story_points: storyPoints ? Number(storyPoints) : null,
      start_date: startDate || null,
      milestone_id: milestoneId || null,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(workflow.getDefaultStatusForCategory("unstarted"));
    setPriority("medium");
    setAssigneeIds([]);
    setDueDate("");
    setSelectedLabels([]);
    setIssueType("task");
    setStoryPoints("");
    setStartDate("");
    setMilestoneId("");
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const label = await createLabel.mutateAsync({
      project_id: projectId,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    setSelectedLabels((prev) => [...prev, label.id]);
    setNewLabelName("");
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-overlay-in">
      <div className="bg-surface-primary rounded-t-2xl sm:rounded-2xl border border-border-subtle w-full sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto animate-modal-in shadow-overlay">
        <h2 className="text-base font-semibold text-content-primary mb-4 tracking-tight">
          Create Issue
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-0.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-0.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs cursor-pointer bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                {workflow.statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs cursor-pointer bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs cursor-pointer bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Story Points
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs cursor-pointer bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                <option value="">None</option>
                {STORY_POINTS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Milestone
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs cursor-pointer bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                <option value="">None</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Assignees
              </label>
              <AssigneePicker
                selectedIds={assigneeIds}
                members={members ?? []}
                onToggle={(userId) =>
                  setAssigneeIds((prev) =>
                    prev.includes(userId)
                      ? prev.filter((id) => id !== userId)
                      : [...prev, userId],
                  )
                }
                onClear={() => setAssigneeIds([])}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-0.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-3 py-2 text-xs bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-0.5">
              Labels
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels?.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition-all duration-150 active:scale-[0.96] ${
                    selectedLabels.includes(label.id)
                      ? "ring-1 ring-offset-1 ring-blue-500"
                      : ""
                  }`}
                  style={{
                    backgroundColor: label.color + "15",
                    color: label.color,
                    borderColor: label.color,
                  }}
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
                className="flex-1 border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs bg-surface-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
              <select
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="border border-border-subtle rounded-lg px-2 py-1.5 text-xs cursor-pointer bg-surface-primary"
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
                className="px-2.5 py-1 text-xs bg-surface-tertiary text-content-secondary rounded-md hover:bg-hover active:bg-hover active:scale-[0.96] disabled:opacity-50 transition-all duration-150"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-subtle mt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-content-secondary hover:bg-hover active:scale-[0.96] rounded-lg transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTicket.isPending || !title.trim()}
              className="px-4 py-2 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover active:scale-[0.97] disabled:opacity-50 transition-all shadow-sm"
            >
              {createTicket.isPending ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
