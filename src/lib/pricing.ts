import type { PricePoint } from "@/lib/types";

// ---- Deterministic PRNG so price history is stable per product ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 14;

/**
 * Generate a deterministic 14-day daily price history ending at `currentPrice`.
 * The series does a gentle random walk around the price so trends vary per
 * product but stay stable between requests.
 */
export function generatePriceHistory(
  productId: string,
  currentPrice: number
): {
  points: PricePoint[];
  low: number;
  high: number;
  avg: number;
  trend: "down" | "stable" | "up";
  changePct: number;
  isLow: boolean;
} {
  const rand = mulberry32(hashStr(productId));
  const start = Date.now() - (HISTORY_DAYS - 1) * DAY_MS;

  // Build a backwards random walk from the current price.
  const prices: number[] = [currentPrice];
  for (let i = 1; i < HISTORY_DAYS; i++) {
    // ±6% daily drift, clamped so it stays positive and sensible.
    const drift = (rand() - 0.5) * 0.12;
    const prev = prices[i - 1];
    let next = prev * (1 + drift);
    next = Math.max(currentPrice * 0.82, Math.min(currentPrice * 1.18, next));
    prices.push(Math.round(next));
  }
  prices.reverse(); // oldest → newest, newest = currentPrice

  const points: PricePoint[] = prices.map((price, i) => ({
    date: new Date(start + i * DAY_MS).toISOString(),
    price,
  }));

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const oldest = prices[0];
  const changePct =
    oldest > 0 ? Math.round(((currentPrice - oldest) / oldest) * 1000) / 10 : 0;

  let trend: "down" | "stable" | "up" = "stable";
  if (changePct <= -1.5) trend = "down";
  else if (changePct >= 1.5) trend = "up";

  return {
    points,
    low,
    high,
    avg,
    trend,
    changePct,
    isLow: currentPrice <= low,
  };
}

/** Market stats across a product's in-stock vendor listings. */
export function marketStats(prices: number[]): {
  avg: number;
  max: number;
  min: number;
} {
  if (prices.length === 0) return { avg: 0, max: 0, min: 0 };
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / prices.length),
    max: Math.max(...prices),
    min: Math.min(...prices),
  };
}

// ---- Rider pool for deterministic rider assignment ----
const RIDERS = [
  { name: "Peter Mutua", plate: "KMEA 224B", phone: "0711 224 118", rating: 4.8 },
  { name: "Brian Otieno", plate: "KMEB 902X", phone: "0722 902 553", rating: 4.7 },
  { name: "Faith Wanjiru", plate: "KMFC 771A", phone: "0701 771 209", rating: 4.9 },
  { name: "Samuel Kiptoo", plate: "KMDD 550C", phone: "0733 550 441", rating: 4.6 },
  { name: "Grace Auma", plate: "KMLG 318P", phone: "0790 318 776", rating: 4.8 },
];

export function pickRider(seedKey: string) {
  const idx = hashStr(seedKey) % RIDERS.length;
  return RIDERS[idx];
}
