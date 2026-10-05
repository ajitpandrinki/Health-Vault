import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VisitType as DbVisitType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const familyId = String(body.familyId || "");
    const userId = body.userId ? String(body.userId) : null;
    const memberId = body.memberId ? String(body.memberId) : null;
    const hospital = String(body.hospital || "").trim();
    const doctor = body.doctor ? String(body.doctor).trim() : null;
    const department = body.department ? String(body.department).trim() : null;
    const visitType = String(body.visitType || "opd").toUpperCase();
    const date = body.date ? new Date(body.date) : new Date();
    const reason = body.reason ? String(body.reason).trim() : null;
    const followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    const amount = body.amount !== undefined && body.amount !== null ? Number(body.amount) : null;
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.map(String) : [];

    if (!familyId || !hospital) {
      return NextResponse.json({ error: "familyId and hospital are required" }, { status: 400 });
    }

    const visit = await prisma.hospitalVisit.create({
      data: {
        familyId,
        userId,
        memberId,
        hospital,
        doctor,
        department,
        visitType: visitType as DbVisitType,
        date,
        reason,
        followUpDate,
        amount,
        documentIds,
      },
    });

    return NextResponse.json({
      visit: {
        id: visit.id,
        memberId: visit.memberId || "",
        hospital: visit.hospital,
        doctor: visit.doctor || undefined,
        department: visit.department || undefined,
        visitType: visit.visitType.toLowerCase(),
        date: visit.date.toISOString().slice(0, 10),
        reason: visit.reason || undefined,
        followUpDate: visit.followUpDate ? visit.followUpDate.toISOString().slice(0, 10) : undefined,
        documentIds: visit.documentIds || [],
        amount: visit.amount !== null ? Number(visit.amount) : undefined,
        createdAt: visit.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create visit" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const visitId = searchParams.get("visitId");
    const familyId = searchParams.get("familyId");

    if (!visitId || !familyId) {
      return NextResponse.json({ error: "visitId and familyId are required" }, { status: 400 });
    }

    const visit = await prisma.hospitalVisit.findUnique({ where: { id: visitId } });
    if (!visit || visit.familyId !== familyId) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    await prisma.hospitalVisit.delete({ where: { id: visitId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete visit" }, { status: 500 });
  }
}
