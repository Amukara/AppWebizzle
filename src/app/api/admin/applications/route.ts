import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import type { AdminVendorApp } from "@/lib/types";

// GET /api/admin/applications — all vendor + rider applications
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();

  const [vendorApps, riderApps] = await Promise.all([
    db.vendorApplication.findMany({ orderBy: { createdAt: "desc" } }),
    db.riderApplication.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const vendorData: AdminVendorApp[] = vendorApps.map((a) => ({
    id: a.id,
    shopName: a.shopName,
    ownerName: a.ownerName,
    phone: a.phone,
    logo: a.logo,
    tradeLicense: a.tradeLicense,
    municipalLicense: a.municipalLicense,
    kplcToken: a.kplcToken,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  const riderData = riderApps.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    bikePlate: a.bikePlate,
    stageNumber: a.stageNumber,
    locationArea: a.locationArea,
    selfieUrl: a.selfieUrl,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  return NextResponse.json({
    applications: vendorData,
    riderApplications: riderData,
  });
}

// PATCH /api/admin/applications — approve / reject a vendor or rider application
// body: { id, status, kind?: "vendor" | "rider" }
export async function PATCH(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  let body: { id?: string; status?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !["APPROVED", "REJECTED", "PENDING"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }

  const kind = body.kind === "rider" ? "rider" : "vendor";

  if (kind === "rider") {
    const updated = await db.riderApplication.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  const updated = await db.vendorApplication.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}