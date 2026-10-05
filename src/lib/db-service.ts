import {
  BillCategory as DbBillCategory,
  ClaimStatus as DbClaimStatus,
  DocumentType as DbDocumentType,
  UserRole as DbUserRole,
  VisitType as DbVisitType,
  type Document as DbDocument,
  type DocumentCategory as DbDocumentCategory,
  type FamilyMember as DbFamilyMember,
  type HospitalVisit as DbHospitalVisit,
  type InsuranceClaim as DbInsuranceClaim,
  type User as DbUser,
} from "@prisma/client";
import { prisma } from "./db";
import type {
  BillCategory,
  ClaimStatus,
  DocumentType,
  FamilyMember,
  HospitalVisit,
  InsuranceClaim,
  MedicalDocument,
  UserRole,
  VisitType,
} from "./types";

export async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

export async function createFamilyWithOwner(input: {
  familyName: string;
  fullName: string;
  email: string;
  passwordHash: string;
}): Promise<{ id: string; ownerId: string; memberId: string }> {
  const family = await prisma.family.create({
    data: {
      name: input.familyName.trim() || "My Family",
    },
  });

  const member = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: input.fullName.trim(),
      relation: "Self",
      avatarColor: "#557a5d",
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      familyId: family.id,
      role: DbUserRole.OWNER,
      memberId: member.id,
    },
  });

  return { id: family.id, ownerId: owner.id, memberId: member.id };
}

export async function createFamilyMember(input: {
  familyId: string;
  name: string;
  relation: string;
  bloodGroup?: string;
  phone?: string;
  dateOfBirth?: string;
  avatarColor?: string;
}) {
  const member = await prisma.familyMember.create({
    data: {
      familyId: input.familyId,
      name: input.name.trim(),
      relation: input.relation.trim() || "Family",
      bloodGroup: input.bloodGroup || null,
      phone: input.phone || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      avatarColor: input.avatarColor || "#3a4352",
    },
  });

  return member;
}

export async function getFamilyData(familyId: string) {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      users: true,
      documents: {
        include: {
          categories: true,
        },
      },
      claims: true,
      visits: true,
    },
  });

  if (!family) return null;

  return {
    family: {
      id: family.id,
      name: family.name,
      createdAt: family.createdAt.toISOString(),
    },
    members: family.members.map(mapMember),
    users: family.users.map(mapUser),
    documents: family.documents.map(mapDocument),
    claims: family.claims.map(mapClaim),
    visits: family.visits.map(mapVisit),
  };
}

export async function createDocument(input: {
  familyId: string;
  userId?: string;
  memberId?: string;
  title: string;
  type: DocumentType;
  hospital?: string;
  date?: string;
  amount?: number;
  notes?: string;
  fileName?: string;
  fileUrl?: string;
  tags?: string[];
  extractedByAi?: boolean;
  categories?: Array<{ category: BillCategory; amount: number; label?: string }>;
}) {
  const doc = await prisma.document.create({
    data: {
      familyId: input.familyId,
      userId: input.userId || null,
      memberId: input.memberId || null,
      title: input.title,
      type: toDbDocumentType(input.type),
      hospital: input.hospital || null,
      date: input.date ? new Date(input.date) : null,
      amount: input.amount !== undefined ? input.amount : null,
      notes: input.notes || null,
      fileName: input.fileName || null,
      fileUrl: input.fileUrl || null,
      tags: input.tags || [],
      extractedByAi: Boolean(input.extractedByAi),
      categories: {
        create: (input.categories || []).map((category) => ({
          category: toDbBillCategory(category.category),
          amount: category.amount,
          label: category.label || null,
        })),
      },
    },
    include: {
      categories: true,
    },
  });

  return mapDocument(doc);
}

export async function createClaim(input: {
  familyId: string;
  userId?: string;
  memberId?: string;
  title: string;
  insurer: string;
  policyNumber: string;
  claimNumber?: string;
  hospital?: string;
  amountClaimed: number;
  amountApproved?: number;
  status?: ClaimStatus;
  notes?: string;
  documentIds?: string[];
}) {
  const claim = await prisma.insuranceClaim.create({
    data: {
      familyId: input.familyId,
      userId: input.userId || null,
      memberId: input.memberId || null,
      title: input.title,
      insurer: input.insurer,
      policyNumber: input.policyNumber,
      claimNumber: input.claimNumber || null,
      hospital: input.hospital || null,
      amountClaimed: input.amountClaimed,
      amountApproved: input.amountApproved || null,
      status: toDbClaimStatus(input.status || "draft"),
      notes: input.notes || null,
      documentIds: input.documentIds || [],
    },
  });

  return mapClaim(claim);
}

export async function createVisit(input: {
  familyId: string;
  userId?: string;
  memberId?: string;
  hospital: string;
  doctor?: string;
  department?: string;
  visitType: VisitType;
  date: string;
  reason?: string;
  followUpDate?: string;
  amount?: number;
  notes?: string;
  documentIds?: string[];
}) {
  const visit = await prisma.hospitalVisit.create({
    data: {
      familyId: input.familyId,
      userId: input.userId || null,
      memberId: input.memberId || null,
      hospital: input.hospital,
      doctor: input.doctor || null,
      department: input.department || null,
      visitType: toDbVisitType(input.visitType),
      date: new Date(input.date),
      reason: input.reason || null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      amount: input.amount || null,
      notes: input.notes || null,
      documentIds: input.documentIds || [],
    },
  });

  return mapVisit(visit);
}

