// SMS service for WeBizzle — Africa's Talking (KE) with dev-mode fallback
// In development (no API key), OTPs are logged to console and returned in the
// API response so the flow can be tested without a real SMS provider.

const AFRICASTALKING_API = "https://api.africastalking.com/v1";
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_LENGTH = 6;

// ---- Phone normalisation ----
// Accepts: 0711223344, +254711223344, 254711223344, +1-555-0123
// Returns:   254711223344 (KE format) or the E.164 without +
export function normalisePhone(raw: string): string {
  let p = raw.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  // Kenyan: 07xx → 2547xx
  if (p.length === 10 && p.startsWith("0")) {
    p = "254" + p.slice(1);
  }
  return p;
}

// ---- Generate 6-digit OTP ----
export function generateOtp(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

// ---- Send SMS via Africa's Talking ----
async function sendViaAfricasTalking(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  if (!apiKey || !username) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME must be set in production. " +
        "OTP delivery requires a real SMS provider."
      );
    }
    return false;
  }

  const res = await fetch(`${AFRICASTALKING_API}/messaging`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      username,
      to: phone.startsWith("+") ? phone : `+${phone}`,
      message,
      from: process.env.AFRICASTALKING_FROM || "WeBizzle",
    }).toString(),
  });
  return res.ok;
}

// ---- Main send function ----
export async function sendOtp(phone: string, code: string): Promise<{ sent: boolean; devCode?: string }> {
  const message = `Your WeBizzle verification code is ${code}. Valid for ${OTP_TTL_SECONDS / 60} minutes. Do not share this code.`;

  const sent = await sendViaAfricasTalking(phone, message);

  if (sent) {
    return { sent: true };
  }

  // Dev-only fallback — log to console, return code for testing.
  // In production, sendViaAfricasTalking throws if creds are missing,
  // so reaching here means the SMS actually failed (network, API error).
  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP SMS delivery failed and no dev fallback is available in production.");
  }
  console.log(`[OTP DEV] Phone: ${phone}, Code: ${code}`);
  return { sent: true, devCode: code };
}

export { OTP_TTL_SECONDS };