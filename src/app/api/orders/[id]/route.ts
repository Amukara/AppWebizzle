import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendorCoords, riderPosition, distanceKm } from "@/lib/maps";
import type { OrderTracking, TrackingStep } from "@/lib/types";

// GET /api/orders/[id] — live tracking detail for a single order.
// Derives a step timeline from the order's createdAt + current status, with
// a rider card, remaining ETA, and overall journey progress.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const placedAt = order.createdAt.getTime();
  // Realistic phase durations (ms): confirm ~1m, dispatch ~4m, deliver ~25m total.
  const phases = {
    CONFIRMED: 60 * 1000,
    DISPATCHED: 4 * 60 * 1000,
    DELIVERED: order.vendor.etaMinutes * 60 * 1000,
  };
  const tConfirmed = placedAt + phases.CONFIRMED;
  const tDispatched = placedAt + phases.DISPATCHED;
  const tDelivered = placedAt + phases.DELIVERED;

  const orderFlow = ["PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED"] as const;
  const statusIndex = orderFlow.indexOf(
    (order.status as (typeof orderFlow)[number]) ?? "PLACED"
  );
  // Effective progress = furthest of (stored status) and (time-elapsed). This
  // keeps older orders from looking stuck at CONFIRMED while still respecting a
  // real DELIVERED status once set.
  const now = Date.now();
  let timeIndex = 0;
  if (now >= tDelivered) timeIndex = 3;
  else if (now >= tDispatched) timeIndex = 2;
  else if (now >= tConfirmed) timeIndex = 1;
  const reachedIndex = Math.max(statusIndex, timeIndex);
  const effectiveStatus = orderFlow[reachedIndex];

  const stepDefs: {
    key: TrackingStep["key"];
    label: string;
    description: string;
    at: number | null;
  }[] = [
    { key: "PLACED", label: "Order placed", description: "We received your M-Pesa payment.", at: placedAt },
    { key: "CONFIRMED", label: "Vendor confirmed", description: `${order.vendor.name} is packing your order.`, at: tConfirmed },
    { key: "DISPATCHED", label: "Rider on the way", description: "Your rider has picked up the order.", at: tDispatched },
    { key: "DELIVERED", label: "Delivered", description: "Enjoy! Rate your rider from the Orders page.", at: tDelivered },
  ];

  const steps: TrackingStep[] = stepDefs.map((s, i) => ({
    ...s,
    reached: i <= reachedIndex,
  }));

  const remainingMs = Math.max(0, tDelivered - now);
  const etaMinutes = Math.ceil(remainingMs / 60000);
  const totalMs = tDelivered - placedAt;
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round(((now - placedAt) / totalMs) * 100))
  );

  const rider = order.riderName
    ? { name: order.riderName, plate: order.riderPlate!, phone: order.riderPhone!, rating: order.riderRating }
    : null;

  const payload: OrderTracking = {
    orderId: order.id,
    status: effectiveStatus,
    steps,
    rider,
    etaMinutes,
    placedAt,
    estimatedDeliveryAt: tDelivered,
    progressPct,
    map: (() => {
      const vCoords = vendorCoords(order.vendorId);
      const cCoords =
        typeof order.lat === "number" && typeof order.lng === "number"
          ? { lat: order.lat, lng: order.lng }
          : null;
      // Rider only moves once dispatched.
      const showRider =
        effectiveStatus === "DISPATCHED" || effectiveStatus === "DELIVERED";
      const rCoords =
        vCoords && cCoords && showRider
          ? riderPosition(vCoords, cCoords, progressPct)
          : null;
      return {
        vendor: vCoords
          ? { ...vCoords, name: order.vendor.name, emoji: order.vendor.emoji }
          : null,
        customer: cCoords,
        rider: rCoords,
        distanceKm: vCoords && cCoords ? distanceKm(vCoords, cCoords) : null,
      };
    })(),
  };

  return NextResponse.json(payload);
}
