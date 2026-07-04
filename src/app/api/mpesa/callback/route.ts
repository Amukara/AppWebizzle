// POST /api/mpesa/callback
// Safaricom calls this endpoint when the customer responds to an STK Push.
// The callback is unsigned in sandbox; in production you should validate
// against the B2C security credentials.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MpesaCallbackBody } from "@/lib/mpesa";
import { extractMpesaCode } from "@/lib/mpesa";

export async function POST(req: Request) {
  // In dev without Daraja, this endpoint shouldn't receive real callbacks,
  // but we still handle it gracefully for testing.
  let body: MpesaCallbackBody;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const { stkCallback } = body.Body;
  const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

  if (!CheckoutRequestID) {
    return new NextResponse("Missing CheckoutRequestID", { status: 400 });
  }

  // Find the order by checkout request ID
  const order = await db.order.findFirst({
    where: { mpesaCheckoutId: CheckoutRequestID },
  });

  if (!order) {
    // Not our order — acknowledge anyway so Safaricom doesn't retry
    console.warn(`[mpesa-callback] Unknown CheckoutRequestID: ${CheckoutRequestID}`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (ResultCode === 0) {
    // Payment successful
    const mpesaCode = extractMpesaCode(body);
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        mpesaCode: mpesaCode || order.mpesaCode,
      },
    });

    // Load vendor name for the notification
    const vendor = await db.vendor.findUnique({ where: { id: order.vendorId } });

    // Fire vendor notification for the confirmed order
    const { notifyVendorOfOrder } = await import("@/app/api/orders/route");
    void notifyVendorOfOrder({
      id: order.id,
      vendorId: order.vendorId,
      vendorName: vendor?.name ?? "Unknown Vendor",
      customerName: order.customerName,
      total: order.total,
      itemCount: JSON.parse(order.itemsJson).length,
    });

    console.log(`[mpesa-callback] Order ${order.id} PAID — code: ${mpesaCode}`);
  } else {
    // Payment failed or cancelled by user
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
      },
    });
    console.log(`[mpesa-callback] Order ${order.id} FAILED — ${ResultDesc}`);
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}