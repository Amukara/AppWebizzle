import { NextResponse } from "next/server";
import { testAirtableConnection, ensureAirtableTables } from "@/lib/airtable";

export async function GET() {
  const result = await testAirtableConnection();
  if (result.ok) {
    // If tables are empty, try to auto-create them
    if ((!result.tables || result.tables.length === 0) && !result.error) {
      const created = await ensureAirtableTables().catch(() => [] as string[]);
      if (created.length > 0) {
        return NextResponse.json({
          connected: true,
          tables: created,
          message: `Auto-created ${created.length} table(s). You can now sync data.`,
        });
      }
      return NextResponse.json({
        connected: true,
        tables: [],
        message: result.error ?? "Base connected. Sync data to create table rows.",
      });
    }
    return NextResponse.json({ connected: true, tables: result.tables });
  }
  return NextResponse.json({ connected: false, error: result.error }, { status: 502 });
}