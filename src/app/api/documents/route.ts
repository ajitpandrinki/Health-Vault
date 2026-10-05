import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BillCategory as DbBillCategory, DocumentType as DbDocumentType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const familyId = String(body.familyId || "");
    const userId = body.userId ? String(body.userId) : null;
    const memberId = body.memberId ? String(body.memberId) : null;
    const title = String(body.title || "").trim();
    const type = String(body.type || "bill").toUpperCase();
    const hospital = body.hospital ? String(body.hospital) : null;
    const date = body.date ? new Date(body.date) : null;
    const amount = body.amount !== undefined && body.amount !== null ? Number(body.amount) : null;
    const notes = body.notes ? String(body.notes) : null;
    const fileName = body.fileName ? String(body.fileName) : null;
    const fileUrl = body.fileUrl ? String(body.fileUrl) : null;
    const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
    const extractedByAi = Boolean(body.extractedByAi);
    const categories: Array<{ category: string; amount: number; label: string | null }> = Array.isArray(body.categories)
      ? body.categories.map((category: { category?: string; amount?: number; label?: string }) => ({
          category: String(category.category || "other").toUpperCase(),
          amount: Number(category.amount || 0),
          label: category.label ? String(category.label) : null,
        }))
      : [];

    if (!familyId || !title) {
      return NextResponse.json({ error: "familyId and title are required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        familyId,
        userId,
        memberId,
        title,
        type: type as DbDocumentType,
        hospital,
        date,
        amount,
        notes,
        fileName,
        fileUrl,
        tags,
        extractedByAi,
        categories: {
          create: categories.map((category: { category: string; amount: number; label: string | null }) => ({
            category: category.category as DbBillCategory,
            amount: category.amount,
            label: category.label,
          })),
        },
      },
      include: { categories: true },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        type: document.type.toLowerCase(),
        memberId: document.memberId || "",
        hospital: document.hospital || undefined,
        date: document.date ? document.date.toISOString().slice(0, 10) : "",
        amount: document.amount ? Number(document.amount) : undefined,
        categories: document.categories.map((category) => ({
          category: category.category.toLowerCase(),
          amount: Number(category.amount),
          label: category.label || undefined,
        })),
        notes: document.notes || undefined,
        fileName: document.fileName || undefined,
        fileDataUrl: document.fileUrl || undefined,
        tags: document.tags || [],
        extractedByAi: document.extractedByAi,
        createdAt: document.createdAt.toISOString(),
        createdByUserId: document.userId || undefined,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const familyId = searchParams.get("familyId");

    if (!documentId || !familyId) {
      return NextResponse.json({ error: "documentId and familyId are required" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { categories: true },
    });

    if (!document || document.familyId !== familyId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.documentCategory.deleteMany({ where: { documentId } });
    await prisma.document.delete({ where: { id: documentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete document" }, { status: 500 });
  }
}
