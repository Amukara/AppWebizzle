import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalisePhone } from "@/lib/sms";
import { getPortalSession, portalUnauthorized } from "@/lib/portal-auth";

// GET /api/portal/vendor?vendorId=v1  — fetch a vendor portal profile (session-gated).
// GET /api/portal/vendor?phone=0712345678  — look up vendor portal by phone (OTP-authenticated).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const phone = searchParams.get("phone");

  // --- Phone-based lookup (after OTP verification) ---
  if (phone) {
    const session = getPortalSession(req, "VENDOR_LOGIN");
    if (!session) {
      return portalUnauthorized();
    }
    const norm = normalisePhone(phone);
    const sessionNorm = normalisePhone(session.phone);
    if (norm !== sessionNorm) {
      return portalUnauthorized();
    }

    const portal = await db.vendorPortal.findFirst({ where: { phone: norm } });
    if (!portal) {
      // Check VendorApplication for pending/approved vendors
      const app = await db.vendorApplication.findFirst({
        where: { phone: norm, status: { in: ["PENDING", "APPROVED"] } },
        orderBy: { createdAt: "desc" },
      });
      if (app) {
        return NextResponse.json({
          error: app.status === "PENDING"
            ? "Your vendor application is still pending approval. We'll notify you once approved."
            : "Your application was approved but your shop isn't set up yet. Contact support.",
        }, { status: 403 });
      }
      return NextResponse.json(
        { error: "No vendor found for this phone. Please register as a vendor first." },
        { status: 404 }
      );
    }
    const vendor = await db.vendor.findUnique({ where: { id: portal.vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({
      portal: {
        id: portal.id,
        vendorId: portal.vendorId,
        shopName: portal.shopName,
        phone: portal.phone,
        isOnline: portal.isOnline,
        dutyStart: portal.dutyStart,
        dutyEnd: portal.dutyEnd,
        lastSeen: portal.lastSeen.toISOString(),
      },
      vendor: {
        id: vendor.id,
        name: vendor.name,
        emoji: vendor.emoji,
        type: vendor.type,
        location: vendor.location,
        rating: vendor.rating,
      },
    });
  }

  // --- vendorId-based lookup (session-gated) ---
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId or phone is required" }, { status: 400 });
  }

  const session = getPortalSession(req, "VENDOR_LOGIN");
  if (!session) {
    return portalUnauthorized();
  }

  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Verify this vendor portal belongs to the session's phone.
  // MUST have a non-empty phone that matches — no exceptions.
  const portal = await db.vendorPortal.findUnique({ where: { vendorId } });
  if (!portal || !portal.phone) {
    return NextResponse.json(
      { error: "Vendor portal not linked to a phone number yet. Use phone-based login to initialise." },
      { status: 403 }
    );
  }
  const portalNorm = normalisePhone(portal.phone);
  const sessionNorm = normalisePhone(session.phone);
  if (portalNorm !== sessionNorm) {
    return portalUnauthorized();
  }

  return NextResponse.json({
    portal: {
      id: portal.id,
      vendorId: portal.vendorId,
      shopName: portal.shopName,
      phone: portal.phone,
      isOnline: portal.isOnline,
      dutyStart: portal.dutyStart,
      dutyEnd: portal.dutyEnd,
      lastSeen: portal.lastSeen.toISOString(),
    },
    vendor: {
      id: vendor.id,
      name: vendor.name,
      emoji: vendor.emoji,
      type: vendor.type,
      location: vendor.location,
      rating: vendor.rating,
    },
  });
}

// PATCH /api/portal/vendor — update duty hours, phone, and/or online status.
export async function PATCH(req: Request) {
  const session = getPortalSession(req, "VENDOR_LOGIN");
  if (!session) {
    return portalUnauthorized();
  }

  let body: {
    vendorId?: string;
    isOnline?: boolean;
    dutyStart?: string;
    dutyEnd?: string;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  // Verify the vendor portal exists and belongs to this session's phone.
  // MUST have a non-empty phone that matches — no exceptions.
  const existingPortal = await db.vendorPortal.findUnique({
    where: { vendorId: body.vendorId },
  });
  if (!existingPortal || !existingPortal.phone) {
    return NextResponse.json(
      { error: "Vendor portal not linked to a phone number yet. Use phone-based login to initialise." },
      { status: 403 }
    );
  }
  const portalNorm = normalisePhone(existingPortal.phone);
  const sessionNorm = normalisePhone(session.phone);
  if (portalNorm !== sessionNorm) {
    return portalUnauthorized();
  }

  const data: Record<string, unknown> = { lastSeen: new Date() };
  if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
  if (typeof body.dutyStart === "string" && /^\d{2}:\d{2}$/.test(body.dutyStart))
    data.dutyStart = body.dutyStart;
  if (typeof body.dutyEnd === "string" && /^\d{2}:\d{2}$/.test(body.dutyEnd))
    data.dutyEnd = body.dutyEnd;
  if (typeof body.phone === "string") data.phone = body.phone.trim();

  const portal = await db.vendorPortal.update({
    where: { vendorId: body.vendorId },
    data,
  });
  return NextResponse.json({
    portal: {
      id: portal.id,
      vendorId: portal.vendorId,
      shopName: portal.shopName,
      phone: portal.phone,
      isOnline: portal.isOnline,
      dutyStart: portal.dutyStart,
      dutyEnd: portal.dutyEnd,
      lastSeen: portal.lastSeen.toISOString(),
    },
  });
}