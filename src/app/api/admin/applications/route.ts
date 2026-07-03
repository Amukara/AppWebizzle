import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import type { AdminVendorApp } from "@/lib/types";

// GET /api/admin/applications — all vendor applications (with documents)
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const apps = await db.vendorApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  const data: AdminVendorApp[] = apps.map((a) => ({
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
  return NextResponse.json({ applications: data });
}

// PATCH /api/admin/applications — approve / reject a vendor application
export async function PATCH(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !["APPROVED", "REJECTED", "PENDING"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const updated = await db.vendorApplication.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
