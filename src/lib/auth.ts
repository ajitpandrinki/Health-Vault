import type {
  UserAccount,
  SessionUser,
  VaultData,
  FamilyMember,
  UserRole,
} from "./types";
import { uid, COLORS, emptyVault, loadVault, saveVault, deleteVault } from "./storage";

const USERS_KEY = "hv_users_v2";
const SESSION_KEY = "hv_session_v2";

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`hv:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as UserAccount[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function toSessionUser(u: UserAccount): SessionUser {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    familyId: u.familyId,
    role: u.role,
    memberId: u.memberId,
  };
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { userId: string }).userId ?? null;
  } catch {
    return null;
  }
}

export async function getDatabaseSessionUser(userId: string): Promise<SessionUser | null> {
  try {
    const response = await fetch(`/api/auth/session?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: SessionUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function setSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function findUserByEmail(email: string): UserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((u) => u.email === normalized);
}

export function findUserById(id: string): UserAccount | undefined {
  return readUsers().find((u) => u.id === id);
}

export function getFamilyUsers(familyId: string): SessionUser[] {
  return readUsers()
    .filter((u) => u.familyId === familyId)
    .map(toSessionUser);
}

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
  familyName: string;
}): Promise<AuthResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const familyName = input.familyName.trim();
  const password = input.password;

  if (!fullName || !email || !familyName) {
    return { ok: false, error: "Please fill in all fields." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, familyName }),
    });

    if (response.ok) {
      const data = (await response.json()) as { user?: SessionUser; error?: string };
      if (data.user) {
        setSession(data.user.id);
        return { ok: true, user: data.user };
      }
      return { ok: false, error: data.error || "Registration failed." };
    }

    const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorData?.error) {
      return { ok: false, error: errorData.error };
    }
  } catch {
    // Fall back to local demo storage if API is unreachable.
  }

  if (findUserByEmail(email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const familyId = uid("fam");
  const memberId = uid("m");
  const userId = uid("u");
  const passwordHash = await hashPassword(password);

  const selfMember: FamilyMember = {
    id: memberId,
    name: fullName,
    relation: "Self",
    avatarColor: COLORS[0],
    userId,
  };

  const vault: VaultData = emptyVault(familyId, familyName, [selfMember]);
  saveVault(vault);

  const user: UserAccount = {
    id: userId,
    email,
    passwordHash,
    fullName,
    familyId,
    role: "owner",
    memberId,
    createdAt: new Date().toISOString(),
  };

  const users = readUsers();
  users.push(user);
  writeUsers(users);
  setSession(userId);

  return { ok: true, user: toSessionUser(user) };
}

export async function loginAccount(
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (response.ok) {
      const data = (await response.json()) as { user?: SessionUser; error?: string };
      if (data.user) {
        setSession(data.user.id);
        return { ok: true, user: data.user };
      }
      return { ok: false, error: data.error || "Login failed." };
    }

    const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorData?.error) {
      return { ok: false, error: errorData.error };
    }
  } catch {
    // Fall back to local demo storage if API is unreachable.
  }

  const user = findUserByEmail(normalizedEmail);
  if (!user) return { ok: false, error: "No account found with this email." };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    return { ok: false, error: "Incorrect password." };
  }
  setSession(user.id);
  return { ok: true, user: toSessionUser(user) };
}

export function logoutAccount(): void {
  clearSession();
}

export async function inviteFamilyUser(input: {
  actor: SessionUser;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  relation: string;
}): Promise<AuthResult & { memberId?: string }> {
  if (input.role === "owner") {
    return { ok: false, error: "Cannot assign owner role." };
  }
  const email = input.email.trim().toLowerCase();
  if (findUserByEmail(email)) {
    return { ok: false, error: "Email already registered." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const vault = loadVault(input.actor.familyId);
  if (!vault) return { ok: false, error: "Family vault not found." };

  const memberId = uid("m");
  const userId = uid("u");
  const passwordHash = await hashPassword(input.password);

  const member: FamilyMember = {
    id: memberId,
    name: input.fullName.trim(),
    relation: input.relation.trim() || "Family",
    avatarColor: COLORS[vault.members.length % COLORS.length],
    userId,
  };

  vault.members.push(member);
  saveVault(vault);

  const user: UserAccount = {
    id: userId,
    email,
    passwordHash,
    fullName: input.fullName.trim(),
    familyId: input.actor.familyId,
    role: input.role,
    memberId,
    createdAt: new Date().toISOString(),
  };

  const users = readUsers();
  users.push(user);
  writeUsers(users);

  return { ok: true, user: toSessionUser(user), memberId };
}

export function updateUserRole(
  actor: SessionUser,
  targetUserId: string,
  role: UserRole
): { ok: true } | { ok: false; error: string } {
  if (role === "owner") return { ok: false, error: "Cannot assign owner." };
  const users = readUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target || target.familyId !== actor.familyId) {
    return { ok: false, error: "User not found in this family." };
  }
  if (target.role === "owner") {
    return { ok: false, error: "Cannot change the owner's role." };
  }
  target.role = role;
  writeUsers(users);
  return { ok: true };
}

export function removeFamilyUser(
  actor: SessionUser,
  targetUserId: string
): { ok: true } | { ok: false; error: string } {
  const users = readUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target || target.familyId !== actor.familyId) {
    return { ok: false, error: "User not found." };
  }
  if (target.role === "owner") {
    return { ok: false, error: "Cannot remove the owner." };
  }
  if (target.id === actor.id) {
    return { ok: false, error: "Cannot remove yourself this way." };
  }
  writeUsers(users.filter((u) => u.id !== targetUserId));
  return { ok: true };
}

/** Dev helper — wipe auth + optional vaults for a clean slate */
export function wipeAllAuthData(): void {
  const users = readUsers();
  for (const u of users) {
    deleteVault(u.familyId);
  }
  localStorage.removeItem(USERS_KEY);
  clearSession();
}
