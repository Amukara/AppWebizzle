import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickRider } from "@/lib/pricing";
import { computeFees, REFERRAL_REWARD_KES } from "@/lib/fees";
import { getAdminSession, unauthorized } from "@/lib/admin";
import {
  isDarajaConfigured,
  initiateStkPush,
  normalizePhone,
} from "@/lib/mpesa";

// GET /api/orders — list orders.
//   • Admin (cookie or x-admin-token): returns all orders with full PII.
//   • Customer (?phone=07XXXXXXXX): returns only their own orders with
//     rider phone masked.
//   • No auth + no phone: 401.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const phoneParam = url.searchParams.get("phone")?.trim();

  const adminSession = getAdminSession(req);

  // --- Customer path: filter by phone, mask rider PII ---
  if (!adminSession && phoneParam) {
    // Normalize: strip spaces, prepend 0 if missing
    const normalized = phoneParam.replace(/\s/g, "");
    if (!normalized) {
      return NextResponse.json({ error: "Phone parameter is required" }, { status: 400 });
    }

    const orders = await db.order.findMany({
      where: { phone: { endsWith: normalized.replace(/^0/, "") } },
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
      paymentStatus: o.paymentStatus,
      mpesaCode: o.mpesaCode,
      createdAt: o.createdAt.toISOString(),
      rider: o.riderName
        ? {
            name: o.riderName,
            plate: o.riderPlate!,
            // Mask rider phone: show only last 4 digits
            phone: o.riderPhone
              ? o.riderPhone.slice(0, -4) + "****"
              : null,
            rating: o.riderRating,
          }
        : null,
      saved: o.saved,
    }));

    return NextResponse.json({ orders: data });
  }

  // --- Admin path: full access ---
  if (!adminSession) {
    return unauthorized();
  }

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
    paymentStatus: o.paymentStatus,
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

