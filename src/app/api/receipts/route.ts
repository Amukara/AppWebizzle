import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RECEIPT_TOKENS_PER_UPLOAD } from "@/lib/fees";

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_RECEIPT_LEN = 2_000_000; // ~1.5MB

type Extracted = {
  retailerName: string | null;
  extractedTotal: number;
  receiptDate: string | null;
};

// Best-effort VLM extraction of retailer + total + date from a receipt photo.
// Returns nulls on any failure so the upload never blocks on AI.
async function extractReceipt(dataUrl: string): Promise<Extracted> {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const res = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'This is a shopping receipt photo. Extract: the retailer/shop name, the TOTAL amount paid in KES (numbers only), and the date on the receipt (YYYY-MM-DD if possible). Respond ONLY as compact JSON: {"retailerName": "...", "extractedTotal": 0, "receiptDate": "..."}. If a field is unreadable use null.',
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { retailerName: null, extractedTotal: 0, receiptDate: null };
    const parsed = JSON.parse(match[0]);
    return {
      retailerName: typeof parsed.retailerName === "string" ? parsed.retailerName.slice(0, 80) : null,
      extractedTotal: typeof parsed.extractedTotal === "number" ? Math.round(parsed.extractedTotal) : 0,
      receiptDate: typeof parsed.receiptDate === "string" ? parsed.receiptDate.slice(0, 20) : null,
    };
  } catch {
    return { retailerName: null, extractedTotal: 0, receiptDate: null };
  }
}

// GET /api/receipts?phone=07XX — list the caller's receipts + token balance
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ receipts: [], tokens: 0 });
  }
  const rows = await db.receiptSubmission.findMany({
    where: { customerPhone: phone.trim() },
    orderBy: { createdAt: "desc" },
  });
  const tokens = rows
    .filter((r) => r.status === "APPROVED")
    .reduce((s, r) => s + r.tokensAwarded, 0);
  return NextResponse.json({
    receipts: rows.map((r) => ({
      id: r.id,
      retailerName: r.retailerName,
      extractedTotal: r.extractedTotal,
      receiptDate: r.receiptDate,
      tokensAwarded: r.tokensAwarded,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    tokens,
  });
}

// POST /api/receipts — upload a receipt photo for data collection + tokens
export async function POST(req: Request) {
  let body: { customerPhone?: string; receipt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.customerPhone?.trim()) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }
  if (!body.receipt || !DATA_URL_RE.test(body.receipt)) {
    return NextResponse.json({ error: "Receipt must be a valid image data URL" }, { status: 400 });
  }
  if (body.receipt.length > MAX_RECEIPT_LEN) {
    return NextResponse.json({ error: "Receipt image is too large (max 1.5MB)" }, { status: 400 });
  }

  // AI extraction (best-effort)
  const extracted = await extractReceipt(body.receipt);

  const sub = await db.receiptSubmission.create({
    data: {
      customerPhone: body.customerPhone.trim(),
      receiptUrl: body.receipt,
      retailerName: extracted.retailerName,
      extractedTotal: extracted.extractedTotal,
      receiptDate: extracted.receiptDate,
      tokensAwarded: RECEIPT_TOKENS_PER_UPLOAD, // pending until approved
      status: "PENDING",
    },
  });

  return NextResponse.json({
    ok: true,
    receipt: {
      id: sub.id,
      retailerName: sub.retailerName,
      extractedTotal: sub.extractedTotal,
      receiptDate: sub.receiptDate,
      tokensAwarded: sub.tokensAwarded,
      status: sub.status,
    },
    message: extracted.retailerName
      ? `Receipt uploaded! We detected ${extracted.retailerName} — pending review for ${RECEIPT_TOKENS_PER_UPLOAD} tokens.`
      : `Receipt uploaded! Pending review for ${RECEIPT_TOKENS_PER_UPLOAD} tokens.`,
  });
}
