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
import { avatarColor } from "@/components/tickets/assignee-picker";

export function TeamList({ projectId }: { projectId: string }) {
  const { data: teams } = useTeams(projectId);
  const { data: allMembers } = useMembers();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTeam.mutateAsync({
      project_id: projectId,
      name: newName.trim(),
    });
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Teams</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-2.5 py-1 text-[12px] bg-accent text-white rounded hover:opacity-90 hover:shadow-xs active:scale-[0.95] transition-all duration-150"
        >
          New Team
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Team name..."
            className="flex-1 border border-border-subtle rounded px-2.5 py-1.5 text-xs bg-surface-secondary text-content-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setShowCreate(false);
                setNewName("");
              }
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-1.5 text-xs bg-accent text-white rounded hover:opacity-90 hover:shadow-xs active:scale-[0.95] disabled:opacity-50 transition-all duration-150"
          >
            Create
          </button>
        </div>
      )}

      {(!teams || teams.length === 0) && !showCreate ? (
        <p className="text-sm text-content-muted text-center py-6">
          No teams yet.
        </p>
      ) : (
        <div className="space-y-2">
          {teams?.map((team) => (
            <div
              key={team.id}
              className="border border-border-subtle rounded-md p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() =>
                    setExpandedTeam(expandedTeam === team.id ? null : team.id)
                  }
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <h4 className="text-sm font-medium text-content-primary">
                    {team.name}
                  </h4>
                  <span className="text-[11px] text-content-muted">
                    ({team.members?.length ?? 0})
                  </span>
                </button>
                <button
                  onClick={() =>
                    deleteTeam.mutate({ id: team.id, project_id: projectId })
                  }
                  className="text-[11px] text-content-muted hover:text-red-400 active:scale-[0.95] transition-all duration-150"
                >
                  Delete
                </button>
              </div>

              {/* Member avatars */}
              <div className="flex items-center gap-1 flex-wrap">
                {team.members?.map((tm) => (
                  <div
                    key={tm.user_id}
                    className="flex items-center gap-1 group"
                  >
                    {tm.user?.avatar_url ? (
                      <Image
                        src={tm.user.avatar_url}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${avatarColor(tm.user_id)} flex items-center justify-center`}>
                        <span className="text-[9px] font-semibold text-white drop-shadow-sm">
                          {(tm.user?.name ?? "?")[0]}
                        </span>
                      </div>
                    )}
                    {expandedTeam === team.id && (
                      <button
                        onClick={() =>
                          removeMember.mutate({
                            team_id: team.id,
                            user_id: tm.user_id,
                            project_id: projectId,
                          })
                        }
                        className="text-[10px] text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add member (expanded) */}
              {expandedTeam === team.id && (
                <div className="mt-2 pt-2 border-t border-border-subtle">
                  <p className="text-[11px] text-content-muted mb-1">
                    Add member:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allMembers
                      ?.filter(
                        (m) => !team.members?.some((tm) => tm.user_id === m.id),
                      )
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            addMember.mutate({
                              team_id: team.id,
                              user_id: m.id,
                              project_id: projectId,
                            })
                          }
                          className="px-2 py-0.5 text-[11px] rounded bg-surface-secondary hover:bg-hover text-content-secondary active:scale-[0.95] transition-all duration-150"
                        >
                          + {m.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
