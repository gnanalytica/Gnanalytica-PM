"use client";

import { useState, useMemo } from "react";

// ── Type definitions ──

export interface ActivityItem {
  id: string;
  type: "status_change" | "assignment" | "comment" | "priority_change" | "due_date_change";
  timestamp: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    field?: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: { name: string; avatar?: string };
  createdAt: Date;
  updatedAt?: Date;
}

export interface TicketActivityTimelineProps {
  ticketId: string;
  activities: ActivityItem[];
  comments: Comment[];
  onCommentAdd: (text: string) => Promise<void>;
  readonly?: boolean;
}

// ── Helper functions ──

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-cyan-500",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function sanitizeContent(content: string): string {
  const div = document.createElement("div");
  div.textContent = content;
  return div.innerHTML;
}

// ── Sub-components ──

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}

function Avatar({ name, avatar, size = "md" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white drop-shadow-sm flex-shrink-0 ${hashStringToColor(name)}`}
    >
      {getInitials(name)}
    </div>
  );
}

interface ActivityItemComponentProps {
  activity: ActivityItem;
  isLast: boolean;
}

function ActivityItemComponent({ activity, isLast }: ActivityItemComponentProps) {
  const typeConfig: Record<
    ActivityItem["type"],
    { label: string; color: string; bgColor: string }
  > = {
    status_change: {
      label: "Status",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    assignment: {
      label: "Assigned",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    comment: {
      label: "Comment",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    priority_change: {
      label: "Priority",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    due_date_change: {
      label: "Due Date",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  };

  const config = typeConfig[activity.type];

  const getActivityDescription = () => {
    switch (activity.type) {
      case "status_change":
        return `Changed status to ${activity.metadata?.newValue}${
          activity.metadata?.oldValue
            ? ` from ${activity.metadata.oldValue}`
            : ""
        }`;
      case "assignment":
        return activity.metadata?.newValue
          ? `Assigned to ${activity.metadata.newValue}`
          : "Removed assignee";
      case "priority_change":
        return `Changed priority to ${activity.metadata?.newValue}${
          activity.metadata?.oldValue
            ? ` from ${activity.metadata.oldValue}`
            : ""
        }`;
      case "due_date_change":
        return `Changed due date to ${activity.metadata?.newValue}${
          activity.metadata?.oldValue
            ? ` from ${activity.metadata.oldValue}`
            : ""
        }`;
      default:
        return "Activity";
    }
  };

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-2 top-5 bottom-0 w-px bg-border-subtle" />
      )}

      {/* Avatar dot */}
      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-surface-primary border-2 border-border-subtle flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
      </div>

      {/* Content */}
      <div className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-content-primary">
              <span className="font-medium">{activity.userName}</span>
              {" " + getActivityDescription()}
            </p>
          </div>
          <div className={`inline-flex items-center gap-1 ${config.color} flex-shrink-0 mt-0.5`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.bgColor}`}>
              {config.label}
            </span>
          </div>
        </div>
        <time className="text-xs text-content-muted mt-0.5 inline-block">
          {getRelativeTime(activity.timestamp)}
        </time>
      </div>
    </div>
  );
}

interface CommentComponentProps {
  comment: Comment;
}

function CommentComponent({ comment }: CommentComponentProps) {
  const isEdited =
    comment.updatedAt &&
    comment.updatedAt.getTime() !== comment.createdAt.getTime();

  return (
    <div className="flex gap-3">
      <Avatar name={comment.author.name} avatar={comment.author.avatar} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-content-primary">
            {comment.author.name}
          </span>
          <span className="text-xs text-content-muted">
            {getRelativeTime(comment.createdAt)}
          </span>
          {isEdited && (
            <span className="text-xs text-content-muted italic">(edited)</span>
          )}
        </div>

        <div className="bg-surface-secondary rounded-lg px-3 py-2 mb-2">
          <p className="text-sm text-content-secondary break-words">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

function CommentForm({ onSubmit, disabled }: CommentFormProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="pt-4 border-t border-border-subtle">
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border-subtle rounded-lg text-content-primary placeholder-content-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          rows={3}
        />

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Main component ──

type TimelineItem =
  | { type: "activity"; data: ActivityItem }
  | { type: "comment"; data: Comment };

export function TicketActivityTimeline({
  ticketId,
  activities,
  comments,
  onCommentAdd,
  readonly = false,
}: TicketActivityTimelineProps) {
  // Combine and sort all items chronologically (newest first)
  const allItems = useMemo(() => {
    const combined: TimelineItem[] = [
      ...activities.map((a) => ({ type: "activity" as const, data: a })),
      ...comments.map((c) => ({ type: "comment" as const, data: c })),
    ];

    return combined.sort((a, b) => {
      const aTime =
        a.type === "activity" ? a.data.timestamp.getTime() : a.data.createdAt.getTime();
      const bTime =
        b.type === "activity" ? b.data.timestamp.getTime() : b.data.createdAt.getTime();
      return bTime - aTime; // Newest first
    });
  }, [activities, comments]);

  const hasContent = allItems.length > 0;

  return (
    <div
      className="space-y-3"
      role="feed"
      aria-label="Activity timeline"
    >
      {!hasContent && (
        <div className="py-8 text-center">
          <p className="text-sm text-content-muted">
            No activity yet. Start collaborating!
          </p>
        </div>
      )}

      {allItems.map((item, index) => (
        <div key={`${item.type}-${item.data.id}`}>
          {item.type === "activity" ? (
            <ActivityItemComponent
              activity={item.data}
              isLast={index === allItems.length - 1}
            />
          ) : (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <CommentComponent comment={item.data} />
            </div>
          )}
        </div>
      ))}

      {/* Comment form */}
      {!readonly && (
        <div className="mt-6 pt-4 border-t border-border-subtle">
          <CommentForm onSubmit={onCommentAdd} disabled={readonly} />
        </div>
      )}
    </div>
  );
}
