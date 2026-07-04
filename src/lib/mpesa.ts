// WeBizzle — Safaricom Daraja M-Pesa STK Push integration.
//
// Flow:
//   1. Server calls initiateStkPush() → Safaricom sends STK prompt to customer phone.
//   2. Customer enters PIN on their phone.
//   3. Safaricom calls our /api/mpesa/callback with the result.
//   4. Frontend polls /api/mpesa/status?checkoutRequestId=xxx until PAID/FAILED.
//
// Environment variables (all required in production):
//   MPESA_CONSUMER_KEY      — Daraja app consumer key
//   MPESA_CONSUMER_SECRET   — Daraja app consumer secret
//   MPESA_PASSKEY           — Lipa Na M-Pesa Online passkey
//   MPESA_SHORTCODE         — Business short code (e.g. 174379 for sandbox)
//   MPESA_CALLBACK_BASE_URL — Public base URL for callbacks (e.g. https://webizzle.co.ke)
//   MPESA_ENV               — "sandbox" or "production"

import crypto from "crypto";

// ---- Env validation (same pattern as admin.ts / portal-auth.ts) ----
const isProd = process.env.NODE_ENV === "production";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v) return v;
  if (isProd) {
    throw new Error(
      `${name} is not set. Add it to your .env or deployment environment. ` +
      `Get Daraja credentials from https://developer.safaricom.co.ke`
    );
  }
  return ""; // dev fallback — isDarajaConfigured() will be false
}

const MPESA_CONSUMER_KEY = requireEnv("MPESA_CONSUMER_KEY");
const MPESA_CONSUMER_SECRET = requireEnv("MPESA_CONSUMER_SECRET");
const MPESA_PASSKEY = requireEnv("MPESA_PASSKEY");
const MPESA_SHORTCODE = requireEnv("MPESA_SHORTCODE");
const MPESA_CALLBACK_BASE_URL = requireEnv("MPESA_CALLBACK_BASE_URL");
const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

/** True when all Daraja credentials are present and non-empty. */
export function isDarajaConfigured(): boolean {
  return !!(
    MPESA_CONSUMER_KEY &&
    MPESA_CONSUMER_SECRET &&
    MPESA_PASSKEY &&
    MPESA_SHORTCODE &&
    MPESA_CALLBACK_BASE_URL
  );
}

// ---- Daraja base URLs ----
const BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};
function darajaBaseUrl(): string {
  return BASE_URLS[MPESA_ENV] || BASE_URLS.sandbox;
}

// ---- OAuth access token (cached in-memory, refreshes before expiry) ----
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const url = `${darajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    throw new Error(`Daraja OAuth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as { access_token: string; expires_in: string };
  // expires_in is seconds; refresh 60s early
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };
  return tokenCache.token;
}

// ---- STK Push ----
export type StkPushResult =
  | { ok: true; checkoutRequestId: string; merchantRequestId: string }
  | { ok: false; errorCode: string; errorMessage: string };

/**
 * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
 *
 * @param phone  Customer phone in 254XXXXXXXXX format
 * @param amount Amount in KES (integer)
 * @param reference  Account reference (short, e.g. "WBZ-ORD123")
 * @param description Transaction description
 */
export async function initiateStkPush(
  phone: string,
  amount: number,
  reference: string,
  description: string
): Promise<StkPushResult> {
  const token = await getAccessToken();
  const url = `${darajaBaseUrl()}/mpesa/stkpush/v1/processrequest`;

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const body = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: phone, // customer phone (254...)
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: `${MPESA_CALLBACK_BASE_URL}/api/mpesa/callback`,
    AccountReference: reference.slice(0, 12),
    TransactionDesc: description.slice(0, 13),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, string>;

  if (data.CheckoutRequestID) {
    return {
      ok: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
    };
  }

  return {
    ok: false,
    errorCode: data.errorCode || "UNKNOWN",
    errorMessage: data.errorMessage || "STK Push initiation failed",
  };
}

// ---- Callback types ----

/** Parsed body from Safaricom's c2b callback. */
export type MpesaCallbackBody = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number; // 0 = success, anything else = failure
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
};

/** Extract the M-Pesa receipt code from callback metadata. */
export function extractMpesaCode(callback: MpesaCallbackBody): string | null {
  const items = callback.Body.stkCallback.CallbackMetadata?.Item;
  if (!items) return null;
  const entry = items.find((i) => i.Name === "MpesaReceiptNumber");
  return entry ? String(entry.Value) : null;
}

/** Normalise a Kenyan phone number to 254XXXXXXXXX format. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  // 07XXXXXXXX → 2547XXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return "254" + digits.slice(1);
  }
  // +254XXXXXXXX → 254XXXXXXXX
  if (digits.length === 12 && digits.startsWith("254")) {
    return digits;
  }
  // Already 254... (10 digits after prefix)
  if (digits.length === 12 && digits.startsWith("254")) {
    return digits;
  }
  return digits; // return as-is; Daraja will reject invalid formats
}