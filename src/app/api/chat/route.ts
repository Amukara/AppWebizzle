import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/chat?channel=vendor:v1 — recent messages for a channel.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  if (!channel) {
    return NextResponse.json({ messages: [] });
  }
  const rows = await db.chatMessage.findMany({
    where: { channel },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      channel: m.channel,
      senderType: m.senderType,
      senderId: m.senderId,
      senderName: m.senderName,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// POST /api/chat — persist a chat message.
export async function POST(req: Request) {
  let body: {
    channel?: string;
    senderType?: string;
    senderId?: string;
    senderName?: string;
    body?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.channel || !body.senderType || !body.senderId || !body.body) {
    return NextResponse.json(
      { error: "channel, senderType, senderId, body are required" },
      { status: 400 }
    );
  }
  const msg = await db.chatMessage.create({
    data: {
      channel: body.channel,
      senderType: body.senderType,
      senderId: body.senderId,
      senderName: body.senderName || "",
      body: body.body.slice(0, 1000),
    },
  });
  return NextResponse.json({
    message: {
      id: msg.id,
      channel: msg.channel,
      senderType: msg.senderType,
      senderId: msg.senderId,
      senderName: msg.senderName,
      body: msg.body,
      read: msg.read,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
