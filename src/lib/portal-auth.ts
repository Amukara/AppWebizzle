// Portal session verification for vendor & rider API routes.
// Mirrors the admin auth pattern (HMAC-signed token).
import crypto from "crypto";

const SESSION_SECRET =
  process.env.PORTAL_SESSION_SECRET || "webizzle-portal-dev-secret-change-in-prod";

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

export function portalUnauthorized() {
  return Response.json({ error: "Unauthorized — please verify your phone" }, { status: 401 });
}