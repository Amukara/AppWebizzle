import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications?recipientType=VENDOR&recipientId=v1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recipientType = searchParams.get("recipientType");
  const recipientId = searchParams.get("recipientId");
  if (!recipientType || !recipientId) {
    return NextResponse.json({ notifications: [] });
  }
  const rows = await db.notification.findMany({
    where: { recipientType, recipientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    notifications: rows.map((n) => ({
      id: n.id,
      recipientType: n.recipientType,
      recipientId: n.recipientId,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      orderId: n.orderId,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

// POST /api/notifications — create a notification (used when an order is placed
// to alert the vendor, and by admin to broadcast).
export async function POST(req: Request) {
  let body: {
    recipientType?: string;
    recipientId?: string;
    type?: string;
    title?: string;
    body?: string;
    orderId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.recipientType || !body.recipientId || !body.title || !body.body) {
    return NextResponse.json(
      { error: "recipientType, recipientId, title, body are required" },
      { status: 400 }
    );
  }
  const n = await db.notification.create({
    data: {
      recipientType: body.recipientType,
      recipientId: body.recipientId,
      type: body.type || "SYSTEM",
      title: body.title,
      body: body.body,
      orderId: body.orderId || null,
    },
  });
  return NextResponse.json({
    notification: {
      id: n.id,
      recipientType: n.recipientType,
      recipientId: n.recipientId,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      orderId: n.orderId,
      createdAt: n.createdAt.toISOString(),
    },
  });
}
