import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/applications/rider — apply to become a rider
export async function POST(req: Request) {
  let body: { fullName?: string; phone?: string; bikePlate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.fullName?.trim() || !body.phone?.trim() || !body.bikePlate?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const app = await db.riderApplication.create({
    data: {
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      bikePlate: body.bikePlate.trim().toUpperCase(),
      status: "PENDING",
    },
  });

  return NextResponse.json({
    ok: true,
    applicationId: app.id,
    message: "Application received! We'll reach out once onboarding opens in your area.",
  });
}
