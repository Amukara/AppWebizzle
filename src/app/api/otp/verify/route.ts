import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalisePhone } from "@/lib/sms";
import { createPortalToken } from "@/lib/portal-auth";

// POST /api/otp/verify  { phone, purpose, code }
// Verifies the OTP code and returns a signed session token if valid.
export async function POST(req: Request) {
  let body: { phone?: string; purpose?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawPhone = body.phone?.trim();
  const purpose = body.purpose?.trim().toUpperCase();
  const code = body.code?.trim();

  if (!rawPhone || !purpose || !code) {
    return NextResponse.json({ error: "phone, purpose, and code are required" }, { status: 400 });
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Code must be exactly 6 digits" }, { status: 400 });
  }

  const phone = normalisePhone(rawPhone);

  // Find the most recent unverified OTP for this phone+purpose
  const otp = await db.otpCode.findFirst({
    where: {
      phone,
      purpose,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "No valid OTP found. Please request a new code." },
      { status: 401 }
    );
  }

  if (otp.code !== code) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 401 });
  }

  // Mark as verified
  await db.otpCode.update({ where: { id: otp.id }, data: { verified: true } });

  // Issue a portal session token — shares the same secret as getPortalSession
  const token = createPortalToken(phone, purpose as "VENDOR_LOGIN" | "RIDER_LOGIN");

  return NextResponse.json({
    ok: true,
    token,
    phone,
    purpose,
  });
}