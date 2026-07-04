// Real admin auth: username + password (scrypt) + httpOnly session cookie.
// Replaces the old shared-passcode header. The import surface
// (isAdminAuthorized / unauthorized) is preserved so the existing route files
// need no changes — they keep working, now backed by a real session.
import crypto from "crypto";
import { db } from "@/lib/db";

export const ADMIN_COOKIE = "wb_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
// In production the secret MUST come from the environment — no fallback.
// In development we generate a throwaway value so the dev loop works without
// boilerplate, but it changes every restart (sessions are lost on restart
// anyway in dev).
const isProd = process.env.NODE_ENV === "production";
const SESSION_SECRET: string = (() => {
  const env = process.env.ADMIN_SESSION_SECRET;
  if (env && env.length >= 32) return env;
  if (isProd) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set or too short (>= 32 chars required). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\" " +
      "and add it to your .env or deployment environment."
    );
  }
  // Dev-only: ephemeral secret, changes every cold start
  return require("crypto").randomBytes(48).toString("hex");
})();

// ---- password hashing (scrypt) ----
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const computed = crypto.scryptSync(plain, salt, 64).toString("hex");
  // constant-time compare
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}

// ---- session token (HMAC-signed, compact) ----
// Format: base64url(payload).base64url(signature)
type AdminSession = { adminId: string; username: string; role: string; exp: number };

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function createSessionToken(s: AdminSession): string {
  const payload = b64url(JSON.stringify(s));
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): AdminSession | null {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  // constant-time compare
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(b64urlDecode(payload)) as AdminSession;
    if (typeof s.exp !== "number" || Date.now() > s.exp) return null;
    return s;
  } catch {
    return null;
  }
}

// ---- cookie helpers ----
// Expressed as options for NextResponse.cookies.set() — the reliable Next.js
// API. (Setting `set-cookie` via res.headers.set() can be flaky in dev.)
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
  secure: process.env.NODE_ENV === "production",
};

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

// ---- public auth API ----

// Authenticate a username + password and issue a session token.
// Returns the token + session, or null on bad credentials.
export async function loginAdmin(
  username: string,
  password: string
): Promise<{ token: string; session: AdminSession } | null> {
  const admin = await db.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!admin) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;
  const session: AdminSession = {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  return { token: createSessionToken(session), session };
}

// Resolve the current request's session. Checks the httpOnly cookie first
// (first-party / direct nav), then falls back to the `x-admin-token` header
// (used when the app runs in a third-party iframe where SameSite cookies are
// blocked — e.g. the preview panel). Both validate the same HMAC-signed token.
export function getAdminSession(req: Request): AdminSession | null {
  const cookieToken = readCookie(req, ADMIN_COOKIE);
  if (cookieToken) {
    const s = verifySessionToken(cookieToken);
    if (s) return s;
  }
  const headerToken = req.headers.get("x-admin-token");
  if (headerToken) {
    const s = verifySessionToken(headerToken);
    if (s) return s;
  }
  return null;
}

// Backwards-compatible gate for the existing route files:
// `if (!isAdminAuthorized(req)) return unauthorized();`
export function isAdminAuthorized(req: Request): boolean {
  return getAdminSession(req) !== null;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