function toDbDocumentType(type: DocumentType): DbDocumentType {
  switch (type) {
    case "bill":
      return DbDocumentType.BILL;
    case "prescription":
      return DbDocumentType.PRESCRIPTION;
    case "report":
      return DbDocumentType.REPORT;
    case "insurance":
      return DbDocumentType.INSURANCE;
    default:
      return DbDocumentType.OTHER;
  }
}

function toDbBillCategory(category: BillCategory): DbBillCategory {
  switch (category) {
    case "consultation":
      return DbBillCategory.CONSULTATION;
    case "diagnostics":
      return DbBillCategory.DIAGNOSTICS;
    case "medicines":
      return DbBillCategory.MEDICINES;
    case "room":
      return DbBillCategory.ROOM;
    default:
      return DbBillCategory.OTHER;
  }
}

function toDbClaimStatus(status: ClaimStatus): DbClaimStatus {
  switch (status) {
    case "draft":
      return DbClaimStatus.DRAFT;
    case "submitted":
      return DbClaimStatus.SUBMITTED;
    case "under_review":
      return DbClaimStatus.UNDER_REVIEW;
    case "approved":
      return DbClaimStatus.APPROVED;
    case "rejected":
      return DbClaimStatus.REJECTED;
    default:
      return DbClaimStatus.PAID;
  }
}

function toDbVisitType(type: VisitType): DbVisitType {
  switch (type) {
    case "opd":
      return DbVisitType.OPD;
    case "ipd":
      return DbVisitType.IPD;
    case "emergency":
      return DbVisitType.EMERGENCY;
    case "lab":
      return DbVisitType.LAB;
    default:
      return DbVisitType.TELECONSULT;
  }
}

function mapMember(member: DbFamilyMember & { user?: { id: string } | null }): FamilyMember {
  return {
    id: member.id,
    name: member.name,
    relation: member.relation,
    dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : undefined,
    bloodGroup: member.bloodGroup || undefined,
    phone: member.phone || undefined,
    avatarColor: member.avatarColor || "#3a4352",
    userId: member.user?.id || undefined,
  };
}

function mapUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    familyId: user.familyId,
    role: user.role.toLowerCase() as UserRole,
    memberId: user.memberId || "",
  };
}

function mapDocument(doc: DbDocument & { categories?: DbDocumentCategory[] }): MedicalDocument {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type.toLowerCase() as DocumentType,
    memberId: doc.memberId || "",
    hospital: doc.hospital || undefined,
    date: doc.date ? doc.date.toISOString().slice(0, 10) : "",
    amount: doc.amount !== null && doc.amount !== undefined ? Number(doc.amount) : undefined,
    categories:
      doc.categories?.map((category) => ({
        category: category.category.toLowerCase() as BillCategory,
        amount: Number(category.amount),
        label: category.label || undefined,
      })) || [],
    notes: doc.notes || undefined,
    fileName: doc.fileName || undefined,
    fileDataUrl: doc.fileUrl || undefined,
    tags: doc.tags || [],
    extractedByAi: Boolean(doc.extractedByAi),
    createdAt: doc.createdAt.toISOString(),
    createdByUserId: doc.userId || undefined,
  };
}

function mapClaim(claim: DbInsuranceClaim): InsuranceClaim {
  return {
    id: claim.id,
    title: claim.title,
    memberId: claim.memberId || "",
    insurer: claim.insurer,
    policyNumber: claim.policyNumber,
    claimNumber: claim.claimNumber || undefined,
    hospital: claim.hospital || undefined,
    amountClaimed: Number(claim.amountClaimed),
    amountApproved: claim.amountApproved !== null ? Number(claim.amountApproved) : undefined,
    status: claim.status.toLowerCase() as ClaimStatus,
    documentIds: claim.documentIds || [],
    submittedAt: claim.submittedAt ? claim.submittedAt.toISOString() : undefined,
    notes: claim.notes || undefined,
    createdAt: claim.createdAt.toISOString(),
  };
}

function mapVisit(visit: DbHospitalVisit): HospitalVisit {
  return {
    id: visit.id,
    memberId: visit.memberId || "",
    hospital: visit.hospital,
    doctor: visit.doctor || undefined,
    department: visit.department || undefined,
    visitType: visit.visitType.toLowerCase() as VisitType,
    date: visit.date.toISOString().slice(0, 10),
    reason: visit.reason || undefined,
    followUpDate: visit.followUpDate ? visit.followUpDate.toISOString().slice(0, 10) : undefined,
    documentIds: visit.documentIds || [],
    amount: visit.amount !== null && visit.amount !== undefined ? Number(visit.amount) : undefined,
    notes: visit.notes || undefined,
    createdAt: visit.createdAt.toISOString(),
  };
}
