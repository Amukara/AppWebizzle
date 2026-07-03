import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";

// GET /api/admin/orders — all orders with fee breakdowns
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const orders = await db.order.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      phone: o.phone,
      location: o.location,
      vendor: { id: o.vendor.id, name: o.vendor.name, emoji: o.vendor.emoji, type: o.vendor.type },
      items: JSON.parse(o.itemsJson),
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      status: o.status,
      mpesaCode: o.mpesaCode,
      platformFee: o.platformFee,
      driverLevy: o.driverLevy,
      vendorPayout: o.vendorPayout,
      driverPayout: o.driverPayout,
      referralCode: o.referralCode,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}

// PATCH /api/admin/orders — advance an order's status (e.g. mark DISPATCHED)
export async function PATCH(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const allowed = ["PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = await db.order.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
