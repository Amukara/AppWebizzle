import { NextResponse } from "next/server";
import { loginAdmin, getAdminSession, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/admin";

// POST /api/admin/login — exchange username + password for an httpOnly session cookie.
export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const result = await loginAdmin(username, password);
  if (!result) {
    // Same message for unknown user vs wrong password (no user enumeration).
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    admin: { username: result.session.username, role: result.session.role },
    // Also return the token so the client can send it as a header on
    // subsequent fetches — needed when the app runs inside a third-party
    // iframe (preview panel) where SameSite cookies are blocked.
    token: result.token,
  });
  // Use the cookies API (reliable) rather than a raw set-cookie header.
  res.cookies.set(ADMIN_COOKIE, result.token, ADMIN_COOKIE_OPTIONS);
  return res;
}

// GET /api/admin/login — check whether the caller is already authed (cookie OR header).
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
