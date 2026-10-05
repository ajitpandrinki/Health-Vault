import type {
  VaultData,
  FamilyMember,
  MedicalDocument,
  InsuranceClaim,
  HospitalVisit,
  Locale,
} from "./types";

const VAULT_PREFIX = "hv_vault_v2_";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const COLORS = [
  "#557a5d",
  "#f05f06",
  "#3a4352",
  "#8694ab",
  "#c74607",
  "#354e3b",
];

export function emptyVault(
  familyId: string,
  familyName: string,
  members: FamilyMember[] = []
): VaultData {
  return {
    family: {
      id: familyId,
      name: familyName,
      createdAt: new Date().toISOString(),
    },
    members,
    documents: [] as MedicalDocument[],
    claims: [] as InsuranceClaim[],
    visits: [] as HospitalVisit[],
    locale: "en" as Locale,
  };
}

export function vaultKey(familyId: string): string {
  return `${VAULT_PREFIX}${familyId}`;
}

export function loadVault(familyId: string): VaultData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(vaultKey(familyId));
    if (!raw) return null;
    return JSON.parse(raw) as VaultData;
  } catch {
    return null;
  }
}

export function saveVault(vault: VaultData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(vaultKey(vault.family.id), JSON.stringify(vault));
}

export function deleteVault(familyId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(vaultKey(familyId));
}

/** Optional sample data for a brand-new empty vault (user chooses to load) */
export function createSampleDocuments(memberIds: {
  self: string;
  other?: string;
}): Pick<VaultData, "documents" | "claims" | "visits"> {
  const other = memberIds.other ?? memberIds.self;
  return {
    documents: [
      {
        id: uid("d"),
        title: "ABC Hospital — IPD Bill",
        type: "bill",
        memberId: other,
        hospital: "ABC Hospital",
        date: "2026-09-15",
        amount: 18450,
        categories: [
          { category: "consultation", amount: 1000 },
          { category: "diagnostics", amount: 3200 },
          { category: "medicines", amount: 6250 },
          { category: "room", amount: 5000 },
          { category: "other", amount: 3000 },
        ],
        tags: ["ipd", "sample"],
        extractedByAi: true,
        createdAt: new Date().toISOString(),
        notes: "Sample bill to explore AI categories",
      },
    ],
    claims: [],
    visits: [],
  };
}

// Legacy cleanup
const LEGACY_KEY = "healthvault-india-v1";

export function clearLegacyStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_KEY);
}
