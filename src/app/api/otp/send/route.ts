import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalisePhone, generateOtp, sendOtp, OTP_TTL_SECONDS } from "@/lib/sms";

const VALID_PURPOSES = ["VENDOR_LOGIN", "RIDER_LOGIN", "VENDOR_SIGNUP", "RIDER_SIGNUP"] as const;

// POST /api/otp/send  { phone, purpose }
// Generates a 6-digit OTP, stores it in DB, sends via SMS (or dev fallback).
// Returns { ok: true, devCode? } — devCode only present in dev/fallback mode.
export async function POST(req: Request) {
  let body: { phone?: string; purpose?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawPhone = body.phone?.trim();
  const purpose = body.purpose?.trim().toUpperCase();

  if (!rawPhone || !purpose) {
    return NextResponse.json({ error: "phone and purpose are required" }, { status: 400 });
  }

  if (!VALID_PURPOSES.includes(purpose as (typeof VALID_PURPOSES)[number])) {
    return NextResponse.json(
      { error: `purpose must be one of: ${VALID_PURPOSES.join(", ")}` },
      { status: 400 }
    );
  }

  const phone = normalisePhone(rawPhone);

  // Rate limit: max 3 OTPs per phone in the last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentCount = await db.otpCode.count({
    where: { phone, createdAt: { gte: fiveMinAgo } },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  // Invalidate any previous unverified codes for this phone+purpose
  await db.otpCode.updateMany({
    where: { phone, purpose, verified: false },
    data: { verified: true }, // mark as "used" to prevent reuse
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  await db.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  });

  // Send SMS (dev fallback only when NODE_ENV !== "production")
  let result: Awaited<ReturnType<typeof sendOtp>>;
  try {
    result = await sendOtp(phone, code);
  } catch (err) {
    console.error("[OTP] Send failed:", err);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again later." },
      { status: 500 }
    );
  }

  if (!result.sent) {
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }

  const response: { ok: boolean; message: string; devCode?: string } = {
    ok: true,
    message: `OTP sent to ${phone.slice(0, 4)}***${phone.slice(-3)}`,
  };

  // In dev mode, include the code so testing works without real SMS
  if (result.devCode) {
    response.devCode = result.devCode;
  }

  return NextResponse.json(response);
}