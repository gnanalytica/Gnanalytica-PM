"use client";

import { useCallback } from "react";
import { TICKET_PRIORITIES } from "@/types";
import { IssueTypePicker } from "@/components/tickets/issue-type-picker";
import { StoryPointsPicker } from "@/components/tickets/story-points-picker";
import { AssigneePicker } from "@/components/tickets/assignee-picker";
import type { TicketPriority } from "@/types";
import type { useTicketActions } from "@/lib/hooks/use-ticket-actions";

const PRIORITY_CHIP: Record<TicketPriority, string> = {
  urgent: "bg-[#c27070]/10 text-[#c27070]",
  high: "bg-[#c48a5a]/10 text-[#c48a5a]",
  medium: "bg-[#c9a04e]/10 text-[#c9a04e]",
  low: "bg-surface-secondary text-content-muted",
};

type Actions = ReturnType<typeof useTicketActions>;

export function PropertyBadges({ actions, readOnly }: { actions: Actions; readOnly?: boolean }) {
  const {
    ticket,
    workflow,
    milestones,
    members,
    selectedAssignees,
    openDropdown,
    setOpenDropdown,
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeToggle,
    handleAssigneesClear,
    handleDueDateChange,
    handleIssueTypeChange,
    handleStoryPointsChange,
    handleMilestoneChange,
  } = actions;

  // Single toggle helper — opening any dropdown closes all others
  const toggleDropdown = useCallback(
    (key: typeof openDropdown) => {
      if (readOnly) return;
      setOpenDropdown(openDropdown === key ? null : key);
    },
    [readOnly, openDropdown, setOpenDropdown],
  );

  if (!ticket) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-5 py-2">
      {/* Status badge */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => toggleDropdown("status")}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 ${readOnly ? "cursor-default" : "hover:bg-hover hover:shadow-xs active:scale-[0.96] cursor-pointer"} ${openDropdown === "status" ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200"
            style={{ backgroundColor: workflow.getStatusColor(ticket.status) }}
          />
          {workflow.getStatusLabel(ticket.status)}
        </button>
        {openDropdown === "status" && !readOnly && (
          <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 min-w-[160px] py-1 shadow-lg">
            {workflow.statuses.map((s) => {
              const allowed = workflow.isTransitionAllowed(ticket.status, s.key);
              const isActive = ticket.status === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => allowed && handleStatusChange(s.key)}
                  disabled={!allowed}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? "bg-accent-soft text-accent"
                      : allowed
                        ? "text-content-secondary hover:bg-hover"
                        : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Priority badge */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => toggleDropdown("priority")}
          className={`px-2 py-1 rounded-md text-[12px] font-medium border border-border-subtle transition-all duration-150 ${readOnly ? "cursor-default" : "hover:shadow-xs active:scale-[0.96] cursor-pointer"} ${openDropdown === "priority" ? "ring-1 ring-accent/40 shadow-xs" : ""} ${PRIORITY_CHIP[ticket.priority]}`}
        >
          {TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label ?? ticket.priority}
        </button>
        {openDropdown === "priority" && !readOnly && (
          <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 min-w-[140px] py-1 shadow-lg">
            {TICKET_PRIORITIES.map((p) => {
              const isActive = ticket.priority === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-content-secondary hover:bg-hover"
                  }`}
                >
                  <span className={`w-4 text-center rounded px-0.5 text-[10px] font-medium ${PRIORITY_CHIP[p.value]}`}>
                    {p.label[0]}
                  </span>
                  {p.label}
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignee badge (multi-assign) — controlled by shared openDropdown */}
      <AssigneePicker
        selectedIds={selectedAssignees.map((a: { id: string }) => a.id)}
        members={members ?? []}
        onToggle={handleAssigneeToggle}
        onClear={handleAssigneesClear}
        readOnly={readOnly}
        isOpen={openDropdown === "assignee"}
        onToggleOpen={() => toggleDropdown("assignee")}
      />

      {/* Due date badge */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => toggleDropdown("duedate")}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 ${readOnly ? "cursor-default" : "hover:bg-hover hover:shadow-xs active:scale-[0.96] cursor-pointer"} ${openDropdown === "duedate" ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
        >
          <svg className="w-3 h-3 text-content-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {ticket.due_date ? (
            new Date(ticket.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
          ) : (
            <span className="text-content-muted">No due date</span>
          )}
        </button>
        {openDropdown === "duedate" && !readOnly && (
          <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 p-2 shadow-lg">
            <input
              type="date"
              value={ticket.due_date ?? ""}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="border border-border-subtle rounded-md px-2 py-1 text-xs bg-surface-secondary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              autoFocus
            />
            {ticket.due_date && (
              <button
                onClick={() => { handleDueDateChange(""); setOpenDropdown(null); }}
                className="mt-1 w-full text-xs text-content-muted hover:text-content-secondary py-1 transition-all duration-150 active:scale-[0.98] rounded hover:bg-hover"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Milestone badge */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => toggleDropdown("milestone")}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bg-surface-secondary border border-border-subtle transition-all duration-150 ${readOnly ? "cursor-default" : "hover:bg-hover hover:shadow-xs active:scale-[0.96] cursor-pointer"} ${openDropdown === "milestone" ? "ring-1 ring-accent/40 shadow-xs" : ""}`}
        >
          <svg className="w-3 h-3 text-content-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          {ticket.milestone ? (
            <span className="truncate max-w-[80px]">{ticket.milestone.name}</span>
          ) : (
            <span className="text-content-muted">No milestone</span>
          )}
        </button>
        {openDropdown === "milestone" && !readOnly && (
          <div className="animate-dropdown-in absolute left-0 top-full mt-1 bg-surface-tertiary border border-border-subtle rounded-lg z-20 min-w-[180px] max-h-48 overflow-y-auto py-1 shadow-lg">
            <button
              onClick={() => handleMilestoneChange("")}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.98] ${
                !ticket.milestone_id ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-hover"
              }`}
            >
              None
              {!ticket.milestone_id && (
                <svg className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMilestoneChange(m.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-150 active:scale-[0.98] ${
                  ticket.milestone_id === m.id ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-hover"
                }`}
              >
                {m.name}
                {ticket.milestone_id === m.id && (
                  <svg className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type picker — controlled by shared openDropdown */}
      <IssueTypePicker
        value={ticket.issue_type ?? "task"}
        onChange={(type) => { handleIssueTypeChange(type); setOpenDropdown(null); }}
        isOpen={openDropdown === "issuetype"}
        onToggle={() => toggleDropdown("issuetype")}
      />

      {/* Story Points picker — controlled by shared openDropdown */}
      <StoryPointsPicker
        value={ticket.story_points ?? null}
        onChange={(pts) => { handleStoryPointsChange(pts); setOpenDropdown(null); }}
        isOpen={openDropdown === "storypoints"}
        onToggle={() => toggleDropdown("storypoints")}
      />
    </div>
  );
}
