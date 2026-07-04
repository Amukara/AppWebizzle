// Portal session verification for vendor & rider API routes.
// Mirrors the admin auth pattern (HMAC-signed token).
import crypto from "crypto";

// In production the secret MUST come from the environment — no fallback.
// In development we generate a throwaway value so the dev loop works without
// boilerplate, but it changes every restart (sessions are lost on restart
// anyway in dev).
const isProd = process.env.NODE_ENV === "production";
const SESSION_SECRET: string = (() => {
  const env = process.env.PORTAL_SESSION_SECRET;
  if (env && env.length >= 32) return env;
  if (isProd) {
    throw new Error(
      "PORTAL_SESSION_SECRET is not set or too short (>= 32 chars required). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\" " +
      "and add it to your .env or deployment environment."
    );
  }
  // Dev-only: ephemeral secret, changes every cold start
  return require("crypto").randomBytes(48).toString("hex");
})();

export type PortalSession = {
  phone: string;
  purpose: "VENDOR_LOGIN" | "RIDER_LOGIN";
  exp: number;
};

function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function verifyPortalToken(
  token: string | null | undefined,
  allowedPurpose?: PortalSession["purpose"]
): PortalSession | null {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  try {
    const s = JSON.parse(b64urlDecode(payload)) as PortalSession;
    if (typeof s.exp !== "number" || Date.now() > s.exp) return null;
    if (allowedPurpose && s.purpose !== allowedPurpose) return null;
    return s;
  } catch {
    return null;
  }
}

// Middleware helper: extract token from cookie or header
export function getPortalSession(
  req: Request,
  allowedPurpose?: PortalSession["purpose"]
): PortalSession | null {
  // Try cookie first
  const cookieRaw = req.headers.get("cookie");
  if (cookieRaw) {
    for (const part of cookieRaw.split(";")) {
      const [k, ...v] = part.trim().split("=");
      if (k === "wb_portal") {
        return verifyPortalToken(decodeURIComponent(v.join("=")), allowedPurpose);
      }
    }
  }
  // Fallback to header (for iframe contexts)
  const headerToken = req.headers.get("x-portal-token");
  if (headerToken) {
    return verifyPortalToken(headerToken, allowedPurpose);
  }
  return null;
}

export function createPortalToken(
  phone: string,
  purpose: PortalSession["purpose"],
  ttlMs: number = 8 * 60 * 60 * 1000 // 8 hours default
): string {
  const payload = Buffer.from(
    JSON.stringify({ phone, purpose, exp: Date.now() + ttlMs } as PortalSession)
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function portalUnauthorized() {
  return Response.json({ error: "Unauthorized — please verify your phone" }, { status: 401 });
}