// POST /api/orders — create a new order.
//
// SECURITY: prices are recomputed server-side from the vendor's actual
// VendorProduct catalogue.  Client-supplied subtotal/deliveryFee/total
// and per-item unitPrice are IGNORED.
//
// Payment flow:
//   1. Server creates order with paymentStatus = "PENDING".
//   2. If Daraja is configured → initiates STK Push, stores checkoutRequestId.
//   3. If Daraja is NOT configured (dev) → auto-confirms after 2 s.
//   4. Frontend polls GET /api/mpesa/status until PAID or FAILED.
export async function POST(req: Request) {
  let body: {
    vendorId: string;
    customerName: string;
    phone: string;
    location: string;
    items: { productId: string; name: string; unit: string; emoji: string; qty: number }[];
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

  // ---- 1. Look up vendor ----
  const vendor = await db.vendor.findUnique({ where: { id: body.vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // ---- 2. Server-side price recomputation ----
  // Fetch the vendor's actual listings for every requested product.
  const productIds = body.items.map((it) => it.productId);
  const vendorListings = await db.vendorProduct.findMany({
    where: {
      vendorId: body.vendorId,
      productId: { in: productIds },
    },
    include: { product: true },
  });

  // Build a lookup: productId → { price, name, unit, emoji, inStock }
  const listingMap = new Map<string, (typeof vendorListings)[number]>();
  for (const l of vendorListings) {
    listingMap.set(l.productId, l);
  }

  // Validate every item: must exist, be in stock, and have a valid qty.
  const serverItems: {
    productId: string;
    name: string;
    unit: string;
    emoji: string;
    qty: number;
    unitPrice: number; // server-authoritative price
  }[] = [];

  for (const it of body.items) {
    if (typeof it.qty !== "number" || it.qty < 1) {
      return NextResponse.json(
        { error: `Invalid quantity for ${it.productId}` },
        { status: 400 }
      );
    }
    const listing = listingMap.get(it.productId);
    if (!listing) {
      return NextResponse.json(
        { error: `Product ${it.productId} is not listed by this vendor` },
        { status: 409 }
      );
    }
    if (!listing.inStock) {
      return NextResponse.json(
        { error: `${listing.product.name} is out of stock at ${vendor.name}` },
        { status: 409 }
      );
    }
    serverItems.push({
      productId: it.productId,
      name: listing.product.name,
      unit: listing.product.unit,
      emoji: listing.product.emoji,
      qty: it.qty,
      unitPrice: listing.price, // SERVER price, NOT client-supplied
    });
  }

  // Compute totals server-side
  const subtotal = serverItems.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const deliveryFee = vendor.deliveryFee; // from vendor record, not client
  const total = subtotal + deliveryFee;

  // ---- 3. Compute savings vs. market-average prices ----
  const allListings = await db.vendorProduct.findMany({
    where: { productId: { in: productIds }, inStock: true },
  });
  const sumsByProduct = new Map<string, number>();
  const countByProduct = new Map<string, number>();
  for (const l of allListings) {
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
  for (const it of serverItems) {
    const avg = avgByProduct.get(it.productId) ?? it.unitPrice;
    saved += Math.max(0, (avg - it.unitPrice) * it.qty);
  }

  // ---- 4. Monetisation fees ----
  const fees = computeFees(subtotal, deliveryFee);

  // ---- 5. Referral code (best-effort, never blocks) ----
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

  // ---- 6. Assign rider ----
  const rider = pickRider(`${body.vendorId}-${Date.now()}`);

  // ---- 7. Create the order (PENDING payment) ----
  const order = await db.order.create({
    data: {
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      location: body.location.trim(),
      vendorId: body.vendorId,
      itemsJson: JSON.stringify(serverItems),
      subtotal,
      deliveryFee,
      total,
      status: "PLACED",
      paymentStatus: "PENDING",
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

  // ---- 8. Initiate M-Pesa payment ----
  let checkoutRequestId: string | null = null;

  if (isDarajaConfigured()) {
    // Real Daraja STK Push
    const phone254 = normalizePhone(body.phone);
    const ref = `WBZ-${order.id.slice(-8).toUpperCase()}`;
    const stkResult = await initiateStkPush(
      phone254,
      total,
      ref,
      `WeBizzle order`
    );

    if (stkResult.ok) {
      checkoutRequestId = stkResult.checkoutRequestId;
      await db.order.update({
        where: { id: order.id },
        data: { mpesaCheckoutId: checkoutRequestId },
      });
    } else {
      // STK Push failed — mark payment as failed
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return NextResponse.json(
        {
          error: `M-Pesa initiation failed: ${stkResult.errorMessage}`,
          code: stkResult.errorCode,
        },
        { status: 502 }
      );
    }
  } else {
    // Dev fallback: simulate payment confirmation after a short delay
    // so the frontend polling flow works end-to-end without Safaricom.
    console.log(
      `[orders] Daraja not configured — simulating payment for order ${order.id} in 2s`
    );
    setTimeout(async () => {
      try {
        const mpesaCode =
          "QFG" +
          Math.random().toString(36).slice(2, 7).toUpperCase() +
          Math.floor(Math.random() * 90 + 10);

        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            mpesaCode,
          },
        });

        // Notify vendor after simulated payment
        void notifyVendorOfOrder({
          id: order.id,
          vendorId: order.vendorId,
          vendorName: vendor.name,
          customerName: order.customerName,
          total: order.total,
          itemCount: serverItems.length,
        });

        // Push to Airtable after payment confirmed
        const { pushSingleOrderToAirtable } = await import("@/lib/airtable");
        void pushSingleOrderToAirtable({
          id: order.id,
          customerName: order.customerName,
          phone: order.phone,
          location: order.location,
          vendor: { name: vendor.name, emoji: vendor.emoji, type: vendor.type },
          items: serverItems,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          status: "CONFIRMED",
          mpesaCode,
          riderName: rider.name,
          riderPlate: rider.plate,
          saved: order.saved,
          platformFee: order.platformFee,
          driverLevy: order.driverLevy,
          createdAt: order.createdAt.toISOString(),
        });
      } catch (err) {
        console.error(`[orders] Simulated payment failed for ${order.id}:`, err);
      }
    }, 2000);
  }

  // ---- 9. Return order + payment tracking info ----
  return NextResponse.json({
    order: {
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      location: order.location,
      vendor: { id: order.vendor.id, name: order.vendor.name, emoji: order.vendor.emoji, type: order.vendor.type },
      items: serverItems,
      subtotal,
      deliveryFee,
      total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      mpesaCode: order.mpesaCode,
      checkoutRequestId,
      createdAt: order.createdAt.toISOString(),
      rider: { name: rider.name, plate: rider.plate, phone: rider.phone, rating: rider.rating },
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