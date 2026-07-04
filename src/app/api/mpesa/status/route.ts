// GET /api/mpesa/status?checkoutRequestId=xxx
// Frontend polls this to learn whether the STK Push payment succeeded.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const checkoutRequestId = url.searchParams.get("checkoutRequestId")?.trim();

  if (!checkoutRequestId) {
    return NextResponse.json({ error: "checkoutRequestId is required" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: { mpesaCheckoutId: checkoutRequestId },
    select: {
      id: true,
      paymentStatus: true,
      mpesaCode: true,
      status: true,
      total: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    paymentStatus: order.paymentStatus,
    mpesaCode: order.mpesaCode,
    orderStatus: order.status,
    total: order.total,
  });
}