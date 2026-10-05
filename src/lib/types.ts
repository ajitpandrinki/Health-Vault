export type DocumentType = "bill" | "prescription" | "report" | "insurance" | "other";
export type ClaimStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "paid";
export type VisitType = "opd" | "ipd" | "emergency" | "lab" | "teleconsult";
export type Locale = "en" | "hi";

/** Account roles for vault access */
export type UserRole = "owner" | "admin" | "member" | "viewer";

export type BillCategory =
  | "consultation"
  | "diagnostics"
  | "medicines"
  | "room"
  | "other";

export interface BillLineItem {
  category: BillCategory;
  amount: number;
  label?: string;
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  phone?: string;
  avatarColor: string;
  /** Linked login account, if this person has one */
  userId?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  familyId: string;
  role: UserRole;
  memberId: string;
  createdAt: string;
}

/** Safe user shape exposed to the UI (no password) */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  familyId: string;
  role: UserRole;
  memberId: string;
}

export interface MedicalDocument {
  id: string;
  title: string;
  type: DocumentType;
  memberId: string;
  hospital?: string;
  date: string;
  amount?: number;
  categories?: BillLineItem[];
  notes?: string;
  fileName?: string;
  fileDataUrl?: string;
  tags: string[];
  extractedByAi?: boolean;
  createdAt: string;
  createdByUserId?: string;
}

export interface InsuranceClaim {
  id: string;
  title: string;
  memberId: string;
  insurer: string;
  policyNumber: string;
  claimNumber?: string;
  hospital?: string;
  amountClaimed: number;
  amountApproved?: number;
  status: ClaimStatus;
  documentIds: string[];
  submittedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface HospitalVisit {
  id: string;
  memberId: string;
  hospital: string;
  doctor?: string;
  department?: string;
  visitType: VisitType;
  date: string;
  reason?: string;
  followUpDate?: string;
  documentIds: string[];
  amount?: number;
  notes?: string;
  createdAt: string;
}

export interface AiExtractionResult {
  hospital: string;
  date: string;
  total: number;
  categories: BillLineItem[];
  doctor?: string;
  patientName?: string;
  confidence: number;
}

export interface VaultData {
  family: Family;
  members: FamilyMember[];
  documents: MedicalDocument[];
  claims: InsuranceClaim[];
  visits: HospitalVisit[];
  locale: Locale;
}

export interface AppState extends VaultData {
  user: SessionUser;
  /** Other login accounts in this family (for role management) */
  familyUsers: SessionUser[];
}

export type Permission =
  | "view"
  | "upload"
  | "edit_docs"
  | "delete_docs"
  | "manage_claims"
  | "manage_visits"
  | "manage_members"
  | "manage_roles"
  | "rename_family"
  | "invite_user";
