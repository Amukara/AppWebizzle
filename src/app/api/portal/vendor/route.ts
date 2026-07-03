import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalisePhone } from "@/lib/sms";

// GET /api/portal/vendor?vendorId=v1  — fetch (or auto-create) a vendor portal profile.
// GET /api/portal/vendor?phone=0712345678  — look up vendor portal by phone (OTP-authenticated).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const phone = searchParams.get("phone");

  if (phone) {
    // Phone-based lookup (after OTP verification)
    const norm = normalisePhone(phone);
    // Look for a VendorPortal with this phone number
    const portal = await db.vendorPortal.findFirst({ where: { phone: norm } });
    if (!portal) {
      // Also check VendorApplication for pending/approved vendors
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

  // vendorId-based lookup (legacy / internal)
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId or phone is required" }, { status: 400 });
  }
  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }
  // Auto-create the portal profile on first access.
  const portal = await db.vendorPortal.upsert({
    where: { vendorId },
    update: {},
    create: {
      vendorId,
      shopName: vendor.name,
      phone: "",
    },
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
  const data: Record<string, unknown> = { lastSeen: new Date() };
  if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
  if (typeof body.dutyStart === "string" && /^\d{2}:\d{2}$/.test(body.dutyStart))
    data.dutyStart = body.dutyStart;
  if (typeof body.dutyEnd === "string" && /^\d{2}:\d{2}$/.test(body.dutyEnd))
    data.dutyEnd = body.dutyEnd;
  if (typeof body.phone === "string") data.phone = body.phone.trim();

  // Fetch the vendor name for a clean create (if the profile doesn't exist yet).
  const vendor = await db.vendor.findUnique({ where: { id: body.vendorId } });
  const portal = await db.vendorPortal.upsert({
    where: { vendorId: body.vendorId },
    update: data,
    create: {
      vendorId: body.vendorId,
      shopName: vendor?.name ?? "",
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      isOnline: typeof body.isOnline === "boolean" ? body.isOnline : false,
      dutyStart:
        typeof body.dutyStart === "string" && /^\d{2}:\d{2}$/.test(body.dutyStart)
          ? body.dutyStart
          : "07:00",
      dutyEnd:
        typeof body.dutyEnd === "string" && /^\d{2}:\d{2}$/.test(body.dutyEnd)
          ? body.dutyEnd
          : "21:00",
    },
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