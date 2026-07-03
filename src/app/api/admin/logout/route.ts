import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/admin";

// POST /api/admin/logout — clear the session cookie.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Overwrite with maxAge 0 to expire immediately.
  res.cookies.set(ADMIN_COOKIE, "", { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
