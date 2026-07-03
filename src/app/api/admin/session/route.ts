import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

// GET /api/admin/session — who is the current admin (or 401)?
export async function GET(req: Request) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }
  return NextResponse.json({
    authed: true,
    admin: { username: session.username, role: session.role },
  });
}
