"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  ShoppingBasket,
  ChevronRight,
  Bike,
  Store,
  ShieldCheck,
  Wallet,
  MapPin,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KES } from "../logo";
import { RatingStars } from "../ui";
import { SavingsWidget } from "./savings";
import { ProductDetail, TrendBadge } from "./product-detail";
import { LocationPrompt } from "../ui/location-prompt";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getCustomerProfile, saveCustomerProfile, type CustomerProfile } from "@/lib/customer";
import type { PageId, Product, Vendor } from "@/lib/types";

const CATEGORIES = [
  { emoji: "🥬", label: "Mama Mboga", desc: "Fresh produce" },
  { emoji: "🏪", label: "Duka", desc: "Household essentials" },
  { emoji: "💊", label: "Pharmacy", desc: "Medicine & care" },
  { emoji: "🔧", label: "Hardware", desc: "Tools & supplies" },
  { emoji: "📱", label: "Electronics", desc: "Gadgets & airtime" },
  { emoji: "🥩", label: "Butchery", desc: "Fresh meat" },
  { emoji: "🍞", label: "Bakery", desc: "Bread & pastries" },
  { emoji: "🌱", label: "Agrovet", desc: "Seeds & feeds" },
  { emoji: "🍽️", label: "Restaurants", desc: "Hot meals & takeout" },
  { emoji: "🍺", label: "Bars & Pubs", desc: "Drinks & nightlife" },
];

