import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";

// GET /api/admin/presence — which vendors and riders are online right now?
// Used by the admin dashboard to show live online/offline indicators.
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const [onlineVendors, onlineRiders, allVendors, allRiders, vendors] = await Promise.all([
    db.vendorPortal.findMany({ where: { isOnline: true } }),
    db.riderPortal.findMany({ where: { isOnline: true } }),
    db.vendorPortal.findMany(),
    db.riderPortal.findMany(),
    db.vendor.findMany(),
  ]);
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return NextResponse.json({
    vendors: allVendors.map((p) => {
      const v = vendorMap.get(p.vendorId);
      return {
        vendorId: p.vendorId,
        shopName: p.shopName,
        emoji: v?.emoji ?? "🏪",
        type: v?.type ?? "",
        isOnline: p.isOnline,
        dutyStart: p.dutyStart,
        dutyEnd: p.dutyEnd,
        lastSeen: p.lastSeen.toISOString(),
      };
    }),
    riders: allRiders.map((p) => ({
      riderKey: p.riderKey,
      fullName: p.fullName,
      phone: p.phone,
      plate: p.plate,
      isOnline: p.isOnline,
      lastSeen: p.lastSeen.toISOString(),
    })),
    summary: {
      vendorsOnline: onlineVendors.length,
      ridersOnline: onlineRiders.length,
      vendorsTotal: allVendors.length,
      ridersTotal: allRiders.length,
    },
  });
}
