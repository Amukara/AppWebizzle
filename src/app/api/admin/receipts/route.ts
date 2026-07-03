import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import { RECEIPT_TOKENS_PER_UPLOAD } from "@/lib/fees";
import type { AdminReceipt } from "@/lib/types";

// GET /api/admin/receipts — all receipt submissions (for review)
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const rows = await db.receiptSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  const data: AdminReceipt[] = rows.map((r) => ({
    id: r.id,
    customerPhone: r.customerPhone,
    retailerName: r.retailerName,
    extractedTotal: r.extractedTotal,
    receiptDate: r.receiptDate,
    receiptUrl: r.receiptUrl,
    tokensAwarded: r.tokensAwarded,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ receipts: data });
}

// PATCH /api/admin/receipts — approve (award tokens) or reject a receipt
export async function PATCH(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !["APPROVED", "REJECTED"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const tokens = body.status === "APPROVED" ? RECEIPT_TOKENS_PER_UPLOAD : 0;
  const updated = await db.receiptSubmission.update({
    where: { id: body.id },
    data: { status: body.status, tokensAwarded: tokens },
  });
  return NextResponse.json({ ok: true, status: updated.status, tokensAwarded: tokens });
}
