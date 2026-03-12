"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/lib/hooks/use-comments";
import { useRealtimeComments } from "@/lib/hooks/use-realtime";
import { useMembers } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/hooks/use-auth";
import { MentionTextarea } from "@/components/comments/mention-textarea";
import { avatarColor } from "@/components/tickets/assignee-picker";
import { CommentBody } from "@/components/comments/comment-body";
import { EmptyState, ChatBubbleIcon } from "@/components/empty-state";
import type { Comment } from "@/types";

const MAX_DEPTH = 3;

function CommentItem({
  comment,
  ticketId,
  assigneeId,
  depth,
}: {
  comment: Comment;
  ticketId: string;
  assigneeId?: string | null;
  depth: number;
}) {
  const { user } = useAuth();
  const { data: members } = useMembers();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    await createComment.mutateAsync({
      ticket_id: ticketId,
      body: replyBody.trim(),
      parent_id: comment.id,
      members: members ?? [],
      assignee_id: assigneeId,
    });
    setReplyBody("");
    setReplying(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    await deleteComment.mutateAsync({ id: comment.id, ticket_id: ticketId });
  };

  const canReply = depth < MAX_DEPTH;
  const isOwn = user?.id === comment.user_id;

  return (
    <div style={{ marginLeft: depth > 0 ? depth * 24 : 0 }}>
      <div className="flex gap-2.5">
        {comment.user?.avatar_url ? (
          <Image
            src={comment.user.avatar_url}
            alt={comment.user.name}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className={`w-6 h-6 rounded-full ${avatarColor(comment.user_id)} flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm flex-shrink-0 mt-0.5`}>
            {comment.user?.name?.[0] ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{comment.user?.name}</span>
            <span className="text-[11px] text-gray-400">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <CommentBody body={comment.body} members={members ?? []} />
          <div className="flex gap-2 mt-0.5">
            {canReply && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-[11px] text-gray-400 hover:text-gray-600 active:scale-[0.96] transition-all duration-150"
              >
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="text-[11px] text-gray-400 hover:text-red-500 active:scale-[0.96] transition-all duration-150"
              >
                Delete
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <MentionTextarea
                value={replyBody}
                onChange={setReplyBody}
                onSubmit={handleReply}
                members={members ?? []}
                placeholder="Write a reply..."
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleReply}
                  disabled={createComment.isPending || !replyBody.trim()}
                  className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.96] disabled:opacity-50 transition-all duration-150"
                >
                  {createComment.isPending ? "Sending..." : "Reply"}
                </button>
                <button
                  onClick={() => {
                    setReplying(false);
                    setReplyBody("");
                  }}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 active:scale-[0.96] transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2.5 space-y-2.5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ticketId={ticketId}
              assigneeId={assigneeId}
              depth={Math.min(depth + 1, MAX_DEPTH)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentList({
  ticketId,
  assigneeId,
}: {
  ticketId: string;
  assigneeId?: string | null;
}) {
  const { data: comments, isLoading } = useComments(ticketId);
  useRealtimeComments(ticketId);
  const { data: members } = useMembers();
  const createComment = useCreateComment();
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    if (!body.trim()) return;
    await createComment.mutateAsync({
      ticket_id: ticketId,
      body: body.trim(),
      members: members ?? [],
      assignee_id: assigneeId,
    });
    setBody("");
  };

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
        Comments
      </h3>

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading comments...</p>
      ) : comments?.length === 0 ? (
        <EmptyState
          icon={<ChatBubbleIcon className="w-8 h-8" />}
          title="No comments yet"
          description="Start the conversation below."
          compact
        />
      ) : (
        <div className="space-y-2.5 mb-3">
          {comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ticketId={ticketId}
              assigneeId={assigneeId}
              depth={0}
            />
          ))}
        </div>
      )}

      <div>
        <MentionTextarea
          value={body}
          onChange={setBody}
          onSubmit={handleSubmit}
          members={members ?? []}
        />
        <button
          onClick={handleSubmit}
          disabled={createComment.isPending || !body.trim()}
          className="mt-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.96] disabled:opacity-50 transition-all duration-150"
        >
          {createComment.isPending ? "Sending..." : "Comment"}
        </button>
      </div>
    </div>
  );
}
