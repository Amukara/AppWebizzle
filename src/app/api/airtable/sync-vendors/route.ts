import { NextResponse } from "next/server";
import { ensureAirtableTables, syncVendorsToAirtable } from "@/lib/airtable";

export async function POST() {
  try {
    await ensureAirtableTables().catch(() => {});
    await new Promise((r) => setTimeout(r, 500));
    const result = await syncVendorsToAirtable();
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("NOT_FOUND") || msg.includes("TABLE_NOT_FOUND")) {
      return NextResponse.json(
        { success: false, error: "Table 'Vendors' not found. Create it in Airtable or ensure your token has schema.bases:write scope." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}