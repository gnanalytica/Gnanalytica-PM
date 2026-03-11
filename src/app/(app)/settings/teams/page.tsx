"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useTeams,
  useCreateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from "@/lib/hooks/use-teams";
import { useMembers } from "@/lib/hooks/use-members";
import { useProjects } from "@/lib/hooks/use-projects";
import { avatarColor } from "@/components/tickets/assignee-picker";
import type { Team } from "@/types";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
];

function TeamCard({
  team,
  projectName,
}: {
  team: Team;
  projectName: string;
}) {
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const { data: allMembers } = useMembers();

  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(
    null,
  );
  const [showAddMember, setShowAddMember] = useState(false);

  const membersNotInTeam = allMembers?.filter(
    (m) => !team.members?.some((tm) => tm.user_id === m.id),
  );

  return (
    <div className="border border-border-subtle rounded-lg bg-surface-primary overflow-hidden">
      {/* Team header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 min-w-0"
        >
          <svg
            className={`w-3.5 h-3.5 text-content-muted flex-shrink-0 transition-transform duration-150 ${
              expanded ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <h3 className="text-sm font-medium text-content-primary truncate">
            {team.name}
          </h3>
          <span className="flex-shrink-0 px-2 py-0.5 text-[11px] rounded-full bg-surface-secondary text-content-muted border border-border-subtle">
            {projectName}
          </span>
          <span className="text-[12px] text-content-muted flex-shrink-0">
            {team.members?.length ?? 0}{" "}
            {(team.members?.length ?? 0) === 1 ? "member" : "members"}
          </span>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          {confirmDeleteTeam ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-content-muted">Delete?</span>
              <button
                onClick={() => {
                  deleteTeam.mutate({
                    id: team.id,
                    project_id: team.project_id,
                  });
                  setConfirmDeleteTeam(false);
                }}
                className="px-2 py-0.5 text-[11px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteTeam(false)}
                className="px-2 py-0.5 text-[11px] rounded bg-surface-secondary text-content-muted hover:bg-hover transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteTeam(true)}
              className="px-2 py-1 text-[11px] text-content-muted hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-border-subtle px-4 py-3 space-y-3">
          {team.description && (
            <p className="text-[12px] text-content-secondary">
              {team.description}
            </p>
          )}

          {/* Members list */}
          {team.members && team.members.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
                Members
              </p>
              {team.members.map((tm) => (
                <div
                  key={tm.user_id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-surface-secondary transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    {tm.user?.avatar_url ? (
                      <Image
                        src={tm.user.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full ${avatarColor(tm.user_id)} flex items-center justify-center`}
                      >
                        <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                          {(tm.user?.name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-[13px] text-content-primary">
                      {tm.user?.name ?? "Unknown"}
                    </span>
                    {tm.role === "lead" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        Lead
                      </span>
                    )}
                  </div>

                  {confirmRemoveMember === tm.user_id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-content-muted">
                        Remove?
                      </span>
                      <button
                        onClick={() => {
                          removeMember.mutate({
                            team_id: team.id,
                            user_id: tm.user_id,
                            project_id: team.project_id,
                          });
                          setConfirmRemoveMember(null);
                        }}
                        className="px-2 py-0.5 text-[11px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmRemoveMember(null)}
                        className="px-2 py-0.5 text-[11px] rounded bg-surface-secondary text-content-muted hover:bg-hover transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveMember(tm.user_id)}
                      className="px-2 py-0.5 text-[11px] text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-content-muted">
              No members in this team yet.
            </p>
          )}

          {/* Add member */}
          <div>
            {showAddMember ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
                    Add member
                  </p>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="text-[11px] text-content-muted hover:text-content-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {membersNotInTeam && membersNotInTeam.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {membersNotInTeam.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          addMember.mutate({
                            team_id: team.id,
                            user_id: m.id,
                            project_id: team.project_id,
                          });
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-md bg-surface-secondary hover:bg-hover text-content-secondary border border-border-subtle active:scale-[0.95] transition-all duration-150"
                      >
                        {m.avatar_url ? (
                          <Image
                            src={m.avatar_url}
                            alt=""
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full ${avatarColor(m.id)} flex items-center justify-center`}
                          >
                            <span className="text-[8px] font-semibold text-white drop-shadow-sm">
                              {(m.name ?? "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        {m.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-content-muted">
                    All workspace members are already in this team.
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="text-[12px] text-accent hover:underline transition-colors"
              >
                + Add member
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamsSettingsPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const createTeam = useCreateTeam();

  // Gather teams from all projects
  const projectTeamQueries = (projects ?? []).map((p) => ({
    project: p,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useTeams(p.id),
  }));

  const allTeams: { team: Team; projectName: string }[] = [];
  let teamsLoading = projectsLoading;

  for (const { project, query } of projectTeamQueries) {
    if (query.isLoading) teamsLoading = true;
    if (query.data) {
      for (const team of query.data) {
        allTeams.push({ team, projectName: project.name });
      }
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !selectedProjectId) return;
    await createTeam.mutateAsync({
      project_id: selectedProjectId,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      color: newColor,
    });
    setNewName("");
    setNewDescription("");
    setNewColor(PRESET_COLORS[0]);
    setSelectedProjectId("");
    setShowCreate(false);
  };

  const resetForm = () => {
    setShowCreate(false);
    setNewName("");
    setNewDescription("");
    setNewColor(PRESET_COLORS[0]);
    setSelectedProjectId("");
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-content-primary mb-1">
            Teams
          </h1>
          <p className="text-[13px] text-content-muted">
            Organize members into teams across projects
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-[13px] bg-accent text-white rounded-lg hover:opacity-90 hover:shadow-xs active:scale-[0.95] transition-all duration-150"
          >
            Create team
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-border-subtle rounded-lg bg-surface-secondary p-4 mb-6 space-y-3">
          <h3 className="text-[13px] font-medium text-content-primary">
            New team
          </h3>

          {/* Team name */}
          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Design, Engineering, QA..."
              className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] bg-surface-primary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") resetForm();
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1">
              Description{" "}
              <span className="font-normal text-content-muted">(optional)</span>
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What does this team do?"
              rows={2}
              className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] bg-surface-primary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") resetForm();
              }}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded-full transition-all duration-150 ${
                    newColor === color
                      ? "ring-2 ring-offset-2 ring-offset-surface-secondary ring-accent scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Project selector */}
          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] bg-surface-primary text-content-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            >
              <option value="">Select a project...</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || !selectedProjectId || createTeam.isPending}
              className="px-4 py-1.5 text-[13px] bg-accent text-white rounded-lg hover:opacity-90 hover:shadow-xs active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {createTeam.isPending ? "Creating..." : "Create team"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-1.5 text-[13px] text-content-muted hover:text-content-secondary rounded-lg hover:bg-hover transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      {teamsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-surface-secondary animate-pulse border border-border-subtle"
            />
          ))}
        </div>
      ) : allTeams.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-secondary p-8 text-center">
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
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
          <p className="text-[13px] text-content-muted mb-1">
            No teams yet
          </p>
          <p className="text-[12px] text-content-muted">
            Create a team to organize your workspace members.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allTeams.map(({ team, projectName }) => (
            <TeamCard key={team.id} team={team} projectName={projectName} />
          ))}
        </div>
      )}
    </div>
  );
}
