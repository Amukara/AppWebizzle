// WeBizzle monetisation rules
// - Platform fee: 3% levy on every order whose TOTAL exceeds KES 300.
// - Driver levy:  10% of the delivery fee, charged to the rider on every
//   successful delivery. The rider keeps 90% of the delivery fee.
// - Vendor payout: subtotal minus the platform fee (marketplace commission).

export const PLATFORM_FEE_RATE = 0.03;
export const PLATFORM_FEE_THRESHOLD = 300; // KES — orders above this attract the 3% levy
export const DRIVER_LEVY_RATE = 0.10;

export type FeeBreakdown = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  platformFee: number; // charged to vendor
  driverLevy: number; // charged to rider
  vendorPayout: number; // subtotal - platformFee
  driverPayout: number; // deliveryFee - driverLevy
  platformNet: number; // platformFee (revenue to WeBizzle)
};

export function computeFees(
  subtotal: number,
  deliveryFee: number
): FeeBreakdown {
  const total = subtotal + deliveryFee;
  const platformFee =
    total > PLATFORM_FEE_THRESHOLD ? Math.round(total * PLATFORM_FEE_RATE) : 0;
  const driverLevy = Math.round(deliveryFee * DRIVER_LEVY_RATE);
  const vendorPayout = Math.max(0, subtotal - platformFee);
  const driverPayout = Math.max(0, deliveryFee - driverLevy);
  return {
    subtotal,
    deliveryFee,
    total,
    platformFee,
    driverLevy,
    vendorPayout,
    driverPayout,
    platformNet: platformFee,
  };
}

// Boost packages vendors can buy to promote their profile.
export const BOOST_PACKAGES = [
  {
    id: "SILVER",
    name: "Silver",
    price: 500,
    days: 7,
    perk: "Top of your category for a week",
    features: ["Category top placement", "7-day run", "Impression report"],
  },
  {
    id: "GOLD",
    name: "Gold",
    price: 1200,
    days: 14,
    perk: "Homepage featured slot for 2 weeks",
    features: [
      "Homepage featured card",
      "14-day run",
      "Click + impression report",
      "Priority in compare results",
    ],
  },
  {
    id: "PLATINUM",
    name: "Platinum",
    price: 2500,
    days: 30,
    perk: "Homepage + push notification blast",
    features: [
      "Homepage hero placement",
      "30-day run",
      "Neighbourhood push blast",
      "Top of every compare result",
      "Full analytics dashboard",
    ],
  },
] as const;

// Referral rewards
// Referrer earns a redeemable voucher (store credit) when a referee places
// their first order. The referee gets a first-order discount separately.
export const REFERRAL_REWARD_KES = 20; // referrer earns this as a redeemable voucher
export const REFERRAL_REWARD_LABEL = "KES 20 redeemable voucher";
export const REFEREE_DISCOUNT_KES = 50; // referee gets this off their first order
export const RECEIPT_TOKENS_PER_UPLOAD = 10; // tokens per approved receipt
export const TOKENS_PER_KES_DISCOUNT = 10; // 10 tokens = KES 10 off

// NOTE: Admin auth is now real username+password backed by the AdminUser table
// (see src/lib/admin.ts). The old shared passcode has been removed.