export function HomePage({
  onNavigate,
  onNavigateCategory,
  onAddToCompare,
  products,
  vendors,
  search,
  setSearch,
}: {
  onNavigate: (p: PageId) => void;
  onNavigateCategory: (p: PageId, category?: string) => void;
  onAddToCompare: (pid: string) => void;
  products: Product[];
  vendors: Vendor[];
  search: string;
  setSearch: (s: string) => void;
}) {
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Read the remembered customer after mount to avoid hydration mismatch.
  // On the server (and during hydration) this is null; the useEffect
  // populates it from localStorage once the client has painted.
  const [client, setClient] = useState<CustomerProfile | null>(null);
  const knownClient = Boolean(client?.name && client?.phone);

  useEffect(() => {
    setClient(getCustomerProfile());
  }, []);

  // Location services
  const geo = useGeolocation();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const locationPromptReason = useRef<"search" | "checkout">("search");
  const hasPromptedSearch = useRef(false);

  // When location is granted, persist coords to customer profile
  const handleLocationGranted = useCallback(
    (coords: { lat: number; lng: number }) => {
      saveCustomerProfile({ lat: coords.lat, lng: coords.lng });
    },
    []
  );

  // Auto-save coords when status changes to granted
  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      handleLocationGranted(geo.coords);
      setShowLocationPrompt(false);
    }
  }, [geo.status, geo.coords, handleLocationGranted]);

  // Prompt location on first search keystroke
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      // Trigger location prompt on first real keystroke if not already granted/prompted
      if (
        value.length > 0 &&
        !hasPromptedSearch.current &&
        geo.status === "idle"
      ) {
        hasPromptedSearch.current = true;
        locationPromptReason.current = "search";
        setShowLocationPrompt(true);
      }
    },
    [setSearch, geo.status]
  );

  const openDetail = (p: Product) => {
    setDetail(p);
    setDetailOpen(true);
  };

  const popular = products.slice(0, 8);
  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-dark px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-gold/20 blur-2xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <MapPin size={12} /> Webuye · Westlands · Wendani
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Shop your neighbourhood.
            <br />
            <span className="text-gold">Pay once with M-Pesa.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">
            Compare Mama Mboga, Duka, Pharmacy &amp; more around you. Build one
            smart basket — we find the cheapest vendor for every item.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg">
            <Search size={18} className="ml-2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search sugar, milk, paracetamol…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search products"
            />
            <Button
              size="sm"
              className="h-9 rounded-full bg-brand px-5 hover:bg-brand-dark"
              onClick={() => onNavigate("basket")}
            >
              Search
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Wallet size={14} /> M-Pesa on checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bike size={14} /> 15–35 min delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} /> Verified vendors only
            </span>
          </div>
        </div>
      </section>

      {/* SEARCH RESULTS (when typing) */}
      {search && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for
              &ldquo;{search}&rdquo;
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Clear
            </Button>
          </div>
          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No products match your search. Try a different keyword.
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={() => onAddToCompare(p.id)}
                  onOpenDetail={() => openDetail(p)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {!search && (
        <>
          {/* Returning-customer banner */}
          {knownClient && (
            <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand/20 bg-brand-light/40 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <UserCheck size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Welcome back, {client.name.split(" ")[0]}! 👋
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    We&apos;ve remembered your details —{" "}
                    <span className="font-medium">{client.phone}</span>
                    {client.location ? ` · ${client.location}` : ""}. Checkout is one tap away.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-brand text-white hover:bg-brand-dark"
                onClick={() => onNavigate("basket")}
              >
                Reorder my basket
              </Button>
            </section>
          )}

          {/* CATEGORIES */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold">Shop by category</h2>
              <button
                onClick={() => onNavigate("basket")}
                className="text-sm font-medium text-brand hover:underline"
              >
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CATEGORIES.map((c) => {
                const count = products.filter((p) => p.category === c.label).length;
                return (
                <button
                  key={c.label}
                  onClick={() => onNavigateCategory("basket", c.label)}
                  className="group relative flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                >
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    {c.emoji}
                  </span>
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.desc}
                  </span>
                  {count > 0 && (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
                );
              })}
            </div>
          </section>

          {/* SMART BASKET PROMO */}
          <section
            onClick={() => onNavigate("basket")}
            className="group relative flex cursor-pointer items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-gold/15 via-gold/10 to-brand-light p-6 ring-1 ring-gold/30 transition-all hover:ring-gold/50 sm:p-8"
          >
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-gold-dark">
                <ShoppingBasket size={12} /> Smart Basket
              </span>
              <h3 className="mt-2 text-xl font-extrabold sm:text-2xl">
                Build one list. We compare every vendor.
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Add everything you need. WeBizzle checks every vendor and finds
                the cheapest full basket in seconds.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Build my basket
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </div>
            <div className="hidden text-7xl sm:block" aria-hidden>
              🛒
            </div>
          </section>

          {/* SAVINGS WIDGET */}
          {!search && (
            <section>
              <SavingsWidget onNavigate={onNavigate} />
            </section>
          )}

          {/* POPULAR PRODUCTS */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold">Popular products near you</h2>
              <button
                onClick={() => onNavigate("basket")}
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={() => onAddToCompare(p.id)}
                  onOpenDetail={() => openDetail(p)}
                />
              ))}
            </div>
          </section>

          {/* TRUSTED VENDORS */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold">Trusted vendors near you</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.slice(0, 6).map((v) => (
                <Card
                  key={v.id}
                  className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-light text-2xl">
                    {v.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{v.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{v.type}</span>
                      <RatingStars rating={v.rating} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin size={10} /> {v.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-brand">
                      {v.etaMinutes} min
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {KES(v.deliveryFee)} delivery
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* PARTNER CTA */}
          <section className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => onNavigate("vendor-signup")}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-brand hover:shadow-md"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                <Store size={22} />
              </div>
              <div className="flex-1">
                <div className="font-bold">Register your shop</div>
                <div className="text-sm text-muted-foreground">
                  Reach more customers in your neighbourhood.
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-muted-foreground transition-transform group-hover:translate-x-1"
              />
            </button>
            <button
              onClick={() => onNavigate("rider-signup")}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-brand hover:shadow-md"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                <Bike size={22} />
              </div>
              <div className="flex-1">
                <div className="font-bold">Become a rider</div>
                <div className="text-sm text-muted-foreground">
                  Earn on every delivery with flexible hours.
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-muted-foreground transition-transform group-hover:translate-x-1"
              />
            </button>
          </section>
        </>
      )}

      {/* Location prompt for search */}
      <LocationPrompt
        open={showLocationPrompt}
        status={geo.status}
        error={geo.error}
        reason={locationPromptReason.current}
        onEnable={() => {
          geo.requestLocation();
        }}
        onDismiss={() => {
          setShowLocationPrompt(false);
          geo.dismiss();
        }}
      />

      <ProductDetail
        product={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAdd={() => detail && onAddToCompare(detail.id)}
      />
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  onOpenDetail,
}: {
  product: Product;
  onAdd: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <Card className="group flex flex-col p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative mb-2 grid h-20 place-items-center rounded-xl bg-brand-light text-4xl"
        aria-label={`View ${product.name} price history`}
      >
        {product.emoji}
        <span className="absolute left-1.5 top-1.5">
          <TrendBadge
            trend={product.trend}
            changePct={product.changePct}
            isLow={product.isLow}
          />
        </span>
      </button>
      <div className="flex-1">
        <button
          type="button"
          onClick={onOpenDetail}
          className="text-left"
        >
          <div className="font-semibold leading-tight hover:text-brand">
            {product.name}
          </div>
        </button>
        <div className="text-xs text-muted-foreground">{product.unit}</div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-1">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            From
          </div>
          <div className="text-sm font-bold text-brand">
            {KES(product.bestPrice)}
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 px-3 text-xs"
          onClick={onAdd}
        >
          Compare
        </Button>
      </div>
      {product.bestVendor && (
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-1.5 truncate text-left text-[10px] text-muted-foreground hover:text-brand"
        >
          Cheapest at {product.bestVendor.emoji} {product.bestVendor.name}
        </button>
      )}
    </Card>
  );
}
