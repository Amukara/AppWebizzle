import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickRider } from "@/lib/pricing";
import { computeFees, REFERRAL_REWARD_KES } from "@/lib/fees";

// GET /api/orders — list all orders (newest first)
// POST /api/orders — place a new order (assigns a rider + computes savings)
export async function GET() {
  const orders = await db.order.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const data = orders.map((o) => ({
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
    createdAt: o.createdAt.toISOString(),
    rider: o.riderName
      ? { name: o.riderName, plate: o.riderPlate!, phone: o.riderPhone!, rating: o.riderRating }
      : null,
    saved: o.saved,
    platformFee: o.platformFee,
    driverLevy: o.driverLevy,
    vendorPayout: o.vendorPayout,
    driverPayout: o.driverPayout,
    referralCode: o.referralCode,
  }));

  return NextResponse.json({ orders: data });
}

export async function POST(req: Request) {
  let body: {
    vendorId: string;
    customerName: string;
    phone: string;
    location: string;
    items: { productId: string; name: string; unit: string; emoji: string; qty: number; unitPrice: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    mpesaCode?: string;
    referralCode?: string;
    lat?: number | null;
    lng?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.vendorId || !body.customerName || !body.phone || !body.location || !body.items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const vendor = await db.vendor.findUnique({ where: { id: body.vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Compute savings vs. current market-average prices for the ordered items.
  const productIds = body.items.map((it) => it.productId);
  const listings = await db.vendorProduct.findMany({
    where: { productId: { in: productIds }, inStock: true },
  });
  const sumsByProduct = new Map<string, number>();
  const countByProduct = new Map<string, number>();
  for (const l of listings) {
    sumsByProduct.set(l.productId, (sumsByProduct.get(l.productId) ?? 0) + l.price);
    countByProduct.set(l.productId, (countByProduct.get(l.productId) ?? 0) + 1);
  }
  const avgByProduct = new Map<string, number>();
  for (const pid of productIds) {
    const sum = sumsByProduct.get(pid) ?? 0;
    const cnt = countByProduct.get(pid) ?? 0;
    avgByProduct.set(pid, cnt > 0 ? Math.round(sum / cnt) : 0);
  }
  let saved = 0;
  for (const it of body.items) {
    const avg = avgByProduct.get(it.productId) ?? it.unitPrice;
    saved += Math.max(0, (avg - it.unitPrice) * it.qty);
  }

  // generate a mock M-Pesa confirmation code if not supplied
  const mpesaCode =
    body.mpesaCode ||
    "QFG" +
      Math.random().toString(36).slice(2, 7).toUpperCase() +
      Math.floor(Math.random() * 90 + 10);

  // Assign a deterministic rider based on the order timestamp for stable tracking.
  const rider = pickRider(`${body.vendorId}-${Date.now()}`);

  // Monetisation: 3% platform levy on totals > 300, 10% driver levy.
  const fees = computeFees(body.subtotal, body.deliveryFee);

  // Validate + record referral code usage (best-effort; never blocks checkout).
  let referralCode: string | null = null;
  if (body.referralCode && typeof body.referralCode === "string") {
    const ref = await db.referral.findUnique({
      where: { code: body.referralCode.trim().toUpperCase() },
    });
    if (ref && ref.status === "ACTIVE") {
      referralCode = ref.code;
      await db.referral.update({
        where: { id: ref.id },
        data: {
          orders: { increment: 1 },
          rewardEarned: { increment: REFERRAL_REWARD_KES },
        },
      });
    }
  }

  const order = await db.order.create({
    data: {
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      location: body.location.trim(),
      vendorId: body.vendorId,
      itemsJson: JSON.stringify(body.items),
      subtotal: body.subtotal,
      deliveryFee: body.deliveryFee,
      total: body.total,
      status: "CONFIRMED",
      mpesaCode,
      riderName: rider.name,
      riderPlate: rider.plate,
      riderPhone: rider.phone,
      riderRating: rider.rating,
      saved: Math.round(saved),
      platformFee: fees.platformFee,
      driverLevy: fees.driverLevy,
      vendorPayout: fees.vendorPayout,
      driverPayout: fees.driverPayout,
      referralCode,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
    },
    include: { vendor: true },
  });

  // Fire a vendor notification (best-effort, never blocks the response).
  void notifyVendorOfOrder({
    id: order.id,
    vendorId: order.vendor.id,
    vendorName: order.vendor.name,
    customerName: order.customerName,
    total: order.total,
    itemCount: body.items.length,
  });

  // Auto-push new order to Airtable (fire-and-forget, never blocks the response).
  const { pushSingleOrderToAirtable } = await import("@/lib/airtable");
  void pushSingleOrderToAirtable({
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    location: order.location,
    vendor: { name: order.vendor.name, emoji: order.vendor.emoji, type: order.vendor.type },
    items: body.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    status: order.status,
    mpesaCode: order.mpesaCode,
    riderName: order.riderName,
    riderPlate: order.riderPlate,
    saved: order.saved,
    platformFee: order.platformFee,
    driverLevy: order.driverLevy,
    createdAt: order.createdAt.toISOString(),
  });

  return NextResponse.json({
    order: {
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      location: order.location,
      vendor: { id: order.vendor.id, name: order.vendor.name, emoji: order.vendor.emoji, type: order.vendor.type },
      items: JSON.parse(order.itemsJson),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status,
      mpesaCode: order.mpesaCode,
      createdAt: order.createdAt.toISOString(),
      rider: { name: order.riderName!, plate: order.riderPlate!, phone: order.riderPhone!, rating: order.riderRating },
      saved: order.saved,
      platformFee: order.platformFee,
      driverLevy: order.driverLevy,
      vendorPayout: order.vendorPayout,
      driverPayout: order.driverPayout,
      referralCode: order.referralCode,
    },
  });
}

// Best-effort helper to fire a vendor notification when an order is placed.
// Called from the route above after the order is created. Kept as a named
// export so it can be invoked without blocking the response.
export async function notifyVendorOfOrder(order: {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  total: number;
  itemCount: number;
}) {
  try {
    await db.notification.create({
      data: {
        recipientType: "VENDOR",
        recipientId: order.vendorId,
        type: "NEW_ORDER",
        title: "New order received! 🛒",
        body: `${order.customerName} placed an order for ${order.itemCount} item(s) — KES ${order.total}. Confirm to start packing.`,
        orderId: order.id,
      },
    });
    // Fire-and-forget socket broadcast (the realtime service is best-effort).
    await fetch("http://localhost:3001/?XTransformPort=3001", {
      method: "POST",
    }).catch(() => {});
  } catch {
    // never block on notifications
  }
}
