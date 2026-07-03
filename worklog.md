---
Task ID: airtable-integration
Agent: main
Task: Link WeBizzle admin dashboard with Airtable

Work Log:
- Stored Airtable credentials (base ID + PAT) in .env.local
- Created /src/lib/airtable.ts with full sync service: orders, vendors, products
- Created 4 API routes: /api/airtable/status (GET), /api/airtable/sync-orders (POST), /api/airtable/sync-vendors (POST), /api/airtable/sync-products (POST)
- Added "Airtable" tab to admin dashboard with: connection status banner, "Sync All" CTA, per-table sync cards (Orders, Vendors, Products)
- Added auto-push of new orders to Airtable on order creation (fire-and-forget in /api/orders)
- Token validation confirmed (amukara@gmail.com) but base access permissions need fixing on user's Airtable side

Stage Summary:
- All code is complete and server is running on port 3000
- The admin dashboard now has a 7th tab "Airtable" with connection test, sync buttons, and status indicators
- New orders automatically push to Airtable when placed
- **ACTION NEEDED**: User must update their Airtable PAT to grant access to base appqGqkFCOvWias38. Go to airtable.com/create/tokens → edit token → set Access to "All current and future bases in all current and future workspaces" and ensure scopes: data.records:read, data.records:write, schema.bases:write