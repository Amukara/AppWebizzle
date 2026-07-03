import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import type { AdminDispatch } from "@/lib/types";

// GET /api/admin/dispatches — active delivery dispatches (CONFIRMED + DISPATCHED)
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const orders = await db.order.findMany({
    where: { status: { in: ["CONFIRMED", "DISPATCHED"] } },
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
  });

  const data: AdminDispatch[] = orders.map((o) => ({
    orderId: o.id,
    customerName: o.customerName,
    location: o.location,
    vendorName: o.vendor.name,
    vendorEmoji: o.vendor.emoji,
    riderName: o.riderName,
    riderPlate: o.riderPlate,
    status: o.status,
    total: o.total,
    driverPayout: o.driverPayout,
    driverLevy: o.driverLevy,
    etaMinutes: o.vendor.etaMinutes,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json({ dispatches: data });
}
