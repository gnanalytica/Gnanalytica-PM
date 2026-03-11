"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommentList } from "@/components/comments/comment-list";
import { WatchButton } from "@/components/tickets/watch-button";
import {
  useHydrateTicket,
  useUpdateTicket,
  useDeleteTicket,
  useStoreTicket,
} from "@/lib/hooks/use-tickets";
import { useMembers } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/hooks/use-auth";
import { ensureWatching } from "@/lib/hooks/use-watchers";
import { useProjectWorkflow } from "@/lib/hooks/use-workflow";
import { TICKET_PRIORITIES } from "@/types";
import type { TicketPriority } from "@/types";

export default function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  // Hydrate: fetch ticket into store; read from store for optimistic updates
  const { isLoading } = useHydrateTicket(ticketId);
  const ticket = useStoreTicket(ticketId);
  const { data: members } = useMembers();
  const { user } = useAuth();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const workflow = useProjectWorkflow(ticket?.project_id);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-secondary rounded-md p-4">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-surface-secondary rounded-md p-3 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-2.5 bg-gray-200 rounded w-12 mb-1" />
                  <div className="h-7 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <p className="text-center py-12 text-content-muted">Ticket not found.</p>
    );
  }

  const startEditing = () => {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description ?? "");
    setIsEditing(true);
  };

  const saveEdits = async () => {
    await updateTicket.mutateAsync({
      id: ticket.id,
      project_id: ticket.project_id,
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleStatusChange = (status: string) => {
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      status,
    });
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      priority,
    });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const newAssigneeId = assigneeId || null;
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      assignee_id: newAssigneeId,
    });

    // Create notification for new assignee + auto-watch
    if (newAssigneeId) {
      import("@/lib/supabase-browser").then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
          if (currentUser && newAssigneeId !== currentUser.id) {
            supabase.from("notifications").insert({
              user_id: newAssigneeId,
              ticket_id: ticket.id,
              type: "ticket_assigned",
              actor_id: currentUser.id,
            });
          }
          // Auto-watch the new assignee
          ensureWatching(ticket.id, newAssigneeId);
        });
      });
    }
  };

  const handleDueDateChange = (dueDate: string) => {
    updateTicket.mutate({
      id: ticket.id,
      project_id: ticket.project_id,
      due_date: dueDate || null,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this ticket?")) return;
    await deleteTicket.mutateAsync({
      id: ticket.id,
      project_id: ticket.project_id,
    });
    router.push(`/project/${ticket.project_id}`);
  };

  return (
    <>
      <button
        onClick={() => router.push(`/project/${ticket.project_id}`)}
        className="text-xs text-content-muted hover:text-content-secondary active:text-content-primary rounded mb-3 inline-block transition-colors duration-[120ms]"
      >
        &larr; Back to project
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-secondary rounded-md p-4">
            {isEditing ? (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm font-medium border rounded-md px-2.5 py-1.5"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border rounded-md px-2.5 py-1.5 text-sm"
                  rows={5}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdits}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-[120ms]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-content-secondary hover:bg-hover active:bg-hover rounded-md transition-colors duration-[120ms]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h1 className="text-sm font-medium text-content-primary">
                    {ticket.title}
                  </h1>
                  <div className="flex gap-2">
                    <button
                      onClick={startEditing}
                      className="text-xs text-content-muted hover:text-content-secondary active:text-content-primary rounded transition-colors duration-[120ms]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-500 hover:text-red-700 active:text-red-800 rounded transition-colors duration-[120ms]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {ticket.description ? (
                  <p className="mt-2 text-sm text-content-secondary whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-content-muted">
                    No description.
                  </p>
                )}
              </>
            )}

            {/* Labels */}
            {ticket.labels && ticket.labels.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-3">
                {ticket.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-1.5 py-px rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: label.color + "15",
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 text-[11px] text-content-muted">
              Created by {ticket.creator?.name ?? "Unknown"} on{" "}
              {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-surface-secondary rounded-md p-4">
            <CommentList ticketId={ticketId} assigneeId={ticket.assignee_id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="bg-surface-secondary rounded-md p-3 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-content-muted mb-0.5">
                Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1 text-xs"
              >
                {workflow.statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-content-muted mb-0.5">
                Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) =>
                  handlePriorityChange(e.target.value as TicketPriority)
                }
                className="w-full border rounded-md px-2.5 py-1 text-xs"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-content-muted mb-0.5">
                Assignee
              </label>
              <select
                value={ticket.assignee_id ?? ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1 text-xs"
              >
                <option value="">Unassigned</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-content-muted mb-0.5">
                Due Date
              </label>
              <input
                type="date"
                value={ticket.due_date ?? ""}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full border rounded-md px-2.5 py-1 text-xs"
              />
            </div>

            {user && (
              <div>
                <label className="block text-[11px] font-medium text-content-muted mb-0.5">
                  Watch
                </label>
                <WatchButton ticketId={ticketId} userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
