// Airtable integration service for WeBizzle admin dashboard
// Handles syncing Orders, Vendors, and Products to Airtable base
// Uses only data.records scope (no schema management needed)

const AIRTABLE_API = "https://api.airtable.com/v0";

function getBaseId(): string {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID not set in .env.local");
  return id;
}

function getToken(): string {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  if (!token) throw new Error("AIRTABLE_PERSONAL_ACCESS_TOKEN not set in .env.local");
  return token;
}

// ---------- Generic Airtable helpers ----------

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

async function airtableFetch(tableName: string, init?: RequestInit) {
  const url = `${AIRTABLE_API}/${getBaseId()}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...airtableHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

// ---------- Table name constants ----------

export const TABLES = {
  orders: "Orders",
  vendors: "Vendors",
  products: "Products",
} as const;

// ---------- Clear all records in a table ----------

async function clearTable(tableName: string) {
  const allIds: string[] = [];
  let offset: string | undefined;
  // Paginate to get all record IDs
  do {
    const url = offset
      ? `${tableName}?maxRecords=100&offset=${offset}`
      : `${tableName}?maxRecords=100`;
    const data = await airtableFetch(url);
    for (const r of data.records ?? []) allIds.push(r.id);
    offset = data.offset;
  } while (offset);

  // Delete in batches of 10 (Airtable limit)
  for (let i = 0; i < allIds.length; i += 10) {
    const batch = allIds.slice(i, i + 10);
    await airtableFetch(tableName, {
      method: "DELETE",
      body: JSON.stringify({ records: batch.map((id: string) => ({ id })) }),
    });
  }
  return allIds.length;
}

// ---------- Create records in batches ----------

async function createRecords(tableName: string, records: { fields: Record<string, unknown> }[]) {
  let created = 0;
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const result = await airtableFetch(tableName, {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
    created += (result.records?.length ?? 0);
  }
  return created;
}

// ---------- Sync Orders ----------

export async function syncOrdersToAirtable() {
  const { db } = await import("@/lib/db");

  const orders = await db.order.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const records = orders.map((o) => {
    const items = JSON.parse(o.itemsJson) as { name: string; qty: number; unitPrice: number; emoji: string }[];
    const itemsText = items.map((i) => `${i.emoji} ${i.name} x${i.qty} @ KES ${i.unitPrice}`).join("\n");

    return {
      fields: {
        "Order ID": o.id.slice(0, 8).toUpperCase(),
        Customer: o.customerName,
        Phone: o.phone,
        Location: o.location,
        Vendor: `${o.vendor.emoji} ${o.vendor.name}`,
        "Vendor Type": o.vendor.type,
        Items: itemsText,
        Subtotal: o.subtotal,
        "Delivery Fee": o.deliveryFee,
        Total: o.total,
        Status: o.status,
        "M-Pesa Code": o.mpesaCode ?? "",
        Rider: o.riderName ? `${o.riderName} (${o.riderPlate})` : "Unassigned",
        Saved: o.saved ?? 0,
        "Platform Fee": o.platformFee ?? 0,
        "Driver Levy": o.driverLevy ?? 0,
        "Order Date": o.createdAt.toISOString(),
      },
    };
  });

  // Clear existing and rewrite
  const cleared = await clearTable("Orders").catch(() => 0);
  const created = await createRecords("Orders", records);

  return { synced: orders.length, created, cleared };
}

// ---------- Sync Vendors ----------

export async function syncVendorsToAirtable() {
  const { db } = await import("@/lib/db");

  const vendors = await db.vendor.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { rating: "desc" },
  });

  const records = vendors.map((v) => ({
    fields: {
      "Vendor ID": v.id.slice(0, 8).toUpperCase(),
      Name: `${v.emoji} ${v.name}`,
      Type: v.type,
      Location: v.location,
      Rating: v.rating,
      "Delivery Fee": v.deliveryFee,
      "ETA (min)": v.etaMinutes,
      "Products Listed": v._count.products,
    },
  }));

  const cleared = await clearTable("Vendors").catch(() => 0);
  const created = await createRecords("Vendors", records);

  return { synced: vendors.length, created, cleared };
}

// ---------- Sync Products ----------

export async function syncProductsToAirtable() {
  const { db } = await import("@/lib/db");

  const products = await db.product.findMany({
    include: { _count: { select: { vendors: true } } },
    orderBy: { category: "asc" },
  });

  const records = products.map((p) => ({
    fields: {
      "Product ID": p.id.slice(0, 8).toUpperCase(),
      Name: `${p.emoji} ${p.name}`,
      Category: p.category,
      Unit: p.unit,
      "Base Price": p.basePrice,
      "Vendor Count": p._count.vendors,
    },
  }));

  const cleared = await clearTable("Products").catch(() => 0);
  const created = await createRecords("Products", records);

  return { synced: products.length, created, cleared };
}

// ---------- Push a single new order (fire-and-forget) ----------

export async function pushSingleOrderToAirtable(order: {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  vendor: { name: string; emoji: string; type: string };
  items: { name: string; qty: number; unitPrice: number; emoji: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  mpesaCode: string | null;
  riderName?: string | null;
  riderPlate?: string | null;
  saved?: number | null;
  platformFee?: number | null;
  driverLevy?: number | null;
  createdAt: string;
}) {
  try {
    const itemsText = order.items
      .map((i) => `${i.emoji} ${i.name} x${i.qty} @ KES ${i.unitPrice}`)
      .join("\n");

    await airtableFetch("Orders", {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Order ID": order.id.slice(0, 8).toUpperCase(),
              Customer: order.customerName,
              Phone: order.phone,
              Location: order.location,
              Vendor: `${order.vendor.emoji} ${order.vendor.name}`,
              "Vendor Type": order.vendor.type,
              Items: itemsText,
              Subtotal: order.subtotal,
              "Delivery Fee": order.deliveryFee,
              Total: order.total,
              Status: order.status,
              "M-Pesa Code": order.mpesaCode ?? "",
              Rider: order.riderName ? `${order.riderName} (${order.riderPlate})` : "Unassigned",
              Saved: order.saved ?? 0,
              "Platform Fee": order.platformFee ?? 0,
              "Driver Levy": order.driverLevy ?? 0,
              "Order Date": order.createdAt,
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.error("[Airtable] Failed to push single order:", e);
  }
}

// ---------- Connection test ----------

export async function testAirtableConnection(): Promise<{ ok: boolean; tables?: string[]; error?: string }> {
  const tableNames = ["Orders", "Vendors", "Products"];
  const found: string[] = [];

  try {
    // First, verify the token itself is valid
    const meRes = await fetch(`${AIRTABLE_API}/meta/whoami`, {
      headers: airtableHeaders(),
    });
    if (!meRes.ok) {
      return { ok: false, error: "Invalid token. Check your AIRTABLE_PERSONAL_ACCESS_TOKEN in .env.local" };
    }
    const me = await meRes.json();

    // Try to list records from each table to verify base access + table existence
    for (const t of tableNames) {
      const res = await fetch(
        `${AIRTABLE_API}/${getBaseId()}/${encodeURIComponent(t)}?maxRecords=1`,
        { headers: airtableHeaders() }
      );
      if (res.ok) {
        found.push(t);
      }
    }

    // If at least one table works, we're good
    if (found.length > 0) {
      return { ok: true, tables: found };
    }

    // No tables found. Try to determine if it's a base access issue or just empty base.
    // Attempt to create tables via schema API
    const schemaRes = await fetch(
      `${AIRTABLE_API}/meta/bases/${getBaseId()}/tables`,
      { method: "POST", headers: airtableHeaders(), body: JSON.stringify({
        name: "Orders",
        fields: [{ name: "Test", type: "singleLineText" }],
      }) }
    );

    if (schemaRes.ok || (await schemaRes.json().catch(() => ({}))).error?.type === "DUPLICATE_TABLE") {
      // Schema API works — base is accessible, just no tables yet (or they were just created)
      // Clean up the test table if we created one
      if (schemaRes.ok) {
        const created = await schemaRes.json();
        if (created.id) {
          await fetch(`${AIRTABLE_API}/meta/bases/${getBaseId()}/tables/${created.id}`, {
            method: "DELETE",
            headers: airtableHeaders(),
          }).catch(() => {});
        }
      }
      return {
        ok: true,
        tables: [],
        error: "Base connected. Click 'Sync All' to push data and create tables.",
      };
    }

    // Schema API also failed — likely a base access issue
    // Try to get the exact error for better debugging
    const schemaErr = await schemaRes.json().catch(() => ({}));
    const errType = schemaErr?.error?.type ?? "UNKNOWN";

    let fixSteps: string;
    if (errType === "INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND") {
      fixSteps =
        `1. Go to https://airtable.com/create/tokens\n` +
        `2. Find your token and click "Edit"\n` +
        `3. Under "Access", change from "Selected bases" to "All current and future bases in all current and future workspaces"\n` +
        `4. Under "Scopes", ensure these are checked:\n` +
        `   - data.records:read\n` +
        `   - data.records:write\n` +
        `   - schema.bases:read\n` +
        `   - schema.bases:write\n` +
        `5. Click "Save token"`;
    } else {
      fixSteps =
        `Go to https://airtable.com/create/tokens → edit this token → under "Access" ensure ` +
        `"All current and future bases in all current and future workspaces" is selected, ` +
        `and scopes include "data.records:read" + "data.records:write" + "schema.bases:write".`;
    }

    return {
      ok: false,
      error: `Token valid (${me.email ?? me.id}) but cannot access base "${getBaseId()}".\n\n${fixSteps}`,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- Auto-create tables via schema API (if token has permission) ----------

export async function ensureAirtableTables() {
  const tableDefs = [
    {
      name: "Orders",
      description: "WeBizzle customer orders",
      fields: [
        { name: "Order ID", type: "singleLineText" },
        { name: "Customer", type: "singleLineText" },
        { name: "Phone", type: "phoneNumber" },
        { name: "Location", type: "singleLineText" },
        { name: "Vendor", type: "singleLineText" },
        { name: "Vendor Type", type: "singleLineText" },
        { name: "Items", type: "multilineText" },
        { name: "Subtotal", type: "currency", options: { precision: 0 } },
        { name: "Delivery Fee", type: "currency", options: { precision: 0 } },
        { name: "Total", type: "currency", options: { precision: 0 } },
        { name: "Status", type: "singleSelect", options: { choices: [
          { name: "PLACED", color: "grayBlue" },
          { name: "CONFIRMED", color: "blue" },
          { name: "DISPATCHED", color: "yellow" },
          { name: "DELIVERED", color: "green" },
        ] } },
        { name: "M-Pesa Code", type: "singleLineText" },
        { name: "Rider", type: "singleLineText" },
        { name: "Saved", type: "currency", options: { precision: 0 } },
        { name: "Platform Fee", type: "currency", options: { precision: 0 } },
        { name: "Driver Levy", type: "currency", options: { precision: 0 } },
        { name: "Order Date", type: "dateTime", options: { timeZone: "Africa/Nairobi", dateFormat: { name: "iso" }, timeFormat: { name: "24hour" } } },
      ],
    },
    {
      name: "Vendors",
      description: "WeBizzle registered vendors",
      fields: [
        { name: "Vendor ID", type: "singleLineText" },
        { name: "Name", type: "singleLineText" },
        { name: "Type", type: "singleSelect", options: { choices: [
          { name: "Duka", color: "amber" },
          { name: "Mama Mboga", color: "green" },
          { name: "Pharmacy", color: "blue" },
          { name: "Bakery", color: "yellow" },
          { name: "Hardware", color: "orange" },
          { name: "Butchery", color: "red" },
          { name: "Electronics", color: "purple" },
          { name: "Agrovet", color: "teal" },
        ] } },
        { name: "Location", type: "singleLineText" },
        { name: "Rating", type: "number", options: { precision: 1 } },
        { name: "Delivery Fee", type: "currency", options: { precision: 0 } },
        { name: "ETA (min)", type: "number", options: { precision: 0 } },
        { name: "Products Listed", type: "number", options: { precision: 0 } },
      ],
    },
    {
      name: "Products",
      description: "WeBizzle product catalogue",
      fields: [
        { name: "Product ID", type: "singleLineText" },
        { name: "Name", type: "singleLineText" },
        { name: "Category", type: "singleSelect", options: { choices: [
          { name: "Duka", color: "amber" },
          { name: "Mama Mboga", color: "green" },
          { name: "Pharmacy", color: "blue" },
          { name: "Bakery", color: "yellow" },
          { name: "Hardware", color: "orange" },
          { name: "Butchery", color: "red" },
          { name: "Electronics", color: "purple" },
          { name: "Agrovet", color: "teal" },
        ] } },
        { name: "Unit", type: "singleLineText" },
        { name: "Base Price", type: "currency", options: { precision: 0 } },
        { name: "Vendor Count", type: "number", options: { precision: 0 } },
      ],
    },
  ];

  const created: string[] = [];
  for (const tableDef of tableDefs) {
    try {
      const res = await fetch(`${AIRTABLE_API}/meta/bases/${getBaseId()}/tables`, {
        method: "POST",
        headers: airtableHeaders(),
        body: JSON.stringify(tableDef),
      });
      if (res.ok) {
        created.push(tableDef.name);
      }
    } catch (e) {
      console.error(`[Airtable] Failed to create table "${tableDef.name}":`, e);
    }
  }
  return created;
}