import type { ProjectRole } from "@/types";

const ROLE_LEVEL: Record<ProjectRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasPermission(
  userRole: ProjectRole | undefined | null,
  minRole: ProjectRole,
): boolean {
  if (!userRole) return false;
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}

export const PERMISSIONS = {
  canViewProject: (r?: ProjectRole | null) => hasPermission(r, "viewer"),
  canComment: (r?: ProjectRole | null) => hasPermission(r, "member"),
  canCreateTicket: (r?: ProjectRole | null) => hasPermission(r, "member"),
  canEditTicket: (r?: ProjectRole | null) => hasPermission(r, "member"),
  canDeleteTicket: (r?: ProjectRole | null) => hasPermission(r, "admin"),
  canManageMembers: (r?: ProjectRole | null) => hasPermission(r, "admin"),
  canEditProject: (r?: ProjectRole | null) => hasPermission(r, "admin"),
  canEditWorkflow: (r?: ProjectRole | null) => hasPermission(r, "admin"),
  canDeleteProject: (r?: ProjectRole | null) => hasPermission(r, "owner"),
} as const;
