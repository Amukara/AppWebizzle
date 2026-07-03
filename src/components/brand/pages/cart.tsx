"use client";

import {
  ShoppingCart,
  Truck,
  ChevronRight,
  Trash2,
  Clock,
  MapPin,
  ShoppingBasket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KES } from "../logo";
import { RatingStars } from "../ui";
import type { Cart, PageId } from "@/lib/types";

export function CartPage({
  cart,
  onNavigate,
  onClear,
}: {
  cart: Cart | null;
  onNavigate: (p: PageId) => void;
  onClear: () => void;
}) {
  if (!cart) {
    return (
      <EmptyState
        emoji="🛒"
        title="Your cart is empty"
        desc="Build a Smart Basket and we&apos;ll find the cheapest vendor for you."
        cta="Build a Smart Basket"
        onCta={() => onNavigate("basket")}
      />
    );
  }

  const subtotal = cart.items.reduce(
    (s, it) => s + it.unitPrice * it.qty,
    0
  );
  const total = subtotal + cart.deliveryFee;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-brand" size={24} />
          <h1 className="text-2xl font-extrabold">Your Cart</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ordering from{" "}
          <strong>
            {cart.vendor.emoji} {cart.vendor.name}
          </strong>
          .
        </p>
      </div>

      {/* Vendor banner */}
      <Card className="flex items-center gap-3 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-light text-2xl">
          {cart.vendor.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{cart.vendor.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RatingStars rating={cart.vendor.rating} />
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {cart.vendor.etaMinutes} min
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin size={10} /> {cart.vendor.location}
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="divide-y divide-border overflow-hidden">
        {cart.items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 sm:p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-light text-xl">
              {it.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight">{it.name}</div>
              <div className="text-xs text-muted-foreground">
                {it.unit} · {KES(it.unitPrice)} each · × {it.qty}
              </div>
            </div>
            <div className="text-right font-bold">
              {KES(it.unitPrice * it.qty)}
            </div>
          </div>
        ))}
      </Card>

      {/* Summary */}
      <Card className="p-4">
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={KES(subtotal)} />
          <Row
            label={
              <span className="inline-flex items-center gap-1">
                <Truck size={14} /> Delivery
              </span>
            }
            value={KES(cart.deliveryFee)}
          />
          <div className="my-2 border-t border-border" />
          <Row
            label={<span className="text-base font-bold">Total</span>}
            value={<span className="text-lg font-extrabold text-brand">{KES(total)}</span>}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="sm:w-auto"
          onClick={onClear}
        >
          <Trash2 size={16} /> Clear cart
        </Button>
        <Button
          className="flex-1 bg-brand text-white hover:bg-brand-dark"
          onClick={() => onNavigate("checkout")}
        >
          Proceed to Checkout <ChevronRight size={18} />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShoppingBasket size={12} />
        Want a different vendor? Re-run the comparison.
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  desc,
  cta,
  onCta,
}: {
  emoji: string;
  title: string;
  desc?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="text-6xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      {desc && (
        <p
          className="max-w-sm text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: desc }}
        />
      )}
      {cta && onCta && (
        <Button
          className="mt-2 bg-brand text-white hover:bg-brand-dark"
          onClick={onCta}
        >
          {cta}
        </Button>
      )}
    </div>
  );
}
