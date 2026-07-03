import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/notifications/read — mark a notification (or all for a recipient) as read.
export async function POST(req: Request) {
  let body: { id?: string; recipientType?: string; recipientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.id) {
    await db.notification.update({
      where: { id: body.id },
      data: { read: true },
    });
  } else if (body.recipientType && body.recipientId) {
    await db.notification.updateMany({
      where: { recipientType: body.recipientType, recipientId: body.recipientId },
      data: { read: true },
    });
  } else {
    return NextResponse.json(
      { error: "id or (recipientType + recipientId) required" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
