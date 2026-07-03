import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/vendors — all neighbourhood vendors
export async function GET() {
  const vendors = await db.vendor.findMany({
    include: { listings: true },
    orderBy: { rating: "desc" },
  });

  const data = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    type: v.type,
    location: v.location,
    rating: v.rating,
    deliveryFee: v.deliveryFee,
    etaMinutes: v.etaMinutes,
    productCount: v.listings.filter((l) => l.inStock).length,
  }));

  return NextResponse.json({ vendors: data });
}
