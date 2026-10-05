import { NextResponse } from "next/server";
import { getDatabaseHealth } from "@/lib/db-service";

export async function GET() {
  const health = await getDatabaseHealth();

  return NextResponse.json({
    status: health.ok ? "ok" : "error",
    database: health,
  }, {
    status: health.ok ? 200 : 500,
  });
}
