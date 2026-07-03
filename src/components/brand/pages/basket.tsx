"use client";

import { useState, useMemo } from "react";
import {
  ShoppingBasket,
  ShoppingBag,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  Truck,
  Clock,
  TrendingDown,
  Trophy,
  Sparkles,
  ChevronRight,
  MapPin,
  Wallet,
  ArrowLeft,
  Star,
  Zap,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KES } from "../logo";
import { RatingStars } from "../ui";
import type { CartItem, CompareResult, PageId, Product, Vendor } from "@/lib/types";

type Selection = Record<string, number>;

// Map category labels to their visual identity
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  "Mama Mboga": { emoji: "\u{1F96C}", color: "bg-green-100 text-green-800" },
  "Duka": { emoji: "\u{1F3EA}", color: "bg-amber-100 text-amber-800" },
  "Pharmacy": { emoji: "\u{1F48A}", color: "bg-blue-100 text-blue-800" },
  "Hardware": { emoji: "\u{1F527}", color: "bg-orange-100 text-orange-800" },
  "Electronics": { emoji: "\u{1F4F1}", color: "bg-purple-100 text-purple-800" },
  "Butchery": { emoji: "\u{1F356}", color: "bg-red-100 text-red-800" },
  "Bakery": { emoji: "\u{1F35E}", color: "bg-yellow-100 text-yellow-800" },
  "Agrovet": { emoji: "\u{1F331}", color: "bg-lime-100 text-lime-800" },
  "Restaurants": { emoji: "\u{1F374}", color: "bg-rose-100 text-rose-800" },
  "Bars & Pubs": { emoji: "\u{1F37A}", color: "bg-indigo-100 text-indigo-800" },
};

