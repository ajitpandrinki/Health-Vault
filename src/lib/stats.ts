import type {
  AppState,
  BillCategory,
  MedicalDocument,
  FamilyMember,
  InsuranceClaim,
  HospitalVisit,
} from "./types";

export function sumAmounts(docs: MedicalDocument[]): number {
  return docs.reduce((s, d) => s + (d.amount ?? 0), 0);
}

export function isSameMonth(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function spendByCategory(docs: MedicalDocument[]): Record<BillCategory, number> {
  const out: Record<BillCategory, number> = {
    consultation: 0,
    diagnostics: 0,
    medicines: 0,
    room: 0,
    other: 0,
  };
  for (const d of docs) {
    if (d.categories?.length) {
      for (const c of d.categories) out[c.category] += c.amount;
    } else if (d.amount) {
      out.other += d.amount;
    }
  }
  return out;
}

export function spendByMember(
  state: AppState
): { member: FamilyMember; total: number }[] {
  return state.members.map((m) => ({
    member: m,
    total: sumAmounts(state.documents.filter((d) => d.memberId === m.id)),
  }));
}

export function searchDocuments(
  docs: MedicalDocument[],
  query: string
): MedicalDocument[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter((d) => {
    const hay = [
      d.title,
      d.hospital,
      d.notes,
      d.type,
      d.tags.join(" "),
      d.fileName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function memberName(
  state: { members: FamilyMember[] },
  id: string
): string {
  return state.members.find((m) => m.id === id)?.name ?? "—";
}

export function pendingClaimsCount(claims: InsuranceClaim[]): number {
  return claims.filter((c) =>
    ["draft", "submitted", "under_review"].includes(c.status)
  ).length;
}

export function sortByDateDesc<T extends { date?: string; createdAt: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ?? a.createdAt;
    const db = b.date ?? b.createdAt;
    return db.localeCompare(da);
  });
}

export function sortVisits(visits: HospitalVisit[]): HospitalVisit[] {
  return [...visits].sort((a, b) => b.date.localeCompare(a.date));
}
