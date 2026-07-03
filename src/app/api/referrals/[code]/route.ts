import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/referrals/[code] — resolve a referral code (landing page view)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ref = await db.referral.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!ref) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }
  return NextResponse.json({
    code: ref.code,
    ownerName: ref.ownerName,
    rewardEarned: ref.rewardEarned,
    status: ref.status,
  });
}

// POST /api/referrals/[code] — record an event (click or signup) on a code
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { event?: "click" | "signup" };
  try {
    body = await req.json();
  } catch {
    body = { event: "click" };
  }

  const ref = await db.referral.findUnique({ where: { code: code.toUpperCase() } });
  if (!ref) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  const event = body.event === "signup" ? "signup" : "click";
  const inc = event === "signup" ? { signups: 1 } : { clicks: 1 };
  await db.referral.update({ where: { id: ref.id }, data: inc });

  return NextResponse.json({ ok: true, event });
}
