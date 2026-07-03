import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_SELFIE_LEN = 1_500_000; // ~1.1MB

// Validate an optional selfie data URL; returns null when absent/invalid.
function cleanSelfie(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  if (!DATA_URL_RE.test(value)) {
    throw new Error("Selfie must be a valid image (PNG, JPG, or WEBP)");
  }
  if (value.length > MAX_SELFIE_LEN) {
    throw new Error("Selfie image is too large (max 1MB)");
  }
  return value;
}

// POST /api/applications/rider — apply to become a rider
// Required: fullName, phone, bikePlate, stageNumber, locationArea
// Optional: selfieUrl (base64 data URL)
export async function POST(req: Request) {
  let body: {
    fullName?: string;
    phone?: string;
    bikePlate?: string;
    stageNumber?: string;
    locationArea?: string;
    selfieUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!body.phone?.trim()) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (!body.bikePlate?.trim()) {
    return NextResponse.json({ error: "Bike registration number is required" }, { status: 400 });
  }
  if (!body.stageNumber?.trim()) {
    return NextResponse.json({ error: "Stage number is required" }, { status: 400 });
  }
  if (!body.locationArea?.trim()) {
    return NextResponse.json({ error: "Location area is required" }, { status: 400 });
  }

  let selfieUrl: string | null = null;
  try {
    selfieUrl = cleanSelfie(body.selfieUrl);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const app = await db.riderApplication.create({
    data: {
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      bikePlate: body.bikePlate.trim().toUpperCase(),
      stageNumber: body.stageNumber.trim(),
      locationArea: body.locationArea.trim(),
      selfieUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    ok: true,
    applicationId: app.id,
    message: "Application received! We'll verify your details and reach out once onboarding opens in your area.",
  });
}