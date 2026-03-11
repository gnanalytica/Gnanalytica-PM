"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";
import { useMembers } from "@/lib/hooks/use-members";
import { avatarColor } from "@/components/tickets/assignee-picker";
import type { ProjectRole } from "@/types";

const supabase = createClient();

type ProjectMemberRow = {
  id: string;
  user_id: string;
  role: ProjectRole;
  user: { id: string; name: string; avatar_url: string | null };
};

function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("id, user_id, role, user:profiles(id, name, avatar_url)")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data ?? []) as unknown as ProjectMemberRow[];
    },
    enabled: !!projectId,
  });
}

function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      projectId,
    }: {
      memberId: string;
      role: ProjectRole;
      projectId: string;
    }) => {
      void projectId;
      const { error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", vars.projectId],
      });
    },
  });
}

function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: ProjectRole;
    }) => {
      const { error } = await supabase
        .from("project_members")
        .insert({ project_id: projectId, user_id: userId, role });
      if (error) throw error;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", vars.projectId],
      });
    },
  });
}

const ROLES: { value: ProjectRole; label: string; desc: string }[] = [
  { value: "owner", label: "Owner", desc: "Full access, can delete project" },
  { value: "admin", label: "Admin", desc: "Manage settings and members" },
  { value: "member", label: "Member", desc: "Create and edit tickets" },
  { value: "viewer", label: "Viewer", desc: "Read-only access" },
];

export default function ProjectMembersPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";

  const { data: projectMembers } = useProjectMembers(projectId);
  const { data: allMembers } = useMembers();
  const updateRole = useUpdateMemberRole();
  const addMember = useAddProjectMember();

  const memberIds = new Set(projectMembers?.map((m) => m.user_id) ?? []);
  const nonMembers = allMembers?.filter((m) => !memberIds.has(m.id)) ?? [];

  return (
    <div className="max-w-2xl px-6 py-4">
      <h1 className="text-lg font-semibold text-content-primary mb-4">
        Project Members
      </h1>

      {/* Current members */}
      <div className="space-y-2 mb-6">
        {projectMembers?.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between border border-border-subtle rounded-md p-3"
          >
            <div className="flex items-center gap-2">
              {member.user.avatar_url ? (
                <Image
                  src={member.user.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className={`w-6 h-6 rounded-full ${avatarColor(member.user.id)} flex items-center justify-center`}>
                  <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                    {(member.user.name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[13px] text-content-primary">
                {member.user.name}
              </span>
            </div>
            <select
              value={member.role}
              onChange={(e) =>
                updateRole.mutate({
                  memberId: member.id,
                  role: e.target.value as ProjectRole,
                  projectId,
                })
              }
              className="text-[12px] border border-border-subtle rounded px-2 py-1 bg-surface-secondary text-content-primary"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Add members */}
      {nonMembers.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-content-primary mb-2">
            Add Members
          </h2>
          <div className="flex flex-wrap gap-2">
            {nonMembers.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  addMember.mutate({ projectId, userId: m.id, role: "member" })
                }
                className="px-2.5 py-1 text-[11px] rounded bg-surface-secondary hover:bg-hover text-content-secondary transition-colors border border-border-subtle"
              >
                + {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Roles legend */}
      <div className="mt-6 border-t border-border-subtle pt-4">
        <h3 className="text-[11px] font-medium text-content-muted uppercase mb-2">
          Role Permissions
        </h3>
        <div className="space-y-1">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-content-primary w-16">
                {r.label}
              </span>
              <span className="text-[11px] text-content-muted">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
