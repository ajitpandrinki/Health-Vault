import { NextResponse } from "next/server";
import { createFamilyWithOwner, getFamilyData } from "@/lib/db-service";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  const data = await getFamilyData(familyId);

  if (!data) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const familyName = body.familyName as string | undefined;
  const fullName = body.fullName as string | undefined;
  const email = body.email as string | undefined;
  const passwordHash = body.passwordHash as string | undefined;

  if (!familyName || !fullName || !email || !passwordHash) {
    return NextResponse.json(
      { error: "familyName, fullName, email, and passwordHash are required" },
      { status: 400 },
    );
  }

  const family = await createFamilyWithOwner({
    familyName,
    fullName,
    email,
    passwordHash,
  });

  return NextResponse.json(family, { status: 201 });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const familyId = String(body.familyId || "").trim();
    const name = String(body.name || "").trim();

    if (!familyId || !name) {
      return NextResponse.json({ error: "familyId and name are required" }, { status: 400 });
    }

    const family = await prisma.family.update({
      where: { id: familyId },
      data: { name },
    });

    return NextResponse.json({
      ok: true,
      family: {
        id: family.id,
        name: family.name,
        createdAt: family.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update family" },
      { status: 500 },
    );
  }
}
