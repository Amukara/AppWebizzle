import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/compare
// Body: { items: { productId: quantity, ... } }
// Returns:
//   - perItem: best vendor for each product
//   - perVendor: total cost if buying the WHOLE basket from each vendor (1 delivery)
//   - bestSingle: the single cheapest vendor for the whole basket
//   - bestSplit: the absolute cheapest split (sum of per-item bests + multiple deliveries)
type ItemMap = Record<string, number>;

export async function POST(req: Request) {
  let items: ItemMap;
  try {
    const body = await req.json();
    items = body.items ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productIds = Object.keys(items).filter((id) => Number(items[id]) > 0);
  if (productIds.length === 0) {
    return NextResponse.json({ error: "No items in basket" }, { status: 400 });
  }

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { listings: { include: { vendor: true } } },
  });

  if (products.length === 0) {
    return NextResponse.json({ error: "No matching products" }, { status: 404 });
  }

  // ---- per-item best vendor ----
  const perItem = products.map((p) => {
    const qty = Number(items[p.id]) || 0;
    const listings = p.listings
      .filter((l) => l.inStock)
      .map((l) => ({
        vendorId: l.vendor.id,
        vendorName: l.vendor.name,
        vendorEmoji: l.vendor.emoji,
        vendorType: l.vendor.type,
        price: l.price,
        lineTotal: l.price * qty,
        etaMinutes: l.vendor.etaMinutes,
        rating: l.vendor.rating,
      }))
      .sort((a, b) => a.price - b.price);

    const cheapest = listings[0];
    return {
      productId: p.id,
      name: p.name,
      unit: p.unit,
      emoji: p.emoji,
      qty,
      cheapest,
      cheapestLineTotal: cheapest ? cheapest.price * qty : 0,
      listings,
    };
  });

  // ---- per-vendor whole-basket totals ----
  const vendorMap = new Map<string, {
    vendorId: string;
    vendorName: string;
    vendorEmoji: string;
    vendorType: string;
    location: string;
    rating: number;
    deliveryFee: number;
    etaMinutes: number;
    lineItems: { productId: string; name: string; emoji: string; unit: string; qty: number; price: number; lineTotal: number }[];
    subtotal: number;
    canFulfilAll: boolean;
  }>();

  for (const p of products) {
    const qty = Number(items[p.id]) || 0;
    for (const l of p.listings) {
      if (!l.inStock) continue;
      const v = l.vendor;
      if (!vendorMap.has(v.id)) {
        vendorMap.set(v.id, {
          vendorId: v.id,
          vendorName: v.name,
          vendorEmoji: v.emoji,
          vendorType: v.type,
          location: v.location,
          rating: v.rating,
          deliveryFee: v.deliveryFee,
          etaMinutes: v.etaMinutes,
          lineItems: [],
          subtotal: 0,
          canFulfilAll: true,
        });
      }
      const entry = vendorMap.get(v.id)!;
      entry.lineItems.push({
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        unit: p.unit,
        qty,
        price: l.price,
        lineTotal: l.price * qty,
      });
      entry.subtotal += l.price * qty;
    }
  }

  // mark vendors that can't fulfil the entire basket
  for (const entry of vendorMap.values()) {
    if (entry.lineItems.length !== products.length) {
      entry.canFulfilAll = false;
    }
  }

  const perVendor = Array.from(vendorMap.values())
    .map((v) => ({
      ...v,
      total: v.subtotal + v.deliveryFee,
    }))
    .sort((a, b) => {
      // 1. Prefer vendors that can fulfil the entire basket
      if (a.canFulfilAll !== b.canFulfilAll) return a.canFulfilAll ? -1 : 1;
      // 2. Cheapest total first
      if (a.total !== b.total) return a.total - b.total;
      // 3. Fastest delivery (lowest ETA) as tiebreaker
      if (a.etaMinutes !== b.etaMinutes) return a.etaMinutes - b.etaMinutes;
      // 4. Highest rated as final tiebreaker
      return b.rating - a.rating;
    });

  // best single vendor (must fulfil all)
  const bestSingle = perVendor.find((v) => v.canFulfilAll) ?? null;

  // ---- best split (each item from its own cheapest vendor) ----
  // Each unique vendor used adds a delivery fee.
  const splitSubtotal = perItem.reduce((s, it) => s + (it.cheapestLineTotal || 0), 0);
  const splitVendors = new Set<string>();
  for (const it of perItem) if (it.cheapest) splitVendors.add(it.cheapest.vendorId);

  // collect delivery fees for the split vendors
  const allVendors = await db.vendor.findMany();
  const vendorFeeMap = new Map(allVendors.map((v) => [v.id, v.deliveryFee]));
  const splitDelivery = Array.from(splitVendors).reduce(
    (s, vid) => s + (vendorFeeMap.get(vid) ?? 0),
    0
  );

  const bestSplit = {
    subtotal: splitSubtotal,
    delivery: splitDelivery,
    total: splitSubtotal + splitDelivery,
    vendorCount: splitVendors.size,
  };

  return NextResponse.json({
    perItem,
    perVendor,
    bestSingle,
    bestSplit,
    itemCount: productIds.length,
    totalQty: productIds.reduce((s, id) => s + Number(items[id]), 0),
  });
}
