---
Task ID: 1
Agent: main
Task: Fix order pricing — server-side recomputation + Daraja M-Pesa STK Push integration

Work Log:
- Read and analyzed current POST /api/orders flow (client-supplied prices, mock M-Pesa codes)
- Read Prisma schema, compare API, checkout frontend, page.tsx order handler
- Added `paymentStatus` and `mpesaCheckoutId` columns to Order model, pushed via `prisma db push`
- Created `src/lib/mpesa.ts`: Daraja STK Push client with OAuth token caching, env var validation (crash in production if missing), `normalizePhone()`, `isDarajaConfigured()`
- Created `POST /api/mpesa/callback`: Safaricom payment callback endpoint — updates order paymentStatus to PAID/FAILED
- Created `GET /api/mpesa/status`: Frontend polling endpoint for payment status
- Rewrote `POST /api/orders`:
  - Looks up VendorProduct records for (vendorId, productId) pairs
  - Ignores client-supplied subtotal/deliveryFee/total/unitPrice
  - Validates all items exist, are in stock, qty >= 1
  - Recomputes subtotal from server prices, deliveryFee from vendor record
  - Creates order with paymentStatus=PENDING, status=PLACED
  - If Daraja configured → initiates STK Push, stores checkoutRequestId
  - If Daraja not configured → 2-second setTimeout simulates payment confirmation
- Updated `page.tsx` handlePlaceOrder: two-phase flow (create order → poll /api/mpesa/status)
- Updated checkout.tsx: payment step states (initiating/polling/done), better error messages
- Added `paymentStatus` field to Order type in types.ts
- Added Daraja env vars to .env with comments (empty for dev, required in production)

Stage Summary:
- Server-side price recomputation is working — verified with curl tests showing DB prices used
- Validation rejects non-existent products (409) and missing vendors (404)
- Daraja integration is built and will activate when MPESA_CONSUMER_KEY etc. are set
- Dev mode auto-simulates payment after 2s for testing without Safaricom credentials
- Files changed: schema.prisma, orders/route.ts, mpesa.ts (new), callback/route.ts (new), status/route.ts (new), page.tsx, checkout.tsx, types.ts, .env
