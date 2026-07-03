import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import type { AdminBoost } from "@/lib/types";

// GET /api/admin/boosts — all boost campaigns
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const rows = await db.boostCampaign.findMany({ orderBy: { createdAt: "desc" } });
  const data: AdminBoost[] = rows.map((b) => ({
    id: b.id,
    shopName: b.shopName,
    phone: b.phone,
    package: b.package,
    price: b.price,
    status: b.status,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    impressions: b.impressions,
    clicks: b.clicks,
  }));
  return NextResponse.json({ boosts: data });
}

// PATCH /api/admin/boosts — pause / resume / expire a boost
export async function PATCH(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !["ACTIVE", "PAUSED", "EXPIRED"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const updated = await db.boostCampaign.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
