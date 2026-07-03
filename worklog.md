---
Task ID: 5
Agent: main (orchestrator)
Task: Category-filtered Smart Basket with vendor toggle, ratings, and smart ranking

Work Log:
- Restored project from uploaded archive after init script reset
- Enhanced prisma/seed.js with 37 products across 9 categories (added Hardware, Butchery, Electronics, Agrovet items) and 10 vendors (added Wanjohi Hardware, Boma Butchery, Greenlife Agrovet, Safaricom Express). Re-seeded DB: 37 products, 10 vendors, 370 listings.
- Updated src/app/page.tsx: added activeCategory state, navigateCategory callback that sets/clears category, passed activeCategory + onClearCategory + vendors to BasketPage, passed onNavigateCategory to HomePage.
- Updated src/components/brand/pages/home.tsx: categories now call onNavigateCategory("basket", categoryLabel) passing the category name. Added product count badges on category cards.
- Rewrote src/components/brand/pages/basket.tsx: 
  - Category filtering: when activeCategory is set, shows only matching products
  - Category pills bar for quick category switching when no active category
  - Back button + category header when viewing a specific category
  - Upsell section: "You might also need" shows items from the same category not yet in the basket
  - In-basket quick view with removable badges
  - Category-aware compare messaging ("Comparing across N hardware vendors")
- Enhanced CompareDialog in basket.tsx:
  - Vendor toggle: clicking any vendor in the ranked list expands their item breakdown and switches the hero section to show that vendor's details
  - "Viewing" badge on the currently toggled vendor
  - Item breakdown table for the selected vendor
  - Ratings always visible with Star icon (not just RatingStars component) on every vendor
  - "Fastest" badge for vendors with ETA <= 20min, "Top rated" for rating >= 4.7
  - Vendor type shown on each vendor card
  - Rank numbers (1, 2, 3...) with color coding
  - Sort hints: "Cheapest first · Then fastest · Then top rated"
- Updated src/app/api/compare/route.ts: improved sort algorithm — (1) canFulfilAll first, (2) cheapest total, (3) fastest ETA, (4) highest rating as tiebreakers.
- Lint clean (0 errors in src/).
- Browser verified: Home categories with count badges → Hardware category shows 6 hardware products → upsell "You might also need (5 more hardware items)" → add items → Compare shows Wanjohi Hardware (specialist!) as cheapest at KES 1,200 → vendor toggle to Boma Butchery shows item breakdown and updates hero → toggle back works → Pharmacy category shows only 5 medicines → mobile responsive → no console errors.

Stage Summary:
- Category-to-basket flow: clicking Hardware shows only hardware items, Pharmacy shows only medicines, etc.
- Vendor toggle in compare dialog: click any vendor to inspect their prices, item breakdown, and choose them
- Smart ranking: cheapest first, then fastest, then top-rated — with ratings visible on every vendor
- Files changed: prisma/seed.js, src/app/page.tsx, src/components/brand/pages/home.tsx, src/components/brand/pages/basket.tsx, src/app/api/compare/route.ts
- Status: DONE. All features browser-verified.