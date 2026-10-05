import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const familyId = String(body.familyId || "");
    const name = String(body.name || "").trim();
    const relation = String(body.relation || "").trim();

    if (!familyId || !name || !relation) {
      return NextResponse.json({ error: "familyId, name, and relation are required" }, { status: 400 });
    }

    const member = await prisma.familyMember.create({
      data: {
        familyId,
        name,
        relation,
        bloodGroup: body.bloodGroup ? String(body.bloodGroup) : null,
        phone: body.phone ? String(body.phone) : null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        avatarColor: body.avatarColor ? String(body.avatarColor) : "#3a4352",
      },
    });

    return NextResponse.json({ member: {
      id: member.id,
      name: member.name,
      relation: member.relation,
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : undefined,
      bloodGroup: member.bloodGroup || undefined,
      phone: member.phone || undefined,
      avatarColor: member.avatarColor || "#3a4352",
      userId: undefined,
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create family member" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get("familyId");
    const memberId = searchParams.get("memberId");

    if (!familyId || !memberId) {
      return NextResponse.json({ error: "familyId and memberId are required" }, { status: 400 });
    }

    const member = await prisma.familyMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.familyId !== familyId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.user) {
      await prisma.user.update({
        where: { id: member.user.id },
        data: { memberId: null },
      });
    }

    await prisma.familyMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete family member" }, { status: 500 });
  }
}
