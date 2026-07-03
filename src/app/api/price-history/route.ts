import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePriceHistory } from "@/lib/pricing";
import type { PriceHistory } from "@/lib/types";

// GET /api/price-history?productId=sugar
// Returns a 14-day daily price series for the product (based on its cheapest
// vendor), plus every vendor's current price ranked cheapest → dearest.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { listings: { include: { vendor: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const inStock = product.listings.filter((l) => l.inStock);
  const sorted = [...inStock].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const current = cheapest?.price ?? product.basePrice;

  const hist = generatePriceHistory(product.id, current);

  const vendors = sorted.map((l) => ({
    vendorId: l.vendor.id,
    vendorName: l.vendor.name,
    vendorEmoji: l.vendor.emoji,
    vendorType: l.vendor.type,
    price: l.price,
    etaMinutes: l.vendor.etaMinutes,
    rating: l.vendor.rating,
  }));

  const payload: PriceHistory = {
    productId: product.id,
    points: hist.points,
    current,
    low: hist.low,
    high: hist.high,
    avg: hist.avg,
    trend: hist.trend,
    changePct: hist.changePct,
    isLow: hist.isLow,
    vendors,
  };

  return NextResponse.json(payload);
}
