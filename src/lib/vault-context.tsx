"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  FamilyMember,
  MedicalDocument,
  InsuranceClaim,
  HospitalVisit,
  Locale,
  SessionUser,
  UserRole,
  VaultData,
  Permission,
} from "./types";
import { loadVault, saveVault, uid, COLORS, clearLegacyStorage } from "./storage";
import {
  findUserById,
  getSessionUserId,
  getFamilyUsers,
  logoutAccount,
  registerAccount,
  loginAccount,
  getDatabaseSessionUser,
  inviteFamilyUser,
  updateUserRole,
  toSessionUser,
} from "./auth";
import { can } from "./permissions";
import { t, type Dictionary } from "./i18n";

interface VaultContextValue {
  state: AppState | null;
  ready: boolean;
  authenticated: boolean;
  dict: Dictionary;
  canDo: (permission: Permission) => boolean;
  setLocale: (locale: Locale) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    familyName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  renameFamily: (name: string) => void;
  addMember: (
    m: Omit<FamilyMember, "id" | "avatarColor"> & { avatarColor?: string }
  ) => Promise<FamilyMember | null>;
  updateMember: (id: string, patch: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  inviteUser: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    relation: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  changeUserRole: (userId: string, role: UserRole) => { ok: boolean; error?: string };
  addDocument: (d: Omit<MedicalDocument, "id" | "createdAt">) => string;
  updateDocument: (id: string, patch: Partial<MedicalDocument>) => void;
  removeDocument: (id: string) => void;
  addClaim: (c: Omit<InsuranceClaim, "id" | "createdAt">) => void;
  updateClaim: (id: string, patch: Partial<InsuranceClaim>) => void;
  removeClaim: (id: string) => void;
  addVisit: (v: Omit<HospitalVisit, "id" | "createdAt">) => void;
  updateVisit: (id: string, patch: Partial<HospitalVisit>) => void;
  removeVisit: (id: string) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

function buildAppState(
  user: SessionUser,
  vault: VaultData,
  familyUsers = getFamilyUsers(user.familyId),
): AppState {
  return {
    ...vault,
    user,
    familyUsers,
  };
}

async function loadDatabaseState(user: SessionUser): Promise<AppState | null> {
  try {
    const response = await fetch(`/api/family?familyId=${encodeURIComponent(user.familyId)}`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      family: VaultData["family"];
      members: VaultData["members"];
      documents: VaultData["documents"];
      claims: VaultData["claims"];
      visits: VaultData["visits"];
      users: SessionUser[];
    };

    return buildAppState(
      user,
      {
        family: data.family,
        members: data.members,
        documents: data.documents,
        claims: data.claims,
        visits: data.visits,
        locale: "en",
      },
      data.users,
    );
  } catch {
    return null;
  }
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [ready, setReady] = useState(false);
  /** Locale for logged-out pages (landing / auth) */
  const [guestLocale, setGuestLocale] = useState<Locale>("en");

  const hydrate = useCallback(async () => {
    clearLegacyStorage();
    const userId = getSessionUserId();
    if (!userId) {
      setState(null);
      setReady(true);
      return;
    }
    const databaseUser = await getDatabaseSessionUser(userId);
    if (databaseUser) {
      const databaseState = await loadDatabaseState(databaseUser);
      if (databaseState) {
        setState(databaseState);
        setReady(true);
        return;
      }
    }

    const account = findUserById(userId);
    const vault = account ? loadVault(account.familyId) : null;
    if (!account || !vault) {
      logoutAccount();
      setState(null);
      setReady(true);
      return;
    }
    setState(buildAppState(toSessionUser(account), vault));
    setReady(true);
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!state) return;
    const { user: _u, familyUsers: _f, ...vault } = state;
    void _u;
    void _f;
    saveVault(vault);
  }, [state]);

  const updateVault = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => (prev ? fn(prev) : prev));
  }, []);

  const locale = state?.locale ?? guestLocale;
  const dict = t(locale);

  const value = useMemo<VaultContextValue>(
    () => ({
      state,
      ready,
      authenticated: Boolean(state?.user),
      dict,
      canDo: (permission) =>
        state?.user ? can(state.user.role, permission) : false,
      setLocale: (loc) => {
        if (state) {
          updateVault((s) => ({ ...s, locale: loc }));
        } else {
          setGuestLocale(loc);
        }
      },
      login: async (email, password) => {
        const res = await loginAccount(email, password);
        if (!res.ok) return { ok: false, error: res.error };
        const databaseState = await loadDatabaseState(res.user);
        if (databaseState) {
          setState(databaseState);
          return { ok: true };
        }
        const vault = loadVault(res.user.familyId);
        if (!vault) return { ok: false, error: "Vault unavailable. Contact support." };
        setState(buildAppState(res.user, vault));
        return { ok: true };
      },
      register: async (input) => {
        const res = await registerAccount(input);
        if (!res.ok) return { ok: false, error: res.error };
        const databaseState = await loadDatabaseState(res.user);
        if (databaseState) {
          setState(databaseState);
          return { ok: true };
        }
        const vault = loadVault(res.user.familyId);
        if (!vault) return { ok: false, error: "Could not create vault." };
        setState(buildAppState(res.user, vault));
        return { ok: true };
      },
      logout: () => {
        logoutAccount();
        setState(null);
      },
      renameFamily: (name) => {
        const trimmed = name.trim();
        if (!trimmed || !state || !can(state.user.role, "rename_family")) return;

        void fetch("/api/family", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyId: state.user.familyId, name: trimmed }),
        })
          .then((res) => res.ok)
          .catch(() => false)
          .finally(() => {
            updateVault((s) => ({
              ...s,
              family: { ...s.family, name: trimmed },
            }));
          });
      },
      addMember: async (m) => {
        if (!state || !can(state.user.role, "manage_members")) return null;

        const memberData = {
          ...m,
          id: uid("m"),
          avatarColor: m.avatarColor ?? COLORS[state.members.length % COLORS.length],
        };

        const response = await fetch("/api/family/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId: state.user.familyId,
            name: memberData.name,
            relation: memberData.relation,
            dateOfBirth: memberData.dateOfBirth,
            bloodGroup: memberData.bloodGroup,
            phone: memberData.phone,
            avatarColor: memberData.avatarColor,
          }),
        });
        if (!response.ok) {
          throw new Error("Could not create the family profile. Please try again.");
        }
        const data = (await response.json()) as { member?: FamilyMember };
        const member = data.member;
        if (!member) {
          throw new Error("The server did not return the new family profile.");
        }

        updateVault((s) => ({
          ...s,
          members: [member, ...s.members],
        }));
        return member;
      },
      updateMember: (id, patch) => {
        if (!state || !can(state.user.role, "manage_members")) return;
        updateVault((s) => ({
          ...s,
          members: s.members.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
      },
      removeMember: (id) => {
        if (!state || !can(state.user.role, "manage_members")) return;
        if (id === state.user.memberId) return;

        void fetch(`/api/family/members?familyId=${state.user.familyId}&memberId=${id}`, {
          method: "DELETE",
        })
          .catch(() => null)
          .finally(() => {
            updateVault((s) => ({
              ...s,
              members: s.members.filter((x) => x.id !== id),
              familyUsers: getFamilyUsers(s.user.familyId),
            }));
          });
      },
      inviteUser: async (input) => {
        if (!state || !can(state.user.role, "invite_user")) {
          return { ok: false, error: "Not allowed." };
        }
        const res = await inviteFamilyUser({ actor: state.user, ...input });
        if (!res.ok) return { ok: false, error: res.error };
        const vault = loadVault(state.user.familyId);
        if (vault) setState(buildAppState(state.user, vault));
        return { ok: true };
      },
      changeUserRole: (userId, role) => {
        if (!state || !can(state.user.role, "manage_roles")) {
          return { ok: false, error: "Not allowed." };
        }
        const res = updateUserRole(state.user, userId, role);
        if (!res.ok) return res;
        updateVault((s) => ({
          ...s,
          familyUsers: getFamilyUsers(s.user.familyId),
          user:
            s.user.id === userId ? { ...s.user, role } : s.user,
        }));
        return { ok: true };
      },
      addDocument: (d) => {
        const id = uid("d");
        if (!state || !can(state.user.role, "upload")) return id;

        const payload = {
          familyId: state.user.familyId,
          userId: state.user.id,
          memberId: d.memberId,
          title: d.title,
          type: d.type,
          hospital: d.hospital,
          date: d.date,
          amount: d.amount,
          notes: d.notes,
          fileName: d.fileName,
          fileUrl: d.fileDataUrl,
          tags: d.tags ?? [],
          extractedByAi: d.extractedByAi,
          categories: d.categories ?? [],
        };

        void fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("failed");
            const data = (await res.json()) as { document?: MedicalDocument };
            if (!data.document) throw new Error("missing document");
            return data.document;
          })
          .catch(() => null)
          .then((document) => {
            if (!document) {
              updateVault((s) => ({
                ...s,
                documents: [
                  {
                    ...d,
                    id,
                    createdAt: new Date().toISOString(),
                    createdByUserId: s.user.id,
                  },
                  ...s.documents,
                ],
              }));
              return;
            }

            updateVault((s) => ({
              ...s,
              documents: [document, ...s.documents.filter((x) => x.id !== document.id)],
            }));
          });

        return id;
      },
      updateDocument: (id, patch) => {
        if (!state || !can(state.user.role, "edit_docs")) return;
        updateVault((s) => ({
          ...s,
          documents: s.documents.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
      },
      removeDocument: (id) => {
        if (!state || !can(state.user.role, "delete_docs")) return;

        void fetch(`/api/documents?documentId=${encodeURIComponent(id)}&familyId=${encodeURIComponent(state.user.familyId)}`, {
          method: "DELETE",
        })
          .catch(() => null)
          .finally(() => {
            updateVault((s) => ({
              ...s,
              documents: s.documents.filter((x) => x.id !== id),
            }));
          });
      },
      addClaim: (c) => {
        if (!state || !can(state.user.role, "manage_claims")) return;

        const payload = {
          familyId: state.user.familyId,
          userId: state.user.id,
          memberId: c.memberId,
          title: c.title,
          insurer: c.insurer,
          policyNumber: c.policyNumber,
          claimNumber: c.claimNumber,
          hospital: c.hospital,
          amountClaimed: c.amountClaimed,
          amountApproved: c.amountApproved,
          status: c.status,
          notes: c.notes,
          documentIds: c.documentIds,
          submittedAt: c.submittedAt,
        };

        void fetch("/api/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("failed");
            const data = (await res.json()) as { claim?: InsuranceClaim };
            if (!data.claim) throw new Error("missing claim");
            return data.claim;
          })
          .catch(() => null)
          .then((claim) => {
            if (!claim) {
              updateVault((s) => ({
                ...s,
                claims: [
                  { ...c, id: uid("c"), createdAt: new Date().toISOString() },
                  ...s.claims,
                ],
              }));
              return;
            }

            updateVault((s) => ({
              ...s,
              claims: [claim, ...s.claims.filter((x) => x.id !== claim.id)],
            }));
          });
      },
      updateClaim: (id, patch) => {
        if (!state || !can(state.user.role, "manage_claims")) return;

        if (patch.status) {
          void fetch("/api/claims", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claimId: id, status: patch.status }),
          })
            .then(async (res) => {
              if (!res.ok) throw new Error("failed");
              const data = (await res.json()) as { claim?: InsuranceClaim };
              if (!data.claim) throw new Error("missing claim");
              return data.claim;
            })
            .catch(() => null)
            .then((claim) => {
              if (!claim) {
                updateVault((s) => ({
                  ...s,
                  claims: s.claims.map((x) => (x.id === id ? { ...x, ...patch } : x)),
                }));
                return;
              }

              updateVault((s) => ({
                ...s,
                claims: s.claims.map((x) => (x.id === id ? claim : x)),
              }));
            });
          return;
        }

        updateVault((s) => ({
          ...s,
          claims: s.claims.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
      },
      removeClaim: (id) => {
        if (!state || !can(state.user.role, "manage_claims")) return;

        void fetch(`/api/claims?claimId=${encodeURIComponent(id)}&familyId=${encodeURIComponent(state.user.familyId)}`, {
          method: "DELETE",
        })
          .catch(() => null)
          .finally(() => {
            updateVault((s) => ({
              ...s,
              claims: s.claims.filter((x) => x.id !== id),
            }));
          });
      },
      addVisit: (v) => {
        if (!state || !can(state.user.role, "manage_visits")) return;

        const payload = {
          familyId: state.user.familyId,
          userId: state.user.id,
          memberId: v.memberId,
          hospital: v.hospital,
          doctor: v.doctor,
          department: v.department,
          visitType: v.visitType,
          date: v.date,
          reason: v.reason,
          followUpDate: v.followUpDate,
          amount: v.amount,
          documentIds: v.documentIds,
        };

        void fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("failed");
            const data = (await res.json()) as { visit?: HospitalVisit };
            if (!data.visit) throw new Error("missing visit");
            return data.visit;
          })
          .catch(() => null)
          .then((visit) => {
            if (!visit) {
              updateVault((s) => ({
                ...s,
                visits: [
                  { ...v, id: uid("v"), createdAt: new Date().toISOString() },
                  ...s.visits,
                ],
              }));
              return;
            }

            updateVault((s) => ({
              ...s,
              visits: [visit, ...s.visits.filter((x) => x.id !== visit.id)],
            }));
          });
      },
      updateVisit: (id, patch) => {
        if (!state || !can(state.user.role, "manage_visits")) return;
        updateVault((s) => ({
          ...s,
          visits: s.visits.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
      },
      removeVisit: (id) => {
        if (!state || !can(state.user.role, "manage_visits")) return;

        void fetch(`/api/visits?visitId=${encodeURIComponent(id)}&familyId=${encodeURIComponent(state.user.familyId)}`, {
          method: "DELETE",
        })
          .catch(() => null)
          .finally(() => {
            updateVault((s) => ({
              ...s,
              visits: s.visits.filter((x) => x.id !== id),
            }));
          });
      },
    }),
    [state, ready, dict, updateVault]
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teak-50 text-teak-800">
        <div className="animate-pulse-soft font-display text-xl tracking-wide">
          HealthVault India
        </div>
      </div>
    );
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}

/** Use only inside authenticated /app routes after AuthGuard */
export function useVaultState(): AppState {
  const { state } = useVault();
  if (!state) throw new Error("Not authenticated");
  return state;
}
