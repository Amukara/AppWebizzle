import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_DOC_LEN = 1_500_000; // ~1.1MB per document

// Validate an optional image data URL; returns null when absent/invalid.
function cleanDoc(value: unknown, label: string): string | null {
  if (!value || typeof value !== "string") return null;
  if (!DATA_URL_RE.test(value)) {
    throw new Error(`${label} must be a valid image data URL`);
  }
  if (value.length > MAX_DOC_LEN) {
    throw new Error(`${label} is too large (max 1MB)`);
  }
  return value;
}

// POST /api/applications/vendor — register a shop with verification documents
export async function POST(req: Request) {
  let body: {
    shopName?: string;
    ownerName?: string;
    phone?: string;
    logo?: string;
    tradeLicense?: string;
    municipalLicense?: string;
    kplcToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.shopName?.trim() || !body.ownerName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  let logo: string | null = null;
  let tradeLicense: string | null = null;
  let municipalLicense: string | null = null;
  let kplcToken: string | null = null;
  try {
    logo = cleanDoc(body.logo, "Logo");
    tradeLicense = cleanDoc(body.tradeLicense, "Trade licence");
    municipalLicense = cleanDoc(body.municipalLicense, "Municipal licence");
    kplcToken = cleanDoc(body.kplcToken, "KPLC token receipt");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const app = await db.vendorApplication.create({
    data: {
      shopName: body.shopName.trim(),
      ownerName: body.ownerName.trim(),
      phone: body.phone.trim(),
      logo,
      tradeLicense,
      municipalLicense,
      kplcToken,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    ok: true,
    applicationId: app.id,
    message:
      tradeLicense || municipalLicense || kplcToken
        ? "Application received with verification documents! Our team will review them within 24 hours."
        : "Application received! Our team will call you within 24 hours.",
  });
}
