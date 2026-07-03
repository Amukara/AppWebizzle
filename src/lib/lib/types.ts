// Shared WeBizzle types

export type Product = {
  id: string;
  name: string;
  unit: string;
  emoji: string;
  category: string;
  basePrice: number;
  bestPrice: number;
  bestVendor: { id: string; name: string; emoji: string } | null;
  vendorCount: number;
  // Price intelligence
  avgPrice: number;        // average across all vendors
  maxPrice: number;        // most expensive vendor price
  trend: "down" | "stable" | "up"; // 14-day trend
  changePct: number;       // % change vs 14 days ago
  isLow: boolean;          // currently at 14-day low
};

export type PricePoint = {
  date: string; // ISO date
  price: number;
};

export type PriceHistory = {
  productId: string;
  points: PricePoint[];
  current: number;
  low: number;
  high: number;
  avg: number;
  trend: "down" | "stable" | "up";
  changePct: number;
  isLow: boolean;
  // every vendor's current price for this product, ranked
  vendors: {
    vendorId: string;
    vendorName: string;
    vendorEmoji: string;
    vendorType: string;
    price: number;
    etaMinutes: number;
    rating: number;
  }[];
};

export type Vendor = {
  id: string;
  name: string;
  emoji: string;
  type: string;
  location: string;
  rating: number;
  deliveryFee: number;
  etaMinutes: number;
  productCount: number;
};

export type CompareListing = {
  vendorId: string;
  vendorName: string;
  vendorEmoji: string;
  vendorType: string;
  price: number;
  lineTotal: number;
  etaMinutes: number;
  rating: number;
};

export type ComparePerItem = {
  productId: string;
  name: string;
  unit: string;
  emoji: string;
  qty: number;
  cheapest: CompareListing | null;
  cheapestLineTotal: number;
  listings: CompareListing[];
};

export type ComparePerVendor = {
  vendorId: string;
  vendorName: string;
  vendorEmoji: string;
  vendorType: string;
  location: string;
  rating: number;
  deliveryFee: number;
  etaMinutes: number;
  lineItems: {
    productId: string;
    name: string;
    emoji: string;
    unit: string;
    qty: number;
    price: number;
    lineTotal: number;
  }[];
  subtotal: number;
  total: number;
  canFulfilAll: boolean;
};

export type CompareResult = {
  perItem: ComparePerItem[];
  perVendor: ComparePerVendor[];
  bestSingle: ComparePerVendor | null;
  bestSplit: { subtotal: number; delivery: number; total: number; vendorCount: number };
  itemCount: number;
  totalQty: number;
};

export type CartItem = {
  productId: string;
  name: string;
  unit: string;
  emoji: string;
  qty: number;
  unitPrice: number;
};

