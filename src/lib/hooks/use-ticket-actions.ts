"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useUpdateTicket,
  useStoreTicket,
  useHydrateTicket,
} from "@/lib/hooks/use-tickets";
import { useMembers } from "@/lib/hooks/use-members";
import { useLabels, useCreateLabel } from "@/lib/hooks/use-labels";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { useProjectMilestones } from "@/lib/hooks/use-milestones";
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

type DropdownType =
  | null
  | "status"
  | "priority"
  | "assignee"
  | "duedate"
  | "milestone"
  | "issuetype"
  | "storypoints";

export function useTicketActions(ticketId: string | null) {
  const { isLoading } = useHydrateTicket(ticketId ?? "");
  const ticket = useStoreTicket(ticketId ?? "");
  const { data: members } = useMembers();
  const { data: projectLabels } = useLabels(ticket?.project_id ?? "");
  const updateTicket = useUpdateTicket();
  const createLabel = useCreateLabel();
  const workflow = useProjectWorkflow(ticket?.project_id);
  const milestones = useProjectMilestones(ticket?.project_id ?? "");

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  // Reset state when ticket changes
  useEffect(() => {
    setEditingTitle(false);
    setEditingDesc(false);
    setOpenDropdown(null);
    setShowLabelInput(false);
  }, [ticketId]);

  // Click outside dropdown closes it
  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  const startEditingTitle = useCallback(() => {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditingTitle(true);
  }, [ticket]);

  const saveTitle = useCallback(async () => {
    if (!ticket || !editTitle.trim()) {
      setEditingTitle(false);
      return;
    }
    if (editTitle.trim() !== ticket.title) {
      await updateTicket.mutateAsync({
        id: ticket.id,
        project_id: ticket.project_id,
        title: editTitle.trim(),
      });
    }
    setEditingTitle(false);
  }, [ticket, editTitle, updateTicket]);

  const startEditingDesc = useCallback(() => {
    if (!ticket) return;
    setEditDescription(ticket.description ?? "");
    setEditingDesc(true);
  }, [ticket]);

  const saveDesc = useCallback(async () => {
    if (!ticket) {
      setEditingDesc(false);
      return;
    }
    const newDesc = editDescription.trim();
    if (newDesc !== (ticket.description ?? "")) {
      await updateTicket.mutateAsync({
        id: ticket.id,
        project_id: ticket.project_id,
        description: newDesc || undefined,
      });
    }
    setEditingDesc(false);
  }, [ticket, editDescription, updateTicket]);

  const handleStatusChange = useCallback(
    (status: string) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        status,
      });
      setOpenDropdown(null);
    },
    [ticket, updateTicket],
  );

  const handlePriorityChange = useCallback(
    (priority: TicketPriority) => {
      if (!ticket || ticket.priority === priority) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        priority,
      });
      setOpenDropdown(null);
    },
    [ticket, updateTicket],
  );

  const handleAssigneeChange = useCallback(
    (assigneeId: string) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        assignee_id: assigneeId || null,
      });
      setOpenDropdown(null);
    },
    [ticket, updateTicket],
  );

  const handleAssigneeToggle = useCallback(
    (userId: string) => {
      if (!ticket) return;
      const currentIds =
        ticket.assignees?.map((a) => a.user?.id).filter(Boolean) as string[] ??
        (ticket.assignee_id ? [ticket.assignee_id] : []);
      const newIds = currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId];
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        assignee_ids: newIds,
      });
    },
    [ticket, updateTicket],
  );

  const handleAssigneesClear = useCallback(() => {
    if (!ticket) return;
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      assignee_ids: [],
    });
    setOpenDropdown(null);
  }, [ticket, updateTicket]);

  const handleDueDateChange = useCallback(
    (dueDate: string) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        due_date: dueDate || null,
      });
    },
    [ticket, updateTicket],
  );

  const handleIssueTypeChange = useCallback(
    (issueType: IssueType) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        issue_type: issueType,
      });
    },
    [ticket, updateTicket],
  );

  const handleStoryPointsChange = useCallback(
    (points: number | null) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        story_points: points,
      });
    },
    [ticket, updateTicket],
  );

  const handleStartDateChange = useCallback(
    (startDate: string) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        start_date: startDate || null,
      });
    },
    [ticket, updateTicket],
  );

  const handleMilestoneChange = useCallback(
    (milestoneId: string) => {
      if (!ticket) return;
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        milestone_id: milestoneId || null,
      });
      setOpenDropdown(null);
    },
    [ticket, updateTicket],
  );

  const handleLabelToggle = useCallback(
    (labelId: string) => {
      if (!ticket) return;
      const currentIds = ticket.labels?.map((l) => l.id) ?? [];
      const newIds = currentIds.includes(labelId)
        ? currentIds.filter((id) => id !== labelId)
        : [...currentIds, labelId];
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        label_ids: newIds,
      });
    },
    [ticket, updateTicket],
  );

  const handleCreateLabel = useCallback(async () => {
    if (!ticket || !newLabelName.trim()) return;
    const label = await createLabel.mutateAsync({
      project_id: ticket.project_id,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    const currentIds = ticket.labels?.map((l) => l.id) ?? [];
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      label_ids: [...currentIds, label.id],
    });
    setNewLabelName("");
    setShowLabelInput(false);
  }, [ticket, newLabelName, newLabelColor, createLabel, updateTicket]);

  const selectedAssignees = (ticket?.assignees ?? [])
    .map((a) => a.user)
    .filter(Boolean);
  const selectedAssignee =
    selectedAssignees[0] ??
    members?.find((m) => m.id === ticket?.assignee_id) ??
    null;

  return {
    ticket,
    isLoading,
    members,
    projectLabels,
    workflow,
    milestones,
    selectedAssignee,
    selectedAssignees,
    createLabel,
    // Editing state
    editingTitle,
    setEditingTitle,
    editingDesc,
    setEditingDesc,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    openDropdown,
    setOpenDropdown,
    showLabelInput,
    setShowLabelInput,
    newLabelName,
    setNewLabelName,
    newLabelColor,
    setNewLabelColor,
    // Actions
    startEditingTitle,
    saveTitle,
    startEditingDesc,
    saveDesc,
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeChange,
    handleAssigneeToggle,
    handleAssigneesClear,
    handleDueDateChange,
    handleIssueTypeChange,
    handleStoryPointsChange,
    handleStartDateChange,
    handleMilestoneChange,
    handleLabelToggle,
    handleCreateLabel,
  };
}

export { LABEL_COLORS };
export type { DropdownType };
