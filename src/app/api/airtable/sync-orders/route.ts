import { NextResponse } from "next/server";
import { ensureAirtableTables, syncOrdersToAirtable } from "@/lib/airtable";

export async function POST() {
  try {
    // Auto-create tables if needed (best-effort)
    await ensureAirtableTables().catch(() => {});
    // Small delay to let Airtable propagate
    await new Promise((r) => setTimeout(r, 500));
    const result = await syncOrdersToAirtable();
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = String(e);
    // Detect "table not found" and suggest fix
    if (msg.includes("NOT_FOUND") || msg.includes("TABLE_NOT_FOUND")) {
      return NextResponse.json(
        { success: false, error: "Table 'Orders' not found in your Airtable base. Your token may need 'schema.bases:write' scope to auto-create tables, or create them manually in Airtable first." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}