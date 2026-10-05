import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ClaimStatus as DbClaimStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const familyId = String(body.familyId || "");
    const userId = body.userId ? String(body.userId) : null;
    const memberId = body.memberId ? String(body.memberId) : null;
    const title = String(body.title || "").trim();
    const insurer = String(body.insurer || "").trim();
    const policyNumber = String(body.policyNumber || "").trim();
    const claimNumber = body.claimNumber ? String(body.claimNumber) : null;
    const hospital = body.hospital ? String(body.hospital) : null;
    const amountClaimed = Number(body.amountClaimed || 0);
    const amountApproved = body.amountApproved !== undefined && body.amountApproved !== null ? Number(body.amountApproved) : null;
    const status = String(body.status || "draft").toUpperCase();
    const notes = body.notes ? String(body.notes) : null;
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.map(String) : [];
    const submittedAt = body.submittedAt ? new Date(body.submittedAt) : null;

    if (!familyId || !title || !insurer || !policyNumber) {
      return NextResponse.json({ error: "familyId, title, insurer, and policyNumber are required" }, { status: 400 });
    }

    const claim = await prisma.insuranceClaim.create({
      data: {
        familyId,
        userId,
        memberId,
        title,
        insurer,
        policyNumber,
        claimNumber,
        hospital,
        amountClaimed,
        amountApproved,
        status: status as DbClaimStatus,
        notes,
        documentIds,
        submittedAt,
      },
    });

    return NextResponse.json({
      claim: {
        id: claim.id,
        title: claim.title,
        memberId: claim.memberId || "",
        insurer: claim.insurer,
        policyNumber: claim.policyNumber,
        claimNumber: claim.claimNumber || undefined,
        hospital: claim.hospital || undefined,
        amountClaimed: Number(claim.amountClaimed),
        amountApproved: claim.amountApproved !== null ? Number(claim.amountApproved) : undefined,
        status: claim.status.toLowerCase(),
        documentIds: claim.documentIds || [],
        submittedAt: claim.submittedAt ? claim.submittedAt.toISOString() : undefined,
        notes: claim.notes || undefined,
        createdAt: claim.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create claim" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const claimId = String(body.claimId || "");
    const status = body.status ? String(body.status).toUpperCase() : null;

    if (!claimId || !status) {
      return NextResponse.json({ error: "claimId and status are required" }, { status: 400 });
    }

    const claim = await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        status: status as DbClaimStatus,
      },
    });

    return NextResponse.json({
      claim: {
        id: claim.id,
        title: claim.title,
        memberId: claim.memberId || "",
        insurer: claim.insurer,
        policyNumber: claim.policyNumber,
        claimNumber: claim.claimNumber || undefined,
        hospital: claim.hospital || undefined,
        amountClaimed: Number(claim.amountClaimed),
        amountApproved: claim.amountApproved !== null ? Number(claim.amountApproved) : undefined,
        status: claim.status.toLowerCase(),
        documentIds: claim.documentIds || [],
        submittedAt: claim.submittedAt ? claim.submittedAt.toISOString() : undefined,
        notes: claim.notes || undefined,
        createdAt: claim.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update claim" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const claimId = searchParams.get("claimId");
    const familyId = searchParams.get("familyId");

    if (!claimId || !familyId) {
      return NextResponse.json({ error: "claimId and familyId are required" }, { status: 400 });
    }

    const claim = await prisma.insuranceClaim.findUnique({ where: { id: claimId } });
    if (!claim || claim.familyId !== familyId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    await prisma.insuranceClaim.delete({ where: { id: claimId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete claim" }, { status: 500 });
  }
}