export type Cart = {
  vendor: Vendor;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type OrderItem = CartItem;

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  vendor: { id: string; name: string; emoji: string; type: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  mpesaCode: string | null;
  createdAt: string;
  // Live tracking
  rider?: {
    name: string;
    plate: string;
    phone: string;
    rating: number;
  } | null;
  // Savings realised on this order vs. market-average prices
  saved?: number;
  // Monetisation
  platformFee?: number;
  driverLevy?: number;
  vendorPayout?: number;
  driverPayout?: number;
  referralCode?: string | null;
};

export type TrackingStep = {
  key: "PLACED" | "CONFIRMED" | "DISPATCHED" | "DELIVERED";
  label: string;
  description: string;
  reached: boolean;
  // epoch ms when this step was (or will be) reached; null if not yet scheduled
  at: number | null;
};

export type OrderTracking = {
  orderId: string;
  status: string;
  steps: TrackingStep[];
  rider: {
    name: string;
    plate: string;
    phone: string;
    rating: number;
  } | null;
  etaMinutes: number;        // remaining minutes to delivery
  placedAt: number;          // epoch ms
  estimatedDeliveryAt: number; // epoch ms
  progressPct: number;       // 0-100 through the journey
  // Google Maps integration: pickup, dropoff, and live rider positions.
  map?: {
    vendor: { lat: number; lng: number; name: string; emoji: string } | null;
    customer: { lat: number; lng: number } | null;
    rider: { lat: number; lng: number } | null;
    distanceKm: number | null;
  } | null;
};

export type SavingsSummary = {
  totalSaved: number;        // KES saved vs. market-average prices, all-time
  totalSpent: number;
  orderCount: number;
  avgSavingsPct: number;     // totalSaved / (totalSpent+totalSaved) * 100
  avgSavedPerOrder: number;
  streakWeeks: number;       // consecutive weeks with >=1 order
  bestCategory: { category: string; saved: number; spent: number } | null;
  byCategory: { category: string; saved: number; spent: number }[];
  recent: {
    orderId: string;
    createdAt: string;
    vendorName: string;
    vendorEmoji: string;
    total: number;
    saved: number;
  }[];
};

export type PageId =
  | "home"
  | "basket"
  | "cart"
  | "checkout"
  | "confirmation"
  | "orders"
  | "savings"
  | "support"
  | "vendor-signup"
  | "rider-signup"
  | "boost"
  | "referrals"
  | "receipts"
  | "admin"
  | "vendor-portal"
  | "rider-portal";

// ---- Vendor / rider portal ----
export type VendorPortal = {
  id: string;
  vendorId: string;
  shopName: string;
  phone: string;
  isOnline: boolean;
  dutyStart: string;
  dutyEnd: string;
  lastSeen: string;
};

export type RiderPortal = {
  id: string;
  riderKey: string;
  fullName: string;
  phone: string;
  plate: string;
  isOnline: boolean;
  lastSeen: string;
};

export type AppNotification = {
  id: string;
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  orderId: string | null;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  channel: string;
  senderType: string;
  senderId: string;
  senderName: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type PresenceEntry = {
  kind: "vendor" | "rider" | "admin";
  id: string;
  name: string;
};

export type AdminPresence = {
  vendors: {
    vendorId: string;
    shopName: string;
    emoji: string;
    type: string;
    isOnline: boolean;
    dutyStart: string;
    dutyEnd: string;
    lastSeen: string;
  }[];
  riders: {
    riderKey: string;
    fullName: string;
    phone: string;
    plate: string;
    isOnline: boolean;
    lastSeen: string;
  }[];
  summary: {
    vendorsOnline: number;
    ridersOnline: number;
    vendorsTotal: number;
    ridersTotal: number;
  };
};

// ---- Admin dashboard ----
export type AdminDashboard = {
  // Revenue
  platformRevenue: number; // sum of platformFee
  driverLevyRevenue: number; // sum of driverLevy
  boostRevenue: number; // sum of BoostCampaign.price
  grossMerchandiseValue: number; // sum of order.total
  // Orders
  totalOrders: number;
  pendingDispatch: number; // CONFIRMED but not DISPATCHED
  inTransit: number; // DISPATCHED
  delivered: number; // DELIVERED
  avgOrderValue: number;
  // Vendors / riders
  vendorApplications: number;
  riderApplications: number;
  activeBoosts: number;
  // Referrals
  referralSignups: number;
  referralOrders: number;
  referralRewardsPaid: number;
  // Receipts
  receiptsPending: number;
  receiptsApproved: number;
  tokensIssued: number;
  // Trends
  ordersLast7Days: { day: string; count: number; revenue: number }[];
  topVendors: {
    vendorId: string;
    name: string;
    emoji: string;
    orders: number;
    revenue: number;
    payout: number;
  }[];
};

export type AdminOrder = Order & {
  platformFee: number;
  driverLevy: number;
  vendorPayout: number;
  driverPayout: number;
};

export type AdminDispatch = {
  orderId: string;
  customerName: string;
  location: string;
  vendorName: string;
  vendorEmoji: string;
  riderName: string | null;
  riderPlate: string | null;
  status: string;
  total: number;
  driverPayout: number;
  driverLevy: number;
  etaMinutes: number;
  createdAt: string;
};

export type AdminVendorApp = {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  logo: string | null;
  tradeLicense: string | null;
  municipalLicense: string | null;
  kplcToken: string | null;
  status: string;
  createdAt: string;
};

export type AdminBoost = {
  id: string;
  shopName: string;
  phone: string;
  package: string;
  price: number;
  status: string;
  startsAt: string;
  endsAt: string;
  impressions: number;
  clicks: number;
};

export type AdminReceipt = {
  id: string;
  customerPhone: string;
  retailerName: string | null;
  extractedTotal: number;
  receiptDate: string | null;
  receiptUrl: string;
  tokensAwarded: number;
  status: string;
  createdAt: string;
};

// ---- Referrals ----
export type Referral = {
  id: string;
  code: string;
  ownerName: string;
  ownerPhone: string;
  clicks: number;
  signups: number;
  orders: number;
  rewardEarned: number;
  status: string;
  createdAt: string;
};

// ---- Receipts ----
export type ReceiptSubmission = {
  id: string;
  customerPhone: string;
  retailerName: string | null;
  extractedTotal: number;
  receiptDate: string | null;
  tokensAwarded: number;
  status: string;
  createdAt: string;
};

export type BoostPackage = {
  id: string;
  name: string;
  price: number;
  days: number;
  perk: string;
  features: string[];
};
