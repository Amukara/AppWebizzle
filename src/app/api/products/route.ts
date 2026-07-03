import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePriceHistory, marketStats } from "@/lib/pricing";

// GET /api/products — full catalogue with the cheapest vendor price + price intelligence per product
export async function GET() {
  const products = await db.product.findMany({
    include: { listings: { include: { vendor: true } } },
    orderBy: { name: "asc" },
  });

  const data = products.map((p) => {
    const inStockListings = p.listings.filter((l) => l.inStock);
    const sorted = [...inStockListings].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const prices = inStockListings.map((l) => l.price);
    const { avg, max } = marketStats(prices);
    const hist = generatePriceHistory(p.id, cheapest?.price ?? p.basePrice);
    return {
      id: p.id,
      name: p.name,
      unit: p.unit,
      emoji: p.emoji,
      category: p.category,
      basePrice: p.basePrice,
      bestPrice: cheapest?.price ?? p.basePrice,
      bestVendor: cheapest
        ? { id: cheapest.vendor.id, name: cheapest.vendor.name, emoji: cheapest.vendor.emoji }
        : null,
      vendorCount: inStockListings.length,
      avgPrice: avg,
      maxPrice: max,
      trend: hist.trend,
      changePct: hist.changePct,
      isLow: hist.isLow,
    };
  });

  return NextResponse.json({ products: data });
}
