import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SavingsSummary } from "@/lib/types";

const DAY_MS = 86400000;

// GET /api/savings
// Computes all-time savings vs. market-average prices across every order.
// "Market average" = the mean of every vendor's current in-stock price for a
// product. Savings per line item = max(0, (avg - paidUnitPrice) * qty).
export async function GET() {
  const [orders, products, listings] = await Promise.all([
    db.order.findMany({ include: { vendor: true }, orderBy: { createdAt: "desc" } }),
    db.product.findMany(),
    db.vendorProduct.findMany({ where: { inStock: true } }),
  ]);

  // productId -> category
  const categoryOf = new Map(products.map((p) => [p.id, p.category]));
  // productId -> average market price
  const avgByProduct = new Map<string, number>();
  const pricesByProduct = new Map<string, number[]>();
  for (const l of listings) {
    const arr = pricesByProduct.get(l.productId) ?? [];
    arr.push(l.price);
    pricesByProduct.set(l.productId, arr);
  }
  for (const [pid, arr] of pricesByProduct) {
    avgByProduct.set(pid, Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));
  }

  let totalSaved = 0;
  let totalSpent = 0;
  const byCat = new Map<string, { saved: number; spent: number }>();
  const recent: SavingsSummary["recent"] = [];

  for (const o of orders) {
    let orderSaved = 0;
    let orderSpent = 0;
    let items: { productId: string; name: string; qty: number; unitPrice: number }[] = [];
    try {
      items = JSON.parse(o.itemsJson);
    } catch {
      items = [];
    }
    for (const it of items) {
      const avg = avgByProduct.get(it.productId) ?? it.unitPrice;
      const saved = Math.max(0, (avg - it.unitPrice) * it.qty);
      const spent = it.unitPrice * it.qty;
      orderSaved += saved;
      orderSpent += spent;
      const cat = categoryOf.get(it.productId) ?? "Other";
      const cur = byCat.get(cat) ?? { saved: 0, spent: 0 };
      byCat.set(cat, { saved: cur.saved + saved, spent: cur.spent + spent });
    }
    totalSaved += orderSaved;
    totalSpent += orderSpent;
    recent.push({
      orderId: o.id,
      createdAt: o.createdAt.toISOString(),
      vendorName: o.vendor.name,
      vendorEmoji: o.vendor.emoji,
      total: o.total,
      saved: Math.round(orderSaved),
    });
  }

  // Streak: consecutive weeks (ending this week) with >=1 order.
  const weekKey = (d: Date) => {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
    return `${date.getUTCFullYear()}-W${week}`;
  };
  const DAY_MS = 86400000;
  const weekSet = new Set(orders.map((o) => weekKey(o.createdAt)));
  // walk back from current week
  let streakWeeks = 0;
  const now = new Date();
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = 0; i < 52; i++) {
    const wk = weekKey(cursor);
    if (weekSet.has(wk)) {
      streakWeeks++;
    } else if (i > 0) {
      // allow the current (incomplete) week to be empty without breaking streak
      break;
    }
    cursor = new Date(cursor.getTime() - 7 * DAY_MS);
  }

  const byCategory = Array.from(byCat.entries())
    .map(([category, v]) => ({ category, saved: Math.round(v.saved), spent: Math.round(v.spent) }))
    .sort((a, b) => b.saved - a.saved);

  const payload: SavingsSummary = {
    totalSaved: Math.round(totalSaved),
    totalSpent: Math.round(totalSpent),
    orderCount: orders.length,
    avgSavingsPct:
      totalSaved + totalSpent > 0
        ? Math.round((totalSaved / (totalSaved + totalSpent)) * 1000) / 10
        : 0,
    avgSavedPerOrder: orders.length ? Math.round(totalSaved / orders.length) : 0,
    streakWeeks,
    bestCategory: byCategory[0] ?? null,
    byCategory,
    recent: recent.slice(0, 6),
  };

  return NextResponse.json(payload);
}
