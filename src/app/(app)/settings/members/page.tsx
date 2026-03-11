"use client";

import { useState } from "react";
import Image from "next/image";
import { useMembers } from "@/lib/hooks/use-members";
import { useToast } from "@/lib/hooks/use-toast";
import { avatarColor } from "@/components/tickets/assignee-picker";
import type { Profile } from "@/types";

const WORKSPACE_ROLES = ["admin", "member", "viewer"] as const;
type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-purple-500/15 text-purple-400 border-purple-500/20";
    case "member":
      return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    case "viewer":
      return "bg-gray-500/15 text-gray-400 border-gray-500/20";
    default:
      return "bg-gray-500/15 text-gray-400 border-gray-500/20";
  }
}

function MemberRow({
  member,
  onRemove,
}: {
  member: Profile;
  onRemove: (id: string) => void;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border-subtle last:border-b-0 transition-colors hover:bg-surface-secondary/50">
      <div className="flex items-center gap-3 min-w-0">
        {member.avatar_url ? (
          <Image
            src={member.avatar_url}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full ${avatarColor(member.id)} flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-[12px] font-semibold text-white drop-shadow-sm">
              {(member.name ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-content-primary truncate">
            {member.name}
          </p>
          <p className="text-[11px] text-content-muted truncate">
            {member.role ?? "member"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${roleBadgeClass(member.role ?? "member")}`}
        >
          {(member.role ?? "member").charAt(0).toUpperCase() +
            (member.role ?? "member").slice(1)}
        </span>

        {confirmingRemove ? (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-content-muted">Are you sure?</span>
            <button
              onClick={() => {
                onRemove(member.id);
                setConfirmingRemove(false);
              }}
              className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmingRemove(false)}
              className="px-2 py-0.5 rounded bg-surface-secondary text-content-muted hover:bg-hover transition-colors font-medium"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingRemove(true)}
            className="px-2.5 py-1 text-[11px] rounded-md text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function MembersSettingsPage() {
  const { data: members, isLoading } = useMembers();
  const { toast } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [isInviting, setIsInviting] = useState(false);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    // Simulated invite -- no API yet
    setTimeout(() => {
      toast(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
      setIsInviting(false);
    }, 600);
  }

  function handleRemove(memberId: string) {
    const member = members?.find((m) => m.id === memberId);
    toast(`${member?.name ?? "Member"} removed from workspace`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-content-primary mb-1">
        Members
      </h1>
      <p className="text-[13px] text-content-muted mb-6">
        Manage workspace members and their access
      </p>

      {/* Invite section */}
      <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4 mb-6">
        <h2 className="text-[13px] font-medium text-content-primary mb-3">
          Invite a new member
        </h2>
        <form onSubmit={handleInvite} className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="invite-email"
              className="block text-[11px] font-medium text-content-muted mb-1"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="name@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-[13px] rounded-lg border border-border-subtle bg-surface-primary text-content-primary placeholder:text-content-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>
          <div className="w-28 flex-shrink-0">
            <label
              htmlFor="invite-role"
              className="block text-[11px] font-medium text-content-muted mb-1"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
              className="w-full px-2 py-1.5 text-[13px] rounded-lg border border-border-subtle bg-surface-primary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            >
              {WORKSPACE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isInviting || !inviteEmail.trim()}
            className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isInviting ? "Sending..." : "Invite"}
          </button>
        </form>
      </div>

      {/* Member list */}
      {isLoading ? (
        <div className="rounded-xl border border-border-subtle bg-surface-secondary">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 px-4 border-b border-border-subtle last:border-b-0"
            >
              <div className="w-8 h-8 rounded-full bg-surface-primary animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-surface-primary rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-surface-primary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-content-primary">
              Workspace members
            </h2>
            <span className="text-[11px] text-content-muted">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface-secondary p-8 text-center">
          <svg
            className="w-10 h-10 mx-auto mb-3 text-content-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
          <p className="text-[13px] font-medium text-content-primary mb-1">
            No members yet
          </p>
          <p className="text-[12px] text-content-muted">
            Invite team members to start collaborating in your workspace.
          </p>
        </div>
      )}
    </div>
  );
}
