"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTicketActions, LABEL_COLORS } from "@/lib/hooks/use-ticket-actions";
import { useDeleteTicket } from "@/lib/hooks/use-tickets";
import { useContextMenu } from "@/components/context-menu";
import { PropertyBadges } from "@/components/tickets/property-badges";
import { ActivityTimeline } from "@/components/tickets/activity-timeline";
import { CommentList } from "@/components/comments/comment-list";
import { SubTaskList } from "@/components/tickets/sub-task-list";
import { RelationsPanel } from "@/components/tickets/relations-panel";
import { AttachmentsPanel } from "@/components/tickets/attachments-panel";
import { CustomFieldsPanel } from "@/components/tickets/custom-fields-panel";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { SLABadge } from "@/components/sla/sla-badge";
import { TimerWidget } from "@/components/time-tracking/timer-widget";
import { FavoriteStar } from "@/components/favorites/favorite-star";
import { useCurrentProjectRole } from "@/lib/hooks/use-current-role";
import { PERMISSIONS } from "@/lib/permissions";
import {
  CollapsibleSection,
  useCollapsedSections,
} from "@/components/collapsible-section";

function shortId(id: string) {
  return `PM-${id.slice(0, 4).toUpperCase()}`;
}

export function TicketDetailPanel({
  ticketId,
  onClose,
  onTicketNavigate,
}: {
  ticketId: string;
  onClose: () => void;
  onTicketNavigate?: (id: string) => void;
}) {
  const actions = useTicketActions(ticketId);
  const deleteTicket = useDeleteTicket();
  const { isCollapsed, toggle: toggleSection } = useCollapsedSections("pm-detail-sections");
  const { role, isLoading: roleLoading } = useCurrentProjectRole(actions.ticket?.project_id);
  const canEdit = roleLoading || PERMISSIONS.canEditTicket(role);
  const { onContextMenu: onHeaderContextMenu, contextMenu: headerContextMenu } = useContextMenu(() => [
    { type: "item", label: "Copy ID", onClick: () => navigator.clipboard.writeText(`PM-${ticketId.slice(0, 4).toUpperCase()}`) },
    { type: "item", label: "Copy link", onClick: () => navigator.clipboard.writeText(`${window.location.origin}/ticket/${ticketId}`) },
    { type: "separator" },
    { type: "item", label: "Open in new tab", onClick: () => window.open(`/ticket/${ticketId}`, "_blank") },
    { type: "separator" },
    { type: "item", label: "Delete", danger: true, onClick: () => { deleteTicket.mutate({ id: ticketId, project_id: actions.ticket?.project_id ?? "" }); onClose(); } },
  ]);
  const {
    ticket,
    isLoading,
    workflow,
    projectLabels,
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
    startEditingTitle,
    saveTitle,
    startEditingDesc,
    saveDesc,
    handleLabelToggle,
    handleCreateLabel,
    handleStartDateChange,
    createLabel,
  } = actions;

  // Layered escape key: close dropdown → cancel edit → close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openDropdown) {
          setOpenDropdown(null);
        } else if (editingTitle || editingDesc) {
          setEditingTitle(false);
          setEditingDesc(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    onClose,
    openDropdown,
    editingTitle,
    editingDesc,
    setOpenDropdown,
    setEditingTitle,
    setEditingDesc,
  ]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col animate-panel-in">
        <div className="flex items-center justify-between px-5 h-11 border-b border-border-subtle flex-shrink-0">
          <div className="h-3 bg-surface-secondary animate-shimmer rounded w-20" />
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-secondary active:scale-[0.95] rounded transition-all duration-150 p-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-5 pt-4 space-y-3">
          <div className="h-5 bg-surface-secondary animate-shimmer rounded w-3/4" />
          <div className="space-y-1">
            <div className="h-3 bg-surface-secondary animate-shimmer rounded w-full" />
            <div className="h-3 bg-surface-secondary animate-shimmer rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-full flex flex-col animate-panel-in">
        <div className="flex items-center justify-between px-5 h-11 border-b border-border-subtle flex-shrink-0">
          <span className="text-[12px] text-content-muted">Not found</span>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-secondary active:scale-[0.95] rounded transition-all duration-150 p-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm text-content-muted text-center py-8">
          Ticket not found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-panel-in">
      {/* Toolbar header */}
      <div className="flex items-center justify-between px-5 h-11 border-b border-border-subtle flex-shrink-0" onContextMenu={onHeaderContextMenu}>
        <div className="flex items-center gap-2">
          <FavoriteStar itemType="ticket" itemId={ticket.id} />
          <span className="text-[11px] font-mono text-content-muted">
            {shortId(ticket.id)}
          </span>
          <Link
            href={`/ticket/${ticketId}`}
            target="_blank"
            rel="noopener"
            className="text-[11px] text-content-muted hover:text-accent transition-colors duration-[120ms]"
          >
            Open &rarr;
          </Link>
        </div>
        {headerContextMenu}
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="text-content-muted hover:text-content-secondary active:text-content-primary active:scale-[0.95] rounded transition-all duration-[120ms] p-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Property badges + SLA */}
        <PropertyBadges actions={actions} readOnly={!canEdit} />
        <div className="px-5 pb-1">
          <SLABadge ticket={ticket} />
        </div>

        {/* Title section — enhanced typography with 32px heading per design spec */}
        <div className="px-6 py-8 border-b border-border-subtle">
          {editingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingTitle(false);
                }
              }}
              className="w-full bg-transparent border-b-2 border-accent outline-none py-1 text-content-primary leading-tight type-h1"
              autoFocus
            />
          ) : (
            <h1
              className={`type-h1 text-content-primary rounded px-2 -mx-2 py-1 transition-colors ${canEdit ? "cursor-text hover:bg-hover" : ""}`}
              onClick={canEdit ? startEditingTitle : undefined}
            >
              {ticket.title}
            </h1>
          )}
        </div>

        {/* Description section — enhanced with WYSIWYG-like editor */}
        <div className="px-6 py-6 border-b border-border-subtle">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-content-secondary">Description</h2>
            {editingDesc && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-soft animate-pulse" title="Unsaved changes" />}
          </div>
          {editingDesc ? (
            <div className="space-y-2">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={saveDesc}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingDesc(false);
                  }
                }}
                className="w-full min-h-[200px] text-sm bg-surface-secondary border border-accent rounded-md outline-none resize-none px-4 py-3 text-content-primary placeholder-content-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-150"
                placeholder="Add a description..."
                autoFocus
              />
              <p className="text-[11px] text-content-muted">Supports markdown: **bold**, *italic*, `code`, [links](url)</p>
            </div>
          ) : ticket.description ? (
            <div
              className={`rounded-md px-4 py-3 transition-colors bg-surface-secondary min-h-[100px] flex items-start ${canEdit ? "cursor-text hover:bg-hover" : ""}`}
              onClick={canEdit ? startEditingDesc : undefined}
            >
              <MarkdownRenderer content={ticket.description} />
            </div>
          ) : (
            <p
              className={`text-sm rounded-md px-4 py-3 transition-colors text-content-muted bg-surface-secondary min-h-[100px] flex items-center ${canEdit ? "cursor-text hover:bg-hover" : ""}`}
              onClick={canEdit ? startEditingDesc : undefined}
            >
              {canEdit ? "Click to add a description..." : "No description"}
            </p>
          )}
        </div>

        {/* Labels section */}
        {(ticket.labels && ticket.labels.length > 0 || canEdit) && (
          <div className="px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-1 flex-wrap">
              {ticket.labels &&
                ticket.labels.length > 0 &&
                ticket.labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => canEdit && handleLabelToggle(label.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${canEdit ? "active:scale-[0.95] hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                    style={{
                      backgroundColor: label.color + "20",
                      color: label.color,
                    }}
                    title={canEdit ? `Remove ${label.name}` : label.name}
                  >
                    {label.name}
                  </button>
                ))}
              {canEdit && (
                <button
                  onClick={() => setShowLabelInput(!showLabelInput)}
                  className={`text-content-muted hover:text-content-secondary active:scale-[0.96] transition-all duration-150 text-xs px-2 py-1 rounded-md hover:bg-hover ${showLabelInput ? "bg-hover text-content-secondary" : ""}`}
                >
                  + Label
                </button>
              )}
            </div>

            {showLabelInput && canEdit && (
              <div className="mt-3 space-y-2">
                {projectLabels && projectLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {projectLabels.map((label) => {
                      const isSelected =
                        ticket.labels?.some((l) => l.id === label.id) ?? false;
                      return (
                        <button
                          key={label.id}
                          onClick={() => handleLabelToggle(label.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all duration-150 active:scale-[0.96] ${
                            isSelected
                              ? "ring-1 ring-offset-1 ring-accent"
                              : "opacity-50 hover:opacity-80"
                          }`}
                          style={{
                            backgroundColor: label.color + "15",
                            color: label.color,
                            borderColor: label.color + (isSelected ? "" : "40"),
                          }}
                        >
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="New label"
                    className="flex-1 border border-border-subtle rounded-md px-2.5 py-1 text-xs bg-surface-secondary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateLabel();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setShowLabelInput(false);
                      }
                    }}
                  />
                  <select
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="border border-border-subtle rounded-md px-1.5 py-1 text-xs cursor-pointer bg-surface-secondary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                  >
                    {LABEL_COLORS.map((c) => (
                      <option key={c} value={c} style={{ color: c }}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateLabel}
                    disabled={!newLabelName.trim() || createLabel.isPending}
                    className="px-2.5 py-1 text-xs bg-accent text-white rounded-md hover:opacity-90 active:scale-[0.96] disabled:opacity-50 transition-all duration-150"
                  >
                    {createLabel.isPending ? "..." : "Add"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start date section */}
        {canEdit && (
          <div className="px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <label htmlFor="start-date" className="text-xs font-medium text-content-secondary">Start date</label>
              <input
                id="start-date"
                type="date"
                value={ticket.start_date ?? ""}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={!canEdit}
                className="border border-border-subtle rounded-md px-3 py-2 text-sm bg-surface-secondary text-content-primary cursor-pointer outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:cursor-default disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Sub-tasks */}
        <CollapsibleSection
          id="subtasks"
          title="Sub-tasks"
          isCollapsed={isCollapsed("subtasks")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <SubTaskList
            parentId={ticket.id}
            projectId={ticket.project_id}
            onTicketClick={(id) => {
              if (onTicketNavigate) {
                onTicketNavigate(id);
              }
            }}
          />
        </CollapsibleSection>

        {/* Relations */}
        <CollapsibleSection
          id="relations"
          title="Relations"
          isCollapsed={isCollapsed("relations")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <RelationsPanel ticketId={ticket.id} projectId={ticket.project_id} />
        </CollapsibleSection>

        {/* Attachments */}
        <CollapsibleSection
          id="attachments"
          title="Attachments"
          isCollapsed={isCollapsed("attachments")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <AttachmentsPanel ticketId={ticket.id} />
        </CollapsibleSection>

        {/* Custom Fields */}
        <CollapsibleSection
          id="custom-fields"
          title="Custom Fields"
          isCollapsed={isCollapsed("custom-fields")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <CustomFieldsPanel
            ticketId={ticket.id}
            projectId={ticket.project_id}
          />
        </CollapsibleSection>

        {/* Time Tracking */}
        <CollapsibleSection
          id="time-tracking"
          title="Time Tracking"
          isCollapsed={isCollapsed("time-tracking")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <TimerWidget ticketId={ticket.id} />
        </CollapsibleSection>

        {/* Creator info */}
        <div className="px-5 py-2 border-t border-border-subtle">
          <p className="text-[11px] text-content-muted">
            Created by {ticket.creator?.name ?? "Unknown"} on{" "}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>

        {/* Activity */}
        <CollapsibleSection
          id="activity"
          title="Activity"
          isCollapsed={isCollapsed("activity")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <ActivityTimeline
            ticketId={ticket.id}
            workflowStatuses={workflow.statuses}
          />
        </CollapsibleSection>

        {/* Comments */}
        <CollapsibleSection
          id="comments"
          title="Comments"
          isCollapsed={isCollapsed("comments")}
          onToggle={toggleSection}
          className="border-t border-border-subtle"
        >
          <CommentList ticketId={ticket.id} assigneeId={ticket.assignee_id} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
