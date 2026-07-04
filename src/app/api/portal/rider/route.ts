import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickRider } from "@/lib/pricing";
import { getPortalSession, portalUnauthorized } from "@/lib/portal-auth";
import { normalisePhone } from "@/lib/sms";

// GET /api/portal/rider?riderKey=0711... — fetch (or auto-create) a rider portal profile.
// The riderKey is the rider's phone (used to log in to the portal).
export async function GET(req: Request) {
  // Verify portal session — must be a RIDER_LOGIN token
  const session = getPortalSession(req, "RIDER_LOGIN");
  if (!session) {
    return portalUnauthorized();
  }

  const { searchParams } = new URL(req.url);
  const riderKey = searchParams.get("riderKey")?.trim();
  if (!riderKey) {
    return NextResponse.json({ error: "riderKey is required" }, { status: 400 });
  }

  // Identity check: the session's phone must match the requested riderKey
  const keyNorm = normalisePhone(riderKey);
  const sessionNorm = normalisePhone(session.phone);
  if (keyNorm !== sessionNorm) {
    return portalUnauthorized();
  }

  // Use the raw riderKey for DB lookups (that's what the client stores/uses),
  // but fall back to normalised form if no existing record found.
  const portal = await db.riderPortal.upsert({
    where: { riderKey },
    update: {},
    create: {
      riderKey,
      fullName: pickRider(riderKey).name,
      phone: riderKey,
      plate: pickRider(riderKey).plate,
    },
  });
  return NextResponse.json({
    portal: {
      id: portal.id,
      riderKey: portal.riderKey,
      fullName: portal.fullName,
      phone: portal.phone,
      plate: portal.plate,
      isOnline: portal.isOnline,
      lastSeen: portal.lastSeen.toISOString(),
    },
  });
}

// PATCH /api/portal/rider — update online status / profile fields.
export async function PATCH(req: Request) {
  // Verify portal session — must be a RIDER_LOGIN token
  const session = getPortalSession(req, "RIDER_LOGIN");
  if (!session) {
    return portalUnauthorized();
  }

  let body: {
    riderKey?: string;
    isOnline?: boolean;
    fullName?: string;
    plate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.riderKey) {
    return NextResponse.json({ error: "riderKey is required" }, { status: 400 });
  }

  // Identity check: the session's phone must match the riderKey being modified
  const keyNorm = normalisePhone(body.riderKey);
  const sessionNorm = normalisePhone(session.phone);
  if (keyNorm !== sessionNorm) {
    return portalUnauthorized();
  }

  const data: Record<string, unknown> = { lastSeen: new Date() };
  if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
  if (typeof body.fullName === "string") data.fullName = body.fullName.trim();
  if (typeof body.plate === "string") data.plate = body.plate.trim();

  // Pre-fill name/plate from the deterministic rider pool if blank.
  const seeded = pickRider(body.riderKey);
  const existing = await db.riderPortal.findUnique({ where: { riderKey: body.riderKey } });
  if (!existing || !existing.fullName) {
    if (!existing?.fullName) data.fullName = data.fullName || seeded.name;
    if (!existing?.plate) data.plate = data.plate || seeded.plate;
  }

  const portal = await db.riderPortal.upsert({
    where: { riderKey: body.riderKey },
    update: data,
    create: {
      riderKey: body.riderKey,
      phone: body.riderKey,
      fullName: typeof body.fullName === "string" ? body.fullName.trim() : seeded.name,
      plate: typeof body.plate === "string" ? body.plate.trim() : seeded.plate,
      isOnline: typeof body.isOnline === "boolean" ? body.isOnline : false,
    },
  });
  return NextResponse.json({
    portal: {
      id: portal.id,
      riderKey: portal.riderKey,
      fullName: portal.fullName,
      phone: portal.phone,
      plate: portal.plate,
      isOnline: portal.isOnline,
      lastSeen: portal.lastSeen.toISOString(),
    },
  });
}