export function BasketPage({
  products,
  vendors,
  selection,
  setSelection,
  onCompare,
  onChooseVendor,
  onNavigate,
  activeCategory,
  onClearCategory,
}: {
  products: Product[];
  vendors: Vendor[];
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCompare: () => Promise<CompareResult | null>;
  onChooseVendor: (vendorId: string, items: CartItem[]) => void;
  onNavigate: (p: PageId) => void;
  activeCategory: string | null;
  onClearCategory: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>("");

  // Derive all unique categories from the product list
  const allCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filter products: if a category is active, show only that category
  const displayProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  // Products already in the basket (for upsell suggestions)
  const selectedIds = useMemo(
    () => new Set(Object.keys(selection).filter((id) => selection[id] > 0)),
    [selection]
  );

  // Upsell items: products in the same category NOT yet in the basket
  const upsellProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter(
      (p) => p.category === activeCategory && !selectedIds.has(p.id)
    );
  }, [products, activeCategory, selectedIds]);

  const totalQty = Object.values(selection).reduce((a, b) => a + b, 0);
  const hasItems = totalQty > 0;

  const estimatedMin = products.reduce((s, p) => {
    const q = selection[p.id] || 0;
    return s + p.bestPrice * q;
  }, 0);
  const budgetNum = Number(budget) || 0;
  const overBudget = budgetNum > 0 && estimatedMin > budgetNum;
  const budgetPct =
    budgetNum > 0 ? Math.min(100, Math.round((estimatedMin / budgetNum) * 100)) : 0;

  const meta = activeCategory ? CATEGORY_META[activeCategory] : null;

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onCompare();
      if (!res) {
        setError("Could not compare prices. Please try again.");
        return;
      }
      setResult(res);
      setOpen(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = (vendorId: string, lineItems: CompareResult["bestSingle"]["lineItems"]) => {
    const items: CartItem[] = lineItems.map((li) => ({
      productId: li.productId,
      name: li.name,
      unit: li.unit,
      emoji: li.emoji,
      qty: li.qty,
      unitPrice: li.price,
    }));
    onChooseVendor(vendorId, items);
    setOpen(false);
    onNavigate("cart");
  };

  const handleCategoryClick = (cat: string | null) => {
    if (cat === activeCategory) {
      onClearCategory();
    } else {
      onNavigate("basket", cat);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        {activeCategory ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onClearCategory()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
              aria-label="Back to all products"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta?.emoji}</span>
              <h1 className="text-2xl font-extrabold">{activeCategory}</h1>
              <Badge className={cn("text-[10px]", meta?.color)}>
                {displayProducts.length} items
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingBasket className="text-brand" size={24} />
            <h1 className="text-2xl font-extrabold">Smart Basket</h1>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {activeCategory
            ? `Browse ${activeCategory.toLowerCase()} items — add to your basket, compare vendors, and pick the best deal.`
            : "Build your list once — WeBizzle checks every vendor and finds the cheapest full basket."}
        </p>
      </div>

      {/* Category pills (only when no active category) */}
      {!activeCategory && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allCategories.map((cat) => {
            const cm = CATEGORY_META[cat];
            const count = products.filter((p) => p.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:border-brand hover:bg-brand-light/40"
              >
                <span>{cm?.emoji}</span>
                {cat}
                <span className="text-muted-foreground">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main product builder */}
      <Card className="divide-y divide-border overflow-hidden">
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <span className="text-4xl">{meta?.emoji ?? "\u{1F6D2}"}</span>
            <p className="text-sm font-medium text-muted-foreground">
              No products in this category yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClearCategory()}
            >
              Browse all categories
            </Button>
          </div>
        ) : (
          displayProducts.map((p) => {
            const qty = selection[p.id] || 0;
            const active = qty > 0;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 p-3 transition-colors sm:p-4",
                  active && "bg-brand-light/40"
                )}
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl",
                    active ? "bg-brand-light" : "bg-muted"
                  )}
                >
                  {p.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-tight">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.unit} · from {KES(p.bestPrice)}
                  </div>
                </div>
                <Stepper
                  qty={qty}
                  onDec={() => {
                    const next = { ...selection };
                    if (qty <= 1) delete next[p.id];
                    else next[p.id] = qty - 1;
                    setSelection(next);
                  }}
                  onInc={() =>
                    setSelection({ ...selection, [p.id]: qty + 1 })
                  }
                />
              </div>
            );
          })
        )}
      </Card>

      {/* UPSELL SUGGESTIONS (when category is active and items are in basket) */}
      {activeCategory && upsellProducts.length > 0 && hasItems && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-bold">
              You might also need ({upsellProducts.length} more {activeCategory.toLowerCase()} items)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {upsellProducts.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  setSelection({ ...selection, [p.id]: (selection[p.id] || 0) + 1 })
                }
                className="group flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-left transition-all hover:border-brand hover:shadow-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-lg">
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold group-hover:text-brand">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {KES(p.bestPrice)}
                  </div>
                </div>
                <Plus
                  size={14}
                  className="shrink-0 text-muted-foreground group-hover:text-brand"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already-in-basket quick view (when on category page, show what's selected) */}
      {activeCategory && hasItems && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold">In your basket ({totalQty} items)</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(selection)
              .filter(([, q]) => q > 0)
              .map(([pid, qty]) => {
                const p = products.find((pr) => pr.id === pid);
                if (!p) return null;
                return (
                  <Badge
                    key={pid}
                    variant="secondary"
                    className="gap-1 bg-brand-light/60 px-2 py-1 text-xs"
                  >
                    <span>{p.emoji}</span>
                    {p.name} x{qty}
                    <button
                      onClick={() => {
                        const next = { ...selection };
                        if (qty <= 1) delete next[pid];
                        else next[pid] = qty - 1;
                        setSelection(next);
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-brand/20"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                );
              })}
          </div>
        </div>
      )}

      {/* Summary + Compare CTA */}
      <div className="sticky bottom-16 z-30 md:bottom-4">
        <Card className="border-brand/30 bg-card/95 p-4 shadow-lg backdrop-blur">
          {/* Budget guardrail */}
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Wallet size={13} /> Budget
            </span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                KES
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Set a max spend (optional)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background pl-9 pr-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {budgetNum > 0 && estimatedMin > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className={overBudget ? "font-semibold text-destructive" : "text-muted-foreground"}>
                  Est. min {KES(estimatedMin)}
                </span>
                <span className="text-muted-foreground">
                  Budget {KES(budgetNum)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    "h-full rounded-full transition-all " +
                    (overBudget
                      ? "bg-destructive"
                      : "bg-gradient-to-r from-brand to-brand-dark")
                  }
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              {overBudget ? (
                <div className="mt-1 text-[11px] font-medium text-destructive">
                  Over budget by {KES(estimatedMin - budgetNum)} — compare to
                  find savings, or trim your list.
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  On track — {KES(budgetNum - estimatedMin)} of headroom.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(selection).length} product
                {Object.keys(selection).length !== 1 ? "s" : ""} · {totalQty}{" "}
                item{totalQty !== 1 ? "s" : ""}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {activeCategory
                  ? `Comparing across ${vendors.filter((v) => v.type === activeCategory).length || vendors.length} ${activeCategory.toLowerCase()} vendor${vendors.filter((v) => v.type === activeCategory).length !== 1 ? "s" : ""}+ more`
                  : `We'll compare ${Object.keys(selection).length || 0} product${Object.keys(selection).length !== 1 ? "s" : ""} across ${vendors.length} vendors`}
              </div>
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand-dark"
              disabled={!hasItems || loading}
              onClick={handleCompare}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              Compare ({totalQty})
            </Button>
          </div>
          {error && (
            <div className="mt-2 text-xs text-destructive">{error}</div>
          )}
        </Card>
      </div>

      <CompareDialog
        open={open}
        onOpenChange={setOpen}
        result={result}
        onChoose={handleChoose}
        budget={budgetNum}
      />
    </div>
  );
}

function Stepper({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  if (qty === 0) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="h-9 px-3"
        onClick={onInc}
      >
        <Plus size={14} /> Add
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
      <button
        onClick={onDec}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums">
        {qty}
      </span>
      <button
        onClick={onInc}
        className="grid h-8 w-8 place-items-center rounded-full text-brand transition-colors hover:bg-brand-light"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ---- REVAMPED COMPARE DIALOG WITH VENDOR TOGGLE ----

function CompareDialog({
  open,
  onOpenChange,
  result,
  onChoose,
  budget = 0,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  result: CompareResult | null;
  onChoose: (
    vendorId: string,
    items: CompareResult["bestSingle"]["lineItems"]
  ) => void;
  budget?: number;
}) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  if (!result) return null;

  const { perItem, perVendor, bestSingle, bestSplit, totalQty } = result;
  const savings = bestSingle
    ? bestSplit.total < bestSingle.total
      ? bestSingle.total - bestSplit.total
      : 0
    : 0;
  const vendorsInBudget = budget > 0 ? perVendor.filter((v) => v.total <= budget).length : 0;

  // The vendor the user is currently inspecting (toggled)
  const activeVendor =
    selectedVendorId && selectedVendorId !== bestSingle?.vendorId
      ? perVendor.find((v) => v.vendorId === selectedVendorId) ?? null
      : bestSingle;

  const handleToggleVendor = (vid: string) => {
    setSelectedVendorId((prev) => (prev === vid ? null : vid));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-gold" size={20} />
            Your price comparison
          </DialogTitle>
          <DialogDescription className="text-xs">
            Compared {perItem.length} products ({totalQty} items) across{" "}
            {perVendor.length} vendors.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-5 p-5">
            {/* BEST OPTION HIGHLIGHT (with vendor toggle) */}
            {activeVendor && (
              <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                    <Trophy size={12} /> Best single-vendor basket
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Rating with star icon for visibility */}
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Star size={12} className="fill-gold text-gold" />
                      <span className="font-bold">{activeVendor.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-lg font-extrabold">
                      <span className="text-2xl">{activeVendor.vendorEmoji}</span>
                      <span className="truncate">{activeVendor.vendorName}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {activeVendor.etaMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {activeVendor.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Truck size={11} /> {KES(activeVendor.deliveryFee)}{" "}
                        delivery
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck size={11} /> {activeVendor.vendorType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase text-white/70">
                      Total
                    </div>
                    <div className="text-2xl font-extrabold">
                      {KES(activeVendor.total)}
                    </div>
                  </div>
                </div>

                {/* Speed & Reliability indicators */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeVendor.etaMinutes <= 20 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                      <Zap size={10} className="text-yellow-300" /> Fastest
                    </span>
                  )}
                  {activeVendor.rating >= 4.7 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                      <Star size={10} className="text-yellow-300" /> Top rated
                    </span>
                  )}
                  {!activeVendor.canFulfilAll && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                      Partial stock
                    </span>
                  )}
                </div>

                {savings > 0 && activeVendor === bestSingle && (
                  <div className="mt-3 rounded-lg bg-gold/20 px-3 py-2 text-xs">
                    <span className="font-semibold text-gold">
                      Save {KES(savings)}
                    </span>{" "}
                    by splitting across {bestSplit.vendorCount} vendors — see
                    &ldquo;Split basket&rdquo; below.
                  </div>
                )}

                {/* Item breakdown for the selected vendor */}
                <div className="mt-3 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase text-white/60">
                    Items from {activeVendor.vendorName}
                  </div>
                  {activeVendor.lineItems.map((li) => (
                    <div
                      key={li.productId}
                      className="flex items-center justify-between text-xs text-white/90"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{li.emoji}</span>
                        {li.name} x{li.qty}
                      </span>
                      <span className="font-medium">
                        {KES(li.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-4 w-full bg-white text-brand hover:bg-white/90"
                  onClick={() =>
                    onChoose(activeVendor.vendorId, activeVendor.lineItems)
                  }
                >
                  Order from {activeVendor.vendorEmoji} {activeVendor.vendorName}{" "}
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {/* SPLIT OPTION (if cheaper) */}
            {bestSingle && savings > 0 && (
              <Card className="border-gold/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-dark">
                    <TrendingDown size={14} /> Split basket (cheapest)
                  </span>
                  <span className="text-lg font-extrabold text-gold-dark">
                    {KES(bestSplit.total)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buy each item from its cheapest vendor — {bestSplit.vendorCount}{" "}
                  deliveries, but you save {KES(savings)} overall.
                </p>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Split checkout isn&apos;t live yet — pick the best single
                  vendor above for a one-delivery order.
                </div>
              </Card>
            )}

            {/* PER-ITEM BEST */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold">
                Cheapest vendor per item
              </h4>
              <div className="space-y-1.5">
                {perItem.map((it) => (
                  <div
                    key={it.productId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    <span className="text-xl">{it.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-tight">
                        {it.name}{" "}
                        <span className="text-muted-foreground">
                          x {it.qty}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        Best: {it.cheapest?.vendorEmoji}{" "}
                        {it.cheapest?.vendorName} · {KES(it.cheapest!.price)}{" "}
                        each
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand">
                        {KES(it.cheapestLineTotal)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {KES(it.cheapest!.price)}/ea
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALL VENDORS — TOGGLE TO SELECT & INSPECT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">All vendors ranked</h4>
                {budget > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {vendorsInBudget} of {perVendor.length} fit your {KES(budget)} budget
                  </span>
                )}
              </div>

              {/* Sort hints */}
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5">
                  <Trophy size={9} className="text-brand" /> Cheapest first
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={9} /> Then fastest
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star size={9} className="text-gold" /> Then top rated
                </span>
              </div>

              <div className="space-y-2">
                {perVendor.map((v, i) => {
                  const fitsBudget = budget <= 0 || v.total <= budget;
                  const isBest = i === 0 && bestSingle && v.vendorId === bestSingle.vendorId;
                  const isSelected = selectedVendorId === v.vendorId;
                  return (
                  <Card
                    key={v.vendorId}
                    className={cn(
                      "cursor-pointer p-3 transition-all",
                      isBest && "border-brand ring-1 ring-brand/30",
                      isSelected && !isBest && "border-gold ring-1 ring-gold/30",
                      budget > 0 && !fitsBudget && "opacity-60",
                      isSelected && "shadow-md"
                    )}
                    onClick={() => handleToggleVendor(v.vendorId)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {/* Rank badge */}
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                            i === 0
                              ? "bg-brand text-white"
                              : i === 1
                                ? "bg-brand-light text-brand"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="text-lg">{v.vendorEmoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">
                              {v.vendorName}
                            </span>
                            {!v.canFulfilAll && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-[10px] text-amber-700"
                              >
                                Partial
                              </Badge>
                            )}
                            {budget > 0 && fitsBudget && (
                              <Badge className="bg-brand-light text-[10px] text-brand">
                                In budget
                              </Badge>
                            )}
                            {budget > 0 && !fitsBudget && (
                              <Badge variant="outline" className="bg-red-50 text-[10px] text-destructive">
                                Over
                              </Badge>
                            )}
                            {isSelected && (
                              <Badge className="bg-gold/20 text-[10px] text-gold-dark">
                                Viewing
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            {/* Rating always visible */}
                            <span className="inline-flex items-center gap-0.5 font-medium">
                              <Star size={10} className="fill-gold text-gold" />
                              {v.rating.toFixed(1)}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Clock size={10} /> {v.etaMinutes} min
                            </span>
                            <span>·</span>
                            <span>{v.vendorType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold">
                          {KES(v.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          + {KES(v.deliveryFee)} delivery
                        </div>
                      </div>
                    </div>

                    {/* Expand item breakdown when this vendor is selected */}
                    {isSelected && (
                      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Item breakdown
                        </div>
                        {v.lineItems.map((li) => (
                          <div
                            key={li.productId}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{li.emoji}</span>
                              {li.name} x{li.qty}
                            </span>
                            <span className="font-medium">
                              {KES(li.lineTotal)}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between border-t border-border pt-1.5 text-xs font-semibold">
                          <span>Subtotal</span>
                          <span>{KES(v.subtotal)}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-muted/60 p-3 text-center text-[11px] text-muted-foreground">
              <CheckCircle2
                size={12}
                className="mr-1 inline text-brand"
              />
              Prices are live from verified vendors in your area.
              <br />
              <span className="inline-flex items-center gap-0.5">
                <Star size={10} className="text-gold" /> Ratings reflect customer satisfaction.
                Click any vendor to view their item breakdown and decide.
              </span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}