import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Build a human-readable, Kenya-friendly code from the owner's name.
function buildCode(name: string, attempt = 0): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6)
    .padEnd(3, "X");
  const suffix = (attempt + Math.floor(Math.random() * 9000 + 100)).toString();
  return `${base}${suffix}`.slice(0, 10);
}

// GET /api/referrals?phone=07XX — list the caller's referral codes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ referrals: [] });
  }
  const refs = await db.referral.findMany({
    where: { ownerPhone: phone.trim() },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    referrals: refs.map((r) => ({
      id: r.id,
      code: r.code,
      ownerName: r.ownerName,
      ownerPhone: r.ownerPhone,
      clicks: r.clicks,
      signups: r.signups,
      orders: r.orders,
      rewardEarned: r.rewardEarned,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

// POST /api/referrals — create a new referral code
export async function POST(req: Request) {
  let body: { ownerName?: string; ownerPhone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.ownerName?.trim() || !body.ownerPhone?.trim()) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  // Generate a unique code with retry.
  let code = "";
  for (let i = 0; i < 8; i++) {
    const candidate = buildCode(body.ownerName, i);
    const exists = await db.referral.findUnique({ where: { code: candidate } });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
  }

  const ref = await db.referral.create({
    data: {
      code,
      ownerName: body.ownerName.trim(),
      ownerPhone: body.ownerPhone.trim(),
    },
  });

  return NextResponse.json({
    ok: true,
    referral: {
      id: ref.id,
      code: ref.code,
      ownerName: ref.ownerName,
      ownerPhone: ref.ownerPhone,
      clicks: ref.clicks,
      signups: ref.signups,
      orders: ref.orders,
      rewardEarned: ref.rewardEarned,
      status: ref.status,
      createdAt: ref.createdAt.toISOString(),
    },
  });
}
