import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const familyName = String(body.familyName || "").trim();
    const password = String(body.password || "");

    if (!fullName || !email || !familyName || password.length < 6) {
      return NextResponse.json({ error: "Please provide valid registration details." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const family = await prisma.family.create({
      data: { name: familyName || "My Family" },
    });

    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        name: fullName,
        relation: "Self",
        avatarColor: "#557a5d",
      },
    });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        familyId: family.id,
        role: "OWNER",
        memberId: member.id,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        familyId: user.familyId,
        role: user.role.toLowerCase(),
        memberId: user.memberId || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 },
    );
  }
}
