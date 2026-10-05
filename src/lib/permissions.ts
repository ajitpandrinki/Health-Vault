import type { Permission, UserRole } from "./types";

const ROLE_PERMS: Record<UserRole, Permission[]> = {
  owner: [
    "view",
    "upload",
    "edit_docs",
    "delete_docs",
    "manage_claims",
    "manage_visits",
    "manage_members",
    "manage_roles",
    "rename_family",
    "invite_user",
  ],
  admin: [
    "view",
    "upload",
    "edit_docs",
    "delete_docs",
    "manage_claims",
    "manage_visits",
    "manage_members",
    "invite_user",
  ],
  member: ["view", "upload", "edit_docs", "manage_visits"],
  viewer: ["view"],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMS[role].includes(permission);
}

export function roleRank(role: UserRole): number {
  switch (role) {
    case "owner":
      return 4;
    case "admin":
      return 3;
    case "member":
      return 2;
    case "viewer":
      return 1;
  }
}

/** Owner can assign any role except transferring ownership here; admin cannot elevate to owner/admin beyond member/viewer */
export function canAssignRole(actor: UserRole, targetRole: UserRole): boolean {
  if (actor === "owner") return targetRole !== "owner";
  if (actor === "admin") return targetRole === "member" || targetRole === "viewer";
  return false;
}
